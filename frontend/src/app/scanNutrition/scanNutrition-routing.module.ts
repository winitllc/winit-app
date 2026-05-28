import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScanNutritionPage } from './scanNutrition.page';

const routes: Routes = [
  {
    path: '',
    component: ScanNutritionPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ScanNutritionPageRoutingModule {}
