import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

export type ProductStatus = 'pending' | 'approved' | 'rejected';

export interface Product {
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
  status: ProductStatus;
  health_rating: number | null;
  ai_insights: string;
  admin_notes: string;
  off_id: string;
  approved_at: string | null;
  approved_by: string;
  created_at: string;
  updated_at: string;
}

export interface AppCategory {
  id: string;
  slug: string;
  display_name: string;
  image_url: string;
  sort_order: number;
  off_tag: string;
}

export interface ImportJob {
  id: string;
  category_slug: string;
  off_tag: string;
  pages_imported: number;
  products_upserted: number;
  status: 'running' | 'completed' | 'failed';
  error_message: string;
  started_at: string;
  completed_at: string | null;
}

export interface ProductListResult {
  products: Product[];
  total: number;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private readonly url = environment.supabaseUrl;
  private readonly key = environment.supabaseAnonKey;

  private get headers(): HeadersInit {
    return {
      'apikey': this.key,
      'Authorization': `Bearer ${this.key}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    };
  }

  private async get<T>(path: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.url}/rest/v1/${path}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    const res = await fetch(url.toString(), { headers: this.headers });
    if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
    return res.json();
  }

  private async patch<T>(path: string, body: Partial<T>, filter: string): Promise<T[]> {
    const url = `${this.url}/rest/v1/${path}?${filter}`;
    const res = await fetch(url, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`PATCH ${path} failed: ${res.status}`);
    return res.json();
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    const url = `${this.url}/rest/v1/${path}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
    return res.json();
  }

  async getProducts(opts: {
    status?: ProductStatus;
    search?: string;
    category?: string;
    page?: number;
    pageSize?: number;
  }): Promise<ProductListResult> {
    const { status, search, page = 0, pageSize = 25 } = opts;
    const from = page * pageSize;
    const to = from + pageSize - 1;

    const headers: HeadersInit = {
      ...this.headers,
      'Range': `${from}-${to}`,
      'Prefer': 'count=exact',
    };

    const url = new URL(`${this.url}/rest/v1/products`);
    if (status) url.searchParams.set('status', `eq.${status}`);
    if (search) {
      url.searchParams.set('or', `(name.ilike.*${search}*,brand.ilike.*${search}*,barcode.ilike.*${search}*)`);
    }
    url.searchParams.set('order', 'created_at.desc');
    url.searchParams.set('select', '*');

    const res = await fetch(url.toString(), { headers });
    if (!res.ok) throw new Error(`getProducts failed: ${res.status}`);

    const contentRange = res.headers.get('Content-Range') || '';
    const total = parseInt(contentRange.split('/')[1] ?? '0', 10) || 0;
    const products: Product[] = await res.json();
    return { products, total };
  }

  async getProduct(id: string): Promise<Product> {
    const results = await this.get<Product[]>('products', { id: `eq.${id}`, select: '*' });
    if (!results?.length) throw new Error(`Product ${id} not found`);
    return results[0];
  }

  async updateProduct(id: string, data: Partial<Product>): Promise<Product> {
    const results = await this.patch<Product>('products', data, `id=eq.${id}`);
    if (!results?.length) throw new Error(`Product ${id} not found after update`);
    return results[0];
  }

  async approveProduct(id: string): Promise<void> {
    await this.patch('products', { status: 'approved', approved_at: new Date().toISOString() }, `id=eq.${id}`);
  }

  async rejectProduct(id: string): Promise<void> {
    await this.patch('products', { status: 'rejected' }, `id=eq.${id}`);
  }

  async getCategories(): Promise<AppCategory[]> {
    return this.get<AppCategory[]>('app_categories', { order: 'sort_order.asc', select: '*' });
  }

  async getProductCategories(productId: string): Promise<string[]> {
    const rows = await this.get<{ category_id: string }[]>('product_categories', {
      product_id: `eq.${productId}`,
      select: 'category_id',
    });
    return rows.map(r => r.category_id);
  }

  async setProductCategories(productId: string, categoryIds: string[]): Promise<void> {
    // Delete existing, then insert new
    await fetch(`${this.url}/rest/v1/product_categories?product_id=eq.${productId}`, {
      method: 'DELETE',
      headers: this.headers,
    });
    if (categoryIds.length) {
      const rows = categoryIds.map(cid => ({ product_id: productId, category_id: cid }));
      await this.post('product_categories', rows);
    }
  }

  async getImportJobs(): Promise<ImportJob[]> {
    return this.get<ImportJob[]>('import_jobs', { order: 'started_at.desc', select: '*' });
  }

  async triggerImport(categorySlug: string, offTag: string, maxPages = 10): Promise<{ job_id: string; products_upserted: number }> {
    const res = await fetch(`${this.url}/functions/v1/import-products`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ category_slug: categorySlug, off_tag: offTag, max_pages: maxPages }),
    });
    if (!res.ok) throw new Error(`Import trigger failed: ${res.status}`);
    return res.json();
  }

  async getProductStats(): Promise<{ pending: number; approved: number; rejected: number; total: number }> {
    const [pending, approved, rejected] = await Promise.all([
      fetch(`${this.url}/rest/v1/products?status=eq.pending&select=id`, { headers: { ...this.headers, 'Prefer': 'count=exact', 'Range': '0-0' } }),
      fetch(`${this.url}/rest/v1/products?status=eq.approved&select=id`, { headers: { ...this.headers, 'Prefer': 'count=exact', 'Range': '0-0' } }),
      fetch(`${this.url}/rest/v1/products?status=eq.rejected&select=id`, { headers: { ...this.headers, 'Prefer': 'count=exact', 'Range': '0-0' } }),
    ]);
    const parse = (h: Headers) => parseInt((h.get('Content-Range') || '').split('/')[1] ?? '0', 10) || 0;
    const p = parse(pending.headers);
    const a = parse(approved.headers);
    const r = parse(rejected.headers);
    return { pending: p, approved: a, rejected: r, total: p + a + r };
  }
}
