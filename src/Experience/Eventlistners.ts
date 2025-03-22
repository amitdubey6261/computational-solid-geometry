import Experience from "./Experience";

export default class Eventlisteners{
    experince : Experience ; 
    constructor(){
        this.experince = new Experience();

        window.addEventListener('pointerdown' , this.pointerdown.bind(this));
        window.addEventListener('pointerup' , this.pointerup.bind(this));
        window.addEventListener('keydown' , this.keydown.bind(this));
        window.addEventListener('keyup' , this.keyup.bind(this));
        window.addEventListener('pointermove' , this.pointermove.bind(this));
    }

    pointerdown(event: PointerEvent){
        this.experince.world.pointerdown(event);
    }

    pointerup(){
        this.experince.world.pointerup();
    }

    keydown(event: KeyboardEvent){
        this.experince.world.keydown(event);
    }

    pointermove(event: PointerEvent){
        this.experince.raycaster?.pointermove(event);
        this.experince.world.pointermove();
    }

    keyup(event: KeyboardEvent){
        this.experince.world.keyup(event); 
    }
}