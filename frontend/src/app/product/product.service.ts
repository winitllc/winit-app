import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { model } from 'wuzinit-common';
import { EnvironmentConfig } from '../environment.config';
import { AuthState } from '../util/auth.state';
import { AppConfig } from '../app.config';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  constructor(
    private authState: AuthState
  ) { }

  // public async updateWIIProduct(productUpdate: model.WuzinitProduct): Promise<number> {

  // }

  public async addNewProductUpdate(product: OpenFoodFactsProductUpdate): Promise<OpenFoodFactsProductUpdate> {
    const postProductUpdate = `${EnvironmentConfig.api.openFoodFactsProducts.testUrl}${EnvironmentConfig.api.openFoodFactsProducts.addProductUpdate}`;
    // const postProductUpdate = `${EnvironmentConfig.api.openFoodFactsProducts.baseUrl}${EnvironmentConfig.api.openFoodFactsProducts.addProductUpdate}`;
    console.log(`ProductService.addNewProductUpdate: adding new product: ${JSON.stringify(product)}`);
    console.log(`ProductService.addNewProductUpdate: url: ${postProductUpdate}`);
    try {
      const requestOptions: HttpOptions = {
        url: postProductUpdate,
        headers: {
          'User-Agent': EnvironmentConfig.api.openFoodFactsProducts.headerUserAgent
        },
        params: {
          code: product.code,
          product_name_en: product.product_name_en,
          ingredients_text: product.ingredients_text,
          nutrition_data: product.nutrition_data,
          image_url: product.image_url,
          image_ingredients_url: product.image_ingredients_url,
          image_front_url: product.image_front_url,
          image_nutrition_url: product.image_nutrition_url,
          brands: product.brands
        }
      };
      const result: HttpResponse = await CapacitorHttp.post(requestOptions);
      console.log(`ProductService.addNewProductUpdate: result from open food facts: ${JSON.stringify(result)}`);
      console.log(`ProductService.addNewProductUpdate: product object: ${JSON.stringify(product)}`);
      return product;
    } catch (error) {
      console.error(`ProductService.addNewProductUpdate: Error getting by id ${JSON.stringify(product)}`);
      console.error(`ProductService.addNewProductUpdate: Error: ${JSON.stringify(error)}`);
      return JSON.parse(JSON.stringify(AppConfig.emptyWuzinitProduct));
    }
  }

  public async getProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct> {
    const getProductByBarcodeURL = `${EnvironmentConfig.api.openFoodFactsProducts.baseUrl}${EnvironmentConfig.api.openFoodFactsProducts.getByCode}${barcode}.json`;
    console.log(`ProductService.getProductByBarcode: requesting product by barcode: ${barcode}`);
    console.log(`ProductService.getProductByBarcode: url: ${getProductByBarcodeURL}`);
    try {
      // const apiKey: string = this.authState.getSpoonacularAPIKey();
      const requestOptions = {
        url: getProductByBarcodeURL,
        headers: {
          'User-Agent': EnvironmentConfig.api.openFoodFactsProducts.headerUserAgent
        },
        params: {
          // apiKey
        }
      }
      const result: HttpResponse = await CapacitorHttp.get(requestOptions);
      console.log(`ProductService.getProductByBarcode: result from OpenFoodFacts: ${JSON.stringify(result)}`);
      const product: OpenFoodFactsProduct = result.data?.product;
      console.log(`ProductService.getProductByBarcode: product object: ${JSON.stringify(product)}`);
      return product;
    } catch (error) {
      console.error(`ProductService.getProductByBarcode: Error getting by barcode ${barcode}`);
      console.error(`ProductService.getProductByBarcode: Error: ${JSON.stringify(error)}`);
      return JSON.parse(JSON.stringify(AppConfig.emptyWuzinitProduct));
    }
  }

  public async searchProductByCategory(category: string, nextPage?: string): Promise<any> {
    const getProductByBarcodeURL = `${EnvironmentConfig.api.openFoodFactsProducts.baseUrl}${EnvironmentConfig.api.openFoodFactsProducts.searchByTag}`;
    console.log(`ProductService.searchProductByCategory: searching by category: ${category}`);
    console.log(`ProductService.searchProductByCategory: url: ${getProductByBarcodeURL}`);
    try {
      // const apiKey: string = this.authState.getSpoonacularAPIKey();
      const searchUrl = new URL(getProductByBarcodeURL);
      searchUrl.searchParams.set('countries_tags_en', 'united-states');
      searchUrl.searchParams.set('categories_tags', category);
      if (nextPage) {
        searchUrl.searchParams.set('page', nextPage);
      }
      const requestOptions: HttpOptions = {
        url: searchUrl.toString(),
        headers: {
          'User-Agent': EnvironmentConfig.api.openFoodFactsProducts.headerUserAgent
        }
      };
      console.log(`ProductService.searchProductByCategory: request options: ${JSON.stringify(requestOptions)}`);
      const result: HttpResponse = await CapacitorHttp.get(requestOptions);
      console.log(`ProductService.searchProductByCategory: result from OpenFoodFacts: ${JSON.stringify(result)}`);
      console.log(`ProductService.searchProductByCategory: result fields from OpenFoodFacts: ${Object.keys(result.data)}`);
      console.log(`ProductService.searchProductByCategory: page field from OpenFoodFacts: ${result.data.page}`);
      console.log(`ProductService.searchProductByCategory: result page_size from OpenFoodFacts: ${result.data.page_size}`);
      console.log(`ProductService.searchProductByCategory: result page_count from OpenFoodFacts: ${result.data.page_count}`);
      console.log(`ProductService.searchProductByCategory: result count from OpenFoodFacts: ${result.data.count}`);
      console.log(`ProductService.searchProductByCategory: skip field from OpenFoodFacts: ${result.data.skip}`);
      console.log(`ProductService.searchProductByCategory: first product fields: ${Object.keys(result.data?.products[0])}`);
      console.log(`ProductService.searchProductByCategory: names of products: ${result.data?.products.map((product: OpenFoodFactsProduct)=>{return product.product_name || '';})}`);
      const products: OpenFoodFactsProduct[] = result.data?.products;

      const product_name_en_list: string[] = [];
      const brands_list: string[] = [];
      const labels_tags_list: string[][] = [];
      const categories_tags_list: string[][] = [];
      const categories_list: string[] = [];
      products.forEach((product) => {
        product_name_en_list.push(product.product_name_en);
        brands_list.push(product.brands);
        labels_tags_list.push(product.labels_tags);
        categories_tags_list.push(product.categories_tags);
        categories_list.push(product.categories);
      });
      console.log(`ProductService.searchProductByCategory: product product_name_en_list: ${JSON.stringify(product_name_en_list)}`);
      console.log(`ProductService.searchProductByCategory: product brands_list: ${JSON.stringify(brands_list)}`);
      console.log(`ProductService.searchProductByCategory: labels_tags field from OpenFoodFacts: ${JSON.stringify(labels_tags_list)}`);
      console.log(`ProductService.searchProductByCategory: categories_tags field from OpenFoodFacts: ${JSON.stringify(categories_tags_list)}`);
      console.log(`ProductService.searchProductByCategory: categories field from OpenFoodFacts: ${JSON.stringify(categories_list)}`);
      return {
        products,
        page: result.data.page,
        page_size: result.data.page_size,
        page_count: result.data.page_count,
        count: result.data.count,
        skip: result.data.skip,
        labels_tags: labels_tags_list,
        categories_tags: categories_tags_list,
        categories: categories_list
      };
    } catch (error) {
      console.error(`ProductService.searchProductByCategory: Error getting by category ${category}`);
      console.error(`ProductService.searchProductByCategory: Error: ${JSON.stringify(error)}`);
      return JSON.parse(JSON.stringify(AppConfig.emptyWuzinitProduct));
    }
  }
}

