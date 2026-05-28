import { WuzinitProductBase } from './wuzinitProductBase';

export default interface WuzinitProduct extends WuzinitProductBase {
  code: string;
  productName: string;
  images: WuzinitImageData;
  ingredientsText: string;
  ingredientsList: string[];
  tracesList: string[];
  containsList: string[];
}

export interface WuzinitProductNutrition {
  calories: number;
  carbs: string;
  fat: string;
  protein: string;
}

export interface WuzinitImageData {
  front_312x231?: string;
  front_636x393?: string;
  front_90x90?: string;
  front?: string;
  nutritionLabel?: string;
}
