import { BoxGeometry, MeshStandardMaterial } from "three";
import Experience from "./Experience";
import { SUBTRACTION, INTERSECTION , Brush, Evaluator} from "three-bvh-csg";

export default class World{
    experience : Experience

    baseBrush : Brush = new Brush();
    evaluator : Evaluator = new Evaluator();
    brush : Brush = new Brush();

    constructor(){
        this.experience = new Experience();

        this.createBrushes(); 
    }

    createBrushes(){
        //object 1 
        this.baseBrush.geometry = new BoxGeometry(1,1,1);
        this.baseBrush.material = new MeshStandardMaterial( {
            flatShading: true,
            polygonOffset: true,
            polygonOffsetUnits: 1,
            polygonOffsetFactor: 1,
        })
        this.baseBrush.position.set(-2, 0, 0 );
        
        //object 2
        this.brush.geometry = new BoxGeometry(1,1,1);
        this.brush.material = new MeshStandardMaterial( {
            color: 0x80cbc4,
            polygonOffset: true,
            polygonOffsetUnits: 1,
            polygonOffsetFactor: 1,
            
        })
        this.baseBrush.position.set(.6, 0, 0 );

        this.experience.scene.add(this.baseBrush , this.brush) ; 
    }

    keydown(event: KeyboardEvent){
        if( event.code === 'KeyI'){
            console.log('intersect');

            const result = this.evaluator.evaluate(this.baseBrush , this.brush , INTERSECTION);
            result.position.set( 0 , 2 , 0 ); 

            this.experience.scene.add(result); //returns new mesh

        }
        if( event.code === 'KeyS'){
            console.log('subtract'); 

            const result = this.evaluator.evaluate(this.baseBrush , this.brush , SUBTRACTION);
            result.position.set( 0 , -2 , 0 );

            this.experience.scene.add(result); //returns the new mesh 
        }
	}

    
}