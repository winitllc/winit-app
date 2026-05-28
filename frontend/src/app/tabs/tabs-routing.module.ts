import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'barcode',
        loadChildren: () => import('../barcode/barcode.module').then(m => m.BarcodePageModule)
      },
      {
        path: 'browse',
        loadChildren: () => import('../browse/browse.module').then(m => m.BrowsePageModule)
      },
      {
        path: 'profile',
        loadChildren: () => import('../profile/profile.module').then(m => m.ProfilePageModule)
      },
      {
        path: 'product',
        loadChildren: () => import('../product/product.module').then(m => m.ProductPageModule)
      },
      {
        path: 'results',
        loadChildren: () => import('../results/results.module').then(m => m.ResultsPageModule)
      },
      {
        path: '',
        redirectTo: 'browse',
        pathMatch: 'full'
      }
    ]
  },
  {
    path: '',
    redirectTo: 'tabs/browse',
    pathMatch: 'full'
  }
];


@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class TabsPageRoutingModule {}
