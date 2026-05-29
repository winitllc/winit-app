import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const OFF_FIELDS = [
  "code",
  "product_name", "product_name_en", "brands", "brands_tags",
  "quantity", "serving_size", "generic_name",
  "packaging", "packaging_tags",
  "origins", "origins_tags", "manufacturing_places",
  "countries_tags", "stores",
  "categories_tags", "main_category",
  "labels_tags",
  "allergens_tags",
  "traces_tags",
  "additives_n", "additives_tags",
  "ingredients_text", "ingredients_tags",
  "ingredients_from_palm_oil_tags",
  "ingredients_that_may_be_from_palm_oil_tags",
  "image_front_url", "image_ingredients_url", "image_nutrition_url", "image_url",
  "nutriments",
  "nutriscore_grade", "nutrition_grade_fr",
  "nova_group",
  "ecoscore_grade",
  "nutrition-score-fr_100g",
  "created_t", "last_modified_t",
].join(",");

const OFF_BASE = "https://us.openfoodfacts.org";
const PAGE_SIZE = 50;
const MAX_PAGES = 20;

function normTag(tag: string): string {
  return tag.replace(/^[a-z]{2}:/, "").toLowerCase().trim();
}

function parseTags(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === "string") return raw.split(",").map(t => t.trim()).filter(Boolean);
  return [];
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isNaN(n) ? null : n;
}

function mapNutrition(n: Record<string, unknown>): Record<string, unknown> {
  const p = (k: string) => num(n?.[k]);
  return {
    energy: p("energy_100g"), energy_kj: p("energy-kj_100g"), energy_kcal: p("energy-kcal_100g"),
    proteins: p("proteins_100g"), carbohydrates: p("carbohydrates_100g"), sugars: p("sugars_100g"),
    fat: p("fat_100g"), saturated_fat: p("saturated-fat_100g"), trans_fat: p("trans-fat_100g"),
    cholesterol: p("cholesterol_100g"), fiber: p("fiber_100g"),
    sodium: p("sodium_100g"), salt: p("salt_100g"),
    monounsaturated_fat: p("monounsaturated-fat_100g"), polyunsaturated_fat: p("polyunsaturated-fat_100g"),
    omega_3_fat: p("omega-3-fat_100g"), omega_6_fat: p("omega-6-fat_100g"),
    alpha_linolenic_acid: p("alpha-linolenic-acid_100g"),
    eicosapentaenoic_acid: p("eicosapentaenoic-acid_100g"),
    docosahexaenoic_acid: p("docosahexaenoic-acid_100g"),
    linoleic_acid: p("linoleic-acid_100g"), arachidonic_acid: p("arachidonic-acid_100g"),
    polyols: p("polyols_100g"), starch: p("starch_100g"),
    alcohol: p("alcohol_100g"), caffeine: p("caffeine_100g"),
    vitamin_a: p("vitamin-a_100g"), vitamin_d: p("vitamin-d_100g"),
    vitamin_e: p("vitamin-e_100g"), vitamin_k: p("vitamin-k_100g"),
    vitamin_c: p("vitamin-c_100g"), vitamin_b1: p("vitamin-b1_100g"),
    vitamin_b2: p("vitamin-b2_100g"), vitamin_b3: p("vitamin-pp_100g"),
    vitamin_b6: p("vitamin-b6_100g"), vitamin_b9: p("vitamin-b9_100g"),
    vitamin_b12: p("vitamin-b12_100g"), biotin: p("biotin_100g"),
    pantothenic_acid: p("pantothenic-acid_100g"),
    potassium: p("potassium_100g"), calcium: p("calcium_100g"),
    phosphorus: p("phosphorus_100g"), iron: p("iron_100g"),
    magnesium: p("magnesium_100g"), zinc: p("zinc_100g"),
    copper: p("copper_100g"), manganese: p("manganese_100g"),
    fluoride: p("fluoride_100g"), selenium: p("selenium_100g"),
    iodine: p("iodine_100g"), chromium: p("chromium_100g"),
    molybdenum: p("molybdenum_100g"), silica: p("silica_100g"),
    bicarbonate: p("bicarbonate_100g"), chloride: p("chloride_100g"),
    fruits_vegetables_nuts: p("fruits-vegetables-nuts_100g"),
    ph: p("ph_100g"), carbon_footprint: p("carbon-footprint_100g"),
  };
}

