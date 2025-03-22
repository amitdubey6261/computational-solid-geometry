import { BoxGeometry, BoxHelper, BufferAttribute, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Line, LineBasicMaterial, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, Quaternion, SphereGeometry, Vector2, Vector3 } from "three";
import Experience from "./Experience";
import { SUBTRACTION, INTERSECTION, Brush, Evaluator } from "three-bvh-csg";
import { GLTF, Line2, LineGeometry, LineMaterial } from "three/examples/jsm/Addons.js";
import { TransformControls } from "three/examples/jsm/Addons.js";

export default class World {
    experience: Experience ;
    
    transformControls !: TransformControls ; 
    transformGizmo !: any ; 

    baseBrush: Brush = new Brush();
    evaluator: Evaluator = new Evaluator();
    cutter : Brush = new Brush();

    invisiblePlane !: Mesh;

    ctrlActive: boolean = false;
    activateCutting: boolean = false;
    cuttingPoints: Mesh[] = [];
    cuttingLine!: Line2;
    cuttingPlane !: Mesh;


    constructor() {
        this.experience = new Experience();

        this.setupTransformControls(); 
        this.setupEvaluator();
        this.createBaseBrush();
        this.createInvisiblePlane();
    }

    setupTransformControls(){
        this.transformControls = new TransformControls(this.experience.camera.instance , this.experience.canvas ); 
        this.transformControls.addEventListener('dragging-changed' , (event)=>{
            this.experience.camera.controls.enabled  = !event.value ; 
        })

        this.transformGizmo = this.transformControls.getHelper() ; 
        this.experience.scene.add(this.transformGizmo); 
    }

    setupEvaluator() {
        /* 
            This Method is for setting BVH CSG presets
        */
        this.evaluator.attributes = ['position', 'normal'];
    }

    createBaseBrush() {
        /* 
            This Method is for creating default Mesh which is going to be cut
        */
        const geometry = new BoxGeometry(1, 1, 1);
        geometry.computeVertexNormals();

        this.baseBrush.geometry = geometry;
        this.baseBrush.geometry.computeVertexNormals();

        this.baseBrush.material = new MeshStandardMaterial({
            flatShading: true,
            polygonOffset: true,
            polygonOffsetUnits: 1,
            polygonOffsetFactor: 1,
        })
        this.setGeometryProps(this.baseBrush);
        this.baseBrush.position.set(0, 0, 0);
        this.experience.scene.add(this.baseBrush);

        this.transformControls.attach(this.baseBrush);
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
        this.cutter.visible = false ; 
    }

    setGeometryProps(brush: Brush) { 
        /* 
            This Method is for BVH geometry
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


    pointerdown(event: PointerEvent) {
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
            this.captureCuttingStartPoition();
            this.createCuttingLine();
        }
    }

    captureCuttingStartPoition() {
        if (this.activateCutting) {
            this.experience.camera.controls.enabled = false;
            const pointer = this.experience.raycaster.shootRayfromCamera(this.invisiblePlane);

            this.cuttingPoints[0] = new Mesh(new SphereGeometry(.2), new MeshBasicMaterial({ color: 0xff0000 }));
            this.cuttingPoints[1] = new Mesh(new SphereGeometry(.2), new MeshBasicMaterial({ color: 0xff0000 }));

            if (pointer) {
                this.cuttingPoints[0].position.copy(pointer[0].point);
                this.cuttingPoints[1].position.copy(pointer[0].point);
            }

            this.experience.scene.add(this.cuttingPoints[0], this.cuttingPoints[1]);
        }
    }

    createCuttingLine() {
        if (this.activateCutting) {
            const geometry = new LineGeometry();
            geometry.setFromPoints([this.cuttingPoints[0].position, this.cuttingPoints[1].position]);
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
                this.cuttingPoints[1].position.copy(pointer[0].point);
                this.cuttingLine.geometry.attributes.instanceEnd.setXYZ(0, this.cuttingPoints[1].position.x, this.cuttingPoints[1].position.y, this.cuttingPoints[1].position.z);
                this.cuttingLine.geometry.attributes.instanceEnd.needsUpdate = true;
                this.cuttingLine.material.resolution.set(this.experience.sizes.width, this.experience.sizes.height);
            }
        }
    }

    pointerup() {

        if (this.activateCutting) {

            this.createCuttingBrush(this.createCuttingCube());

            this.cuttingPoints.forEach(point => this.experience.scene.remove(point));
            this.cuttingPoints = [];
            this.experience.scene.remove(this.cuttingLine);
            this.experience.camera.controls.enabled = true;
            this.activateCutting = false;
        }

    }

    createCuttingCube() {

        const points = this.cuttingPoints;

        const direction = new Vector3();
        this.experience.camera.instance.getWorldDirection(direction);

        const forwardDir = direction.clone().multiplyScalar(5);
        const backwardDir = direction.clone().multiplyScalar(-5);

        const point1 = points[0].position.clone().add(forwardDir);
        const point2 = points[0].position.clone().add(backwardDir);
        const point3 = points[1].position.clone().add(forwardDir);
        const point4 = points[1].position.clone().add(backwardDir);

        const createRedSphere = (position: Vector3) => {
            const geometry = new SphereGeometry(0.1, 16, 16);
            const material = new MeshBasicMaterial({ color: new Color('red') });
            const sphere = new Mesh(geometry, material);
            sphere.position.copy(position);
            this.experience.scene.add(sphere);
        };

        createRedSphere(point1);
        createRedSphere(point2);
        createRedSphere(point3);
        createRedSphere(point4);

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

        const cuttingPlane = new Mesh(geometry, material);
        this.experience.scene.add(cuttingPlane);





        // Create a cube whose one face is coplanar with the cutting plane
        const boxWidth = point1.distanceTo(point3);
        const boxHeight = point1.distanceTo(point2);
        const boxDepth = 5; // Depth of the box (thickness)

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


        // this.experience.scene.add(box);

        return box;
    }

    keydown(event: KeyboardEvent) {

        this.baseBrush.updateMatrixWorld(true);
        this.cutter.updateMatrixWorld(true);

        //check controls key is pressed
        if (event.code == "ControlLeft") {
            this.ctrlActive = true;
        }

        if (event.code === 'KeyI') {
            console.log('intersect');

            this.evaluator.useGroups = true

            const result = this.evaluator.evaluate(this.baseBrush, this.cutter, INTERSECTION);

            result.position.set(0, 2, 0);

            this.experience.scene.add(result); //returns new mesh

        }

        if (event.code === 'KeyS') {
            console.log('subtract');

            const result = this.evaluator.evaluate(this.baseBrush, this.cutter, SUBTRACTION);
            result.position.set(0, -2, 0);

            this.experience.scene.add(result); //returns the new mesh 

            // this.transformControls.attach(result);
        }
    }

    keyup(event: KeyboardEvent) {
        console.log(event)
        this.ctrlActive = false;

    }

    update() {
    }

}