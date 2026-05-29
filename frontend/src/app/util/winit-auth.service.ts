import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Storage } from '@ionic/storage-angular';
import { Observable, from } from 'rxjs';

const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE';
const AUTH_BASE = `${SUPABASE_URL}/functions/v1/winit-auth`;

export interface WinitUser {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  display_name: string;
  avatar_url: string;
  points_balance: number;
  onboarding_completed: boolean;
  allergy_ids: string[];
  diet_ids: string[];
  condition_ids: string[];
}

export interface WinitSession {
  access_token: string;
  refresh_token: string;
  user: WinitUser;
}

@Injectable({ providedIn: 'root' })
export class WinitAuthService {
  static AccessToken = '';

  constructor(private storage: Storage) {}

  private get authHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${WinitAuthService.AccessToken}`,
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    };
  }

  private async call<T>(path: string, method: string, body?: unknown): Promise<T> {
    const res = await fetch(`${AUTH_BASE}/${path}`, {
      method,
      headers: this.authHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? `Request failed: ${res.status}`);
    return data as T;
  }

  async signup(firstName: string, lastName: string, email: string, password: string): Promise<WinitSession> {
    const session = await this.call<WinitSession>('signup', 'POST', {
      first_name: firstName,
      last_name: lastName,
      email,
      password,
    });
    await this.persistSession(session);
    return session;
  }

  async login(email: string, password: string): Promise<WinitSession> {
    const session = await this.call<WinitSession>('login', 'POST', { email, password });
    await this.persistSession(session);
    return session;
  }

  async resetPassword(email: string): Promise<void> {
    await this.call('reset-password', 'POST', { email });
  }

  async getProfile(): Promise<WinitUser> {
    return this.call<WinitUser>('profile', 'GET');
  }

  async updateProfile(data: Partial<WinitUser & { allergy_ids: string[]; diet_ids: string[]; condition_ids: string[] }>): Promise<void> {
    await this.call('profile', 'PUT', data);
  }

  async restoreSession(): Promise<WinitSession | null> {
    const token = await this.storage.get('winit_access_token');
    const refresh = await this.storage.get('winit_refresh_token');
    if (!token) return null;
    WinitAuthService.AccessToken = token;

    // Attempt to load profile; if expired, try refresh
    try {
      const user = await this.getProfile();
      const stored = await this.storage.get('winit_user');
      return { access_token: token, refresh_token: refresh, user: user ?? stored };
    } catch {
      if (!refresh) return null;
      try {
        const res = await fetch(`${AUTH_BASE}/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
          body: JSON.stringify({ refresh_token: refresh }),
        });
        if (!res.ok) return null;
        const data = await res.json();
        WinitAuthService.AccessToken = data.access_token;
        await this.storage.set('winit_access_token', data.access_token);
        await this.storage.set('winit_refresh_token', data.refresh_token);
        const user = await this.getProfile();
        return { access_token: data.access_token, refresh_token: data.refresh_token, user };
      } catch {
        return null;
      }
    }
  }

  async logout(): Promise<void> {
    WinitAuthService.AccessToken = '';
    await this.storage.remove('winit_access_token');
    await this.storage.remove('winit_refresh_token');
    await this.storage.remove('winit_user');
  }

  private async persistSession(session: WinitSession): Promise<void> {
    WinitAuthService.AccessToken = session.access_token;
    await this.storage.set('winit_access_token', session.access_token);
    await this.storage.set('winit_refresh_token', session.refresh_token);
    await this.storage.set('winit_user', session.user);
  }
}
