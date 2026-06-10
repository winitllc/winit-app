import { IonicModule } from '@ionic/angular';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MealPlansPageRoutingModule } from './meal-plans-routing.module';
import { MealPlansPage } from './meal-plans.page';

@NgModule({
  imports: [IonicModule, CommonModule, FormsModule, MealPlansPageRoutingModule],
  declarations: [MealPlansPage],
})
export class MealPlansPageModule {}
