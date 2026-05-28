import { CredentialProviderChain } from 'aws-sdk';
export default class KMS {
    private client;
    constructor(credentialProvider?: CredentialProviderChain);
    decrypt(encryptedString: string): Promise<string>;
}
