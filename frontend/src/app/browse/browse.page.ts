import { Component, OnInit } from '@angular/core';
import { AppConfig } from '../app.config';
import { NavController, ModalController } from '@ionic/angular';
import { SearchProductModalComponent } from './search-productModal.page';
import { SupabaseProductService, SupabaseCategory } from '../util/supabase-product.service';

@Component({
  selector: 'app-browse',
  templateUrl: 'browse.page.html',
  styleUrls: ['browse.page.scss']
})
export class BrowsePage implements OnInit {

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
    private modalCtrl: ModalController,
    private supabaseProducts: SupabaseProductService,
  ) {}

  async ngOnInit(): Promise<void> {
    try {
      const cats = await this.supabaseProducts.getCategories();
      if (cats.length) this.categories = cats;
    } catch { /* fallback to AppConfig */ }
  }

  browseProducts(slug: string, displayName: string) {
    this.navCtrl.navigateForward(`tabs/results?slug=${encodeURIComponent(slug)}&category=${encodeURIComponent(displayName)}`);
  }

  async openSearch() {
    const modal: HTMLIonModalElement = await this.modalCtrl.create({
      component: SearchProductModalComponent,
      breakpoints: [0, 1],
      initialBreakpoint: 1,
      cssClass: 'search-modal-sheet',
    });
    modal.present();

    const { data, role } = await modal.onWillDismiss();
    if (role !== 'confirm' || !data) return;

    if (data.type === 'category') {
      this.browseProducts(data.tag, data.displayName);
    } else if (data.type === 'search') {
      this.navCtrl.navigateForward(`tabs/results?query=${encodeURIComponent(data.query)}&category=${encodeURIComponent('"' + data.query + '"')}`);
    }
  }
}

