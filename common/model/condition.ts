export default interface Condition {
    id: string;
    name: string;
    commonName: string;
    dangerousIngredients?: string[];
    poisonousIngredients?: string[];
}
