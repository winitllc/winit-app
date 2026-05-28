import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { NavController, LoadingController, InfiniteScrollCustomEvent, IonContent } from '@ionic/angular';
import { ProfileState } from '../profile/profile.state';
import { SupabaseProduct, SupabaseProductPage, SupabaseProductService } from '../util/supabase-product.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.scss'],
})
export class ResultsPage implements OnInit {

  public noResults = false;
  public products: SupabaseProduct[] = [];
  public category = '';

  private slug = '';
  private nextPageRequested = false;
  private resultsSoFar = 0;
  private page = 0;
  private resultsTotal = 0;
  private pageSize = 24;
  private warnings: string[] = [];

  @ViewChild(IonContent) content: IonContent | undefined;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private profileState: ProfileState,
    private supabaseProducts: SupabaseProductService,
  ) {}

  ngOnInit() {}

  async ionViewWillEnter(): Promise<void> {
    try {
      this.content?.scrollToTop(1);
      this.nextPageRequested = false;
      this.products = [];
      this.noResults = false;

      const profile = this.profileState.getHealthProfile();
      // Collect all user health flags for warning matching
      const allergies: string[] = profile?.medical?.allergies?.map((a: any) => a.name as string) ?? [];
      const intolerances: string[] = profile?.medical?.foodIntolerances?.map((a: any) => a.name as string) ?? [];
      const diets: string[] = profile?.medical?.lifestyleDiet?.map((a: any) => a.name as string) ?? [];
      this.warnings = [...allergies, ...intolerances];

      let nav = this.router.getCurrentNavigation() ?? this.router.lastSuccessfulNavigation;
      if (!nav?.extras?.state) { this.noResults = true; return; }

      const state = JSON.parse(JSON.stringify(nav.extras.state));
      this.category = state['category'] || '';
      this.slug = state['slug'] || this.category;

      const supabaseResults: SupabaseProductPage = state['supabaseResults'];
      if (supabaseResults?.products?.length) {
        this.products = supabaseResults.products;
        this.resultsTotal = supabaseResults.total;
        this.resultsSoFar = supabaseResults.products.length;
        this.page = supabaseResults.page || 0;
        this.pageSize = supabaseResults.pageSize || 24;
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
    const navExtras: NavigationExtras = { state: { supabaseProduct: product } };
    this.navCtrl.navigateForward('tabs/product', navExtras);
  }

  public async scrollEvent(infiniteScroll: InfiniteScrollCustomEvent): Promise<void> {
    try {
      if (this.resultsSoFar >= this.resultsTotal || this.nextPageRequested) {
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
      const nextPage = this.page + 1;
      const newResults = await this.supabaseProducts.getProductsByCategory(this.slug, nextPage, this.pageSize);
      for (const product of newResults.products) {
        this.products.push(product);
      }
      this.resultsSoFar += newResults.products.length;
      this.page = nextPage;
    } catch (error) {
      console.error(`ResultsPage.requestNextPage: ${JSON.stringify(error)}`);
    }
  }

  getThumbUrl(product: SupabaseProduct): string {
    return product.image_front_url || '';
  }

  hasWarning(product: SupabaseProduct): boolean {
    if (!this.warnings.length) return false;
    // Check normalized allergen_tags first (reliable)
    if (product.allergen_tags?.length) {
      const allergens = product.allergen_tags.map(t => t.toLowerCase());
      if (this.warnings.some(w => allergens.includes(w.toLowerCase()))) return true;
    }
    // Fall back to ingredient text scan
    if (product.ingredients_text) {
      const text = product.ingredients_text.toLowerCase();
      if (this.warnings.some(w => text.includes(w.toLowerCase()))) return true;
    }
    return false;
  }

  matchesDiet(product: SupabaseProduct, diet: string): boolean {
    return product.diet_tags?.some(t => t.toLowerCase() === diet.toLowerCase()) ?? false;
  }
}