export interface OpenFoodFactsProductUpdate {
  code: string;
  product_name_en: string;
  ingredients_text: string;
  nutrition_data: string;
  image_url: string;
  image_ingredients_url: string;
  image_front_url: string;
  image_nutrition_url: string;
  brands: string;
  labels?: string;
}

export interface OpenFoodFactsProduct {
  abbreviated_product_name: string;
  code: string;
  codes_tags: string[];
  generic_name: string;
  id: string;
  lc: string;
  lang: string;
  nova_group: number;
  nova_groups: string;
  obsolete: string;
  obsolete_since_date: string;
  product_name: string;
  product_name_en: string;
  product_quantity: string;
  product_quantity_unit: string;
  quantity: string;
  additives_n: number;
  checked: string;
  complete: number;
  completeness: number;
  ecoscore_grade: string;
  ecoscore_score: number;
  food_groups: string;
  food_groups_tags: string[];
  nutrient_levels: OpenFoodFactsNutrientLevels;
  packaging_text: string;
  packagings: any[];
  packagings_complete: number;
  pnns_groups_1: string;
  pnns_groups_1_tags: string[];
  pnns_groups_2: string;
  pnns_groups_2_tags: string[];
  popularity_key: number;
  popularity_tags: string[];
  scans_n: number;
  unique_scans_n: number;
  serving_quantity: string;
  serving_quantity_unit: string;
  serving_size: string;
  brands: string;
  brands_tags: string[];
  categories: string;
  categories_hierarchy: string[];
  categories_lc: string;
  categories_tags: string[];
  checkers_tags: string[];
  cities: string;
  cities_tags: any[];
  correctors_tags: string[];
  countries: string;
  countries_hierarchy: string[];
  countries_lc: string;
  countries_tags: string[];
  ecoscore_tags: string[];
  emb_codes: string;
  emb_codes_orig: string;
  emb_codes_tags: any[];
  labels: string;
  labels_hierarchy: string[];
  labels_lc: string;
  labels_tags: string[];
  entry_dates_tags: string[];
  manufacturing_places: string;
  manufacturing_places_tags: any[];
  nova_groups_tags: string[];
  nutrient_levels_tags: string[];
  image_front_small_url: string;
  image_front_thumb_url: string;
  image_front_url: string;
  image_nutrition_small_url: string;
  image_nutrition_thumb_url: string;
  image_nutrition_url: string;
  image_small_url: string;
  image_thumb_url: string;
  image_url: string;
  images: any
  last_image_dates_tags: string[];
  last_image_t: number;
  selected_images: OpenFoodFactsImages;
  ecoscore_data: any;
  ecoscore_extended_data_version: string;
  environment_impact_level: string;
  environment_impact_level_tags: any[];
  additives_tags: string[];
  allergens: string;
  allergens_lc: string;
  allergens_hierarchy: string[];
  allergens_tags: string[];
  ingredients: OpenFoodFactsIngredient[];
  ingredients_analysis: any;
  ingredients_analysis_tags: string[];
  ingredients_from_or_that_may_be_from_palm_oil_n: number;
  ingredients_from_palm_oil_n: number;
  ingredients_from_palm_oil_tags: any[];
  ingredients_hierarchy: string[];
  ingredients_n: number;
  ingredients_n_tags: string[];
  ingredients_original_tags: string[];
  ingredients_percent_analysis: number;
  ingredients_sweeteners_n: number;
  ingredients_non_nutritive_sweeteners_n: number;
  ingredients_tags: string[];
  ingredients_lc: string;
  ingredients_text: string;
  ingredients_text_with_allergens: string;
  ingredients_that_may_be_from_palm_oil_n: number;
  ingredients_that_may_be_from_palm_oil_tags: any[];
  ingredients_with_specified_percent_n: number;
  ingredients_with_specified_percent_sum: number;
  ingredients_with_unspecified_percent_n: number;
  ingredients_with_unspecified_percent_sum: number;
  known_ingredients_n: number;
  origins: string;
  origins_hierarchy: any[];
  origins_lc: string;
  origins_tags: any[];
  traces: string;
  traces_hierarchy: any[];
  traces_lc: string;
  traces_tags: any[];
  unknown_ingredients_n: number;
  no_nutrition_data: string;
  nutrition_data_per: string;
  nutrition_data_prepared_per: string;
  nutriments: any;
  nutriscore_data: any;
  nutriscore_grade: string;
  nutriscore_score: number;
  nutriscore_score_opposite: number;
  nutrition_grade_fr: string;
  nutrition_grades: string;
  nutrition_grades_tags: string[];
  nutrition_score_beverage: number;
  nutrition_score_warning_fruits_vegetables_nuts_estimate_from_ingredients: number;
  nutrition_score_warning_fruits_vegetables_nuts_estimate_from_ingredients_value: number;
  nutrition_score_warning_no_fiber: number;
  other_nutritional_substances_tags: any[];
  unknown_nutrients_tags: any[];
  vitamins_tags: any[];
  data_quality_bugs_tags: any[];
  data_quality_errors_tags: any[];
  data_quality_info_tags: string[];
  data_quality_tags: string[];
  data_quality_warnings_tags: string[];
  data_sources: string;
  data_sources_tags: string[];
  last_check_dates_tags: string[];
  last_checked_t: number;
  last_checker: string;
  states: string;
  states_hierarchy: string[];
  states_tags: string[];
  misc_tags: string[];
  additives_original_tags: string[];
  additives_prev_original_tags: string[];
  added_countries_tags: any[];
  allergens_from_ingredients: string;
  allergens_from_user: string;
  amino_acids_prev_tags: any[];
  amino_acids_tags: any[];
  carbon_footprint_percent_of_known_ingredients: number;
  categories_properties: any;
  categories_properties_tags: string[];
  category_properties: any;
  ciqual_food_name_tags: string[];
  compared_to_category: string;
  conservation_conditions: string;
  customer_service: string;
  expiration_date: string;
  link: string;
  main_countries_tags: any[];
  minerals_prev_tags: any[];
  minerals_tags: any[];
  owner_fields: any;
  nova_groups_markers: any;
  nucleotides_tags: any[];
  origin: string;
  purchase_places: string;
  purchase_places_tags: string[];
  stores: string;
  stores_tags: string[];
  traces_from_ingredients: string;
  traces_from_user: string;
  created_t: number;
  creator: string;
  editors_tags: string[];
  informers_tags: string[];
  interface_version_created: string;
  interface_version_modified: string;
  languages: any;
  languages_codes: any;
  languages_hierarchy: string[];
  languages_tags: string[];
  last_edit_dates_tags: string[];
  last_editor: string;
  last_modified_by: string;
  last_modified_t: number;
  owner: string;
  owners_tags: string;
  photographers_tags: string[];
  rev: number;
  sources: any[];
  sources_fields: any;
  teams: string;
  teams_tags: string[];
  update_key: string;
  knowledge_panels: any;
  attribute_groups: any[];
  pattern?: any;
}

export interface OpenFoodFactsImages {
  front: OpenFoodFactsImage;
  ingredients: OpenFoodFactsImage;
  nutrition: OpenFoodFactsImage;
}

export interface OpenFoodFactsImage {
  display: any;
  small: any;
  thumb: any;
}

export interface OpenFoodFactsIngredient {
  id: string;
  ingredients: any;
  percent: number;
  percent_estimate: number;
  percent_max: number;
  percent_min: number;
  text: string;
  vegan: string;
  vegetarian: string;
}

export interface OpenFoodFactsNutrientLevels {
  "saturated-fat": string;
  sugars: string;
  salt: string;
  fat: string;
}
