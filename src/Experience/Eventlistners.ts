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

        //drag and drop for loading gltf file 
        this.experince.canvas.addEventListener('dragover' , this.canvasDragOver.bind(this));
        this.experince.canvas.addEventListener('drop' , this.canvasDrop.bind(this));
    }

    canvasDragOver(event: DragEvent){
        event.preventDefault();
        this.experince.canvas.style.cursor = 'copy' ; 
    }

    /*
        GLTF File Drop Listener
    */
    canvasDrop(event: DragEvent){ 
        event.preventDefault(); 

        const file = event.dataTransfer?.files?.[0];
        if (!file) return;

        const reader = new FileReader(); 

        reader.onload = (event) => {
            const arrayBuffer = event.target?.result;

            if (!arrayBuffer || typeof arrayBuffer === 'string') return;

            this.experince.resources.gltfloader.parse(arrayBuffer as ArrayBuffer , '' , (gltf)=>{
                this.experince.world.createBaseBrush(gltf);
            },(e)=>{
                console.error(e);
            })
        };

        reader.readAsArrayBuffer(file); 
    }

    pointerdown(){
        this.experince.world.pointerdown();
        this.experince.raycaster.pointerdown(); 
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