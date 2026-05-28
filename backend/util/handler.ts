import { Handler } from 'aws-lambda';
import 'source-map-support/register';
import ImageService from './image.service';
import KMSService from './kms.service';

const imageService = new ImageService();
const kmsService = new KMSService();

export const spoonacularAPIKey: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }

  const spoonacularAPIKey: string = await kmsService.getSpoonacularAPIKey();
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      message: 'Success',
      data: spoonacularAPIKey,
    }, null, 2),
  };
}

export const awsCredentials: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }

  const credentials: any = await kmsService.getAWSCredentials();
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      message: 'Success',
      data: credentials,
    }, null, 2),
  };
}

export const saveImage: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }

  try {
    const postBody: any = JSON.parse(event.body);
    const imageURL: string = await imageService.storeImageInS3(postBody.imageData, postBody.barcode);
    console.log(`UtilHandler.saveImage: image url: ${imageURL}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        imageURL
      }, null, 2),
    };
  } catch (error) {
    console.error(`UtilHandler.saveImage: error saving image: ${JSON.stringify(error)}`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error',
        error
      }, null, 2),
    };
  }
}

export const imageToText: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }

  try {
    const postBody: any = JSON.parse(event.body);
    const textFromImage = await imageService.imageToText(postBody.imageToConvert);
    console.log(`UtilHandler.imageToText: image from text: ${textFromImage}`);
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        textFromImage
      }, null, 2),
    };
  } catch (error) {
    console.error(`UtilHandler.imageToText: error getting image from text: ${JSON.stringify(error)}`);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error',
        error
      }, null, 2),
    };
  }
}
