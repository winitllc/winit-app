import { Injectable } from '@angular/core';
import { model, util } from 'wuzinit-common';
import { EnvironmentConfig } from '../environment.config';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { CacheService } from './cache.service';
import { ProfileService } from '../profile/profile.service';
import { ProfileState } from '../profile/profile.state';
// import { OAuthService } from './oauth.service';
import { AuthState } from './auth.state';
import { Profile } from 'wuzinit-common/dist/view';
import { Observable, catchError, retry, tap, throwError } from 'rxjs';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  httpHeader = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  httpTokenHeader = {
    headers: new HttpHeaders({
      Authorization: 'Bearer ' + AuthService.AccessToken,
    }),
  };
  static AccessToken = '';

  // Static Functions //
  //////////////////////
  private static tokensExpired(tokensObject: model.CognitoTokens): boolean {
    if (!tokensObject.hasOwnProperty('expires_at')) {
      console.log(
        'AuthService.tokensExpired: no expires_at token in the tokens object, must be a new install'
      );
      return true;
    }
    const timeNow = Date.now() / 1000;
    const isTokenExpired = tokensObject.expires_at < timeNow;
    console.log(
      `AuthService.tokensExpired: the token is set to expire at ${new Date(
        tokensObject.expires_at
      )}`
    );
    console.log(
      `AuthService.tokensExpired: it is currently ${new Date(timeNow)}`
    );
    console.log(
      `AuthService.tokensExpired: ${tokensObject.expires_at} < ${timeNow} = ${isTokenExpired}`
    );
    return isTokenExpired;
  }

  // Instance Functions //
  ////////////////////////

  constructor(
    private cache: CacheService,
    private profileService: ProfileService,
    private profileState: ProfileState,
    // private oauthService: OAuthService,
    private authState: AuthState,
    private http: HttpClient,
    private storage: Storage
  ) {}

  public async setup(): Promise<void> {
    try {
      // await this.setupOAuth();
      // await this.setupIAM();
      await this.setupSpoonacular();
      await this.profileService.fetchProfileData();
    } catch (error) {
      console.error(
        `AuthService.setup: [ERROR] Auth Setup error!\nError object: ${JSON.stringify(
          error
        )}`
      );
      throw error;
    }
  }

  public async logout(): Promise<void> {
    try {
      this.authState.reset();
      this.profileState.reset();
      await this.cache.clearCache();
      console.log(`AuthService.logout: [DEBUG] cache has been cleared`);
    } catch (error) {
      console.error(
        `AuthService.logout: [ERROR] error logging out: ${JSON.stringify(
          error
        )}`
      );
    }
  }

  loginAPI(user: any) {
    return this.http.post<any>(
      'https://winitclinic.com/api/v1/accounts/signin',
      JSON.stringify(user),
      this.httpHeader
    );
  }

  registerAPI(user: any) {
    return this.http.post<any>(
      'https://winitclinic.com/api/v1/accounts/signup',
      JSON.stringify(user),
      this.httpHeader
    );
  }

  patientregisterAPI(user: any) {
    return this.http.post<any>(
      'https://winitclinic.com/api/v1/patient/accounts/signup',
      JSON.stringify(user),
      this.httpHeader
    );
  }

  // Handle API errors
  handleError(error: HttpErrorResponse) {
    if (error.error instanceof ErrorEvent) {
      // A client-side or network error occurred. Handle it accordingly.
      console.error('An error occurred:', error.error.message);
    } else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong,
      console.log(error);
      console.error(
        `Backend returned code ${error.status}, ` + `body was: ${error.error}`
      );
    }
    // return an observable with a user-facing error message
    return throwError('Something bad happened; please try again later.');
  }

  private async setupSpoonacular(): Promise<void> {
    try {
      const goodSpoonacularKey = await this.goodSpoonacularAPIKey();
      if (!goodSpoonacularKey) {
        console.log('AuthService.setup: [INFO] fetching api key');
        const newSpoonacularAPIKey: string =
          await this.fetchSpoonacularAPIKey();
        console.log(
          `AuthService.setup: [DEBUG] recieved new spoonacular api key: ${newSpoonacularAPIKey}`
        );
        this.authState.setSpoonacularAPIKey(newSpoonacularAPIKey);
        this.cache.putItem('spoonacularAPIKey', newSpoonacularAPIKey);
      }
    } catch (error) {
      console.error(
        `AuthService.setupSpoonacular: [ERROR] error setting up Spoonacular: ${JSON.stringify(
          error
        )}`
      );
      throw error;
    }
  }

  private async goodOAuthTokens(): Promise<boolean> {
    try {
      const storedOAuthTokens: model.CognitoTokens = await this.cache.getItem(
        'oauthTokens'
      );
      console.log(
        `AuthService.goodOAuthTokens: [DEBUG] storedOAuthTokens: ${JSON.stringify(
          storedOAuthTokens
        )}`
      );
      if (storedOAuthTokens && storedOAuthTokens.access_token) {
        if (
          AuthService.tokensExpired(storedOAuthTokens) &&
          storedOAuthTokens.refresh_token
        ) {
          // refresh
          return false;
        } else if (AuthService.tokensExpired(storedOAuthTokens)) {
          // re-login
          return false;
        } else {
          // logged in
          return true;
        }
      } else {
        // not logged in
        return false;
      }
    } catch (error) {
      console.error(
        `AuthService.goodOAuthTokens: [ERROR] something went wrong: ${JSON.stringify(
          error
        )}`
      );
      return false;
    }
  }

  private async goodSpoonacularAPIKey(): Promise<boolean> {
    try {
      let authStateAPIKey: string;
      try {
        authStateAPIKey = this.authState.getSpoonacularAPIKey();
      } catch {
        authStateAPIKey = '';
      }
      if (authStateAPIKey && authStateAPIKey.length > 0) {
        return true;
      }
      const storedSpoonacularAPIKey: string = await this.cache.getItem(
        'spoonacularAPIKey'
      );
      console.log(
        `AuthService.goodSpoonacularAPIKey: [DEBUG] storedSpoonacularAPIKey: ${JSON.stringify(
          storedSpoonacularAPIKey
        )}`
      );
      if (storedSpoonacularAPIKey) {
        return true;
      } else {
        // no api key
        return false;
      }
      return true;
    } catch (error) {
      console.error(
        `AuthService.goodSpoonacularAPIKey: [ERROR] error checking IAM credentials: ${JSON.stringify(
          error
        )}`
      );
      return false;
    }
  }

  private async fetchSpoonacularAPIKey(): Promise<string> {
    try {
      const fetchSpoonacularAPIKeyURL = `${EnvironmentConfig.api.utilService.baseUrl}${EnvironmentConfig.api.utilService.spoonacularAPIKey}`;
      console.log(
        `Auth.fetchSpoonacularAPIKey: fetching chomp API Key: ${fetchSpoonacularAPIKeyURL}`
      );
      const requestOptions = {
        url: fetchSpoonacularAPIKeyURL,
        headers: this.authState.getAuthHeaders(),
      };
      const spoonacularAPIKeyResults: HttpResponse = await CapacitorHttp.get(
        requestOptions
      );
      if (spoonacularAPIKeyResults.hasOwnProperty('data')) {
        return spoonacularAPIKeyResults.data as string;
      } else {
        throw new Error(
          `Error fetching Spoonacular API Key, response: ${JSON.stringify(
            spoonacularAPIKeyResults
          )}`
        );
      }
    } catch (error) {
      console.error(
        `Auth.fetchSpoonacularAPIKey: error fetching chomp API Key: ${JSON.stringify(
          error
        )}`
      );
      return '';
    }
  }
}
