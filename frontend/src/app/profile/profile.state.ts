import { Injectable } from '@angular/core';
import { model, view } from 'wuzinit-common';

@Injectable({
  providedIn: 'root'
})
export class ProfileState {

  public profile: any = {};
  public points: model.WuzinitPoints = {
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
  };
  private healthProfile: any = JSON.parse(JSON.stringify(emptyProfile));

  private dangerousIngredients: string[] = [];
  private poisonousIngredients: string[] = [];

  constructor() { }

  reset(): void {
    console.log(`ProfileState.reset: reseting profile, etc.`);
    this.profile = JSON.parse(JSON.stringify(emptyProfile));
    this.dangerousIngredients = [];
    this.poisonousIngredients = [];
  }

  getProfile(): any {
    console.log(`ProfileState.getProfile: getting profile: ${JSON.stringify(this.profile)}`);
    return this.profile;
  }

  setProfile(profile: any): void {
    console.log(`ProfileState.setProfile: setting profile: ${JSON.stringify(profile)}`);
    this.profile = profile;
  }

  getHealthProfile(): any {
    console.log(`ProfileState.getHealthProfile: getting profile: ${JSON.stringify(this.healthProfile)}`);
    return this.healthProfile;
  }

  setHealthProfile(healthProfile: any): void {
    console.log(`ProfileState.setHealthProfile: setting profile: ${JSON.stringify(healthProfile)}`);
    this.healthProfile = healthProfile;
  }

  getProfilePoints(): model.WuzinitPoints {
    console.log(`ProfileState.getProfilePoints: getting profile points: ${JSON.stringify(this.points)}`);
    return Object.assign({}, this.points);
  }

  setProfilePoints(profilePoints: model.WuzinitPoints): void {
    console.log(`ProfileState.setProfilePoints: setting profile points: ${JSON.stringify(profilePoints)}`);
    this.points = profilePoints;
  }

  getDangerousIngredients(): string[] {
    return this.dangerousIngredients;
  }

  setDangerousIngredients(dangerousIngredients: string[]): void {
    this.dangerousIngredients = dangerousIngredients;
  }

  getPoisonousIngredients(): string[] {
    return this.poisonousIngredients;
  }

  setPoisonousIngredients(poisonousIngredients: string[]): void {
    this.poisonousIngredients = poisonousIngredients;
  }
}

const emptyProfile: view.Profile = {
  id: '-1',
  primaryUserEmail: 'alfred.lurgey@wuzinit.com',
  users: [
    {
      id: '-1',
      username: 'al.lurgey',
      email: 'alfred.lurgey@wuzinit.com',
      name: 'Alfred Lurgey',
      allergies: [],
      medicalConditions: []
    }
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
    productsAddedAllTime: 0
  }
};
