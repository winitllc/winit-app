import { Ingredient } from '.';
export default interface Product {
    code: number;
    productName: string;
    genericName: string;
    quantity: string;
    categories: string[];
    categoriesTags: string[];
    labels: string[];
    labelsTags: string[];
    ingredientsText: string;
    branding: {
        packaging: string[];
        packagingTags: string[];
        brands: string[];
        brandsTags: string[];
    };
    originInfo: {
        origins: string[];
        originsTags: string[];
        manufacturingPlaces: string[];
        manufacturingPlacesTags: string[];
        countries: string[];
    };
    warnings: {
        allergens: Ingredient[];
        allergensTags: string[];
        traces: Ingredient[];
        tracesTags: string[];
        additivesTags: string[];
        ingredients: Ingredient[];
    };
    grades: {
        nutritionGradeFr: string;
        novaGroup: number;
        nutritionScoreUK: string;
    };
    imageInfo: {
        imageUrl: string;
        imageSmallUrl: string;
        imageFrontUrl: string;
        imageFrontSmallUrl: string;
        imageIngredientsUrl: string;
        imageIngredientsSmallUrl: string;
        imageNutritionUrl: string;
        imageNutritionSmallUrl: string;
    };
    nutritionData: {
        servingSize: string;
        servingQuantity: number;
        energy: number;
        energyFromFat: number;
        fat: number;
        saturatedFat: number;
        monounsaturatedFat: number;
        polyunsaturatedFat: number;
        transFat: number;
        cholesterol: number;
        carbohydrates: number;
        sugars: number;
        fiber: number;
        proteins: number;
        salt: number;
        sodium: number;
        vitamin_a: number;
        vitamin_d: number;
        vitamin_c: number;
        vitamin_b1: number;
        vitamin_b2: number;
        vitaminPp: number;
        vitamin_b6: number;
        vitamin_b9: number;
        folates: number;
        vitamin_b12: number;
        potassium: number;
        calcium: number;
        phosphorus: number;
        iron: number;
        magnesium: number;
        zinc: number;
    };
}
