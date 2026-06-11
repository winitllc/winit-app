import { Component, OnInit, ViewChild } from '@angular/core';
import { Router, NavigationExtras } from '@angular/router';
import { NavController, InfiniteScrollCustomEvent, IonContent } from '@ionic/angular';
import { CompatibilityService } from '../util/compatibility.service';
import { SupabaseProduct, SupabaseProductPage, SupabaseProductService } from '../util/supabase-product.service';
import { WinitAuthService } from '../util/winit-auth.service';

type FilterMode = 'all' | 'compatible' | 'avoid';

// Diet tags that signal "free from X" for the safe label strip
const SAFE_TAG_LABELS: Record<string, string> = {
  'vegan': 'Vegan', 'vegetarian': 'Vegetarian',
  'gluten-free': 'Gluten Free', 'gluten_free': 'Gluten Free',
  'dairy-free': 'Dairy Free', 'dairy_free': 'Dairy Free',
  'nut-free': 'Nut Free', 'nut_free': 'Nut Free',
  'organic': 'Organic', 'non-gmo': 'Non-GMO',
  'keto': 'Keto', 'paleo': 'Paleo',
  'halal': 'Halal', 'kosher': 'Kosher',
  'low-sugar': 'Low Sugar', 'high-protein': 'High Protein',
};

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
  private queryStr = '';
  private nextPageRequested = false;
  private resultsSoFar = 0;
  private page = 0;
  private resultsTotal = 0;
  private pageSize = 24;
  private userAllergenIds: string[] = [];

  @ViewChild(IonContent) content: IonContent | undefined;

  constructor(
    private navCtrl: NavController,
    private router: Router,
    private winitAuth: WinitAuthService,
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

      const winitUser = await this.winitAuth.getProfile();
      const allergies: string[] = winitUser?.allergy_ids ?? [];
      const conditions: string[] = winitUser?.condition_ids ?? [];
      const diets: string[] = winitUser?.diet_ids ?? [];
      this.userAllergenIds = [...allergies, ...conditions].map(s => s.toLowerCase());
      this.compatibility.setWarnings({ allergies, conditions, diets });

      // Use Router.url directly — ActivatedRoute.snapshot is stale when Ionic
      // reuses a cached page component (ionViewWillEnter fires but snapshot
      // still holds the previous navigation's params)
      const currentUrl = new URL('http://x' + this.router.url);
      this.slug = currentUrl.searchParams.get('slug') ?? '';
      this.category = currentUrl.searchParams.get('category') ?? '';
      const query = currentUrl.searchParams.get('query') ?? '';
      this.queryStr = query;

      if (!this.slug && !query) { this.loading = false; return; }

      let result: SupabaseProductPage;
      if (this.slug) {
        result = await this.supabaseProducts.getProductsByCategory(this.slug, 0, this.pageSize);
      } else {
        result = await this.supabaseProducts.searchProducts(query, 0, this.pageSize);
      }
      this.products = result.products;
      this.resultsTotal = result.total;
      this.resultsSoFar = result.products.length;
      this.page = 0;
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
      if (p.status === 'pending') return this.activeFilter === 'compatible';
      const result = this.compatibility.score(p);
      if (this.activeFilter === 'compatible') return result.status === 'approved';
      return result.status === 'avoid';
    });
  }

  /** Returns user-relevant allergen names found in the product */
  getDangerFlags(product: SupabaseProduct): string[] {
    if (!this.userAllergenIds.length) return [];
    const result = this.compatibility.score(product);
    return result.flags
      .filter(f => f.severity === 'danger')
      .map(f => f.reason)
      .slice(0, 3);
  }

  /** Returns safe/free-from labels from diet_tags (max 2) */
  getSafeLabels(product: SupabaseProduct): string[] {
    const labels: string[] = [];
    for (const tag of (product.diet_tags ?? [])) {
      const key = tag.replace(/^en:/, '').toLowerCase();
      for (const [k, label] of Object.entries(SAFE_TAG_LABELS)) {
        if (key.includes(k) && !labels.includes(label)) {
          labels.push(label);
          break;
        }
      }
      if (labels.length >= 2) break;
    }
    return labels;
  }

  getCompatStatus(product: SupabaseProduct): string {
    if (product.status === 'pending') return 'pending';
    if (!this.compatibility.hasProfile) return 'none';
    return this.compatibility.score(product).status;
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
      const newResults = this.slug
        ? await this.supabaseProducts.getProductsByCategory(this.slug, nextPage, this.pageSize)
        : await this.supabaseProducts.searchProducts(this.queryStr, nextPage, this.pageSize);
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
