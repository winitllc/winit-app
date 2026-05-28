import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScanIngredientsPage } from './scanIngredients.page';

import { ScanIngredientsPageRoutingModule } from './scanIngredients-routing.module';
import { ScanIngredientsCropperModalPage } from './scanIngredients-cropperModal.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ScanIngredientsPageRoutingModule,
    ScanIngredientsCropperModalPage
  ],
  declarations: [ScanIngredientsPage]
})
export class ScanIngredientsPageModule {}
