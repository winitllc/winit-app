import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const BATCH_SIZE = 500;

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

function str(s: string | undefined): string { return (s ?? "").trim(); }

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
          source: "csv",
          filename: body.filename ?? "images.csv",
          status: "running",
          category_slug: "image-patch",
          off_tag: "image-patch",
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

      const lines = body.chunk.split("\n");
      const sep = (body.header ?? lines[0] ?? "").includes("\t") ? "\t" : ",";

      let headerLine = body.header ?? "";
      let dataLines = lines;
      if (!headerLine) {
        const first = lines[0]?.toLowerCase() ?? "";
        if (first.startsWith("code") || first.startsWith("barcode") || first.startsWith("ean")) {
          headerLine = lines[0];
          dataLines = lines.slice(1);
        } else {
          return json({ error: "No header found and none provided" }, 400);
        }
      }

      const headers = splitLine(headerLine, sep).map(h => h.toLowerCase().trim());
      const idx = (...names: string[]) => {
        for (const n of names) { const i = headers.indexOf(n); if (i >= 0) return i; }
        return -1;
      };

      const C = {
        code: idx("code", "barcode", "ean", "ean13", "upc"),
        image_front_url: idx("image_front_url", "image_url"),
        image_ingredients_url: idx("image_ingredients_url"),
        image_nutrition_url: idx("image_nutrition_url"),
      };

      if (C.code < 0) return json({ error: "CSV must have a 'code' or 'barcode' column" }, 400);

      // Collect image updates keyed by barcode
      const patches: Record<string, Record<string, string>> = {};
      for (const line of dataLines) {
        if (!line.trim()) continue;
        const f = splitLine(line, sep);
        const barcode = str(f[C.code]);
        if (!barcode) continue;

        const patch: Record<string, string> = {};
        if (C.image_front_url >= 0 && str(f[C.image_front_url])) patch.image_front_url = str(f[C.image_front_url]);
        if (C.image_ingredients_url >= 0 && str(f[C.image_ingredients_url])) patch.image_ingredients_url = str(f[C.image_ingredients_url]);
        if (C.image_nutrition_url >= 0 && str(f[C.image_nutrition_url])) patch.image_nutrition_url = str(f[C.image_nutrition_url]);
        if (Object.keys(patch).length > 0) patches[barcode] = patch;
      }

      const barcodes = Object.keys(patches);
      let updated = 0;
      let skipped = 0;

      for (let b = 0; b < barcodes.length; b += BATCH_SIZE) {
        const batch = barcodes.slice(b, b + BATCH_SIZE);

        // Fetch existing products for this batch
        const { data: existing } = await supabase
          .from("products")
          .select("id, barcode")
          .in("barcode", batch);

        if (!existing?.length) {
          skipped += batch.length;
          continue;
        }

        // Group products by their patch contents — update products sharing the same
        // image URLs together to minimise round-trips.
        const patchGroups = new Map<string, string[]>();
        for (const product of existing) {
          const patch = patches[product.barcode];
          if (!patch) { skipped++; continue; }
          const key = JSON.stringify(patch);
          if (!patchGroups.has(key)) patchGroups.set(key, []);
          patchGroups.get(key)!.push(product.id);
        }

        for (const [patchKey, ids] of patchGroups) {
          const patch = JSON.parse(patchKey) as Record<string, string>;
          patch.updated_at = new Date().toISOString();

          const { error } = await supabase
            .from("products")
            .update(patch)
            .in("id", ids);

          if (error) {
            console.error("Image patch error:", error.message);
          } else {
            updated += ids.length;
          }
        }

        skipped += batch.length - (existing?.length ?? 0);
      }

      await supabase.rpc("increment_import_job_counts", {
        p_job_id: body.job_id,
        p_upserted: updated,
        p_skipped: skipped,
        p_auto_mapped: 0,
        p_needs_review: 0,
      });

      return json({ processed: updated, skipped });
    }

    // ── finish_job ───────────────────────────────────────────────────────────
    if (body.action === "finish_job") {
      if (!body.job_id) return json({ error: "job_id required" }, 400);
      const { data: job } = await supabase
        .from("import_jobs")
        .update({ status: "completed", completed_at: new Date().toISOString() })
        .eq("id", body.job_id)
        .select("products_upserted, products_skipped")
        .single();
      return json({
        job_id: body.job_id,
        products_upserted: job?.products_upserted ?? 0,
        products_skipped: job?.products_skipped ?? 0,
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
