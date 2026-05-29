import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { NavController, InfiniteScrollCustomEvent, IonContent } from '@ionic/angular';
import { ProfileState } from '../profile/profile.state';
import { CompatibilityService } from '../util/compatibility.service';
import { SupabaseProduct, SupabaseProductPage, SupabaseProductService } from '../util/supabase-product.service';

type FilterMode = 'all' | 'compatible' | 'avoid';

@Component({
  selector: 'app-results',
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.scss'],
})
export class ResultsPage implements OnInit {

  public products: SupabaseProduct[] = [];
  public filteredProducts: SupabaseProduct[] = [];
  public category = '';
  public activeFilter: FilterMode = 'all';
  public loading = false;

  private slug = '';
  private nextPageRequested = false;
  private resultsSoFar = 0;
  private page = 0;
  private resultsTotal = 0;
  private pageSize = 24;

  @ViewChild(IonContent) content: IonContent | undefined;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private profileState: ProfileState,
    private supabaseProducts: SupabaseProductService,
    private compatibility: CompatibilityService,
  ) {}

  ngOnInit() {}

  async ionViewWillEnter(): Promise<void> {
    try {
      this.content?.scrollToTop(1);
      this.nextPageRequested = false;
      this.products = [];
      this.filteredProducts = [];
      this.activeFilter = 'all';
      this.loading = true;

      const profile = this.profileState.getHealthProfile();
      const allergies: string[] = profile?.medical?.allergies?.map((a: any) => a.name as string) ?? [];
      const conditions: string[] = profile?.medical?.medicalConditions?.map((a: any) => a.name as string) ?? [];
      const diets: string[] = profile?.medical?.lifestyleDiet?.map((a: any) => a.name as string) ?? [];
      this.compatibility.setWarnings({ allergies, conditions, diets });

      let nav = this.router.getCurrentNavigation() ?? this.router.lastSuccessfulNavigation;
      if (!nav?.extras?.state) { this.loading = false; return; }

      const state = JSON.parse(JSON.stringify(nav.extras.state));
      this.category = state['category'] || '';
      this.slug = state['slug'] || '';

      const supabaseResults: SupabaseProductPage = state['supabaseResults'];
      if (supabaseResults?.products?.length) {
        this.products = supabaseResults.products;
        this.resultsTotal = supabaseResults.total;
        this.resultsSoFar = supabaseResults.products.length;
        this.page = supabaseResults.page || 0;
        this.pageSize = supabaseResults.pageSize || 24;
      }
    } catch (error) {
      console.error(`ResultsPage.ionViewWillEnter Error: ${JSON.stringify(error)}`);
    } finally {
      this.loading = false;
      this.applyFilter();
    }
  }

  setFilter(mode: FilterMode) {
    this.activeFilter = mode;
    this.applyFilter();
  }

  private applyFilter() {
    if (this.activeFilter === 'all') {
      this.filteredProducts = this.products;
      return;
    }
    this.filteredProducts = this.products.filter(p => {
      const result = this.compatibility.score(p);
      if (this.activeFilter === 'compatible') return result.status !== 'avoid';
      return result.status === 'avoid';
    });
  }

  selectProduct(id: string): void {
    const product = this.products.find(p => p.id === id);
    if (!product) return;
    const navExtras: NavigationExtras = { state: { supabaseProduct: product } };
    this.navCtrl.navigateForward('tabs/product', navExtras);
  }

  getCompatStatus(product: SupabaseProduct): string {
    if (!this.compatibility.hasProfile) return 'none';
    return this.compatibility.score(product).status;
  }

  getCompatLabel(product: SupabaseProduct): string {
    if (!this.compatibility.hasProfile) return '';
    const result = this.compatibility.score(product);
    return result.statusLabel;
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
      const newResults = this.slug
        ? await this.supabaseProducts.getProductsByCategory(this.slug, nextPage, this.pageSize)
        : await this.supabaseProducts.searchProducts(this.category, nextPage, this.pageSize);
      for (const product of newResults.products) {
        this.products.push(product);
      }
      this.resultsSoFar += newResults.products.length;
      this.page = nextPage;
      this.applyFilter();
    } catch (error) {
      console.error(`ResultsPage.requestNextPage: ${JSON.stringify(error)}`);
    }
  }

  getThumbUrl(product: SupabaseProduct): string {
    return product.image_front_url || '';
  }

  hasWarning(product: SupabaseProduct): boolean {
    return this.compatibility.score(product).status === 'avoid';
  }
}
