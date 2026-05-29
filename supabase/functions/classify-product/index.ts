import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from "npm:@anthropic-ai/sdk@0.27";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// ── Tag definitions ───────────────────────────────────────────────────────────

const DIET_TAG_RULES: Record<string, {
  labelPatterns: string[];   // OFF labels_tags patterns
  ingredientBlocklist: string[]; // ingredients that disqualify
  ingredientRequire?: string[];  // ingredients that must be present
}> = {
  "vegan": {
    labelPatterns: ["en:vegan", "vegan-status-by-ingredients", "en:vegan-status-by-ingredients"],
    ingredientBlocklist: ["milk", "egg", "honey", "meat", "chicken", "beef", "pork", "fish", "gelatin", "whey", "casein", "lactose", "butter", "cream", "cheese"],
  },
  "vegetarian": {
    labelPatterns: ["en:vegetarian", "vegetarian-status-by-ingredients"],
    ingredientBlocklist: ["chicken", "beef", "pork", "fish", "shrimp", "tuna", "salmon", "gelatin", "lard", "anchovy"],
  },
  "gluten-free": {
    labelPatterns: ["en:gluten-free", "en:no-gluten", "gluten free", "gluten-free"],
    ingredientBlocklist: ["wheat", "barley", "rye", "spelt", "kamut", "farro", "triticale"],
  },
  "dairy-free": {
    labelPatterns: ["en:dairy-free", "en:no-lactose", "dairy free", "dairy-free"],
    ingredientBlocklist: ["milk", "cream", "butter", "cheese", "whey", "casein", "lactose", "yogurt", "ghee"],
  },
  "keto": {
    labelPatterns: ["en:keto", "keto-friendly", "ketogenic"],
    ingredientBlocklist: [],
  },
  "paleo": {
    labelPatterns: ["en:paleo", "paleo-friendly"],
    ingredientBlocklist: ["wheat", "oats", "corn", "rice", "bean", "lentil", "peanut", "sugar", "dairy"],
  },
  "organic": {
    labelPatterns: ["en:organic", "usda-organic", "en:usda-organic", "certified-organic"],
    ingredientBlocklist: [],
  },
  "non-gmo": {
    labelPatterns: ["en:no-gmos", "non-gmo", "non gmo", "en:non-gmo"],
    ingredientBlocklist: [],
  },
  "kosher": {
    labelPatterns: ["en:kosher", "kosher"],
    ingredientBlocklist: [],
  },
  "halal": {
    labelPatterns: ["en:halal", "halal"],
    ingredientBlocklist: [],
  },
  "low-sugar": {
    labelPatterns: ["en:low-sugar", "low sugar", "no-added-sugar"],
    ingredientBlocklist: [],
  },
  "low-sodium": {
    labelPatterns: ["en:low-salt", "low sodium", "en:low-sodium", "reduced sodium"],
    ingredientBlocklist: [],
  },
  "high-protein": {
    labelPatterns: ["en:high-protein", "high protein", "high-protein"],
    ingredientBlocklist: [],
  },
  "high-fiber": {
    labelPatterns: ["en:high-fibre", "en:high-fiber", "high fiber"],
    ingredientBlocklist: [],
  },
  "seed-oil-free": {
    labelPatterns: ["seed-oil-free", "no seed oils"],
    ingredientBlocklist: ["canola oil", "soybean oil", "sunflower oil", "safflower oil", "corn oil", "cottonseed oil", "grapeseed oil", "rice bran oil"],
  },
  "whole-grain": {
    labelPatterns: ["en:whole-grain", "whole grain", "whole wheat"],
    ingredientBlocklist: [],
  },
  "no-artificial-colors": {
    labelPatterns: ["en:no-artificial-colors", "no artificial colors"],
    ingredientBlocklist: ["red 40", "yellow 5", "yellow 6", "blue 1", "blue 2", "red 3", "green 3", "fd&c"],
  },
  "no-artificial-sweeteners": {
    labelPatterns: ["en:no-artificial-sweeteners"],
    ingredientBlocklist: ["aspartame", "sucralose", "saccharin", "acesulfame", "neotame", "advantame"],
  },
  "plant-based": {
    labelPatterns: ["en:plant-based", "plant based", "plant-based"],
    ingredientBlocklist: ["chicken", "beef", "pork", "fish", "shrimp", "tuna", "gelatin", "whey", "casein"],
  },
};

