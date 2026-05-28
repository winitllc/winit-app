import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { AuthService } from '../util/auth.service';
import { Storage } from '@ionic/storage-angular';

@Component({
  selector: 'app-signin',
  templateUrl: './signin.page.html',
  styleUrls: ['./signin.page.scss'],
})
export class SigninPage implements OnInit {
  userData = {
    "email": "",
    "password": ""
  };
  loading: any;

  constructor(
    private navCtrl: NavController,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private storage: Storage
  ) { }

  ngOnInit() {
  }

  loginAction() {
    console.log('this is login button');
    console.log(this.userData);

    if (this.userData.email == '' || this.userData.password == '') {
      this.present();
    } else {
      this.presentLoading();
      this.authService.loginAPI(this.userData).subscribe(async (response) => {
        console.log(response);
        if (response['statusCode'] != 200) {
          this.loading.dismiss();
          this.presentAlertMultipleButtons(response['data']);
        } else if (response['statusCode'] == 200) {
          this.loading.dismiss();
          const userData = response['data'];
          console.log(userData);
          AuthService.AccessToken = response['data']['accessToken'];

          this.storage.set('accessToken', response['data']['accessToken']).then(() => {
            this.navCtrl.navigateRoot('/tabs');
          });
        }
      },
        (error) => {
          console.log('this is error');
          this.loading.dismiss();
          this.presentAlertMultipleButtons(error['error']['data'][0]['message']);
          console.log(error);
        });
    }
  }

  async presentAlertMultipleButtons(msg: string) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: msg,

      buttons: ['Okay'],
    });
    await alert.present();
  }

  async presentLoading() {
    this.loading = await this.loadingController.create({
      message: 'Please Wait',
    });
    this.loading.backdropDismiss = false;
    await this.loading.present();

    const { role, data } = await this.loading.onDidDismiss();
  }

  async present() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Alert',
      message: 'Please Enter Email & Password',
      buttons: ['Okay'],
    });
    await alert.present();
  }

  registerAction() {
    console.log('this is register action');
    this.navCtrl.navigateForward('signup-patient');
  }

  registerActionHealthPro() {
    console.log('this is register action');
    this.navCtrl.navigateForward('signup');
  }

  onForgotPassword() {
    console.log('this is forgot password button');
  }

}
