import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { AppCategory, ImportJob, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-import',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    MatButtonModule, MatCardModule, MatIconModule, MatFormFieldModule,
    MatSelectModule, MatInputModule, MatProgressSpinnerModule,
    MatTableModule, MatSnackBarModule, MatChipsModule,
  ],
  template: `
    <div class="page-header">
      <h1>Import from OpenFoodFacts</h1>
    </div>

    <div class="import-layout">
      <mat-card class="import-form-card">
        <mat-card-header>
          <mat-card-title>Trigger Import</mat-card-title>
          <mat-card-subtitle>
            Fetches products from OpenFoodFacts and saves them as "pending" for your review.
            Each page = 50 products. Re-running will update existing products (upsert).
          </mat-card-subtitle>
        </mat-card-header>
        <mat-card-content>
          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Category</mat-label>
            <mat-select [(ngModel)]="selectedCategory">
              <mat-option *ngFor="let cat of categories" [value]="cat">
                {{ cat.display_name }} <span class="off-tag">({{ cat.off_tag }})</span>
              </mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="full-width">
            <mat-label>Max pages to import (50 products/page)</mat-label>
            <input matInput type="number" [(ngModel)]="maxPages" min="1" max="200">
            <mat-hint>{{ maxPages * 50 | number }} products max this run</mat-hint>
          </mat-form-field>
        </mat-card-content>
        <mat-card-actions>
          <button mat-raised-button color="primary" (click)="runImport()" [disabled]="importing || !selectedCategory">
            <mat-icon>download</mat-icon>
            {{ importing ? 'Importing…' : 'Start Import' }}
          </button>
          <mat-spinner *ngIf="importing" diameter="24" class="inline-spinner"></mat-spinner>
        </mat-card-actions>

        <div *ngIf="lastResult" class="result-banner" [class.success]="!lastResult.error" [class.error]="lastResult.error">
          <mat-icon>{{ lastResult.error ? 'error' : 'check_circle' }}</mat-icon>
          <span *ngIf="!lastResult.error">
            Imported {{ lastResult.products_upserted }} products in {{ lastResult.pages_imported }} page(s).
          </span>
          <span *ngIf="lastResult.error">Error: {{ lastResult.error }}</span>
        </div>
      </mat-card>

      <mat-card class="jobs-card">
        <mat-card-header>
          <mat-card-title>Import History</mat-card-title>
          <button mat-icon-button (click)="loadJobs()" matTooltip="Refresh">
            <mat-icon>refresh</mat-icon>
          </button>
        </mat-card-header>
        <mat-card-content>
          <div *ngIf="loadingJobs" class="center"><mat-spinner diameter="32"></mat-spinner></div>
          <table mat-table [dataSource]="jobs" *ngIf="!loadingJobs" class="jobs-table">
            <ng-container matColumnDef="category">
              <th mat-header-cell *matHeaderCellDef>Category</th>
              <td mat-cell *matCellDef="let j">
                <strong>{{ j.category_slug }}</strong>
                <div class="off-tag-small">{{ j.off_tag }}</div>
              </td>
            </ng-container>
            <ng-container matColumnDef="status">
              <th mat-header-cell *matHeaderCellDef>Status</th>
              <td mat-cell *matCellDef="let j">
                <span class="job-status status-{{ j.status }}">{{ j.status }}</span>
              </td>
            </ng-container>
            <ng-container matColumnDef="imported">
              <th mat-header-cell *matHeaderCellDef>Products</th>
              <td mat-cell *matCellDef="let j">{{ j.products_upserted }}</td>
            </ng-container>
            <ng-container matColumnDef="pages">
              <th mat-header-cell *matHeaderCellDef>Pages</th>
              <td mat-cell *matCellDef="let j">{{ j.pages_imported }}</td>
            </ng-container>
            <ng-container matColumnDef="started">
              <th mat-header-cell *matHeaderCellDef>Started</th>
              <td mat-cell *matCellDef="let j">{{ j.started_at | date:'short' }}</td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="jobColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: jobColumns;"></tr>
          </table>
          <div *ngIf="!loadingJobs && !jobs.length" class="empty">No imports yet.</div>
        </mat-card-content>
      </mat-card>
    </div>

    <mat-card class="info-card">
      <mat-card-header><mat-card-title>OpenFoodFacts Attribution</mat-card-title></mat-card-header>
      <mat-card-content>
        <p>
          Product data imported from <a href="https://world.openfoodfacts.org" target="_blank">OpenFoodFacts</a>
          under the <a href="https://opendatacommons.org/licenses/odbl/1-0/" target="_blank">Open Database License (ODbL)</a>.
          The database must remain publicly accessible. Individual product facts are available under the
          Database Contents License (DbCL).
        </p>
        <p>Credit: <strong>Open Food Facts contributors</strong></p>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .page-header h1 { font-size: 1.75rem; font-weight: 600; margin: 0 0 24px; color: #1a1a2e; }
    .import-layout { display: grid; grid-template-columns: 420px 1fr; gap: 24px; margin-bottom: 24px; }
    @media (max-width: 900px) { .import-layout { grid-template-columns: 1fr; } }
    .import-form-card { border-radius: 12px !important; }
    .import-form-card mat-card-content { padding: 16px; }
    .import-form-card mat-card-actions { padding: 8px 16px 16px; display: flex; align-items: center; gap: 12px; }
    .full-width { width: 100%; }
    .off-tag { font-size: 0.8em; color: #999; }
    .off-tag-small { font-size: 0.75rem; color: #999; }
    .inline-spinner { display: inline-block; }
    .result-banner { margin: 0 16px 16px; padding: 12px 16px; border-radius: 8px; display: flex; align-items: center; gap: 8px; font-size: 0.9rem; }
    .result-banner.success { background: #d1fae5; color: #065f46; }
    .result-banner.error { background: #fee2e2; color: #991b1b; }
    .jobs-card { border-radius: 12px !important; }
    .jobs-card mat-card-header { display: flex; align-items: center; justify-content: space-between; }
    .jobs-table { width: 100%; }
    .job-status { padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .status-running { background: #dbeafe; color: #1e40af; }
    .status-completed { background: #d1fae5; color: #065f46; }
    .status-failed { background: #fee2e2; color: #991b1b; }
    .center { display: flex; justify-content: center; padding: 24px; }
    .empty { text-align: center; color: #999; padding: 24px; }
    .info-card { border-radius: 12px !important; background: #f8f9fa; }
    .info-card p { margin: 0 0 8px; font-size: 0.9rem; color: #555; }
    .info-card a { color: #1a1a2e; }
  `],
})
export class ImportComponent implements OnInit {
  categories: AppCategory[] = [];
  selectedCategory: AppCategory | null = null;
  maxPages = 10;
  importing = false;
  loadingJobs = true;
  jobs: ImportJob[] = [];
  jobColumns = ['category', 'status', 'imported', 'pages', 'started'];
  lastResult: { products_upserted: number; pages_imported: number; error?: string } | null = null;

  constructor(private supa: SupabaseService, private snack: MatSnackBar) {}

  async ngOnInit() {
    const [cats] = await Promise.all([this.supa.getCategories(), this.loadJobs()]);
    this.categories = cats;
  }

  async loadJobs() {
    this.loadingJobs = true;
    try {
      this.jobs = await this.supa.getImportJobs();
    } finally {
      this.loadingJobs = false;
    }
  }

  async runImport() {
    if (!this.selectedCategory) return;
    this.importing = true;
    this.lastResult = null;
    try {
      const result = await this.supa.triggerImport(
        this.selectedCategory.slug,
        this.selectedCategory.off_tag,
        this.maxPages,
      );
      this.lastResult = result as any;
      this.snack.open(`Import complete: ${result.products_upserted} products added/updated`, '', { duration: 4000 });
      await this.loadJobs();
    } catch (err) {
      this.lastResult = { products_upserted: 0, pages_imported: 0, error: String(err) };
    } finally {
      this.importing = false;
    }
  }
}