function mapProduct(p: Record<string, unknown>): Record<string, unknown> {
  const catTags      = parseTags(p.categories_tags);
  const allergenTags = parseTags(p.allergens_tags);
  const tracesTags   = parseTags(p.traces_tags);
  const labelTags    = parseTags(p.labels_tags);
  const ingTags      = parseTags(p.ingredients_tags);
  const barcode      = String(p.code ?? "");
  return {
    barcode,
    name:                  String(p.product_name_en ?? p.product_name ?? ""),
    brand:                 String(p.brands ?? ""),
    brands_tags:           parseTags(p.brands_tags),
    quantity:              String(p.quantity ?? ""),
    serving_size:          String(p.serving_size ?? ""),
    generic_name:          String(p.generic_name ?? ""),
    packaging:             String(p.packaging ?? ""),
    packaging_tags:        parseTags(p.packaging_tags),
    origins:               String(p.origins ?? ""),
    origins_tags:          parseTags(p.origins_tags),
    manufacturing_places:  String(p.manufacturing_places ?? ""),
    countries_tags:        parseTags(p.countries_tags),
    stores:                String(p.stores ?? ""),
    off_main_category:     String(p.main_category ?? ""),
    image_front_url:       String(p.image_front_url ?? p.image_url ?? ""),
    image_ingredients_url: String(p.image_ingredients_url ?? ""),
    image_nutrition_url:   String(p.image_nutrition_url ?? ""),
    ingredients_text:      String(p.ingredients_text ?? ""),
    nutrition:             mapNutrition((p.nutriments ?? {}) as Record<string, unknown>),
    off_categories_tags:   catTags,
    off_allergens_tags:    allergenTags,
    off_traces_tags:       tracesTags,
    off_labels_tags:       labelTags,
    off_ingredients_tags:  ingTags,
    allergen_tags:         allergenTags.map(normTag),
    traces_tags:           tracesTags.map(normTag),
    label_tags:            labelTags.map(normTag),
    diet_tags:             [],
    additives_n:           p.additives_n != null ? Number(p.additives_n) : null,
    additives_tags:        parseTags(p.additives_tags),
    ingredients_from_palm_oil_tags:             parseTags(p.ingredients_from_palm_oil_tags),
    ingredients_that_may_be_from_palm_oil_tags: parseTags(p.ingredients_that_may_be_from_palm_oil_tags),
    nutriscore_grade:      String(p.nutriscore_grade ?? p.nutrition_grade_fr ?? "").toLowerCase() || "",
    nova_group:            p.nova_group != null ? Number(p.nova_group) : null,
    ecoscore_grade:        String(p.ecoscore_grade ?? "").toLowerCase() || "",
    nutrition_score_fr:    num(p["nutrition-score-fr_100g"]),
    off_id:                barcode,
    off_created_t:         p.created_t != null ? Number(p.created_t) : null,
    off_last_modified_t:   p.last_modified_t != null ? Number(p.last_modified_t) : null,
    status:                "pending",
  };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const body = await req.json() as {
      category_slug: string;
      off_tag: string;
      max_pages?: number;
    };

    const { category_slug, off_tag, max_pages = MAX_PAGES } = body;

    if (!category_slug || !off_tag) {
      return new Response(
        JSON.stringify({ error: "category_slug and off_tag are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Read high-water mark for this category
    const { data: catRow } = await supabase
      .from("app_categories")
      .select("last_modified_since")
      .eq("slug", category_slug)
      .maybeSingle();

    const lastModifiedSince: number | null = catRow?.last_modified_since ?? null;

    const { data: job } = await supabase
      .from("import_jobs")
      .insert({ source: "api", category_slug, off_tag, status: "running" })
      .select("id").single();

    const jobId: string = job?.id;
    let totalUpserted = 0, pagesImported = 0, errorMessage = "";
    let maxModifiedT: number = lastModifiedSince ?? 0;

    try {
      for (let page = 1; page <= max_pages; page++) {
        const url = new URL(`${OFF_BASE}/api/v2/search`);
        url.searchParams.set("categories_tags", off_tag);
        url.searchParams.set("fields", OFF_FIELDS);
        url.searchParams.set("page_size", String(PAGE_SIZE));
        url.searchParams.set("page", String(page));
        // Sort by last_modified descending so newest come first; combined with
        // the high-water mark filter this ensures each pull only fetches products
        // that were updated after the previous run.
        url.searchParams.set("sort_by", "last_modified_t");
        if (lastModifiedSince) {
          url.searchParams.set("last_modified_t", `>${lastModifiedSince}`);
        }

        // Retry up to 3 times on 5xx errors with exponential backoff
        let res: Response | null = null;
        for (let attempt = 0; attempt < 3; attempt++) {
          if (attempt > 0) await new Promise(r => setTimeout(r, attempt * 2000));
          res = await fetch(url.toString(), {
            headers: { "User-Agent": "What's In It/1.0 - (info@winitclinic.com)" },
          });
          if (res.ok || res.status < 500) break;
        }
        if (!res!.ok) throw new Error(`OFF responded ${res!.status} on page ${page}`);

        const data = await res.json() as {
          count: number; page_count: number;
          products: Array<Record<string, unknown>>;
        };

        const offProducts = data.products ?? [];
        if (!offProducts.length) break;

        const rows = offProducts.map(mapProduct).filter(r => r.barcode);
        if (!rows.length) break;

        // Track the highest last_modified_t seen across all pages
        for (const p of offProducts) {
          const t = p.last_modified_t != null ? Number(p.last_modified_t) : 0;
          if (t > maxModifiedT) maxModifiedT = t;
        }

        const { data: upserted, error: upsertErr } = await supabase
          .from("products")
          .upsert(rows, { onConflict: "barcode", ignoreDuplicates: true })
          .select("id");

        if (upsertErr) throw new Error(`Upsert error: ${upsertErr.message}`);

        // Auto-assign taxonomy + AI classification for every upserted product
        if (upserted && upserted.length > 0) {
          const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
          const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          const ids = upserted.map((r: { id: string }) => r.id);

          // Taxonomy (deterministic, synchronous per product)
          for (const id of ids) {
            await supabase.rpc("fn_assign_product_taxonomy", { p_product_id: id });
          }

          // AI classification — batch call, awaited so results are written before next page
          await fetch(`${supabaseUrl}/functions/v1/classify-product`, {
            method: "POST",
            headers: { Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" },
            body: JSON.stringify({ product_ids: ids }),
          }).catch(e => console.warn("classify-product batch failed:", e?.message));
        }

        totalUpserted += rows.length;
        pagesImported += 1;
        console.log(`import-products: page=${page} upserted=${rows.length} total=${totalUpserted}`);
        if (page >= (data.page_count ?? 1)) break;
      }

      // Persist the high-water mark so next pull starts from here
      if (maxModifiedT > 0) {
        await supabase
          .from("app_categories")
          .update({ last_modified_since: maxModifiedT })
          .eq("slug", category_slug);
      }

      await supabase.from("import_jobs")
        .update({ status: "completed", pages_imported: pagesImported, products_upserted: totalUpserted, completed_at: new Date().toISOString() })
        .eq("id", jobId);

    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      await supabase.from("import_jobs")
        .update({ status: "failed", pages_imported: pagesImported, products_upserted: totalUpserted, error_message: errorMessage, completed_at: new Date().toISOString() })
        .eq("id", jobId);
    }

    return new Response(
      JSON.stringify({ job_id: jobId, pages_imported: pagesImported, products_upserted: totalUpserted, error: errorMessage || null }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );

  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
