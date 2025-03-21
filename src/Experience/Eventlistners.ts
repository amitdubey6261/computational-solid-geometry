import Experience from "./Experience";

export default class Eventlisteners{
    experince : Experience ; 
    constructor(){
        this.experince = new Experience();

        window.addEventListener('pointerdown' , this.pointerdown.bind(this));
        window.addEventListener('pointerdown' , this.pointerdown.bind(this));
        window.addEventListener('keydown' , this.keydown.bind(this));
        window.addEventListener('keyup' , this.keyup.bind(this));
    }

    pointerdown(){}
    pointerup(){}
    keydown(event: KeyboardEvent){
        this.experince.world.keydown(event);
    }
    keyup(){}
}