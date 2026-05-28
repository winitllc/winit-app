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
    // First look up the category id
    const catUrl = new URL(`${SUPABASE_URL}/rest/v1/app_categories`);
    catUrl.searchParams.set('slug', `eq.${categorySlug}`);
    catUrl.searchParams.set('select', 'id');
    const catRes = await fetch(catUrl.toString(), { headers: this.headers });
    const cats = await catRes.json() as { id: string }[];
    if (!cats.length) return { products: [], total: 0, page, pageSize };

    const categoryId = cats[0].id;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    // Get product IDs in this category
    const joinUrl = new URL(`${SUPABASE_URL}/rest/v1/product_categories`);
    joinUrl.searchParams.set('category_id', `eq.${categoryId}`);
    joinUrl.searchParams.set('select', 'product_id');
    const joinRes = await fetch(joinUrl.toString(), {
      headers: { ...this.headers, 'Prefer': 'count=exact', 'Range': `${from}-${to}` },
    });
    const total = parseInt((joinRes.headers.get('Content-Range') || '').split('/')[1] ?? '0', 10) || 0;
    const joins = await joinRes.json() as { product_id: string }[];
    if (!joins.length) return { products: [], total, page, pageSize };

    const productIds = joins.map(j => j.product_id);
    const idFilter = `(${productIds.map(id => `id.eq.${id}`).join(',')})`;

    const prodUrl = new URL(`${SUPABASE_URL}/rest/v1/products`);
    prodUrl.searchParams.set('or', idFilter);
    prodUrl.searchParams.set('status', 'eq.approved');
    prodUrl.searchParams.set('select', '*');
    const prodRes = await fetch(prodUrl.toString(), { headers: this.headers });
    if (!prodRes.ok) throw new Error(`getProductsByCategory failed: ${prodRes.status}`);
    const products: SupabaseProduct[] = await prodRes.json();

    return { products, total, page, pageSize };
  }

  async searchProducts(query: string, page = 0, pageSize = 24): Promise<SupabaseProductPage> {
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const url = new URL(`${SUPABASE_URL}/rest/v1/products`);
    if (query.trim()) {
      url.searchParams.set('or', `(name.ilike.*${query}*,brand.ilike.*${query}*,barcode.ilike.*${query}*,ingredients_text.ilike.*${query}*)`);
    }
    url.searchParams.set('status', 'eq.approved');
    url.searchParams.set('order', 'name.asc');
    url.searchParams.set('select', '*');

    const res = await fetch(url.toString(), {
      headers: { ...this.headers, 'Prefer': 'count=exact', 'Range': `${from}-${to}` },
    });
    if (!res.ok) throw new Error(`searchProducts failed: ${res.status}`);

    const total = parseInt((res.headers.get('Content-Range') || '').split('/')[1] ?? '0', 10) || 0;
    const products: SupabaseProduct[] = await res.json();
    return { products, total, page, pageSize };
  }

  async getProductByBarcode(barcode: string): Promise<SupabaseProduct | null> {
    const url = new URL(`${SUPABASE_URL}/rest/v1/products`);
    url.searchParams.set('barcode', `eq.${barcode}`);
    url.searchParams.set('select', '*');
    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) return null;
    const rows: SupabaseProduct[] = await res.json();
    return rows[0] ?? null;
  }

  async getProductById(id: string): Promise<SupabaseProduct | null> {
    const url = new URL(`${SUPABASE_URL}/rest/v1/products`);
    url.searchParams.set('id', `eq.${id}`);
    url.searchParams.set('select', '*');
    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) return null;
    const rows: SupabaseProduct[] = await res.json();
    return rows[0] ?? null;
  }
}
