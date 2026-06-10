import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SupabaseService, CoachRow, CoachStatus } from '../../services/supabase.service';

@Component({
  selector: 'app-coaches',
  standalone: true,
  imports: [
    CommonModule, FormsModule, DatePipe,
    MatTableModule, MatInputModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatSelectModule, MatTooltipModule,
  ],
  template: `
    <div class="page-header">
      <h1>Health Coaches</h1>
      <span class="total-badge">{{ total }} total</span>
    </div>

    <div class="toolbar">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search by name or email</mat-label>
        <input matInput [(ngModel)]="search" (ngModelChange)="onSearch()" placeholder="e.g. Jane Smith">
        <mat-icon matPrefix>search</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="status-filter">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="statusFilter" (ngModelChange)="reload()">
          <mat-option value="">All</mat-option>
          <mat-option value="pending">Pending</mat-option>
          <mat-option value="approved">Approved</mat-option>
          <mat-option value="blocked">Blocked</mat-option>
        </mat-select>
      </mat-form-field>
    </div>

    <div class="table-wrapper" *ngIf="!loading; else spinner">
      <table mat-table [dataSource]="coaches" class="coaches-table">

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Coach</th>
          <td mat-cell *matCellDef="let c">
            <div class="coach-name">{{ c.name }}</div>
            <div class="coach-email">{{ c.email }}</div>
            <div class="coach-title" *ngIf="c.title">{{ c.title }}</div>
          </td>
        </ng-container>

        <ng-container matColumnDef="plans">
          <th mat-header-cell *matHeaderCellDef>Meal Plans</th>
          <td mat-cell *matCellDef="let c">
            <span class="plans-count">{{ c.meal_plan_count }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="specialties">
          <th mat-header-cell *matHeaderCellDef>Specialties</th>
          <td mat-cell *matCellDef="let c">
            <div class="spec-chips">
              <span class="spec-chip" *ngFor="let s of c.specialties.slice(0, 3)">{{ s }}</span>
              <span class="spec-more" *ngIf="c.specialties.length > 3">+{{ c.specialties.length - 3 }}</span>
            </div>
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let c">
            <span class="status-chip"
              [class.chip-pending]="c.status === 'pending'"
              [class.chip-approved]="c.status === 'approved'"
              [class.chip-blocked]="c.status === 'blocked'">
              {{ c.status }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="joined">
          <th mat-header-cell *matHeaderCellDef>Applied</th>
          <td mat-cell *matCellDef="let c">{{ c.created_at | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let c">
            <div class="action-row">
              <button mat-stroked-button color="primary"
                *ngIf="c.status !== 'approved'"
                [disabled]="saving[c.id]"
                (click)="setStatus(c, 'approved')">
                <mat-icon>check_circle</mat-icon> Approve
              </button>
              <button mat-stroked-button
                *ngIf="c.status === 'pending'"
                [disabled]="saving[c.id]"
                (click)="setStatus(c, 'blocked')">
                <mat-icon>block</mat-icon> Block
              </button>
              <button mat-stroked-button color="warn"
                *ngIf="c.status === 'approved'"
                [disabled]="saving[c.id]"
                (click)="setStatus(c, 'blocked')">
                <mat-icon>block</mat-icon> Block
              </button>
              <button mat-stroked-button
                *ngIf="c.status === 'blocked'"
                [disabled]="saving[c.id]"
                (click)="setStatus(c, 'pending')">
                <mat-icon>refresh</mat-icon> Reset
              </button>
            </div>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="columns"></tr>
        <tr mat-row *matRowDef="let row; columns: columns;"></tr>
      </table>

      <div class="empty" *ngIf="!coaches.length">No coaches found.</div>

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
    .toolbar { display: flex; gap: 16px; flex-wrap: wrap; margin-bottom: 16px; }
    .search-field { flex: 1; min-width: 240px; max-width: 400px; }
    .status-filter { width: 160px; }
    .table-wrapper { overflow-x: auto; }
    .coaches-table { width: 100%; }
    .coaches-table th { font-weight: 600; color: #555; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.04em; }
    .coach-name { font-weight: 600; color: #1a1a2e; }
    .coach-email { font-size: 0.82rem; color: #888; }
    .coach-title { font-size: 0.8rem; color: #64748b; font-style: italic; }
    .plans-count { font-weight: 700; color: #1a73e8; }
    .spec-chips { display: flex; flex-wrap: wrap; gap: 4px; }
    .spec-chip { background: #e8f0fe; color: #1a73e8; border-radius: 10px; padding: 2px 8px; font-size: 0.75rem; font-weight: 500; }
    .spec-more { font-size: 0.75rem; color: #888; padding: 2px 4px; }
    .status-chip { border-radius: 100px; padding: 3px 10px; font-size: 0.78rem; font-weight: 600; text-transform: capitalize; }
    .chip-pending { background: #fef3c7; color: #92400e; }
    .chip-approved { background: #d1fae5; color: #065f46; }
    .chip-blocked { background: #fee2e2; color: #991b1b; }
    .action-row { display: flex; gap: 8px; }
    .action-row button { font-size: 0.78rem; }
    .pagination { display: flex; align-items: center; gap: 16px; padding: 16px 0; justify-content: flex-end; }
    .empty { padding: 48px; text-align: center; color: #888; }
    .center { display: flex; justify-content: center; padding: 48px; }
  `],
})
export class CoachesAdminComponent implements OnInit {
  coaches: CoachRow[] = [];
  total = 0;
  loading = true;
  search = '';
  statusFilter = 'pending';
  page = 0;
  readonly pageSize = 25;
  saving: Record<string, boolean> = {};

  columns = ['name', 'plans', 'specialties', 'status', 'joined', 'actions'];

  private searchTimer: any;

  constructor(private supa: SupabaseService) {}

  get totalPages() { return Math.max(1, Math.ceil(this.total / this.pageSize)); }

  async ngOnInit() { await this.load(); }

  onSearch() {
    clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => { this.page = 0; this.load(); }, 350);
  }

  reload() { this.page = 0; this.load(); }
  prevPage() { if (this.page > 0) { this.page--; this.load(); } }
  nextPage() { if (this.page < this.totalPages - 1) { this.page++; this.load(); } }

  async setStatus(c: CoachRow, status: CoachStatus) {
    this.saving[c.id] = true;
    try {
      await this.supa.setProfessionalStatus(c.id, status);
      c.status = status;
    } finally {
      this.saving[c.id] = false;
    }
  }

  private async load() {
    this.loading = true;
    try {
      const res = await this.supa.getProfessionals({
        status: this.statusFilter || undefined,
        search: this.search || undefined,
        page: this.page,
        pageSize: this.pageSize,
      });
      this.coaches = res.professionals;
      this.total = res.total;
    } finally {
      this.loading = false;
    }
  }
}
