import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BrowsePage } from './browse.page';

import { BrowsePageRoutingModule } from './browse-routing.module';

@NgModule({
  imports: [
    IonicModule,
    CommonModule,
    FormsModule,
    BrowsePageRoutingModule
  ],
  declarations: [BrowsePage]
})
export class BrowsePageModule {}
