import { Injectable } from '@angular/core';
import { model, util } from 'wuzinit-common';
import { JwtHelperService } from '@auth0/angular-jwt';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthState {

  private loggedIn: boolean = false;
  private tokens?: model.CognitoTokens;
  private email: string = '';
  private username: string = '';
  private iamCredentials?: util.AWSCredentials;
  private spoonacularAPIKey: string = '';

  // Instance Functions //
  ////////////////////////

  constructor() { }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  reset(): void {
    this.loggedIn = false;
    this.tokens = undefined;
    this.email = "";
    this.username = "";
    this.iamCredentials = undefined;
  }

  getIDToken(): string {
    if (this.tokens && this.tokens.id_token) {
      return this.tokens.id_token;
    }
    throw new Error(`Error getting the ID Token before it is set`);
  }

  getAuthHeaders(): any {
    const idToken: string = `Bearer ${this.getIDToken()}`;
    return {
      'Authorization': idToken
    };
  }

  getAuthHeader(): any {
    const idToken: string = 'Bearer ' + AuthService.AccessToken;
    return {
      'Authorization': idToken
    };
  }

  getEmail(): string {
    if (this.email) {
      return this.email;
    }
    return '';
  }

  getUsername(): string {
    if (this.username) {
      return this.username;
    }
    return '';
  }

  getIAMCredentials(): util.AWSCredentials {
    if (this.iamCredentials && this.iamCredentials.accessKeyId) {
      return this.iamCredentials;
    }
    return {
      accessKeyId: " "
      secretAccessKey: " "
    };
  }
  
  setIAMCredentials(credentials: util.AWSCredentials): void {
    this.iamCredentials = credentials;
  }

  getSpoonacularAPIKey(): string {
    return '981e3414aaa34454878dc613a3fb91e8'; // TODO: no push
    // if (this.spoonacularAPIKey) {
    //   return this.spoonacularAPIKey;
    // }
    // throw new Error('Trying to get Spoonacular API Key before it is set!');
  }

  setSpoonacularAPIKey(spoonacularAPIKey: string): void {
    console.log(`Not yet implemented`);
  }

  setTokens(tokens: model.CognitoTokens): void {
    this.loggedIn = true;
    this.tokens = tokens;
  }

  setIdData(email: string, username: string): void {
    this.email = email;
    this.username = username;
  }
}
