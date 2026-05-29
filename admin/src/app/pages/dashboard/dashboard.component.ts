import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-header">
      <h1>Dashboard</h1>
    </div>

    <div class="stats-grid" *ngIf="!loading; else spinner">
      <mat-card class="stat-card stat-pending">
        <mat-card-content>
          <div class="stat-icon"><mat-icon>pending</mat-icon></div>
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">Pending Review</div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/products" [queryParams]="{status:'pending'}">Review Now</a>
        </mat-card-actions>
      </mat-card>

      <mat-card class="stat-card stat-approved">
        <mat-card-content>
          <div class="stat-icon"><mat-icon>check_circle</mat-icon></div>
          <div class="stat-value">{{ stats.approved }}</div>
          <div class="stat-label">Approved</div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/products" [queryParams]="{status:'approved'}">View</a>
        </mat-card-actions>
      </mat-card>

      <mat-card class="stat-card stat-rejected">
        <mat-card-content>
          <div class="stat-icon"><mat-icon>cancel</mat-icon></div>
          <div class="stat-value">{{ stats.rejected }}</div>
          <div class="stat-label">Rejected</div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/products" [queryParams]="{status:'rejected'}">View</a>
        </mat-card-actions>
      </mat-card>

      <mat-card class="stat-card stat-total">
        <mat-card-content>
          <div class="stat-icon"><mat-icon>inventory_2</mat-icon></div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total Products</div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/products">Browse All</a>
        </mat-card-actions>
      </mat-card>

      <mat-card class="stat-card stat-users">
        <mat-card-content>
          <div class="stat-icon"><mat-icon>people</mat-icon></div>
          <div class="stat-value">{{ userTotal }}</div>
          <div class="stat-label">WINIT Users</div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/users">Manage</a>
        </mat-card-actions>
      </mat-card>
    </div>

    <ng-template #spinner>
      <div class="center"><mat-spinner diameter="48"></mat-spinner></div>
    </ng-template>

    <div class="quick-actions">
      <h2>Quick Actions</h2>
      <div class="action-buttons">
        <a mat-raised-button color="primary" routerLink="/products" [queryParams]="{status:'pending'}">
          <mat-icon>rate_review</mat-icon> Review Pending Products
        </a>
        <a mat-raised-button routerLink="/import">
          <mat-icon>download</mat-icon> Import from OpenFoodFacts
        </a>
        <a mat-raised-button routerLink="/users">
          <mat-icon>people</mat-icon> View Users
        </a>
      </div>
    </div>
  `,
  styles: [`
    .page-header h1 { font-size: 1.75rem; font-weight: 600; margin: 0 0 24px; color: #1a1a2e; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card { text-align: center; border-radius: 12px !important; }
    .stat-card mat-card-content { padding: 24px 16px 8px; }
    .stat-icon mat-icon { font-size: 2rem; width: 2rem; height: 2rem; margin-bottom: 8px; }
    .stat-value { font-size: 2.5rem; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 0.85rem; color: #666; margin-top: 4px; }
    .stat-pending .stat-icon { color: #f59e0b; }
    .stat-pending .stat-value { color: #f59e0b; }
    .stat-approved .stat-icon { color: #10b981; }
    .stat-approved .stat-value { color: #10b981; }
    .stat-rejected .stat-icon { color: #ef4444; }
    .stat-rejected .stat-value { color: #ef4444; }
    .stat-total .stat-icon { color: #3b82f6; }
    .stat-total .stat-value { color: #3b82f6; }
    .stat-users .stat-icon { color: #0ea5e9; }
    .stat-users .stat-value { color: #0ea5e9; }
    .quick-actions h2 { font-size: 1.2rem; font-weight: 600; margin: 0 0 16px; color: #1a1a2e; }
    .action-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
    .action-buttons a { display: flex; align-items: center; gap: 6px; }
    .center { display: flex; justify-content: center; padding: 48px; }
  `],
})
export class DashboardComponent implements OnInit {
  loading = true;
  stats = { pending: 0, approved: 0, rejected: 0, total: 0 };
  userTotal = 0;

  constructor(private supa: SupabaseService) {}

  async ngOnInit() {
    try {
      const [productStats, userResult] = await Promise.all([
        this.supa.getProductStats(),
        this.supa.getWinitUsers({ pageSize: 1 }),
      ]);
      this.stats = productStats;
      this.userTotal = userResult.total;
    } finally {
      this.loading = false;
    }
  }
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, MatCardModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <div class="page-header">
      <h1>Dashboard</h1>
    </div>

    <div class="stats-grid" *ngIf="!loading; else spinner">
      <mat-card class="stat-card stat-pending">
        <mat-card-content>
          <div class="stat-icon"><mat-icon>pending</mat-icon></div>
          <div class="stat-value">{{ stats.pending }}</div>
          <div class="stat-label">Pending Review</div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/products" [queryParams]="{status:'pending'}">Review Now</a>
        </mat-card-actions>
      </mat-card>

      <mat-card class="stat-card stat-approved">
        <mat-card-content>
          <div class="stat-icon"><mat-icon>check_circle</mat-icon></div>
          <div class="stat-value">{{ stats.approved }}</div>
          <div class="stat-label">Approved</div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/products" [queryParams]="{status:'approved'}">View</a>
        </mat-card-actions>
      </mat-card>

      <mat-card class="stat-card stat-rejected">
        <mat-card-content>
          <div class="stat-icon"><mat-icon>cancel</mat-icon></div>
          <div class="stat-value">{{ stats.rejected }}</div>
          <div class="stat-label">Rejected</div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/products" [queryParams]="{status:'rejected'}">View</a>
        </mat-card-actions>
      </mat-card>

      <mat-card class="stat-card stat-total">
        <mat-card-content>
          <div class="stat-icon"><mat-icon>inventory_2</mat-icon></div>
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">Total Products</div>
        </mat-card-content>
        <mat-card-actions>
          <a mat-button routerLink="/products">Browse All</a>
        </mat-card-actions>
      </mat-card>
    </div>

    <ng-template #spinner>
      <div class="center"><mat-spinner diameter="48"></mat-spinner></div>
    </ng-template>

    <div class="quick-actions">
      <h2>Quick Actions</h2>
      <div class="action-buttons">
        <a mat-raised-button color="primary" routerLink="/products" [queryParams]="{status:'pending'}">
          <mat-icon>rate_review</mat-icon> Review Pending Products
        </a>
        <a mat-raised-button routerLink="/import">
          <mat-icon>download</mat-icon> Import from OpenFoodFacts
        </a>
      </div>
    </div>
  `,
  styles: [`
    .page-header h1 { font-size: 1.75rem; font-weight: 600; margin: 0 0 24px; color: #1a1a2e; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }
    .stat-card { text-align: center; border-radius: 12px !important; }
    .stat-card mat-card-content { padding: 24px 16px 8px; }
    .stat-icon mat-icon { font-size: 2rem; width: 2rem; height: 2rem; margin-bottom: 8px; }
    .stat-value { font-size: 2.5rem; font-weight: 700; line-height: 1; }
    .stat-label { font-size: 0.85rem; color: #666; margin-top: 4px; }
    .stat-pending .stat-icon { color: #f59e0b; }
    .stat-pending .stat-value { color: #f59e0b; }
    .stat-approved .stat-icon { color: #10b981; }
    .stat-approved .stat-value { color: #10b981; }
    .stat-rejected .stat-icon { color: #ef4444; }
    .stat-rejected .stat-value { color: #ef4444; }
    .stat-total .stat-icon { color: #3b82f6; }
    .stat-total .stat-value { color: #3b82f6; }
    .quick-actions h2 { font-size: 1.2rem; font-weight: 600; margin: 0 0 16px; color: #1a1a2e; }
    .action-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
    .action-buttons a { display: flex; align-items: center; gap: 6px; }
    .center { display: flex; justify-content: center; padding: 48px; }
  `],
})
export class DashboardComponent implements OnInit {
  loading = true;
  stats = { pending: 0, approved: 0, rejected: 0, total: 0 };

  constructor(private supa: SupabaseService) {}

  async ngOnInit() {
    try {
      this.stats = await this.supa.getProductStats();
    } finally {
      this.loading = false;
    }
  }
}
