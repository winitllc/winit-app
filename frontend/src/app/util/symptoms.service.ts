import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { model } from 'wuzinit-common';
import { EnvironmentConfig } from '../environment.config';
import { AuthState } from './auth.state';

@Injectable({
  providedIn: 'root'
})
export class SymptomsService {

  private symptoms: model.Symptom[] = [];

  constructor(
    private authState: AuthState
  ) {}

  public async getAllSymptoms(): Promise<model.Symptom[]> {
    try {
      if (!this.symptoms) {
        const allSymptomsUrl: string = EnvironmentConfig.api.symptoms.baseUrl + EnvironmentConfig.api.symptoms.getAll;
        console.log(`SymptomsService.getAllSymptoms: [DEBUG] retrieving symptoms from ${allSymptomsUrl}`);
        const requestOptions = {
          url: allSymptomsUrl,
          headers: this.authState.getAuthHeaders()
        }
        const response: HttpResponse = await CapacitorHttp.get(requestOptions);
        console.log(`SymptomsService.getAllSymptoms: [DEBUG] response: ${JSON.stringify(response)}`);
        this.symptoms = response.hasOwnProperty('data') && JSON.parse(response.data).hasOwnProperty('symptoms') ? JSON.parse(response.data).symptoms as model.Symptom[] : [];
      }
      console.log(`SymptomsService.getAllSymptoms: [ERROR] returning ${JSON.stringify(this.symptoms)}`);
      return this.symptoms;
    } catch (error) {
      console.error(`SymptomsService.getAllSymptoms: [ERROR] Error getting all symptoms: ${JSON.stringify(error)}`);
      return [];
    }
  }
}
