import { Handler } from 'aws-lambda';
import 'source-map-support/register';
import ProfileController from './controller';
import ProfileService from './service';
import ProfileFactory from './factory';
import { view, model, requestModel } from 'wuzinit-common';

const factory = new ProfileFactory();
const controller = new ProfileController(new ProfileService(factory), factory);

const corsHeaders = { 'Access-Control-Allow-Origin': '*' };

export const getProfileById: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  try {
    const profileView: view.Profile | string = await controller.getProfileById(event.queryStringParameters.profileId);
    if (typeof profileView === 'string') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: profileView,
          data: {}
        }, null, 2),
      };
    } else {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Found a profile',
          data: profileView
        }, null, 2),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error, null, 2)
    };
  }
}

export const getProfileByEmail: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  try {
    const profileView: view.Profile | string = await controller.getProfileByEmail(event.queryStringParameters.profileEmail);
    if (typeof profileView === 'string') {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: profileView,
          data: {}
        }, null, 2),
      };
    } else {
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({
          message: 'Found a profile',
          data: profileView
        }, null, 2),
      };
    }
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error, null, 2)
    };
  }
}

export const updateProfile: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  try {
    console.log(`ProfileHandler.updateProfile: event: ${JSON.stringify(event)}`);
    const postBody: any = JSON.parse(event.body);
    console.log(`ProfileHandler.updateProfile: postBody: ${JSON.stringify(postBody)}`);
    await controller.updateProfile(postBody);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'profile updated',
        data: {}
      }, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error, null, 2)
    };
  }
}

export const createProfile: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  try {
    console.log(`ProfileHandler.createProfile: event: ${JSON.stringify(event)}`);
    const postBody: any = JSON.parse(event.body);
    console.log(`ProfileHandler.createProfile: postBody: ${JSON.stringify(postBody)}`);
    const newProfile = await controller.createProfile(postBody);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'profile updated',
        data: newProfile
      }, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error, null, 2)
    };
  }
}

export const getProfilePoints: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  try {
    const profilePoints: model.WuzinitPoints = await controller.getProfilePoints(event.queryStringParameters.profileId);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Found profile points',
        data: profilePoints
      }, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error, null, 2)
    };
  }
}

export const updateProfilePoints: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  try {
    console.log(`ProfileHandler.updateProfilePoints: event: ${JSON.stringify(event)}`);
    const postBody: any = JSON.parse(event.body);
    console.log(`ProfileHandler.updateProfilePoints: postBody: ${JSON.stringify(postBody)}`);
    await controller.updateProfilePoints(postBody);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'profile updated',
        data: {}
      }, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error, null, 2)
    };
  }
}

export const getFeatures: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  try {
    const features: model.PremiumFeature[] = await controller.getFeatures();
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Found profile points',
        features
      }, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error, null, 2)
    };
  }
}

export const makePurchase: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  try {
    console.log(`ProfileHandler.makePurchase: event: ${JSON.stringify(event)}`);
    const postBody: any = JSON.parse(event.body);
    console.log(`ProfileHandler.makePurchase: postBody: ${JSON.stringify(postBody)}`);
    const purchaseConfirmation: model.PremiumFeaturePurchaseConfirmation = await controller.makePurchase(postBody as requestModel.PremiumFeaturePurchaseRequest);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'profile updated',
        purchaseConfirmation
      }, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error, null, 2)
    };
  }
}

export const storeInAppPurchaseConfirmation: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  try {
    console.log(`ProfileHandler.storeInAppPurchaseConfirmation: event: ${JSON.stringify(event)}`);
    const postBody: any = JSON.parse(event.body);
    console.log(`ProfileHandler.storeInAppPurchaseConfirmation: postBody: ${JSON.stringify(postBody)}`);
    await controller.storeInAppPurchaseConfirmation(postBody as model.InAppPurchaseConfirmation);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'profile updated'
      }, null, 2)
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error, null, 2)
    };
  }
}

export const getInAppPurchaseConfirmationsByProfileId: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  try {
    const postBody: any = JSON.parse(event.body);
    const inAppPurchaseConfirmation: model.InAppPurchaseConfirmation[] = await controller.getInAppPurchaseConfirmationsByProfileId(postBody.profileId);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Found in app purchase confirmations for user id',
        inAppPurchaseConfirmation
      }, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error, null, 2)
    };
  }
}

export const getPremiumFeaturePurchaseConfirmationsByProfileId: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  try {
    const postBody: any = JSON.parse(event.body);
    const premiumFeaturePurchaseConfirmation: model.PremiumFeaturePurchaseConfirmation[] = await controller.getPremiumFeaturePurchaseConfirmationsByProfileId(postBody.profileId);
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: 'Found profile points',
        premiumFeaturePurchaseConfirmation
      }, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify(error, null, 2)
    };
  }
}
