import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ProfileSetupService } from '../util/profile-setup.service';
import { WinitCatalogService, CatalogCategory } from '../util/winit-catalog.service';

type Step = 'allergies' | 'diets' | 'conditions';

@Component({
  selector: 'app-profile-setup-modal',
  templateUrl: './profile-setup-modal.component.html',
  styleUrls: ['./profile-setup-modal.component.scss'],
})
export class ProfileSetupModalComponent implements OnInit {
  step: Step = 'allergies';

  allergyCategories: CatalogCategory[] = [];
  dietCategories: CatalogCategory[] = [];
  conditionCategories: CatalogCategory[] = [];

  selectedAllergies: Set<string> = new Set();
  selectedDiets: Set<string> = new Set();
  selectedConditions: Set<string> = new Set();

  loading = true;

  readonly steps: Step[] = ['allergies', 'diets', 'conditions'];

  constructor(
    private modalCtrl: ModalController,
    private catalog: WinitCatalogService,
    private setupService: ProfileSetupService,
  ) {}

  async ngOnInit(): Promise<void> {
    const [allergies, diets, conditions] = await Promise.all([
      this.catalog.getAllergies(),
      this.catalog.getDiets(),
      this.catalog.getConditions(),
    ]);
    this.allergyCategories = allergies;
    this.dietCategories = diets;
    this.conditionCategories = conditions;
    this.loading = false;
  }

  get currentIndex(): number {
    return this.steps.indexOf(this.step);
  }

  get stepTitle(): string {
    return {
      allergies:  'Do you have any allergies?',
      diets:      'Do you follow any diets?',
      conditions: 'Any medical conditions?',
    }[this.step];
  }

  get stepSubtitle(): string {
    return {
      allergies:  'Select everything that applies. We\'ll flag ingredients that could harm you.',
      diets:      'We\'ll filter products to match what you eat.',
      conditions: 'We\'ll highlight ingredients to watch out for.',
    }[this.step];
  }

  get currentCategories(): CatalogCategory[] {
    if (this.step === 'allergies')  return this.allergyCategories;
    if (this.step === 'diets')      return this.dietCategories;
    if (this.step === 'conditions') return this.conditionCategories;
    return [];
  }

  get currentSelection(): Set<string> {
    if (this.step === 'allergies')  return this.selectedAllergies;
    if (this.step === 'diets')      return this.selectedDiets;
    if (this.step === 'conditions') return this.selectedConditions;
    return new Set();
  }

  toggle(id: string): void {
    const set = this.currentSelection;
    if (set.has(id)) set.delete(id); else set.add(id);
  }

  isSelected(id: string): boolean {
    return this.currentSelection.has(id);
  }

  isCategoryFullySelected(cat: CatalogCategory): boolean {
    return cat.items.length > 0 && cat.items.every(i => this.currentSelection.has(i.id));
  }

  toggleCategory(cat: CatalogCategory): void {
    const set = this.currentSelection;
    if (this.isCategoryFullySelected(cat)) {
      cat.items.forEach(i => set.delete(i.id));
    } else {
      cat.items.forEach(i => set.add(i.id));
    }
  }

  get totalSelected(): number {
    return this.selectedAllergies.size + this.selectedDiets.size + this.selectedConditions.size;
  }

  next(): void {
    const idx = this.steps.indexOf(this.step);
    if (idx < this.steps.length - 1) {
      this.step = this.steps[idx + 1];
    } else {
      this.finish();
    }
  }

  back(): void {
    const idx = this.steps.indexOf(this.step);
    if (idx > 0) this.step = this.steps[idx - 1];
  }

  async skip(): Promise<void> {
    await this.setupService.markDismissed();
    this.modalCtrl.dismiss({ skipped: true });
  }

  private async finish(): Promise<void> {
    await this.setupService.markDismissed();
    this.modalCtrl.dismiss({
      skipped: false,
      allergies:  Array.from(this.selectedAllergies),
      diets:      Array.from(this.selectedDiets),
      conditions: Array.from(this.selectedConditions),
    });
  }
}
