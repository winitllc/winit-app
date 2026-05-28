import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpResponse } from '@capacitor/core';
import { model } from 'wuzinit-common';
import { EnvironmentConfig } from '../environment.config';
import { AuthState } from './auth.state';

@Injectable({
  providedIn: 'root'
})
export class MedicalConditionsService {

  private conditions: model.Medical[] = [];

  constructor(
    private authState: AuthState
  ) {}

  public async getAllMedicalConditions(): Promise<model.Medical[]> {
    try {
      if (!this.conditions) {
        const allMedicalConditionsUrl: string = EnvironmentConfig.api.medicalConditions.baseUrl + EnvironmentConfig.api.medicalConditions.getAll;
        console.log(`MedicalConditionsService.getAllMedicalConditions: retrieving allergies from ${allMedicalConditionsUrl}`);
        const requestOptions = {
          url: allMedicalConditionsUrl,
          headers: this.authState.getAuthHeaders()
        }
        const response: HttpResponse = await CapacitorHttp.get(requestOptions);
        console.log(`MedicalConditionsService.getAllMedicalConditions: response: ${JSON.stringify(response)}`);
        this.conditions = response.hasOwnProperty('data') && JSON.parse(response.data).hasOwnProperty('medicalConditions') ? JSON.parse(response.data).medicalConditions as model.Medical[] : [];
      }
      console.log(`MedicalConditionsService.getAllMedicalConditions: returning ${JSON.stringify(this.conditions)}`);
      return this.conditions;
    } catch (error) {
      console.error(`MedicalConditionsService.getAllMedicalConditions: Error getting all medicalConditions: ${JSON.stringify(error)}`);
      return [];
    }
  }
}
