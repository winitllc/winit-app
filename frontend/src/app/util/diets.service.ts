import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { model } from 'wuzinit-common';
import { EnvironmentConfig } from '../environment.config';
import { AuthState } from './auth.state';

@Injectable({
  providedIn: 'root'
})
export class DietsService {

  private lifestyleDiets: model.Lifestyle[] = [];

  constructor(
    private authState: AuthState
  ) {}

  public async getAllLifestyleDiets(): Promise<model.Lifestyle[]> {
    try {
      if (!this.lifestyleDiets) {
        const allLifestylesURL: string = EnvironmentConfig.api.diets.baseUrl + EnvironmentConfig.api.diets.getAll;
        console.log(`DietsService.getAllLifestyleDiets: [DEBUG] retrieving lifestyleDiets from ${allLifestylesURL}`);
        const requestOptions = {
          url: allLifestylesURL,
          headers: this.authState.getAuthHeaders()
        }
        const response: HttpResponse = await CapacitorHttp.get(requestOptions);
        console.log(`DietsService.getAllLifestyleDiets: [DEBUG] response: ${JSON.stringify(response)}`);
        this.lifestyleDiets = response.hasOwnProperty('data') && JSON.parse(response.data).hasOwnProperty('lifestyleDiets') ? JSON.parse(response.data).lifestyleDiets as model.Lifestyle[] : [];
      }
      console.log(`DietsService.getAllLifestyleDiets: [ERROR] returning ${JSON.stringify(this.lifestyleDiets)}`);
      return this.lifestyleDiets;
    } catch (error) {
      console.error(`DietsService.getAllLifestyleDiets: [ERROR] Error getting all lifestyles: ${JSON.stringify(error)}`);
      return [];
    }
  }
}
