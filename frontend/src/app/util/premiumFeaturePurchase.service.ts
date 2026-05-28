// import { Injectable } from '@angular/core';
// import { HTTP } from '@ionic-native/http/ngx';
// import { model } from 'wuzinit-common';
// import { EnvironmentConfig } from '../environment.config';
// import { AuthState } from './auth.state';
// import { PremiumFeatureView } from './premiumFeature.view';

// @Injectable({
//   providedIn: 'root'
// })
// export class PremiumFeaturePurchaseService {
  
//   constructor(
//     private http: HTTP,
//     private authState: AuthState
//   ) {
//     console.log(`PremiumFeaturePurchaseService.constructor: PremiumFeaturePurchaseService constructor`);
//   }

//   async getPremiumFeatures(): Promise<PremiumFeatureView[]> {
//     const getPremiumFeaturesUrl: string = EnvironmentConfig.api.profile.baseUrl + EnvironmentConfig.api.profile.getFeatures;
//     console.log(`PremiumFeaturePurchaseService.getPremiumFeatures: retrieving premium features ${getPremiumFeaturesUrl}`);
//     try {
//       const response: any = await this.http.get(getPremiumFeaturesUrl, {}, this.authState.getAuthHeaders());
//       console.log(`PremiumFeaturePurchaseService.getPremiumFeatures: response from backend: ${JSON.stringify(response)}`);
//       return JSON.parse(response.data).features as PremiumFeatureView[];
//     } catch (error) {
//       console.error(`PremiumFeaturePurchaseService.getPremiumFeatures: error getting the premium features: ${JSON.stringify(error)}`);
//     }
//   }

//   async purchasePremiumFeature(profileId: string, featureId: string, featureTitle: string): Promise<model.PremiumFeaturePurchaseConfirmation> {
//     const purchasePremiumFeatureUrl: string = EnvironmentConfig.api.profile.baseUrl + EnvironmentConfig.api.profile.purchaseFeature;
//     console.log(`PremiumFeaturePurchaseService.getPremiumFeatures: profile ${profileId} purchasing premium feature with feature id ${featureId}: ${purchasePremiumFeatureUrl}`);
//     try {
//       const response: any = await this.http.post(purchasePremiumFeatureUrl, {
//         profileId,
//         featureId,
//         featureTitle
//       }, this.authState.getAuthHeaders());
//       console.log(`PremiumFeaturePurchaseService.purchasePremiumFeature: response from backend: ${JSON.stringify(response)}`);
//       return JSON.parse(response.data).purchaseConfirmation as model.PremiumFeaturePurchaseConfirmation;
//     } catch (error) {
//       console.error(`PremiumFeaturePurchaseService.purchasePremiumFeature: error purchasing the premium feature: ${JSON.stringify(error)}`);
//     }
//   }

// }
