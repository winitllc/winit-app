import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { NavController, ActionSheetController, Platform, LoadingController, LoadingOptions, ModalController } from '@ionic/angular';
import { AppConfig } from '../app.config';
import { ProfileState } from '../profile/profile.state';
import { OpenFoodFactsProduct, ProductService } from './product.service';
import { SupabaseProduct, SupabaseProductService } from '../util/supabase-product.service';
import { CompatibilityService, CompatibilityResult } from '../util/compatibility.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ContributeModalComponent } from './contribute-modal.component';
import { WinitAuthService } from '../util/winit-auth.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
})
export class ProductPage implements OnInit {

  public noProduct = false;
  public noProductBarcode = '';
  public ingredientsTextHTML: any = '';
  public product?: OpenFoodFactsProduct;
  public supabaseProduct?: SupabaseProduct;
  public productType = 'supabase';
  public compatResult?: CompatibilityResult;
  private userAllergenIds: string[] = [];

  // kept for legacy template bindings
  public dangerWarning = false;
  public poisonWarning = false;
  public allergenPoisonWarning = false;
  public allergenDangerWarning = false;
  public tracesPoisonWarning = false;
  public tracesDangerWarning = false;
  public ingredientsPoisonWarning = false;
  public ingredientsDangerWarning = false;
  public insufficientData = true;
  public warnings: string[] = [];
  public iPhone = false;

  loading: HTMLIonLoadingElement | null = null;

  constructor(
    private actionSheetController: ActionSheetController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private navCtrl: NavController,
    private loadingCtrl: LoadingController,
    private platform: Platform,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private router: Router,
    private productService: ProductService,
    private supabaseProductService: SupabaseProductService,
    private profileState: ProfileState,
    private winitAuth: WinitAuthService,
    public compatibility: CompatibilityService,
  ) {}

  async ngOnInit() {}

  async ionViewWillEnter(): Promise<void> {
    try {
      const profile = this.profileState.getHealthProfile();
      const allergies: string[] = profile?.medical?.allergies?.map((a: any) => a.name as string) ?? [];
      const conditions: string[] = profile?.medical?.medicalConditions?.map((a: any) => a.name as string) ?? [];
      const diets: string[] = profile?.medical?.lifestyleDiet?.map((a: any) => a.name as string) ?? [];
      this.warnings = [...allergies, ...conditions];
      this.userAllergenIds = this.warnings.map(s => s.toLowerCase());
      this.compatibility.setWarnings({ allergies, conditions, diets });
      this.noProduct = true;
      this.compatResult = undefined;
      this.supabaseProduct = undefined;
      this.product = undefined;

      let currNavigation = this.router.getCurrentNavigation() ?? this.router.lastSuccessfulNavigation;
      if (!currNavigation?.extras?.state) return;

      const routerState = JSON.parse(JSON.stringify(currNavigation.extras.state));

      if (routerState['supabaseProduct']) {
        this.supabaseProduct = routerState['supabaseProduct'] as SupabaseProduct;
        this.noProduct = false;
        this.ingredientsTextHTML = this.sanitizer.bypassSecurityTrustHtml(
          this.addAlertHighlights(this.supabaseProduct.ingredients_text || '')
        );
        this.compatResult = this.compatibility.score(this.supabaseProduct);
        return;
      }

      const product = routerState['product'];
      if (!product) return;
      this.productType = product.type || 'off';
      this.noProduct = false;
      if (product?.message === AppConfig.controlMessages.noProduct) {
        this.noProduct = true;
        this.product = JSON.parse(JSON.stringify(AppConfig.emptyWuzinitProduct));
        this.noProductBarcode = product.barcode;
      } else if (product?.code) {
        this.product = JSON.parse(JSON.stringify(product));
        this.ingredientsTextHTML = this.sanitizer.bypassSecurityTrustHtml(
          this.addAlertHighlights(this.product?.ingredients_text || '')
        );
      } else {
        this.noProduct = true;
        this.product = JSON.parse(JSON.stringify(AppConfig.emptyWuzinitProduct));
        this.noProductBarcode = product.barcode;
      }
    } catch (error) {
      console.error(`ProductPage.ionViewWillEnter Error: ${JSON.stringify(error)}`);
    }
  }

  isUserAllergen(tag: string): boolean {
    const t = tag.replace(/^en:/, '').toLowerCase();
    return this.userAllergenIds.some(id => t.includes(id) || id.includes(t));
  }

  public addNewProductInfo() {
    const navExtras: NavigationExtras = { state: { noProductBarcode: this.noProductBarcode } };
    this.navCtrl.navigateForward('tabs/product/scanName', navExtras);
  }

  async openContributeModal() {
    const productId = this.supabaseProduct?.id;
    if (!productId) return;
    const session = await this.winitAuth.restoreSession();
    if (!session) return;
    const modal = await this.modalController.create({
      component: ContributeModalComponent,
      componentProps: { productId, userId: session.user.id, accessToken: session.access_token },
      breakpoints: [0, 0.5, 0.92],
      initialBreakpoint: 0.92,
    });
    await modal.present();
  }

  addAlertHighlights(ingredientsText: string): string {
    if (!ingredientsText) return '';
    return ingredientsText.split(/\.\s+|\.$/).map(sentence =>
      sentence.split(/,\s+/).map(phrase =>
        phrase.split(' ').map(word =>
          this.matchWarnings(word) ? `<span class="ing-danger">${word}</span>` : word
        ).join(' ')
      ).join(', ')
    ).join('. ');
  }

  matchWarnings(word: string): boolean {
    return this.warnings.some(w => word.toLowerCase().includes(w.toLowerCase()));
  }

  async searchKeyword(category: string) {
    try {
      await this.presentLoading(`searching for ${category}`, 10000);
      const productSearchResults: any = await this.productService.searchProductByCategory(category);
      await this.dismissLoading();
      this.pushToResultsPage(productSearchResults);
    } catch (error) {
      console.error(`ProductPage.searchKeyword Error: ${JSON.stringify(error)}`);
    }
  }

  private async presentLoading(loadingMessage: string, duration?: number) {
    this.dismissLoading();
    const loadingOpts: LoadingOptions = {
      message: loadingMessage, showBackdrop: true, spinner: 'circular',
      duration: duration || 2000, cssClass: 'loading-modal'
    };
    this.loading = await this.loadingCtrl.create(loadingOpts);
    this.loading.present();
  }

  private async dismissLoading() {
    await this.loading?.dismiss();
  }

  private pushToResultsPage(productSearchResults: any): void {
    const navExtras: NavigationExtras = { state: { productSearchResults } };
    this.navCtrl.navigateForward('tabs/results', navExtras);
  }
}

@Pipe({name: 'getKeywordValues'})
export class GetKeywordValuesPipe implements PipeTransform {
  transform(list: string[]): string[] {
    return list.map(val => val.split(':')[1]);
  }
}

@Pipe({name: 'cleanTag'})
export class CleanTagPipe implements PipeTransform {
  transform(tag: string): string {
    return tag.split(':').pop()?.replace(/-/g, ' ') ?? tag;
  }
}
