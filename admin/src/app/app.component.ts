import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, inject, Inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDivider } from '@angular/material/divider';
import { model } from 'wuzinit-common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogConfig, MatDialogModule, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatButtonModule,
    MatCardModule,
    MatListModule
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'wii-admin';

  private baseURL = 'https://zik33f1e36.execute-api.us-west-2.amazonaws.com/dev/';
  private getProductUpdatesPath = 'getProductUpdates';

  public productUpdates: model.WuzinitProduct[] = [];

  readonly dialog = inject(MatDialog);

  constructor(
    private http: HttpClient
  ) {
    this.getProductUpdates();
  }

  async getProductUpdates(): Promise<void> {
    const getProductUpdatesUrl = `${this.baseURL}${this.getProductUpdatesPath}`;
    console.log(`AppComponent.ngOnInit: URL ${JSON.stringify(getProductUpdatesUrl)}`);
    // const getProductUpdatesOptions = {
    //   headers: {
    //     'Accept': '*/*',
    //     'Accept-Encoding': 'gzip, deflate, br',
    //     'Connection': 'keep-alive'
    //   }
    // };
    const data: any = await this.http.get(getProductUpdatesUrl).toPromise();
    console.log(`AppComponent.ngOnInit: data from get ${JSON.stringify(data)}`);
    this.productUpdates = data && data['data'] && data['data']['productUpdates'] ? data['data']['productUpdates'] : [];
    this.productUpdates.forEach((product) => {
      console.log(`AppComponent.ngOnInit: this.productUpdates product ${JSON.stringify(product)}`);
      console.log(`AppComponent.ngOnInit: product code ${JSON.stringify(product.code)}`);
    });
  }

  openReviewModule(code: string) {
    const dialogConfig: MatDialogConfig = new MatDialogConfig();
    dialogConfig.data = {
      product: this.productUpdates.find((product: model.WuzinitProduct) => {
        return product.code == code;
      })
    };
    const approveDialog = this.dialog.open(ApproveProductDialog, dialogConfig);

    approveDialog.afterClosed().subscribe(result => {
      console.log(`AppComponent.openReviewModule: Approve Dialog result: ${result}`);
    });

  }
}

@Component({
  selector: 'approve-product-dialog',
  templateUrl: 'approve-product-dialog.html',
  standalone: true,
  imports: [
    MatDialogModule,
    MatDivider,
    MatButtonModule
  ],
  // changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ApproveProductDialog {

  product: model.WuzinitProduct;

  private baseURL = 'https://zik33f1e36.execute-api.us-west-2.amazonaws.com/dev/';
  private addProductPath = 'addProduct';
  private deleteProductUpdatePath = 'deleteProductUpdate';
  
  constructor(
    private http: HttpClient,
    private dialogRef: MatDialogRef<ApproveProductDialog>,
    @Inject(MAT_DIALOG_DATA) data: { product: model.WuzinitProduct }
  ) {
    this.product = data.product;
  }

  async approveProduct() {
    try {
      console.log(`ApproveProductDialog.approveProduct: beginning of function`);
      await this.addProductToDatabase(this.product);
      console.log(`ApproveProductDialog.approveProduct: product added to Product database`);
      await this.removeProductFromUpdates(this.product.code);
      console.log(`ApproveProductDialog.approveProduct: product removed from ProductUpdate table`);
      this.dialogRef.close('approved');
    } catch (error) {
      console.error(`ApproveProductDialog.approveProduct: [ERROR] ${JSON.stringify(error)}`);
    }
  }

  async denyProduct() {
    try {
      console.log(`ApproveProductDialog.denyProduct: beginning of function`);
      await this.removeProductFromUpdates(this.product.code);
      console.log(`ApproveProductDialog.denyProduct: product removed from ProductUpdate table`);
      this.dialogRef.close('denied');
    } catch (error) {
      console.error(`ApproveProductDialog.denyProduct: [ERROR] ${JSON.stringify(error)}`);
    }
  }

  private async addProductToDatabase(product: model.WuzinitProduct) {
    const postAddProductUrl = `${this.baseURL}${this.addProductPath}`;
    console.log(`ApproveProductDialog.removeProductFromUpdates: URL ${JSON.stringify(postAddProductUrl)}`);
    // const postAddProductOptions = {
    //   headers: {
    //     'Accept': '*/*',
    //     'Accept-Encoding': 'gzip, deflate, br',
    //     'Connection': 'keep-alive'
    //   }
    // };
    try {
      const data: any = await this.http.post(postAddProductUrl, {product}).toPromise();
      console.log(`ApproveProductDialog.addProductToDatabase: data from post ${JSON.stringify(data)}`);
    } catch (error) {
      console.error(`ApproveProductDialog.addProductToDatabase: [ERROR] ${JSON.stringify(error)}`);
    }
  }

  private async removeProductFromUpdates(code: string) {
    const getProductUpdatesUrl = `${this.baseURL}${this.deleteProductUpdatePath}`;
    console.log(`ApproveProductDialog.removeProductFromUpdates: URL ${JSON.stringify(getProductUpdatesUrl)}`);
    const getProductUpdatesOptions = {
      // headers: {
      //   'Accept': '*/*',
      //   'Accept-Encoding': 'gzip, deflate, br',
      //   'Connection': 'keep-alive'
      // },
      params: {
        code
      }
    };
    try {
      const data: any = await this.http.get(getProductUpdatesUrl, getProductUpdatesOptions).toPromise();
      console.log(`ApproveProductDialog.removeProductFromUpdates: data from get ${JSON.stringify(data)}`);
    } catch (error) {
      console.error(`ApproveProductDialog.removeProductFromUpdates: [ERROR] ${JSON.stringify(error)}`);
    }
  }
}
