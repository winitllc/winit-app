import { Rekognition as Client, CredentialProviderChain, AWSError } from 'aws-sdk';

export default class Rekognition {

  private client: Client;

  constructor (credentialProvider?: CredentialProviderChain) {
    this.client = new Client({region: 'us-west-2', credentialProvider: credentialProvider || undefined});
  }

  async imageToText(imageData: string): Promise<string> {
    var params = {
      Image: {
        Bytes: imageData
      }
    };
    try {
      const rekognitionResponse: any = await this.client.detectText(params).promise();
      console.log(`Rekognition.imageToText: response from Rekognition: ${JSON.stringify(rekognitionResponse)}`);
      const detectedText: string[] = rekognitionResponse.TextDetections.map((detectionObject: any): string => {
        return detectionObject.DetectedText;
      });
      return detectedText.join(' ');
    } catch (error) {
      console.error(`Rekognition.imageToText: error detecting text in image: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
