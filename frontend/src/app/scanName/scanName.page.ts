import { Component, OnInit } from '@angular/core';
import { LoadingController, LoadingOptions, ModalController, NavController } from '@ionic/angular';
import ImageService from '../util/image.service';
import { ScanNameCropperModalPage } from './scanName-cropperModal.page';
import { ProfileState } from '../profile/profile.state';
import { ProfileService } from '../profile/profile.service';
import { NavigationExtras, Router } from '@angular/router';

@Component({
  selector: 'app-scanName',
  templateUrl: 'scanName.page.html',
  styleUrls: ['scanName.page.scss']
})
export class ScanNamePage implements OnInit {

  imageCaptured: boolean = false;
  nameText: any = '';
  brandsText: any = '';
  imageSrc: string = '';
  loading: HTMLIonLoadingElement | null = null;
  profile: any;
  barcode: string = '';
  nameS3ImageKey: string = '';

  constructor(
    private imageService: ImageService,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private navCtrl: NavController,
    private profileState: ProfileState,
    private profileService: ProfileService
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      console.log(`ScanNamePage.ngOnInit setting up scan name page`);
      this.imageCaptured = false;
      let currNavigation = this.router.getCurrentNavigation();
      if (!currNavigation) {
        console.log(`ScanNamePage.ngOnInit: no currNavigation found, using last successful`);
        currNavigation = this.router.lastSuccessfulNavigation;
      }
      const routerState = JSON.parse(JSON.stringify(currNavigation?.extras.state));
      console.log(`ScanNamePage.ngOnInit: router state: ${JSON.stringify(routerState)}`);
      console.log(`ScanNamePage.ngOnInit: router state keys: ${Object.keys(routerState)}`);
      const barcode = routerState['noProductBarcode'];
      console.log(`ScanNamePage.ngOnInit: no product barcode: ${barcode}`);
      this.barcode = barcode;
      console.log(`ScanNamePage.ngOnInit: this.barcode: ${this.barcode}`);
    } catch (error) {
      console.error(`ScanNamePage.ngOnInit Error: ${JSON.stringify(error)}`);
    }
  }

  ionViewWillEnter(): void {
    console.log(`ScanNamePage.ionViewWillEnter - beginning of ionViewWillEnter`);
    this.profile = this.profileState.getHealthProfile();
    console.log(`ScanNamePage.ionViewWillEnter: profile from state: ${JSON.stringify(this.profile)}`);
    this.imageCaptured = false;
    this.nameText = "";
    this.brandsText = "";
    this.imageSrc = "";
  }

  async scanName() {
    const imageToTextData = await this.imageToText();
    this.imageCaptured = true;
    this.imageSrc = imageToTextData.image;
    this.nameText = imageToTextData.text;
    this.brandsText = imageToTextData.text;
    this.nameS3ImageKey = imageToTextData.s3ImageKey;
    console.log(`ScanNamePage.scan: imageToTextData: ${JSON.stringify(imageToTextData)}`);
    this.profileService.addToProfilePoints(1);
  }

  resetSection() {
    this.imageCaptured = false;
    this.nameText = "";
    this.brandsText = "";
    this.imageSrc = "";
  }

  continue() {
    const navExtras: NavigationExtras = {
      state: {
        barcode: this.barcode,
        nameText: this.nameText,
        brandsText: this.brandsText,
        nameS3ImageKey: this.nameS3ImageKey
      }
    };
    console.log(`ScanNamePage.continue: navExtras: ${JSON.stringify(navExtras)}`);
    this.navCtrl.navigateForward('tabs/product/scanFront', navExtras);
  }

  async imageToText(): Promise<ImageToTextData> {
    console.log(`ScanNamePage.imageToText: image to text selected`);
    try {
      console.log(`ScanNamePage.imageToText: running imageToText function`);
      const imageData = await this.imageService.captureImageDataURL();
      this.presentLoading('Loading Image Cropper');
      const croppedImageData = await this.openCropperModal(imageData);
      this.presentLoading('Getting Text From Image', 5000);
      const rawImageData = croppedImageData.replace('data:image/jpeg;base64,', '');
      const imageToTextData = await this.imageService.callImageToText(rawImageData);
      const imageKeyInS3 = imageToTextData.imageKey;
      const imageText = imageToTextData.imageText;
      this.dismissLoading();
      console.log(`ScanNamePage.imageToText: text from service: ${imageText}.`);
      return {
        text: imageText,
        image: croppedImageData || '',
        s3ImageKey: imageKeyInS3
      };
    } catch (error) {
      console.error(`ScanNamePage.imageToText: error capturing image and converting to text: ${JSON.stringify(error)}`);
      return this.imageToText();
    }
  }

  async openCropperModal(imageData: string): Promise<string> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: ScanNameCropperModalPage,
      componentProps: {
        imageInput: imageData
      }
    });
    await this.dismissLoading();
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    console.log(`ProductPage.openCropperModal: modal dismissed, data: ${JSON.stringify(data)}`);
    console.log(`ProductPage.openCropperModal: modal dismissed, role: ${JSON.stringify(role)}`);
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
