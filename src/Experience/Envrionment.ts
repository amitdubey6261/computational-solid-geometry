import { AmbientLight } from "three";
import Experience from "./Experience";

export default class Environment{
    experience !: Experience ;

    constructor(){
        this.experience = new Experience() ;
        this.createLights();
    }

    createLights(){
        const ambientLight = new AmbientLight(0xffffff, 2 );
        this.experience.scene.add(ambientLight);
    }
}