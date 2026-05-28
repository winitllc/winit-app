import { client, model, view } from 'wuzinit-common';
import { Config } from './config';

export class ProductController {

  private dynamoDB: client.DynamoDB;
  private elasticSearch: client.ElasticSearch;

  constructor () {
    this.dynamoDB = new client.DynamoDB();
    this.elasticSearch = new client.ElasticSearch(Config.elasticSearch.config);
  }

  async addProductUpdate(product: model.WuzinitProduct): Promise<void> {
    try {
      console.log('ProductController.addProductUpdate - beginning of funciton');
      console.log(`ProductController.addProductUpdate - product from parameters: ${JSON.stringify(product)}`);
      await this.dynamoDB.putItem(Config.dynamoDB.productUpdate.tableName, product);
    } catch (error) {
      console.error(`ProductController.addProductUpdate: error putting the new product in the product updates table: ${JSON.stringify(error)}`);
    }
  }

  async getByCode(code: string): Promise<model.Product | string> {
    try {
      console.log('ProductController.getByCode - beginning of funciton');
      console.log(`ProductController.getByCode - code from parameters: ${code}`);
      const product = await this.dynamoDB.getByHashKey(Config.dynamoDB.product.tableName, Config.dynamoDB.product.hashKey, code);
      console.log(`ProductController.getByCode: response from dynamo: ${JSON.stringify(product)}`);
      if (product && product.hasOwnProperty(Config.dynamoDB.product.hashKey)) {
        console.log(`ProductController.getByCode: returning with the product as a Product model`);
        return product as model.Product;
      }
      console.log(`ProductController.getByCode: responding with 'Item not found'`);
      return 'Item not found.';
    } catch (error) {
      console.error(`ProductController.getByCode: error getting product by code: ${JSON.stringify(code)}`);
    }
  }

