import { DynamoDB as Client, CredentialProviderChain, AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import DynamoDBFactory from './dynamodb.factory';

export default class DynamoDB {

  private client: Client;
  private factory: DynamoDBFactory;

  constructor (credentialProvider?: CredentialProviderChain) {
    this.client = new Client({region: 'us-west-2', apiVersion: '2012-08-10', credentialProvider: credentialProvider || undefined});
    this.factory = new DynamoDBFactory();
  }

  public async searchStringPaginated(tableName: string, searchKey: string, searchString: string, pageSize: number, startKey?: any): Promise<any> {
    const params: any = this.factory.makeScanParams(tableName, pageSize, searchKey, searchString, startKey);
    try {
      const scanResult: PromiseResult<Client.ScanOutput, AWSError> = await this.client.scan(params).promise();
      console.log(`DynamoDB.searchStringPaginated: Did we get all the items: ${scanResult.LastEvaluatedKey ? 'no' : 'yes'}`);
      return this.factory.interpretScanResult(scanResult);
    } catch (error) {
      console.error(`DynamoDB.searchStringPaginated: error scanning table ${JSON.stringify(error)}`);
      throw error;
    }
  }

  public async getAllPaginated(tableName: string, pageSize: number, startKey?: any): Promise<any> {
    console.log(`DynamoDB.getAllPaginated: beginning of function: tableName: ${tableName}, pageSize: ${pageSize}, startKey: ${startKey}`);
    const params: any = this.factory.makeScanParams(tableName, pageSize, undefined, undefined, startKey);
    console.log(`DynamoDB.getAllPaginated: params for scan: ${JSON.stringify(params)}`);
    try {
      const scanResult: PromiseResult<Client.ScanOutput, AWSError> = await this.client.scan(params).promise();
      console.log(`DynamoDB.getAllPaginated: Did we get all the items: ${scanResult.LastEvaluatedKey ? 'no' : 'yes'}`);
      return this.factory.interpretScanResult(scanResult);
    } catch (error) {
      console.error(`DynamoDB.getAllPaginated: error scanning table ${JSON.stringify(error)}`);
      throw error;
    }
  }

  public async putItem(tableName: string, item: any): Promise<void> {
    const params: any = this.factory.makePutItemParams(tableName, item);
    try {
      await this.client.putItem(params).promise();
    } catch (error) {
      console.error('DynamoDB.putItem: Error putting item');
      console.error(`DynamoDB.putItem: {tableName: ${tableName}, item: ${item}}`);
      console.error(`DynamoDB.putItem: params: ${JSON.stringify(params)}`);
      console.error(`DynamoDB.putItem: ${error}`);
      throw error;
    }
  }

  public async deleteItemByHashKey(tableName: string, hashKeyName: string, valueToDelete: string): Promise<void> {
    const params: any = this.factory.makeGetItemParams(tableName, hashKeyName, valueToDelete);
    try {
      await this.client.deleteItem(params).promise();
    } catch (error) {
      console.error('DynamoDB.deleteItem: Error putting item');
      console.error(`DynamoDB.deleteItem: {tableName: ${tableName}, hashKeyName: ${hashKeyName}, valueToDelete: ${valueToDelete}}`);
      console.error(`DynamoDB.deleteItem: params: ${JSON.stringify(params)}`);
      console.error(`DynamoDB.deleteItem: ${error}`);
      throw error;
    }
  }

  public async getByHashKey(tableName: string, hashKeyName: string, valueToGet: string): Promise<any> {
    const params = this.factory.makeGetItemParams(tableName, hashKeyName, valueToGet);
    try {
      const returnedItem = await this.client.getItem(params).promise();
      return this.factory.fromDynamoEncoding(returnedItem.Item);
    } catch (error) {
      console.error('DynamoDB.getByHashKey: Error getting item by hash key');
      console.error(`DynamoDB.getByHashKey: {tableName: ${tableName}, hashKeyName: ${hashKeyName}, valueToGet: ${valueToGet}}`);
      console.error(`DynamoDB.getByHashKey: params: ${JSON.stringify(params)}`);
      console.error(`DynamoDB.getByHashKey: ${error}`);
      return {};
    }
  }

  public async getByRangeKey(tableName: string, rangeKeyName: string, rangeKeyValueToGet: string, pageSize: number, startKey?: any): Promise<any[]> {
    const params: any = this.factory.makeQueryParams(tableName, rangeKeyName, rangeKeyValueToGet, undefined, undefined, undefined, pageSize, startKey);
    console.log(`DynamoDB.getByRangeKey: query dynamo params: ${JSON.stringify(params)}`);
    try {
      const dynamoResponse: any = await this.queryDynamo(params);
      console.log(`DynamoDB.getByRangeKey: dynamo response: ${JSON.stringify(dynamoResponse)}`);
      const results: any[] = [];
      for (let item of dynamoResponse.Items) {
        results.push(this.factory.fromDynamoEncoding(item));
      }
      console.log(`DynamoDB.getByRangeKey: items decoded: ${JSON.stringify(dynamoResponse)}`);
      return results;
    } catch (error) {
      console.error('DynamoDB.getByRangeKey: Error getting item by range key');
      console.error(`DynamoDB.getByRangeKey: {tableName: ${tableName}, rangeKeyName: ${rangeKeyName}, rangeKeyValueToGet: ${rangeKeyValueToGet}}`);
      console.error(`DynamoDB.getByRangeKey: params: ${JSON.stringify(params)}`);
      console.error(`DynamoDB.getByRangeKey: ${JSON.stringify(error)}`);
      return [];
    }
  }

  public async getByCompositeKey(tableName: string, rangeKeyName: string, rangeKeyValueToGet: string, sortKeyName: string, sortKeyValueToGet: string): Promise<any> {
    const params = this.factory.makeGetItemParams(tableName, rangeKeyName, rangeKeyValueToGet, sortKeyName, sortKeyValueToGet);
    try {
      const returnedItem = await this.client.getItem(params).promise();
      return this.factory.fromDynamoEncoding(returnedItem.Item);
    } catch (error) {
      console.error('DynamoDB.getByCompositeKey: Error getting item by hash key');
      console.error(`DynamoDB.getByCompositeKey: {tableName: ${tableName}, rangeKeyName: ${rangeKeyName}, rangeKeyValueToGet: ${rangeKeyValueToGet}, sortKeyName: ${sortKeyName}, sortKeyValueToGet: ${sortKeyValueToGet}}`);
      console.error(`DynamoDB.getByCompositeKey: params: ${JSON.stringify(params)}`);
      console.error(`DynamoDB.getByCompositeKey: ${error}`);
      return {};
    }
  }

  public async getBySecondaryHashKey(tableName: string, indexName: string, hashKeyName: string, valueToGet: string): Promise<any> {
    const params: any = this.factory.makeQueryParams(tableName, hashKeyName, valueToGet, undefined, undefined, indexName);
    console.log(`DynamoDB.getBySecondaryHashKey: query dynamo paramas: ${JSON.stringify(params)}`);
    try {
      const dynamoResponse: any = await this.queryDynamo(params);
      return this.factory.fromDynamoEncoding(dynamoResponse.Items[0]);
    } catch (error) {
      console.error('DynamoDB.getBySecondaryHashKey: Error getting item by hash key');
      console.error(`DynamoDB.getBySecondaryHashKey: {tableName: ${tableName}, hashKeyName: ${hashKeyName}, valueToGet: ${valueToGet}}`);
      console.error(`DynamoDB.getBySecondaryHashKey: params: ${JSON.stringify(params)}`);
      console.error(`DynamoDB.getBySecondaryHashKey: ${JSON.stringify(error)}`);
      return {};
    }
  }

  public async getBySecondaryCompositeKeyPaginated(tableName: string, indexName: string, hashKeyName: string, rangeKeyName: string, hashKeyValue: string, rangeKeyValue: string, pageSize: number, startKey?: any): Promise<any> {
    const params: any = this.factory.makeQueryParams(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, indexName, pageSize, startKey);
    console.log(`DynamoDB.getBySecondaryCompositeKeyPaginated: query dynamo paramas: ${JSON.stringify(params)}`);
    try {
      const dynamoResponse: any = await this.queryDynamo(params);
      return this.factory.fromDynamoEncoding(dynamoResponse);
    } catch (error) {
      console.error('DynamoDB.getBySecondaryCompositeKeyPaginated: Error getting item by composite key');
      console.error(`DynamoDB.getBySecondaryCompositeKeyPaginated: {tableName: ${tableName}, hashKeyName: ${hashKeyName}, rangeKeyName: ${rangeKeyName}}, hashKeyValue: ${hashKeyValue}}, rangeKeyValue: ${rangeKeyValue}}`);
      console.error(`DynamoDB.getBySecondaryCompositeKeyPaginated: params: ${JSON.stringify(params)}`);
      console.error(`DynamoDB.getBySecondaryCompositeKeyPaginated: ${JSON.stringify(error)}`);
      return {};
    }
  }

  public async batchWrite(tableName: string, input: any[]): Promise<void> {
    if (input.length === 0) {
      return;
    } else if (input.length <= 25) {
      await this.write25(tableName, input);
      return;
    } else {
      const first25 = input.slice(0, 25);
      await this.write25(tableName, first25);
      return await this.batchWrite(tableName, input.slice(25));
    }
  }

  //////////////////////
  // HELPER FUNCTIONS //
  //////////////////////
  private async queryDynamo(params: any): Promise<any> {
    const returnedItemsObject = await this.client.query(params).promise();
    if (returnedItemsObject && returnedItemsObject.hasOwnProperty('Items') && returnedItemsObject.Items && returnedItemsObject.Items.hasOwnProperty('length') && returnedItemsObject.Items.length > 0) {
      return returnedItemsObject;
    } else {
      throw new Error('No Items were found in Dynamo using this query');
    }
  }

  private async write25 (tableName: string, batch: any[]): Promise<void> {
    const inputParams: any = this.factory.chunk25(tableName, batch);

    try {
      await this.client.batchWriteItem(inputParams).promise();
    } catch (error) {
      console.error(`${error}\n Input Params: \n${JSON.stringify(inputParams)}`);
    }
  }
}
