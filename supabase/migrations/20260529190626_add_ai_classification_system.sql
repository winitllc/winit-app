/*
  # AI Classification System

  ## Overview
  Adds AI-powered classification infrastructure to the products table and
  creates supporting tables for the review queue and correction learning system.

  ## Changes to `products` table
  New columns added:
  - `ai_category_id` (uuid → taxonomy_parents) — AI-assigned parent category
  - `ai_subcategory_id` (uuid → taxonomy_subcategories) — AI-assigned subcategory
  - `ai_confidence` (numeric 0–1) — overall confidence score
  - `ai_category_confidence` (numeric 0–1) — category-specific confidence
  - `ai_subcategory_confidence` (numeric 0–1) — subcategory-specific confidence
  - `ai_tags` (text[]) — AI-generated diet/lifestyle tags
  - `ai_tag_confidences` (jsonb) — per-tag confidence scores
  - `ai_classification_reason` (text) — human-readable explanation
  - `ai_classified_at` (timestamptz) — when classification ran
  - `ai_model` (text) — which model/version classified it
  - `categorization_status` (text) — 'unclassified' | 'auto_mapped' | 'ai_classified' | 'needs_review' | 'reviewed'
  - `review_priority` (int) — higher = show first in review queue

  ## New Tables

  ### `ai_correction_log`
  Stores admin corrections to AI classifications. The classifier reads these
  to learn patterns and boost confidence on similar future products.
  - `id` (uuid, pk)
  - `product_id` (uuid → products)
  - `barcode` (text) — denormalized for fast lookup
  - `product_name` (text)
  - `brand` (text)
  - `off_categories_tags` (text[]) — the tags that triggered original classification
  - `original_parent_id` (uuid, nullable) — what AI picked
  - `original_subcategory_id` (uuid, nullable)
  - `original_tags` (text[])
  - `original_confidence` (numeric)
  - `corrected_parent_id` (uuid, nullable) — what admin corrected to
  - `corrected_subcategory_id` (uuid, nullable)
  - `corrected_tags` (text[])
  - `correction_type` (text) — 'category' | 'subcategory' | 'tags' | 'all'
  - `corrected_at` (timestamptz)
  - `corrected_by` (text)

  ## Security
  - RLS enabled on all new tables
  - anon role can read + write (admin panel pattern)
*/

-- ── Products: new AI classification columns ───────────────────────────────────

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_category_id') THEN
    ALTER TABLE products ADD COLUMN ai_category_id uuid REFERENCES taxonomy_parents(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_subcategory_id') THEN
    ALTER TABLE products ADD COLUMN ai_subcategory_id uuid REFERENCES taxonomy_subcategories(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_confidence') THEN
    ALTER TABLE products ADD COLUMN ai_confidence numeric(4,3) DEFAULT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_category_confidence') THEN
    ALTER TABLE products ADD COLUMN ai_category_confidence numeric(4,3) DEFAULT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_subcategory_confidence') THEN
    ALTER TABLE products ADD COLUMN ai_subcategory_confidence numeric(4,3) DEFAULT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_tags') THEN
    ALTER TABLE products ADD COLUMN ai_tags text[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_tag_confidences') THEN
    ALTER TABLE products ADD COLUMN ai_tag_confidences jsonb NOT NULL DEFAULT '{}'::jsonb;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_classification_reason') THEN
    ALTER TABLE products ADD COLUMN ai_classification_reason text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_classified_at') THEN
    ALTER TABLE products ADD COLUMN ai_classified_at timestamptz DEFAULT NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='ai_model') THEN
    ALTER TABLE products ADD COLUMN ai_model text NOT NULL DEFAULT '';
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='categorization_status') THEN
    ALTER TABLE products ADD COLUMN categorization_status text NOT NULL DEFAULT 'unclassified'
      CHECK (categorization_status IN ('unclassified','auto_mapped','ai_classified','needs_review','reviewed'));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='products' AND column_name='review_priority') THEN
    ALTER TABLE products ADD COLUMN review_priority int NOT NULL DEFAULT 0;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS products_categorization_status_idx ON products (categorization_status);
CREATE INDEX IF NOT EXISTS products_ai_confidence_idx ON products (ai_confidence);
CREATE INDEX IF NOT EXISTS products_review_priority_idx ON products (review_priority DESC);

-- ── AI correction log ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ai_correction_log (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id            uuid REFERENCES products(id) ON DELETE SET NULL,
  barcode               text NOT NULL DEFAULT '',
  product_name          text NOT NULL DEFAULT '',
  brand                 text NOT NULL DEFAULT '',
  off_categories_tags   text[] NOT NULL DEFAULT '{}',
  ingredients_text      text NOT NULL DEFAULT '',
  original_parent_id    uuid REFERENCES taxonomy_parents(id) ON DELETE SET NULL,
  original_subcategory_id uuid REFERENCES taxonomy_subcategories(id) ON DELETE SET NULL,
  original_tags         text[] NOT NULL DEFAULT '{}',
  original_confidence   numeric(4,3),
  corrected_parent_id   uuid REFERENCES taxonomy_parents(id) ON DELETE SET NULL,
  corrected_subcategory_id uuid REFERENCES taxonomy_subcategories(id) ON DELETE SET NULL,
  corrected_tags        text[] NOT NULL DEFAULT '{}',
  correction_type       text NOT NULL DEFAULT 'all'
    CHECK (correction_type IN ('category','subcategory','tags','all')),
  corrected_at          timestamptz NOT NULL DEFAULT now(),
  corrected_by          text NOT NULL DEFAULT 'admin'
);

CREATE INDEX IF NOT EXISTS ai_correction_log_barcode_idx ON ai_correction_log (barcode);
CREATE INDEX IF NOT EXISTS ai_correction_log_parent_idx  ON ai_correction_log (corrected_parent_id);

ALTER TABLE ai_correction_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read correction log"
  ON ai_correction_log FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Anon can insert correction log"
  ON ai_correction_log FOR INSERT TO anon WITH CHECK (true);

CREATE POLICY "Anon can update correction log"
  ON ai_correction_log FOR UPDATE TO anon USING (true) WITH CHECK (true);
