import { Injectable } from '@angular/core';

const SUPABASE_URL = 'https://twosrdqyaxhdfyqgefjm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR3b3NyZHF5YXhoZGZ5cWdlZmptIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAwMDQzMDksImV4cCI6MjA5NTU4MDMwOX0.qJ8ZQaMobmuL29-A3swShTbF-D7SVf1oUK9LU7vO7RE';

export type ContribField = 'image_front' | 'image_ingredients' | 'image_nutrition' | 'image_barcode' | 'ingredients_text';
export type ContribStatus = 'pending' | 'approved' | 'rejected';

export interface Contribution {
  id: string;
  product_id: string;
  user_id: string;
  field: ContribField;
  image_url: string | null;
  extracted_text: string | null;
  raw_text: string | null;
  status: ContribStatus;
  admin_notes: string;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class ContributionService {
  private readonly base = `${SUPABASE_URL}/rest/v1`;
  private readonly fnBase = `${SUPABASE_URL}/functions/v1`;

  private headers(accessToken: string): Record<string, string> {
    return {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    };
  }

  /** Get existing approved contributions for a product so we know which fields are locked */
  async getApprovedFields(productId: string): Promise<Set<ContribField>> {
    const res = await fetch(
      `${this.base}/product_contributions?product_id=eq.${productId}&status=eq.approved&select=field`,
      { headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );
    if (!res.ok) return new Set();
    const rows: { field: ContribField }[] = await res.json();
    return new Set(rows.map(r => r.field));
  }

  /** Get user's own pending/rejected submissions for a product */
  async getUserContributions(productId: string, accessToken: string): Promise<Contribution[]> {
    const res = await fetch(
      `${this.base}/product_contributions?product_id=eq.${productId}&select=*`,
      { headers: this.headers(accessToken) }
    );
    if (!res.ok) return [];
    return res.json();
  }

  /** Upload a base64 image via Supabase Storage (public bucket) */
  async uploadImage(
    productId: string,
    field: ContribField,
    base64Data: string,
    mimeType: string,
  ): Promise<string> {
    const ext = mimeType.split('/')[1] ?? 'jpg';
    const path = `contributions/${productId}/${field}_${Date.now()}.${ext}`;
    const blob = this.base64ToBlob(base64Data, mimeType);

    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/product-images/${path}`, {
      method: 'POST',
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        'Content-Type': mimeType,
        'x-upsert': 'true',
      },
      body: blob,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Image upload failed: ${err}`);
    }
    return `${SUPABASE_URL}/storage/v1/object/public/product-images/${path}`;
  }

  /** Ask the AI edge function to extract ingredient text from an image URL */
  async extractIngredients(imageUrl: string): Promise<string> {
    const res = await fetch(`${this.fnBase}/extract-ingredients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ image_url: imageUrl }),
    });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error ?? 'Extraction failed');
    return data.extracted_text ?? '';
  }

  /** Submit a contribution record */
  async submit(payload: {
    productId: string;
    userId: string;
    field: ContribField;
    imageUrl?: string;
    extractedText?: string;
    rawText?: string;
  }, accessToken: string): Promise<Contribution> {
    const body = {
      product_id: payload.productId,
      user_id: payload.userId,
      field: payload.field,
      image_url: payload.imageUrl ?? null,
      extracted_text: payload.extractedText ?? null,
      raw_text: payload.rawText ?? null,
      status: 'pending',
    };
    const res = await fetch(`${this.base}/product_contributions`, {
      method: 'POST',
      headers: this.headers(accessToken),
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Submit failed: ${err}`);
    }
    const rows: Contribution[] = await res.json();
    return rows[0];
  }

  private base64ToBlob(base64: string, mimeType: string): Blob {
    // Strip data URL prefix if present
    const data = base64.includes(',') ? base64.split(',')[1] : base64;
    const bytes = atob(data);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mimeType });
  }
}
