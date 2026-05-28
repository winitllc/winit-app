import { Component, NgZone, OnInit } from '@angular/core';
import { LoadingController, LoadingOptions, ModalController, NavController } from '@ionic/angular';
import { Barcode, BarcodeFormat, BarcodeScanner, LensFacing } from '@capacitor-mlkit/barcode-scanning';
import { UntypedFormControl, UntypedFormGroup } from '@angular/forms';
import { BarcodeScanningModalComponent } from './barcode-scanningModal.page';
import { model } from 'wuzinit-common';
import { NavigationExtras } from '@angular/router';
import { ProfileState } from '../profile/profile.state';
import { AppConfig } from '../app.config';
import { ProductService, OpenFoodFactsProduct } from '../product/product.service';

@Component({
  selector: 'barcode-scan',
  templateUrl: 'barcode.page.html',
  styleUrls: ['barcode.page.scss']
})
export class BarcodePage implements OnInit {

  loading: HTMLIonLoadingElement | null = null;
  profile: any;
  public isSupported = false;
  public isPermissionGranted = false;
  barcode: Barcode | undefined;
  public formGroup = new UntypedFormGroup({
    formats: new UntypedFormControl([]),
    lensFacing: new UntypedFormControl(LensFacing.Back),
    googleBarcodeScannerModuleInstallState: new UntypedFormControl(0),
    googleBarcodeScannerModuleInstallProgress: new UntypedFormControl(0),
  });

  constructor(
    private modalCtrl: ModalController,
    private loadingCtrl: LoadingController,
    private profileState: ProfileState,
    private navCtrl: NavController,
    private productService: ProductService,
    private readonly ngZone: NgZone,
  ) { }

  async ngOnInit(): Promise<void> {
    try {
      console.log(`BarcodePage.ngOnInit: setting up barcode scan page`);
      const supportedResult = await BarcodeScanner.isSupported();
      this.isSupported = supportedResult.supported;
      console.log(`BarcodePage.ngOnInit: barcode is supported: ${supportedResult.supported}`);
      const permissionsResult = await BarcodeScanner.checkPermissions();
      this.isPermissionGranted = permissionsResult.camera === 'granted';
      console.log(`BarcodePage.ngOnInit: permissions checked: ${permissionsResult.camera}`);
      BarcodeScanner.removeAllListeners().then(() => {
        console.log(`BarcodePage.ngOnInit: permissions checked`);
        BarcodeScanner.addListener(
          'googleBarcodeScannerModuleInstallProgress',
          (event) => {
            this.ngZone.run(() => {
              console.log('googleBarcodeScannerModuleInstallProgress', event);
              const { state, progress } = event;
              this.formGroup.patchValue({
                googleBarcodeScannerModuleInstallState: state,
                googleBarcodeScannerModuleInstallProgress: progress,
              });
            });
          },
        );
      });
    } catch (error) {
      console.error(`BarcodePage.ngOnInit: Error: ${JSON.stringify(error)}`);
    }
  }

  ionViewWillEnter(): void {
    console.log(`BarcodePage.ionViewWillEnter - beginning of ionViewWillEnter`);
    this.profile = this.profileState.getHealthProfile();
    console.log(`BarcodePage.ngOnInit: profile from state: ${JSON.stringify(this.profile)}`);

  }

  async scan() {
    console.log(`BarcodePage.scan: scan called`);
    const lensFacing = LensFacing.Back;
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: BarcodeScanningModalComponent,
      cssClass: 'barcode-scanning-modal',
      showBackdrop: false,
      componentProps: {
        formats: [],
        lensFacing: lensFacing,
      }
    });
    console.log(`BarcodePage.scan: modal set up`);
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    console.log(`BarcodePage.scan: data from modal: ${JSON.stringify(data)}`);
    console.log(`BarcodePage.scan: role from modal: ${JSON.stringify(role)}`);
    const barcode: Barcode = data as Barcode;
    this.barcode = barcode;
    console.log(`BarcodePage.scan: the barcode: ${JSON.stringify(this.barcode)}`);
    const productFromOpenFoodFacts: OpenFoodFactsProduct = await this.productService.getProductByBarcode(barcode.displayValue);
    console.log(`BarcodePage.scan: productFromOpenFoodFacts: ${JSON.stringify(productFromOpenFoodFacts)}`);
    console.log(`BarcodePage.scan: has code?: ${JSON.stringify(productFromOpenFoodFacts.hasOwnProperty('code'))}`);
    if (productFromOpenFoodFacts.hasOwnProperty('code')) {
      console.log(`BarcodePage.scan: pushing OFF product to page`);
      this.pushToProductPage(productFromOpenFoodFacts);
    } else {
      console.log(`BarcodePage.scan: pushing 'no product' to page`);
      this.pushToProductPage({
        message: AppConfig.controlMessages.noProduct,
        barcode: barcode.displayValue
      });
    }
  }

  private pushToProductPage(product: OpenFoodFactsProduct | { message: string, barcode: string }): void {
    try {
      // this.profileService.addToProfilePoints(AppConfig.pointAwards.scan);
      console.log(`BarcodePage.pushToProductPage: pushing the product to product page: ${JSON.stringify(product)}`);
      const navExtras: NavigationExtras = {
        state: {
          product
        }
      };
      console.log(`BarcodePage.pushToProductPage: nav extras for product page: ${JSON.stringify(navExtras)}`);
      this.navCtrl.navigateForward('tabs/product', navExtras);
    } catch (error) {
      console.error(`BarcodePage.pushToProductPage: Error pushing to the product page: ${JSON.stringify(error)}`);
    }
  }

  resetSection() {
    console.log(`BarcodePage.scan: reset section`);
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
