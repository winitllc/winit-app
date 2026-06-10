import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CoachesPage } from './coaches.page';

const routes: Routes = [
  { path: '', component: CoachesPage },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
})
export class CoachesPageRoutingModule {}
