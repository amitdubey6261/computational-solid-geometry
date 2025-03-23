import { BoxGeometry, BufferAttribute, BufferGeometry, Color, ConeGeometry, CylinderGeometry, DoubleSide, Float32BufferAttribute, IcosahedronGeometry, Mesh, MeshBasicMaterial, MeshStandardMaterial, Object3D, PlaneGeometry, PolyhedronGeometry, Quaternion, SphereGeometry, TorusGeometry, TubeGeometry, Vector3 } from "three";
import Experience from "./Experience";
import { SUBTRACTION, INTERSECTION, Brush, Evaluator } from "three-bvh-csg";
import { DragControls, GLTF, Line2, LineGeometry, LineMaterial } from "three/examples/jsm/Addons.js";

export default class World {
    experience: Experience;

    baseBrush: Brush = new Brush();
    evaluator: Evaluator = new Evaluator();
    cutter: Brush = new Brush();

    invisiblePlane !: Mesh;

    ctrlActive: boolean = false;
    activateCutting: boolean = false;
    cuttingLinePoints: Mesh[] = [];
    cuttingLine!: Line2;
    cuttingPlaneActive: boolean = false;
    cuttingPlane !: Mesh;
    cuttingPlanePoints: Mesh[] = [];

    selectableObjects: Brush[] = [];

    activeGeometryIndex:number = 0 ; 

    geometries = [
        new BoxGeometry(),
        new SphereGeometry(),
        new IcosahedronGeometry(),
        new TorusGeometry(),
        new CylinderGeometry(),
        new TubeGeometry(),
        new ConeGeometry(),
        new TorusGeometry(),
    ]

    constructor() {
        this.experience = new Experience();

        this.setupTransformControls();
        this.setupEvaluator();
        this.createBaseBrush();
        this.createInvisiblePlane();
    }

    setupTransformControls() {
        const dragcontrols = new DragControls(this.selectableObjects, this.experience.camera.instance, this.experience.canvas);
        dragcontrols.addEventListener('dragstart', () => {
            this.experience.camera.controls.enabled = false;
        })
        dragcontrols.addEventListener('dragend', () => {
            this.experience.camera.controls.enabled = true;
        })
    }

    setupEvaluator() {
        /* 
            This Method is for setting BVH CSG presets
        */
        this.evaluator.attributes = ['position', 'normal'];
    }

    createBaseBrush(model: GLTF | BufferGeometry = this.geometries[0] ) {
        /* 
            This Method is for creating default Mesh which is going to be cut
        */

        this.disposeBaseBrush() ; 

        let geometry ; 

        if( model instanceof BufferGeometry ){
            geometry = model ; 
        }
        else if('scene' in model && model.scene instanceof Object3D ){
            // geometry = model.scene.children[0].geometry.clone(); 
            model.scene.traverse((element)=>{
                if( element instanceof Mesh ){
                    geometry = element.geometry.clone() ; 
                    return ; 
                }
            })

            console.log(geometry)
        }
        else{
            return ; 
        }

        if( !geometry ) return ; 

        //normalizing geometry max 0 - 1 
        geometry.center();
        geometry.computeBoundingBox();
        const size = new Vector3();
        geometry.boundingBox!.getSize(size);
    
        const maxAxis = Math.max(size.x, size.y, size.z);
        geometry.scale(1 / maxAxis, 1 / maxAxis, 1 / maxAxis);
        geometry.scale( 2,2,2);
    
        geometry.computeVertexNormals();
        geometry.computeBoundingSphere();


        this.baseBrush.geometry = geometry;

        this.baseBrush.material = new MeshStandardMaterial({
            color: 0x4488ff, 
            metalness: 0.6,  
            roughness: 0.25, 
            emissive: 0x112244, 
            emissiveIntensity: 0.1,
            polygonOffset: true,
            polygonOffsetUnits: 1,
            polygonOffsetFactor: 1,
            transparent: true,
            opacity: 0.95, 
        });

        this.setGeometryProps(this.baseBrush);
        this.baseBrush.position.set(0, 0, 0);
        this.experience.scene.add(this.baseBrush);
        this.selectableObjects.push(this.baseBrush);
        this.experience.raycaster.selectedObject = this.baseBrush;
    }

    createCuttingBrush(mesh: Mesh) {
        /* 
            This Method is for cutter used to cut our base mesh
        */
        this.cutter.geometry = mesh.geometry;
        this.cutter.position.copy(mesh.position);
        this.cutter.quaternion.copy(mesh.quaternion);

        this.cutter.geometry.computeVertexNormals();

        this.cutter.material = new MeshStandardMaterial({
            color: 'red',
            transparent: true,
            opacity: .5,
            flatShading: true,
            polygonOffset: true,
            polygonOffsetUnits: 1,
            polygonOffsetFactor: 1,
        })

        this.setGeometryProps(this.cutter);
        this.experience.scene.add(this.cutter);
        this.cutter.visible = false;
    }

