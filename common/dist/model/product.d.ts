export default interface Product {
    code: string;
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
        allergens: string[];
        traces: string[];
        tracesTags: string[];
        additivesTags: string[];
        ingredients: string[];
    };
    grades: {
        nutritionGradeFr: string;
        novaGroup: number;
        nutritionScoreUK_100g: number;
    };
    imageInfo: {
        imageUrl: string;
        imageSmallUrl: string;
        imageIngredientsUrl: string;
        imageIngredientsSmallUrl: string;
        imageNutritionUrl: string;
        imageNutritionSmallUrl: string;
    };
    nutritionData: {
        servingSize: string;
        servingQuantity: number;
        energy_100g: number;
        energyFromFat_100g: number;
        fat_100g: number;
        saturatedFat_100g: number;
        monounsaturatedFat_100g: number;
        polyunsaturatedFat_100g: number;
        transFat_100g: number;
        cholesterol_100g: number;
        carbohydrates_100g: number;
        sugars_100g: number;
        fiber_100g: number;
        proteins_100g: number;
        salt_100g: number;
        sodium_100g: number;
        vitamin_a_100g: number;
        vitamin_d_100g: number;
        vitamin_c_100g: number;
        vitamin_b1_100g: number;
        vitamin_b2_100g: number;
        vitaminPp_100g: number;
        vitamin_b6_100g: number;
        vitamin_b9_100g: number;
        folates_100g: number;
        vitamin_b12_100g: number;
        potassium_100g: number;
        calcium_100g: number;
        phosphorus_100g: number;
        iron_100g: number;
        magnesium_100g: number;
        zinc_100g: number;
    };
}