const SEED_OILS = ["canola oil", "rapeseed oil", "soybean oil", "vegetable oil", "sunflower oil",
  "safflower oil", "corn oil", "cottonseed oil", "grapeseed oil", "rice bran oil"];

// ── Types ─────────────────────────────────────────────────────────────────────

interface ProductInput {
  id?: string;
  barcode?: string;
  name: string;
  brand?: string;
  generic_name?: string;
  ingredients_text?: string;
  off_categories_tags?: string[];
  off_labels_tags?: string[];
  off_allergens_tags?: string[];
  nutrition?: Record<string, number | null>;
  nutriscore_grade?: string;
  nova_group?: number | null;
}

interface TaxonomyParent { id: string; slug: string; display_name: string; icon: string; }
interface TaxonomySubcategory { id: string; parent_id: string; slug: string; display_name: string; off_tags: string[]; }
interface OffMapping { off_pattern: string; match_type: string; parent_id: string; subcategory_id: string | null; priority: number; }
interface CorrectionLog {
  off_categories_tags: string[];
  corrected_parent_id: string | null;
  corrected_subcategory_id: string | null;
  corrected_tags: string[];
  product_name: string;
  brand: string;
}

interface ClassificationResult {
  parent_id: string | null;
  subcategory_id: string | null;
  confidence: number;
  category_confidence: number;
  subcategory_confidence: number;
  tags: string[];
  tag_confidences: Record<string, number>;
  reason: string;
  method: "deterministic" | "correction_match" | "ai" | "fallback";
  model: string;
}

// ── Deterministic tag classifier ──────────────────────────────────────────────

function classifyTags(
  product: ProductInput,
  nutrition: Record<string, number | null>,
): { tags: string[]; confidences: Record<string, number> } {
  const tags: string[] = [];
  const confidences: Record<string, number> = {};
  const labels = (product.off_labels_tags ?? []).map(t => t.toLowerCase());
  const ingredients = (product.ingredients_text ?? "").toLowerCase();
  const offAllergens = (product.off_allergens_tags ?? []).map(t => t.toLowerCase());

  for (const [tag, rule] of Object.entries(DIET_TAG_RULES)) {
    let conf = 0;
    let reason = "";

    // Label match — highest confidence
    const labelMatch = rule.labelPatterns.some(p => labels.some(l => l.includes(p)));
    if (labelMatch) { conf = 0.97; reason = "label"; }

    // Blocklist check — lower confidence if no label but ingredients don't contain blocklist items
    if (!labelMatch && rule.ingredientBlocklist.length > 0) {
      const blocked = rule.ingredientBlocklist.some(b => ingredients.includes(b));
      if (!blocked && ingredients.length > 20) {
        conf = 0.72;
        reason = "ingredients-negative";
      }
    }

    // Allergen-based boosts
    if (tag === "dairy-free" && !offAllergens.some(a => a.includes("milk") || a.includes("dairy"))) {
      if (conf === 0) { conf = 0.65; reason = "allergen-absent"; }
    }
    if (tag === "gluten-free" && !offAllergens.some(a => a.includes("gluten") || a.includes("wheat"))) {
      if (conf === 0) { conf = 0.60; reason = "allergen-absent"; }
    }

    // Nutrition-based tags
    if (tag === "low-sugar" && nutrition.sugars != null && nutrition.sugars <= 2) {
      if (conf < 0.85) { conf = 0.88; reason = "nutrition"; }
    }
    if (tag === "low-sodium" && nutrition.sodium != null && nutrition.sodium <= 0.12) {
      if (conf < 0.85) { conf = 0.85; reason = "nutrition"; }
    }
    if (tag === "high-protein" && nutrition.proteins != null && nutrition.proteins >= 15) {
      if (conf < 0.85) { conf = 0.88; reason = "nutrition"; }
    }
    if (tag === "high-fiber" && nutrition.fiber != null && nutrition.fiber >= 6) {
      if (conf < 0.85) { conf = 0.85; reason = "nutrition"; }
    }
    if (tag === "keto" && nutrition.carbohydrates != null && nutrition.carbohydrates <= 5 && nutrition.fat != null && nutrition.fat >= 10) {
      if (conf < 0.80) { conf = 0.82; reason = "nutrition-keto"; }
    }

    // Seed oil free — check ingredients for seed oils
    if (tag === "seed-oil-free") {
      const hasSeedOil = SEED_OILS.some(o => ingredients.includes(o));
      if (!hasSeedOil && ingredients.length > 20) {
        conf = 0.75;
        reason = "no-seed-oils-found";
      } else if (hasSeedOil) {
        conf = 0; // definitely NOT seed oil free
      }
    }

    if (conf >= 0.55) {
      tags.push(tag);
      confidences[tag] = conf;
      void reason; // used for internal logic
    }
  }

  return { tags, confidences };
}

