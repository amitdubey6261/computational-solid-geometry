import { Color, PMREMGenerator } from "three";
import Experience from "./Experience";
import { RoomEnvironment } from "three/examples/jsm/Addons.js";


export default class Environment{
    experience !: Experience ;

    constructor(){
        this.experience = new Experience() ;
        this.createLights();
    }

    createLights(){

        this.experience.scene.background = new Color(0x002244)

        const environment = new RoomEnvironment();
        const pmremGenerator = new PMREMGenerator( this.experience.renderer.instance );

        this.experience.scene.environment = pmremGenerator.fromScene( environment ).texture;

    }


}