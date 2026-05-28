import { Component, OnInit } from '@angular/core';
import { LoadingController, LoadingOptions, ModalController, NavController } from '@ionic/angular';
import ImageService from '../util/image.service';
import { ScanNutritionCropperModalPage } from './scanNutrition-cropperModal.page';
import { DomSanitizer } from '@angular/platform-browser';
import { ProfileState } from '../profile/profile.state';
import { ProfileService } from '../profile/profile.service';
import { NavigationExtras, Router } from '@angular/router';

@Component({
  selector: 'app-scanNutrition',
  templateUrl: 'scanNutrition.page.html',
  styleUrls: ['scanNutrition.page.scss']
})
export class ScanNutritionPage implements OnInit {

  imageCaptured: boolean = false;
  imageSrc: string = '';
  loading: HTMLIonLoadingElement | null = null;
  profile: any;
  barcode: string = '';
  nameText: string = '';
  brandsText: string = '';
  nameS3ImageKey:string = '';
  frontS3ImageKey: string = '';
  frontImage: string = '';
  nutritionS3ImageKey: string = '';
  nutritionDataText: string = '';

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
      console.log(`ScanNutritionPage.ngOnInit setting up scan page`);
      this.imageCaptured = false;
      let currNavigation = this.router.getCurrentNavigation();
      if (!currNavigation) {
        console.log(`ScanNutritionPage.ngOnInit: no currNavigation found, using last successful`);
        currNavigation = this.router.lastSuccessfulNavigation;
      }
      console.log(`ScanNutritionPage.ngOnInit: currNavigation.extras.state ${JSON.stringify(currNavigation?.extras.state)}`);
      const routerState = JSON.parse(JSON.stringify(currNavigation?.extras.state));
      this.barcode = routerState['barcode'];
      this.nameText = routerState['nameText'];
      this.brandsText = routerState['brandsText'];
      this.nameS3ImageKey = routerState['nameS3ImageKey'];
      this.frontS3ImageKey = routerState['frontS3ImageKey'];
      this.frontImage = routerState['frontImage'];
      console.log(`ScanNutritionPage.ngOnInit: barcode ${JSON.stringify(this.barcode)}`);
      console.log(`ScanNutritionPage.ngOnInit: nameText ${this.nameText}`);
      console.log(`ScanNutritionPage.ngOnInit: brandsText ${this.brandsText}`);
      console.log(`ScanNutritionPage.ngOnInit: nameS3ImageKey ${this.nameS3ImageKey}`);
      console.log(`ScanNutritionPage.ngOnInit: frontS3ImageKey ${this.frontS3ImageKey}`);
      console.log(`ScanNutritionPage.ngOnInit: frontImage ${this.frontImage}`);
    } catch (error) {
      console.error(`ScanNutritionPage.ngOnInit Error: ${JSON.stringify(error)}`);
    }
  }

  ionViewWillEnter(): void {
    console.log(`ScanNutritionPage.ionViewWillEnter - beginning of ionViewWillEnter`);
    this.profile = this.profileState.getHealthProfile();
    console.log(`ScanNutritionPage.ngOnInit: profile from state: ${JSON.stringify(this.profile)}`);
    this.imageCaptured = false;
    this.imageSrc = "";
  }

  // async scanNutrition() {
  //   try {
  //     const imageData = await this.imageService.captureImageDataURL();
  //     this.presentLoading('Loading Image Cropper');
  //     const croppedImageData = await this.openCropperModal(imageData);
  //     this.imageCaptured = true;
  //     this.imageSrc = croppedImageData;
  //     const rawImageData = croppedImageData.replace('data:image/jpeg;base64,', '');
  //     const imageKeyInS3 = await this.imageService.callUploadToS3(rawImageData, `nutrients-${this.barcode}`);
  //     this.nutritionS3ImageKey = imageKeyInS3;
  //     console.log(`ScanNutritionPage.scanNutrition: uploadToS3 key: ${JSON.stringify(imageKeyInS3)}`);
  //   } catch (error) {
  //     console.error(`ScanNutritionPage.scanNutrition: error capturing image and converting to text: ${JSON.stringify(error)}`);
  //   }
  // }

  async scanNutrition() {
    try {
      const imageToTextData = await this.imageToText();
      this.imageCaptured = true;
      this.imageSrc = imageToTextData.image;
      this.nutritionDataText = imageToTextData.text;
      this.nutritionS3ImageKey = imageToTextData.s3ImageKey;
      console.log(`ScanNutritionPage.scan: imageToTextData: ${JSON.stringify(imageToTextData)}`);
      this.profileService.addToProfilePoints(1);
    } catch (error) {
      console.error(`ScanNutritionPage.scanNutrition: failed, user can try again: ${JSON.stringify(error)}`);
    }
  }

  async imageToText(): Promise<ImageToTextData> {
    console.log(`ScanNutritionPage.imageToText: image to text selected`);
    try {
      console.log(`ScanNutritionPage.imageToText: running imageToText function`);
      const imageData = await this.imageService.captureImageDataURL();
      this.presentLoading('Loading Image Cropper');
      const croppedImageData = await this.openCropperModal(imageData);
      this.presentLoading('Getting Text From Image', 5000);
      const rawImageData = croppedImageData.replace('data:image/jpeg;base64,', '');
      const imageToTextData = await this.imageService.callImageToText(rawImageData);
      const imageKeyInS3 = imageToTextData.imageKey;
      const imageText = imageToTextData.imageText;
      this.dismissLoading();
      console.log(`ScanNutritionPage.imageToText: text from service: ${imageText}.`);
      return {
        text: imageText,
        image: croppedImageData || '',
        s3ImageKey: imageKeyInS3
      };
    } catch (error) {
      console.error(`ScanNutritionPage.imageToText: error capturing image and converting to text: ${JSON.stringify(error)}`);
      this.dismissLoading();
      throw error;
    }
  }

  resetSection() {
    this.imageCaptured = false;
    this.imageSrc = "";
    this.nutritionS3ImageKey = '';
  }

  continue() {
    console.log(`ScanNutritionPage.continue: calling continue with the nutritionS3ImageKey ${this.nutritionS3ImageKey}`);
    const navExtras: NavigationExtras = {
      state: {
        barcode: this.barcode,
        nameText: this.nameText,
        brandsText: this.brandsText,
        nameS3ImageKey: this.nameS3ImageKey,
        frontS3ImageKey: this.frontS3ImageKey,
        frontImage: this.frontImage,
        nutritionS3ImageKey: this.nutritionS3ImageKey,
        nutritionDataText: this.nutritionDataText
      }
    };
    console.log(`ScanNutritionPage.continue: navExtras  ${JSON.stringify(navExtras)}`);
    this.navCtrl.navigateForward('tabs/product/scanIngredients', navExtras);
  }

  async openCropperModal(imageData: string): Promise<string> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: ScanNutritionCropperModalPage,
      componentProps: {
        imageInput: imageData
      }
    });
    await this.dismissLoading();
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    console.log(`ScanNutritionPage.openCropperModal: modal dismissed, data: ${JSON.stringify(data)}`);
    console.log(`ScanNutritionPage.openCropperModal: modal dismissed, role: ${JSON.stringify(role)}`);
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
