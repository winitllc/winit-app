import { Component, OnInit } from '@angular/core';
import { NavController } from '@ionic/angular';
import { CoachingService, Professional } from '../util/coaching.service';

@Component({
  selector: 'app-coaches',
  templateUrl: 'coaches.page.html',
  styleUrls: ['coaches.page.scss'],
})
export class CoachesPage implements OnInit {
  professionals: Professional[] = [];
  loading = true;
  error = false;

  readonly specialtyColors: Record<string, string> = {
    'Gluten-Free': '#10b981',
    'Dairy-Free': '#3b82f6',
    'Vegan': '#6b7280',
    'Vegetarian': '#22c55e',
    'Keto': '#f59e0b',
    'Paleo': '#ef4444',
    'Low-FODMAP': '#8b5cf6',
    'Nut-Free': '#f97316',
    'Diabetic-Friendly': '#06b6d4',
    'Heart-Healthy': '#ec4899',
  };

  constructor(
    private coaching: CoachingService,
    private navCtrl: NavController,
  ) {}

  async ngOnInit() {
    try {
      this.professionals = await this.coaching.getProfessionals();
    } catch {
      this.error = true;
    } finally {
      this.loading = false;
    }
  }

  specialtyColor(s: string): string {
    return this.specialtyColors[s] ?? '#64748b';
  }

  initials(name: string): string {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  }

  viewPlans(pro: Professional) {
    this.navCtrl.navigateForward('tabs/meal-plans', { state: { professional: pro } });
  }
}
