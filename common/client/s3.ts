import { S3 as Client, CredentialProviderChain, AWSError } from 'aws-sdk';

export default class S3 {

  private client: Client;

  constructor (credentialProvider?: CredentialProviderChain) {
    this.client = new Client({region: 'us-west-2', credentialProvider: credentialProvider || undefined});
  }

  async storeObject(object: string, bucket: string, key: string): Promise<void> {
    var params = {
      Body: object, 
      Bucket: bucket, 
      Key: key
    };
    try {
      await this.client.putObject(params).promise();
    } catch (error) {
      console.error(`Rekognition.imageToText: error detecting text in image: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
