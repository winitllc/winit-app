/*
  # Seed WINIT Taxonomy

  ## Overview
  Inserts 18 parent categories, ~85 subcategories, and ~200 OFF keyword
  mapping rules that cover the major OpenFoodFacts category tags.

  ## Parent Categories (18)
  1. Snacks
  2. Beverages
  3. Dairy & Eggs
  4. Bakery & Bread
  5. Breakfast & Cereals
  6. Frozen Foods
  7. Meat & Seafood
  8. Produce
  9. Pantry & Dry Goods
  10. Condiments & Sauces
  11. Desserts & Sweets
  12. Plant-Based
  13. Baby & Toddler
  14. Health & Supplements
  15. International Foods
  16. Deli & Prepared Foods
  17. Candy
  18. Cheese

  All IDs are fixed UUIDs so the mapping inserts can reference them directly.
*/

-- ── Parent categories ─────────────────────────────────────────────────────────

INSERT INTO taxonomy_parents (id, slug, display_name, icon, description, sort_order, image_url) VALUES
  ('00000001-0000-0000-0000-000000000001', 'snacks',            'Snacks',               '🍿', 'Chips, crackers, popcorn, bars, and more',            1,  'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000002', 'beverages',         'Beverages',            '🥤', 'Water, juice, soda, coffee, tea, energy drinks',      2,  'https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000003', 'dairy-eggs',        'Dairy & Eggs',         '🥛', 'Milk, yogurt, butter, eggs, cream, cheese spreads',   3,  'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000004', 'bakery-bread',      'Bakery & Bread',       '🍞', 'Bread, rolls, bagels, tortillas, pita, muffins',      4,  'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000005', 'breakfast-cereals', 'Breakfast & Cereals',  '🥣', 'Cereals, oats, granola, pancake mixes, breakfast bars',5,  'https://images.pexels.com/photos/4397899/pexels-photo-4397899.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000006', 'frozen-foods',      'Frozen Foods',         '🧊', 'Frozen meals, pizza, vegetables, ice cream',          6,  'https://images.pexels.com/photos/3872373/pexels-photo-3872373.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000007', 'meat-seafood',      'Meat & Seafood',       '🥩', 'Fresh, cured, and canned meat, poultry, fish',        7,  'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000008', 'produce',           'Produce',              '🥦', 'Fresh and dried fruits and vegetables',               8,  'https://images.pexels.com/photos/1367243/pexels-photo-1367243.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000009', 'pantry',            'Pantry & Dry Goods',   '🫙', 'Pasta, rice, beans, canned goods, oils, flour',      9,  'https://images.pexels.com/photos/4198019/pexels-photo-4198019.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000010', 'condiments-sauces', 'Condiments & Sauces',  '🫙', 'Ketchup, mustard, hot sauce, dressings, marinades',  10, 'https://images.pexels.com/photos/1435706/pexels-photo-1435706.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000011', 'desserts-sweets',   'Desserts & Sweets',    '🍰', 'Cookies, cakes, brownies, pastries, pies',            11, 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000012', 'plant-based',       'Plant-Based',          '🌱', 'Vegan meat alternatives, tofu, tempeh, plant milks', 12, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000013', 'baby-toddler',      'Baby & Toddler',       '🍼', 'Formula, purees, teething snacks, baby cereals',     13, 'https://images.pexels.com/photos/35537/child-children-girl-happy.jpg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000014', 'health-wellness',   'Health & Wellness',    '💊', 'Protein powders, vitamins, supplements, nutrition',  14, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000015', 'international',     'International Foods',  '🌍', 'Ethnic, specialty, and imported foods',               15, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000016', 'deli-prepared',     'Deli & Prepared',      '🥪', 'Deli meats, ready meals, salads, soups',              16, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000017', 'candy',             'Candy',                '🍬', 'Chocolate, gummies, hard candy, licorice',            17, 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400'),
  ('00000001-0000-0000-0000-000000000018', 'cheese',            'Cheese',               '🧀', 'Hard, soft, fresh, and processed cheeses',            18, 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=400')
ON CONFLICT (slug) DO NOTHING;

-- ── Subcategories ─────────────────────────────────────────────────────────────

INSERT INTO taxonomy_subcategories (id, parent_id, slug, display_name, sort_order, off_tags) VALUES
  -- Snacks
  ('00000002-0000-0000-0001-000000000001', '00000001-0000-0000-0000-000000000001', 'chips',          'Chips',          1,  ARRAY['en:chips','en:tortilla-chips','en:potato-chips']),
  ('00000002-0000-0000-0001-000000000002', '00000001-0000-0000-0000-000000000001', 'crackers',       'Crackers',       2,  ARRAY['en:crackers','en:rice-cakes']),
  ('00000002-0000-0000-0001-000000000003', '00000001-0000-0000-0000-000000000001', 'popcorn',        'Popcorn',        3,  ARRAY['en:popcorn','en:popped-corn']),
  ('00000002-0000-0000-0001-000000000004', '00000001-0000-0000-0000-000000000001', 'pretzels',       'Pretzels',       4,  ARRAY['en:pretzels']),
  ('00000002-0000-0000-0001-000000000005', '00000001-0000-0000-0000-000000000001', 'protein-bars',   'Protein Bars',   5,  ARRAY['en:protein-bars']),
  ('00000002-0000-0000-0001-000000000006', '00000001-0000-0000-0000-000000000001', 'granola-bars',   'Granola Bars',   6,  ARRAY['en:granola-bars','en:cereal-bars']),
  ('00000002-0000-0000-0001-000000000007', '00000001-0000-0000-0000-000000000001', 'nuts-seeds',     'Nuts & Seeds',   7,  ARRAY['en:nuts','en:seeds','en:mixed-nuts','en:trail-mix']),
  ('00000002-0000-0000-0001-000000000008', '00000001-0000-0000-0000-000000000001', 'jerky',          'Jerky',          8,  ARRAY['en:jerky','en:meat-snacks']),
  ('00000002-0000-0000-0001-000000000009', '00000001-0000-0000-0000-000000000001', 'snack-cakes',    'Snack Cakes',    9,  ARRAY['en:snack-cakes','en:snack-bars']),
  ('00000002-0000-0000-0001-000000000010', '00000001-0000-0000-0000-000000000001', 'pork-rinds',     'Pork Rinds',     10, ARRAY['en:pork-rinds','en:chicharrones']),

  -- Beverages
  ('00000002-0000-0000-0002-000000000001', '00000001-0000-0000-0000-000000000002', 'water',          'Water',          1,  ARRAY['en:waters','en:sparkling-water','en:mineral-water']),
  ('00000002-0000-0000-0002-000000000002', '00000001-0000-0000-0000-000000000002', 'juice',          'Juice',          2,  ARRAY['en:juices','en:fruit-juices','en:vegetable-juices']),
  ('00000002-0000-0000-0002-000000000003', '00000001-0000-0000-0000-000000000002', 'soda',           'Soda',           3,  ARRAY['en:sodas','en:carbonated-drinks','en:soft-drinks']),
  ('00000002-0000-0000-0002-000000000004', '00000001-0000-0000-0000-000000000002', 'coffee',         'Coffee',         4,  ARRAY['en:coffees','en:coffee','en:ready-to-drink-coffees']),
  ('00000002-0000-0000-0002-000000000005', '00000001-0000-0000-0000-000000000002', 'tea',            'Tea',            5,  ARRAY['en:teas','en:iced-teas','en:herbal-teas']),
  ('00000002-0000-0000-0002-000000000006', '00000001-0000-0000-0000-000000000002', 'energy-drinks',  'Energy Drinks',  6,  ARRAY['en:energy-drinks']),
  ('00000002-0000-0000-0002-000000000007', '00000001-0000-0000-0000-000000000002', 'sports-drinks',  'Sports Drinks',  7,  ARRAY['en:sports-drinks','en:electrolyte-drinks']),
  ('00000002-0000-0000-0002-000000000008', '00000001-0000-0000-0000-000000000002', 'plant-milks',    'Plant Milks',    8,  ARRAY['en:plant-milks','en:oat-milk','en:almond-milk','en:soy-milk']),
  ('00000002-0000-0000-0002-000000000009', '00000001-0000-0000-0000-000000000002', 'smoothies',      'Smoothies',      9,  ARRAY['en:smoothies','en:fruit-smoothies']),
  ('00000002-0000-0000-0002-000000000010', '00000001-0000-0000-0000-000000000002', 'alcohol',        'Alcohol',        10, ARRAY['en:alcoholic-beverages','en:beers','en:wines','en:spirits']),

  -- Dairy & Eggs
  ('00000002-0000-0000-0003-000000000001', '00000001-0000-0000-0000-000000000003', 'milk',           'Milk',           1,  ARRAY['en:milks','en:whole-milk','en:skim-milk']),
  ('00000002-0000-0000-0003-000000000002', '00000001-0000-0000-0000-000000000003', 'yogurt',         'Yogurt',         2,  ARRAY['en:yogurts','en:greek-yogurts']),
  ('00000002-0000-0000-0003-000000000003', '00000001-0000-0000-0000-000000000003', 'butter-cream',   'Butter & Cream', 3,  ARRAY['en:butters','en:creams','en:heavy-cream','en:sour-cream']),
  ('00000002-0000-0000-0003-000000000004', '00000001-0000-0000-0000-000000000003', 'eggs',           'Eggs',           4,  ARRAY['en:eggs','en:egg-products']),
  ('00000002-0000-0000-0003-000000000005', '00000001-0000-0000-0000-000000000003', 'cottage-cheese', 'Cottage Cheese', 5,  ARRAY['en:cottage-cheese','en:ricotta']),

  -- Bakery & Bread
  ('00000002-0000-0000-0004-000000000001', '00000001-0000-0000-0000-000000000004', 'sandwich-bread', 'Sandwich Bread', 1,  ARRAY['en:breads','en:white-breads','en:whole-wheat-breads']),
  ('00000002-0000-0000-0004-000000000002', '00000001-0000-0000-0000-000000000004', 'bagels',         'Bagels',         2,  ARRAY['en:bagels']),
  ('00000002-0000-0000-0004-000000000003', '00000001-0000-0000-0000-000000000004', 'tortillas-wraps','Tortillas & Wraps',3,ARRAY['en:tortillas','en:wraps','en:flatbreads']),
  ('00000002-0000-0000-0004-000000000004', '00000001-0000-0000-0000-000000000004', 'rolls-buns',     'Rolls & Buns',   4,  ARRAY['en:rolls','en:buns','en:dinner-rolls']),
  ('00000002-0000-0000-0004-000000000005', '00000001-0000-0000-0000-000000000004', 'muffins-loaves', 'Muffins & Loaves',5, ARRAY['en:muffins','en:quick-breads','en:banana-bread']),
  ('00000002-0000-0000-0004-000000000006', '00000001-0000-0000-0000-000000000004', 'gluten-free-bread','Gluten-Free Bread',6,ARRAY['en:gluten-free-breads']),

  -- Breakfast & Cereals
  ('00000002-0000-0000-0005-000000000001', '00000001-0000-0000-0000-000000000005', 'cold-cereals',   'Cold Cereals',   1,  ARRAY['en:breakfast-cereals','en:cold-cereals']),
  ('00000002-0000-0000-0005-000000000002', '00000001-0000-0000-0000-000000000005', 'oatmeal-hot',    'Oatmeal & Hot Cereal',2,ARRAY['en:oatmeal','en:hot-cereals','en:porridges']),
  ('00000002-0000-0000-0005-000000000003', '00000001-0000-0000-0000-000000000005', 'granola',        'Granola',        3,  ARRAY['en:granolas','en:mueslis']),
  ('00000002-0000-0000-0005-000000000004', '00000001-0000-0000-0000-000000000005', 'pancake-waffle', 'Pancake & Waffle Mix',4,ARRAY['en:pancake-mixes','en:waffle-mixes']),
  ('00000002-0000-0000-0005-000000000005', '00000001-0000-0000-0000-000000000005', 'breakfast-pastries','Breakfast Pastries',5,ARRAY['en:breakfast-pastries','en:croissants','en:danishes']),

  -- Frozen Foods
  ('00000002-0000-0000-0006-000000000001', '00000001-0000-0000-0000-000000000006', 'frozen-meals',   'Frozen Meals',   1,  ARRAY['en:frozen-meals','en:frozen-dinners']),
  ('00000002-0000-0000-0006-000000000002', '00000001-0000-0000-0000-000000000006', 'frozen-pizza',   'Frozen Pizza',   2,  ARRAY['en:frozen-pizzas']),
  ('00000002-0000-0000-0006-000000000003', '00000001-0000-0000-0000-000000000006', 'frozen-vegetables','Frozen Vegetables',3,ARRAY['en:frozen-vegetables']),
  ('00000002-0000-0000-0006-000000000004', '00000001-0000-0000-0000-000000000006', 'ice-cream',      'Ice Cream',      4,  ARRAY['en:ice-creams','en:ice-cream','en:frozen-desserts']),
  ('00000002-0000-0000-0006-000000000005', '00000001-0000-0000-0000-000000000006', 'frozen-meat',    'Frozen Meat',    5,  ARRAY['en:frozen-meats','en:frozen-poultry']),
  ('00000002-0000-0000-0006-000000000006', '00000001-0000-0000-0000-000000000006', 'frozen-breakfast','Frozen Breakfast',6,ARRAY['en:frozen-breakfast-foods']),

  -- Meat & Seafood
  ('00000002-0000-0000-0007-000000000001', '00000001-0000-0000-0000-000000000007', 'beef',           'Beef',           1,  ARRAY['en:beef','en:ground-beef']),
  ('00000002-0000-0000-0007-000000000002', '00000001-0000-0000-0000-000000000007', 'poultry',        'Poultry',        2,  ARRAY['en:chicken','en:turkey','en:poultry']),
  ('00000002-0000-0000-0007-000000000003', '00000001-0000-0000-0000-000000000007', 'pork',           'Pork',           3,  ARRAY['en:pork','en:bacon','en:ham']),
  ('00000002-0000-0000-0007-000000000004', '00000001-0000-0000-0000-000000000007', 'fish',           'Fish',           4,  ARRAY['en:fish','en:salmon','en:tuna','en:canned-fish']),
  ('00000002-0000-0000-0007-000000000005', '00000001-0000-0000-0000-000000000007', 'shellfish',      'Shellfish',      5,  ARRAY['en:shellfish','en:shrimp','en:crab','en:lobster']),
  ('00000002-0000-0000-0007-000000000006', '00000001-0000-0000-0000-000000000007', 'deli-meats',     'Deli Meats',     6,  ARRAY['en:deli-meats','en:luncheon-meats','en:cold-cuts']),
  ('00000002-0000-0000-0007-000000000007', '00000001-0000-0000-0000-000000000007', 'sausages',       'Sausages',       7,  ARRAY['en:sausages','en:hot-dogs']),

  -- Pantry & Dry Goods
  ('00000002-0000-0000-0009-000000000001', '00000001-0000-0000-0000-000000000009', 'pasta',          'Pasta',          1,  ARRAY['en:pastas','en:spaghetti','en:penne']),
  ('00000002-0000-0000-0009-000000000002', '00000001-0000-0000-0000-000000000009', 'rice-grains',    'Rice & Grains',  2,  ARRAY['en:rices','en:grains','en:quinoa']),
  ('00000002-0000-0000-0009-000000000003', '00000001-0000-0000-0000-000000000009', 'beans-legumes',  'Beans & Legumes',3,  ARRAY['en:legumes','en:beans','en:lentils','en:chickpeas']),
  ('00000002-0000-0000-0009-000000000004', '00000001-0000-0000-0000-000000000009', 'canned-goods',   'Canned Goods',   4,  ARRAY['en:canned-foods','en:canned-vegetables','en:canned-fruit']),
  ('00000002-0000-0000-0009-000000000005', '00000001-0000-0000-0000-000000000009', 'oils-vinegars',  'Oils & Vinegars',5,  ARRAY['en:oils','en:olive-oil','en:vinegars']),
  ('00000002-0000-0000-0009-000000000006', '00000001-0000-0000-0000-000000000009', 'baking-supplies','Baking Supplies', 6, ARRAY['en:baking-mixes','en:flour','en:sugar']),
  ('00000002-0000-0000-0009-000000000007', '00000001-0000-0000-0000-000000000009', 'soups-broths',   'Soups & Broths', 7,  ARRAY['en:soups','en:broths','en:canned-soups']),
  ('00000002-0000-0000-0009-000000000008', '00000001-0000-0000-0000-000000000009', 'spices-herbs',   'Spices & Herbs', 8,  ARRAY['en:spices','en:herbs','en:seasonings']),

  -- Condiments & Sauces
  ('00000002-0000-0000-0010-000000000001', '00000001-0000-0000-0000-000000000010', 'hot-sauce',      'Hot Sauce',      1,  ARRAY['en:hot-sauces']),
  ('00000002-0000-0000-0010-000000000002', '00000001-0000-0000-0000-000000000010', 'ketchup-mustard','Ketchup & Mustard',2,ARRAY['en:ketchup','en:mustards']),
  ('00000002-0000-0000-0010-000000000003', '00000001-0000-0000-0000-000000000010', 'salad-dressing', 'Salad Dressing', 3,  ARRAY['en:salad-dressings']),
  ('00000002-0000-0000-0010-000000000004', '00000001-0000-0000-0000-000000000010', 'pasta-sauce',    'Pasta Sauce',    4,  ARRAY['en:pasta-sauces','en:tomato-sauces']),
  ('00000002-0000-0000-0010-000000000005', '00000001-0000-0000-0000-000000000010', 'mayo-spreads',   'Mayo & Spreads', 5,  ARRAY['en:mayonnaise','en:spreads']),
  ('00000002-0000-0000-0010-000000000006', '00000001-0000-0000-0000-000000000010', 'soy-teriyaki',   'Soy & Teriyaki', 6,  ARRAY['en:soy-sauces','en:teriyaki-sauces']),

  -- Desserts & Sweets
  ('00000002-0000-0000-0011-000000000001', '00000001-0000-0000-0000-000000000011', 'cookies',        'Cookies',        1,  ARRAY['en:cookies','en:biscuits']),
  ('00000002-0000-0000-0011-000000000002', '00000001-0000-0000-0000-000000000011', 'cakes',          'Cakes',          2,  ARRAY['en:cakes','en:layer-cakes']),
  ('00000002-0000-0000-0011-000000000003', '00000001-0000-0000-0000-000000000011', 'brownies-bars',  'Brownies & Bars',3,  ARRAY['en:brownies','en:dessert-bars']),
  ('00000002-0000-0000-0011-000000000004', '00000001-0000-0000-0000-000000000011', 'pies-tarts',     'Pies & Tarts',   4,  ARRAY['en:pies','en:tarts']),
  ('00000002-0000-0000-0011-000000000005', '00000001-0000-0000-0000-000000000011', 'puddings',       'Puddings & Mousse',5,ARRAY['en:puddings','en:mousses','en:gelatin']),

  -- Plant-Based
  ('00000002-0000-0000-0012-000000000001', '00000001-0000-0000-0000-000000000012', 'meat-alternatives','Meat Alternatives',1,ARRAY['en:meat-alternatives','en:veggie-burgers','en:plant-based-meats']),
  ('00000002-0000-0000-0012-000000000002', '00000001-0000-0000-0000-000000000012', 'tofu-tempeh',    'Tofu & Tempeh',  2,  ARRAY['en:tofu','en:tempeh']),
  ('00000002-0000-0000-0012-000000000003', '00000001-0000-0000-0000-000000000012', 'vegan-dairy',    'Vegan Dairy',    3,  ARRAY['en:vegan-cheeses','en:vegan-yogurts','en:vegan-butter']),

  -- Baby & Toddler
  ('00000002-0000-0000-0013-000000000001', '00000001-0000-0000-0000-000000000013', 'baby-formula',   'Formula',        1,  ARRAY['en:infant-formulas','en:baby-formula']),
  ('00000002-0000-0000-0013-000000000002', '00000001-0000-0000-0000-000000000013', 'baby-food',      'Baby Food',      2,  ARRAY['en:baby-foods','en:baby-purees']),
  ('00000002-0000-0000-0013-000000000003', '00000001-0000-0000-0000-000000000013', 'toddler-snacks', 'Toddler Snacks', 3,  ARRAY['en:toddler-snacks','en:puffs']),

  -- Health & Wellness
  ('00000002-0000-0000-0014-000000000001', '00000001-0000-0000-0000-000000000014', 'protein-powder', 'Protein Powder', 1,  ARRAY['en:protein-powders','en:whey-protein']),
  ('00000002-0000-0000-0014-000000000002', '00000001-0000-0000-0000-000000000014', 'vitamins-supps', 'Vitamins & Supplements',2,ARRAY['en:dietary-supplements','en:vitamins']),
  ('00000002-0000-0000-0014-000000000003', '00000001-0000-0000-0000-000000000014', 'meal-replacements','Meal Replacements',3,ARRAY['en:meal-replacements','en:diet-foods']),

  -- Candy
  ('00000002-0000-0000-0017-000000000001', '00000001-0000-0000-0000-000000000017', 'chocolate',      'Chocolate',      1,  ARRAY['en:chocolates','en:chocolate-bars','en:dark-chocolate']),
  ('00000002-0000-0000-0017-000000000002', '00000001-0000-0000-0000-000000000017', 'gummies',        'Gummies & Soft Candy',2,ARRAY['en:gummies','en:gummy-candies','en:gummi-bears']),
  ('00000002-0000-0000-0017-000000000003', '00000001-0000-0000-0000-000000000017', 'hard-candy',     'Hard Candy',     3,  ARRAY['en:hard-candies','en:lollipops']),
  ('00000002-0000-0000-0017-000000000004', '00000001-0000-0000-0000-000000000017', 'licorice',       'Licorice',       4,  ARRAY['en:licorice']),

  -- Cheese
  ('00000002-0000-0000-0018-000000000001', '00000001-0000-0000-0000-000000000018', 'hard-cheese',    'Hard Cheese',    1,  ARRAY['en:hard-cheeses','en:cheddar','en:parmesan']),
  ('00000002-0000-0000-0018-000000000002', '00000001-0000-0000-0000-000000000018', 'soft-cheese',    'Soft Cheese',    2,  ARRAY['en:soft-cheeses','en:brie','en:camembert']),
  ('00000002-0000-0000-0018-000000000003', '00000001-0000-0000-0000-000000000018', 'cream-cheese',   'Cream Cheese',   3,  ARRAY['en:cream-cheeses','en:neufchatel']),
  ('00000002-0000-0000-0018-000000000004', '00000001-0000-0000-0000-000000000018', 'shredded-sliced','Shredded & Sliced',4,ARRAY['en:shredded-cheese','en:sliced-cheese'])

ON CONFLICT (slug) DO NOTHING;

-- ── OFF mapping rules ─────────────────────────────────────────────────────────
-- priority 100 = exact subcategory match (most specific)
-- priority 50  = parent-level exact match
-- priority 10  = prefix match (broad catch)

INSERT INTO taxonomy_off_mappings (off_pattern, match_type, parent_id, subcategory_id, priority) VALUES
  -- SNACKS subcategory exact matches
  ('en:chips',                  'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000001', 100),
  ('en:tortilla-chips',         'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000001', 100),
  ('en:potato-chips',           'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000001', 100),
  ('en:corn-chips',             'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000001', 100),
  ('en:crackers',               'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000002', 100),
  ('en:rice-cakes',             'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000002', 100),
  ('en:popcorn',                'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000003', 100),
  ('en:pretzels',               'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000004', 100),
  ('en:protein-bars',           'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000005', 100),
  ('en:granola-bars',           'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000006', 100),
  ('en:cereal-bars',            'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000006', 100),
  ('en:nuts',                   'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000007', 100),
  ('en:seeds',                  'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000007', 100),
  ('en:mixed-nuts',             'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000007', 100),
  ('en:trail-mix',              'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000007', 100),
  ('en:jerky',                  'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000008', 100),
  ('en:meat-snacks',            'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000008', 100),
  ('en:snack-cakes',            'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000009', 100),
  ('en:pork-rinds',             'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000010', 100),
  ('en:snacks',                 'exact',    '00000001-0000-0000-0000-000000000001', NULL,                                   50),
  ('en:sweet-snacks',           'exact',    '00000001-0000-0000-0000-000000000001', NULL,                                   50),
  ('en:salty-snacks',           'exact',    '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000001', 80),
  ('chips',                     'contains', '00000001-0000-0000-0000-000000000001', '00000002-0000-0000-0001-000000000001', 10),
  ('snack',                     'contains', '00000001-0000-0000-0000-000000000001', NULL,                                   5),

  -- BEVERAGES
  ('en:waters',                 'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000001', 100),
  ('en:sparkling-water',        'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000001', 100),
  ('en:mineral-water',          'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000001', 100),
  ('en:juices',                 'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000002', 100),
  ('en:fruit-juices',           'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000002', 100),
  ('en:sodas',                  'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000003', 100),
  ('en:soft-drinks',            'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000003', 100),
  ('en:carbonated-drinks',      'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000003', 100),
  ('en:coffees',                'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000004', 100),
  ('en:teas',                   'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000005', 100),
  ('en:iced-teas',              'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000005', 100),
  ('en:energy-drinks',          'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000006', 100),
  ('en:sports-drinks',          'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000007', 100),
  ('en:plant-milks',            'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000008', 100),
  ('en:oat-milk',               'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000008', 100),
  ('en:almond-milk',            'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000008', 100),
  ('en:soy-milk',               'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000008', 100),
  ('en:smoothies',              'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000009', 100),
  ('en:alcoholic-beverages',    'exact',    '00000001-0000-0000-0000-000000000002', '00000002-0000-0000-0002-000000000010', 100),
  ('en:beverages',              'exact',    '00000001-0000-0000-0000-000000000002', NULL,                                   50),
  ('en:drinks',                 'exact',    '00000001-0000-0000-0000-000000000002', NULL,                                   50),
  ('beverage',                  'contains', '00000001-0000-0000-0000-000000000002', NULL,                                   5),
  ('drink',                     'contains', '00000001-0000-0000-0000-000000000002', NULL,                                   5),

  -- DAIRY & EGGS
  ('en:milks',                  'exact',    '00000001-0000-0000-0000-000000000003', '00000002-0000-0000-0003-000000000001', 100),
  ('en:whole-milk',             'exact',    '00000001-0000-0000-0000-000000000003', '00000002-0000-0000-0003-000000000001', 100),
  ('en:yogurts',                'exact',    '00000001-0000-0000-0000-000000000003', '00000002-0000-0000-0003-000000000002', 100),
  ('en:greek-yogurts',          'exact',    '00000001-0000-0000-0000-000000000003', '00000002-0000-0000-0003-000000000002', 100),
  ('en:butters',                'exact',    '00000001-0000-0000-0000-000000000003', '00000002-0000-0000-0003-000000000003', 100),
  ('en:creams',                 'exact',    '00000001-0000-0000-0000-000000000003', '00000002-0000-0000-0003-000000000003', 100),
  ('en:sour-cream',             'exact',    '00000001-0000-0000-0000-000000000003', '00000002-0000-0000-0003-000000000003', 100),
  ('en:eggs',                   'exact',    '00000001-0000-0000-0000-000000000003', '00000002-0000-0000-0003-000000000004', 100),
  ('en:cottage-cheese',         'exact',    '00000001-0000-0000-0000-000000000003', '00000002-0000-0000-0003-000000000005', 100),
  ('en:dairies',                'exact',    '00000001-0000-0000-0000-000000000003', NULL,                                   50),
  ('en:dairy',                  'contains', '00000001-0000-0000-0000-000000000003', NULL,                                   10),

  -- BAKERY & BREAD
  ('en:breads',                 'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000001', 100),
  ('en:white-breads',           'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000001', 100),
  ('en:whole-wheat-breads',     'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000001', 100),
  ('en:bagels',                 'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000002', 100),
  ('en:tortillas',              'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000003', 100),
  ('en:flatbreads',             'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000003', 100),
  ('en:muffins',                'exact',    '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000005', 100),
  ('en:bakery',                 'contains', '00000001-0000-0000-0000-000000000004', NULL,                                   10),
  ('en:bread',                  'contains', '00000001-0000-0000-0000-000000000004', '00000002-0000-0000-0004-000000000001', 10),

  -- BREAKFAST & CEREALS
  ('en:breakfast-cereals',      'exact',    '00000001-0000-0000-0000-000000000005', '00000002-0000-0000-0005-000000000001', 100),
  ('en:cold-cereals',           'exact',    '00000001-0000-0000-0000-000000000005', '00000002-0000-0000-0005-000000000001', 100),
  ('en:oatmeal',                'exact',    '00000001-0000-0000-0000-000000000005', '00000002-0000-0000-0005-000000000002', 100),
  ('en:hot-cereals',            'exact',    '00000001-0000-0000-0000-000000000005', '00000002-0000-0000-0005-000000000002', 100),
  ('en:granolas',               'exact',    '00000001-0000-0000-0000-000000000005', '00000002-0000-0000-0005-000000000003', 100),
  ('en:mueslis',                'exact',    '00000001-0000-0000-0000-000000000005', '00000002-0000-0000-0005-000000000003', 100),
  ('en:pancake-mixes',          'exact',    '00000001-0000-0000-0000-000000000005', '00000002-0000-0000-0005-000000000004', 100),
  ('cereal',                    'contains', '00000001-0000-0000-0000-000000000005', '00000002-0000-0000-0005-000000000001', 5),

  -- FROZEN FOODS
  ('en:frozen-meals',           'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000001', 100),
  ('en:frozen-dinners',         'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000001', 100),
  ('en:frozen-pizzas',          'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000002', 100),
  ('en:frozen-vegetables',      'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000003', 100),
  ('en:ice-creams',             'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000004', 100),
  ('en:ice-cream',              'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000004', 100),
  ('en:frozen-desserts',        'exact',    '00000001-0000-0000-0000-000000000006', '00000002-0000-0000-0006-000000000004', 100),
  ('en:frozen-foods',           'exact',    '00000001-0000-0000-0000-000000000006', NULL,                                   50),
  ('en:frozen',                 'contains', '00000001-0000-0000-0000-000000000006', NULL,                                   5),

  -- MEAT & SEAFOOD
  ('en:beef',                   'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000001', 100),
  ('en:ground-beef',            'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000001', 100),
  ('en:chicken',                'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000002', 100),
  ('en:turkey',                 'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000002', 100),
  ('en:poultry',                'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000002', 100),
  ('en:pork',                   'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000003', 100),
  ('en:bacon',                  'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000003', 100),
  ('en:ham',                    'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000003', 100),
  ('en:fish',                   'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000004', 100),
  ('en:salmon',                 'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000004', 100),
  ('en:tuna',                   'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000004', 100),
  ('en:shellfish',              'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000005', 100),
  ('en:shrimp',                 'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000005', 100),
  ('en:deli-meats',             'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000006', 100),
  ('en:sausages',               'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000007', 100),
  ('en:hot-dogs',               'exact',    '00000001-0000-0000-0000-000000000007', '00000002-0000-0000-0007-000000000007', 100),
  ('en:meats',                  'exact',    '00000001-0000-0000-0000-000000000007', NULL,                                   50),

  -- PANTRY & DRY GOODS
  ('en:pastas',                 'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000001', 100),
  ('en:spaghetti',              'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000001', 100),
  ('en:rices',                  'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000002', 100),
  ('en:grains',                 'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000002', 100),
  ('en:legumes',                'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000003', 100),
  ('en:beans',                  'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000003', 100),
  ('en:lentils',                'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000003', 100),
  ('en:canned-foods',           'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000004', 100),
  ('en:oils',                   'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000005', 100),
  ('en:olive-oil',              'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000005', 100),
  ('en:soups',                  'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000007', 100),
  ('en:spices',                 'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000008', 100),
  ('en:herbs',                  'exact',    '00000001-0000-0000-0000-000000000009', '00000002-0000-0000-0009-000000000008', 100),

  -- CONDIMENTS & SAUCES
  ('en:hot-sauces',             'exact',    '00000001-0000-0000-0000-000000000010', '00000002-0000-0000-0010-000000000001', 100),
  ('en:ketchup',                'exact',    '00000001-0000-0000-0000-000000000010', '00000002-0000-0000-0010-000000000002', 100),
  ('en:mustards',               'exact',    '00000001-0000-0000-0000-000000000010', '00000002-0000-0000-0010-000000000002', 100),
  ('en:salad-dressings',        'exact',    '00000001-0000-0000-0000-000000000010', '00000002-0000-0000-0010-000000000003', 100),
  ('en:pasta-sauces',           'exact',    '00000001-0000-0000-0000-000000000010', '00000002-0000-0000-0010-000000000004', 100),
  ('en:tomato-sauces',          'exact',    '00000001-0000-0000-0000-000000000010', '00000002-0000-0000-0010-000000000004', 100),
  ('en:mayonnaise',             'exact',    '00000001-0000-0000-0000-000000000010', '00000002-0000-0000-0010-000000000005', 100),
  ('en:sauces',                 'exact',    '00000001-0000-0000-0000-000000000010', NULL,                                   50),
  ('sauce',                     'contains', '00000001-0000-0000-0000-000000000010', NULL,                                   5),

  -- DESSERTS & SWEETS
  ('en:cookies',                'exact',    '00000001-0000-0000-0000-000000000011', '00000002-0000-0000-0011-000000000001', 100),
  ('en:biscuits',               'exact',    '00000001-0000-0000-0000-000000000011', '00000002-0000-0000-0011-000000000001', 100),
  ('en:cakes',                  'exact',    '00000001-0000-0000-0000-000000000011', '00000002-0000-0000-0011-000000000002', 100),
  ('en:brownies',               'exact',    '00000001-0000-0000-0000-000000000011', '00000002-0000-0000-0011-000000000003', 100),
  ('en:pies',                   'exact',    '00000001-0000-0000-0000-000000000011', '00000002-0000-0000-0011-000000000004', 100),
  ('en:puddings',               'exact',    '00000001-0000-0000-0000-000000000011', '00000002-0000-0000-0011-000000000005', 100),
  ('en:desserts',               'exact',    '00000001-0000-0000-0000-000000000011', NULL,                                   50),
  ('dessert',                   'contains', '00000001-0000-0000-0000-000000000011', NULL,                                   5),
  ('cookie',                    'contains', '00000001-0000-0000-0000-000000000011', '00000002-0000-0000-0011-000000000001', 5),
  ('cake',                      'contains', '00000001-0000-0000-0000-000000000011', '00000002-0000-0000-0011-000000000002', 5),

  -- PLANT-BASED
  ('en:meat-alternatives',      'exact',    '00000001-0000-0000-0000-000000000012', '00000002-0000-0000-0012-000000000001', 100),
  ('en:veggie-burgers',         'exact',    '00000001-0000-0000-0000-000000000012', '00000002-0000-0000-0012-000000000001', 100),
  ('en:tofu',                   'exact',    '00000001-0000-0000-0000-000000000012', '00000002-0000-0000-0012-000000000002', 100),
  ('en:tempeh',                 'exact',    '00000001-0000-0000-0000-000000000012', '00000002-0000-0000-0012-000000000002', 100),
  ('en:plant-based-foods',      'exact',    '00000001-0000-0000-0000-000000000012', NULL,                                   50),
  ('plant-based',               'contains', '00000001-0000-0000-0000-000000000012', NULL,                                   10),
  ('vegan',                     'contains', '00000001-0000-0000-0000-000000000012', NULL,                                   5),

  -- BABY & TODDLER
  ('en:infant-formulas',        'exact',    '00000001-0000-0000-0000-000000000013', '00000002-0000-0000-0013-000000000001', 100),
  ('en:baby-foods',             'exact',    '00000001-0000-0000-0000-000000000013', '00000002-0000-0000-0013-000000000002', 100),
  ('en:baby-purees',            'exact',    '00000001-0000-0000-0000-000000000013', '00000002-0000-0000-0013-000000000002', 100),
  ('en:baby',                   'contains', '00000001-0000-0000-0000-000000000013', NULL,                                   10),

  -- HEALTH & WELLNESS
  ('en:protein-powders',        'exact',    '00000001-0000-0000-0000-000000000014', '00000002-0000-0000-0014-000000000001', 100),
  ('en:dietary-supplements',    'exact',    '00000001-0000-0000-0000-000000000014', '00000002-0000-0000-0014-000000000002', 100),
  ('en:meal-replacements',      'exact',    '00000001-0000-0000-0000-000000000014', '00000002-0000-0000-0014-000000000003', 100),
  ('supplement',                'contains', '00000001-0000-0000-0000-000000000014', NULL,                                   5),

  -- CANDY
  ('en:chocolates',             'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000001', 100),
  ('en:chocolate-bars',         'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000001', 100),
  ('en:dark-chocolate',         'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000001', 100),
  ('en:gummies',                'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000002', 100),
  ('en:gummy-candies',          'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000002', 100),
  ('en:hard-candies',           'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000003', 100),
  ('en:lollipops',              'exact',    '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000003', 100),
  ('en:candies',                'exact',    '00000001-0000-0000-0000-000000000017', NULL,                                   50),
  ('en:confectioneries',        'exact',    '00000001-0000-0000-0000-000000000017', NULL,                                   50),
  ('chocolate',                 'contains', '00000001-0000-0000-0000-000000000017', '00000002-0000-0000-0017-000000000001', 5),
  ('candy',                     'contains', '00000001-0000-0000-0000-000000000017', NULL,                                   5),

  -- CHEESE
  ('en:cheeses',                'exact',    '00000001-0000-0000-0000-000000000018', NULL,                                   50),
  ('en:hard-cheeses',           'exact',    '00000001-0000-0000-0000-000000000018', '00000002-0000-0000-0018-000000000001', 100),
  ('en:cheddar',                'exact',    '00000001-0000-0000-0000-000000000018', '00000002-0000-0000-0018-000000000001', 100),
  ('en:soft-cheeses',           'exact',    '00000001-0000-0000-0000-000000000018', '00000002-0000-0000-0018-000000000002', 100),
  ('en:cream-cheeses',          'exact',    '00000001-0000-0000-0000-000000000018', '00000002-0000-0000-0018-000000000003', 100),
  ('cheese',                    'contains', '00000001-0000-0000-0000-000000000018', NULL,                                   5)

ON CONFLICT DO NOTHING;
