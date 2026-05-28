export default class DynamoDBFactory {

  interpretScanResult(scanResult: any): any {

    const resultsObject: any = {
      results: scanResult.Items ? scanResult.Items.map((scanResultItem: any): any => {
        return this.fromDynamoEncoding(scanResultItem);
      }) : []
    };
    if (scanResult.LastEvaluatedKey) {
      resultsObject.lastEvaluatedKey = scanResult.LastEvaluatedKey;
    }
    return resultsObject;
  }

  makeScanParams(tableName: string, pageSize: number, searchKey?: string, searchString?: string, startKey?: any): any {
    console.log(`DynamoDBFactory.makeScanParams: beginning of function: tableName: ${tableName}, pageSize: ${pageSize}, searchKey: ${searchKey}, searchString: ${searchString}, startKey: ${startKey}`);
    const params: any = {
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

  makePutItemParams(tableName: string, item: any): any {
    return {
      Item: this.buildPutRequestItem(item),
      TableName: tableName
    };
  }

  makeGetItemParams(tableName: string, rangeKeyName: string, rangeKeyValueToGet: string, sortKeyName?: string, sortKeyValueToGet?: string): any {
    const paramKeyValue: any = {};
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

  private makeQueryKeyConditionExpression(hashKeyName: string, rangeKeyName?: string): string {
    return rangeKeyName ? `${hashKeyName} = :hashValue && ${rangeKeyName} = :rangeValue` : `${hashKeyName} = :hashValue`;
  }

  private makeQueryExpressionAttributeValues(hashKeyValue: string, rangeKeyValue?: string): any {
    const expressionAttributeValues: any = {
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

  makeQueryParams(tableName: string, hashKeyName: string, hashKeyValue: string, rangeKeyName?: string, rangeKeyValue?: string, indexName?: string, pageSize?: number, startKey?: any): any {
    const params: any = {
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

  fromDynamoEncoding (itemFromDynamo: any): any {
    const decodedItem: any = {};

    if (Boolean(itemFromDynamo) && Object.keys(itemFromDynamo).length > 0) {
      Object.keys(itemFromDynamo).forEach((key: any) => {
        if (itemFromDynamo[key].hasOwnProperty('M')) {
          decodedItem[key] = this.fromDynamoEncoding(itemFromDynamo[key].M);
        } else if (itemFromDynamo[key].hasOwnProperty('L')) {
          decodedItem[key] = itemFromDynamo[key].L.map(this.extractListItemAttribute);
        } else if (itemFromDynamo[key].hasOwnProperty('N')) {
          decodedItem[key] = Number(itemFromDynamo[key].N);
        } else if (itemFromDynamo[key].hasOwnProperty('S')) {
          decodedItem[key] = itemFromDynamo[key].S;
        } else if (itemFromDynamo[key].hasOwnProperty('BOOL')) {
          decodedItem[key] = Boolean(itemFromDynamo[key].BOOL);
        }
      });
    }

    return decodedItem;
  }

  chunk25 (tableName: string, batch: any[]): any {
    const inputParams: any = {
      RequestItems: {}
    };
    const requestItems: any[] = [];

    batch.forEach((putRequestInput: any) => {
      const item: any = this.buildPutRequestItem(putRequestInput);
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
  private buildPutRequestItem (putRequestInputObject: any): any {
    const item: any = {};
    Object.keys(putRequestInputObject).forEach((key: any) => {
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

  private buildPutRequestItemAttribute (putRequestInputAttribute: any, key: string): any {
    const itemVal: any = {};
    if (typeof putRequestInputAttribute[key] === 'boolean') {
      itemVal['BOOL'] = String(putRequestInputAttribute[key]);
    } else if (typeof putRequestInputAttribute[key] === 'number') {
      itemVal['N'] = String(putRequestInputAttribute[key]);
    } else if (typeof putRequestInputAttribute[key] === 'string') {
      itemVal['S'] = putRequestInputAttribute[key];
    } else if (typeof putRequestInputAttribute[key] === 'object' && putRequestInputAttribute[key].length >= 0) {
      itemVal['L'] = putRequestInputAttribute[key].filter((putRequestInputListObject: any): any => {
        if (putRequestInputListObject === undefined || putRequestInputListObject === null
          || putRequestInputListObject === {} || putRequestInputListObject === []
          || putRequestInputListObject === '' || putRequestInputListObject.length === 0
          || Object.keys(putRequestInputListObject).length === 0) {
          return false;
        }
        return true;
      }).map((putRequestInputListObject: any): any => {
        if (typeof putRequestInputListObject === 'number') {
          return {'N': String(putRequestInputListObject)};
        } else if (typeof putRequestInputListObject === 'string') {
          return {'S': putRequestInputListObject};
        } 
        return {'M': this.buildPutRequestItem(putRequestInputListObject)};
      });
    } else if (typeof putRequestInputAttribute[key] === 'object' && Object.keys(putRequestInputAttribute[key]).length > 0) {
      itemVal['M'] = this.buildPutRequestItem(putRequestInputAttribute[key]);
    } else {
      throw new Error(`not sure what we're trying to put into Dynamo: ${JSON.stringify(putRequestInputAttribute[key])}`)
    }
    return itemVal;
  }

  private extractListItemAttribute (listItem: any): any {
    if (listItem.hasOwnProperty('M')) {
      return listItem.M;
    } else if (listItem.hasOwnProperty('N')) {
      return Number(listItem.N);
    } else if (listItem.hasOwnProperty('S')) {
      return listItem.S;
    } else if (listItem.hasOwnProperty('BOOL')) {
      return Boolean(listItem.BOOL);
    }
  }
}
