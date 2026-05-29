import { Component, NgZone } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { model } from 'wuzinit-common';
import { WinitAuthService, WinitUser } from '../util/winit-auth.service';
import { AllergiesService } from '../util/allergies.service';
import { MedicalConditionsService } from '../util/medicalConditions.service';
import { DietsService } from '../util/diets.service';
import { SymptomsService } from '../util/symptoms.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-profile',
  templateUrl: 'profile.page.html',
  styleUrls: ['profile.page.scss'],
})
export class ProfilePage {
  public editMode = false;
  public allPossibleAllergies: model.Allergy[] = [];
  public allPossibleMedicalConditions: model.Medical[] = [];
  public allPossibleLifestyleDiets: model.Lifestyle[] = [];
  public allPossibleSymptoms: model.Symptom[] = [];

  public profile: WinitUser | null = null;

  constructor(
    private alertCtrl: AlertController,
    private loadingController: LoadingController,
    private navCtrl: NavController,
    private zone: NgZone,
    private winitAuth: WinitAuthService,
    private allergiesService: AllergiesService,
    private medicalConditionsService: MedicalConditionsService,
    private dietsService: DietsService,
    private symptomsService: SymptomsService,
    private storage: Storage,
  ) {}

  async ngOnInit(): Promise<void> {
    const loading = await this.loadingController.create({ message: 'Loading…' });
    await loading.present();
    try {
      await this.zone.run(async () => {
        const [profile, allergies, conditions, diets, symptoms] = await Promise.all([
          this.winitAuth.getProfile(),
          this.allergiesService.getAllAllergies(),
          this.medicalConditionsService.getAllMedicalConditions(),
          this.dietsService.getAllLifestyleDiets(),
          this.symptomsService.getAllSymptoms(),
        ]);
        this.profile = profile;
        this.allPossibleAllergies = allergies;
        this.allPossibleMedicalConditions = conditions;
        this.allPossibleLifestyleDiets = diets;
        this.allPossibleSymptoms = symptoms;
      });
    } catch (e) {
      console.error('ProfilePage.ngOnInit error:', e);
    } finally {
      await loading.dismiss();
    }
  }

  async confirmLogout(): Promise<void> {
    const alert = await this.alertCtrl.create({
      header: 'Logout',
      message: 'Do you want to logout?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        { text: 'Confirm', handler: () => this.logout() },
      ],
    });
    await alert.present();
  }

  private logout(): void {
    this.winitAuth.logout().then(async () => {
      await this.storage.remove('accessToken');
      this.navCtrl.navigateRoot('');
    });
  }
}
