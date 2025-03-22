import { GLTFLoader, GLTF, DRACOLoader } from "three/examples/jsm/Addons.js";
import Experience from "./Experience";
import { MeshoptDecoder } from "three/examples/jsm/libs/meshopt_decoder.module.js";

export default class Resources{
    experience: Experience ; 
    gltfloader!: GLTFLoader ; 
    gltfModel !: any ; 

    constructor(){
        this.experience = new Experience(); 

        this.createLoader() ; 

        // this.loadModel('https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/stanford-bunny/bunny.glb').then((model)=>{
        //     this.experience.scene.add(model.scene); 
        //     model.scene.scale.multiplyScalar(2);
        //     this.gltfModel = model.scene ; 
        // }) 
    }

    createLoader(){
        this.gltfloader = new GLTFLoader() ; 
        const dracoLoader = new DRACOLoader(); 
        dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
        this.gltfloader.setDRACOLoader(dracoLoader);
        this.gltfloader.setMeshoptDecoder(MeshoptDecoder);
    }

    // loadModel(path : string = 'https://raw.githubusercontent.com/gkjohnson/3d-demo-data/main/models/stanford-bunny/bunny.glb'): Promise<GLTF> {
    loadModel(path : string = './sphere.glb'): Promise<GLTF> {
        return new Promise((res , rej)=>{
            this.gltfloader.load(path , (model: GLTF)=>{
                res(model); 
            })
        })
            
    }


}