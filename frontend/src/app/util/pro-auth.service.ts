import { Injectable } from '@angular/core';
import { Storage } from '@ionic/storage-angular';

const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE';
const PRO_AUTH_BASE = `${SUPABASE_URL}/functions/v1/pro-auth`;

export interface ProProfile {
  id: string;
  auth_user_id: string;
  email: string;
  name: string;
  title: string | null;
  bio: string | null;
  specialties: string[];
  certifications: string[];
  website: string | null;
  photo_url: string | null;
  slug: string;
  status: 'pending' | 'approved' | 'blocked';
  created_at: string;
  stats?: ProStats;
}

export interface ProStats {
  meal_plan_count: number;
  invite_count: number;
  conversion_count: number;
  active_count: number;
}

export interface ProSession {
  access_token: string;
  refresh_token: string;
  professional: ProProfile;
}

export interface ProMealPlan {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ProAuthService {
  static AccessToken = '';

  constructor(private storage: Storage) {}

  private get authHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${ProAuthService.AccessToken}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };
  }

  private async call<T>(path: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(`${PRO_AUTH_BASE}/${path}`, {
      method,
      headers: this.authHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
    return data as T;
  }

  async signup(params: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    title?: string;
    bio?: string;
    specialties?: string[];
  }): Promise<ProSession> {
    const session = await this.call<ProSession>('signup', 'POST', params);
    await this.persistSession(session);
    return session;
  }

  async login(email: string, password: string): Promise<ProSession> {
    const session = await this.call<ProSession>('login', 'POST', { email, password });
    await this.persistSession(session);
    return session;
  }

  async getProfile(): Promise<ProProfile> {
    return this.call<ProProfile>('profile', 'GET');
  }

  async updateProfile(data: Partial<ProProfile>): Promise<ProProfile> {
    return this.call<ProProfile>('profile', 'PUT', data);
  }

  async getPublicProfile(slug: string): Promise<ProProfile & { meal_plans: ProMealPlan[] }> {
    const res = await fetch(`${PRO_AUTH_BASE}/public/${slug}`, {
      headers: { 'apikey': SUPABASE_ANON_KEY },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? 'Not found');
    return data;
  }

  async restoreSession(): Promise<ProSession | null> {
    const token = await this.storage.get('pro_access_token');
    const refresh = await this.storage.get('pro_refresh_token');
    if (!token) return null;
    ProAuthService.AccessToken = token;
    try {
      const professional = await this.getProfile();
      return { access_token: token, refresh_token: refresh, professional };
    } catch {
      if (!refresh) return null;
      try {
        const res = await fetch(`${PRO_AUTH_BASE}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
          body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        ProAuthService.AccessToken = data.access_token;
        await this.storage.set('pro_access_token', data.access_token);
        await this.storage.set('pro_refresh_token', data.refresh_token);
        const professional = await this.getProfile();
        return { access_token: data.access_token, refresh_token: data.refresh_token, professional };
      } catch {
        return null;
      }
    }
  }

  async logout(): Promise<void> {
    ProAuthService.AccessToken = '';
    await this.storage.remove('pro_access_token');
    await this.storage.remove('pro_refresh_token');
  }

  private async persistSession(session: ProSession): Promise<void> {
    ProAuthService.AccessToken = session.access_token;
    await this.storage.set('pro_access_token', session.access_token);
    await this.storage.set('pro_refresh_token', session.refresh_token);
  }

  async getMealPlans(proId: string): Promise<ProMealPlan[]> {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/meal_plans?professional_id=eq.${proId}&order=created_at.desc`,
      { headers: { ...this.authHeaders, 'apikey': SUPABASE_ANON_KEY } }
    );
    if (!res.ok) return [];
    return res.json();
  }

  async createMealPlan(proId: string, name: string, description?: string): Promise<ProMealPlan> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/meal_plans`, {
      method: 'POST',
      headers: {
        ...this.authHeaders,
        'apikey': SUPABASE_ANON_KEY,
        'Prefer': 'return=representation',
      },
      body: JSON.stringify({ professional_id: proId, name, description: description ?? null, is_public: false }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message ?? 'Failed to create meal plan');
    return Array.isArray(data) ? data[0] : data;
  }

  async deleteMealPlan(planId: string): Promise<void> {
    await fetch(`${SUPABASE_URL}/rest/v1/meal_plans?id=eq.${planId}`, {
      method: 'DELETE',
      headers: { ...this.authHeaders, 'apikey': SUPABASE_ANON_KEY },
    });
  }

  async toggleMealPlanVisibility(planId: string, isPublic: boolean): Promise<void> {
    await fetch(`${SUPABASE_URL}/rest/v1/meal_plans?id=eq.${planId}`, {
      method: 'PATCH',
      headers: {
        ...this.authHeaders,
        'apikey': SUPABASE_ANON_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ is_public: isPublic }),
    });
  }

  buildShareUrl(slug: string, planId?: string): string {
    const base = `https://winit.com/pro/${slug}`;
    return planId ? `${base}?plan=${planId}` : base;
  }
}
