import { CredentialProviderChain } from 'aws-sdk';
export default class S3 {
    private client;
    constructor(credentialProvider?: CredentialProviderChain);
    storeObject(object: string, bucket: string, key: string): Promise<void>;
}
