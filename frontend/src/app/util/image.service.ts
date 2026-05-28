import { Injectable } from '@angular/core';
import { EnvironmentConfig } from '../environment.config';
import { DetectTextCommand, DetectTextCommandInput, RekognitionClient, TextDetection } from "@aws-sdk/client-rekognition";
import { Camera, CameraResultType, CameraSource, Photo } from '@capacitor/camera';
import { AuthState } from './auth.state';
import { util } from 'wuzinit-common';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';

@Injectable({
  providedIn: 'root'
})
export default class ImageService {

  credentials: util.AWSCredentials;
  rekognitionClient;

  constructor(
    private auth: AuthState
  ) {
    const credentials: util.AWSCredentials = this.auth.getIAMCredentials();
    this.credentials = credentials;
    console.log(`ImageService.constructor: IAM credentials: ${JSON.stringify(credentials)}`);
    this.rekognitionClient = new RekognitionClient({
      region: 'us-west-2',
      credentials: {
        accessKeyId: this.credentials.accessKeyId,
        secretAccessKey: this.credentials.secretAccessKey
      },
    });
  }

  async callImageToText(imageToUpload: string): Promise<any> {
    console.log(`ImageService.callImageToText: image to upload ${imageToUpload}`);
    const hashName = `testName`;
    const filename = `${Date.now()}-${hashName}.jpg`;
    const imageKey = `imageToText/${filename}`;
    console.log(`ImageService.uploadImageToS3: imageKey: ${imageKey}`);
    const callImageToTextURL = EnvironmentConfig.api.imageService.baseUrl + EnvironmentConfig.api.imageService.imageToText;
    const requestOptions: HttpOptions = {
      url: callImageToTextURL,
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json'
      },
      data: {
        imageKey,
        imageToUpload
      }
    };
    console.log(`ImageService.callImageToText: uploadBody prepared: ${JSON.stringify(requestOptions)}`);
    try {
      const imageToTextResponse: any = await CapacitorHttp.post(requestOptions);
      if (imageToTextResponse.status == 200) {
        console.log(`ImageService.callImageToText:  ${JSON.stringify(imageToTextResponse)}`);
        return {
          imageKey: imageToTextResponse.data.imageKey,
          imageText: imageToTextResponse.data.imageText
        };
      } else {
        throw new Error(`ImageService.callImageToText - call to backend: ${JSON.stringify(imageToTextResponse)}`);
      }
    } catch (error) {
      console.error(`ImageService.callImageToText: error ${error}`);
      throw error;
    }
  }

  async callUploadToS3(imageToUpload: string, hashName?: string): Promise<string> {
    console.log(`ImageService.callUploadToS3: image to upload ${imageToUpload}`);
    const filename = `${Date.now()}-${hashName || `testName`}.jpg`;
    const imageKey = `imageToReview/${filename}`;
    console.log(`ImageService.uploadImageToS3: imageKey: ${imageKey}`);
    const callUploadToS3URL = EnvironmentConfig.api.imageService.baseUrl + EnvironmentConfig.api.imageService.uploadToS3;
    const requestOptions: HttpOptions = {
      url: callUploadToS3URL,
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Content-Type': 'application/json'
      },
      data: {
        imageKey,
        imageToUpload
      }
    };
    console.log(`ImageService.uploadImageToS3: uploadBody prepared: ${JSON.stringify(requestOptions)}`);
    try {
      const uploadToS3Response: any = await CapacitorHttp.post(requestOptions);
      console.log(`ImageService.callUploadToS3: response  ${JSON.stringify(uploadToS3Response)}`);
      console.log(`ImageService.uploadImageToS3: imageKey: ${imageKey}`);
      if (uploadToS3Response.status == 200) {
        return imageKey;
      } else {
        throw new Error(`ImageService.callUploadToS3 - call to backend: ${JSON.stringify(uploadToS3Response)}`);
      }
    } catch (error) {
      console.error(`ImageService.callUploadToS3: error ${error}`);
      throw error;
    }
  }

  async captureImagePhoto(): Promise<Photo> {
    console.log(`AddProductModalPage.captureImagePhoto: capture image selected`);
    try {
      const imageData = await Camera.getPhoto({
        quality: 2,
        allowEditing: false,
        resultType: CameraResultType.Uri,
        source: CameraSource.Camera
      });
      console.log(`AddProductModalComponent.captureImagePhoto: imageData: ${JSON.stringify(imageData)}`);
      return imageData || {
        "webPath":"",
        "exif":{},
        "format":"",
        "saved":false,
        "path":""
      };
    } catch (error) {
      console.error(`AddProductModalPage.captureImagePhoto: error from camera: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async captureImageDataURL(): Promise<string> {
    console.log(`AddProductModalPage.captureImageBase64: capture image selected`);
    try {
      const imageData = await Camera.getPhoto({
        quality: 2,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera
      });
      console.log(`AddProductModalComponent.captureImageBase64: imageData keys: ${JSON.stringify(Object.keys(imageData))}`);
      // console.log(`AddProductModalComponent.captureImageBase64: imageData: ${JSON.stringify(imageData)}`);
      return imageData.dataUrl || '';
    } catch (error) {
      console.error(`AddProductModalPage.captureImageBase64: error from camera: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async captureImageBase64(): Promise<string> {
    console.log(`AddProductModalPage.captureImageBase64: capture image selected`);
    try {
      const imageData = await Camera.getPhoto({
        quality: 2,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      console.log(`AddProductModalComponent.captureImageBase64: imageData keys: ${JSON.stringify(Object.keys(imageData))}`);
      // console.log(`AddProductModalComponent.captureImageBase64: imageData: ${JSON.stringify(imageData)}`);
      return imageData.base64String || '';
    } catch (error) {
      console.error(`AddProductModalPage.captureImageBase64: error from camera: ${JSON.stringify(error)}`);
      throw error;
    }
  }
}
