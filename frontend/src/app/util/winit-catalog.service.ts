import { Injectable } from '@angular/core';

const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE';

export interface CatalogItem {
  id: string;
  category_id: string;
  label: string;
  keywords: string[];
  description: string;
  sort_order: number;
}

export interface CatalogCategory {
  id: string;
  label: string;
  icon: string;
  sort_order: number;
  items: CatalogItem[];
}

@Injectable({ providedIn: 'root' })
export class WinitCatalogService {
  private allergiesCache: CatalogCategory[] | null = null;
  private dietsCache: CatalogCategory[] | null = null;
  private conditionsCache: CatalogCategory[] | null = null;

  async getAllergies(): Promise<CatalogCategory[]> {
    if (this.allergiesCache) return this.allergiesCache;
    this.allergiesCache = await this.fetchCatalog('winit_allergy_categories', 'winit_allergies');
    return this.allergiesCache;
  }

  async getDiets(): Promise<CatalogCategory[]> {
    if (this.dietsCache) return this.dietsCache;
    this.dietsCache = await this.fetchCatalog('winit_diet_categories', 'winit_diets');
    return this.dietsCache;
  }

  async getConditions(): Promise<CatalogCategory[]> {
    if (this.conditionsCache) return this.conditionsCache;
    this.conditionsCache = await this.fetchCatalog('winit_condition_categories', 'winit_conditions');
    return this.conditionsCache;
  }

  /** Find a label for a given item ID across all catalogs */
  async getLabelForId(id: string, type: 'allergy' | 'diet' | 'condition'): Promise<string> {
    const cats = type === 'allergy'
      ? await this.getAllergies()
      : type === 'diet'
        ? await this.getDiets()
        : await this.getConditions();
    for (const cat of cats) {
      const item = cat.items.find(i => i.id === id);
      if (item) return item.label;
    }
    return id;
  }

  /** Get all keywords for a list of item IDs */
  async getKeywordsForIds(ids: string[], type: 'allergy' | 'diet' | 'condition'): Promise<string[]> {
    const cats = type === 'allergy'
      ? await this.getAllergies()
      : type === 'diet'
        ? await this.getDiets()
        : await this.getConditions();
    const keywords: string[] = [];
    for (const cat of cats) {
      for (const item of cat.items) {
        if (ids.includes(item.id)) {
          keywords.push(...item.keywords);
        }
      }
    }
    return [...new Set(keywords)];
  }

  private async fetchCatalog(catTable: string, itemTable: string): Promise<CatalogCategory[]> {
    const headers = { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` };
    const base = `${SUPABASE_URL}/rest/v1`;

    const [catsRes, itemsRes] = await Promise.all([
      fetch(`${base}/${catTable}?select=*&order=sort_order`, { headers }),
      fetch(`${base}/${itemTable}?select=*&order=sort_order`, { headers }),
    ]);

    const cats: any[] = await catsRes.json();
    const items: any[] = await itemsRes.json();

    return cats.map(cat => ({
      ...cat,
      items: items.filter(i => i.category_id === cat.id),
    }));
  }
}
