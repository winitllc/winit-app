import { Component } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { ProAuthService } from '../util/pro-auth.service';

const ALL_SPECIALTIES = [
  'Weight Management', 'Diabetes', 'Heart Health', 'Sports Nutrition',
  'Plant-Based', 'Gut Health', 'Pediatric Nutrition', 'Eating Disorders',
  'Renal Nutrition', 'Oncology', 'Food Allergies', 'Prenatal Nutrition',
];

@Component({
  selector: 'app-pro-signup',
  templateUrl: './pro-signup.page.html',
  styleUrls: ['./pro-signup.page.scss'],
})
export class ProSignupPage {
  step: 1 | 2 = 1;

  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';

  title = '';
  bio = '';
  selectedSpecialties: Set<string> = new Set();

  readonly allSpecialties = ALL_SPECIALTIES;
  private loading: any;

  constructor(
    private proAuth: ProAuthService,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
  ) {}

  toggleSpecialty(s: string) {
    if (this.selectedSpecialties.has(s)) {
      this.selectedSpecialties.delete(s);
    } else {
      this.selectedSpecialties.add(s);
    }
  }

  isSelected(s: string): boolean {
    return this.selectedSpecialties.has(s);
  }

  async nextStep() {
    if (!this.firstName || !this.lastName || !this.email || !this.password) {
      await this.alert('Please fill in all required fields.');
      return;
    }
    if (this.password !== this.confirmPassword) {
      await this.alert('Passwords do not match.');
      return;
    }
    if (this.password.length < 8) {
      await this.alert('Password must be at least 8 characters.');
      return;
    }
    this.step = 2;
  }

  async signupAction() {
    this.loading = await this.loadingCtrl.create({ message: 'Creating your account…' });
    await this.loading.present();
    try {
      await this.proAuth.signup({
        email: this.email,
        password: this.password,
        first_name: this.firstName,
        last_name: this.lastName,
        title: this.title || undefined,
        bio: this.bio || undefined,
        specialties: Array.from(this.selectedSpecialties),
      });
      await this.loading.dismiss();
      this.navCtrl.navigateRoot('/pro-dashboard');
    } catch (e: any) {
      await this.loading.dismiss();
      await this.alert(e.message ?? 'Signup failed. Please try again.');
    }
  }

  goBack() {
    if (this.step === 2) { this.step = 1; return; }
    this.navCtrl.back();
  }

  goLogin() { this.navCtrl.navigateForward('/pro-login'); }

  private async alert(msg: string) {
    const a = await this.alertCtrl.create({ header: msg, buttons: ['OK'] });
    await a.present();
  }
}
