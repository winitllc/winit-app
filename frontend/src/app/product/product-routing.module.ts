import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ProductPage } from './product.page';

const routes: Routes = [
  {
    path: 'scanName',
    loadChildren: () => import('../scanName/scanName.module').then(m => m.ScanNamePageModule)
  },
  {
    path: 'scanFront',
    loadChildren: () => import('../scanFront/scanFront.module').then(m => m.ScanFrontPageModule)
  },
  {
    path: 'scanNutrition',
    loadChildren: () => import('../scanNutrition/scanNutrition.module').then(m => m.ScanNutritionPageModule)
  },
  {
    path: 'scanIngredients',
    loadChildren: () => import('../scanIngredients/scanIngredients.module').then(m => m.ScanIngredientsPageModule)
  },
  {
    path: '',
    component: ProductPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ProductPageRoutingModule {}
