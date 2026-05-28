import { Component, OnInit } from '@angular/core';
import { AppConfig } from '../app.config';

import { NavController, LoadingController, LoadingOptions, ModalController } from '@ionic/angular';
import { NavigationExtras } from '@angular/router';
import { AuthService } from '../util/auth.service';
import { ProfileService } from '../profile/profile.service';
import { OpenFoodFactsProduct, ProductService } from '../product/product.service';
import { SearchProductModalComponent } from './search-productModal.page';

@Component({
  selector: 'app-browse',
  templateUrl: 'browse.page.html',
  styleUrls: ['browse.page.scss']
})
export class BrowsePage implements OnInit {

  loading: HTMLIonLoadingElement | null = null;
  public categories: any[] = AppConfig.categories.mainCategories;
  public searchBox: string = '';

  constructor(
    public navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private productService: ProductService
  ) {
    // this.resetSearchbox();
  }

  async ngOnInit(): Promise<void> {
    try {

    } catch (error) {
      console.error(`BrowsePage.ngOnInit Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }
  
  async browseProducts(category: string) {
    console.log(`BrowsePage.browseProducts: category to search: ${category}`);
    try {
      await this.presentLoading(`searching for ${category}`, 10000);
      const productSearchResults: any = await this.productService.searchProductByCategory(category);
      console.log(`BrowsePage.browseProducts: results from the category search: ${JSON.stringify(productSearchResults)}`);
      await this.dismissLoading();
      this.pushToResultsPage(productSearchResults);
    } catch (error) {
      console.error(`BrowsePage.browseProducts Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async searchProductModal() {

    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: SearchProductModalComponent,
      showBackdrop: false
    });
    console.log(`BrowsePage.searchProductModal: modal set up`);
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    console.log(`BrowsePage.searchProductModal: modal dismissed, data: ${JSON.stringify(data)}`);
    console.log(`BrowsePage.searchProductModal: modal dismissed, role: ${JSON.stringify(role)}`);
    if (role !== 'confirm') {
      return;
    }
    if (data) {
      console.log(`BrowsePage.searchProductModal: search item: ${JSON.stringify(data)}`);
      this.browseProducts(data);
    }
  }

  private pushToResultsPage(productSearchResults: any): void {
    try {
      // this.profileService.addToProfilePoints(AppConfig.pointAwards.scan);
      console.log(`BrowsePage.pushToResultsPage: pushing the product results to results page: ${JSON.stringify(productSearchResults)}`);
      const navExtras: NavigationExtras = {
        state: {
          productSearchResults
        }
      };
      console.log(`BrowsePage.pushToResultsPage: nav extras for results page: ${JSON.stringify(navExtras)}`);
      this.navCtrl.navigateForward('tabs/results', navExtras);
    } catch (error) {
      console.error(`BrowsePage.pushToResultsPage: Error pushing to the results page: ${JSON.stringify(error)}`);
    }
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