// ── Deterministic taxonomy classifier ────────────────────────────────────────

function classifyByRules(
  product: ProductInput,
  mappings: OffMapping[],
  corrections: CorrectionLog[],
): { parent_id: string | null; subcategory_id: string | null; confidence: number; catConf: number; subcatConf: number; reason: string; method: ClassificationResult["method"] } | null {

  const offTags = (product.off_categories_tags ?? []).map(t => t.toLowerCase());
  if (!offTags.length) return null;

  // ── 1. Check correction log for similar products ──────────────────────────
  for (const correction of corrections) {
    const corrTags = correction.off_categories_tags.map(t => t.toLowerCase());
    const overlap = offTags.filter(t => corrTags.includes(t)).length;
    const sim = overlap / Math.max(offTags.length, corrTags.length, 1);
    const nameMatch = product.name.toLowerCase().includes(correction.product_name.toLowerCase().slice(0, 8)) ||
      (product.brand && correction.brand && product.brand.toLowerCase() === correction.brand.toLowerCase());

    if (sim >= 0.8 || (sim >= 0.5 && nameMatch)) {
      const conf = Math.min(0.98, 0.85 + sim * 0.13);
      return {
        parent_id: correction.corrected_parent_id,
        subcategory_id: correction.corrected_subcategory_id,
        confidence: conf,
        catConf: conf,
        subcatConf: correction.corrected_subcategory_id ? conf - 0.03 : 0,
        reason: `Matched correction log (${Math.round(sim * 100)}% tag overlap${nameMatch ? ", same brand/name" : ""})`,
        method: "correction_match",
      };
    }
  }

  // ── 2. OFF mapping rules ──────────────────────────────────────────────────
  let bestMatch: OffMapping | null = null;
  let bestScore = -1;

  for (const tag of offTags) {
    for (const m of mappings) {
      let matched = false;
      if (m.match_type === "exact") matched = tag === m.off_pattern;
      else if (m.match_type === "prefix") matched = tag.startsWith(m.off_pattern);
      else if (m.match_type === "contains") matched = tag.includes(m.off_pattern);

      if (matched) {
        const score = m.priority + (m.subcategory_id ? 10 : 0);
        if (score > bestScore) { bestScore = score; bestMatch = m; }
      }
    }
  }

  if (bestMatch) {
    // More specific tags = higher confidence
    const specificTagCount = offTags.filter(t => t.length > 8 && t.includes(":")).length;
    const catConf = Math.min(0.97, 0.78 + (specificTagCount * 0.04));
    const subcatConf = bestMatch.subcategory_id ? Math.min(0.95, catConf - 0.05) : 0;
    const conf = bestMatch.subcategory_id ? (catConf + subcatConf) / 2 : catConf * 0.9;

    return {
      parent_id: bestMatch.parent_id,
      subcategory_id: bestMatch.subcategory_id,
      confidence: conf,
      catConf,
      subcatConf,
      reason: `Matched OFF tag rule: "${bestMatch.off_pattern}" (priority ${bestMatch.priority}, ${specificTagCount} specific tags)`,
      method: "deterministic",
    };
  }

  return null;
}

