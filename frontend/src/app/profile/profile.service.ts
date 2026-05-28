import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { model, view } from 'wuzinit-common';
import { EnvironmentConfig } from '../environment.config';
import { ProfileState } from './profile.state';
import { CacheService } from '../util/cache.service';
import { AuthState } from '../util/auth.state';
import { AuthService } from '../util/auth.service';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, retry } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ProfileService {
  constructor(
    private cache: CacheService,
    private state: ProfileState,
    private authState: AuthState,
    private http: HttpClient
  ) {}

  async fetchProfileData() {

    this.getUserProfileData().subscribe(
      async (data: any) => {
        // Handle the response data
        console.log('ProfilePage.fetchProfileData: data fetched from api/accounts/me');
        console.log(`ProfilePage.fetchProfileData: ${JSON.stringify(data)}`);
        const profileData = data['data'];
        console.log(`ProfilePage.fetchProfileData: profile data: ${JSON.stringify(profileData)}`);
        console.log(`ProfilePage.fetchProfileData: profile name: ${profileData.profile.showName}`);
        // console.log(profileData['healthProfiles'][0]['id'] != undefined);
        this.state.setProfile(profileData);
        if (profileData['healthProfiles'] != undefined) {
          if (profileData['healthProfiles'].length > 0) {
            this.getHealthProfileData(profileData);
          }
        }
        const profileID = profileData['id'];
        console.log(`ProfilePage.fetchProfileData: profile ID to fetch: ${profileID}`);
        const profilePoints: model.WuzinitPoints = await this.getProfilePoints(`${profileID}`);
        console.log(`ProfilePage.fetchProfileData: profile points: ${JSON.stringify(profilePoints)}`);
        this.state.setProfilePoints(profilePoints);
      },
      (error) => {
        // Handle errors
        console.error(`ProfilePage.fetchProfileData: [ERROR] ${JSON.stringify(error)}`);
      }
    );
  }

  getHealthProfileData(profileData: any) {
    this
      .getUserHealthProfile(profileData['healthProfiles'][0]['id'])
      .subscribe(
        (data: any) => {
          // Handle the response data
          console.log('ProfilePage.getHealthProfileData: data fetched from health profile api');
          console.log(`ProfilePage.getHealthProfileData: ${JSON.stringify(data)}`);
          const healthProfileData = data['data'];
          this.state.setHealthProfile(data['data']);
          console.log(`ProfilePage.getHealthProfileData: health profile data ${JSON.stringify(healthProfileData)}`);
        },
        (error) => {
          // Handle errors
          console.error(`ProfilePage.getHealthProfileData: [ERROR] ${JSON.stringify(error)}`);
        }
      );
  }

  getUserProfileData(): Observable<any[]> {
    AuthService.AccessToken = AuthService.AccessToken.replace(/\s+$/, '');
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + AuthService.AccessToken,
      // Add any other headers if needed
    });

    return this.http
      .get<any>(`https://winitclinic.com/api/v1/accounts/me`, {
        headers,
      })
      .pipe(retry(2)); 
  }

  getUserHealthProfile(id: any): Observable<any[]> {
    AuthService.AccessToken = AuthService.AccessToken.replace(/\s+$/, '');
    const headers = new HttpHeaders({
      Authorization: 'Bearer ' + AuthService.AccessToken,
      // Add any other headers if needed
    });

    return this.http
      .get<any>(
        `https://winitclinic.com/api/v1/patient/health-profiles/` +
          id,
        { headers }
      )
      .pipe(retry(2));
  }

  // public async setProfile(profile: view.Profile): Promise<void> {
  //   this.state.setProfile(profile);
  //   console.log(`ProfileService.setProfile: [DEBUG] profile to cache: ${JSON.stringify(profile)}`);
  //   await this.cache.putProfile(profile);
  //   const dangerousIngredients: string[] = this.gatherDangerousIngredients(profile);
  //   this.state.setDangerousIngredients(dangerousIngredients);
  //   const poisonousIngredients: string[] = this.gatherPoisonousIngredients(profile);
  //   this.state.setPoisonousIngredients(poisonousIngredients);
  //   console.log(`ProfileService.setProfile: [DEBUG] dangerous ingredients to cache: ${JSON.stringify(dangerousIngredients)}`);
  // }

  // public async getProfile(email?: string): Promise<view.Profile> {
  //   try {
  //     let profile: view.Profile;
  //     if (email) {
  //       profile = await this.getProfileByEmail(email);
  //       console.log(`ProfileService.getProfile: [DEBUG] newly fetched profile: ${JSON.stringify(profile)}`);
  //       if (!profile || !profile.id) {
  //         return null;
  //       }
  //     } else {
  //       profile = this.state.getProfile();
  //       console.log(`ProfileService.getProfile: [DEBUG] checking the profile stored in memory: ${JSON.stringify(profile)}`);
  //       if (!profile || !profile.id || profile.id === '-1') {
  //         profile = await this.cache.getProfile();
  //         console.log(`ProfileService.getProfile: [DEBUG] checking the cached profile: ${JSON.stringify(profile)}`);
  //       }
  //       if (!profile || !profile.id) {
  //         return null;
  //       }
  //     }
  //     await this.setProfile(profile);
  //     return profile;
  //   } catch (error) {
  //     email ? console.error(`ProfileService.getProfile: [ERROR] Error getting profile by email ${email}: ${JSON.stringify(error)}`) :
  //       console.error(`ProfileService.getProfile: [ERROR] Error getting profile: ${JSON.stringify(error)}`);
  //   }
  // }

  // public async refreshProfile(email: string): Promise<void> {
  //   try {
  //     let profile: view.Profile;
  //     profile = await this.getProfileByEmail(email);
  //     console.log(`ProfileService.getProfile: [DEBUG] newly fetched profile: ${JSON.stringify(profile)}`);
  //     if (profile && profile.id) {
  //       await this.setProfile(profile);
  //     }
  //     return;
  //   } catch (error) {
  //     email ? console.error(`ProfileService.getProfile: [ERROR] Error getting profile by email ${email}: ${JSON.stringify(error)}`) :
  //       console.error(`ProfileService.getProfile: [ERROR] Error getting profile: ${JSON.stringify(error)}`);
  //   }
  // }

  // // public async createProfile(newProfile: view.Profile): Promise<view.Profile> {
  // //   const createProfileURL: string = EnvironmentConfig.api.profile.baseUrl + EnvironmentConfig.api.profile.postCreateProfile;
  // //   try {
  // //     const profileResponse: any = await this.http.post(createProfileURL, newProfile, {
  // //       'Content-Type': 'application/json'
  // //      });
  // //     console.log(`ProfileService.createProfile: [DEBUG] response from backend: ${JSON.stringify(profileResponse)}`);
  // //     if (profileResponse.hasOwnProperty('data') && profileResponse.data.hasOwnProperty('data') && profileResponse.data.data.hasOwnProperty('id')) {
  // //       await this.setProfile(profileResponse.data.data as view.Profile);
  // //       return profileResponse.data.data as view.Profile;
  // //     } else {
  // //       return null;
  // //     }
  // //   } catch (error) {
  // //     console.error(`ProfileService.createProfile: [ERROR] Error saving new profile: ${JSON.stringify(newProfile)}`);
  // //     console.error(`ProfileService.createProfile: [ERROR] Error: ${JSON.stringify(error)}`);
  // //   }
  // // }

  // public async updateProfile(newProfile: any): Promise<void> {
  //   const updateProfileURL: string = EnvironmentConfig.api.profile.baseUrl + EnvironmentConfig.api.profile.postUpdateProfile;
  //   try {
  //     const response = await this.http.post(updateProfileURL, newProfile, {
  //         'Content-Type': 'application/json'
  //        });
  //     console.log(`ProfileService.updateProfile: [DEBUG] response from backend: ${JSON.stringify(response)}`);
  //   } catch (error) {
  //     console.error(`ProfileService.updateProfile: [ERROR] Error saving new profile: ${JSON.stringify(newProfile)}`);
  //     console.error(`ProfileService.updateProfile: [ERROR] Error: ${JSON.stringify(error)}`);
  //   }
  // }

  public async getProfilePoints(profileId: string): Promise<model.WuzinitPoints> {
    const getProfilePoints: string = EnvironmentConfig.api.profile.baseUrl + EnvironmentConfig.api.profile.getProfilePoints;
    try {
      const requestOptions: HttpOptions = {
        url: getProfilePoints,
        headers: {
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json',
        },
        params: {
          profileId
        }
      };
      const response: HttpResponse = await CapacitorHttp.get(requestOptions);
      console.log(`ProfileService.getProfilePoints: [DEBUG] response from backend: ${JSON.stringify(response)}`);
      const rawResponseData: any = response.data;
      console.log(`ProfileService.getProfilePoints: [DEBUG] rawResponseData response from backend: ${JSON.stringify(rawResponseData)}`);
      const responseData: model.WuzinitPoints = rawResponseData.data as model.WuzinitPoints || {
        profileId: '0',
        pointsBalance: 0,
        pointsPending: 0,
        pointsAllTime: 0,
        pointsUsedAllTime: 0,
        scansAllTime: 0,
        searchesAllTime: 0,
        sectionsAddedAllTime: 0,
        sectionsPending: 0,
        productsPending: 0,
        productsAddedAllTime: 0
      } as model.WuzinitPoints;
      console.log(`ProfileService.getProfilePoints: [DEBUG] data from backend: ${JSON.stringify(responseData)}`);
      return responseData;
    } catch (error) {
      console.error(`ProfileService.getProfilePoints: [ERROR] Error: ${JSON.stringify(error)}`);
      return {
        profileId: '0',
        pointsBalance: 0,
        pointsPending: 0,
        pointsAllTime: 0,
        pointsUsedAllTime: 0,
        scansAllTime: 0,
        searchesAllTime: 0,
        sectionsAddedAllTime: 0,
        sectionsPending: 0,
        productsPending: 0,
        productsAddedAllTime: 0
      } as model.WuzinitPoints;
    }
  }

  public async addToProfilePoints(pointsToAdd: number): Promise<void> {
    const profilePoints: model.WuzinitPoints = this.state.getProfilePoints();
    console.log(`ProfileService.addToProfilePoints: [DEBUG] Profile Points from state: ${JSON.stringify(profilePoints)}`);
    try {
      profilePoints.pointsBalance = profilePoints.pointsBalance + Math.max(0, pointsToAdd);
      profilePoints.pointsAllTime = profilePoints.pointsAllTime + Math.max(0, pointsToAdd);
      console.log(`ProfileService.addToProfilePoints: [DEBUG] New Profile Points: ${JSON.stringify(profilePoints)}`);
      await this.saveProfilePoints(profilePoints);
      this.state.setProfilePoints(profilePoints);
    } catch (error) {
      console.error(`ProfileService.addToProfilePoints: [ERROR] Error adding ${pointsToAdd} to profile points: ${JSON.stringify(profilePoints)}`);
      console.error(`ProfileService.addToProfilePoints: [ERROR] Error: ${JSON.stringify(error)}`);
    }
  }

  // public async subtractFromProfilePoints(pointsToSubtract: number): Promise<model.WuzinitPoints> {
  //   const profilePoints: model.WuzinitPoints = this.state.getProfilePoints();
  //   try {
  //     profilePoints.pointsBalance = profilePoints.pointsBalance - Math.max(0, pointsToSubtract);
  //     profilePoints.pointsAllTime = profilePoints.pointsAllTime - Math.max(0, pointsToSubtract);
  //     console.log(`ProfileService.subtractFromProfilePoints: [DEBUG] New Profile Points: ${JSON.stringify(profilePoints)}`);
  //     await this.saveProfilePoints(profilePoints);
  //     this.state.setProfilePoints(profilePoints);
  //     return profilePoints;
  //   } catch (error) {
  //     console.error(`ProfileService.subtractFromProfilePoints: [ERROR] Error adding ${pointsToSubtract} to profile points: ${JSON.stringify(profilePoints)}`);
  //     console.error(`ProfileService.subtractFromProfilePoints: [ERROR] Error: ${JSON.stringify(error)}`);
  //   }
  // }

  public async saveProfilePoints(profilePoints: model.WuzinitPoints): Promise<void> {
    const updateProfileURL: string = EnvironmentConfig.api.profile.baseUrl + EnvironmentConfig.api.profile.updateProfilePoints;
    try {
      const requestOptions = {
        url: updateProfileURL,
        headers: {
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate, br',
          'Connection': 'keep-alive',
          'Content-Type': 'application/json'
        },
        data: {
          profilePoints
        }
      };
      const response: any = await CapacitorHttp.post(requestOptions);
      console.log(`ProfileService.saveProfilePoints: [DEBUG] response from backend: ${JSON.stringify(response)}`);
    } catch (error) {
      console.error(`ProfileService.saveProfilePoints: [ERROR] Error updating profile points: ${JSON.stringify(profilePoints)}`);
      console.error(`ProfileService.saveProfilePoints: [ERROR] Error: ${JSON.stringify(error)}`);
    }
  }

  // PRIVATE METHODS //
  /////////////////////

  private gatherDangerousIngredients(profile: view.Profile): string[] {
    const dangerousIngredientsFromUsers = profile.users
      .map((user: view.User): string[] => {
        const dangerousIngredientsFromAllergies: string[] =
          user.allergies
            ?.map((allergy: model.Allergy): string[] => {
              return allergy.dangerousIngredients || [];
            })
            .flat()
            .filter((value: string): boolean => {
              return Boolean(value);
            }) || [];
        console.log(
          `ProfileService.gatherDangerousIngredients: [DEBUG] dangerousIngredientsFromAllergies ${JSON.stringify(
            dangerousIngredientsFromAllergies
          )}`
        );
        const dangerousIngredientsFromConditions: string[] =
          user.medicalConditions
            ?.map((condition: model.Medical): string[] => {
              return condition.dangerousIngredients || [];
            })
            .flat()
            .filter((value: string): boolean => {
              return Boolean(value);
            }) || [];
        console.log(
          `ProfileService.gatherDangerousIngredients: [DEBUG] dangerousIngredientsFromConditions ${JSON.stringify(
            dangerousIngredientsFromConditions
          )}`
        );
        return dangerousIngredientsFromAllergies.concat(
          dangerousIngredientsFromConditions
        );
      })
      .flat()
      .filter((value: string, index: number, self: string[]) => {
        return self.indexOf(value) === index;
      });
    const dangerousIngredientsFromProfile = profile.lifestyleDiets
      ? profile.lifestyleDiets
          .map((diet: model.Lifestyle): string[] => {
            return diet.dangerousIngredients || [];
          })
          .flat()
          .filter((value: string): boolean => {
            return Boolean(value);
          })
      : [];
    const dangerousIngredients: string[] = dangerousIngredientsFromUsers.concat(
      dangerousIngredientsFromProfile
    );
    console.log(
      `ProfileService.gatherDangerousIngredients: [DEBUG] we gathered these dangerous ingredients from the profile: ${JSON.stringify(
        dangerousIngredients
      )}`
    );
    return dangerousIngredients;
  }

  private gatherPoisonousIngredients(profile: view.Profile): string[] {
    const poisonousIngredients = profile.users
      .map((user: view.User): string[] => {
        const poisonousIngredientsFromAllergies: string[] =
          user.allergies
            ?.map((allergy: model.Allergy): string[] => {
              return allergy.poisonousIngredients || [];
            })
            .flat()
            .filter((value: string): boolean => {
              return Boolean(value);
            }) || [];
        console.log(
          `ProfileService.gatherPoisonousIngredients: [DEBUG] poisonousIngredientsFromAllergies ${JSON.stringify(
            poisonousIngredientsFromAllergies
          )}`
        );
        const poisonousIngredientsFromConditions: string[] =
          user.medicalConditions
            ?.map((condition: model.Medical): string[] => {
              return condition.poisonousIngredients || [];
            })
            .flat()
            .filter((value: string): boolean => {
              return Boolean(value);
            }) || [];
        console.log(
          `ProfileService.gatherPoisonousIngredients: [DEBUG] poisonousIngredientsFromConditions ${JSON.stringify(
            poisonousIngredientsFromConditions
          )}`
        );
        return poisonousIngredientsFromAllergies.concat(
          poisonousIngredientsFromConditions
        );
      })
      .flat()
      .filter((value: string, index: number, self: string[]) => {
        return self.indexOf(value) === index;
      });
    console.log(
      `ProfileService.gatherPoisonousIngredients: [DEBUG] we gathered these poisonous ingredients from the profile: ${JSON.stringify(
        poisonousIngredients
      )}`
    );
    return poisonousIngredients;
  }

  private async getProfileByEmail(email: string): Promise<view.Profile | null> {
    const getProfileUrl: string =
      EnvironmentConfig.api.profile.baseUrl +
      EnvironmentConfig.api.profile.getByEmail;
    try {
      const requestOptions = {
        url: getProfileUrl,
        headers: this.authState.getAuthHeaders(),
        params: {
          profileEmail: email,
        },
      };
      const profileResponse: HttpResponse = await CapacitorHttp.get(
        requestOptions
      );
      console.log(
        `ProfileService.getProfileByEmail: [DEBUG] response from back end: ${JSON.stringify(
          profileResponse
        )}`
      );
      if (
        profileResponse.hasOwnProperty('data') &&
        JSON.parse(profileResponse.data).hasOwnProperty('data') &&
        JSON.parse(profileResponse.data).data.hasOwnProperty('id')
      ) {
        return JSON.parse(profileResponse.data).data as view.Profile;
      } else {
        return null;
      }
    } catch (error) {
      console.error(
        `ProfileService.getProfileByEmail: [ERROR] Error getting profile by email: ${email}`
      );
      console.error(
        `ProfileService.getProfileByEmail: [ERROR] Error: ${JSON.stringify(
          error
        )}`
      );
      return null;
    }
  }
}

const USER_NOT_FOUND = 'user not found';
const UNKNOWN_USER: view.Profile = {
  id: '-1',
  primaryUserEmail: USER_NOT_FOUND,
  users: [
    {
      id: '-1',
      username: USER_NOT_FOUND,
      email: USER_NOT_FOUND,
      name: USER_NOT_FOUND,
    } as view.User,
  ],
  points: {
    profileId: '-1',
    pointsBalance: 0,
    pointsPending: 0,
    pointsAllTime: 0,
    pointsUsedAllTime: 0,
    scansAllTime: 0,
    searchesAllTime: 0,
    sectionsAddedAllTime: 0,
    sectionsPending: 0,
    productsPending: 0,
    productsAddedAllTime: 0,
  },
};
