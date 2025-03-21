import { WebGLRenderer } from "three";
import Camera from "./Camera";
import Experience from "./Experience";

export default class Renderer{
    experience : Experience ; 
    camera !: Camera ; 
    instance !: WebGLRenderer ; 
    constructor(){
        this.experience = new Experience() ; 
        this.camera = this.experience.camera ;
        this.instance = new WebGLRenderer({
            canvas : this.experience.canvas ,
            antialias : true, 
            failIfMajorPerformanceCaveat : true, 
        }); 
        this.resize();
    }

    update(){
        this.instance.render(this.experience.scene , this.camera.instance);
    }

    resize() {
		this.instance.setSize(this.experience.sizes.width, this.experience.sizes.height);
        this.instance.setPixelRatio(this.experience.sizes.pixelRatio);
	}
}