// ── Claude AI classifier ──────────────────────────────────────────────────────

async function classifyWithAI(
  product: ProductInput,
  parents: TaxonomyParent[],
  subcategories: TaxonomySubcategory[],
  corrections: CorrectionLog[],
  anthropic: Anthropic,
): Promise<ClassificationResult> {

  const parentList = parents.map(p => `${p.id}: ${p.display_name}`).join("\n");
  const subcatList = subcategories.map(s => {
    const parent = parents.find(p => p.id === s.parent_id);
    return `${s.id}: ${parent?.display_name} > ${s.display_name}`;
  }).join("\n");

  const recentCorrections = corrections.slice(0, 15).map(c => {
    const parent = parents.find(p => p.id === c.corrected_parent_id);
    const subcat = subcategories.find(s => s.id === c.corrected_subcategory_id);
    return `Product: "${c.product_name}" (${c.brand}) | Tags: ${c.off_categories_tags.slice(0, 5).join(", ")} → ${parent?.display_name ?? "?"} > ${subcat?.display_name ?? "parent only"} | Assigned tags: ${c.corrected_tags.join(", ")}`;
  }).join("\n");

  const tagList = Object.keys(DIET_TAG_RULES).join(", ");

  const prompt = `You are a food product classifier for a health app. Classify this product into the taxonomy below.

PRODUCT:
Name: ${product.name}
Brand: ${product.brand ?? ""}
Generic: ${product.generic_name ?? ""}
OFF Categories: ${(product.off_categories_tags ?? []).join(", ")}
OFF Labels: ${(product.off_labels_tags ?? []).join(", ")}
Ingredients: ${(product.ingredients_text ?? "").slice(0, 500)}
Nutri-Score: ${product.nutriscore_grade ?? "?"}
NOVA: ${product.nova_group ?? "?"}

PARENT CATEGORIES (id: name):
${parentList}

SUBCATEGORIES (id: parent > subcategory):
${subcatList}

AVAILABLE TAGS: ${tagList}

${recentCorrections ? `RECENT ADMIN CORRECTIONS (learn from these patterns):\n${recentCorrections}\n` : ""}

Respond with ONLY valid JSON, no markdown, no explanation outside JSON:
{
  "parent_id": "<uuid or null>",
  "subcategory_id": "<uuid or null>",
  "category_confidence": <0.0-1.0>,
  "subcategory_confidence": <0.0-1.0>,
  "tags": ["tag1", "tag2"],
  "tag_confidences": {"tag1": 0.95, "tag2": 0.82},
  "reason": "<one sentence explaining why this category was chosen>"
}

Rules:
- Set confidence to 0.0 if you cannot determine the category with any confidence
- Only include tags from the AVAILABLE TAGS list
- Only include a tag if confidence >= 0.60
- Return subcategory_id=null if no subcategory fits well
- reason must be 1 sentence, max 120 chars`;

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 512,
    messages: [{ role: "user", content: prompt }],
  });

  const text = message.content[0].type === "text" ? message.content[0].text.trim() : "{}";

  let parsed: Partial<ClassificationResult> = {};
  try {
    // Strip markdown code fences if present
    const clean = text.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
    parsed = JSON.parse(clean);
  } catch {
    console.error("AI response parse error:", text);
  }

  const catConf = typeof parsed.category_confidence === "number" ? parsed.category_confidence : 0;
  const subcatConf = typeof parsed.subcategory_confidence === "number" ? parsed.subcategory_confidence : 0;
  const overallConf = parsed.parent_id ? (catConf * 0.6 + (subcatConf || catConf * 0.8) * 0.4) : 0;

  return {
    parent_id: (parsed.parent_id as string) || null,
    subcategory_id: (parsed.subcategory_id as string) || null,
    confidence: Math.min(1, overallConf),
    category_confidence: catConf,
    subcategory_confidence: subcatConf,
    tags: Array.isArray(parsed.tags) ? (parsed.tags as string[]) : [],
    tag_confidences: (parsed.tag_confidences as Record<string, number>) || {},
    reason: typeof parsed.reason === "string" ? parsed.reason : "AI classification",
    method: "ai",
    model: "claude-sonnet-4-5",
  };
}

