import { BoxGeometry, Mesh, MeshBasicMaterial, Scene } from "three";
import Camera from "./Camera";
import Renderer from "./Renderer";
import Sizes from "./Sizes";
import Time from "./Time";

export default class Experience {
	static instance: Experience;
	canvas!: HTMLCanvasElement;
	time!: Time ; 
	sizes !: Sizes ; 
	camera !: Camera ;
	renderer !: Renderer ; 

	scene !: Scene ; 

	constructor(canvas?: HTMLCanvasElement) {

		if (Experience.instance) {
			return Experience.instance;
		}

		Experience.instance = this;

		this.scene = new Scene() ; 
		if( canvas) this.canvas = canvas;
		this.time = new Time(); 
		this.sizes = new Sizes(this.canvas); 
		this.camera = new Camera() ; 
		this.renderer = new Renderer() ;

		const box  = new Mesh(new BoxGeometry(1,1,1), new MeshBasicMaterial({color: 0xff0000}));
		this.scene.add(box); 

		this.time.on('tick' , ()=>{
			this.update();
		})

		this.sizes.on('resize' , ()=>{
			this.resize();
		})

	}

	update(){ //game loop
		if( this.camera) this.camera.update();
		if(this.renderer) this.renderer.update();
	}

	resize(){
		if( this.camera) this.camera.resize();
		if( this.renderer) this.renderer.resize();
	}
}