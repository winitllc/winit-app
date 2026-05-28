import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Router, NavigationExtras } from '@angular/router';
import { NavController, ActionSheetController, Platform, LoadingController, LoadingOptions, InfiniteScrollCustomEvent, IonContent } from '@ionic/angular';
import { Share } from '@capacitor/share';
import { AppConfig } from '../app.config';
import { model } from 'wuzinit-common';
import { ProfileState } from '../profile/profile.state';
import { DomSanitizer } from '@angular/platform-browser';
import { OpenFoodFactsIngredient, OpenFoodFactsProduct, ProductService } from '../product/product.service';

@Component({
  selector: 'app-results',
  templateUrl: './results.page.html',
  styleUrls: ['./results.page.scss'],
})
export class ResultsPage implements OnInit {

  private loading: HTMLIonLoadingElement | null = null;
  private profile: any;
  public warnings: string[] = [];
  public noResults: boolean = false;
  public products: OpenFoodFactsProduct[] = [];
  private nextPageRequested: boolean = false;
  private category: string = '';
  private resultsSoFar: number = 0;
  private page: number = 0;
  private resultsCount: number = 0;
  @ViewChild(IonContent) content: IonContent | undefined;

  constructor(
    private actionSheetController: ActionSheetController,
    private loadingCtrl: LoadingController,
    private navCtrl: NavController,
    private platform: Platform,
    private route: ActivatedRoute,
    private sanitizer: DomSanitizer,
    private router: Router,
    private profileState: ProfileState,
    private productService: ProductService
  ) { }

  async ngOnInit() {
    console.log(`ResultsPage.ngOnInit: beginning of ngOnInit`);
  }

  async ionViewWillEnter(): Promise<void> {
    try {
      this.content?.scrollToTop(1);
      console.log(`ResultsPage.ionViewWillEnter - beginning of ionViewWillEnter`);
      this.nextPageRequested = false;
      this.profile = this.profileState.getHealthProfile();
      console.log(`ResultsPage.ionViewWillEnter: profile from state: ${JSON.stringify(this.profile)}`);
      this.warnings = this.profile.medical && this.profile.medical.allergies ? this.profile.medical.allergies.map((allergy: any) => {return allergy.name as string;}) : [];
      this.noResults = true;
      console.log(`ResultsPage.ionViewWillEnter: beginning of ionViewWillEnter`);
      let currNavigation = this.router.getCurrentNavigation();
      if (!currNavigation) {
        console.log(`ResultsPage.ionViewWillEnter: no currNavigation found, using last successful`);
        currNavigation = this.router.lastSuccessfulNavigation;
      }
      console.log(`ResultsPage.ionViewWillEnter: curr navigation properties: ${Object.keys(currNavigation || {})}`);
      if (currNavigation) {
        this.noResults = false;
        const routerState = JSON.parse(JSON.stringify(currNavigation.extras.state));
        console.log(`ResultsPage.ionViewWillEnter: routerState: ${JSON.stringify(routerState)}`);
        const productSearchResults = routerState['productSearchResults'];
        console.log(`ResultsPage.ionViewWillEnter: productSearchResults from navParams: ${JSON.stringify(productSearchResults)}`);
        let code_list: string[] = [];
        let id_list: string[] = [];
        if (productSearchResults.products) {
          productSearchResults.products.forEach((product: OpenFoodFactsProduct) => {
            code_list.push(product.code);
            id_list.push(product.id);
          });
          this.resultsCount = productSearchResults.count;
          console.log(`ResultsPage.ionViewWillEnter: code_list list from navParams: ${JSON.stringify(code_list)}`);
          console.log(`ResultsPage.ionViewWillEnter: id_list list from navParams: ${JSON.stringify(id_list)}`);
          this.products = productSearchResults.products;
          this.resultsSoFar = productSearchResults.products.length;
          this.page = 1;
        }
      } else {
        console.log(`ResultsPage.ionViewWillEnter: still no currNavigation: ${JSON.stringify(currNavigation)}`);
      }
    } catch (error) {
      console.error(`ResultsPage.ionViewWillEnter Error: ${JSON.stringify(error)}`);
      throw error;
    }
  }

  selectProduct(id: string): void {
    console.log(`ResultsPage.selectProduct: id ${id}`);
    try {
      const product: OpenFoodFactsProduct | undefined = this.products.find((product: OpenFoodFactsProduct) => {
        return product.id == id;
      });
      console.log(`ResultsPage.selectProduct: pushing the selected product to product page: ${JSON.stringify(product)}`);
      if (product) {
        const navExtras: NavigationExtras = {
          state: {
            product
          }
        };
        console.log(`ResultsPage.selectProduct: nav extras for results page: ${JSON.stringify(navExtras)}`);
        this.navCtrl.navigateForward('tabs/product', navExtras);
      } else {
        console.log(`ResultsPage.selectProduct: no product: ${JSON.stringify(id)}`);
      }
    } catch (error) {
      console.error(`ResultsPage.selectProduct: Error pushing to the results page: ${JSON.stringify(error)}`);
    }
  }

  public async scrollEvent(infiniteScroll: InfiniteScrollCustomEvent): Promise<void> {
    try {
      if (this.resultsSoFar >= this.resultsCount) {
        return;
      }
      if (!this.nextPageRequested) {
        this.nextPageRequested = true;
        await this.requestNextPage();
        console.log(`ResultsPage.scrollEvent: next page complete`);
        infiniteScroll.target.complete();
        this.nextPageRequested = false;
      }
    } catch (error) {
      console.error(`ResultsPage.scrollEvent: error requesting next page: ${JSON.stringify(error)}`);
    }
  }

  private async requestNextPage(): Promise<void> {
    try {
      const newProductResults: any = await this.productService.searchProductByCategory(this.category, String(this.page + 1));
      console.log(`ResultsPage.requestNextPage: results from the category search: ${JSON.stringify(newProductResults)}`);
      for(let product of newProductResults.products) {
        this.products.push(product);
      }
      console.log(`ResultsPage.requestNextPage: new full products length: ${this.products.length}`);
      this.resultsSoFar += newProductResults.products.length;
      this.page += 1;
      console.log(`ResultsPage.requestNextPage: new this.resultsSoFar: ${this.resultsSoFar}`);
    } catch (error) {
      console.error(`ResultsPage.requestNextPage: error requesting next page: ${JSON.stringify(error)}`);
    }
  }

}
