import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Product, ProductStatus, SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-product-queue',
  standalone: true,
  imports: [
    CommonModule, FormsModule, RouterLink,
    MatTableModule, MatButtonModule, MatIconModule, MatInputModule,
    MatSelectModule, MatFormFieldModule, MatProgressSpinnerModule,
    MatChipsModule, MatTooltipModule, MatPaginatorModule, MatSnackBarModule,
  ],
  template: `
    <div class="page-header">
      <h1>Products</h1>
    </div>

    <div class="filters">
      <mat-form-field appearance="outline" class="search-field">
        <mat-label>Search by name, brand, or barcode</mat-label>
        <input matInput [(ngModel)]="search" (ngModelChange)="onSearchChange()" placeholder="e.g. Cheerios">
        <mat-icon matSuffix>search</mat-icon>
      </mat-form-field>

      <mat-form-field appearance="outline" class="status-field">
        <mat-label>Status</mat-label>
        <mat-select [(ngModel)]="statusFilter" (ngModelChange)="loadProducts()">
          <mat-option value="">All</mat-option>
          <mat-option value="pending">Pending</mat-option>
          <mat-option value="approved">Approved</mat-option>
          <mat-option value="rejected">Rejected</mat-option>
        </mat-select>
      </mat-form-field>

      <div class="bulk-actions" *ngIf="selection.size">
        <button mat-raised-button color="primary" (click)="bulkApprove()">
          <mat-icon>check</mat-icon> Approve ({{ selection.size }})
        </button>
        <button mat-raised-button color="warn" (click)="bulkReject()">
          <mat-icon>close</mat-icon> Reject ({{ selection.size }})
        </button>
        <button mat-button (click)="selection.clear()">Clear selection</button>
      </div>
    </div>

    <div class="table-container" *ngIf="!loading; else spinner">
      <table mat-table [dataSource]="products" class="product-table">

        <ng-container matColumnDef="select">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let p">
            <input type="checkbox" [checked]="selection.has(p.id)"
              (change)="toggleSelect(p.id)" (click)="$event.stopPropagation()">
          </td>
        </ng-container>

        <ng-container matColumnDef="image">
          <th mat-header-cell *matHeaderCellDef></th>
          <td mat-cell *matCellDef="let p">
            <img *ngIf="p.image_front_url" [src]="p.image_front_url" class="thumb"
              (error)="onImgError($event)" alt="">
            <div *ngIf="!p.image_front_url" class="no-img"><mat-icon>no_photography</mat-icon></div>
          </td>
        </ng-container>

        <ng-container matColumnDef="name">
          <th mat-header-cell *matHeaderCellDef>Product</th>
          <td mat-cell *matCellDef="let p">
            <div class="product-name">{{ p.name || '(no name)' }}</div>
            <div class="product-brand">{{ p.brand }}</div>
            <div class="product-barcode">{{ p.barcode }}</div>
          </td>
        </ng-container>

        <ng-container matColumnDef="nutriscore">
          <th mat-header-cell *matHeaderCellDef>Score</th>
          <td mat-cell *matCellDef="let p">
            <span class="nutriscore grade-{{ p.nutriscore_grade }}">
              {{ p.nutriscore_grade?.toUpperCase() || '—' }}
            </span>
          </td>
        </ng-container>

        <ng-container matColumnDef="status">
          <th mat-header-cell *matHeaderCellDef>Status</th>
          <td mat-cell *matCellDef="let p">
            <span class="status-chip status-{{ p.status }}">{{ p.status }}</span>
          </td>
        </ng-container>

        <ng-container matColumnDef="health_rating">
          <th mat-header-cell *matHeaderCellDef>Rating</th>
          <td mat-cell *matCellDef="let p">
            {{ p.health_rating ?? '—' }}
          </td>
        </ng-container>

        <ng-container matColumnDef="created">
          <th mat-header-cell *matHeaderCellDef>Imported</th>
          <td mat-cell *matCellDef="let p">{{ p.created_at | date:'mediumDate' }}</td>
        </ng-container>

        <ng-container matColumnDef="actions">
          <th mat-header-cell *matHeaderCellDef>Actions</th>
          <td mat-cell *matCellDef="let p">
            <a mat-icon-button [routerLink]="['/products', p.id, 'edit']" matTooltip="Edit">
              <mat-icon>edit</mat-icon>
            </a>
            <button mat-icon-button color="primary" (click)="approve(p)" matTooltip="Approve"
              *ngIf="p.status !== 'approved'">
              <mat-icon>check_circle</mat-icon>
            </button>
            <button mat-icon-button color="warn" (click)="reject(p)" matTooltip="Reject"
              *ngIf="p.status !== 'rejected'">
              <mat-icon>cancel</mat-icon>
            </button>
          </td>
        </ng-container>

        <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
        <tr mat-row *matRowDef="let row; columns: displayedColumns;" class="product-row"></tr>
      </table>

      <div class="no-results" *ngIf="!products.length">
        <mat-icon>inventory_2</mat-icon>
        <p>No products found.</p>
      </div>

      <mat-paginator
        [length]="total"
        [pageSize]="pageSize"
        [pageSizeOptions]="[25, 50, 100]"
        (page)="onPage($event)"
      ></mat-paginator>
    </div>

    <ng-template #spinner>
      <div class="center"><mat-spinner diameter="48"></mat-spinner></div>
    </ng-template>
  `,
  styles: [`
    .page-header h1 { font-size: 1.75rem; font-weight: 600; margin: 0 0 24px; color: #1a1a2e; }
    .filters { display: flex; gap: 16px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
    .search-field { flex: 1; min-width: 260px; }
    .status-field { width: 160px; }
    .bulk-actions { display: flex; gap: 8px; align-items: center; }
    .table-container { border-radius: 12px; overflow: hidden; border: 1px solid #e0e0e0; }
    .product-table { width: 100%; }
    .thumb { width: 48px; height: 48px; object-fit: contain; border-radius: 4px; }
    .no-img { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; background: #f5f5f5; border-radius: 4px; color: #aaa; }
    .product-name { font-weight: 500; font-size: 0.9rem; }
    .product-brand { font-size: 0.78rem; color: #666; }
    .product-barcode { font-size: 0.72rem; color: #999; font-family: monospace; }
    .nutriscore { display: inline-block; width: 24px; height: 24px; border-radius: 50%; text-align: center; line-height: 24px; font-weight: 700; font-size: 0.75rem; color: white; }
    .grade-a { background: #038141; } .grade-b { background: #85BB2F; } .grade-c { background: #FECB02; color: #333; }
    .grade-d { background: #EE8100; } .grade-e { background: #E63E11; }
    .status-chip { padding: 2px 10px; border-radius: 99px; font-size: 0.75rem; font-weight: 600; text-transform: uppercase; }
    .status-pending { background: #fef3c7; color: #92400e; }
    .status-approved { background: #d1fae5; color: #065f46; }
    .status-rejected { background: #fee2e2; color: #991b1b; }
    .product-row:hover { background: #f8f9fa; }
    .no-results { text-align: center; padding: 48px; color: #999; }
    .no-results mat-icon { font-size: 3rem; width: 3rem; height: 3rem; }
    .center { display: flex; justify-content: center; padding: 48px; }
    td.mat-mdc-cell { vertical-align: middle; }
  `],
})
export class ProductQueueComponent implements OnInit {
  displayedColumns = ['select', 'image', 'name', 'nutriscore', 'status', 'health_rating', 'created', 'actions'];
  products: Product[] = [];
  total = 0;
  page = 0;
  pageSize = 25;
  loading = true;
  search = '';
  statusFilter: ProductStatus | '' = 'pending';
  selection = new Set<string>();

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor(
    private supa: SupabaseService,
    private snack: MatSnackBar,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['status']) this.statusFilter = params['status'] as ProductStatus;
      this.loadProducts();
    });
  }

  async loadProducts() {
    this.loading = true;
    this.selection.clear();
    try {
      const result = await this.supa.getProducts({
        status: this.statusFilter || undefined,
        search: this.search || undefined,
        page: this.page,
        pageSize: this.pageSize,
      });
      this.products = result.products;
      this.total = result.total;
    } finally {
      this.loading = false;
    }
  }

  onSearchChange() {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.loadProducts(), 400);
  }

  onPage(e: PageEvent) {
    this.page = e.pageIndex;
    this.pageSize = e.pageSize;
    this.loadProducts();
  }

  toggleSelect(id: string) {
    if (this.selection.has(id)) this.selection.delete(id);
    else this.selection.add(id);
  }

  async approve(p: Product) {
    await this.supa.approveProduct(p.id);
    p.status = 'approved';
    this.snack.open(`"${p.name}" approved`, '', { duration: 2500 });
  }

  async reject(p: Product) {
    await this.supa.rejectProduct(p.id);
    p.status = 'rejected';
    this.snack.open(`"${p.name}" rejected`, '', { duration: 2500 });
  }

  async bulkApprove() {
    const ids = [...this.selection];
    await Promise.all(ids.map(id => this.supa.approveProduct(id)));
    this.snack.open(`${ids.length} products approved`, '', { duration: 2500 });
    this.loadProducts();
  }

  async bulkReject() {
    const ids = [...this.selection];
    await Promise.all(ids.map(id => this.supa.rejectProduct(id)));
    this.snack.open(`${ids.length} products rejected`, '', { duration: 2500 });
    this.loadProducts();
  }

  onImgError(e: Event) {
    (e.target as HTMLImageElement).style.display = 'none';
  }
}
