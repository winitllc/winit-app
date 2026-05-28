import { Config } from './config';
import { client, util } from 'wuzinit-common';

export default class KMSService {

    kmsClient: client.KMS;

    constructor() {
        this.kmsClient = new client.KMS();
    }

    async getSpoonacularAPIKey(): Promise<string> {
        const decryptedSpoonacularAPIKey: string = await this.kmsClient.decrypt(Config.kmsService.encryptedSpoonacularAPIKey);
        console.log(`KMSService.getSpoonacularAPIKey: decryptedSpoonacularAPIKey: ${decryptedSpoonacularAPIKey}`);
        return decryptedSpoonacularAPIKey;
    }

    async getAWSCredentials(): Promise<util.AWSCredentials> {
        const decryptedAccessKey: string = await this.kmsClient.decrypt(Config.kmsService.encryptedAccessKey);
        const decryptedSecretKey: string = await this.kmsClient.decrypt(Config.kmsService.encryptedSecretKey);
        console.log(`KMSService.getAWSCredentials: decryptedAccessKey: ${decryptedAccessKey}, decryptedSecretKey: ${decryptedSecretKey}`);
        return {
            accessKeyId: decryptedAccessKey,
            secretAccessKey: decryptedSecretKey
        };
    }
}
