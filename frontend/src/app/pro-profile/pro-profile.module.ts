import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { RouterModule, Routes } from '@angular/router';
import { ProProfilePage } from './pro-profile.page';

const routes: Routes = [{ path: '', component: ProProfilePage }];

@NgModule({
  imports: [CommonModule, IonicModule, RouterModule.forChild(routes)],
  declarations: [ProProfilePage],
})
export class ProProfilePageModule {}
