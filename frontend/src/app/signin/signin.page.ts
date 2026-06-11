import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { WinitAuthService } from '../util/winit-auth.service';
import { ProfileSetupService } from '../util/profile-setup.service';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {
  userData = { email: '', password: '' };
  loading: any;
  showForgotPassword = false;
  forgotEmail = '';

  constructor(
    private navCtrl: NavController,
    private winitAuth: WinitAuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private setupService: ProfileSetupService,
  ) {}

  ngOnInit() {}

  async loginAction() {
    if (!this.userData.email || !this.userData.password) {
      await this.alert('Please enter your email and password.');
      return;
    }
    await this.presentLoading('Signing in…');
    try {
      await this.winitAuth.login(this.userData.email, this.userData.password);
      this.loading.dismiss();
      await this.setupService.reset();
      this.navCtrl.navigateRoot('/tabs');
    } catch (e: any) {
      this.loading.dismiss();
      await this.alert(e.message ?? 'Login failed. Please try again.');
    }
  }

  async forgotPasswordAction() {
    if (!this.forgotEmail) {
      await this.alert('Please enter your email address.');
      return;
    }
    await this.presentLoading('Sending reset link…');
    try {
      await this.winitAuth.resetPassword(this.forgotEmail);
      this.loading.dismiss();
      this.showForgotPassword = false;
      await this.alert('Check your inbox — a reset link is on its way.');
    } catch (e: any) {
      this.loading.dismiss();
      await this.alert(e.message ?? 'Something went wrong. Please try again.');
    }
  }

  registerAction() {
    this.navCtrl.navigateForward('signup-patient');
  }

  registerActionHealthPro() {
    this.navCtrl.navigateForward('pro-signup');
  }

  proLoginAction() {
    this.navCtrl.navigateForward('pro-login');
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
