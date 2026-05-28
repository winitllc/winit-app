import { Component, OnInit } from '@angular/core';
import { LoadingController, LoadingOptions, ModalController, NavController } from '@ionic/angular';
import ImageService from '../util/image.service';
import { ScanIngredientsCropperModalPage } from './scanIngredients-cropperModal.page';
import { ProfileState } from '../profile/profile.state';
import { ProfileService } from '../profile/profile.service';
import { OpenFoodFactsProductUpdate, ProductService } from '../product/product.service';
import { NavigationExtras, Router } from '@angular/router';
import { model } from 'wuzinit-common';
import { AppConfig } from '../app.config';

@Component({
  selector: 'app-scanIngredients',
  templateUrl: 'scanIngredients.page.html',
  styleUrls: ['scanIngredients.page.scss']
})
export class ScanIngredientsPage implements OnInit {

  imageCaptured: boolean = false;
  ingredientsText: any = '';
  imageSrc: string = '';
  loading: HTMLIonLoadingElement | null = null;
  profile: any;
  barcode: string = '';
  nameText: string = '';
  brandsText: string = '';
  nameS3ImageKey:string = '';
  frontS3ImageKey: string = '';
  nutritionS3ImageKey: string = '';
  nutritionDataText: string = '';
  frontImage: string = '';
  backS3ImageKey: string = '';
  ingredientsS3ImageKey: string = '';

