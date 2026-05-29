import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BATCH_SIZE = 500;

// ─── CSV parsing ─────────────────────────────────────────────────────────────
// OFF CSV is tab-separated with a header row. Fields may be quoted.
// This parser handles the TSV format used by Open Food Facts exports.

function parseTSVLine(line: string): string[] {
  // OFF TSV does not quote fields — tabs are the only delimiter.
  // We split on \t and unescape any literal \\t or \\n inside values.
  return line.split("\t").map(f => f.replace(/\\t/g, "\t").replace(/\\n/g, "\n").trim());
}

function splitCSV(line: string, sep: string): string[] {
  if (sep === "\t") return parseTSVLine(line);
  // Generic quoted-CSV parser for comma-separated fallback
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuote = !inQuote;
    } else if (ch === sep && !inQuote) {
      fields.push(cur); cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

// Parse a comma/semicolon-joined OFF tag list like "en:snacks,en:chips" → ["en:snacks","en:chips"]
function parseTags(raw: string): string[] {
  if (!raw) return [];
  return raw.split(",").map(t => t.trim()).filter(Boolean);
}

// Normalise a tag like "en:gluten" → "gluten"
function normaliseTag(tag: string): string {
  return tag.replace(/^[a-z]{2}:/, "").toLowerCase().trim();
}

// Safe float parse
function num(s: string): number | null {
  const n = parseFloat(s);
  return isNaN(n) ? null : n;
}

// ─── Main handler ─────────────────────────────────────────────────────────────
//
// Two endpoints:
//
//   POST /import-csv { action: "create_job", filename }
//     → { job_id }
//
//   POST /import-csv { action: "process_chunk", job_id, chunk: "<tsv text>" }
//     → { processed, skipped, auto_mapped, needs_review }
//
//   POST /import-csv { action: "finish_job", job_id }
//     → { job_id, products_upserted, products_skipped, auto_mapped, needs_review }
//
// The browser client splits the file into chunks of ~1 MB of text lines
// and calls process_chunk for each one, then calls finish_job.

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
      header?: string; // TSV header line, sent with first chunk
    };

    // ── create_job ──────────────────────────────────────────────────────────
    if (body.action === "create_job") {
      const { data: job, error } = await supabase
        .from("import_jobs")
        .insert({
          source: "csv",
          filename: body.filename ?? "upload.csv",
          status: "running",
          category_slug: "csv-upload",
          off_tag: "csv",
          products_upserted: 0,
          products_skipped: 0,
          auto_mapped: 0,
          needs_review: 0,
        })
        .select("id")
        .single();

      if (error) throw error;
      return json({ job_id: job.id });
    }

    // ── process_chunk ────────────────────────────────────────────────────────
    if (body.action === "process_chunk") {
      if (!body.job_id || !body.chunk) {
        return json({ error: "job_id and chunk are required" }, 400);
      }

      const lines = body.chunk.split("\n").filter(l => l.trim());
      if (!lines.length) return json({ processed: 0, skipped: 0, auto_mapped: 0, needs_review: 0 });

      // Detect separator from header
      const sep = lines[0].includes("\t") ? "\t" : ",";

      // First line of chunk may or may not be the header row
      let headerLine = body.header ?? "";
      let dataLines = lines;

      // If header was not passed separately, detect if first line is header
      if (!headerLine) {
        const first = lines[0].toLowerCase();
        if (first.startsWith("code") || first.startsWith("barcode") || first.startsWith("product_name")) {
          headerLine = lines[0];
          dataLines = lines.slice(1);
        } else {
          // We need a header to know column positions — skip this chunk
          return json({ error: "No header found and none provided" }, 400);
        }
      }

      const cols = splitCSV(headerLine, sep);
      const idx = (name: string) => cols.indexOf(name);

      // Build column index map for OFF CSV fields
      const COL = {
        code:              idx("code"),
        product_name:      idx("product_name"),
        product_name_en:   idx("product_name_en"),
        brands:            idx("brands"),
        quantity:          idx("quantity"),
        generic_name:      idx("generic_name"),
        image_front_url:   idx("image_front_url"),
        image_ingredients_url: idx("image_ingredients_url"),
        image_nutrition_url: idx("image_nutrition_url"),
        ingredients_text:  idx("ingredients_text"),
        categories_tags:   idx("categories_tags"),
        allergens_tags:    idx("allergens_tags"),
        labels_tags:       idx("labels_tags"),
        ingredients_tags:  idx("ingredients_tags"),
        nutriscore_grade:  idx("nutriscore_grade"),
        nova_group:        idx("nova_groups"),
        // Nutrition: OFF CSV uses flat columns named like "energy-kcal_100g"
        energy_kcal:       idx("energy-kcal_100g"),
        energy_kj:         idx("energy-kj_100g"),
        fat:               idx("fat_100g"),
        saturated_fat:     idx("saturated-fat_100g"),
        carbohydrates:     idx("carbohydrates_100g"),
        sugars:            idx("sugars_100g"),
        fiber:             idx("fiber_100g"),
        proteins:          idx("proteins_100g"),
        salt:              idx("salt_100g"),
        sodium:            idx("sodium_100g"),
      };

      const g = (fields: string[], col: number) => col >= 0 ? (fields[col] ?? "") : "";

      let processed = 0;
      let skipped = 0;
      let autoMapped = 0;
      let needsReview = 0;

      // Process dataLines in batches of BATCH_SIZE
      for (let b = 0; b < dataLines.length; b += BATCH_SIZE) {
        const batchLines = dataLines.slice(b, b + BATCH_SIZE);
        const rows: Record<string, unknown>[] = [];

        for (const line of batchLines) {
          if (!line.trim()) continue;
          const f = splitCSV(line, sep);
          const barcode = g(f, COL.code).replace(/^0+/, "") || g(f, COL.code);
          if (!barcode) { skipped++; continue; }

          const catTags = parseTags(g(f, COL.categories_tags));
          const allergenTags = parseTags(g(f, COL.allergens_tags));
          const labelTags = parseTags(g(f, COL.labels_tags));
          const ingTags = parseTags(g(f, COL.ingredients_tags));

          rows.push({
            barcode,
            name:                  g(f, COL.product_name_en) || g(f, COL.product_name),
            brand:                 g(f, COL.brands),
            quantity:              g(f, COL.quantity),
            generic_name:          g(f, COL.generic_name),
            image_front_url:       g(f, COL.image_front_url),
            image_ingredients_url: g(f, COL.image_ingredients_url),
            image_nutrition_url:   g(f, COL.image_nutrition_url),
            ingredients_text:      g(f, COL.ingredients_text),
            nutrition: {
              energy_kcal:   num(g(f, COL.energy_kcal)),
              energy_kj:     num(g(f, COL.energy_kj)),
              fat:           num(g(f, COL.fat)),
              saturated_fat: num(g(f, COL.saturated_fat)),
              carbohydrates: num(g(f, COL.carbohydrates)),
              sugars:        num(g(f, COL.sugars)),
              fiber:         num(g(f, COL.fiber)),
              proteins:      num(g(f, COL.proteins)),
              salt:          num(g(f, COL.salt)),
              sodium:        num(g(f, COL.sodium)),
            },
            allergen_tags:         allergenTags.map(normaliseTag),
            diet_tags:             [],
            label_tags:            labelTags.map(normaliseTag),
            off_categories_tags:   catTags,
            off_allergens_tags:    allergenTags,
            off_labels_tags:       labelTags,
            off_ingredients_tags:  ingTags,
            nutriscore_grade:      g(f, COL.nutriscore_grade).toLowerCase() || null,
            nova_group:            num(g(f, COL.nova_group)),
            off_id:                barcode,
            status:                "pending",
            // categorization_status is set by the DB trigger based on off_categories_tags
          });
        }

        if (!rows.length) continue;

        const { data: upserted, error: upsertErr } = await supabase
          .from("products")
          .upsert(rows, { onConflict: "barcode", ignoreDuplicates: false })
          .select("id, categorization_status");

        if (upsertErr) {
          console.error("Upsert error:", upsertErr.message);
          skipped += rows.length;
          continue;
        }

        processed += upserted?.length ?? 0;
        for (const p of upserted ?? []) {
          if (p.categorization_status === "auto_mapped") autoMapped++;
          else needsReview++;
        }
      }

      // Update job running totals
      await supabase.rpc("increment_import_job_counts", {
        p_job_id:         body.job_id,
        p_upserted:       processed,
        p_skipped:        skipped,
        p_auto_mapped:    autoMapped,
        p_needs_review:   needsReview,
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
        products_skipped:  job?.products_skipped ?? 0,
        auto_mapped:       job?.auto_mapped ?? 0,
        needs_review:      job?.needs_review ?? 0,
      });
    }

    return json({ error: "Unknown action" }, 400);

  } catch (err) {
    // If a job_id was in flight, mark it failed
    try {
      const body = await req.json().catch(() => ({})) as { job_id?: string };
      if (body.job_id) {
        const supabase2 = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
        );
        await supabase2.from("import_jobs").update({
          status: "failed",
          error_message: err instanceof Error ? err.message : String(err),
          completed_at: new Date().toISOString(),
        }).eq("id", body.job_id);
      }
    } catch { /* ignore */ }

    return json({ error: err instanceof Error ? err.message : String(err) }, 500);
  }
});

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
