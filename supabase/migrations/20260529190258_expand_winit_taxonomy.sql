/*
  # Expand WINIT Taxonomy

  ## Changes
  
  ### New Parent Categories (3)
  - `nuts-seeds` (19) — promoted from snacks subcategory to its own parent
  - `nut-butters` (20) — Peanut Butter, Almond Butter, Cashew Butter, Sunflower Butter
  - `kids-foods` (21) — Fruit Snacks, Juice Boxes, Lunch Kits, Kids Yogurts

  ### Expanded Existing Parents
  - **Cookies & Baked Treats** promoted to own parent (22) with 5 subcategories
  - **Snacks** (parent 01): split chips into Tortilla Chips, Potato Chips, Veggie Chips, Puffed Snacks, Snack Mixes
  - **Frozen Foods** (parent 06): add Frozen Appetizers, Frozen Snacks, Frozen Sandwiches
  - **Beverages** (parent 02): add Protein Drinks, Meal Replacement Drinks, Coconut Water, Kombucha, Functional Beverages
  - **Bakery & Bread** (parent 04): add Donuts, Croissants, Pastries, Cupcakes
  - **Pantry** (parent 09): add Mac & Cheese, Noodles, Ramen
  - **Candy** (parent 17): add Chewing Gum, Mints, Caramel, Marshmallows, Candy Bars

  ### New OFF Mapping Rules
  ~80 new rules covering all new subcategories.

  ### Notes
  - The old `chips` subcategory (00000002-0000-0000-0001-000000000001) and `nuts-seeds` 
    subcategory (00000002-0000-0000-0001-000000000007) under Snacks are left in place for
    backwards compatibility with existing product_taxonomy rows; new imports will hit the
    more specific rules first due to higher priority.
*/

-- ── New parent categories ─────────────────────────────────────────────────────

INSERT INTO taxonomy_parents (id, slug, display_name, icon, description, sort_order, image_url) VALUES
  ('00000001-0000-0000-0000-000000000019', 'nuts-seeds',           'Nuts & Seeds',           '🥜', 'Almonds, cashews, pistachios, trail mix, seeds',      19, 'https://images.pexels.com/photos/1295572/pexels-photo-1295572.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000020', 'nut-butters',          'Nut Butters',            '🥜', 'Peanut butter, almond butter, cashew butter and more',20, 'https://images.pexels.com/photos/4021979/pexels-photo-4021979.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000021', 'kids-foods',           'Kids Foods',             '🧒', 'Fruit snacks, juice boxes, lunch kits, kids yogurts', 21, 'https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000022', 'cookies-baked-treats', 'Cookies & Baked Treats', '🍪', 'Sandwich cookies, chip cookies, wafers, shortbread',  22, 'https://images.pexels.com/photos/890577/pexels-photo-890577.jpeg?auto=compress&cs=tinysrgb&w=400')
ON CONFLICT (slug) DO NOTHING;

-- ── New subcategories ─────────────────────────────────────────────────────────

