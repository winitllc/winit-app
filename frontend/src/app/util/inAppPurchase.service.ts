// import { Injectable } from "@angular/core";
// import { InAppPurchase } from '@ionic-native/in-app-purchase/ngx';
// import { model, view } from 'wuzinit-common';
// import { HTTP } from '@ionic-native/http/ngx';
// import { EnvironmentConfig } from '../environment.config';
// import { AuthState } from './auth.state';

// @Injectable({
//   providedIn: 'root'
// })
// export class InAppPurchaseService {
  
//   constructor(
//     private http: HTTP,
//     private inAppPurchase: InAppPurchase,
//     private authState: AuthState
//   ) {}

//   async getProducts(productIds: string[]): Promise<view.InAppPurchaseProduct[]> {
//     try {
//       console.log(`InAppPurchaseService.getProducts: [DEBUG] getting products with product ids: ${productIds}`);
//       const products = await this.inAppPurchase.getProducts(productIds);
//       console.log(`InAppPurchaseService.getProducts: [DEBUG] products returned from apple: ${JSON.stringify(products)}`);
//       return products as view.InAppPurchaseProduct[];
//     } catch (error) {
//       console.error(`InAppPurchaseService.getProducts: [ERROR] error getting the products: ${JSON.stringify(error)}`);
//     }
//   }

//   async buyProduct(productId: string, productTitle: string): Promise<view.InAppPurchaseConfirmation> {
//     try {
//       console.log(`InAppPurchaseService.buyProduct: [DEBUG] buying product with product id: ${productId}`);
//       const result: any = await this.inAppPurchase.buy(productId);
//       console.log(`InAppPurchaseService.buyProduct: [DEBUG] result returned from apple: ${JSON.stringify(result)}`);
//       result.productTitle = productTitle;
//       return result as view.InAppPurchaseConfirmation;
//     } catch (error) {
//       console.error(`InAppPurchaseService.buyProduct: [ERROR] error getting the products: ${JSON.stringify(error)}`);
//     }
//   }

//   async storeInAppPurchaseConfirmation(inAppPurchaseConfirmation: model.InAppPurchaseConfirmation): Promise<void> {
//     const storeInAppPurchaseConfirmationUrl: string = EnvironmentConfig.api.profile.baseUrl + EnvironmentConfig.api.profile.storeInAppPurchaseConfirmation;
//     console.log(`PremiumFeaturePurchaseService.getPremiumFeatures: [DEBUG] retrieving premium features ${storeInAppPurchaseConfirmationUrl}`);
//     try {
//       const response: any = await this.http.post(storeInAppPurchaseConfirmationUrl, inAppPurchaseConfirmation, this.authState.getAuthHeaders());
//       console.log(`PremiumFeaturePurchaseService.storeInAppPurchaseConfirmation: [DEBUG] response from backend: ${JSON.stringify(response)}`);
//     } catch (error) {
//       console.error(`PremiumFeaturePurchaseService.storeInAppPurchaseConfirmation: [ERROR] error purchasing the premium feature: ${JSON.stringify(error)}`);
//     }
//   }

// }
