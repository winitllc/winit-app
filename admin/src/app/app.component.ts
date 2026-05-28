import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, RouterOutlet, RouterLink, RouterLinkActive,
    MatToolbarModule, MatSidenavModule, MatListModule, MatIconModule, MatButtonModule,
  ],
  template: `
    <mat-toolbar class="toolbar">
      <button mat-icon-button (click)="sidenav.toggle()">
        <mat-icon>menu</mat-icon>
      </button>
      <span class="brand">What's In It — Admin</span>
    </mat-toolbar>

    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #sidenav mode="side" opened class="sidenav">
        <mat-nav-list>
          <a mat-list-item routerLink="/dashboard" routerLinkActive="active-link">
            <mat-icon matListItemIcon>dashboard</mat-icon>
            <span matListItemTitle>Dashboard</span>
          </a>
          <a mat-list-item routerLink="/products" routerLinkActive="active-link">
            <mat-icon matListItemIcon>inventory_2</mat-icon>
            <span matListItemTitle>Products</span>
          </a>
          <a mat-list-item routerLink="/import" routerLinkActive="active-link">
            <mat-icon matListItemIcon>download</mat-icon>
            <span matListItemTitle>Import</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content class="content">
        <router-outlet />
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .toolbar {
      background: #1a1a2e;
      color: white;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
    }
    .brand { font-weight: 600; margin-left: 8px; letter-spacing: 0.02em; }
    .sidenav-container { margin-top: 64px; height: calc(100vh - 64px); }
    .sidenav {
      width: 220px;
      background: #f8f9fa;
      border-right: 1px solid #e0e0e0;
    }
    .sidenav mat-nav-list { padding-top: 8px; }
    .active-link { background: rgba(26,26,46,0.08) !important; border-radius: 8px; }
    .active-link mat-icon { color: #1a1a2e; }
    .content { padding: 24px; background: #fff; min-height: 100%; }
  `],
})
export class AppComponent {}
