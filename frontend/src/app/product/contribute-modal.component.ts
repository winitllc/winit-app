import { Component, Input, OnInit } from '@angular/core';
import { ModalController, LoadingController, ToastController, ActionSheetController } from '@ionic/angular';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { ContributionService, ContribField } from '../util/contribution.service';
import { WinitAuthService } from '../util/winit-auth.service';

export interface ContribFieldConfig {
  field: ContribField;
  label: string;
  icon: string;
  description: string;
  supportsAI: boolean;  // ingredients image gets AI extraction
}

export const CONTRIB_FIELDS: ContribFieldConfig[] = [
  { field: 'image_front',       label: 'Front of Package',    icon: 'image-outline',       description: 'Clear photo of the product front label', supportsAI: false },
  { field: 'image_ingredients', label: 'Ingredients List',    icon: 'list-outline',        description: 'Photo of the ingredients section — AI will extract the text', supportsAI: true },
  { field: 'image_nutrition',   label: 'Nutrition Facts',     icon: 'nutrition-outline',   description: 'Photo of the nutrition facts panel', supportsAI: false },
  { field: 'image_barcode',     label: 'Barcode',             icon: 'barcode-outline',     description: 'Clear photo of the barcode (optional)', supportsAI: false },
  { field: 'ingredients_text',  label: 'Type Ingredients',    icon: 'create-outline',      description: 'Manually type the full ingredient list', supportsAI: false },
];

