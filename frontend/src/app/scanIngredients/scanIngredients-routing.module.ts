import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScanIngredientsPage } from './scanIngredients.page';

const routes: Routes = [
  {
    path: '',
    component: ScanIngredientsPage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ScanIngredientsPageRoutingModule {}
