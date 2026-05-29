import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { model } from 'wuzinit-common';
import { AllergiesService } from '../util/allergies.service';
import { DietsService } from '../util/diets.service';
import { MedicalConditionsService } from '../util/medicalConditions.service';
import { ProfileSetupService } from '../util/profile-setup.service';

type Step = 'allergies' | 'diets' | 'conditions' | 'done';

@Component({
  selector: 'app-profile-setup-modal',
  templateUrl: './profile-setup-modal.component.html',
  styleUrls: ['./profile-setup-modal.component.scss'],
})
export class ProfileSetupModalComponent implements OnInit {
  step: Step = 'allergies';

  allergies: model.Allergy[] = [];
  diets: model.Lifestyle[] = [];
  conditions: model.Medical[] = [];

  selectedAllergies: Set<string> = new Set();
  selectedDiets: Set<string> = new Set();
  selectedConditions: Set<string> = new Set();

  loading = true;

  readonly steps: Step[] = ['allergies', 'diets', 'conditions'];
  readonly stepLabels: Record<Step, string> = {
    allergies: 'Allergies',
    diets: 'Diets',
    conditions: 'Medical',
    done: 'Done',
  };

  constructor(
    private modalCtrl: ModalController,
    private allergiesService: AllergiesService,
    private dietsService: DietsService,
    private conditionsService: MedicalConditionsService,
    private setupService: ProfileSetupService,
  ) {}

  async ngOnInit(): Promise<void> {
    const [allergies, diets, conditions] = await Promise.all([
      this.allergiesService.getAllAllergies(),
      this.dietsService.getAllLifestyleDiets(),
      this.conditionsService.getAllMedicalConditions(),
    ]);
    this.allergies = allergies;
    this.diets = diets;
    this.conditions = conditions;
    this.loading = false;
  }

  get currentIndex(): number {
    return this.steps.indexOf(this.step as Step);
  }

  get stepTitle(): string {
    const titles: Record<Step, string> = {
      allergies: 'Do you have any allergies?',
      diets: 'Do you follow any diets?',
      conditions: 'Any medical conditions?',
      done: 'You\'re all set!',
    };
    return titles[this.step];
  }

  get stepSubtitle(): string {
    const subs: Record<Step, string> = {
      allergies: 'Select everything that applies. This helps us flag ingredients that could harm you.',
      diets: 'We\'ll filter products to match what you eat.',
      conditions: 'We\'ll highlight ingredients to watch out for.',
      done: '',
    };
    return subs[this.step];
  }

  get currentItems(): { id: string; name: string; commonName?: string }[] {
    if (this.step === 'allergies') return this.allergies.map(a => ({ id: a.id, name: a.name, commonName: a.commonName }));
    if (this.step === 'diets') return this.diets.map(d => ({ id: d.id, name: d.name, commonName: d.commonName }));
    if (this.step === 'conditions') return this.conditions.map(c => ({ id: c.id, name: c.name, commonName: c.commonName }));
    return [];
  }

  get currentSelection(): Set<string> {
    if (this.step === 'allergies') return this.selectedAllergies;
    if (this.step === 'diets') return this.selectedDiets;
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

  next(): void {
    const idx = this.steps.indexOf(this.step as Step);
    if (idx < this.steps.length - 1) {
      this.step = this.steps[idx + 1];
    } else {
      this.finish();
    }
  }

  back(): void {
    const idx = this.steps.indexOf(this.step as Step);
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
      allergies: Array.from(this.selectedAllergies),
      diets: Array.from(this.selectedDiets),
      conditions: Array.from(this.selectedConditions),
    });
  }
}
