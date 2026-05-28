export interface WuzinitProductBase {
    type: string;
    badges: string[];
    important_badges: string[];
    number_of_servings?: number;
    nutrition?: ProductNutrition;
    price?: number;
    serving_size?: string;
}
export interface ProductNutrition {
    calories: number;
    carbs: string;
    fat: string;
    protein: string;
}
