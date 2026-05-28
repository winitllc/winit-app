import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Fields we request from OpenFoodFacts — keeps payloads small
const OFF_FIELDS = [
  "code", "id", "product_name", "product_name_en", "brands", "quantity", "generic_name",
  "image_front_url", "image_ingredients_url", "image_nutrition_url",
  "categories_tags", "labels_tags", "allergens_tags", "ingredients_tags",
  "ingredients_text", "nutriments",
  "nutriscore_grade", "nova_group",
].join(",");

const OFF_BASE = "https://us.openfoodfacts.org";
const PAGE_SIZE = 50;
const MAX_PAGES = 20; // safety cap per run — call again to import more

// Normalise an allergen tag like "en:gluten" → "gluten"
function normaliseTag(tag: string): string {
  return tag.replace(/^[a-z]{2}:/, "").toLowerCase().trim();
}

// Map OFF nutrients to a clean nutrition jsonb
function mapNutrition(nutriments: Record<string, unknown>): Record<string, unknown> {
  const pick = (key: string) => nutriments?.[key] ?? null;
  return {
    energy_kcal:     pick("energy-kcal_100g"),
    energy_kj:       pick("energy-kj_100g"),
    fat:             pick("fat_100g"),
    saturated_fat:   pick("saturated-fat_100g"),
    carbohydrates:   pick("carbohydrates_100g"),
    sugars:          pick("sugars_100g"),
    fiber:           pick("fiber_100g"),
    proteins:        pick("proteins_100g"),
    salt:            pick("salt_100g"),
    sodium:          pick("sodium_100g"),
    cholesterol:     pick("cholesterol_100g"),
    vitamin_a:       pick("vitamin-a_100g"),
    vitamin_c:       pick("vitamin-c_100g"),
    vitamin_d:       pick("vitamin-d_100g"),
    calcium:         pick("calcium_100g"),
    iron:            pick("iron_100g"),
    potassium:       pick("potassium_100g"),
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
      start_page?: number;
      max_pages?: number;
    };

    const { category_slug, off_tag, start_page = 1, max_pages = MAX_PAGES } = body;

    if (!category_slug || !off_tag) {
      return new Response(
        JSON.stringify({ error: "category_slug and off_tag are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Look up the category so we can link products to it
    const { data: category } = await supabase
      .from("app_categories")
      .select("id")
      .eq("slug", category_slug)
      .maybeSingle();

    if (!category) {
      return new Response(
        JSON.stringify({ error: `Category '${category_slug}' not found` }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Record the import job
    const { data: job } = await supabase
      .from("import_jobs")
      .insert({ category_slug, off_tag, status: "running" })
      .select("id")
      .single();

    const jobId: string = job?.id;
    let totalUpserted = 0;
    let pagesImported = 0;
    let errorMessage = "";

    try {
      for (let page = start_page; page < start_page + max_pages; page++) {
        const url = new URL(`${OFF_BASE}/api/v2/search`);
        url.searchParams.set("categories_tags", off_tag);
        url.searchParams.set("fields", OFF_FIELDS);
        url.searchParams.set("page_size", String(PAGE_SIZE));
        url.searchParams.set("page", String(page));

        const res = await fetch(url.toString(), {
          headers: { "User-Agent": "What's In It/1.0 - (info@winitclinic.com)" },
        });

        if (!res.ok) {
          throw new Error(`OFF responded ${res.status} on page ${page}`);
        }

        const data = await res.json() as {
          count: number;
          page_count: number;
          products: Array<Record<string, unknown>>;
        };

        const offProducts = data.products ?? [];
        if (!offProducts.length) break;

        // Upsert products
        const rows = offProducts.map((p: Record<string, unknown>) => ({
          barcode:               String(p.code ?? ""),
          name:                  String(p.product_name_en ?? p.product_name ?? ""),
          brand:                 String(p.brands ?? ""),
          quantity:              String(p.quantity ?? ""),
          generic_name:          String(p.generic_name ?? ""),
          image_front_url:       String(p.image_front_url ?? ""),
          image_ingredients_url: String(p.image_ingredients_url ?? ""),
          image_nutrition_url:   String(p.image_nutrition_url ?? ""),
          ingredients_text:      String(p.ingredients_text ?? ""),
          nutrition:             mapNutrition((p.nutriments ?? {}) as Record<string, unknown>),
          allergen_tags:         ((p.allergens_tags ?? []) as string[]).map(normaliseTag),
          diet_tags:             [],  // admin fills this in during review
          label_tags:            ((p.labels_tags ?? []) as string[]).map(normaliseTag),
          off_categories_tags:   (p.categories_tags ?? []) as string[],
          off_allergens_tags:    (p.allergens_tags ?? []) as string[],
          off_labels_tags:       (p.labels_tags ?? []) as string[],
          off_ingredients_tags:  (p.ingredients_tags ?? []) as string[],
          nutriscore_grade:      String(p.nutriscore_grade ?? ""),
          nova_group:            p.nova_group != null ? Number(p.nova_group) : null,
          off_id:                String(p.code ?? ""),
          status:                "pending",
        })).filter(r => r.barcode);

        if (!rows.length) break;

        const { data: upserted, error: upsertErr } = await supabase
          .from("products")
          .upsert(rows, { onConflict: "barcode", ignoreDuplicates: false })
          .select("id, barcode");

        if (upsertErr) throw new Error(`Upsert error: ${upsertErr.message}`);

        // Link each product to this category
        if (upserted?.length) {
          const categoryLinks = upserted.map((prod: { id: string }) => ({
            product_id:  prod.id,
            category_id: category.id,
          }));
          await supabase
            .from("product_categories")
            .upsert(categoryLinks, { onConflict: "product_id,category_id", ignoreDuplicates: true });
        }

        totalUpserted += rows.length;
        pagesImported += 1;

        console.log(`import-products: page=${page} upserted=${rows.length} total=${totalUpserted}`);

        // Stop if we've reached the last page
        if (page >= (data.page_count ?? 1)) break;
      }

      // Mark job complete
      await supabase
        .from("import_jobs")
        .update({ status: "completed", pages_imported: pagesImported, products_upserted: totalUpserted, completed_at: new Date().toISOString() })
        .eq("id", jobId);

    } catch (err) {
      errorMessage = err instanceof Error ? err.message : String(err);
      await supabase
        .from("import_jobs")
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
