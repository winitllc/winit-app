import { Component, OnInit } from '@angular/core';
import { LoadingController, LoadingOptions, ModalController, NavController } from '@ionic/angular';
import ImageService from '../util/image.service';
import { ScanFrontCropperModalPage } from './scanFront-cropperModal.page';
import { DomSanitizer } from '@angular/platform-browser';
import { ProfileState } from '../profile/profile.state';
import { ProfileService } from '../profile/profile.service';
import { NavigationExtras, Router } from '@angular/router';

@Component({
  selector: 'app-scanFront',
  templateUrl: 'scanFront.page.html',
  styleUrls: ['scanFront.page.scss']
})
export class ScanFrontPage implements OnInit {

  imageCaptured: boolean = false;
  imageSrc: string = '';
  loading: HTMLIonLoadingElement | null = null;
  profile: any;
  barcode: string = '';
  nameText: string = '';
  brandsText: string = '';
  nameS3ImageKey:string = '';
  frontS3ImageKey: string = '';

  constructor(
    private imageService: ImageService,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private navCtrl: NavController,
    private sanitizer: DomSanitizer,
    private profileState: ProfileState,
    private profileService: ProfileService
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      console.log(`ScanFrontPage.ngOnInit setting up scan page`);
      this.imageCaptured = false;
      let currNavigation = this.router.getCurrentNavigation();
      if (!currNavigation) {
        console.log(`ScanFrontPage.ngOnInit: no currNavigation found, using last successful`);
        currNavigation = this.router.lastSuccessfulNavigation;
      }
      console.log(`ScanFrontPage.ngOnInit: currNavigation.extras.state ${JSON.stringify(currNavigation?.extras.state)}`);
      const routerState = JSON.parse(JSON.stringify(currNavigation?.extras.state));
      this.barcode = routerState['barcode'];
      this.nameText = routerState['nameText'];
      this.brandsText = routerState['brandsText'];
      this.nameS3ImageKey = routerState['nameS3ImageKey'];
      console.log(`ScanFrontPage.ngOnInit: barcode ${JSON.stringify(this.barcode)}`);
      console.log(`ScanFrontPage.ngOnInit: nameText ${this.nameText}`);
      console.log(`ScanFrontPage.ngOnInit: brandsText ${this.brandsText}`);
      console.log(`ScanFrontPage.ngOnInit: nameS3ImageKey ${this.nameS3ImageKey}`);
    } catch (error) {
      console.error(`ScanFrontPage.ngOnInit Error: ${JSON.stringify(error)}`);
    }
  }

  ionViewWillEnter(): void {
    console.log(`ScanFrontPage.ionViewWillEnter - beginning of ionViewWillEnter`);
    this.profile = this.profileState.getHealthProfile();
    console.log(`ScanFrontPage.ngOnInit: profile from state: ${JSON.stringify(this.profile)}`);
    this.imageCaptured = false;
    this.imageSrc = "";
  }

  async scanFront() {
    try {
      const imageData = await this.imageService.captureImageDataURL();
      this.presentLoading('Loading Image Cropper');
      const croppedImageData = await this.openCropperModal(imageData);
      this.imageCaptured = true;
      this.imageSrc = croppedImageData;
      const rawImageData = croppedImageData.replace('data:image/jpeg;base64,', '');
      const imageKeyInS3 = await this.imageService.callUploadToS3(rawImageData, `front-${this.barcode}`);
      console.log(`ScanFrontPage.scanFront: uploadToS3 key: ${JSON.stringify(imageKeyInS3)}`);
      this.frontS3ImageKey = imageKeyInS3;
      console.log(`ScanFrontPage.scanFront: new this.frontS3ImageKey: ${JSON.stringify(this.frontS3ImageKey)}`);
    } catch (error) {
      console.error(`ScanFrontPage.scanFront: error capturing image and converting to text: ${JSON.stringify(error)}`);
    }
  }

  continue() {
    console.log(`ScanFrontPage.continue: calling continue with the frontS3ImageKey ${this.frontS3ImageKey}`);
    const navExtras: NavigationExtras = {
      state: {
        barcode: this.barcode,
        nameText: this.nameText,
        brandsText: this.brandsText,
        nameS3ImageKey: this.nameS3ImageKey,
        frontS3ImageKey: this.frontS3ImageKey,
        frontImage: this.imageSrc
      }
    };
    console.log(`ScanFrontPage.continue: navExtras  ${JSON.stringify(navExtras)}`);
    this.navCtrl.navigateForward('tabs/product/scanNutrition', navExtras);
  }

  async openCropperModal(imageData: string): Promise<string> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: ScanFrontCropperModalPage,
      componentProps: {
        imageInput: imageData
      }
    });
    await this.dismissLoading();
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    console.log(`ScanFrontPage.openCropperModal: modal dismissed, data: ${JSON.stringify(data)}`);
    console.log(`ScanFrontPage.openCropperModal: modal dismissed, role: ${JSON.stringify(role)}`);
    return data as string;
  }

  async presentLoading(loadingMessage: string, duration?: number) {
    this.dismissLoading();
    const loadingOpts: LoadingOptions = {
      message: loadingMessage,
      showBackdrop: true,
      spinner: 'circular',
      duration: duration || 2000,
      cssClass: 'loading-modal'
    };
    this.loading = await this.loadingCtrl.create(loadingOpts);

    this.loading.present();
  }

  async dismissLoading() {
    await this.loading?.dismiss();
  }
}

interface ImageToTextData {
  image: string;
  text: string;
  s3ImageKey: string;
}
