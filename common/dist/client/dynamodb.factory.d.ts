export default class DynamoDBFactory {
    interpretScanResult(scanResult: any): any;
    makeScanParams(tableName: string, pageSize: number, searchKey?: string, searchString?: string, startKey?: any): any;
    makePutItemParams(tableName: string, item: any): any;
    makeGetItemParams(tableName: string, rangeKeyName: string, rangeKeyValueToGet: string, sortKeyName?: string, sortKeyValueToGet?: string): any;
    private makeQueryKeyConditionExpression;
    private makeQueryExpressionAttributeValues;
    makeQueryParams(tableName: string, hashKeyName: string, hashKeyValue: string, rangeKeyName?: string, rangeKeyValue?: string, indexName?: string, pageSize?: number, startKey?: any): any;
    fromDynamoEncoding(itemFromDynamo: any): any;
    chunk25(tableName: string, batch: any[]): any;
    private buildPutRequestItem;
    private buildPutRequestItemAttribute;
    private extractListItemAttribute;
}
