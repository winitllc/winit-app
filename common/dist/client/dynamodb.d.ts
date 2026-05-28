import { CredentialProviderChain } from 'aws-sdk';
export default class DynamoDB {
    private client;
    private factory;
    constructor(credentialProvider?: CredentialProviderChain);
    searchStringPaginated(tableName: string, searchKey: string, searchString: string, pageSize: number, startKey?: any): Promise<any>;
    getAllPaginated(tableName: string, pageSize: number, startKey?: any): Promise<any>;
    putItem(tableName: string, item: any): Promise<void>;
    deleteItemByHashKey(tableName: string, hashKeyName: string, valueToDelete: string): Promise<void>;
    getByHashKey(tableName: string, hashKeyName: string, valueToGet: string): Promise<any>;
    getByRangeKey(tableName: string, rangeKeyName: string, rangeKeyValueToGet: string, pageSize: number, startKey?: any): Promise<any[]>;
    getByCompositeKey(tableName: string, rangeKeyName: string, rangeKeyValueToGet: string, sortKeyName: string, sortKeyValueToGet: string): Promise<any>;
    getBySecondaryHashKey(tableName: string, indexName: string, hashKeyName: string, valueToGet: string): Promise<any>;
    getBySecondaryCompositeKeyPaginated(tableName: string, indexName: string, hashKeyName: string, rangeKeyName: string, hashKeyValue: string, rangeKeyValue: string, pageSize: number, startKey?: any): Promise<any>;
    batchWrite(tableName: string, input: any[]): Promise<void>;
    private queryDynamo;
    private write25;
}
