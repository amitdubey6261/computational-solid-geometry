import { Color, Mesh, Raycaster, Vector2, Vector3 } from "three";
import Experience from "./Experience";

export default class Raycast{
    experince : Experience ;
    raycast : Raycaster = new Raycaster();
    canvas !: HTMLCanvasElement;
    pointer : Vector2 = new Vector2();

    raydirction : Vector3 = new Vector3();
    rayorigin : Vector3 = new Vector3();

    selectedObject : any ; 

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

    select(intersects: any){
        this.selectedObject = intersects.object ; 


        if (this.selectedObject instanceof Mesh) {
            const originalMaterial = this.selectedObject.material;
        
            if (Array.isArray(originalMaterial)) {
                // Handle multi-material mesh
                this.selectedObject.material = originalMaterial.map(mat => {
                    const cloned = mat.clone();
                    if ('color' in cloned) {
                        cloned.color = new Color(Math.random(), Math.random(), Math.random());
                    }
                    return cloned;
                });
            } else {
                // Single material
                const cloned = originalMaterial.clone();
                if ('color' in cloned) {
                    cloned.color = new Color(Math.random(), Math.random(), Math.random());
                }
                this.selectedObject.material = cloned;
            }
        
            this.selectedObject.material.needsUpdate = true;
        }

        return this.selectedObject ; 
    }

    unselect(){
        if( this.selectedObject ){
            this.selectedObject = undefined ; 
        }
    }

    getSelectedObject(){
        if( this.selectedObject ) {
            return this.selectedObject ; 
        }
        else{
            return undefined ; 
        }
    }

    pointerdown(){

        if( this.experince.world.ctrlActive){
            return ; 
        }

        this.raycast.setFromCamera(this.pointer , this.experince.camera.instance ) ; 

        let intersects = this.raycast.intersectObjects(this.experince.world.selectableObjects , true) ; 

        if( intersects && intersects.length > 0 ){


            this.select(intersects[0]) ; 
            
            return ; 

        }

    }

    pointermove(event: PointerEvent){
        event.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
		this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
		this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    }
}