    setGeometryProps(brush: Brush) {
        /* 
            This Method is for BVH geometry (preset) 
        */

        brush.geometry = brush.geometry.toNonIndexed();

        const position = brush.geometry.attributes.position;
        const array = new Float32Array(position.count * 3);
        for (let i = 0, l = array.length; i < l; i += 9) {

            array[i + 0] = 1;
            array[i + 1] = 0;
            array[i + 2] = 0;

            array[i + 3] = 0;
            array[i + 4] = 1;
            array[i + 5] = 0;

            array[i + 6] = 0;
            array[i + 7] = 0;
            array[i + 8] = 1;
        }

        brush.geometry.setAttribute('color', new BufferAttribute(array, 3));
        brush.prepareGeometry();
        brush.updateMatrixWorld(true);
    }

    createInvisiblePlane() {
        /* 
            This Method is for plane used to capture 3d coordinates
        */
        this.invisiblePlane = new Mesh(new PlaneGeometry(100, 100), new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide }));
        this.invisiblePlane.visible = false;
        this.experience.scene.add(this.invisiblePlane);
    }


    pointerdown() {
        /* 
            This Method is for mouse operation on mesh
        */
        if (this.ctrlActive) {
            this.activateCutting = !this.activateCutting; //enable cutting
        }

        if (this.activateCutting) {
            /*
                Start capturing mouse position & create plane cutter
             */
            this.invisiblePlane.quaternion.copy(this.experience.camera.instance.quaternion);
            this.startCuttingLine();
        }
    }

    startCuttingLine() {

        if (this.cuttingPlaneActive) return;

        if (this.activateCutting) {
            this.experience.camera.controls.enabled = false;
            const pointer = this.experience.raycaster.shootRayfromCamera(this.invisiblePlane);

            this.cuttingLinePoints[0] = new Mesh(new SphereGeometry(.2), new MeshBasicMaterial({ color: 0xff0000 }));
            this.cuttingLinePoints[1] = new Mesh(new SphereGeometry(.2), new MeshBasicMaterial({ color: 0xff0000 }));

            if (pointer) {
                this.cuttingLinePoints[0].position.copy(pointer[0].point);
                this.cuttingLinePoints[1].position.copy(pointer[0].point);
            }

            this.experience.scene.add(this.cuttingLinePoints[0], this.cuttingLinePoints[1]);
            this.createCuttingLine();
        }
    }

    createCuttingLine() {
        if (this.activateCutting) {
            const geometry = new LineGeometry();
            geometry.setFromPoints([this.cuttingLinePoints[0].position, this.cuttingLinePoints[1].position]);
            this.cuttingLine = new Line2(geometry, new LineMaterial({
                color: 'crimson',
                linewidth: 5,
                alphaToCoverage: false
            }));

            this.experience.scene.add(this.cuttingLine);
        }
    }

    pointermove() {
        /*
            On Pointer move update cutting line
        */
        if (this.activateCutting) {
            const pointer = this.experience.raycaster.shootRayfromCamera(this.invisiblePlane);
            if (pointer) {
                this.cuttingLinePoints[1].position.copy(pointer[0].point);
                this.cuttingLine.geometry.attributes.instanceEnd.setXYZ(0, this.cuttingLinePoints[1].position.x, this.cuttingLinePoints[1].position.y, this.cuttingLinePoints[1].position.z);
                this.cuttingLine.geometry.attributes.instanceEnd.needsUpdate = true;
                this.cuttingLine.material.resolution.set(this.experience.sizes.width, this.experience.sizes.height);
            }
        }
    }

    pointerup() {

        if (this.activateCutting) {
            /*
                Generate Cutting Plane
            */

            this.createCuttingBrush(this.createCuttingCube());

            this.cuttingLinePoints.forEach(point => this.experience.scene.remove(point));
            this.cuttingLinePoints = [];
            this.experience.scene.remove(this.cuttingLine);
            this.experience.camera.controls.enabled = true;
            this.activateCutting = false;
        }

    }

    createCuttingCube() {

        const points = this.cuttingLinePoints;

        const direction = new Vector3();
        this.experience.camera.instance.getWorldDirection(direction);

        const forwardDir = direction.clone().multiplyScalar(5);
        const backwardDir = direction.clone().multiplyScalar(-5);

        const point1 = points[0].position.clone().add(forwardDir);
        const point2 = points[0].position.clone().add(backwardDir);
        const point3 = points[1].position.clone().add(forwardDir);
        const point4 = points[1].position.clone().add(backwardDir);

        const createRedSphere = (position: Vector3, idx: number) => {
            const geometry = new SphereGeometry(0.1, 16, 16);
            const material = new MeshBasicMaterial({ color: new Color('red') });
            this.cuttingPlanePoints[idx] = new Mesh(geometry, material);
            this.cuttingPlanePoints[idx].position.copy(position);
            this.experience.scene.add(this.cuttingPlanePoints[idx]);
        };

        [point1, point2, point3, point4].forEach((point, idx) => {
            createRedSphere(point, idx);
        })

        const geometry = new BufferGeometry();
        const vertices = new Float32Array([
            point1.x, point1.y, point1.z,
            point2.x, point2.y, point2.z,
            point3.x, point3.y, point3.z,

            point2.x, point2.y, point2.z,
            point4.x, point4.y, point4.z,
            point3.x, point3.y, point3.z
        ]);

        geometry.setAttribute('position', new Float32BufferAttribute(vertices, 3));
        geometry.computeVertexNormals();

        const material = new MeshBasicMaterial({
            color: new Color('pink'),
            side: DoubleSide,
            transparent: true,
            opacity: 0.5
        });

        /*
            Creating Plane From Line Captured
        */
        this.cuttingPlane = new Mesh(geometry, material);
        this.experience.scene.add(this.cuttingPlane);
        this.cuttingPlaneActive = true;


        // Create a cube whose one face is coplanar with the cutting plane
        const boxWidth = point1.distanceTo(point3);
        const boxHeight = point1.distanceTo(point2);
        const boxDepth = 10; // Depth of the box (thickness)

        const boxGeometry = new BoxGeometry(boxWidth, boxHeight, boxDepth);
        const boxMaterial = new MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
        const box = new Mesh(boxGeometry, boxMaterial);

        // Align the box so its face is coplanar with the cutting plane
        const edge1 = new Vector3().subVectors(point3, point1).normalize();
        const edge2 = new Vector3().subVectors(point2, point1).normalize();
        const normal = new Vector3().crossVectors(edge1, edge2).normalize(); //calculating normal using cross product

        const defaultNormal = new Vector3(0, 0, 1);
        const quaternion = new Quaternion().setFromUnitVectors(defaultNormal, normal); //rotating box using 
        box.setRotationFromQuaternion(quaternion);

        // Position box so that its front face aligns with the cutting plane
        const center = new Vector3()
            .add(point1).add(point2).add(point3).add(point4)
            .multiplyScalar(0.25);

        const faceOffset = normal.clone().multiplyScalar(-0.5 * boxDepth);
        box.position.copy(center).add(faceOffset);

        //retuns new Cutting geometry
        return box;
    }

    keydown(event: KeyboardEvent) {

        if (event.code == "ControlLeft") {
            this.ctrlActive = true;
        }

        /*
            Cut Operation Listner
        */
        if (event.code === 'KeyC') { 

            this.baseBrush = this.experience.raycaster.getSelectedObject();

            if (!this.baseBrush || !this.cuttingPlane || !this.cutter) return;

            this.baseBrush.updateMatrixWorld(true);
            this.cutter.updateMatrixWorld(true);

            this.evaluator.useGroups = true

            const result1 = this.evaluator.evaluate(this.baseBrush, this.cutter, INTERSECTION);
            const result2 = this.evaluator.evaluate(this.baseBrush, this.cutter, SUBTRACTION);

            if (Array.isArray(result1.material)) {
                result1.material.forEach((material) => {
                    if ('color' in material) {
                        material.color = new Color(0xffffff);
                    }
                });
            } else {
                if ('color' in result1.material) {
                    result1.material.color = new Color(0xffffff);
                }
            }

            this.selectableObjects.push(result1);
            this.selectableObjects.push(result2);

            result1.position.set(0, .2, 0);
            result2.position.set(0, -.2, 0);

            this.experience.scene.add(result1);
            this.experience.scene.add(result2);

            this.disposeCuttingPlane();
            this.disposeCuttingCutter();
            this.disposeMeshCuttedDown();
        }

        /*
            Cancel Cut Operation Listner
        */

        if (event.code == 'KeyX') { //cancel cutting
            this.disposeCuttingPlane();
            this.disposeCuttingCutter();
        }

        /*
            Toggle Geometries
        */
        if( event.code == 'KeyG'){
            this.activeGeometryIndex++ ; 
            this.createBaseBrush(this.geometries[this.activeGeometryIndex]); 
            if( this.activeGeometryIndex >= this.geometries.length ){
                this.activeGeometryIndex = 0 ; 
            }
        }
    }

    disposeCuttingPlane() {
        //clear cutting plane after cut
        this.experience.scene.remove(this.cuttingPlane);
        this.cuttingPlanePoints.forEach((point) => {
            this.experience.scene.remove(point);
        })
        this.cuttingPlanePoints = [];
        this.cuttingPlaneActive = false;
    }

    disposeCuttingCutter() {
        //clear cutter
        this.experience.scene.remove(this.cutter);
    }

    disposeMeshCuttedDown() {
        //clear selected Object
        this.experience.scene.remove(this.baseBrush);
        this.selectableObjects.forEach((model, idx) => {
            if (model.uuid == this.baseBrush.uuid) {
                this.selectableObjects.splice(idx, 1);
            }
        })
    }

    disposeBaseBrush() {
        this.disposeMeshCuttedDown();
    }

    keyup(event: KeyboardEvent) {
        this.ctrlActive = false;

    }

    update() {
    }

}