import { Component } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { ProAuthService } from '../util/pro-auth.service';

@Component({
  selector: 'app-pro-login',
  templateUrl: './pro-login.page.html',
  styleUrls: ['./pro-login.page.scss'],
})
export class ProLoginPage {
  email = '';
  password = '';
  private loading: any;

  constructor(
    private proAuth: ProAuthService,
    private navCtrl: NavController,
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
  ) {}

  async loginAction() {
    if (!this.email || !this.password) {
      await this.alert('Please enter your email and password.');
      return;
    }
    this.loading = await this.loadingCtrl.create({ message: 'Signing in…' });
    await this.loading.present();
    try {
      await this.proAuth.login(this.email, this.password);
      await this.loading.dismiss();
      this.navCtrl.navigateRoot('/pro-dashboard');
    } catch (e: any) {
      await this.loading.dismiss();
      await this.alert(e.message ?? 'Login failed. Please check your credentials.');
    }
  }

  goBack() { this.navCtrl.back(); }
  goSignup() { this.navCtrl.navigateForward('/pro-signup'); }

  private async alert(msg: string) {
    const a = await this.alertCtrl.create({ header: msg, buttons: ['OK'] });
    await a.present();
  }
}
