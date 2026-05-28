import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSliderModule } from '@angular/material/slider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDividerModule } from '@angular/material/divider';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { MatChipInputEvent } from '@angular/material/chips';
import { AppCategory, Product, SupabaseService } from '../../services/supabase.service';

const KNOWN_ALLERGENS = [
  'gluten','wheat','milk','eggs','peanuts','tree-nuts','soy','fish',
  'shellfish','sesame','mustard','celery','lupin','molluscs','sulphites',
];
const KNOWN_DIETS = [
  'vegan','vegetarian','gluten-free','dairy-free','keto','paleo',
  'halal','kosher','low-sodium','low-sugar','organic','non-gmo',
];

@Component({
  selector: 'app-product-edit',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ReactiveFormsModule,
    MatButtonModule, MatInputModule, MatFormFieldModule, MatSelectModule,
    MatChipsModule, MatIconModule, MatCardModule, MatSliderModule,
    MatCheckboxModule, MatProgressSpinnerModule, MatSnackBarModule, MatDividerModule,
  ],
  template: `
    <div class="page-header">
      <button mat-icon-button (click)="back()"><mat-icon>arrow_back</mat-icon></button>
      <h1>Edit Product</h1>
    </div>

    <div *ngIf="loading" class="center"><mat-spinner diameter="48"></mat-spinner></div>

    <div *ngIf="!loading && product" class="edit-layout">
      <!-- Left: preview -->
      <div class="preview-col">
        <mat-card class="preview-card">
          <img *ngIf="product.image_front_url" [src]="product.image_front_url"
            (error)="onImgError($event)" class="product-img" alt="">
          <mat-card-content>
            <div class="barcode">{{ product.barcode }}</div>
            <div class="preview-name">{{ product.name }}</div>
            <div class="preview-brand">{{ product.brand }}</div>
            <span class="nutriscore grade-{{ product.nutriscore_grade }}">
              {{ product.nutriscore_grade?.toUpperCase() || '?' }}
            </span>
            <span class="nova-chip" *ngIf="product.nova_group">NOVA {{ product.nova_group }}</span>
          </mat-card-content>
        </mat-card>

        <mat-card class="preview-card" *ngIf="product.image_ingredients_url">
          <img [src]="product.image_ingredients_url" (error)="onImgError($event)" class="product-img" alt="Ingredients">
          <mat-card-content><small>Ingredients label</small></mat-card-content>
        </mat-card>

        <mat-card class="preview-card" *ngIf="product.image_nutrition_url">
          <img [src]="product.image_nutrition_url" (error)="onImgError($event)" class="product-img" alt="Nutrition">
          <mat-card-content><small>Nutrition label</small></mat-card-content>
        </mat-card>
      </div>

      <!-- Right: form -->
      <div class="form-col">
        <form [formGroup]="form" (ngSubmit)="save()">

          <mat-card class="section-card">
            <mat-card-header><mat-card-title>Basic Info</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Product Name</mat-label>
                <input matInput formControlName="name">
              </mat-form-field>
              <div class="row-2">
                <mat-form-field appearance="outline">
                  <mat-label>Brand</mat-label>
                  <input matInput formControlName="brand">
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Quantity</mat-label>
                  <input matInput formControlName="quantity">
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Ingredients Text</mat-label>
                <textarea matInput formControlName="ingredients_text" rows="4"></textarea>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-header><mat-card-title>Categories</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="checkbox-grid">
                <mat-checkbox *ngFor="let cat of categories"
                  [checked]="selectedCategoryIds.has(cat.id)"
                  (change)="toggleCategory(cat.id, $event.checked)">
                  {{ cat.display_name }}
                </mat-checkbox>
              </div>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-header><mat-card-title>Allergens</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="checkbox-grid">
                <mat-checkbox *ngFor="let a of knownAllergens"
                  [checked]="allergenSet.has(a)"
                  (change)="toggleTag(allergenSet, a, $event.checked)">
                  {{ a }}
                </mat-checkbox>
              </div>
              <mat-form-field appearance="outline" class="full-width" style="margin-top:12px">
                <mat-label>Custom allergens (press Enter to add)</mat-label>
                <mat-chip-grid #allergenGrid>
                  <mat-chip-row *ngFor="let t of customAllergens" (removed)="removeCustomAllergen(t)">
                    {{ t }}<button matChipRemove><mat-icon>cancel</mat-icon></button>
                  </mat-chip-row>
                  <input [matChipInputFor]="allergenGrid"
                    [matChipInputSeparatorKeyCodes]="separatorCodes"
                    (matChipInputTokenEnd)="addCustomAllergen($event)">
                </mat-chip-grid>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-header><mat-card-title>Diet Flags</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="checkbox-grid">
                <mat-checkbox *ngFor="let d of knownDiets"
                  [checked]="dietSet.has(d)"
                  (change)="toggleTag(dietSet, d, $event.checked)">
                  {{ d }}
                </mat-checkbox>
              </div>
              <mat-form-field appearance="outline" class="full-width" style="margin-top:12px">
                <mat-label>Custom diet flags (press Enter to add)</mat-label>
                <mat-chip-grid #dietGrid>
                  <mat-chip-row *ngFor="let t of customDiets" (removed)="removeCustomDiet(t)">
                    {{ t }}<button matChipRemove><mat-icon>cancel</mat-icon></button>
                  </mat-chip-row>
                  <input [matChipInputFor]="dietGrid"
                    [matChipInputSeparatorKeyCodes]="separatorCodes"
                    (matChipInputTokenEnd)="addCustomDiet($event)">
                </mat-chip-grid>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-header><mat-card-title>Custom Tags</mat-card-title></mat-card-header>
            <mat-card-content>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Tags (press Enter to add)</mat-label>
                <mat-chip-grid #tagGrid>
                  <mat-chip-row *ngFor="let t of customTagsList" (removed)="removeCustomTag(t)">
                    {{ t }}<button matChipRemove><mat-icon>cancel</mat-icon></button>
                  </mat-chip-row>
                  <input [matChipInputFor]="tagGrid"
                    [matChipInputSeparatorKeyCodes]="separatorCodes"
                    (matChipInputTokenEnd)="addCustomTag($event)">
                </mat-chip-grid>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <mat-card class="section-card">
            <mat-card-header><mat-card-title>Admin Fields</mat-card-title></mat-card-header>
            <mat-card-content>
              <div class="row-2">
                <mat-form-field appearance="outline">
                  <mat-label>Status</mat-label>
                  <mat-select formControlName="status">
                    <mat-option value="pending">Pending</mat-option>
                    <mat-option value="approved">Approved</mat-option>
                    <mat-option value="rejected">Rejected</mat-option>
                  </mat-select>
                </mat-form-field>
                <mat-form-field appearance="outline">
                  <mat-label>Health Rating (1–10)</mat-label>
                  <input matInput type="number" min="1" max="10" formControlName="health_rating">
                </mat-form-field>
              </div>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>AI Insights / Notes for Users</mat-label>
                <textarea matInput formControlName="ai_insights" rows="3"></textarea>
              </mat-form-field>
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Admin Notes (internal)</mat-label>
                <textarea matInput formControlName="admin_notes" rows="2"></textarea>
              </mat-form-field>
            </mat-card-content>
          </mat-card>

          <div class="form-actions">
            <button mat-button type="button" (click)="back()">Cancel</button>
            <button mat-raised-button color="primary" type="submit" [disabled]="saving">
              {{ saving ? 'Saving…' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .page-header { display: flex; align-items: center; gap: 8px; margin-bottom: 24px; }
    .page-header h1 { font-size: 1.75rem; font-weight: 600; margin: 0; color: #1a1a2e; }
    .center { display: flex; justify-content: center; padding: 48px; }
    .edit-layout { display: grid; grid-template-columns: 260px 1fr; gap: 24px; align-items: start; }
    @media (max-width: 900px) { .edit-layout { grid-template-columns: 1fr; } }
    .preview-col { display: flex; flex-direction: column; gap: 16px; position: sticky; top: 88px; }
    .preview-card { border-radius: 12px !important; }
    .product-img { width: 100%; object-fit: contain; max-height: 220px; background: #f5f5f5; }
    .barcode { font-family: monospace; font-size: 0.75rem; color: #999; }
    .preview-name { font-weight: 600; font-size: 1rem; margin-top: 4px; }
    .preview-brand { font-size: 0.85rem; color: #666; margin-bottom: 8px; }
    .nutriscore { display: inline-block; width: 28px; height: 28px; border-radius: 50%; text-align: center; line-height: 28px; font-weight: 700; font-size: 0.85rem; color: white; margin-right: 6px; }
    .grade-a { background: #038141; } .grade-b { background: #85BB2F; } .grade-c { background: #FECB02; color: #333; } .grade-d { background: #EE8100; } .grade-e { background: #E63E11; }
    .nova-chip { background: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 99px; font-size: 0.78rem; font-weight: 600; }
    .form-col { display: flex; flex-direction: column; gap: 16px; }
    .section-card { border-radius: 12px !important; }
    .section-card mat-card-header { padding: 16px 16px 0; }
    .section-card mat-card-content { padding: 12px 16px 16px; }
    .full-width { width: 100%; }
    .row-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .checkbox-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 4px; }
    .form-actions { display: flex; justify-content: flex-end; gap: 12px; padding-bottom: 32px; }
  `],
})
export class ProductEditComponent implements OnInit {
  loading = true;
  saving = false;
  product: Product | null = null;
  categories: AppCategory[] = [];
  selectedCategoryIds = new Set<string>();
  allergenSet = new Set<string>();
  dietSet = new Set<string>();
  customAllergens: string[] = [];
  customDiets: string[] = [];
  customTagsList: string[] = [];
  knownAllergens = KNOWN_ALLERGENS;
  knownDiets = KNOWN_DIETS;
  separatorCodes = [ENTER, COMMA];

