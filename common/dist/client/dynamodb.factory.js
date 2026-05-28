"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class DynamoDBFactory {
    interpretScanResult(scanResult) {
        const resultsObject = {
            results: scanResult.Items ? scanResult.Items.map((scanResultItem) => {
                return this.fromDynamoEncoding(scanResultItem);
            }) : []
        };
        if (scanResult.LastEvaluatedKey) {
            resultsObject.lastEvaluatedKey = scanResult.LastEvaluatedKey;
        }
        return resultsObject;
    }
    makeScanParams(tableName, pageSize, searchKey, searchString, startKey) {
        const params = {
            TableName: tableName,
            Limit: pageSize
        };
        if (searchKey && searchString) {
            params.FilterExpression = `contains(${searchKey}, :search)`;
            params.ExpressionAttributeValues = {
                ':search': {
                    S: searchString
                }
            };
        }
        if (startKey) {
            params.ExclusiveStartKey = startKey;
        }
        return params;
    }
    makePutItemParams(tableName, item) {
        return {
            Item: this.buildPutRequestItem(item),
            TableName: tableName
        };
    }
    makeGetItemParams(tableName, rangeKeyName, rangeKeyValueToGet, sortKeyName, sortKeyValueToGet) {
        const paramKeyValue = {};
        paramKeyValue[rangeKeyName] = {
            S: rangeKeyValueToGet
        };
        if (sortKeyName && sortKeyValueToGet) {
            paramKeyValue[sortKeyName] = {
                S: sortKeyValueToGet
            };
        }
        return {
            Key: paramKeyValue,
            TableName: tableName
        };
    }
    makeQueryKeyConditionExpression(hashKeyName, rangeKeyName) {
        return rangeKeyName ? `${hashKeyName} = :hashValue && ${rangeKeyName} = :rangeValue` : `${hashKeyName} = :hashValue`;
    }
    makeQueryExpressionAttributeValues(hashKeyValue, rangeKeyValue) {
        const expressionAttributeValues = {
            ':hashValue': {
                S: hashKeyValue
            }
        };
        if (rangeKeyValue) {
            expressionAttributeValues[':rangeValue'] = {
                S: rangeKeyValue
            };
        }
        return expressionAttributeValues;
    }
    makeQueryParams(tableName, hashKeyName, hashKeyValue, rangeKeyName, rangeKeyValue, indexName, pageSize, startKey) {
        const params = {
            TableName: tableName,
            IndexName: indexName,
            KeyConditionExpression: this.makeQueryKeyConditionExpression(hashKeyName, rangeKeyName),
            ExpressionAttributeValues: this.makeQueryExpressionAttributeValues(hashKeyValue, rangeKeyValue)
        };
        if (pageSize) {
            params.Limit = pageSize;
        }
        if (startKey) {
            params.ExclusiveStartKey = startKey;
        }
        return params;
    }
    fromDynamoEncoding(itemFromDynamo) {
        const decodedItem = {};
        if (Boolean(itemFromDynamo) && Object.keys(itemFromDynamo).length > 0) {
            Object.keys(itemFromDynamo).forEach((key) => {
                if (itemFromDynamo[key].hasOwnProperty('M')) {
                    decodedItem[key] = this.fromDynamoEncoding(itemFromDynamo[key].M);
                }
                else if (itemFromDynamo[key].hasOwnProperty('L')) {
                    decodedItem[key] = itemFromDynamo[key].L.map(this.extractListItemAttribute);
                }
                else if (itemFromDynamo[key].hasOwnProperty('N')) {
                    decodedItem[key] = Number(itemFromDynamo[key].N);
                }
                else if (itemFromDynamo[key].hasOwnProperty('S')) {
                    decodedItem[key] = itemFromDynamo[key].S;
                }
                else if (itemFromDynamo[key].hasOwnProperty('BOOL')) {
                    decodedItem[key] = Boolean(itemFromDynamo[key].BOOL);
                }
            });
        }
        return decodedItem;
    }
    chunk25(tableName, batch) {
        const inputParams = {
            RequestItems: {}
        };
        const requestItems = [];
        batch.forEach((putRequestInput) => {
            const item = this.buildPutRequestItem(putRequestInput);
            requestItems.push({
                PutRequest: {
                    Item: item
                }
            });
        });
        inputParams.RequestItems[tableName] = requestItems;
        return inputParams;
    }
    // HELPER FUNCTIONS //
    //////////////////////
    buildPutRequestItem(putRequestInputObject) {
        const item = {};
        Object.keys(putRequestInputObject).forEach((key) => {
            if (putRequestInputObject[key] === undefined
                || putRequestInputObject[key] === null
                || putRequestInputObject[key] === {}
                // || putRequestInputObject[key] === []
                || putRequestInputObject[key] === ''
                || (typeof putRequestInputObject[key] === 'object'
                    && (putRequestInputObject[key].length === 0
                        || Object.keys(putRequestInputObject[key]).length === 0))) {
                return;
            }
            item[key] = this.buildPutRequestItemAttribute(putRequestInputObject, key);
        });
        return item;
    }
    buildPutRequestItemAttribute(putRequestInputAttribute, key) {
        const itemVal = {};
        if (typeof putRequestInputAttribute[key] === 'boolean') {
            itemVal['BOOL'] = String(putRequestInputAttribute[key]);
        }
        else if (typeof putRequestInputAttribute[key] === 'number') {
            itemVal['N'] = String(putRequestInputAttribute[key]);
        }
        else if (typeof putRequestInputAttribute[key] === 'string') {
            itemVal['S'] = putRequestInputAttribute[key];
        }
        else if (typeof putRequestInputAttribute[key] === 'object' && putRequestInputAttribute[key].length >= 0) {
            itemVal['L'] = putRequestInputAttribute[key].filter((putRequestInputListObject) => {
                if (putRequestInputListObject === undefined || putRequestInputListObject === null
                    || putRequestInputListObject === {} || putRequestInputListObject === []
                    || putRequestInputListObject === '' || putRequestInputListObject.length === 0
                    || Object.keys(putRequestInputListObject).length === 0) {
                    return false;
                }
                return true;
            }).map((putRequestInputListObject) => {
                if (typeof putRequestInputListObject === 'number') {
                    return { 'N': String(putRequestInputListObject) };
                }
                else if (typeof putRequestInputListObject === 'string') {
                    return { 'S': putRequestInputListObject };
                }
                return { 'M': this.buildPutRequestItem(putRequestInputListObject) };
            });
        }
        else if (typeof putRequestInputAttribute[key] === 'object' && Object.keys(putRequestInputAttribute[key]).length > 0) {
            itemVal['M'] = this.buildPutRequestItem(putRequestInputAttribute[key]);
        }
        else {
            throw new Error(`not sure what we're trying to put into Dynamo: ${JSON.stringify(putRequestInputAttribute[key])}`);
        }
        return itemVal;
    }
    extractListItemAttribute(listItem) {
        if (listItem.hasOwnProperty('M')) {
            return listItem.M;
        }
        else if (listItem.hasOwnProperty('N')) {
            return Number(listItem.N);
        }
        else if (listItem.hasOwnProperty('S')) {
            return listItem.S;
        }
        else if (listItem.hasOwnProperty('BOOL')) {
            return Boolean(listItem.BOOL);
        }
    }
}
exports.default = DynamoDBFactory;
