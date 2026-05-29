import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { SupabaseService, WinitUserRow } from '../../services/supabase.service';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatTableModule, MatInputModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatChipsModule, MatTooltipModule, MatBadgeModule,
  ],
  template: `
    <div class="page-header">
      <h1>WINIT Users</h1>
      <span class="total-badge">{{ total }} total</span>
    </div>

    <div class="toolbar">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search by name or email</mat-label>
        <input matInput [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="e.g. jane@example.com">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>
    </div>

    <div class="table-wrapper" *ngIf="!loading; else spinner">
      <table mat-table [dataSource]="users" class="users-table">

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Name</th>
          <td mat-cell *matCellDef="let u">
            <div class="user-name">{{ u.display_name || (u.first_name + ' ' + u.last_name) }}</div>
            <div class="user-email">{{ u.email }}</div>
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let u">
            <span class="chip" [class.chip-active]="u.is_active" [class.chip-inactive]="!u.is_active">
              {{ u.is_active ? 'Active' : 'Inactive' }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="onboarding">
          <th mat-header-cell *matHeaderCellDef>Onboarded</th>
          <td mat-cell *matCellDef="let u">
            <mat-icon class="check-icon" [class.done]="u.onboarding_completed">
              {{ u.onboarding_completed ? 'check_circle' : 'radio_button_unchecked' }}
            </mat-icon>
          </td>
        </ng-container>

        <ng-container matColumnDef="points">
          <th mat-header-cell *matHeaderCellDef>Points</th>
          <td mat-cell *matCellDef="let u">
            <span class="points">{{ u.points_balance | number }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="scans">
          <th mat-header-cell *matHeaderCellDef>Scans</th>
          <td mat-cell *matCellDef="let u">{{ u.scans_all_time | number }}</td>
        </ng-container>

        <ng-container matColumnDef="joined">
          <th mat-header-cell *matHeaderCellDef>Joined</th>
          <td mat-cell *matCellDef="let u">{{ u.created_at | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let u">
            <button mat-icon-button [matTooltip]="u.is_active ? 'Deactivate user' : 'Activate user'"
              (click)="toggleActive(u)">
              <mat-icon>{{ u.is_active ? 'block' : 'check' }}</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>

      <div class="empty" *ngIf="!users.length">No users found.</div>

      <div class="pagination">
        <button mat-button (click)="prevPage()" [disabled]="page === 0">← Prev</button>
        <span>Page {{ page + 1 }} of {{ totalPages }}</span>
        <button mat-button (click)="nextPage()" [disabled]="page >= totalPages - 1">Next →</button>
      </div>
    </div>

    <ng-template #spinner>
      <div class="center"><mat-spinner diameter="48"></mat-spinner></div>
    </ng-template>
  `,
  styles: [`
    .page-header { display: flex; align-items: baseline; gap: 12px; margin-bottom: 24px; }
    .page-header h1 { font-size: 1.75rem; font-weight: 600; margin: 0; color: #1a1a2e; }
    .total-badge { background: #e8f0fe; color: #1a73e8; border-radius: 12px; padding: 2px 10px; font-size: 0.85rem; font-weight: 600; }
    .toolbar { margin-bottom: 16px; }
    .search-field { width: 100%; max-width: 420px; }
    .table-wrapper { overflow-x: auto; }
    .users-table { width: 100%; border-collapse: collapse; }
    .users-table th { font-weight: 600; color: #555; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .user-name { font-weight: 600; color: #1a1a2e; }
    .user-email { font-size: 0.82rem; color: #888; }
    .chip { border-radius: 100px; padding: 3px 10px; font-size: 0.78rem; font-weight: 600; }
    .chip-active { background: #d1fae5; color: #065f46; }
    .chip-inactive { background: #fee2e2; color: #991b1b; }
    .check-icon { font-size: 20px; vertical-align: middle; color: #ccc; }
    .check-icon.done { color: #10b981; }
    .points { font-weight: 600; color: #1a73e8; }
    .pagination { display: flex; align-items: center; gap: 16px; padding: 16px 0; justify-content: flex-end; }
    .empty { padding: 48px; text-align: center; color: #888; }
    .center { display: flex; justify-content: center; padding: 48px; }
  `],
})
export class UsersComponent implements OnInit {
  users: WinitUserRow[] = [];
  total = 0;
  loading = true;
  search = '';
  page = 0;
  readonly pageSize = 25;

  columns = ['name', 'status', 'onboarding', 'points', 'scans', 'joined', 'actions'];

  private searchTimer: any;

  constructor(private supa: SupabaseService) {}

  get totalPages() { return Math.max(1, Math.ceil(this.total / this.pageSize)); }

  async ngOnInit() { await this.load(); }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page = 0; this.load(); }, 350);
  }

  prevPage() { if (this.page > 0) { this.page--; this.load(); } }
  nextPage() { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }

  async toggleActive(u: WinitUserRow) {
    await this.supa.setUserActive(u.id, !u.is_active);
    u.is_active = !u.is_active;
  }

  private async load() {
    this.loading = true;
    try {
      const res = await this.supa.getWinitUsers({ search: this.search, page: this.page, pageSize: this.pageSize });
      this.users = res.users;
      this.total = res.total;
    } finally {
      this.loading = false;
    }
  }
}