  form: FormGroup;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supa: SupabaseService,
    private snack: MatSnackBar,
    private fb: FormBuilder,
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      brand: [''],
      quantity: [''],
      ingredients_text: [''],
      status: ['pending', Validators.required],
      health_rating: [null],
      ai_insights: [''],
      admin_notes: [''],
    });
  }

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    const [product, categories, catIds] = await Promise.all([
      this.supa.getProduct(id),
      this.supa.getCategories(),
      this.supa.getProductCategories(id),
    ]);
    this.product = product;
    this.categories = categories;
    this.selectedCategoryIds = new Set(catIds);

    // Populate allergen/diet sets
    for (const a of (product.allergen_tags ?? [])) {
      if (KNOWN_ALLERGENS.includes(a)) this.allergenSet.add(a);
      else this.customAllergens.push(a);
    }
    for (const d of (product.diet_tags ?? [])) {
      if (KNOWN_DIETS.includes(d)) this.dietSet.add(d);
      else this.customDiets.push(d);
    }
    this.customTagsList = [...(product.custom_tags ?? [])];

    this.form.patchValue({
      name: product.name,
      brand: product.brand,
      quantity: product.quantity,
      ingredients_text: product.ingredients_text,
      status: product.status,
      health_rating: product.health_rating,
      ai_insights: product.ai_insights,
      admin_notes: product.admin_notes,
    });
    this.loading = false;
  }

  toggleCategory(id: string, checked: boolean) {
    if (checked) this.selectedCategoryIds.add(id);
    else this.selectedCategoryIds.delete(id);
  }

  toggleTag(set: Set<string>, value: string, checked: boolean) {
    if (checked) set.add(value);
    else set.delete(value);
  }

  addCustomAllergen(e: MatChipInputEvent) {
    const v = (e.value || '').trim().toLowerCase();
    if (v) this.customAllergens.push(v);
    e.chipInput.clear();
  }
  removeCustomAllergen(t: string) { this.customAllergens = this.customAllergens.filter(x => x !== t); }

  addCustomDiet(e: MatChipInputEvent) {
    const v = (e.value || '').trim().toLowerCase();
    if (v) this.customDiets.push(v);
    e.chipInput.clear();
  }
  removeCustomDiet(t: string) { this.customDiets = this.customDiets.filter(x => x !== t); }

  addCustomTag(e: MatChipInputEvent) {
    const v = (e.value || '').trim().toLowerCase();
    if (v) this.customTagsList.push(v);
    e.chipInput.clear();
  }
  removeCustomTag(t: string) { this.customTagsList = this.customTagsList.filter(x => x !== t); }

  async save() {
    if (!this.product || this.form.invalid) return;
    this.saving = true;
    try {
      const allergenTags = [...this.allergenSet, ...this.customAllergens];
      const dietTags = [...this.dietSet, ...this.customDiets];
      const updates = {
        ...this.form.value,
        allergen_tags: allergenTags,
        diet_tags: dietTags,
        custom_tags: this.customTagsList,
        approved_at: this.form.value.status === 'approved' ? new Date().toISOString() : this.product.approved_at,
      };
      await this.supa.updateProduct(this.product.id, updates);
      await this.supa.setProductCategories(this.product.id, [...this.selectedCategoryIds]);
      this.snack.open('Product saved', '', { duration: 2500 });
      this.router.navigate(['/products']);
    } finally {
      this.saving = false;
    }
  }

  back() { this.router.navigate(['/products']); }
  onImgError(e: Event) { (e.target as HTMLImageElement).style.display = 'none'; }
}