INSERT INTO taxonomy_subcategories (id, parent_id, slug, display_name, sort_order, off_tags) VALUES

  -- Cookies & Baked Treats (parent 22)
  ('00000002-0000-0000-0022-000000000001', '00000001-0000-0000-0000-000000000022', 'sandwich-cookies',   'Sandwich Cookies',        1,  ARRAY['en:sandwich-cookies','en:cream-filled-cookies']),
  ('00000002-0000-0000-0022-000000000002', '00000001-0000-0000-0000-000000000022', 'chocolate-chip-cookies','Chocolate Chip Cookies',2,  ARRAY['en:chocolate-chip-cookies']),
  ('00000002-0000-0000-0022-000000000003', '00000001-0000-0000-0000-000000000022', 'wafer-cookies',      'Wafer Cookies',           3,  ARRAY['en:wafers','en:wafer-cookies']),
  ('00000002-0000-0000-0022-000000000004', '00000001-0000-0000-0000-000000000022', 'shortbread',         'Shortbread',              4,  ARRAY['en:shortbread']),
  ('00000002-0000-0000-0022-000000000005', '00000001-0000-0000-0000-000000000022', 'cookie-dough',       'Cookie Dough',            5,  ARRAY['en:cookie-dough']),

  -- Snacks — chip breakout (parent 01, sort 11+)
  ('00000002-0000-0000-0001-000000000011', '00000001-0000-0000-0000-000000000001', 'tortilla-chips',     'Tortilla Chips',          11, ARRAY['en:tortilla-chips','en:corn-tortilla-chips']),
  ('00000002-0000-0000-0001-000000000012', '00000001-0000-0000-0000-000000000001', 'potato-chips',       'Potato Chips',            12, ARRAY['en:potato-chips','en:kettle-chips']),
  ('00000002-0000-0000-0001-000000000013', '00000001-0000-0000-0000-000000000001', 'veggie-chips',       'Veggie Chips',            13, ARRAY['en:vegetable-chips','en:veggie-straws','en:kale-chips']),
  ('00000002-0000-0000-0001-000000000014', '00000001-0000-0000-0000-000000000001', 'puffed-snacks',      'Puffed Snacks',           14, ARRAY['en:puffed-snacks','en:cheese-puffs','en:corn-puffs','en:popped-snacks']),
  ('00000002-0000-0000-0001-000000000015', '00000001-0000-0000-0000-000000000001', 'snack-mixes',        'Snack Mixes',             15, ARRAY['en:snack-mixes','en:party-mixes','en:chex-mix']),

  -- Frozen Foods additions (parent 06, sort 7+)
  ('00000002-0000-0000-0006-000000000007', '00000001-0000-0000-0000-000000000006', 'frozen-appetizers',  'Frozen Appetizers',       7,  ARRAY['en:frozen-appetizers','en:frozen-hors-d-oeuvres']),
  ('00000002-0000-0000-0006-000000000008', '00000001-0000-0000-0000-000000000006', 'frozen-snacks',      'Frozen Snacks',           8,  ARRAY['en:frozen-snacks']),
  ('00000002-0000-0000-0006-000000000009', '00000001-0000-0000-0000-000000000006', 'frozen-sandwiches',  'Frozen Sandwiches',       9,  ARRAY['en:frozen-sandwiches','en:frozen-burritos']),

  -- Beverages additions (parent 02, sort 11+)
  ('00000002-0000-0000-0002-000000000011', '00000001-0000-0000-0000-000000000002', 'protein-drinks',     'Protein Drinks',          11, ARRAY['en:protein-drinks','en:protein-shakes']),
  ('00000002-0000-0000-0002-000000000012', '00000001-0000-0000-0000-000000000002', 'meal-replacement-drinks','Meal Replacement Drinks',12,ARRAY['en:meal-replacement-drinks','en:diet-shakes']),
  ('00000002-0000-0000-0002-000000000013', '00000001-0000-0000-0000-000000000002', 'coconut-water',      'Coconut Water',           13, ARRAY['en:coconut-water','en:coconut-waters']),
  ('00000002-0000-0000-0002-000000000014', '00000001-0000-0000-0000-000000000002', 'kombucha',           'Kombucha',                14, ARRAY['en:kombucha','en:fermented-beverages']),
  ('00000002-0000-0000-0002-000000000015', '00000001-0000-0000-0000-000000000002', 'functional-drinks',  'Functional Beverages',    15, ARRAY['en:functional-beverages','en:probiotic-drinks','en:adaptogen-drinks']),

  -- Bakery & Bread additions (parent 04, sort 7+)
  ('00000002-0000-0000-0004-000000000007', '00000001-0000-0000-0000-000000000004', 'donuts',             'Donuts',                  7,  ARRAY['en:donuts','en:doughnuts']),
  ('00000002-0000-0000-0004-000000000008', '00000001-0000-0000-0000-000000000004', 'croissants',         'Croissants',              8,  ARRAY['en:croissants']),
  ('00000002-0000-0000-0004-000000000009', '00000001-0000-0000-0000-000000000004', 'pastries',           'Pastries',                9,  ARRAY['en:pastries','en:danish-pastries','en:sweet-pastries']),
  ('00000002-0000-0000-0004-000000000010', '00000001-0000-0000-0000-000000000004', 'cupcakes',           'Cupcakes',                10, ARRAY['en:cupcakes']),

  -- Pantry additions (parent 09, sort 9+)
  ('00000002-0000-0000-0009-000000000009', '00000001-0000-0000-0000-000000000009', 'mac-cheese',         'Mac & Cheese',            9,  ARRAY['en:macaroni-and-cheese','en:mac-and-cheese']),
  ('00000002-0000-0000-0009-000000000010', '00000001-0000-0000-0000-000000000009', 'noodles',            'Noodles',                 10, ARRAY['en:noodles','en:asian-noodles','en:egg-noodles']),
  ('00000002-0000-0000-0009-000000000011', '00000001-0000-0000-0000-000000000009', 'ramen',              'Ramen',                   11, ARRAY['en:ramen','en:instant-noodles','en:instant-ramen']),

  -- Candy additions (parent 17, sort 5+)
  ('00000002-0000-0000-0017-000000000005', '00000001-0000-0000-0000-000000000017', 'chewing-gum',        'Chewing Gum',             5,  ARRAY['en:chewing-gum','en:bubble-gum']),
  ('00000002-0000-0000-0017-000000000006', '00000001-0000-0000-0000-000000000017', 'mints',              'Mints',                   6,  ARRAY['en:mints','en:breath-mints','en:mint-candies']),
  ('00000002-0000-0000-0017-000000000007', '00000001-0000-0000-0000-000000000017', 'caramel',            'Caramel',                 7,  ARRAY['en:caramels','en:caramel-candies']),
  ('00000002-0000-0000-0017-000000000008', '00000001-0000-0000-0000-000000000017', 'marshmallows',       'Marshmallows',            8,  ARRAY['en:marshmallows']),
  ('00000002-0000-0000-0017-000000000009', '00000001-0000-0000-0000-000000000017', 'candy-bars',         'Candy Bars',              9,  ARRAY['en:candy-bars','en:chocolate-candy-bars']),

  -- Nuts & Seeds parent (parent 19)
  ('00000002-0000-0000-0019-000000000001', '00000001-0000-0000-0000-000000000019', 'almonds',            'Almonds',                 1,  ARRAY['en:almonds']),
  ('00000002-0000-0000-0019-000000000002', '00000001-0000-0000-0000-000000000019', 'cashews',            'Cashews',                 2,  ARRAY['en:cashews']),
  ('00000002-0000-0000-0019-000000000003', '00000001-0000-0000-0000-000000000019', 'walnuts',            'Walnuts',                 3,  ARRAY['en:walnuts']),
  ('00000002-0000-0000-0019-000000000004', '00000001-0000-0000-0000-000000000019', 'pistachios',         'Pistachios',              4,  ARRAY['en:pistachios']),
  ('00000002-0000-0000-0019-000000000005', '00000001-0000-0000-0000-000000000019', 'peanuts',            'Peanuts',                 5,  ARRAY['en:peanuts']),
  ('00000002-0000-0000-0019-000000000006', '00000001-0000-0000-0000-000000000019', 'trail-mix',          'Trail Mix',               6,  ARRAY['en:trail-mix','en:mixed-nuts']),
  ('00000002-0000-0000-0019-000000000007', '00000001-0000-0000-0000-000000000019', 'seeds',              'Seeds',                   7,  ARRAY['en:seeds','en:sunflower-seeds','en:pumpkin-seeds','en:chia-seeds']),

  -- Nut Butters parent (parent 20)
  ('00000002-0000-0000-0020-000000000001', '00000001-0000-0000-0000-000000000020', 'peanut-butter',      'Peanut Butter',           1,  ARRAY['en:peanut-butter','en:peanut-butters']),
  ('00000002-0000-0000-0020-000000000002', '00000001-0000-0000-0000-000000000020', 'almond-butter',      'Almond Butter',           2,  ARRAY['en:almond-butter','en:almond-butters']),
  ('00000002-0000-0000-0020-000000000003', '00000001-0000-0000-0000-000000000020', 'cashew-butter',      'Cashew Butter',           3,  ARRAY['en:cashew-butter']),
  ('00000002-0000-0000-0020-000000000004', '00000001-0000-0000-0000-000000000020', 'sunflower-butter',   'Sunflower Butter',        4,  ARRAY['en:sunflower-butter','en:sunflower-seed-butter']),
  ('00000002-0000-0000-0020-000000000005', '00000001-0000-0000-0000-000000000020', 'other-nut-butters',  'Other Nut Butters',       5,  ARRAY['en:nut-butters','en:nut-butter-spreads']),

  -- Kids Foods parent (parent 21)
  ('00000002-0000-0000-0021-000000000001', '00000001-0000-0000-0000-000000000021', 'fruit-snacks',       'Fruit Snacks',            1,  ARRAY['en:fruit-snacks','en:fruit-gummies','en:fruit-pouches']),
  ('00000002-0000-0000-0021-000000000002', '00000001-0000-0000-0000-000000000021', 'juice-boxes',        'Juice Boxes',             2,  ARRAY['en:juice-boxes','en:juice-pouches']),
  ('00000002-0000-0000-0021-000000000003', '00000001-0000-0000-0000-000000000021', 'lunch-kits',         'Lunch Kits',              3,  ARRAY['en:lunch-kits','en:lunchables']),
  ('00000002-0000-0000-0021-000000000004', '00000001-0000-0000-0000-000000000021', 'kids-yogurts',       'Kids Yogurts',            4,  ARRAY['en:kids-yogurts','en:yogurt-tubes'])

