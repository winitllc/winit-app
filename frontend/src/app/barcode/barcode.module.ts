import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BarcodePage } from './barcode.page';

import { BarcodePageRoutingModule } from './barcode-routing.module';
import { BarcodeScanningModalComponent } from './barcode-scanningModal.page';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    BarcodePageRoutingModule,
    BarcodeScanningModalComponent
  ],
  declarations: [BarcodePage]
})
export class BarcodePageModule {}
