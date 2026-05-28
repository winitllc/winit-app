import { Component, OnInit } from '@angular/core';
import { AppConfig } from '../app.config';

import { NavController, LoadingController, LoadingOptions, ModalController } from '@ionic/angular';
import { NavigationExtras } from '@angular/router';
import { SearchProductModalComponent } from './search-productModal.page';
import { SupabaseProductService, SupabaseCategory, SupabaseProductPage } from '../util/supabase-product.service';

@Component({
  selector: 'app-browse',
  templateUrl: 'browse.page.html',
  styleUrls: ['browse.page.scss']
})
export class BrowsePage implements OnInit {

  loading: HTMLIonLoadingElement | null = null;
  public categories: SupabaseCategory[] = AppConfig.categories.mainCategories.map(c => ({
    id: c.tag,
    slug: c.tag,
    display_name: c.displayName,
    image_url: c.image,
    sort_order: 0,
    off_tag: `en:${c.tag}`,
  }));

  constructor(
    public navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private modalCtrl: ModalController,
    private supabaseProducts: SupabaseProductService,
  ) {}

  async ngOnInit(): Promise<void> {
    // Load categories from Supabase so image_url and display_name are always up-to-date
    try {
      const cats = await this.supabaseProducts.getCategories();
      if (cats.length) this.categories = cats;
    } catch {
      // Falls back to AppConfig categories already set above
    }
  }

  async browseProducts(slug: string, displayName: string) {
    try {
      await this.presentLoading(`Loading ${displayName}…`);
      const result: SupabaseProductPage = await this.supabaseProducts.getProductsByCategory(slug);
      await this.dismissLoading();
      this.pushToResultsPage(result, displayName, slug);
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
    if (role !== 'confirm' || !data) return;
    this.browseProducts(data.tag, data.displayName);
  }

  private pushToResultsPage(result: SupabaseProductPage, category: string, slug: string): void {
    const navExtras: NavigationExtras = {
      state: { supabaseResults: result, category, slug }
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
