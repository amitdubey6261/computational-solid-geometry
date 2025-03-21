import { BoxGeometry, BufferGeometry, Color, DoubleSide, Float32BufferAttribute, Mesh, MeshBasicMaterial, MeshStandardMaterial, PlaneGeometry, SphereGeometry, Vector3 } from "three";
import Experience from "./Experience";
import { SUBTRACTION, INTERSECTION, Brush, Evaluator } from "three-bvh-csg";
import { Line2, LineGeometry, LineMaterial } from "three/examples/jsm/Addons.js";

export default class World {
    experience: Experience

    baseBrush: Brush = new Brush();
    evaluator: Evaluator = new Evaluator();
    brush: Brush = new Brush();

    invisiblePlane !: Mesh;

    ctrlActive: boolean = false;
    activateCutting: boolean = false;
    cuttingPoints: Mesh[] = [];
    cuttingLine!: Line2;
    cuttingPlane !: Mesh;


    constructor() {
        this.experience = new Experience();

        this.createBrushes();
        this.createInvisiblePlane();
    }

    createBrushes() {
        //object 1 
        this.baseBrush.geometry = new BoxGeometry(2, 2, 2);
        this.baseBrush.material = new MeshStandardMaterial({
            flatShading: true,
            polygonOffset: true,
            polygonOffsetUnits: 1,
            polygonOffsetFactor: 1,
        })
        this.baseBrush.position.set(-2, 0, 0);

        //object 2
        this.brush.geometry = new BoxGeometry(1, 1, 1);
        this.brush.material = new MeshStandardMaterial({
            color: 0x80cbc4,
            polygonOffset: true,
            polygonOffsetUnits: 1,
            polygonOffsetFactor: 1,

        })
        this.baseBrush.position.set(.6, 0, 0);

        // this.experience.scene.add(this.baseBrush , this.brush) ; 
        this.experience.scene.add(this.baseBrush);
    }

    createInvisiblePlane() {
        //invisible plane for capturing the mouse coordinates in 3d space for create a cutting plane
        this.invisiblePlane = new Mesh(new PlaneGeometry(100, 100), new MeshBasicMaterial({ color: 0xff0000, side: DoubleSide }));
        this.invisiblePlane.visible = false;
        this.experience.scene.add(this.invisiblePlane);
    }

    moveCuttingPlane() {
        this.invisiblePlane.quaternion.copy(this.experience.camera.instance.quaternion);
    }

    pointerdown(event: PointerEvent) {

        console.log(event)

        this.moveCuttingPlane();
        if (this.ctrlActive) {
            this.activateCutting = !this.activateCutting; //enable cutting
        }
        this.captureCuttingStartPoition();
        this.createCuttingLine();

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
                color: 'yellow',
                linewidth: 5,
                alphaToCoverage: false
            }));

            this.experience.scene.add(this.cuttingLine);
        }
    }

    pointermove(event: PointerEvent) {

        console.log(event)

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

    pointerup(event: PointerEvent) {
        console.log(event)

        this.activateCutting = false;
        this.createCuttingPlane();
        this.cuttingPoints.forEach(point => this.experience.scene.remove(point));
        this.cuttingPoints = [];
        this.experience.scene.remove(this.cuttingLine);
        this.experience.camera.controls.enabled = true;
    }

    createCuttingPlane() {
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
            const geometry = new SphereGeometry(0.1, 16, 16); // radius 0.1 units
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
    
        this.cuttingPlane = cuttingPlane;
    }
    

    keydown(event: KeyboardEvent) {

        //check controls key is pressed
        if (event.code == "ControlLeft") {
            this.ctrlActive = true;
        }

        if (event.code == "KeyA") {
            this.activateCutting = !this.activateCutting;
        }

        if( event.code === 'KeyI'){
            console.log('intersect');

            const result = this.evaluator.evaluate(this.baseBrush , this.brush , INTERSECTION);
            result.position.set( 0 , 2 , 0 ); 

            this.experience.scene.add(result); //returns new mesh

        }
        if( event.code === 'KeyS'){
            console.log('subtract'); 

            const result = this.evaluator.evaluate(this.baseBrush , this.brush , SUBTRACTION);
            result.position.set( 0 , -2 , 0 );

            this.experience.scene.add(result); //returns the new mesh 
        }
    }

    keyup(event: KeyboardEvent) {
        console.log(event)
        this.ctrlActive = false;

    }

    update() {
    }


}