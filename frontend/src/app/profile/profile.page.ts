import { Component, NgZone } from '@angular/core';
import {
  AlertController,
  LoadingController,
  NavController,
} from '@ionic/angular';
import { model, view } from 'wuzinit-common';
import { AuthService } from '../util/auth.service';
import { AllergiesService } from '../util/allergies.service';
import { ProfileService } from './profile.service';
import { ProfileState } from './profile.state';
import { MedicalConditionsService } from '../util/medicalConditions.service';
import { DietsService } from '../util/diets.service';
import { SymptomsService } from '../util/symptoms.service';
import { AppConfig } from '../app.config';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
  providers: [ProfileService],
})
export class ProfilePage {
  public editMode: boolean = false;
  public allPossibleAllergies: model.Allergy[] = [];
  public allPossibleMedicalConditions: model.Medical[] = [];
  public allPossibleLifestyleDiets: model.Lifestyle[] = [];
  public allPossibleSymptoms: model.Symptom[] = [];
  public inAppPurchaseProducts: view.InAppPurchaseProduct[] = [];

  public nameEdit: string = '';
  public usernameEdit: string = '';
  public emailEdit: string = '';
  public allergyEdit: string[] = [];
  public conditionEdit: string[] = [];
  public symptomsEdit: string[] = [];
  profileData: any;
  healthProfileData: any;

  constructor(
    public state: ProfileState,
    private alertCtrl: AlertController,
    private loadingController: LoadingController,
    private navCtrl: NavController,
    private zone: NgZone,
    private auth: AuthService,
    private allergiesService: AllergiesService,
    private service: ProfileService,
    private medicalConditionsService: MedicalConditionsService,
    private dietsService: DietsService,
    private symptomsService: SymptomsService,
    private storage: Storage
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      this.profileData = this.state.getProfile();
      this.healthProfileData = this.state.getHealthProfile();

      const loading = await this.loadingController.create({
        message: `Loading...`,
      });
      await loading.present();
      this.zone.run(async () => {
        this.allPossibleAllergies =
          await this.allergiesService.getAllAllergies();
        console.log(
          `ProfilePage.ngOnInit: [DEBUG] allergies received: ${JSON.stringify(
            this.allPossibleAllergies
          )}`
        );
        this.allPossibleMedicalConditions =
          await this.medicalConditionsService.getAllMedicalConditions();
        console.log(
          `ProfilePage.ngOnInit: [DEBUG] medical conditions received: ${JSON.stringify(
            this.allPossibleMedicalConditions
          )}`
        );
        this.allPossibleLifestyleDiets =
          await this.dietsService.getAllLifestyleDiets();
        console.log(
          `ProfilePage.ngOnInit: [DEBUG] lifestyles received: ${JSON.stringify(
            this.allPossibleLifestyleDiets
          )}`
        );
        this.allPossibleSymptoms = await this.symptomsService.getAllSymptoms();
        console.log(
          `ProfilePage.ngOnInit: [DEBUG] symptoms received: ${JSON.stringify(
            this.allPossibleSymptoms
          )}`
        );
      });
      await loading.dismiss();
    } catch (error) {
      console.error(
        `ProfilePage.ngOnInit Error: [ERROR] ${JSON.stringify(error)}`
      );
      throw error;
    }
  }

  async confirmLogout(): Promise<void> {
    let alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Do you want to logout?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel',
        },
        {
          text: 'Confirm',
          handler: () => {
            this.logout();
          },
        },
      ],
    });
    await alert.present();
  }

  // PRIVATE FUNCTIONS

  private logout(): void {
    this.auth.logout().then(async () => {
      console.log(`ProfilePage.logout: auth logout complete; returning home`);
      this.storage.remove('accessToken');
      await this.returnHome();
      await this.auth.setup();
    });
  }

  private async returnHome(): Promise<void> {
    try {
      this.navCtrl.navigateRoot('');
    } catch (error) {
      console.error(
        `ProfilePage.returnHome: Error returning to home page: ${JSON.stringify(
          error
        )}`
      );
    }
  }
}
