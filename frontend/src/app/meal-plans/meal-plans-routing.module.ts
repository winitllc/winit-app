import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MealPlansPage } from './meal-plans.page';

const routes: Routes = [
  { path: '', component: MealPlansPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class MealPlansPageRoutingModule {}
