import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScanNamePage } from './scanName.page';

import { ScanNamePageRoutingModule } from './scanName-routing.module';
import { ScanNameCropperModalPage } from './scanName-cropperModal.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ScanNamePageRoutingModule,
    ScanNameCropperModalPage
  ],
  declarations: [ScanNamePage]
})
export class ScanNamePageModule {}
