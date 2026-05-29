import { Component, OnInit, Pipe, PipeTransform } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { NavController, ActionSheetController, Platform, LoadingController, LoadingOptions, ModalController } from '@ionic/angular';
import { AppConfig } from '../app.config';
import { ProfileState } from '../profile/profile.state';
import { OpenFoodFactsProduct, ProductService } from './product.service';
import { SupabaseProduct, SupabaseProductService } from '../util/supabase-product.service';
import { DomSanitizer } from '@angular/platform-browser';
import { ContributeModalComponent } from './contribute-modal.component';
import { WinitAuthService } from '../util/winit-auth.service';

@Component({
  selector: 'app-product',
  templateUrl: './product.page.html',
  styleUrls: ['./product.page.scss'],
})
export class ProductPage implements OnInit {

  public confirmProductMode: boolean = false;
  public noProduct: boolean = false;
  public noProductBarcode: string = '';

  public allergenPoisonWarning: boolean = false;
  public allergenDangerWarning: boolean = false;
  public tracesPoisonWarning: boolean = false;
  public tracesDangerWarning: boolean = false;
  public ingredientsTextHTML: any = '';
  public ingredientsPoisonWarning: boolean = false;
  public ingredientsDangerWarning: boolean = false;
  public product?: OpenFoodFactsProduct;
  public supabaseProduct?: SupabaseProduct;
  public productType: string = 'supabase';
  public productKeywords: string[] = [];
  public iPhone: boolean = false;

  private profile: any;
  public warnings: string[] = [];

  public insufficientData: boolean = true;
  public dangerWarning: boolean = false;
  public poisonWarning: boolean = false;

