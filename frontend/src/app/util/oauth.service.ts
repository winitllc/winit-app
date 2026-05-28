import { Injectable } from '@angular/core';
import { model, util } from 'wuzinit-common';
import { EnvironmentConfig } from '../environment.config';
import { AppConfig } from '../app.config';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { CacheService } from './cache.service';
import { ProfileService } from '../profile/profile.service';
import { JwtHelperService } from '@auth0/angular-jwt';
// import { encode as base64encode } from 'js-base64';
import { AuthState } from './auth.state';
import { log } from 'console';

@Injectable({
  providedIn: 'root'
})
export class OAuthService {

  // Static Functions //
  //////////////////////
  public static tokensExpired(tokensObject: model.CognitoTokens): boolean {
    if (!tokensObject.hasOwnProperty('expires_at')) {
      console.log('OAuthService.tokensExpired: no expires_at token in the tokens object, must be a new install');
      return true;
    }
    const timeNow = Date.now() / 1000;
    const isTokenExpired = tokensObject.expires_at < timeNow;
    console.log(`OAuthService.tokensExpired: the token is set to expire at ${new Date(tokensObject.expires_at)}`);
    console.log(`OAuthService.tokensExpired: it is currently ${new Date(timeNow)}`);
    console.log(`OAuthService.tokensExpired: ${tokensObject.expires_at} < ${timeNow} = ${isTokenExpired}`);
    return isTokenExpired;
  }

  // Instance Functions //
  ////////////////////////

  constructor(
    private cache: CacheService,
    private authState: AuthState
  ) { }

  public async login(): Promise<void> {
    await this.cache.clearCache();
    return new Promise(async (resolve, reject) => {
      console.log('OAuthService.login: new Promise invocation');
      const loginURL = `https://${EnvironmentConfig.auth.cognitoDomain}/oauth2/authorize?response_type=code&client_id=${EnvironmentConfig.auth.clientId}&redirect_uri=${EnvironmentConfig.auth.loginSuccessCallbackURL}&scope=${AppConfig.auth.scopes.appUser}`;
      await Browser.open({
        url: loginURL
      });
      // this.iab.create(loginURL, '_blank', {
      //   location: 'no',
      //   toolbar: 'no',
      //   clearcache: 'yes'
      // });
      Browser.addListener('browserFinished', () => {
        console.log('browserFinished event called');
      });
      Browser.addListener('browserPageLoaded', () => {
        console.log('browserPageLoaded event called');
      });
      // browser.on('loadstop').subscribe(async (event: InAppBrowserEvent) => {
      //   try {
      //     await this.handleBrowser(event, 'loadstop', browser, resolve, reject);
      //   } catch (error) {
      //     console.error(`login.browser.onloadstop: [ERROR] error handling browser error: ${JSON.stringify(error)}`);
      //   }
      // });
      // browser.on('loaderror').subscribe(async (event: InAppBrowserEvent) => {
      //   try {
      //     await this.handleBrowser(event, 'loaderror', browser, resolve, reject);
      //   } catch (error) {
      //     console.error(`login.browser.loaderror: [ERROR] error handling browser error: ${JSON.stringify(error)}`);
      //   }
      // });
      // browser.on('loadstart').subscribe(async (event: InAppBrowserEvent) => {
      //   try {
      //     await this.handleBrowser(event, 'loadstart', browser, resolve, reject);
      //   } catch (error) {
      //     console.error(`login.browser.loadstart: [ERROR] error handling browser error: ${JSON.stringify(error)}`);
      //   }
      // });
      // browser.on('exit').subscribe(async () => {
      //   if (!this.authState.isLoggedIn()) {
      //     resolve();
      //   }
      // });
    });
  }

  public async refreshTokens(expiredTokens: model.CognitoTokens): Promise<void> {
    try {
      console.log(`OAuthService.refreshTokens: [DEBUG] calling; client id: ${EnvironmentConfig.auth.clientId}; refresh token: ${expiredTokens.refresh_token}`);
      const body = {
        client_id: EnvironmentConfig.auth.clientId,
        grant_type: 'refresh_token',
        refresh_token: expiredTokens.refresh_token
      };
      console.log(`OAuthService.refreshTokens: [DEBUG] request body: ${JSON.stringify(body)}`);
      // const tokensResponse: model.CognitoTokensResponse = await this.requestTokens(body);
      // tokensResponse.refresh_token = expiredTokens.refresh_token;
      // console.log(`OAuthService.refreshTokens: [DEBUG] new tokens to set: ${JSON.stringify(tokensResponse)}`);
      // await this.setTokens(tokensResponse);
    } catch (error) {
      console.error(`OAuthService.refreshTokens: [ERROR] error refreshing tokens: ${error}`);
    }
  }

  // PRIVATE FUNCTIONS //
  ///////////////////////

