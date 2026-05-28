import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { NavController, LoadingController, InfiniteScrollCustomEvent, IonContent } from '@ionic/angular';
import { ProfileState } from '../profile/profile.state';
import { OpenFoodFactsProduct, ProductSearchResult, ProductService } from '../product/product.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.scss'],
})
export class ResultsPage implements OnInit {

  public noResults = false;
  public products: OpenFoodFactsProduct[] = [];
  public category = '';

  private tag = '';
  private nextPageRequested = false;
  private resultsSoFar = 0;
  private page = 0;
  private resultsCount = 0;
  private warnings: string[] = [];

  @ViewChild(IonContent) content: IonContent | undefined;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private profileState: ProfileState,
    private productService: ProductService
  ) {}

  ngOnInit() {}

  async ionViewWillEnter(): Promise<void> {
    try {
      this.content?.scrollToTop(1);
      this.nextPageRequested = false;
      this.products = [];
      this.noResults = false;

      const profile = this.profileState.getHealthProfile();
      this.warnings = profile?.medical?.allergies?.map((a: any) => a.name as string) ?? [];

      let nav = this.router.getCurrentNavigation() ?? this.router.lastSuccessfulNavigation;
      if (!nav?.extras?.state) {
        this.noResults = true;
        return;
      }

      const state = JSON.parse(JSON.stringify(nav.extras.state));
      const searchResults: ProductSearchResult = state['productSearchResults'];
      this.category = state['category'] || '';
      this.tag = state['tag'] || this.category;

      if (searchResults?.products?.length) {
        this.products = searchResults.products;
        this.resultsCount = searchResults.count;
        this.resultsSoFar = searchResults.products.length;
        this.page = searchResults.page || 1;
        this.noResults = false;
      } else {
        this.noResults = true;
      }
    } catch (error) {
      console.error(`ResultsPage.ionViewWillEnter Error: ${JSON.stringify(error)}`);
      this.noResults = true;
    }
  }

  selectProduct(id: string): void {
    const product = this.products.find(p => p.id === id);
    if (!product) return;
    const navExtras: NavigationExtras = { state: { product } };
    this.navCtrl.navigateForward('tabs/product', navExtras);
  }

  public async scrollEvent(infiniteScroll: InfiniteScrollCustomEvent): Promise<void> {
    try {
      if (this.resultsSoFar >= this.resultsCount || this.nextPageRequested) {
        infiniteScroll.target.complete();
        return;
      }
      this.nextPageRequested = true;
      await this.requestNextPage();
      infiniteScroll.target.complete();
      this.nextPageRequested = false;
    } catch (error) {
      console.error(`ResultsPage.scrollEvent: ${JSON.stringify(error)}`);
      infiniteScroll.target.complete();
    }
  }

  private async requestNextPage(): Promise<void> {
    try {
      const nextPage = String(this.page + 1);
      const newResults: ProductSearchResult = await this.productService.searchProductByCategory(this.tag, nextPage);
      for (const product of newResults.products) {
        this.products.push(product);
      }
      this.resultsSoFar += newResults.products.length;
      this.page += 1;
      console.log(`ResultsPage.requestNextPage: page=${this.page} total=${this.resultsSoFar}`);
    } catch (error) {
      console.error(`ResultsPage.requestNextPage: ${JSON.stringify(error)}`);
    }
  }

  getThumbUrl(product: OpenFoodFactsProduct): string {
    return product.image_thumb_url
      || product.image_front_thumb_url
      || product.image_front_url
      || '';
  }

  hasWarning(product: OpenFoodFactsProduct): boolean {
    if (!this.warnings.length || !product.ingredients_text) return false;
    const text = product.ingredients_text.toLowerCase();
    return this.warnings.some(w => text.includes(w.toLowerCase()));
  }
}