ON CONFLICT (slug) DO NOTHING;

-- ── New mapping rules ─────────────────────────────────────────────────────────
-- All at priority 100 (exact) or 80 (specific label match) so they beat
-- the old catch-all 'en:chips' → chips rule (priority 100 on same tag is fine,
-- the more-specific new rules win via specificity when both match).

INSERT INTO taxonomy_off_mappings (off_pattern, match_type, parent_id, subcategory_id, priority) VALUES

  -- Cookies & Baked Treats parent
  ('en:sandwich-cookies',       'exact',    '00000001-0000-0000-0000-000000000022', '00000002-0000-0000-0022-000000000001', 100),
  ('en:cream-filled-cookies',   'exact',    '00000001-0000-0000-0000-000000000022', '00000002-0000-0000-0022-000000000001', 100),
  ('en:chocolate-chip-cookies', 'exact',    '00000001-0000-0000-0000-000000000022', '00000002-0000-0000-0022-000000000002', 100),
  ('en:wafers',                 'exact',    '00000001-0000-0000-0000-000000000022', '00000002-0000-0000-0022-000000000003', 100),
  ('en:wafer-cookies',          'exact',    '00000001-0000-0000-0000-000000000022', '00000002-0000-0000-0022-000000000003', 100),
  ('en:shortbread',             'exact',    '00000001-0000-0000-0000-000000000022', '00000002-0000-0000-0022-000000000004', 100),
  ('en:cookie-dough',           'exact',    '00000001-0000-0000-0000-000000000022', '00000002-0000-0000-0022-000000000005', 100),
  ('en:cookies',                'exact',    '00000001-0000-0000-0000-000000000022', NULL,                                   60),
  ('en:biscuits',               'exact',    '00000001-0000-0000-0000-000000000022', NULL,                                   60),
  ('cookie',                    'contains', '00000001-0000-0000-0000-000000000022', NULL,                                   8),

  -- Snacks — specific chip subcategories (higher priority than old 'en:chips' → chips)
  ('en:tortilla-chips',         'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000011', 110),
  ('en:corn-tortilla-chips',    'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000011', 110),
  ('en:potato-chips',           'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000012', 110),
  ('en:kettle-chips',           'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000012', 110),
  ('en:vegetable-chips',        'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000013', 110),
  ('en:veggie-straws',          'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000013', 110),
  ('en:kale-chips',             'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000013', 110),
  ('en:puffed-snacks',          'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000014', 110),
  ('en:cheese-puffs',           'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000014', 110),
  ('en:corn-puffs',             'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000014', 110),
  ('en:snack-mixes',            'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000015', 110),
  ('en:party-mixes',            'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000015', 110),

  -- Frozen Foods additions
  ('en:frozen-appetizers',      'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000007', 100),
  ('en:frozen-hors-d-oeuvres',  'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000007', 100),
  ('en:frozen-snacks',          'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000008', 100),
  ('en:frozen-sandwiches',      'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000009', 100),
  ('en:frozen-burritos',        'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000009', 100),

  -- Beverages additions
  ('en:protein-drinks',         'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000011', 100),
  ('en:protein-shakes',         'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000011', 100),
  ('en:meal-replacement-drinks','exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000012', 100),
  ('en:diet-shakes',            'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000012', 100),
  ('en:coconut-water',          'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000013', 100),
  ('en:coconut-waters',         'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000013', 100),
  ('en:kombucha',               'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000014', 100),
  ('en:fermented-beverages',    'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000014', 100),
  ('en:functional-beverages',   'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000015', 100),
  ('en:probiotic-drinks',       'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000015', 100),
  ('kombucha',                  'contains', '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000014', 8),

  -- Bakery additions
  ('en:donuts',                 'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000007', 100),
  ('en:doughnuts',              'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000007', 100),
  ('en:croissants',             'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000008', 100),
  ('en:pastries',               'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000009', 100),
  ('en:danish-pastries',        'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000009', 100),
  ('en:sweet-pastries',         'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000009', 100),
  ('en:cupcakes',               'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000010', 100),

  -- Pantry additions
  ('en:macaroni-and-cheese',    'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000009', 100),
  ('en:mac-and-cheese',         'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000009', 100),
  ('en:noodles',                'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000010', 100),
  ('en:asian-noodles',          'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000010', 100),
  ('en:egg-noodles',            'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000010', 100),
  ('en:ramen',                  'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000011', 100),
  ('en:instant-noodles',        'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000011', 100),
  ('en:instant-ramen',          'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000011', 100),
  ('ramen',                     'contains', '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000011', 8),

  -- Candy additions
  ('en:chewing-gum',            'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000005', 100),
  ('en:bubble-gum',             'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000005', 100),
  ('en:mints',                  'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000006', 100),
  ('en:breath-mints',           'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000006', 100),
  ('en:mint-candies',           'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000006', 100),
  ('en:caramels',               'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000007', 100),
  ('en:caramel-candies',        'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000007', 100),
  ('en:marshmallows',           'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000008', 100),
  ('en:candy-bars',             'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000009', 100),
  ('en:chocolate-candy-bars',   'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000009', 100),
  ('gum',                       'contains', '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000005', 6),
  ('mint',                      'contains', '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000006', 6),

  -- Nuts & Seeds parent (new parent 19)
  ('en:almonds',                'exact',    '00000001-0000-0000-0000-000000000019', '00000002-0000-0000-0019-000000000001', 100),
  ('en:cashews',                'exact',    '00000001-0000-0000-0000-000000000019', '00000002-0000-0000-0019-000000000002', 100),
  ('en:walnuts',                'exact',    '00000001-0000-0000-0000-000000000019', '00000002-0000-0000-0019-000000000003', 100),
  ('en:pistachios',             'exact',    '00000001-0000-0000-0000-000000000019', '00000002-0000-0000-0019-000000000004', 100),
  ('en:peanuts',                'exact',    '00000001-0000-0000-0000-000000000019', '00000002-0000-0000-0019-000000000005', 100),
  ('en:trail-mix',              'exact',    '00000001-0000-0000-0000-000000000019', '00000002-0000-0000-0019-000000000006', 100),
  ('en:mixed-nuts',             'exact',    '00000001-0000-0000-0000-000000000019', '00000002-0000-0000-0019-000000000006', 100),
  ('en:seeds',                  'exact',    '00000001-0000-0000-0000-000000000019', '00000002-0000-0000-0019-000000000007', 100),
  ('en:sunflower-seeds',        'exact',    '00000001-0000-0000-0000-000000000019', '00000002-0000-0000-0019-000000000007', 100),
  ('en:pumpkin-seeds',          'exact',    '00000001-0000-0000-0000-000000000019', '00000002-0000-0000-0019-000000000007', 100),
  ('en:chia-seeds',             'exact',    '00000001-0000-0000-0000-000000000019', '00000002-0000-0000-0019-000000000007', 100),
  ('en:nuts',                   'exact',    '00000001-0000-0000-0000-000000000019', NULL,                                   60),
  ('en:tree-nuts',              'exact',    '00000001-0000-0000-0000-000000000019', NULL,                                   60),
  ('nut',                       'contains', '00000001-0000-0000-0000-000000000019', NULL,                                   4),
  ('seed',                      'contains', '00000001-0000-0000-0000-000000000019', NULL,                                   4),

  -- Nut Butters parent (new parent 20)
  ('en:peanut-butter',          'exact',    '00000001-0000-0000-0000-000000000020', '00000002-0000-0000-0020-000000000001', 100),
  ('en:peanut-butters',         'exact',    '00000001-0000-0000-0000-000000000020', '00000002-0000-0000-0020-000000000001', 100),
  ('en:almond-butter',          'exact',    '00000001-0000-0000-0000-000000000020', '00000002-0000-0000-0020-000000000002', 100),
  ('en:cashew-butter',          'exact',    '00000001-0000-0000-0000-000000000020', '00000002-0000-0000-0020-000000000003', 100),
  ('en:sunflower-butter',       'exact',    '00000001-0000-0000-0000-000000000020', '00000002-0000-0000-0020-000000000004', 100),
  ('en:sunflower-seed-butter',  'exact',    '00000001-0000-0000-0000-000000000020', '00000002-0000-0000-0020-000000000004', 100),
  ('en:nut-butters',            'exact',    '00000001-0000-0000-0000-000000000020', NULL,                                   60),
  ('nut butter',                'contains', '00000001-0000-0000-0000-000000000020', NULL,                                   8),

  -- Kids Foods parent (new parent 21)
  ('en:fruit-snacks',           'exact',    '00000001-0000-0000-0000-000000000021', '00000002-0000-0000-0021-000000000001', 100),
  ('en:fruit-gummies',          'exact',    '00000001-0000-0000-0000-000000000021', '00000002-0000-0000-0021-000000000001', 100),
  ('en:fruit-pouches',          'exact',    '00000001-0000-0000-0000-000000000021', '00000002-0000-0000-0021-000000000001', 100),
  ('en:juice-boxes',            'exact',    '00000001-0000-0000-0000-000000000021', '00000002-0000-0000-0021-000000000002', 100),
  ('en:juice-pouches',          'exact',    '00000001-0000-0000-0000-000000000021', '00000002-0000-0000-0021-000000000002', 100),
  ('en:lunch-kits',             'exact',    '00000001-0000-0000-0000-000000000021', '00000002-0000-0000-0021-000000000003', 100),
  ('en:lunchables',             'exact',    '00000001-0000-0000-0000-000000000021', '00000002-0000-0000-0021-000000000003', 100),
  ('en:kids-yogurts',           'exact',    '00000001-0000-0000-0000-000000000021', '00000002-0000-0000-0021-000000000004', 100),
  ('en:yogurt-tubes',           'exact',    '00000001-0000-0000-0000-000000000021', '00000002-0000-0000-0021-000000000004', 100),
  ('kids',                      'contains', '00000001-0000-0000-0000-000000000021', NULL,                                   4),
  ('children',                  'contains', '00000001-0000-0000-0000-000000000021', NULL,                                   4)

ON CONFLICT DO NOTHING;

-- Re-run bulk reclassification to pick up new rules on existing products
SELECT fn_bulk_reclassify_products();
