import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { SignupPatientPage } from './signup-patient.page';

const routes: Routes = [
  {
    path: '',
    component: SignupPatientPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class SignupPatientPageRoutingModule {}