  private sharingConfig: string[] = AppConfig.socialMediaSupport;
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
  ) { }

  async ngOnInit() {
    console.log(`ProductPage.ngOnInit: beginning of ngOnInit`);
  }

  async ionViewWillEnter(): Promise<void> {
    try {
      this.profile = this.profileState.getHealthProfile();
      const allergies: string[] = this.profile?.medical?.allergies?.map((a: any) => a.name as string) ?? [];
      const intolerances: string[] = this.profile?.medical?.foodIntolerances?.map((a: any) => a.name as string) ?? [];
      this.warnings = [...allergies, ...intolerances];
      this.noProduct = true;

      let currNavigation = this.router.getCurrentNavigation() ?? this.router.lastSuccessfulNavigation;
      if (!currNavigation?.extras?.state) return;

      const routerState = JSON.parse(JSON.stringify(currNavigation.extras.state));

      // Prefer Supabase product if passed from results page
      if (routerState['supabaseProduct']) {
        this.supabaseProduct = routerState['supabaseProduct'] as SupabaseProduct;
        this.noProduct = false;
        this.ingredientsTextHTML = this.sanitizer.bypassSecurityTrustHtml(
          this.addAlertHighlights(this.supabaseProduct.ingredients_text || '')
        );
        this.addFeedback();
        return;
      }

      // Legacy: OFF product passed from barcode scanner
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
        await this.setAlerts();
      } else {
        this.noProduct = true;
        this.product = JSON.parse(JSON.stringify(AppConfig.emptyWuzinitProduct));
        this.noProductBarcode = product.barcode;
      }
    } catch (error) {
      console.error(`ProductPage.ionViewWillEnter Error: ${JSON.stringify(error)}`);
    }
  }

  public addNewProductInfo() {
    const navExtras: NavigationExtras = {
      state: {
        noProductBarcode: this.noProductBarcode
      }
    };
    this.navCtrl.navigateForward('tabs/product/scanName', navExtras);
  }

  async openContributeModal() {
    const productId = this.supabaseProduct?.id;
    if (!productId) return;

    const session = await this.winitAuth.restoreSession();
    if (!session) return;

    const modal = await this.modalController.create({
      component: ContributeModalComponent,
      componentProps: {
        productId,
        userId: session.user.id,
        accessToken: session.access_token,
      },
      breakpoints: [0, 0.5, 0.92],
      initialBreakpoint: 0.92,
    });
    await modal.present();
  }

  // private reset(): void {
  //   this.allergensText = [];
  //   this.allergenPoisonWarning = false;
  //   this.allergenDangerWarning = false;
  //   this.tracesText = [];
  //   this.tracesPoisonWarning = false;
  //   this.tracesDangerWarning = false;
  //   this.ingredientsText = [];
  //   this.ingredientsPoisonWarning = false;
  //   this.ingredientsDangerWarning = false;
  //   this.productKeywords = [];
  //   this.updateProduct(AppConfig.emptyWuzinitProduct);
  //   this.iPhone = false;
  //   this.insufficientData = true;
  //   this.dangerWarning = false;
  //   this.poisonWarning = false;
  // }

  private async setAlerts(): Promise<void> {
    console.log(`ProductPage.setAlerts: setting the alerts for dangerous and poisonous ingredients`);
    // const dangerousIngredients: string[] = this.profileState.getDangerousIngredients();
    // const poisonousIngredients: string[] = this.profileState.getPoisonousIngredients();
    // this.allergensText = this.addWarnings(Object.values(this.product.details.allergens), dangerousIngredients, poisonousIngredients, 'allergens');
    // this.tracesText = this.addWarnings(Object.values(this.product.details.traces_tags), dangerousIngredients, poisonousIngredients, 'traces');
    console.log(`ProductPage.setAlerts: ingredients from product: ${this.product?.ingredients_text}`);
    this.ingredientsTextHTML = this.sanitizer.bypassSecurityTrustHtml(this.addAlertHighlights(this.product?.ingredients_text || ''));
    
    this.addFeedback();
  }

  addAlertHighlights(ingredientsText: string): string {
    const ingredientsTextHTML: string = ingredientsText.split(/\.\s+|\.$/).map((sentence) => {
      console.log(`ProductPage.addAlertHighlights: sentence to check: ${sentence}`);
      return sentence.split(/,\s+/).map((phrase) => {
        console.log(`ProductPage.addAlertHighlights: phrase to check: ${phrase}`);
        return phrase.split(' ').map((word) => {
          console.log(`ProductPage.addAlertHighlights: word to check: ${word}`);
          return this.matchWarnings(word) ? `<span style="background-color: var(--ion-color-primary); color: var(--ion-color-primary-contrast); border-radius: 0.2em;">${word}</span>` : word;
        }).join(' ');
      }).join(', ');
    }).join('. ');
    console.log(`ProductPage.addAlertHighlights: new text for ingredients with highlights: ${ingredientsTextHTML}`);
    return ingredientsTextHTML;
  }

  matchWarnings(phraseOrWord: string): boolean {
    const warnings = this.warnings;
    console.log(`ProductPage.matchWarnings: warnings: ${JSON.stringify(warnings)}`);
    return warnings.reduce((prevResult, currWarning) => {
      console.log(`ProductPage.matchWarnings: currWarning to check: ${currWarning}`);
      return prevResult || phraseOrWord.toLowerCase().includes(currWarning.toLowerCase());
    }, false);
  }

  async searchKeyword(category: string) {
    console.log(`ProductPage.searchKeyword: category to search: ${category}`);
    try {
      await this.presentLoading(`searching for ${category}`, 10000);
      const productSearchResults: any = await this.productService.searchProductByCategory(category);
      console.log(`ProductPage.searchKeyword: results from the category search: ${JSON.stringify(productSearchResults)}`);
      await this.dismissLoading();
      this.pushToResultsPage(productSearchResults);
    } catch (error) {
      console.error(`ProductPage.searchKeyword Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  async searchLabel(label: string) {
    console.log(`ProductPage.searchLabel: label to search: ${label}`);
    try {
      // await this.presentLoading(`searching for ${label}`, 10000);
      // const productSearchResults: any = await this.productService.searchProductByLabel(label);
      // console.log(`ProductPage.searchLabel: results from the label search: ${JSON.stringify(productSearchResults)}`);
      // await this.dismissLoading();
      // this.pushToResultsPage(productSearchResults);
    } catch (error) {
      console.error(`ProductPage.searchLabel Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  private async presentLoading(loadingMessage: string, duration?: number) {
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

  private async dismissLoading() {
    await this.loading?.dismiss();
  }

  private pushToResultsPage(productSearchResults: any): void {
    try {
      // this.profileService.addToProfilePoints(AppConfig.pointAwards.scan);
      console.log(`ProductPage.pushToResultsPage: pushing the product results to results page: ${JSON.stringify(productSearchResults)}`);
      const navExtras: NavigationExtras = {
        state: {
          productSearchResults
        }
      };
      console.log(`ProductPage.pushToResultsPage: nav extras for results page: ${JSON.stringify(navExtras)}`);
      this.navCtrl.navigateForward('tabs/results', navExtras);
    } catch (error) {
      console.error(`ProductPage.pushToResultsPage: Error pushing to the results page: ${JSON.stringify(error)}`);
    }
  }

  private addFeedback(): void {
    const hasIngredients = !!(this.supabaseProduct?.ingredients_text || this.product?.ingredients_text);
    if (!hasIngredients) {
      this.insufficientData = true;
      return;
    }
    this.insufficientData = false;
    if (this.allergenPoisonWarning || this.tracesPoisonWarning || this.ingredientsPoisonWarning) {
      this.poisonWarning = true;
      return;
    }
    if (this.allergenDangerWarning || this.tracesDangerWarning || this.ingredientsDangerWarning) {
      this.dangerWarning = true;
      return;
    }
    // Check warning matches via ingredient text for both product types
    if (this.warnings.length) {
      const text = (this.supabaseProduct?.ingredients_text || this.product?.ingredients_text || '').toLowerCase();
      if (this.warnings.some(w => text.includes(w.toLowerCase()))) {
        this.dangerWarning = true;
      }
    }
  }

  private checkForPoisonWarnings(item: string, poisonousIngredients: string[], section: string): boolean {
    return poisonousIngredients.map(this.makeIngredientComparisonMapper(item, section, 'poison')).reduce(this.orReducer, false);
  }

  private checkForDangerWarnings(item: string, dangerousIngredients: string[], section: string): boolean {
    return dangerousIngredients.map(this.makeIngredientComparisonMapper(item, section, 'danger')).reduce(this.orReducer, false);
  }

  private updateWarning(section: string, type: string): void {
    switch (`${section}-${type}`) {
      case 'allergens-poison':
        this.allergenPoisonWarning = true;
        break;
      case 'traces-poison':
        this.tracesPoisonWarning = true;
        break;
      case 'ingredients-poison':
        this.ingredientsPoisonWarning = true;
        break;
      case 'allergens-danger':
        this.allergenDangerWarning = true;
        break;
      case 'traces-danger':
        this.tracesDangerWarning = true;
        break;
      case 'ingredients-danger':
        this.ingredientsDangerWarning = true;
        break;
      default:
        break;
    }
  }

  private makeIngredientComparisonMapper(item: string, section: string, type: string): (arg: string) => boolean {
    return (ingredient: string): boolean => {
      const hasWarning: boolean = item.toLocaleLowerCase().includes(ingredient.toLocaleLowerCase()) || ingredient.toLocaleLowerCase().includes(item.toLocaleLowerCase());
      if (hasWarning) {
        this.updateWarning(section, type);
      }
      return hasWarning;
    };
  }

  private orReducer(prev: boolean, current: boolean): boolean {
    return prev || current;
  }

}

@Pipe({name: 'getKeywordValues'})
export class GetKeywordValuesPipe implements PipeTransform {
    transform(list: string[]): string[] {
        let ret: string[] = [];

        list.forEach((val) => {
            ret.push(val.split(':')[1]);
        });

        return ret;
    }
}