// ── Main classifier ───────────────────────────────────────────────────────────

async function classify(
  product: ProductInput,
  parents: TaxonomyParent[],
  subcategories: TaxonomySubcategory[],
  mappings: OffMapping[],
  corrections: CorrectionLog[],
  anthropic: Anthropic,
): Promise<ClassificationResult> {

  const nutrition = (product.nutrition ?? {}) as Record<string, number | null>;
  const { tags: detTags, confidences: tagConfs } = classifyTags(product, nutrition);

  // Try deterministic / correction-log first
  const det = classifyByRules(product, mappings, corrections);

  if (det && det.confidence >= 0.82) {
    return {
      parent_id: det.parent_id,
      subcategory_id: det.subcategory_id,
      confidence: det.confidence,
      category_confidence: det.catConf,
      subcategory_confidence: det.subcatConf,
      tags: detTags,
      tag_confidences: tagConfs,
      reason: det.reason,
      method: det.method,
      model: "deterministic-v1",
    };
  }

  // Fall back to AI — pass deterministic result as context if partial
  const aiResult = await classifyWithAI(product, parents, subcategories, corrections, anthropic);

  // Merge: use higher-confidence category result
  const useDet = det && det.confidence > aiResult.category_confidence;
  const finalParentId = useDet ? det!.parent_id : aiResult.parent_id;
  const finalSubcatId = useDet ? det!.subcategory_id : aiResult.subcategory_id;
  const finalCatConf = useDet ? det!.catConf : aiResult.category_confidence;
  const finalSubcatConf = useDet ? det!.subcatConf : aiResult.subcategory_confidence;

  // Merge tags: union of deterministic + AI tags, taking max confidence
  const mergedTags = { ...tagConfs };
  for (const [tag, conf] of Object.entries(aiResult.tag_confidences ?? {})) {
    mergedTags[tag] = Math.max(mergedTags[tag] ?? 0, conf as number);
  }
  for (const tag of aiResult.tags ?? []) {
    if (!(tag in mergedTags)) mergedTags[tag] = 0.75;
  }
  const finalTags = Object.entries(mergedTags).filter(([, c]) => c >= 0.60).map(([t]) => t);
  const finalConf = finalParentId ? (finalCatConf * 0.6 + (finalSubcatId ? finalSubcatConf : finalCatConf * 0.8) * 0.4) : 0;

  return {
    parent_id: finalParentId,
    subcategory_id: finalSubcatId,
    confidence: Math.min(1, finalConf),
    category_confidence: finalCatConf,
    subcategory_confidence: finalSubcatConf,
    tags: finalTags,
    tag_confidences: mergedTags,
    reason: useDet ? `${det!.reason} + AI tags` : aiResult.reason,
    method: aiResult.method,
    model: "deterministic-v1+claude-sonnet-4-5",
  };
}

