import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  {
    path: 'dashboard',
    loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'products',
    loadComponent: () => import('./pages/product-queue/product-queue.component').then(m => m.ProductQueueComponent),
  },
  {
    path: 'products/:id/edit',
    loadComponent: () => import('./pages/product-edit/product-edit.component').then(m => m.ProductEditComponent),
  },
  {
    path: 'import',
    loadComponent: () => import('./pages/import/import.component').then(m => m.ImportComponent),
  },
];