  async searchText(searchText: string, exclusions: string[]): Promise<view.ProductSearchResponse> {
    try {
      console.log('ProductController.searchText - beginning of funciton');
      console.log(`ProductController.searchText - searchText from parameters: ${searchText}`);
      console.log(`ProductController.searchText - exclusions from parameters: ${exclusions}`);
      const searchResultsObject: any = await this.elasticSearch.search(Config.elasticSearch.product.index, searchText, exclusions, 25, 30);
      console.log(`ProductController.searchText: result from the elastic search: ${JSON.stringify(searchResultsObject)}`);
      const results: view.ProductSearchResult[] = searchResultsObject.hits;
      const nextObjectId: string = searchResultsObject.scrollId;
      console.log(`ProductController.searchText: response from elasticsearch: ${JSON.stringify(searchResultsObject)}`);
      return {
        nextObjectId,
        results,
        service: 'elasticsearch'
      };
    } catch (error) {
      console.error(`ProductController.searchText: Error searching by name, ${searchText}: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async scrollSearch(scrollId: string): Promise<view.ProductSearchResponse> {
    try {
      console.log('ProductController.scrollSearch - beginning of funciton');
      const searchResultsObject: any = await this.elasticSearch.scrollSearch(scrollId);
      console.log(`ProductController.scrollSearch: result from the elastic search ${JSON.stringify(searchResultsObject)}`);
      const results: view.ProductSearchResult[] = searchResultsObject.hits;
      const nextObjectId: string = searchResultsObject.scrollId;
      console.log(`ProductController.searchText: response from elasticsearch: ${JSON.stringify(searchResultsObject)}`);
      return {
        nextObjectId,
        results,
        service: 'elasticsearch'
      };
    } catch (error) {
      console.error(`ProductController.searchText: Error searching by scrollId, ${scrollId}: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async searchCategory(category: string, startKey?: any): Promise<view.ProductSearchResponse> {
    try {
      console.log('ProductController.searchCategory - beginning of funciton');
      console.log(`ProductController.searchCategory - category from parameters: ${category}`);
      console.log(`ProductController.searchCategory - startKey from parameters: ${startKey}`);
      const searchResultsObject: any = await this.searchDynamoForStringPaginated(Config.dynamoDB.product.tableName, Config.dynamoDB.product.categoryKey, `en:${category}`, 20, startKey);
      console.log(`ProductController.searchCategory: result from the elastic search ${JSON.stringify(searchResultsObject)}`);
      const results: view.ProductSearchResult[] = this.dynamoToResults(searchResultsObject.results);
      const nextObjectId: any = searchResultsObject.lastEvaluatedKey ? searchResultsObject.lastEvaluatedKey : null;
      console.log(`ProductController.searchCategory: response from dynamo: ${JSON.stringify(searchResultsObject)}`);
      return {
        nextObjectId,
        results,
        service: 'dynamodb'
      };
    } catch (error) {
      console.error(`ProductController.searchCategory: Error searching by category, ${category}: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  private dynamoToResults(results: model.Product[]): view.ProductSearchResult[] {
    console.log('ProductController.dynamoToResults - beginning of funciton');
    return results.map((dynamoResult: model.Product): view.ProductSearchResult => {
      console.log(`ProductController.dynamoToResults: result from dynamo ${JSON.stringify(dynamoResult)}`);
      return {
        code: dynamoResult.code,
        productName: dynamoResult.productName,
        genericName: dynamoResult.genericName,
        categories: dynamoResult.categories ? dynamoResult.categories.join(', ') : '',
        categoriesTags: dynamoResult.categoriesTags ? dynamoResult.categoriesTags.join(', ') : '',
        labels: dynamoResult.labels ? dynamoResult.labels.join(', ') : '',
        labelsTags: dynamoResult.labelsTags ? dynamoResult.labelsTags.join(', ') : '',
        ingredientsText: dynamoResult.ingredientsText,
        brands: dynamoResult.branding.brands ? dynamoResult.branding.brands.join(', ') : '',
        origins: dynamoResult.originInfo && dynamoResult.originInfo.origins ? dynamoResult.originInfo.origins.join(', ') : '',
        manufacturingPlaces: dynamoResult.originInfo && dynamoResult.originInfo.manufacturingPlaces ? dynamoResult.originInfo.manufacturingPlaces.join(', ') : '',
        countries: dynamoResult.originInfo && dynamoResult.originInfo.countries ? dynamoResult.originInfo.countries.join(', ') : '',
        imageUrl: dynamoResult.imageInfo.imageSmallUrl || dynamoResult.imageInfo.imageUrl
          || dynamoResult.imageInfo.imageIngredientsSmallUrl || dynamoResult.imageInfo.imageIngredientsUrl
          || dynamoResult.imageInfo.imageNutritionSmallUrl || dynamoResult.imageInfo.imageNutritionUrl
          || ''
      };
    })
  }

  private async searchDynamoForStringPaginated(tableName: string, keyString: string, valueString: string, pageSize: number, startKey?: any, previousResultsObject?: any): Promise<any> {
    let resultsObject: any;
    console.log('ProductController.searchDynamoForStringPaginated - beginning of funciton');
    if (startKey) {
      resultsObject = await this.dynamoDB.searchStringPaginated(tableName, keyString, valueString, pageSize, startKey);
    } else {
      resultsObject = await this.dynamoDB.searchStringPaginated(tableName, keyString, valueString, pageSize);
    }
    console.log(`ProductsController.searchDynamoForStringPaginated: response from dynamo: ${JSON.stringify(resultsObject)}`);
    if (resultsObject && resultsObject.hasOwnProperty('results')) {
      return this.searchDynamoForStringPaginatedRecur(resultsObject, tableName, keyString, valueString, pageSize, previousResultsObject);
    }
  }

  private async searchDynamoForStringPaginatedRecur(resultsObject: any, tableName: string, keyString: string, valueString: string, pageSize: number, previousResultsObject?: any): Promise<any> {
    console.log('ProductController.searchDynamoForStringPaginatedRecur - beginning of funciton');
    const resultsObjectResultsLength: number = this.resultsLength(resultsObject);
    console.log(`ProductController.searchDynamoForStringPaginatedRecur: results object length: ${JSON.stringify(resultsObjectResultsLength)}`);
    if (previousResultsObject && this.resultsLength(previousResultsObject) + resultsObjectResultsLength < pageSize) {
      const newPreviousResultsObject: any = {
        results: previousResultsObject.results.concat(resultsObject.results)
      };
      if (resultsObject.hasOwnProperty('lastEvaluatedKey')) {
        newPreviousResultsObject.lastEvaluatedKey = resultsObject.lastEvaluatedKey;
      }
      console.log(`ProductsController.searchDynamoForStringPaginatedRecur: newPreviousResultsObject results length: ${JSON.stringify(newPreviousResultsObject.results.length)}`);
      console.log(`ProductsController.searchDynamoForStringPaginatedRecur: new start key?: ${JSON.stringify(resultsObject.lastEvaluatedKey)}`);
      return this.searchDynamoForStringPaginated(tableName, keyString, valueString, pageSize, resultsObject.lastEvaluatedKey ? resultsObject.lastEvaluatedKey : null, newPreviousResultsObject);
    } else if (previousResultsObject) {
      const finalResultsObject: any = {
        results: previousResultsObject.results.concat(resultsObject.results).slice(0, pageSize)
      };
      if (resultsObject.hasOwnProperty('lastEvaluatedKey')) {
        finalResultsObject.lastEvaluatedKey = resultsObject.lastEvaluatedKey;
      }
      console.log(`ProductsController.searchDynamoForStringPaginatedRecur: final results object results length: ${finalResultsObject.results.length}`);
      return finalResultsObject;
    } else if (resultsObjectResultsLength < pageSize && resultsObject.lastEvaluatedKey) {
      console.log(`ProductsController.searchDynamoForStringPaginatedRecur: newPreviousResultsObject results length: ${resultsObject.results.length}`);
      console.log(`ProductsController.searchDynamoForStringPaginatedRecur: results object start key?: ${JSON.stringify(resultsObject.lastEvaluatedKey)}`);
      return this.searchDynamoForStringPaginated(tableName, keyString, valueString, pageSize, resultsObject.lastEvaluatedKey, resultsObject);
    } else {
      const finalResultsObject: any = {
        results: resultsObject.results.slice(0, pageSize)
      };
      if (resultsObject.hasOwnProperty('lastEvaluatedKey')) {
        finalResultsObject.lastEvaluatedKey = resultsObject.lastEvaluatedKey;
      }
      console.log(`ProductsController.searchDynamoForStringPaginatedRecur: final results object results length: ${finalResultsObject.results.length}`);
      return finalResultsObject;
    }
  }

  private resultsLength(resultsObject: any) {
    console.log('ProductController.resultsLength - beginning of funciton');
    if (resultsObject.hasOwnProperty('lastEvaluatedKey') && resultsObject.hasOwnProperty('results') && resultsObject.results.hasOwnProperty('length')) {
      return resultsObject.results.length;
    }
    return 0;
  }
}
