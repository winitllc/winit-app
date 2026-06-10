import { Injectable } from '@angular/core';

const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE';

export interface SupabaseProduct {
  id: string;
  barcode: string;
  name: string;
  brand: string;
  quantity: string;
  generic_name: string;
  image_front_url: string;
  image_ingredients_url: string;
  image_nutrition_url: string;
  ingredients_text: string;
  nutrition: Record<string, number | null>;
  allergen_tags: string[];
  diet_tags: string[];
  label_tags: string[];
  custom_tags: string[];
  off_categories_tags: string[];
  nutriscore_grade: string;
  nova_group: number | null;
  status: string;
  health_rating: number | null;
  ai_insights: string;
  off_id: string;
}

export interface SupabaseProductPage {
  products: SupabaseProduct[];
  total: number;
  page: number;
  pageSize: number;
}

export interface SupabaseCategory {
  id: string;
  slug: string;
  display_name: string;
  image_url: string;
  sort_order: number;
  off_tag: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseProductService {
  private readonly headers: Record<string, string> = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };

  async getCategories(): Promise<SupabaseCategory[]> {
    const url = new URL(`${SUPABASE_URL}/rest/v1/app_categories`);
    url.searchParams.set('order', 'sort_order.asc');
    url.searchParams.set('select', '*');
    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`getCategories failed: ${res.status}`);
    return res.json();
  }

  async getProductsByCategory(categorySlug: string, page = 0, pageSize = 24): Promise<SupabaseProductPage> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/get_products_by_category`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ p_slug: categorySlug, p_page: page, p_page_size: pageSize }),
    });
    if (!res.ok) throw new Error(`getProductsByCategory failed: ${res.status}`);
    const raw = await res.json();
    const data = (Array.isArray(raw) ? raw[0] : raw) as SupabaseProductPage | null;
    return {
      products: data?.products ?? [],
      total: data?.total ?? 0,
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
    };
  }

  async searchProducts(query: string, page = 0, pageSize = 24): Promise<SupabaseProductPage> {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/search_app_products`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ p_query: query.trim(), p_page: page, p_page_size: pageSize }),
    });
    if (!res.ok) throw new Error(`searchProducts failed: ${res.status}`);
    const raw = await res.json();
    const data = (Array.isArray(raw) ? raw[0] : raw) as SupabaseProductPage | null;
    return {
      products: data?.products ?? [],
      total: data?.total ?? 0,
      page: data?.page ?? page,
      pageSize: data?.pageSize ?? pageSize,
    };
  }

  async getProductByBarcode(barcode: string): Promise<SupabaseProduct | null> {
    const url = new URL(`${SUPABASE_URL}/rest/v1/products_app_visible`);
    url.searchParams.set('barcode', `eq.${barcode}`);
    url.searchParams.set('select', '*');
    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) return null;
    const rows: SupabaseProduct[] = await res.json();
    return rows[0] ?? null;
  }

  async getProductById(id: string): Promise<SupabaseProduct | null> {
    const url = new URL(`${SUPABASE_URL}/rest/v1/products_app_visible`);
    url.searchParams.set('id', `eq.${id}`);
    url.searchParams.set('select', '*');
    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) return null;
    const rows: SupabaseProduct[] = await res.json();
    return rows[0] ?? null;
  }
}
