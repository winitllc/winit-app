import { Ingredient } from '.';

export default interface Condition {
    id: string;
    name: string;
    commonName: string;
    dangerousIngredients: Ingredient[];
}
