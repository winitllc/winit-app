import { CredentialProviderChain } from 'aws-sdk';
export default class Rekognition {
    private client;
    constructor(credentialProvider?: CredentialProviderChain);
    imageToText(imageData: string): Promise<string>;
}
