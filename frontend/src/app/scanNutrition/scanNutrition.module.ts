import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScanNutritionPage } from './scanNutrition.page';

import { ScanNutritionPageRoutingModule } from './scanNutrition-routing.module';
import { ScanNutritionCropperModalPage } from './scanNutrition-cropperModal.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ScanNutritionPageRoutingModule,
    ScanNutritionCropperModalPage
  ],
  declarations: [ScanNutritionPage]
})
export class ScanNutritionPageModule {}
