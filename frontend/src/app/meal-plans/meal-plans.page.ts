import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CoachingService, Professional, MealPlan, MealPlanDay } from '../util/coaching.service';

const MEAL_LABELS: Record<string, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snacks',
};

const MEAL_ICONS: Record<string, string> = {
  breakfast: '🌅',
  lunch: '☀️',
  dinner: '🌙',
  snack: '🍎',
};

@Component({
  selector: 'app-meal-plans',
  templateUrl: 'meal-plans.page.html',
  styleUrls: ['meal-plans.page.scss'],
})
export class MealPlansPage implements OnInit {
  professional: Professional | null = null;
  plans: MealPlan[] = [];
  selectedPlan: MealPlan | null = null;
  days: MealPlanDay[] = [];
  expandedDayId: string | null = null;

  loadingPlans = true;
  loadingDays = false;
  errorPlans = false;

  readonly mealLabels = MEAL_LABELS;
  readonly mealIcons = MEAL_ICONS;

  constructor(
    private coaching: CoachingService,
    private router: Router,
  ) {}

  async ngOnInit() {
    const nav = this.router.getCurrentNavigation();
    const state = nav?.extras?.state as { professional?: Professional } | undefined;
    this.professional = state?.professional ?? null;

    if (!this.professional) {
      this.loadingPlans = false;
      this.errorPlans = true;
      return;
    }

    try {
      this.plans = await this.coaching.getMealPlans(this.professional.id);
      if (this.plans.length > 0) {
        await this.selectPlan(this.plans[0]);
      }
    } catch {
      this.errorPlans = true;
    } finally {
      this.loadingPlans = false;
    }
  }

  async selectPlan(plan: MealPlan) {
    this.selectedPlan = plan;
    this.days = [];
    this.expandedDayId = null;
    this.loadingDays = true;
    try {
      this.days = await this.coaching.getMealPlanDays(plan.id);
      if (this.days.length > 0) this.expandedDayId = this.days[0].id;
    } finally {
      this.loadingDays = false;
    }
  }

  toggleDay(dayId: string) {
    this.expandedDayId = this.expandedDayId === dayId ? null : dayId;
  }

  foodCount(day: MealPlanDay): number {
    return day.meals.reduce((sum, m) => sum + m.foods.length, 0);
  }
}