  // private async handleBrowser(event: InAppBrowserEvent, type: string, browser: InAppBrowserObject, resolve: (value?: void | PromiseLike<void>) => void, reject: (reason?: any) => void ): Promise<void> {
  //   try {
  //     console.log(`OAuthService.handleBrowser: [DEBUG] browser.${type}: ${JSON.stringify(event)}`);
  //     if (event.url.indexOf(EnvironmentConfig.auth.loginSuccessCallbackURL) === 0 && event.url.indexOf('code=') > -1) {
  //       console.log(`OAuthService.handleBrowser: [DEBUG] - browser.${type}: code in URL`);
  //       const tokensResponse: model.CognitoTokensResponse = await this.exchangeCode(event.url);
  //       console.log(`OAuthService.handleBrowser: [DEBUG] - tokensResponse from exchange: ${JSON.stringify(tokensResponse)}`);
  //       await this.setTokens(tokensResponse);
  //       browser.close();
  //       resolve();
  //     }
  //   } catch (error) {
  //     console.error(`OAuthService.handleBrowser: [ERROR] some weird error happened: ${error}`);
  //     reject(`browser.${type}; some weird error happened: ${JSON.stringify(error)}`);
  //   }
  // }

  // private async exchangeCode(url: string): Promise<model.CognitoTokensResponse> {
  //   const code = this.extractCode(url.split('?')[1]);
  //   console.log(`OAuthService.exchangeCode: [DEBUG] extracted code: ${code}`);
  //   const body = {
  //     client_id: EnvironmentConfig.auth.clientId,
  //     code,
  //     grant_type: 'authorization_code',
  //     redirect_uri: EnvironmentConfig.auth.loginSuccessCallbackURL
  //   };
  //   console.log(`OAuthService.exchangeCode: [DEBUG] body to for code exchange: ${JSON.stringify(body)}`);
  //   try {
  //     const tokensResponse: model.CognitoTokensResponse = await this.requestTokens(body);
  //     console.log(`OAuthService.exchangeCode: [DEBUG] new tokens to set: ${JSON.stringify(tokensResponse)}`);
  //     return tokensResponse;
  //   } catch (error) {
  //     console.error(`OAuthService.exchangeCode: [ERROR] error exchanging tokens with body: ${body}`);
  //     console.error(`OAuthService.exchangeCode: [ERROR] error: ${JSON.stringify(error)}`);
  //   }
  // }

  // private extractCode(uriString: string): string {
  //   return uriString.split('=')[1];
  // }

  // private async setTokens(tokensResponse: model.CognitoTokensResponse): Promise<void> {
  //   try {
  //     const tokens: model.CognitoTokens = this.extractTokens(tokensResponse);
  //     this.authState.setTokens(tokens);
  //     const helper = new JwtHelperService();
  //     const decryptedIDToken: any = helper.decodeToken(tokens.id_token);
  //     console.log(`OAuthService.setTokens: decrypted id token: ${JSON.stringify(decryptedIDToken)}`);
  //     const email = decryptedIDToken.email ? decryptedIDToken.email : '';
  //     console.log(`OAuthService.setTokens: email: ${email}`);
  //     const username = decryptedIDToken['cognito:username'] ? decryptedIDToken['cognito:username'] : '';
  //     console.log(`OAuthService.setTokens: username: ${username}`);
  //     this.authState.setIdData(email, username);
  //     console.log(`OAuthService.setTokens: [DEBUG] auth state updated, updating cache`);
  //     await this.cache.putItem('oauthTokens', tokens);
  //     await this.cache.putItem('username', username);
  //     await this.cache.putItem('email', email);
  //     console.log(`OAuthService.setTokens: [DEBUG] cache updated`);
  //   } catch (error) {
  //     console.error(`OAuthService.setTokens: [ERROR] error setting tokens: ${error}`);
  //     throw error;
  //   }
  // }

  // private extractTokens(tokensResponse: model.CognitoTokensResponse): model.CognitoTokens {
  //   return {
  //     access_token: tokensResponse.access_token,
  //     id_token: tokensResponse.id_token,
  //     refresh_token: tokensResponse.refresh_token,
  //     token_type: tokensResponse.token_type,
  //     expires_at: Math.floor(Date.now() / 1000) + tokensResponse.expires_in
  //   };
  // }

  // private async requestTokens(body: any): Promise<model.CognitoTokensResponse> {
  //   try {
  //     console.log(`OAuthService.requestTokens: [DEBUG] making token exchange request with body: ${JSON.stringify(body)}`);
  //     const authURL = `https://${EnvironmentConfig.auth.cognitoDomain}/oauth2/token`;
  //     console.log(`OAuthService.requestTokens: [DEBUG] making token exchange request with url: ${authURL}`);
  //     const authorizationHeader = `Basic ${base64encode(`${EnvironmentConfig.auth.clientId}:${EnvironmentConfig.auth.clientSecret}`)}`;
  //     console.log(`OAuthService.requestTokens: [DEBUG] making token exchange request with authorizationHeader: ${JSON.stringify(authorizationHeader)}`);
  //     const headers = {
  //       Authorization: authorizationHeader,
  //       'Content-Type': 'application/x-www-form-urlencoded'
  //     };
  //     console.log(`OAuthService.requestTokens: [DEBUG] making token exchange request with headers: ${JSON.stringify(headers)}`);
  //     const response = await this.http.post(authURL, body, headers);
  //     console.log(`OAuthService.requestTokens: [DEBUG] response from token request: ${JSON.stringify(response)}`);
  //     return JSON.parse(response.data) as model.CognitoTokensResponse;
  //   } catch (error) {
  //     console.error(`OAuthService.requestTokens: error requesting tokens with body: ${JSON.stringify(body)}`);
  //     console.error(`OAuthService.requestTokens: error: ${JSON.stringify(error)}`);
  //   }
  // }
}
