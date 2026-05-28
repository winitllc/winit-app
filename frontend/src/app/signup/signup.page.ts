import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController, NavController } from '@ionic/angular';
import { AuthService } from '../util/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.page.html',
  styleUrls: ['./signup.page.scss'],
})
export class SignupPage implements OnInit {

  userData = {
    "firstName": "",
    "lastName": "",
    "email": "",
    "confirmEmail": "",
    "newPassword": "",
    "phoneNumber": "",
    "dateOfBirth": "",
    "timezone": ""
  };
  loading: any;


  constructor(
    private navCtrl: NavController,
    private authService: AuthService,
    private alertController: AlertController,
    private loadingController: LoadingController
  ) { }

  ngOnInit() {
  }

  goBack() {
    console.log('this is login button');
    console.log(this.userData);
    this.navCtrl.navigateRoot('/signin');
  }

  registerAction() {
    console.log('this is register action');
    console.log(this.userData);
    // console.log(Intl.DateTimeFormat().resolvedOptions().timeZone);
    this.userData.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (this.userData.firstName == '' || this.userData.lastName == '' || this.userData.email == '' || this.userData.confirmEmail == '' || this.userData.newPassword == '' || this.userData.phoneNumber == '' || this.userData.dateOfBirth == '') {
      this.presentAlert();
    } else {
      if (this.userData.email != this.userData.confirmEmail) {
        this.presentAlertMultipleButtons('Email & Confirm Email Do Not Match');
      }
      else {
        this.presentLoading();
        this.authService.registerAPI(this.userData).subscribe(async (response) => {
          console.log(response);
          if (response['statusCode'] != 200) {
            this.loading.dismiss();
            this.presentAlertMultipleButtons(response['data']);
          } else if (response['statusCode'] == 200) {
            this.loading.dismiss();
            const userData = response['data'];
            console.log(userData);
            this.navCtrl.navigateRoot('/signin');
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

  async presentAlert() {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class',
      header: 'Alert',
      message: 'Please Enter All Fields To Continue',
      buttons: ['Okay'],
    });
    await alert.present();
  }

}
