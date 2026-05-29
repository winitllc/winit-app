import { Injectable } from '@angular/core';
import { SupabaseProduct } from './supabase-product.service';

export type CompatibilityStatus = 'approved' | 'review' | 'avoid';

export interface IngredientFlag {
  word: string;
  reason: string;
  type: 'allergen' | 'diet' | 'condition';
  severity: 'warn' | 'danger';
}

export interface CompatibilityResult {
  score: number;
  status: CompatibilityStatus;
  statusLabel: string;
  statusEmoji: string;
  flags: IngredientFlag[];
  highlights: QuickHighlight[];
  goodTags: string[];
}

export interface QuickHighlight {
  label: string;
  type: 'good' | 'warn' | 'danger';
}

// Catalog ID → ingredient keywords for offline matching
const ALLERGEN_KEYWORDS: Record<string, string[]> = {
  milk:        ['milk','dairy','lactose','cream','butter','cheese','whey','casein','ghee','lactulose'],
  eggs:        ['egg','eggs','albumin','mayonnaise','meringue','ovalbumin'],
  peanuts:     ['peanut','groundnut','arachis','monkey nut'],
  almonds:     ['almond'],
  cashews:     ['cashew'],
  walnuts:     ['walnut'],
  pecans:      ['pecan'],
  pistachios:  ['pistachio'],
  hazelnuts:   ['hazelnut','filbert'],
  brazil_nuts: ['brazil nut','brazil nuts'],
  macadamia:   ['macadamia','queensland nut'],
  pine_nuts:   ['pine nut','pine nuts','pinoli'],
  soy:         ['soy','soya','tofu','tempeh','miso','edamame','soybean'],
  wheat:       ['wheat','flour','gluten','semolina','spelt','kamut','farro','durum','bulgur'],
  barley:      ['barley','malt','beer'],
  rye:         ['rye'],
  oats:        ['oats','oatmeal'],
  fish:        ['fish','anchovy','bass','cod','salmon','tuna','trout','herring','sardine','halibut'],
  shellfish:   ['shellfish','shrimp','crab','lobster','crayfish','prawn','clam','oyster','scallop','mussel'],
  sesame:      ['sesame','tahini','sesame seed'],
  mustard:     ['mustard','mustard seed','mustard oil'],
  celery:      ['celery','celeriac'],
  lupin:       ['lupin','lupine'],
  sulphites:   ['sulphite','sulfite','sulphur dioxide','sulfur dioxide','e220','e221','e222','e223','e224'],
  corn:        ['corn','maize','cornstarch','corn syrup','polenta'],
  lactose_intol: ['milk','dairy','lactose','cream','butter','cheese'],
  celiac:      ['gluten','wheat','barley','rye'],
  diabetes_t1: ['sugar','glucose','syrup','sucrose','fructose','dextrose'],
  diabetes_t2: ['sugar','glucose','syrup','sucrose','fructose','dextrose'],
  phenylketonuria: ['phenylalanine','aspartame'],
  galactosemia: ['milk','dairy','lactose','casein'],
};

// Catalog ID → human-readable label
const CATALOG_LABELS: Record<string, string> = {
  milk: 'Dairy', eggs: 'Eggs', peanuts: 'Peanuts',
  almonds: 'Almonds', cashews: 'Cashews', walnuts: 'Walnuts', pecans: 'Pecans',
  pistachios: 'Pistachios', hazelnuts: 'Hazelnuts', brazil_nuts: 'Brazil Nuts',
  macadamia: 'Macadamia', pine_nuts: 'Pine Nuts',
  soy: 'Soy', wheat: 'Wheat', barley: 'Barley', rye: 'Rye', oats: 'Oats',
  fish: 'Fish', shellfish: 'Shellfish', sesame: 'Sesame', mustard: 'Mustard',
  celery: 'Celery', lupin: 'Lupin', sulphites: 'Sulphites', corn: 'Corn',
  lactose_intol: 'Lactose', celiac: 'Gluten',
  diabetes_t1: 'Added Sugar', diabetes_t2: 'Added Sugar',
  phenylketonuria: 'Phenylalanine', galactosemia: 'Galactose',
};

// Diet product tag keyword → human label for positive highlights
const DIET_GOOD_MAP: Record<string, string> = {
  'vegan': 'Vegan', 'vegetarian': 'Vegetarian', 'gluten-free': 'Gluten Free',
  'gluten_free': 'Gluten Free', 'dairy-free': 'Dairy Free', 'dairy_free': 'Dairy Free',
  'organic': 'Organic', 'non-gmo': 'Non-GMO', 'non_gmo': 'Non-GMO',
  'low-sugar': 'Low Sugar', 'low_sugar': 'Low Sugar',
  'low-sodium': 'Low Sodium', 'low_sodium': 'Low Sodium',
  'high-protein': 'High Protein', 'high_protein': 'High Protein',
  'keto': 'Keto', 'paleo': 'Paleo', 'halal': 'Halal', 'kosher': 'Kosher',
};

@Injectable({ providedIn: 'root' })
export class CompatibilityService {
  private dangerIds: string[] = [];   // allergy_ids + condition_ids from user profile
  private dietIds: string[] = [];     // diet_ids from user profile

  /** Called by product/results pages after loading user profile */
  setWarnings(opts: { allergies?: string[]; diets?: string[]; conditions?: string[] }) {
    this.dangerIds = [
      ...(opts.allergies ?? []).map(s => s.toLowerCase()),
      ...(opts.conditions ?? []).map(s => s.toLowerCase()),
    ];
    this.dietIds = (opts.diets ?? []).map(s => s.toLowerCase());
  }

