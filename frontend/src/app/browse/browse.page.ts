import { Component, OnInit } from '@angular/core';
import { AppConfig } from '../app.config';

import { NavController, LoadingController, LoadingOptions, ModalController } from '@ionic/angular';
import { NavigationExtras } from '@angular/router';
import { ProductSearchResult, ProductService } from '../product/product.service';
import { SearchProductModalComponent } from './search-productModal.page';

@Component({
  selector: 'app-browse',
  templateUrl: 'browse.page.html',
  styleUrls: ['browse.page.scss']
})
export class BrowsePage implements OnInit {

  loading: HTMLIonLoadingElement | null = null;
  public categories = AppConfig.categories.mainCategories;

  constructor(
    public navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private productService: ProductService
  ) {}

  async ngOnInit(): Promise<void> {}

  async browseProducts(tag: string, displayName: string) {
    console.log(`BrowsePage.browseProducts: tag=${tag}`);
    try {
      await this.presentLoading(`Loading ${displayName}…`);
      const productSearchResults: ProductSearchResult = await this.productService.searchProductByCategory(tag);
      console.log(`BrowsePage.browseProducts: count=${productSearchResults.count}`);
      await this.dismissLoading();
      this.pushToResultsPage(productSearchResults, displayName, tag);
    } catch (error) {
      await this.dismissLoading();
      console.error(`BrowsePage.browseProducts Error: ${JSON.stringify(error)}`);
    }
  }

  async searchProductModal() {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: SearchProductModalComponent,
      showBackdrop: false
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'confirm' || !data) {
      return;
    }
    // Modal returns { tag, displayName }
    this.browseProducts(data.tag, data.displayName);
  }

  private pushToResultsPage(productSearchResults: ProductSearchResult, category: string, tag: string): void {
    const navExtras: NavigationExtras = {
      state: { productSearchResults, category, tag }
    };
    this.navCtrl.navigateForward('tabs/results', navExtras);
  }

  private async presentLoading(message: string) {
    await this.dismissLoading();
    const loadingOpts: LoadingOptions = {
      message,
      showBackdrop: true,
      spinner: 'circular',
      cssClass: 'loading-modal'
    };
    this.loading = await this.loadingCtrl.create(loadingOpts);
    this.loading.present();
  }

  async dismissLoading() {
    await this.loading?.dismiss();
  }
}
