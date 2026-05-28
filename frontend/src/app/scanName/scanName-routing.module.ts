import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { ScanNamePage } from './scanName.page';

const routes: Routes = [
  {
    path: '',
    component: ScanNamePage,
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class ScanNamePageRoutingModule {}
