import { Config } from './config';
import { client } from 'wuzinit-common';

export default class ImageService {

  s3Client: client.S3;
  rekognitionClient: client.Rekognition;

  constructor () {
    this.s3Client = new client.S3();
    this.rekognitionClient = new client.Rekognition();
  }

  async storeImageInS3(imageDataBase64: string, productBarcode: string): Promise<string> {
    const key: string = this.makeKey(productBarcode);
    const url: string = `${Config.imageService.bucketURL}/${key}.jpg`;
    try {
      await this.s3Client.storeObject(imageDataBase64, Config.imageService.bucketName, key);
      return url;
    } catch (error) {
      console.error(`ImageService.storeImageInS3: error storing object in S3: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async imageToText(imageData: string): Promise<string> {
    try {
      const textFromImage: string = await this.rekognitionClient.imageToText(imageData);
      console.log(`ImageService.imageToText: image from text: ${textFromImage}`);
      return textFromImage;
    } catch (error) {
      console.error(`ImageService.imageToText: error getting text from image: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  private makeKey(productBarcode: string): string {
    return `${Math.random() * 1000000}.${productBarcode}.jpg`
  }
}
