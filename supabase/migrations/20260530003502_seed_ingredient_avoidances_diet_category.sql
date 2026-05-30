/*
  # Add Ingredient Avoidances diet category and items

  Adds a new "Ingredient Avoidances" category to winit_diet_categories and seeds
  five items that users can select to flag specific ingredient types they want to avoid.

  1. New Category
    - `ingredient_avoidances` in winit_diet_categories

  2. New Diet Items (in winit_diets)
    - `avoid_seed_oils`          — Seed Oils (canola, soybean, sunflower, etc.)
    - `avoid_artificial_sweeteners` — Artificial Sweeteners (aspartame, sucralose, etc.)
    - `avoid_artificial_colors`  — Artificial Colors (Red 40, Yellow 5, etc.)
    - `avoid_msg`                — MSG / Monosodium Glutamate
    - `avoid_hfcs`               — High Fructose Corn Syrup

  These appear in the "Do you follow any diets?" step of profile setup so users
  can flag ingredient preferences beyond formal dietary patterns.
*/

INSERT INTO winit_diet_categories (id, label, icon, sort_order)
VALUES ('ingredient_avoidances', 'Ingredient Avoidances', '🚫', 5)
ON CONFLICT (id) DO NOTHING;

INSERT INTO winit_diets (id, category_id, label, keywords, description, sort_order)
VALUES
  (
    'avoid_seed_oils',
    'ingredient_avoidances',
    'Seed Oils',
    ARRAY[
      'canola oil', 'canola', 'rapeseed oil', 'rapeseed',
      'soybean oil', 'soya oil',
      'sunflower oil', 'sunflower seed oil',
      'corn oil', 'maize oil',
      'cottonseed oil', 'cotton seed oil',
      'grapeseed oil', 'grape seed oil',
      'safflower oil',
      'rice bran oil',
      'vegetable oil', 'vegetable fat',
      'partially hydrogenated oil', 'partially hydrogenated vegetable oil',
      'hydrogenated oil', 'hydrogenated vegetable oil',
      'interesterified oil', 'interesterified fat',
      'margarine', 'shortening'
    ],
    'Avoid industrially processed seed and vegetable oils high in omega-6 polyunsaturated fats.',
    10
  ),
  (
    'avoid_artificial_sweeteners',
    'ingredient_avoidances',
    'Artificial Sweeteners',
    ARRAY[
      'aspartame', 'equal', 'nutrasweet', 'aminosweet',
      'sucralose', 'splenda',
      'saccharin', 'sweet''n low',
      'acesulfame potassium', 'acesulfame-k', 'ace-k', 'sunett', 'sweet one',
      'neotame',
      'advantame',
      'cyclamate',
      'alitame',
      'artificial sweetener',
      'sugar substitute',
      'steviol glycosides', 'rebaudioside', 'reb a', 'reb-a',
      'monk fruit extract', 'lo han guo',
      'erythritol', 'xylitol', 'sorbitol', 'mannitol', 'maltitol', 'isomalt', 'lactitol',
      'sugar alcohol',
      'polydextrose'
    ],
    'Avoid artificial and non-nutritive sweeteners used as sugar replacements.',
    11
  ),
  (
    'avoid_artificial_colors',
    'ingredient_avoidances',
    'Artificial Colors',
    ARRAY[
      'red 40', 'allura red', 'fd&c red 40', 'e129',
      'red 3', 'erythrosine', 'fd&c red 3', 'e127',
      'yellow 5', 'tartrazine', 'fd&c yellow 5', 'e102',
      'yellow 6', 'sunset yellow', 'fd&c yellow 6', 'e110',
      'blue 1', 'brilliant blue', 'fd&c blue 1', 'e133',
      'blue 2', 'indigo carmine', 'fd&c blue 2', 'e132',
      'green 3', 'fast green', 'fd&c green 3', 'e143',
      'artificial color', 'artificial colour',
      'artificial food color', 'artificial food dye',
      'food dye', 'food coloring', 'food colouring',
      'caramel color', 'caramel colour',
      'annatto', 'beta-carotene',
      'titanium dioxide', 'e171',
      'cochineal', 'carmine', 'e120'
    ],
    'Avoid synthetic dyes and artificial colorings added to food.',
    12
  ),
  (
    'avoid_msg',
    'ingredient_avoidances',
    'MSG',
    ARRAY[
      'monosodium glutamate', 'msg',
      'glutamate', 'glutamic acid',
      'monopotassium glutamate',
      'calcium glutamate', 'magnesium glutamate',
      'autolyzed yeast', 'autolyzed yeast extract',
      'yeast extract',
      'hydrolyzed protein', 'hydrolyzed vegetable protein', 'hvp',
      'hydrolyzed soy protein', 'hydrolyzed corn protein', 'hydrolyzed wheat protein',
      'sodium caseinate', 'calcium caseinate',
      'textured protein', 'textured vegetable protein',
      'natural flavors', 'natural flavoring',
      'soy sauce', 'soy extract',
      'miso', 'bouillon', 'broth', 'stock',
      'carrageenan', 'enzymes',
      'e621', 'e622', 'e623', 'e624', 'e625'
    ],
    'Avoid monosodium glutamate and related glutamate-based flavor enhancers.',
    13
  ),
  (
    'avoid_hfcs',
    'ingredient_avoidances',
    'High Fructose Corn Syrup',
    ARRAY[
      'high fructose corn syrup', 'hfcs',
      'high-fructose corn syrup',
      'corn syrup', 'corn syrup solids',
      'glucose-fructose syrup', 'glucose fructose syrup',
      'fructose-glucose syrup', 'fructose glucose syrup',
      'isoglucose',
      'fruit fructose',
      'crystalline fructose',
      'corn sweetener'
    ],
    'Avoid high fructose corn syrup and related corn-derived sweeteners.',
    14
  )
ON CONFLICT (id) DO NOTHING;
