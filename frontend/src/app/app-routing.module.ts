import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./signin/signin.module').then( m => m.SigninPageModule)
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)
  },
  {
    path: 'signin',
    loadChildren: () => import('./signin/signin.module').then( m => m.SigninPageModule)
  },
  {
    path: 'signup',
    loadChildren: () => import('./signup/signup.module').then( m => m.SignupPageModule)
  },
  {
    path: 'signup-patient',
    loadChildren: () => import('./signup-patient/signup-patient.module').then( m => m.SignupPatientPageModule)
  },
  {
    path: 'pro-signup',
    loadChildren: () => import('./pro-signup/pro-signup.module').then(m => m.ProSignupPageModule)
  },
  {
    path: 'pro-login',
    loadChildren: () => import('./pro-login/pro-login.module').then(m => m.ProLoginPageModule)
  },
  {
    path: 'pro-dashboard',
    loadChildren: () => import('./pro-dashboard/pro-dashboard.module').then(m => m.ProDashboardPageModule)
  },
  {
    path: 'pro/:slug',
    loadChildren: () => import('./pro-profile/pro-profile.module').then(m => m.ProProfilePageModule)
  },
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