@Component({
  selector: 'app-contribute-modal',
  template: `
<ion-header>
  <ion-toolbar color="primary">
    <ion-buttons slot="start">
      <ion-button (click)="dismiss()">
        <ion-icon slot="icon-only" name="close-outline"></ion-icon>
      </ion-button>
    </ion-buttons>
    <ion-title>Help Improve This Product</ion-title>
  </ion-toolbar>
</ion-header>

<ion-content class="ion-padding">
  <!-- Intro -->
  <div class="intro-card">
    <div class="intro-icon">🌟</div>
    <h3 class="intro-title">Earn points by contributing!</h3>
    <p class="intro-sub">
      Submit missing product info. Your submission goes to admin review —
      once approved it helps every WINIT user.
    </p>
  </div>

  <!-- Step 1: pick field -->
  <div *ngIf="step === 1">
    <h4 class="step-label">What would you like to contribute?</h4>
    <div class="field-list">
      <button
        *ngFor="let f of availableFields"
        class="field-btn"
        [class.field-btn-locked]="lockedFields.has(f.field)"
        [class.field-btn-pending]="hasPending(f.field)"
        [disabled]="lockedFields.has(f.field)"
        (click)="selectField(f)"
      >
        <ion-icon [name]="f.icon" class="field-icon"></ion-icon>
        <div class="field-info">
          <div class="field-label">{{ f.label }}</div>
          <div class="field-desc">{{ f.description }}</div>
        </div>
        <ion-badge *ngIf="lockedFields.has(f.field)" color="success" class="field-badge">Approved</ion-badge>
        <ion-badge *ngIf="!lockedFields.has(f.field) && hasPending(f.field)" color="warning" class="field-badge">Pending</ion-badge>
        <ion-icon *ngIf="!lockedFields.has(f.field) && !hasPending(f.field)" name="chevron-forward-outline" class="field-chevron"></ion-icon>
      </button>
    </div>
  </div>

  <!-- Step 2: capture / type -->
  <div *ngIf="step === 2 && selectedField">
    <div class="back-row">
      <ion-button fill="clear" size="small" (click)="step = 1">
        <ion-icon slot="start" name="arrow-back-outline"></ion-icon>
        Back
      </ion-button>
    </div>

    <h4 class="step-label">{{ selectedField!.label }}</h4>
    <p class="step-desc">{{ selectedField!.description }}</p>

    <!-- Text input for manual ingredient entry -->
    <div *ngIf="selectedField!.field === 'ingredients_text'" class="text-entry">
      <ion-textarea
        [value]="rawText"
        (ionInput)="rawText = $any($event.target).value"
        placeholder="Type the full ingredients list here…"
        rows="8"
        class="ingredients-textarea"
        [autofocus]="true"
      ></ion-textarea>
    </div>

    <!-- Camera / image flow -->
    <div *ngIf="selectedField!.field !== 'ingredients_text'" class="image-entry">
      <!-- Preview captured image -->
      <div *ngIf="capturedBase64" class="img-preview-wrap">
        <img [src]="'data:image/jpeg;base64,' + capturedBase64" class="img-preview" alt="Captured" />
        <ion-button fill="outline" size="small" color="medium" (click)="capturedBase64 = null; extractedText = ''">
          <ion-icon slot="start" name="refresh-outline"></ion-icon>
          Retake
        </ion-button>
      </div>

      <!-- Take / upload photo buttons -->
      <div *ngIf="!capturedBase64" class="capture-buttons">
        <ion-button expand="block" (click)="takePhoto(CameraSource.Camera)" class="capture-btn">
          <ion-icon slot="start" name="camera-outline"></ion-icon>
          Take Photo
        </ion-button>
        <ion-button expand="block" fill="outline" (click)="takePhoto(CameraSource.Photos)">
          <ion-icon slot="start" name="images-outline"></ion-icon>
          Choose from Gallery
        </ion-button>
      </div>

      <!-- AI extraction result for ingredients image -->
      <div *ngIf="selectedField!.supportsAI && extractedText" class="ai-result">
        <div class="ai-label">
          <ion-icon name="sparkles-outline"></ion-icon>
          AI extracted ingredients
        </div>
        <p class="ai-text">{{ extractedText }}</p>
        <p class="ai-note">Review the text above. The admin will also see your original photo.</p>
      </div>
      <div *ngIf="selectedField!.supportsAI && capturedBase64 && !extractedText && !extracting" class="ai-hint">
        <ion-icon name="information-circle-outline"></ion-icon>
        Ingredient text will be extracted automatically after you submit.
      </div>
      <div *ngIf="extracting" class="ai-extracting">
        <ion-spinner name="crescent"></ion-spinner>
        Extracting ingredients with AI…
      </div>
    </div>

    <!-- Submit button -->
    <ion-button
      expand="block"
      class="submit-btn"
      [disabled]="!canSubmit || submitting"
      (click)="submit()"
    >
      <ion-spinner *ngIf="submitting" name="crescent" slot="start"></ion-spinner>
      <span *ngIf="!submitting">Submit Contribution</span>
      <span *ngIf="submitting">Submitting…</span>
    </ion-button>
  </div>

  <!-- Step 3: success -->
  <div *ngIf="step === 3" class="success-view">
    <div class="success-icon">✅</div>
    <h3 class="success-title">Thank you!</h3>
    <p class="success-sub">
      Your contribution is in the review queue. Once approved, it will be visible to all users.
    </p>
    <ion-button expand="block" (click)="dismiss()">Done</ion-button>
  </div>
</ion-content>
  `,
  styles: [`
    .intro-card {
      background: linear-gradient(135deg, #eff6ff 0%, #f0fdf4 100%);
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 20px;
      text-align: center;
    }
    .intro-icon { font-size: 2rem; margin-bottom: 6px; }
    .intro-title { font-size: 1rem; font-weight: 700; color: var(--ion-color-dark); margin-bottom: 6px; }
    .intro-sub { font-size: 0.85rem; color: var(--ion-color-medium); line-height: 1.5; }

    .step-label { font-size: 1rem; font-weight: 700; margin-bottom: 6px; color: var(--ion-color-dark); }
    .step-desc { font-size: 0.85rem; color: var(--ion-color-medium); margin-bottom: 16px; line-height: 1.4; }

    .field-list { display: flex; flex-direction: column; gap: 10px; }
    .field-btn {
      display: flex; align-items: center; gap: 14px;
      padding: 14px 16px;
      background: white;
      border: 1.5px solid #e2e8f0;
      border-radius: 12px;
      cursor: pointer;
      text-align: left;
      width: 100%;
      transition: border-color 0.15s, background 0.15s;
    }
    .field-btn:not(:disabled):hover { border-color: var(--ion-color-primary); background: #eff6ff; }
    .field-btn-locked { opacity: 0.6; cursor: default; background: #f8fafc; }
    .field-icon { font-size: 1.4rem; color: var(--ion-color-primary); flex-shrink: 0; }
    .field-info { flex: 1; min-width: 0; }
    .field-label { font-size: 0.9rem; font-weight: 600; color: var(--ion-color-dark); }
    .field-desc { font-size: 0.75rem; color: var(--ion-color-medium); margin-top: 2px; }
    .field-badge { flex-shrink: 0; }
    .field-chevron { color: #94a3b8; flex-shrink: 0; }

    .back-row { margin-bottom: 8px; }

    .text-entry { margin-bottom: 16px; }
    .ingredients-textarea {
      border: 1.5px solid #e2e8f0;
      border-radius: 10px;
      padding: 10px;
      font-size: 0.9rem;
      width: 100%;
    }

    .image-entry { margin-bottom: 16px; }
    .img-preview-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 16px; }
    .img-preview { width: 100%; max-height: 240px; object-fit: contain; border-radius: 10px; box-shadow: 0 2px 8px rgba(0,0,0,.12); }
    .capture-buttons { display: flex; flex-direction: column; gap: 10px; }
    .capture-btn { --background: var(--ion-color-primary); }

    .ai-result {
      background: #f0fdf4;
      border: 1.5px solid #86efac;
      border-radius: 10px;
      padding: 12px;
      margin-top: 14px;
    }
    .ai-label { display: flex; align-items: center; gap: 6px; font-size: 0.78rem; font-weight: 700; color: #15803d; text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 6px; }
    .ai-text { font-size: 0.85rem; color: #1e293b; line-height: 1.5; }
    .ai-note { font-size: 0.75rem; color: #64748b; margin-top: 6px; font-style: italic; }

    .ai-hint { display: flex; align-items: center; gap: 6px; font-size: 0.8rem; color: #64748b; margin-top: 12px; }
    .ai-extracting { display: flex; align-items: center; gap: 10px; font-size: 0.85rem; color: #64748b; margin-top: 12px; }

    .submit-btn { margin-top: 20px; --border-radius: 12px; font-weight: 700; }

    .success-view { display: flex; flex-direction: column; align-items: center; padding: 32px 16px; text-align: center; gap: 12px; }
    .success-icon { font-size: 3rem; }
    .success-title { font-size: 1.2rem; font-weight: 700; color: var(--ion-color-dark); }
    .success-sub { font-size: 0.9rem; color: var(--ion-color-medium); line-height: 1.5; max-width: 280px; }
  `]
})
export class ContributeModalComponent implements OnInit {
  @Input() productId!: string;
  @Input() userId!: string;
  @Input() accessToken!: string;

