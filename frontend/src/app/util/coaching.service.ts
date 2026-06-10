import { Injectable } from '@angular/core';

const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE';

export interface Professional {
  id: string;
  name: string;
  slug: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  specialties: string[];
  email: string | null;
  website_url: string | null;
  created_at: string;
  meal_plan_count: number;
}

export interface MealPlan {
  id: string;
  professional_id: string;
  name: string;
  description: string;
  is_public: boolean;
  share_token: string;
  created_at: string;
}

export interface MealPlanDay {
  id: string;
  day_number: number;
  label: string;
  sort_order: number;
  meals: MealSection[];
}

export interface MealSection {
  id: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  sort_order: number;
  foods: MealFood[];
}

export interface MealFood {
  id: string;
  name: string;
  notes: string;
  sort_order: number;
}

@Injectable({ providedIn: 'root' })
export class CoachingService {
  private readonly headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  async getProfessionals(): Promise<Professional[]> {
    const url = new URL(`${SUPABASE_URL}/rest/v1/professionals`);
    url.searchParams.set('select', '*,meal_plans(count)');
    url.searchParams.set('status', 'eq.approved');
    url.searchParams.set('order', 'name.asc');
    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`getProfessionals failed: ${res.status}`);
    const rows: any[] = await res.json();
    return rows.map(r => ({
      ...r,
      meal_plan_count: Array.isArray(r['meal_plans']) ? (r['meal_plans'][0]?.count ?? 0) : 0,
    }));
  }

  async getMealPlans(professionalId: string): Promise<MealPlan[]> {
    const url = new URL(`${SUPABASE_URL}/rest/v1/meal_plans`);
    url.searchParams.set('professional_id', `eq.${professionalId}`);
    url.searchParams.set('is_public', 'eq.true');
    url.searchParams.set('order', 'created_at.desc');
    url.searchParams.set('select', '*');
    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`getMealPlans failed: ${res.status}`);
    return res.json();
  }

  async getMealPlanDays(mealPlanId: string): Promise<MealPlanDay[]> {
    const daysUrl = new URL(`${SUPABASE_URL}/rest/v1/meal_plan_days`);
    daysUrl.searchParams.set('meal_plan_id', `eq.${mealPlanId}`);
    daysUrl.searchParams.set('order', 'sort_order.asc');
    daysUrl.searchParams.set('select', '*');
    const daysRes = await fetch(daysUrl.toString(), { headers: this.headers });
    if (!daysRes.ok) throw new Error('getMealPlanDays failed');
    const days = await daysRes.json();

    const mealsUrl = new URL(`${SUPABASE_URL}/rest/v1/meals`);
    mealsUrl.searchParams.set('day_id', `in.(${days.map((d: any) => d.id).join(',')})`);
    mealsUrl.searchParams.set('order', 'sort_order.asc');
    mealsUrl.searchParams.set('select', '*');
    const mealsRes = await fetch(mealsUrl.toString(), { headers: this.headers });
    const meals = mealsRes.ok ? await mealsRes.json() : [];

    const foodsUrl = new URL(`${SUPABASE_URL}/rest/v1/meal_foods`);
    foodsUrl.searchParams.set('meal_id', `in.(${meals.map((m: any) => m.id).join(',')})`);
    foodsUrl.searchParams.set('order', 'sort_order.asc');
    foodsUrl.searchParams.set('select', '*');
    const foodsRes = await fetch(foodsUrl.toString(), { headers: this.headers });
    const foods = foodsRes.ok ? await foodsRes.json() : [];

    return days.map((day: any) => ({
      ...day,
      meals: meals
        .filter((m: any) => m.day_id === day.id)
        .map((meal: any) => ({
          ...meal,
          foods: foods.filter((f: any) => f.meal_id === meal.id),
        })),
    }));
  }
}
