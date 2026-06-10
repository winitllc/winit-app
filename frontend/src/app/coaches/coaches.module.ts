import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CoachesPageRoutingModule } from './coaches-routing.module';
import { CoachesPage } from './coaches.page';

@NgModule({
  imports: [IonicModule, CommonModule, FormsModule, CoachesPageRoutingModule],
  declarations: [CoachesPage],
})
export class CoachesPageModule {}
