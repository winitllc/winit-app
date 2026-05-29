import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BATCH_SIZE = 500;

// ─── Parsing helpers ──────────────────────────────────────────────────────────

function splitLine(line: string, sep: string): string[] {
  if (sep === "\t") return line.split("\t");
  const fields: string[] = [];
  let cur = "", inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQ && line[i + 1] === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === sep && !inQ) { fields.push(cur); cur = ""; }
    else cur += c;
  }
  fields.push(cur);
  return fields;
}

function parseTags(raw: string): string[] {
  if (!raw || !raw.trim()) return [];
  return raw.split(",").map(t => t.trim()).filter(Boolean);
}

function normTag(tag: string): string {
  return tag.replace(/^[a-z]{2}:/, "").toLowerCase().trim();
}

function num(s: string): number | null {
  if (!s || !s.trim()) return null;
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

function int(s: string): number | null {
  if (!s || !s.trim()) return null;
  const n = parseInt(s, 10);
  return isNaN(n) ? null : n;
}

function str(s: string): string { return (s ?? "").trim(); }

// ─── Column index builder ─────────────────────────────────────────────────────

function buildColMap(headers: string[]) {
  const i = (n: string) => headers.indexOf(n);
  return {
    code: i("code"), product_name: i("product_name"), product_name_en: i("product_name_en"),
    generic_name: i("generic_name"), quantity: i("quantity"), serving_size: i("serving_size"),
    packaging: i("packaging"), packaging_tags: i("packaging_tags"),
    brands: i("brands"), brands_tags: i("brands_tags"),
    origins: i("origins"), origins_tags: i("origins_tags"),
    manufacturing_places: i("manufacturing_places"),
    countries_tags: i("countries_tags"), stores: i("stores"),
    categories_tags: i("categories_tags"), labels_tags: i("labels_tags"),
    allergens_tags: i("allergens_tags"), traces_tags: i("traces_tags"),
    additives_n: i("additives_n"), additives_tags: i("additives_tags"),
    ingredients_text: i("ingredients_text"), ingredients_tags: i("ingredients_tags"),
    ingredients_from_palm_oil_tags: i("ingredients_from_palm_oil_tags"),
    ingredients_that_may_be_from_palm_oil_tags: i("ingredients_that_may_be_from_palm_oil_tags"),
    nutriscore_grade: i("nutriscore_grade"), nutrition_grade_fr: i("nutrition_grade_fr"),
    nova_groups: i("nova_groups"), ecoscore_grade: i("ecoscore_grade"),
    main_category: i("main_category"),
    image_url: i("image_url"), image_front_url: i("image_front_url"),
    image_ingredients_url: i("image_ingredients_url"), image_nutrition_url: i("image_nutrition_url"),
    created_t: i("created_t"), last_modified_t: i("last_modified_t"),
    nutrition_score_fr: i("nutrition-score-fr_100g"),
    // Core nutrition
    energy_100g: i("energy_100g"), energy_kj: i("energy-kj_100g"), energy_kcal: i("energy-kcal_100g"),
    proteins: i("proteins_100g"), carbohydrates: i("carbohydrates_100g"), sugars: i("sugars_100g"),
    fat: i("fat_100g"), saturated_fat: i("saturated-fat_100g"), trans_fat: i("trans-fat_100g"),
    cholesterol: i("cholesterol_100g"), fiber: i("fiber_100g"),
    sodium: i("sodium_100g"), salt: i("salt_100g"),
    // Extended fats
    monounsaturated_fat: i("monounsaturated-fat_100g"), polyunsaturated_fat: i("polyunsaturated-fat_100g"),
    omega_3_fat: i("omega-3-fat_100g"), omega_6_fat: i("omega-6-fat_100g"),
    alpha_linolenic_acid: i("alpha-linolenic-acid_100g"),
    eicosapentaenoic_acid: i("eicosapentaenoic-acid_100g"),
    docosahexaenoic_acid: i("docosahexaenoic-acid_100g"),
    linoleic_acid: i("linoleic-acid_100g"), arachidonic_acid: i("arachidonic-acid_100g"),
    polyols: i("polyols_100g"), starch: i("starch_100g"),
    alcohol: i("alcohol_100g"), caffeine: i("caffeine_100g"),
    // Vitamins
    vitamin_a: i("vitamin-a_100g"), vitamin_d: i("vitamin-d_100g"),
    vitamin_e: i("vitamin-e_100g"), vitamin_k: i("vitamin-k_100g"),
    vitamin_c: i("vitamin-c_100g"), vitamin_b1: i("vitamin-b1_100g"),
    vitamin_b2: i("vitamin-b2_100g"), vitamin_b3: i("vitamin-pp_100g"),
    vitamin_b6: i("vitamin-b6_100g"), vitamin_b9: i("vitamin-b9_100g"),
    vitamin_b12: i("vitamin-b12_100g"), biotin: i("biotin_100g"),
    pantothenic_acid: i("pantothenic-acid_100g"),
    // Minerals
    potassium: i("potassium_100g"), calcium: i("calcium_100g"),
    phosphorus: i("phosphorus_100g"), iron: i("iron_100g"),
    magnesium: i("magnesium_100g"), zinc: i("zinc_100g"),
    copper: i("copper_100g"), manganese: i("manganese_100g"),
    fluoride: i("fluoride_100g"), selenium: i("selenium_100g"),
    iodine: i("iodine_100g"), chromium: i("chromium_100g"),
    molybdenum: i("molybdenum_100g"), silica: i("silica_100g"),
    bicarbonate: i("bicarbonate_100g"), chloride: i("chloride_100g"),
    // Other
    fruits_vegetables_nuts: i("fruits-vegetables-nuts_100g"),
    ph: i("ph_100g"), carbon_footprint: i("carbon-footprint_100g"),
  };
}

type ColMap = ReturnType<typeof buildColMap>;

// ─── Row mapper ───────────────────────────────────────────────────────────────

function mapRow(f: string[], C: ColMap): Record<string, unknown> | null {
  const g = (col: number) => col >= 0 ? (f[col] ?? "") : "";
  const barcode = str(g(C.code));
  if (!barcode) return null;

  const catTags      = parseTags(g(C.categories_tags));
  const allergenTags = parseTags(g(C.allergens_tags));
  const tracesTags   = parseTags(g(C.traces_tags));
  const labelTags    = parseTags(g(C.labels_tags));
  const ingTags      = parseTags(g(C.ingredients_tags));
  const nutriscore   = str(g(C.nutrition_grade_fr)) || str(g(C.nutriscore_grade));

  return {
    barcode,
    name:                  str(g(C.product_name_en)) || str(g(C.product_name)),
    brand:                 str(g(C.brands)),
    brands_tags:           parseTags(g(C.brands_tags)),
    quantity:              str(g(C.quantity)),
    serving_size:          str(g(C.serving_size)),
    generic_name:          str(g(C.generic_name)),
    packaging:             str(g(C.packaging)),
    packaging_tags:        parseTags(g(C.packaging_tags)),
    origins:               str(g(C.origins)),
    origins_tags:          parseTags(g(C.origins_tags)),
    manufacturing_places:  str(g(C.manufacturing_places)),
    countries_tags:        parseTags(g(C.countries_tags)),
    stores:                str(g(C.stores)),
    off_main_category:     str(g(C.main_category)),
    image_front_url:       str(g(C.image_front_url)) || str(g(C.image_url)),
    image_ingredients_url: str(g(C.image_ingredients_url)),
    image_nutrition_url:   str(g(C.image_nutrition_url)),
    ingredients_text:      str(g(C.ingredients_text)),
    off_categories_tags:   catTags,
    off_allergens_tags:    allergenTags,
    off_traces_tags:       tracesTags,
    off_labels_tags:       labelTags,
    off_ingredients_tags:  ingTags,
    allergen_tags:         allergenTags.map(normTag),
    traces_tags:           tracesTags.map(normTag),
    label_tags:            labelTags.map(normTag),
    diet_tags:             [],
    additives_n:           int(g(C.additives_n)),
    additives_tags:        parseTags(g(C.additives_tags)),
    ingredients_from_palm_oil_tags:             parseTags(g(C.ingredients_from_palm_oil_tags)),
    ingredients_that_may_be_from_palm_oil_tags: parseTags(g(C.ingredients_that_may_be_from_palm_oil_tags)),
    nutriscore_grade:      nutriscore.toLowerCase() || '',
    nova_group:            int(g(C.nova_groups)),
    ecoscore_grade:        str(g(C.ecoscore_grade)).toLowerCase() || '',
    nutrition_score_fr:    num(g(C.nutrition_score_fr)),
    off_id:                barcode,
    off_created_t:         int(g(C.created_t)),
    off_last_modified_t:   int(g(C.last_modified_t)),
    status:                "pending",
    nutrition: {
      energy: num(g(C.energy_100g)), energy_kj: num(g(C.energy_kj)), energy_kcal: num(g(C.energy_kcal)),
      proteins: num(g(C.proteins)), carbohydrates: num(g(C.carbohydrates)), sugars: num(g(C.sugars)),
      fat: num(g(C.fat)), saturated_fat: num(g(C.saturated_fat)), trans_fat: num(g(C.trans_fat)),
      cholesterol: num(g(C.cholesterol)), fiber: num(g(C.fiber)),
      sodium: num(g(C.sodium)), salt: num(g(C.salt)),
      monounsaturated_fat: num(g(C.monounsaturated_fat)), polyunsaturated_fat: num(g(C.polyunsaturated_fat)),
      omega_3_fat: num(g(C.omega_3_fat)), omega_6_fat: num(g(C.omega_6_fat)),
      alpha_linolenic_acid: num(g(C.alpha_linolenic_acid)),
      eicosapentaenoic_acid: num(g(C.eicosapentaenoic_acid)),
      docosahexaenoic_acid: num(g(C.docosahexaenoic_acid)),
      linoleic_acid: num(g(C.linoleic_acid)), arachidonic_acid: num(g(C.arachidonic_acid)),
      polyols: num(g(C.polyols)), starch: num(g(C.starch)),
      alcohol: num(g(C.alcohol)), caffeine: num(g(C.caffeine)),
      vitamin_a: num(g(C.vitamin_a)), vitamin_d: num(g(C.vitamin_d)),
      vitamin_e: num(g(C.vitamin_e)), vitamin_k: num(g(C.vitamin_k)),
      vitamin_c: num(g(C.vitamin_c)), vitamin_b1: num(g(C.vitamin_b1)),
      vitamin_b2: num(g(C.vitamin_b2)), vitamin_b3: num(g(C.vitamin_b3)),
      vitamin_b6: num(g(C.vitamin_b6)), vitamin_b9: num(g(C.vitamin_b9)),
      vitamin_b12: num(g(C.vitamin_b12)), biotin: num(g(C.biotin)),
      pantothenic_acid: num(g(C.pantothenic_acid)),
      potassium: num(g(C.potassium)), calcium: num(g(C.calcium)),
      phosphorus: num(g(C.phosphorus)), iron: num(g(C.iron)),
      magnesium: num(g(C.magnesium)), zinc: num(g(C.zinc)),
      copper: num(g(C.copper)), manganese: num(g(C.manganese)),
      fluoride: num(g(C.fluoride)), selenium: num(g(C.selenium)),
      iodine: num(g(C.iodine)), chromium: num(g(C.chromium)),
      molybdenum: num(g(C.molybdenum)), silica: num(g(C.silica)),
      bicarbonate: num(g(C.bicarbonate)), chloride: num(g(C.chloride)),
      fruits_vegetables_nuts: num(g(C.fruits_vegetables_nuts)),
      ph: num(g(C.ph)), carbon_footprint: num(g(C.carbon_footprint)),
    },
  };
}

// ─── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const body = await req.json() as {
      action: "create_job" | "process_chunk" | "finish_job";
      filename?: string;
      job_id?: string;
      chunk?: string;
      header?: string;
    };

    // ── create_job ──────────────────────────────────────────────────────────
    if (body.action === "create_job") {
      const { data: job, error } = await supabase
        .from("import_jobs")
        .insert({
          source: "csv", filename: body.filename ?? "upload.csv",
          status: "running", category_slug: "csv-upload", off_tag: "csv",
          products_upserted: 0, products_skipped: 0, auto_mapped: 0, needs_review: 0,
        })
        .select("id").single();
      if (error) throw error;
      return json({ job_id: job.id });
    }

    // ── process_chunk ────────────────────────────────────────────────────────
    if (body.action === "process_chunk") {
      if (!body.job_id || !body.chunk) return json({ error: "job_id and chunk are required" }, 400);

      const lines = body.chunk.split("\n");
      const sep = (body.header ?? lines[0] ?? "").includes("\t") ? "\t" : ",";

      let headerLine = body.header ?? "";
      let dataLines = lines;
      if (!headerLine) {
        const first = lines[0]?.toLowerCase() ?? "";
        if (first.startsWith("code") || first.startsWith("product_name")) {
          headerLine = lines[0]; dataLines = lines.slice(1);
        } else {
          return json({ error: "No header found and none provided" }, 400);
        }
      }

      const C = buildColMap(splitLine(headerLine, sep));
      let processed = 0, skipped = 0, autoMapped = 0, needsReview = 0;

      for (let b = 0; b < dataLines.length; b += BATCH_SIZE) {
        const rows: Record<string, unknown>[] = [];
        for (const line of dataLines.slice(b, b + BATCH_SIZE)) {
          if (!line.trim()) continue;
          const row = mapRow(splitLine(line, sep), C);
          if (row) rows.push(row); else skipped++;
        }
        if (!rows.length) continue;

        const { data: upserted, error: upsertErr } = await supabase
          .from("products")
          .upsert(rows, { onConflict: "barcode", ignoreDuplicates: false })
          .select("id, categorization_status");

        if (upsertErr) { console.error("Upsert error:", upsertErr.message); skipped += rows.length; continue; }

        processed += upserted?.length ?? 0;
        for (const p of upserted ?? []) {
          if (p.categorization_status === "auto_mapped") autoMapped++; else needsReview++;
        }
      }

      await supabase.rpc("increment_import_job_counts", {
        p_job_id: body.job_id, p_upserted: processed,
        p_skipped: skipped, p_auto_mapped: autoMapped, p_needs_review: needsReview,
      });

      return json({ processed, skipped, auto_mapped: autoMapped, needs_review: needsReview });
    }

    // ── finish_job ───────────────────────────────────────────────────────────
    if (body.action === "finish_job") {
      if (!body.job_id) return json({ error: "job_id required" }, 400);
      const { data: job } = await supabase
        .from("import_jobs")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", body.job_id)
        .select("products_upserted, products_skipped, auto_mapped, needs_review")
        .single();
      return json({
        job_id: body.job_id,
        products_upserted: job?.products_upserted ?? 0,
        products_skipped: job?.products_skipped ?? 0,
        auto_mapped: job?.auto_mapped ?? 0,
        needs_review: job?.needs_review ?? 0,
      });
    }

    return json({ error: "Unknown action" }, 400);

  } catch (err) {
    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