// ── Edge function handler ─────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const anthropic = new Anthropic({ apiKey: Deno.env.get("ANTHROPIC_API_KEY")! });

    const body = await req.json() as {
      product?: ProductInput;
      product_id?: string;
      product_ids?: string[];  // batch by DB ids, classifies + writes back
      batch?: ProductInput[];
    };

    // Load taxonomy + recent corrections in parallel
    const [parentsRes, subcatsRes, mappingsRes, correctionsRes] = await Promise.all([
      supabase.from("taxonomy_parents").select("id,slug,display_name,icon").order("sort_order"),
      supabase.from("taxonomy_subcategories").select("id,parent_id,slug,display_name,off_tags").order("sort_order"),
      supabase.from("taxonomy_off_mappings").select("off_pattern,match_type,parent_id,subcategory_id,priority").order("priority", { ascending: false }),
      supabase.from("ai_correction_log").select("off_categories_tags,corrected_parent_id,corrected_subcategory_id,corrected_tags,product_name,brand").order("corrected_at", { ascending: false }).limit(200),
    ]);

    const parents = parentsRes.data ?? [];
    const subcats = subcatsRes.data ?? [];
    const mappings = mappingsRes.data ?? [];
    const corrections = correctionsRes.data ?? [];

    // ── Single product by ID ──────────────────────────────────────────────────
    if (body.product_id) {
      const { data: p } = await supabase.from("products").select("*").eq("id", body.product_id).single();
      if (!p) return json({ error: "Product not found" }, 404);

      const result = await classify(p, parents, subcats, mappings, corrections, anthropic);
      const catStatus = result.confidence >= 0.82 ? "ai_classified" : "needs_review";

      await supabase.from("products").update({
        ai_category_id: result.parent_id,
        ai_subcategory_id: result.subcategory_id,
        ai_confidence: result.confidence,
        ai_category_confidence: result.category_confidence,
        ai_subcategory_confidence: result.subcategory_confidence,
        ai_tags: result.tags,
        ai_tag_confidences: result.tag_confidences,
        ai_classification_reason: result.reason,
        ai_classified_at: new Date().toISOString(),
        ai_model: result.model,
        categorization_status: catStatus,
        review_priority: catStatus === "needs_review" ? Math.round((1 - result.confidence) * 100) : 0,
        // Also write to main taxonomy assignment
        ...(result.parent_id ? {} : {}),
      }).eq("id", body.product_id);

      // Also upsert product_taxonomy
      if (result.parent_id) {
        await supabase.from("product_taxonomy").upsert({
          product_id: body.product_id,
          parent_id: result.parent_id,
          subcategory_id: result.subcategory_id,
          auto_assigned: true,
          assigned_at: new Date().toISOString(),
        }, { onConflict: "product_id,parent_id" });
      }

      return json({ ...result, product_id: body.product_id, categorization_status: catStatus });
    }

    // ── Inline single product ─────────────────────────────────────────────────
    if (body.product) {
      const result = await classify(body.product, parents, subcats, mappings, corrections, anthropic);
      return json(result);
    }

    // ── Batch by IDs (classifies + writes back to DB) ─────────────────────────
    if (body.product_ids && Array.isArray(body.product_ids)) {
      const ids = (body.product_ids as string[]).slice(0, 50);
      const { data: ps } = await supabase.from("products").select("*").in("id", ids);
      if (!ps?.length) return json({ classified: 0, needs_review: 0 });

      let classified = 0, needsReview = 0;
      for (const p of ps) {
        const result = await classify(p, parents, subcats, mappings, corrections, anthropic);
        const catStatus = result.confidence >= 0.82 ? "ai_classified" : "needs_review";

        await supabase.from("products").update({
          ai_category_id: result.parent_id,
          ai_subcategory_id: result.subcategory_id,
          ai_confidence: result.confidence,
          ai_category_confidence: result.category_confidence,
          ai_subcategory_confidence: result.subcategory_confidence,
          ai_tags: result.tags,
          ai_tag_confidences: result.tag_confidences,
          ai_classification_reason: result.reason,
          ai_classified_at: new Date().toISOString(),
          ai_model: result.model,
          categorization_status: catStatus,
          review_priority: catStatus === "needs_review" ? Math.round((1 - result.confidence) * 100) : 0,
        }).eq("id", p.id);

        if (result.parent_id) {
          await supabase.from("product_taxonomy").upsert({
            product_id: p.id,
            parent_id: result.parent_id,
            subcategory_id: result.subcategory_id,
            auto_assigned: true,
            assigned_at: new Date().toISOString(),
          }, { onConflict: "product_id,parent_id" });
        }

        if (catStatus === "ai_classified") classified++; else needsReview++;
      }
      return json({ classified, needs_review: needsReview, total: ps.length });
    }

    // ── Inline batch (no DB write) ────────────────────────────────────────────
    if (body.batch && Array.isArray(body.batch)) {
      const results = [];
      for (const product of body.batch.slice(0, 20)) {
        const result = await classify(product, parents, subcats, mappings, corrections, anthropic);
        results.push({ barcode: product.barcode, ...result });
      }
      return json({ results });
    }

    return json({ error: "Provide product, product_id, product_ids, or batch" }, 400);

  } catch (err) {
    console.error("classify-product error:", err);
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