  constructor(
    private imageService: ImageService,
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private router: Router,
    private navCtrl: NavController,
    private profileState: ProfileState,
    private profileService: ProfileService,
    private productService: ProductService
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      console.log(`ScanIngredientsPage.ngOnInit setting up scan page`);
      this.imageCaptured = false;
      let currNavigation = this.router.getCurrentNavigation();
      if (!currNavigation) {
        console.log(`ProductPage.ngOnInit: no currNavigation found, using last successful`);
        currNavigation = this.router.lastSuccessfulNavigation;
      }
      console.log(`ScanIngredientsPage.ngOnInit: currNavigation.extras.state ${JSON.stringify(currNavigation?.extras.state)}`);
      const routerState = JSON.parse(JSON.stringify(currNavigation?.extras.state));
      this.barcode = routerState['barcode'];
      this.nameText = routerState['nameText'];
      this.brandsText = routerState['brandsText'];
      this.nameS3ImageKey = routerState['nameS3ImageKey'];
      this.frontS3ImageKey = routerState['frontS3ImageKey'];
      this.nutritionS3ImageKey = routerState['nutritionS3ImageKey'];
      this.nutritionDataText = routerState['nutritionDataText'];
      this.frontImage = routerState['frontImage'];
      this.backS3ImageKey = routerState['backS3ImageKey'];
      console.log(`ScanIngredientsPage.ngOnInit: barcode ${this.barcode}`);
      console.log(`ScanIngredientsPage.ngOnInit: nameText ${this.nameText}`);
      console.log(`ScanIngredientsPage.ngOnInit: brandsText ${this.brandsText}`);
      console.log(`ScanIngredientsPage.ngOnInit: nameS3ImageKey ${this.nameS3ImageKey}`);
      console.log(`ScanIngredientsPage.ngOnInit: frontS3ImageKey ${this.frontS3ImageKey}`);
      console.log(`ScanIngredientsPage.ngOnInit: nutritionS3ImageKey ${this.nutritionS3ImageKey}`);
      console.log(`ScanIngredientsPage.ngOnInit: nutritionDataText ${this.nutritionDataText}`);
      console.log(`ScanIngredientsPage.ngOnInit: frontImage ${this.frontImage}`);
      console.log(`ScanIngredientsPage.ngOnInit: backS3ImageKey ${this.backS3ImageKey}`);
    } catch (error) {
      console.error(`ScanIngredientsPage.ngOnInit Error: ${JSON.stringify(error)}`);
    }
  }

  ionViewWillEnter(): void {
    console.log(`ScanIngredientsPage.ionViewWillEnter - beginning of ionViewWillEnter`);
    this.profile = this.profileState.getHealthProfile();
    console.log(`ScanIngredientsPage.ngOnInit: profile from state: ${JSON.stringify(this.profile)}`);
    this.imageCaptured = false;
    this.ingredientsText = "";
    this.imageSrc = "";
  }

  async scanIngredients() {
    try {
      const imageToTextData = await this.imageToText();
      this.imageCaptured = true;
      this.imageSrc = imageToTextData.image;
      this.ingredientsText = imageToTextData.text;
      this.ingredientsS3ImageKey = imageToTextData.s3ImageKey;
      console.log(`ScanIngredientsPage.scan: imageToTextData: ${JSON.stringify(imageToTextData)}`);
      this.profileService.addToProfilePoints(1);
    } catch (error) {
      console.error(`ScanIngredientsPage.scanIngredients: failed, user can try again: ${JSON.stringify(error)}`);
    }
  }

  resetSection() {
    this.imageCaptured = false;
    this.ingredientsText = "";
    this.imageSrc = "";
  }

  async continue() {
    const productUpdate: OpenFoodFactsProductUpdate = {
      code: this.barcode,
      product_name_en: this.nameText,
      brands: this.brandsText,
      image_url: `https://d37c5yx0fg82pb.cloudfront.net/${this.frontS3ImageKey}`,
      image_front_url: `https://d37c5yx0fg82pb.cloudfront.net/${this.frontS3ImageKey}`,
      ingredients_text: this.ingredientsText,
      nutrition_data: this.nutritionDataText,
      image_ingredients_url: `https://d37c5yx0fg82pb.cloudfront.net/${this.ingredientsS3ImageKey}`,
      image_nutrition_url: `https://d37c5yx0fg82pb.cloudfront.net/${this.nutritionS3ImageKey}`
    };
    this.presentLoading('Sending new product to product update service for review.');
    await this.productService.addNewProductUpdate(productUpdate);
    this.dismissLoading();
    productUpdate.image_front_url = this.frontImage;
    console.log(`ScanIngredientsPage.continue: product to push to product page: ${JSON.stringify(productUpdate)}`);
    const navExtras: NavigationExtras = {
      state: {
        product: productUpdate
      }
    };
    console.log(`ScanIngredientsPage.continue: navExtras: ${JSON.stringify(navExtras)}`);
    this.navCtrl.navigateForward('tabs/product', navExtras);
  }

  async imageToText(): Promise<ImageToTextData> {
    console.log(`ScanIngredientsPage.imageToText: image to text selected`);
    try {
      console.log(`ScanIngredientsPage.imageToText: running imageToText function`);
      const imageData = await this.imageService.captureImageDataURL();
      this.presentLoading('Loading Image Cropper');
      const croppedImageData = await this.openCropperModal(imageData);
      this.presentLoading('Getting Text From Image', 5000);
      const rawImageData = croppedImageData.replace('data:image/jpeg;base64,', '');
      const imageToTextData = await this.imageService.callImageToText(rawImageData);
      const imageKeyInS3 = imageToTextData.imageKey;
      const imageText = imageToTextData.imageText;
      this.dismissLoading();
      console.log(`ScanIngredientsPage.imageToText: text from service: ${imageText}.`);
      return {
        text: imageText,
        image: croppedImageData || '',
        s3ImageKey: imageKeyInS3
      };
    } catch (error) {
      console.error(`ScanIngredientsPage.imageToText: error capturing image and converting to text: ${JSON.stringify(error)}`);
      this.dismissLoading();
      throw error;
    }
  }

  async openCropperModal(imageData: string): Promise<string> {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: ScanIngredientsCropperModalPage,
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

  // addAlertHighlights(ingredientsText: string): string {
  //   const ingredientsText: string = ingredientsText.split(/\.\s+|\.$/).map((sentence) => {
  //     console.log(`ProductPage.addAlertHighlights: sentence to check: ${sentence}`);
  //     return sentence.split(/,\s+/).map((phrase) => {
  //       console.log(`ProductPage.addAlertHighlights: phrase to check: ${phrase}`);
  //       return phrase.split(' ').map((word) => {
  //         console.log(`ProductPage.addAlertHighlights: word to check: ${word}`);
  //         return this.matchWarnings(word) ? `<span background="danger">${word}</span>` : word;
  //       }).join(' ');
  //     }).join(', ');
  //   }).join('. ');
  //   console.log(`ProductPage.addAlertHighlights: new text for ingredients with highlights: ${ingredientsText}`);
  //   return ingredientsText;
  // }

  // matchWarnings(phraseOrWord: string): boolean {
  //   const warnings = this.warnings;
  //   console.log(`ProductPage.matchWarnings: warnings: ${JSON.stringify(warnings)}`);
  //   return warnings.reduce((prevResult, currWarning) => {
  //     console.log(`ProductPage.matchWarnings: currWarning to check: ${currWarning}`);
  //     return prevResult || phraseOrWord.toLowerCase().includes(currWarning.toLowerCase());
  //   }, false);
  // }

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
