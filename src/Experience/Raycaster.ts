import { Raycaster, Vector2, Vector3 } from "three";
import Experience from "./Experience";

export default class Raycast{
    experince : Experience ;
    raycast : Raycaster = new Raycaster();
    canvas !: HTMLCanvasElement;
    pointer : Vector2 = new Vector2();

    raydirction : Vector3 = new Vector3();
    rayorigin : Vector3 = new Vector3();

    constructor(){
        this.experince = new Experience();
        this.canvas = this.experince.canvas ; 
    }

    shootRayfromCamera(checkIntersectionWith: any){
        this.raycast.setFromCamera(this.pointer , this.experince.camera.instance);

        this.raydirction.copy(this.raycast.ray.direction);
        this.rayorigin.copy(this.raycast.ray.origin);

        let intersects = this.raycast.intersectObject(checkIntersectionWith , true);

        if( intersects && intersects.length > 0){
            return intersects ; 
        }

    }

    pointermove(event: PointerEvent){
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
		this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
}