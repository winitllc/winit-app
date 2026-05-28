import { model } from 'wuzinit-common';

export interface SpoonacularProduct extends model.WuzinitProductBase {
    id: number;
    title: string;
    breadcrumbs: string[];
    generatedText: string;
    images: string[];
    ingredientCount: number;
    ingredientList: string;
    ingredients: SpoonacularProductIngredient[];
    likes: number;
    number_of_servings: number;
    price: number;
    serving_size: string;
    spoonacular_score: number;
}

export interface SpoonacularProductIngredient {
    description: string;
    name: string;
    safety_level: string;
}

export interface SpoonacularProductNutrition {
    calories: number;
    carbs: string;
    fat: string;
    protein: string;
}

export interface SpoonacularSearchResult {
    products: SpoonacularSearchResultProduct[];
    totalProducts: number;
    type: string;
    offset: number;
    number: number;
}

export interface SpoonacularSearchResultProduct {
    id: number;
    title: string;
    image: string;
    imageType: string;
}
