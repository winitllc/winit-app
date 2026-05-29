import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ProductPageRoutingModule } from './product-routing.module';

import { ProductPage, GetKeywordValuesPipe, CleanTagPipe } from './product.page';
import { ContributeModalComponent } from './contribute-modal.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProductPageRoutingModule
  ],
  declarations: [ProductPage, GetKeywordValuesPipe, CleanTagPipe, ContributeModalComponent]
})
export class ProductPageModule {}
