import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { model } from 'wuzinit-common';
import { EnvironmentConfig } from '../environment.config';
import { AuthState } from './auth.state';

@Injectable({
  providedIn: 'root'
})
export class AllergiesService {

  private allergies: model.Allergy[] = [];

  constructor(
    private authState: AuthState
  ) {}

  public async getAllAllergies(): Promise<model.Allergy[]> {
    try {
      if (!this.allergies) {
        const allAllergiesUrl: string = EnvironmentConfig.api.allergies.baseUrl + EnvironmentConfig.api.allergies.getAll;
        console.log(`AllergiesService.getAllAllergies: [DEBUG] retrieving allergies from ${allAllergiesUrl}`);
        const requestOptions = {
          url: allAllergiesUrl,
          headers: this.authState.getAuthHeaders()
        }
        const response: HttpResponse = await CapacitorHttp.get(requestOptions);
        console.log(`AllergiesService.getAllAllergies: [DEBUG] response: ${JSON.stringify(response)}`);
        this.allergies = response.hasOwnProperty('data') && JSON.parse(response.data).hasOwnProperty('allergies')? JSON.parse(response.data).allergies as model.Allergy[] : [];
      }
      console.log(`AllergiesService.getAllAllergies: [DEBUG] returning ${JSON.stringify(this.allergies)}`);
      return this.allergies;
    } catch (error) {
      console.error(`AllergiesService.getAllAllergies: [ERROR] Error getting all allergies: ${JSON.stringify(error)}`);
      return [];
    }
  }
}
