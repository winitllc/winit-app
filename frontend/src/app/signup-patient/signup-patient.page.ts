import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { WinitAuthService } from '../util/winit-auth.service';
import { ProfileSetupService } from '../util/profile-setup.service';

@Component({
  selector: 'app-signup-patient',
  templateUrl: './signup-patient.page.html',
  styleUrls: ['./signup-patient.page.scss'],
})
export class SignupPatientPage implements OnInit {
  userData = {
    firstName: '',
    lastName: '',
    email: '',
    confirmEmail: '',
    newPassword: '',
  };
  loading: any;

  constructor(
    private navCtrl: NavController,
    private winitAuth: WinitAuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private setupService: ProfileSetupService,
  ) {}

  ngOnInit() {}

  goBack() {
    this.navCtrl.navigateRoot('/signin');
  }

  async registerPatientAction() {
    const { firstName, lastName, email, confirmEmail, newPassword } = this.userData;

    if (!firstName || !lastName || !email || !confirmEmail || !newPassword) {
      await this.alert('Please fill in all fields.');
      return;
    }
    if (email !== confirmEmail) {
      await this.alert('Email addresses do not match.');
      return;
    }
    if (newPassword.length < 6) {
      await this.alert('Password must be at least 6 characters.');
      return;
    }

    await this.presentLoading('Creating your account…');
    try {
      await this.winitAuth.signup(firstName, lastName, email, newPassword);
      this.loading.dismiss();
      // Reset so the onboarding modal shows for the new user
      await this.setupService.reset();
      this.navCtrl.navigateRoot('/tabs');
    } catch (e: any) {
      this.loading.dismiss();
      await this.alert(e.message ?? 'Sign up failed. Please try again.');
    }
  }

  private async presentLoading(msg = 'Please wait…') {
    this.loading = await this.loadingController.create({ message: msg });
    this.loading.backdropDismiss = false;
    await this.loading.present();
  }

  private async alert(msg: string) {
    const a = await this.alertController.create({ header: msg, buttons: ['OK'] });
    await a.present();
  }
}
