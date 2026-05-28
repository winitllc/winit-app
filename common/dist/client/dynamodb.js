"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
const dynamodb_factory_1 = __importDefault(require("./dynamodb.factory"));
class DynamoDB {
    constructor(credentialProvider) {
        this.client = new aws_sdk_1.DynamoDB({ region: 'us-west-2', apiVersion: '2012-08-10', credentialProvider: credentialProvider || undefined });
        this.factory = new dynamodb_factory_1.default();
    }
    async searchStringPaginated(tableName, searchKey, searchString, pageSize, startKey) {
        const params = this.factory.makeScanParams(tableName, pageSize, searchKey, searchString, startKey);
        try {
            const scanResult = await this.client.scan(params).promise();
            console.log(`DynamoDB.searchStringPaginated: Did we get all the items: ${scanResult.LastEvaluatedKey ? 'no' : 'yes'}`);
            return this.factory.interpretScanResult(scanResult);
        }
        catch (error) {
            console.error(`DynamoDB.searchStringPaginated: error scanning table ${JSON.stringify(error)}`);
            throw error;
        }
    }
    async getAllPaginated(tableName, pageSize) {
        const params = this.factory.makeScanParams(tableName, pageSize);
        try {
            const scanResult = await this.client.scan(params).promise();
            console.log(`DynamoDB.getAllPaginated: Did we get all the items: ${scanResult.LastEvaluatedKey ? 'no' : 'yes'}`);
            const interpretedScanResult = this.factory.interpretScanResult(scanResult);
            return interpretedScanResult.results;
        }
        catch (error) {
            console.error(`DynamoDB.getAllPaginated: error scanning table ${JSON.stringify(error)}`);
            throw error;
        }
    }
    async putItem(tableName, item) {
        const params = this.factory.makePutItemParams(tableName, item);
        try {
            await this.client.putItem(params).promise();
        }
        catch (error) {
            console.error('DynamoDB.putItem: Error putting item');
            console.error(`DynamoDB.putItem: {tableName: ${tableName}, item: ${item}}`);
            console.error(`DynamoDB.putItem: params: ${JSON.stringify(params)}`);
            console.error(`DynamoDB.putItem: ${error}`);
            throw error;
        }
    }
    async getByHashKey(tableName, hashKeyName, valueToGet) {
        const params = this.factory.makeGetItemParams(tableName, hashKeyName, valueToGet);
        try {
            const returnedItem = await this.client.getItem(params).promise();
            return this.factory.fromDynamoEncoding(returnedItem.Item);
        }
        catch (error) {
            console.error('DynamoDB.getByHashKey: Error getting item by hash key');
            console.error(`DynamoDB.getByHashKey: {tableName: ${tableName}, hashKeyName: ${hashKeyName}, valueToGet: ${valueToGet}}`);
            console.error(`DynamoDB.getByHashKey: params: ${JSON.stringify(params)}`);
            console.error(`DynamoDB.getByHashKey: ${error}`);
            return {};
        }
    }
    async getByRangeKey(tableName, rangeKeyName, rangeKeyValueToGet, pageSize, startKey) {
        const params = this.factory.makeQueryParams(tableName, rangeKeyName, rangeKeyValueToGet, undefined, undefined, undefined, pageSize, startKey);
        console.log(`DynamoDB.getByRangeKey: query dynamo params: ${JSON.stringify(params)}`);
        try {
            const dynamoResponse = await this.queryDynamo(params);
            console.log(`DynamoDB.getByRangeKey: dynamo response: ${JSON.stringify(dynamoResponse)}`);
            const results = [];
            for (let item of dynamoResponse.Items) {
                results.push(this.factory.fromDynamoEncoding(item));
            }
            console.log(`DynamoDB.getByRangeKey: items decoded: ${JSON.stringify(dynamoResponse)}`);
            return results;
        }
        catch (error) {
            console.error('DynamoDB.getByRangeKey: Error getting item by range key');
            console.error(`DynamoDB.getByRangeKey: {tableName: ${tableName}, rangeKeyName: ${rangeKeyName}, rangeKeyValueToGet: ${rangeKeyValueToGet}}`);
            console.error(`DynamoDB.getByRangeKey: params: ${JSON.stringify(params)}`);
            console.error(`DynamoDB.getByRangeKey: ${JSON.stringify(error)}`);
            return [];
        }
    }
    async getByCompositeKey(tableName, rangeKeyName, rangeKeyValueToGet, sortKeyName, sortKeyValueToGet) {
        const params = this.factory.makeGetItemParams(tableName, rangeKeyName, rangeKeyValueToGet, sortKeyName, sortKeyValueToGet);
        try {
            const returnedItem = await this.client.getItem(params).promise();
            return this.factory.fromDynamoEncoding(returnedItem.Item);
        }
        catch (error) {
            console.error('DynamoDB.getByCompositeKey: Error getting item by hash key');
            console.error(`DynamoDB.getByCompositeKey: {tableName: ${tableName}, rangeKeyName: ${rangeKeyName}, rangeKeyValueToGet: ${rangeKeyValueToGet}, sortKeyName: ${sortKeyName}, sortKeyValueToGet: ${sortKeyValueToGet}}`);
            console.error(`DynamoDB.getByCompositeKey: params: ${JSON.stringify(params)}`);
            console.error(`DynamoDB.getByCompositeKey: ${error}`);
            return {};
        }
    }
    async getBySecondaryHashKey(tableName, indexName, hashKeyName, valueToGet) {
        const params = this.factory.makeQueryParams(tableName, hashKeyName, valueToGet, undefined, undefined, indexName);
        console.log(`DynamoDB.getBySecondaryHashKey: query dynamo paramas: ${JSON.stringify(params)}`);
        try {
            const dynamoResponse = await this.queryDynamo(params);
            return this.factory.fromDynamoEncoding(dynamoResponse.Items[0]);
        }
        catch (error) {
            console.error('DynamoDB.getBySecondaryHashKey: Error getting item by hash key');
            console.error(`DynamoDB.getBySecondaryHashKey: {tableName: ${tableName}, hashKeyName: ${hashKeyName}, valueToGet: ${valueToGet}}`);
            console.error(`DynamoDB.getBySecondaryHashKey: params: ${JSON.stringify(params)}`);
            console.error(`DynamoDB.getBySecondaryHashKey: ${JSON.stringify(error)}`);
            return {};
        }
    }
    async getBySecondaryCompositeKeyPaginated(tableName, indexName, hashKeyName, rangeKeyName, hashKeyValue, rangeKeyValue, pageSize, startKey) {
        const params = this.factory.makeQueryParams(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, indexName, pageSize, startKey);
        console.log(`DynamoDB.getBySecondaryCompositeKeyPaginated: query dynamo paramas: ${JSON.stringify(params)}`);
        try {
            const dynamoResponse = await this.queryDynamo(params);
            return this.factory.fromDynamoEncoding(dynamoResponse);
        }
        catch (error) {
            console.error('DynamoDB.getBySecondaryCompositeKeyPaginated: Error getting item by composite key');
            console.error(`DynamoDB.getBySecondaryCompositeKeyPaginated: {tableName: ${tableName}, hashKeyName: ${hashKeyName}, rangeKeyName: ${rangeKeyName}}, hashKeyValue: ${hashKeyValue}}, rangeKeyValue: ${rangeKeyValue}}`);
            console.error(`DynamoDB.getBySecondaryCompositeKeyPaginated: params: ${JSON.stringify(params)}`);
            console.error(`DynamoDB.getBySecondaryCompositeKeyPaginated: ${JSON.stringify(error)}`);
            return {};
        }
    }
    async batchWrite(tableName, input) {
        if (input.length === 0) {
            return;
        }
        else if (input.length <= 25) {
            await this.write25(tableName, input);
            return;
        }
        else {
            const first25 = input.slice(0, 25);
            await this.write25(tableName, first25);
            return await this.batchWrite(tableName, input.slice(25));
        }
    }
    //////////////////////
    // HELPER FUNCTIONS //
    //////////////////////
    async queryDynamo(params) {
        const returnedItemsObject = await this.client.query(params).promise();
        if (returnedItemsObject && returnedItemsObject.hasOwnProperty('Items') && returnedItemsObject.Items && returnedItemsObject.Items.hasOwnProperty('length') && returnedItemsObject.Items.length > 0) {
            return returnedItemsObject;
        }
        else {
            throw new Error('No Items were found in Dynamo using this query');
        }
    }
    async write25(tableName, batch) {
        const inputParams = this.factory.chunk25(tableName, batch);
        try {
            await this.client.batchWriteItem(inputParams).promise();
        }
        catch (error) {
            console.error(`${error}\n Input Params: \n${JSON.stringify(inputParams)}`);
        }
    }
}
exports.default = DynamoDB;
