import { Injectable } from '@angular/core';
import { model, view } from 'wuzinit-common';

@Injectable({
  providedIn: 'root'
})
export class ProfileFactory {

  public copyProfile(profile: view.Profile): view.Profile {
    return {
      id: profile.id,
      primaryUserEmail: profile.primaryUserEmail,
      users: profile.users,
      points: {
        profileId: profile.id,
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
      }
    };
  }

  public makeEditModeProfileObject(profile: view.Profile): EditModeProfile {
    return {
      id: profile.id,
      primaryUserEmail: profile.primaryUserEmail,
      users: [{
        id: profile.users[0].id,
        username: profile.users[0].username,
        email: profile.users[0].email,
        name: profile.users[0].name,
        allergies: profile.users[0].allergies?.map((allergy: model.Allergy): string => {
          return allergy.id;
        }) || [],
        medicalConditions: profile.users[0].medicalConditions?.map((condition: model.Medical): string => {
          return condition.id;
        }) || [],
        symptoms: profile.users[0].symptoms?.map((symptom: model.Symptom): string => {
          return symptom.symptomId;
        }) || []
      }],
      lifestyleDiets: profile.lifestyleDiets ? profile.lifestyleDiets.map((diet: model.Lifestyle): string => {
        return diet.id;
      }) : []
    };
  }
}

export interface EditModeProfile {
  id: string;
  primaryUserEmail: string;
  users: EditModeUser[];
  lifestyleDiets?: string[];
}

export interface EditModeUser extends model.User {}