  CameraSource = CameraSource;

  step = 1;
  selectedField: ContribFieldConfig | null = null;
  availableFields = CONTRIB_FIELDS;

  lockedFields = new Set<ContribField>();
  userContribs: any[] = [];

  capturedBase64: string | null = null;
  capturedMime = 'image/jpeg';
  extractedText = '';
  rawText = '';
  extracting = false;
  submitting = false;

  constructor(
    private modal: ModalController,
    private loading: LoadingController,
    private toast: ToastController,
    private contribService: ContributionService,
  ) {}

  async ngOnInit() {
    const [locked, mine] = await Promise.all([
      this.contribService.getApprovedFields(this.productId),
      this.contribService.getUserContributions(this.productId, this.accessToken),
    ]);
    this.lockedFields = locked;
    this.userContribs = mine;
  }

  hasPending(field: ContribField): boolean {
    return this.userContribs.some(c => c.field === field && c.status === 'pending');
  }

  selectField(f: ContribFieldConfig) {
    this.selectedField = f;
    this.capturedBase64 = null;
    this.extractedText = '';
    this.rawText = '';
    this.step = 2;
  }

  async takePhoto(source: CameraSource) {
    try {
      const photo = await Camera.getPhoto({
        resultType: CameraResultType.Base64,
        source,
        quality: 85,
      });
      this.capturedBase64 = photo.base64String ?? null;
      this.capturedMime = `image/${photo.format ?? 'jpeg'}`;
    } catch {
      // user cancelled
    }
  }

  get canSubmit(): boolean {
    if (!this.selectedField) return false;
    if (this.selectedField.field === 'ingredients_text') return this.rawText.trim().length > 0;
    return !!this.capturedBase64;
  }

  async submit() {
    if (!this.selectedField || !this.canSubmit) return;
    this.submitting = true;
    const loader = await this.loading.create({ message: 'Uploading…', spinner: 'crescent' });
    await loader.present();

    try {
      let imageUrl: string | undefined;
      let extractedText: string | undefined;

      if (this.selectedField.field !== 'ingredients_text' && this.capturedBase64) {
        imageUrl = await this.contribService.uploadImage(
          this.productId, this.selectedField.field,
          this.capturedBase64, this.capturedMime,
        );

        // AI extraction for ingredient images
        if (this.selectedField.supportsAI && imageUrl) {
          loader.message = 'Extracting ingredients with AI…';
          this.extracting = true;
          try {
            extractedText = await this.contribService.extractIngredients(imageUrl);
            this.extractedText = extractedText;
          } catch {
            // non-fatal — submit without extraction
          }
          this.extracting = false;
        }
      }

      await this.contribService.submit({
        productId: this.productId,
        userId: this.userId,
        field: this.selectedField.field,
        imageUrl,
        extractedText,
        rawText: this.selectedField.field === 'ingredients_text' ? this.rawText.trim() : undefined,
      }, this.accessToken);

      await loader.dismiss();
      this.step = 3;
    } catch (err: any) {
      await loader.dismiss();
      const t = await this.toast.create({
        message: err?.message ?? 'Submission failed. Please try again.',
        duration: 3500,
        color: 'danger',
        position: 'bottom',
      });
      await t.present();
    } finally {
      this.submitting = false;
    }
  }

  dismiss() {
    this.modal.dismiss();
  }
}
