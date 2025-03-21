import { PerspectiveCamera } from "three";
import Experience from "./Experience";
import { OrbitControls } from "three/examples/jsm/Addons.js";

export default class Camera{
    experince !: Experience ; 
    instance !: PerspectiveCamera ; 
    controls !: OrbitControls ;

    constructor(){
        this.experince = new Experience();
        this.init(); 
    }

    init(){
        this.instance = new PerspectiveCamera(75, this.experince.sizes.aspectRatio , 0.1, 1000);
        this.instance.position.set(0,0,5);
        this.controls = new OrbitControls(this.instance , this.experince.canvas);
        this.controls.enableDamping = true;
    }

    update(){
        this.controls.update();
    }

    resize(){
        this.instance.aspect = this.experince.sizes.aspectRatio;
		this.instance.updateProjectionMatrix();
    }
}