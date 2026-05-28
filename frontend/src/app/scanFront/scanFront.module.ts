import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ScanFrontPage } from './scanFront.page';

import { ScanFrontPageRoutingModule } from './scanFront-routing.module';
import { ScanFrontCropperModalPage } from './scanFront-cropperModal.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    ScanFrontPageRoutingModule,
    ScanFrontCropperModalPage
  ],
  declarations: [ScanFrontPage]
})
export class ScanFrontPageModule {}