  get hasProfile(): boolean {
    return this.dangerIds.length + this.dietIds.length > 0;
  }

  score(product: SupabaseProduct): CompatibilityResult {
    const flags: IngredientFlag[] = [];
    const goodTags: string[] = [];

    const ingredientsLower = (product.ingredients_text ?? '').toLowerCase();
    const allergenTagsLower = (product.allergen_tags ?? []).map(t => t.replace(/^en:/, '').toLowerCase());

    // ── 1. Danger flags from user's allergy/condition IDs ──────────────────
    for (const id of this.dangerIds) {
      const keywords = ALLERGEN_KEYWORDS[id] ?? [id];
      const label = CATALOG_LABELS[id] ?? this.capitalize(id);

      const inAllergenTags = allergenTagsLower.some(t => keywords.some(kw => t.includes(kw)));
      const inIngredients = ingredientsLower && keywords.some(kw => ingredientsLower.includes(kw));

      if ((inAllergenTags || inIngredients) && !flags.some(f => f.reason === label)) {
        flags.push({ word: keywords[0] ?? id, reason: label, type: 'allergen', severity: 'danger' });
      }
    }

    // ── 2. Warn flags — common allergens present even if not in user profile ─
    if (this.hasProfile && ingredientsLower) {
      for (const [id, keywords] of Object.entries(ALLERGEN_KEYWORDS)) {
        if (this.dangerIds.includes(id)) continue;
        const label = CATALOG_LABELS[id] ?? this.capitalize(id);
        if (flags.some(f => f.reason === label)) continue;
        if (keywords.some(kw => ingredientsLower.includes(kw))) {
          flags.push({ word: keywords[0], reason: label, type: 'allergen', severity: 'warn' });
        }
      }
    }

    // ── 3. Positive diet tags ───────────────────────────────────────────────
    for (const tag of (product.diet_tags ?? [])) {
      const tagLower = tag.replace(/^en:/, '').toLowerCase();
      for (const [key, label] of Object.entries(DIET_GOOD_MAP)) {
        if (tagLower.includes(key) && !goodTags.includes(label)) {
          goodTags.push(label);
        }
      }
    }

    // ── 4. Score ────────────────────────────────────────────────────────────
    const dangerCount = flags.filter(f => f.severity === 'danger').length;
    const warnCount   = flags.filter(f => f.severity === 'warn').length;

    let score: number;
    if (!this.hasProfile) {
      score = this.baseScore(product);
    } else {
      score = Math.max(0, Math.min(100, 100 - dangerCount * 35 - warnCount * 8));
    }

    // ── 5. Status ───────────────────────────────────────────────────────────
    let status: CompatibilityStatus;
    let statusLabel: string;
    let statusEmoji: string;
    if (dangerCount > 0) {
      status = 'avoid'; statusLabel = 'Avoid'; statusEmoji = '🔴';
    } else if (warnCount > 0 || score < 75) {
      status = 'review'; statusLabel = 'Check'; statusEmoji = '🟡';
    } else {
      status = 'approved'; statusLabel = 'Safe'; statusEmoji = '🟢';
    }

    // ── 6. Quick highlights (up to 3) ──────────────────────────────────────
    const highlights: QuickHighlight[] = [];
    for (const f of flags.filter(f2 => f2.severity === 'danger').slice(0, 2)) {
      highlights.push({ label: `Contains ${f.reason}`, type: 'danger' });
    }
    for (const g of goodTags.slice(0, 2)) {
      if (highlights.length < 3) highlights.push({ label: g, type: 'good' });
    }
    for (const f of flags.filter(f2 => f2.severity === 'warn').slice(0, 1)) {
      if (highlights.length < 3) highlights.push({ label: `May Contain ${f.reason}`, type: 'warn' });
    }

    // Deduplicate flags by reason, keeping danger over warn
    const seen = new Set<string>();
    const dedupedFlags = flags.filter(f => {
      if (seen.has(f.reason)) return false;
      seen.add(f.reason);
      return true;
    });

    return { score, status, statusLabel, statusEmoji, flags: dedupedFlags, highlights, goodTags };
  }

  annotateIngredients(
    text: string,
    flags: IngredientFlag[],
  ): { html: string; flaggedWords: Map<string, IngredientFlag> } {
    if (!text) return { html: '', flaggedWords: new Map() };

    const flaggedWords = new Map<string, IngredientFlag>(flags.map(f => [f.word.toLowerCase(), f]));
    const tokens = text.split(/(,\s*|;\s*|\.\s*)/);
    const html = tokens.map(token => {
      const lower = token.toLowerCase().trim();
      if (!lower || /^[,;.\s]+$/.test(lower)) return token;

      const matchedFlag = flags.find(f => lower.includes(f.word.toLowerCase()));
      if (!matchedFlag) return token;

      const cls = matchedFlag.severity === 'danger' ? 'ing-danger' : 'ing-warn';
      const title = `${matchedFlag.reason}: ${matchedFlag.severity === 'danger' ? 'Avoid' : 'Check'}`;
      return `<span class="${cls}" title="${title}">${token}</span>`;
    }).join('');

    return { html, flaggedWords };
  }

  private baseScore(product: SupabaseProduct): number {
    if (product.health_rating) return Math.round(product.health_rating * 10);
    const grade = product.nutriscore_grade?.toLowerCase();
    const gradeMap: Record<string, number> = { a: 92, b: 78, c: 60, d: 40, e: 20 };
    return gradeMap[grade ?? ''] ?? 65;
  }

  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
