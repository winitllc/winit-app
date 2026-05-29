/*
  # Seed catalog keywords from ingredient CSV

  ## Summary
  Updates existing allergy catalog items with comprehensive keyword arrays parsed
  from the CSV, and adds new categories and items for: Corn, Mollusks, Gluten,
  Meat, Legumes, Spices, Gluten-free grains, Miscellaneous, Nightshades, Seeds,
  Fruits, Vegetables, Vegan foods, and Additives.

  ## Changes

  ### Updated items (keywords replaced with full CSV lists)
  - wheat, soy, eggs, peanuts, milk, fish, shellfish, sesame

  ### New allergy categories
  - corn, mollusks, gluten, meat, legumes, spices, gluten_free_grains,
    miscellaneous, nightshades, seeds, fruits, vegetables, vegan_foods, additives

  ### New allergy items under new categories
  - One item per new category carrying the full keyword list

  ## Notes
  - Uses INSERT ... ON CONFLICT DO NOTHING for categories
  - Uses UPDATE for existing items, INSERT for new items
*/

-- ── Update existing allergy items with full keyword arrays ────────────────────

UPDATE winit_allergies SET keywords = ARRAY[
  'wheat starch','wheat bran','wheat germ','couscous','cracked wheat','durum',
  'einkorn','emmer','farina','kamut','matzo','semolina','spelt','bulgur','oats',
  'seitan','triticale','bread','white flour','wheat flour','whole wheat flour',
  'pumpernickel','wheat berry','wheat grass','wheat noodles','fu','atta','maida',
  'rusk','chapati','naan','pita','sourdough','malt','malt vinegar','maltose',
  'maltodextrin','hydrolyzed wheat protein','modified wheat starch',
  'wheat protein isolate','soba noodles','udon noodles','ramen','pasta',
  'orzo','couscous','croutons','breadcrumbs','panko','crackers','pretzels',
  'flour tortilla','wheat dextrin','dinkle','einkorn','emmer','farro',
  'khorasan wheat','triticale','wheat germ oil','wheat starch'
] WHERE id = 'wheat';

UPDATE winit_allergies SET keywords = ARRAY[
  'soy','soya','soybeans','tofu','tempeh','miso','edamame','okara','natto',
  'bean curd','soy milk','soy sauce','tamari','shoyu','textured soy protein',
  'tsp','tvp','textured vegetable protein','hydrolyzed soy protein',
  'soy flour','soy lecithin','soy oil','soy nuts','soy protein isolate',
  'soy protein concentrate','soy sprouts','soy fiber','soybean oil',
  'soybean paste','yuba','kinako','abura age','atsuage','ganmodoki',
  'koya dofu','natto','sufu','tofuyo','koridofu','momen tofu',
  'silken tofu','firm tofu','soy-based infant formula','soy ice cream',
  'soy cheese','soy yogurt','soy butter','soy cream','soy creamer'
] WHERE id = 'soy';

UPDATE winit_allergies SET keywords = ARRAY[
  'egg','eggs','egg white','egg yolk','whole egg','egg powder','dried egg',
  'albumin','albumen','apovitellin','eggnog','globulin','livetin',
  'lysozyme','mayonnaise','meringue','ovalbumin','ovomucin','ovomucoid',
  'ovotransferrin','ovovitellin','silici albuminate','simplesse',
  'surimi','trailblazer','vitellin','egg wash','egg substitute',
  'egg replacer','pasteurized eggs','liquid eggs','egg solids',
  'egg-based pasta','egg noodles','quiche','frittata','custard',
  'hollandaise','aioli','caesar dressing','egg lecithin'
] WHERE id = 'eggs';

UPDATE winit_allergies SET keywords = ARRAY[
  'peanut','peanuts','peanut butter','peanut oil','peanut flour',
  'peanut protein','groundnut','ground nut','earth nut','goober peas',
  'beer nuts','boiled peanuts','arachic oil','arachis oil',
  'arachis hypogaea','hydrolyzed peanut protein','mandelonas',
  'mixed nuts','nut butters','artificial nuts','cold-pressed peanut oil',
  'expelled peanut oil','peanut extract','peanut paste','peanut sauce',
  'satay sauce','groundnut oil','monkey nuts'
] WHERE id = 'peanuts';

UPDATE winit_allergies SET keywords = ARRAY[
  'milk','dairy','cow milk','butter','buttermilk','butter fat','butter oil',
  'casein','caseinates','cheese','cottage cheese','cream','cream cheese',
  'curds','custard','ghee','half-and-half','ice cream','lactalbumin',
  'lactalbumin phosphate','lactoferrin','lactoglobulin','lactose',
  'lactulose','milk protein','nougat','pudding','quark','rennet',
  'rennet casein','sour cream','sour milk','whey','whey protein',
  'yogurt','kefir','acidophilus milk','dulce de leche','condensed milk',
  'evaporated milk','dry milk','milk solids','milk powder','skim milk',
  'whole milk','2% milk','1% milk','fat-free milk','goat milk',
  'sheep milk','buffalo milk','mozzarella','parmesan','cheddar',
  'brie','camembert','ricotta','mascarpone','lactaid',
  'milk chocolate','chocolate milk','caramel','toffee','nougat'
] WHERE id = 'milk';

UPDATE winit_allergies SET keywords = ARRAY[
  'fish','anchovies','anchovy','bass','bluefish','carp','catfish','cod',
  'flounder','grouper','haddock','hake','halibut','herring','mahi mahi',
  'mahi-mahi','perch','pike','pollock','pompano','redfish','rockfish',
  'salmon','sardine','sardines','snapper','sole','sturgeon','swordfish',
  'tilapia','trout','tuna','whitefish','yellowtail','eel','monkfish',
  'orange roughy','john dory','barramundi','bream','mullet',
  'fish oil','fish gelatin','fish sauce','worcestershire sauce',
  'caesar dressing','imitation crab','surimi','fish stock','fish broth',
  'fish paste','caviar','roe','bouillabaisse','caponata','niçoise'
] WHERE id = 'fish';

UPDATE winit_allergies SET keywords = ARRAY[
  'shrimp','crab','lobster','crawfish','crayfish','crawdad','ecrevisse',
  'prawns','barnacle','krill','langoustine','langouste','scampi',
  'moreton bay bugs','tomalley','crevette','shrimp paste','dried shrimp',
  'shrimp powder','crab meat','imitation crab','surimi','shellfish',
  'prawn crackers','shrimp chips','lobster bisque','crab bisque',
  'bouillabaisse','paella','gumbo','étouffée'
] WHERE id = 'shellfish';

UPDATE winit_allergies SET keywords = ARRAY[
  'sesame','sesame seed','sesame oil','sesame flour','sesame paste',
  'tahini','til','teel','gingelly','gingelly oil','gomasio',
  'sesame salt','halvah','halva','hummus','benne','benne seed',
  'sesame candy','sesame bar','sesame cracker','sesame bread',
  'sesame bagel','sesame noodles','sesame dressing','sesame sauce',
  'sesame butter','black sesame','white sesame','roasted sesame'
] WHERE id = 'sesame';

-- ── Update tree nut items ─────────────────────────────────────────────────────

UPDATE winit_allergies SET keywords = ARRAY[
  'almond','almond milk','almond butter','almond flour','almond oil',
  'almond extract','almond paste','marzipan','amaretto','orgeat',
  'nougat','praline','almond meal','blanched almond','slivered almond',
  'almond flakes','almond slices','almondette'
] WHERE id = 'almonds';

UPDATE winit_allergies SET keywords = ARRAY[
  'cashew','cashew milk','cashew butter','cashew cream','cashew cheese',
  'cashew oil','cashew nut','cashew pieces','roasted cashew'
] WHERE id = 'cashews';

UPDATE winit_allergies SET keywords = ARRAY[
  'walnut','walnut oil','walnut butter','black walnut','english walnut',
  'walnut extract','candied walnut','walnut pieces','walnut halves'
] WHERE id = 'walnuts';

UPDATE winit_allergies SET keywords = ARRAY[
  'pecan','pecan oil','pecan butter','pecan meal','candied pecan',
  'pecan pie','pecan pieces','pecan halves'
] WHERE id = 'pecans';

UPDATE winit_allergies SET keywords = ARRAY[
  'pistachio','pistachio oil','pistachio butter','pistachio paste',
  'pistachio milk','roasted pistachio','pistachio nut','pistachio extract'
] WHERE id = 'pistachios';

UPDATE winit_allergies SET keywords = ARRAY[
  'hazelnut','hazelnut oil','hazelnut butter','hazelnut milk','hazelnut flour',
  'hazelnut extract','hazelnut paste','filbert','filbert nut','nutella-type',
  'praline','gianduja','roasted hazelnut'
] WHERE id = 'hazelnuts';

UPDATE winit_allergies SET keywords = ARRAY[
  'brazil nut','brazil nut oil','para nut','cream nut','castanha-do-para'
] WHERE id = 'brazil_nuts';

UPDATE winit_allergies SET keywords = ARRAY[
  'macadamia','macadamia nut','macadamia oil','macadamia butter',
  'macadamia milk','queensland nut','bush nut','maroochi nut','bauple nut'
] WHERE id = 'macadamia';

UPDATE winit_allergies SET keywords = ARRAY[
  'pine nut','pine seed','pinyon','pinon','pignoli','pignolia',
  'piñon','cedar nut','pine nut oil','stone pine'
] WHERE id = 'pine_nuts';

UPDATE winit_allergies SET keywords = ARRAY[
  'chestnut','chestnut flour','chestnut oil','chestnut puree',
  'marron','water chestnut','roasted chestnut','candied chestnut',
  'chestnut cream'
] WHERE id = 'chestnut';

UPDATE winit_allergies SET keywords = ARRAY[
  'coconut','coconut milk','coconut cream','coconut oil','coconut flour',
  'coconut water','coconut flakes','coconut butter','coconut sugar',
  'coconut aminos','desiccated coconut','shredded coconut','coconut extract'
] WHERE id = 'coconut';

UPDATE winit_allergies SET keywords = ARRAY[
  'hickory nut','hickory','shagbark hickory','shellbark hickory','bitternut'
] WHERE id = 'hickory_nut';

-- ── New allergy categories ────────────────────────────────────────────────────

INSERT INTO winit_allergy_categories (id, label, icon, sort_order)
VALUES
  ('corn',            'Corn / Maize',                '🌽', 20),
  ('mollusks',        'Mollusks',                    '🦑', 21),
  ('gluten',          'Gluten',                      '🌾', 22),
  ('meat',            'Meat',                        '🥩', 23),
  ('legumes',         'Legumes',                     '🫘', 24),
  ('spices',          'Spices',                      '🌶️', 25),
  ('gluten_free_grains', 'Gluten-Free Grains',       '🌿', 26),
  ('miscellaneous',   'Miscellaneous',               '🍬', 27),
  ('nightshades',     'Nightshades',                 '🍅', 28),
  ('seeds',           'Seeds',                       '🌱', 29),
  ('fruits',          'Fruits',                      '🍎', 30),
  ('vegetables',      'Vegetables',                  '🥦', 31),
  ('vegan_foods',     'Vegan Foods',                 '🌿', 32),
  ('additives',       'Additives & Preservatives',   '🧪', 33)
ON CONFLICT (id) DO NOTHING;

-- ── Remove corn from 'other' if present and add to new category ───────────────

UPDATE winit_allergies SET category_id = 'corn' WHERE id = 'corn';

-- ── New allergy items ─────────────────────────────────────────────────────────

INSERT INTO winit_allergies (id, category_id, label, keywords, description, sort_order)
VALUES
  ('mollusks', 'mollusks', 'Mollusks', ARRAY[
    'clams','cuttlefish','mussels','octopus','oysters','scallops',
    'snails','escargot','squid','calamari','abalone','cockle',
    'glucosamine','limpet','periwinkle','whelk','chiton',
    'clam juice','clam chowder','oyster sauce','oyster crackers',
    'bouillabaisse','paella','seafood medley','shellfish'
  ], 'Mollusks including clams, oysters, squid, and related seafood', 1),

  ('gluten', 'gluten', 'Gluten', ARRAY[
    'gluten','wheat','barley','rye','spelt','kamut','farro','durum',
    'einkorn','emmer','triticale','semolina','farina','bulgur','oats',
    'malt','malt extract','malt vinegar','maltose','maltodextrin',
    'modified food starch','hydrolyzed wheat protein','seitan',
    'brewer''s yeast','wheat starch','wheat flour','wheat bran',
    'wheat germ','couscous','bread','flour','pasta','crackers',
    'pretzels','breadcrumbs','panko','croutons','beer','ale','lager',
    'malt beverage','soy sauce','teriyaki sauce','worcestershire sauce',
    'communion wafer','playdough'
  ], 'All gluten-containing grains and derivatives', 1),

  ('corn_item', 'corn', 'Corn / Maize', ARRAY[
    'corn','maize','corn starch','cornstarch','corn flour','corn meal',
    'cornmeal','corn syrup','high fructose corn syrup','hfcs',
    'corn oil','corn chips','corn tortilla','popcorn','hominy',
    'grits','polenta','masa','masa harina','corn sugar','corn dextrose',
    'dextrose','fructose','maltodextrin','corn maltodextrin',
    'corn alcohol','grain alcohol','ethanol','corn vinegar',
    'corn-based xanthan gum','corn-based citric acid',
    'modified corn starch','modified food starch',
    'corn-derived ascorbic acid','corn-derived vitamin c',
    'caramel color','caramel','corn-based baking powder',
    'corn-derived confectioner''s sugar','powdered sugar',
    'corn-based iodized salt','vegetable starch','vegetable gum',
    'corn-fed beef','corn puffs','candy corn','corn bread',
    'corn dog','corn relish','corn salsa','corn chowder',
    'succotash','baby corn','sweet corn','corn on the cob',
    'frozen corn','canned corn','cream of corn','corn porridge'
  ], 'Corn and corn-derived ingredients', 1),

  ('meat_item', 'meat', 'Meat & Poultry', ARRAY[
    'beef','chicken','pork','lamb','turkey','duck','goose','veal',
    'rabbit','bison','venison','game meat','processed meat',
    'deli meat','lunch meat','hot dog','sausage','bacon','ham',
    'salami','pepperoni','prosciutto','pancetta','chorizo','bologna',
    'mortadella','pastrami','corned beef','meat broth','bone broth',
    'beef stock','chicken stock','pork rinds','gelatin','lard',
    'suet','tallow','schmaltz','chicken fat','duck fat',
    'meat extract','beef extract','chicken extract','meat flavoring',
    'meat by-products','organ meats','liver','kidney','heart',
    'tripe','sweetbreads','tongue','blood sausage','black pudding'
  ], 'Meat and poultry products', 1),

  ('legumes_item', 'legumes', 'Legumes & Pulses', ARRAY[
    'kidney bean','navy bean','soybean','chickpea','garbanzo',
    'broad bean','fava bean','black bean','black-eyed pea','cowpea',
    'lentil','pinto bean','lima bean','butter bean','cannellini',
    'adzuki bean','mung bean','split pea','green pea','snow pea',
    'sugar snap pea','edamame','hummus','dal','dhal','dahl',
    'refried beans','baked beans','bean dip','bean paste',
    'bean flour','chickpea flour','lentil flour','pea protein',
    'pea flour','legume','pulse','bean sprouts'
  ], 'Legumes, beans, lentils, and related pulses', 1),

  ('spices_item', 'spices', 'Spices & Herbs', ARRAY[
    'black pepper','white pepper','cinnamon','nutmeg','mace','anise',
    'star anise','bay leaf','caraway','cayenne pepper','chili pepper',
    'curry powder','dill','habanero pepper','jalapeño','oregano',
    'paprika','turmeric','cumin','coriander','cardamom','cloves',
    'allspice','fenugreek','ginger','horseradish','mint','parsley',
    'rosemary','sage','tarragon','thyme','vanilla','wasabi',
    'garlic powder','onion powder','mixed spice','five spice',
    'garam masala','ras el hanout','za''atar','herbes de provence',
    'italian seasoning','cajun seasoning','taco seasoning',
    'chili flakes','red pepper flakes','pepper spray','annatto'
  ], 'Spices, herbs and seasonings', 1),

  ('gluten_free_grains_item', 'gluten_free_grains', 'Gluten-Free Grains & Starches', ARRAY[
    'amaranth','brown rice','buckwheat','millet','arrowroot','cassava',
    'tapioca','taro root','sorghum','quinoa','teff','wild rice',
    'white rice','rice flour','brown rice flour','tapioca starch',
    'tapioca flour','arrowroot starch','arrowroot flour',
    'cassava flour','cassava starch','potato starch','potato flour',
    'sweet potato starch','yuca','plantain flour','corn-free starch',
    'gluten-free oats','gluten-free flour blend','buckwheat flour',
    'amaranth flour','millet flour','sorghum flour','teff flour',
    'rice noodles','rice paper','rice crackers','rice cakes'
  ], 'Gluten-free grains and starch sources', 1),

  ('miscellaneous_item', 'miscellaneous', 'Miscellaneous', ARRAY[
    'cocoa','coffee','hops','rosemary','vanilla bean','yeast',
    'brewer''s yeast','nutritional yeast','baker''s yeast',
    'black tea','green tea','white tea','oolong tea','cane sugar',
    'lemon grass','lemongrass','chamomile','elderflower','hibiscus',
    'licorice','liquorice','carob','spirulina','chlorella',
    'bee pollen','royal jelly','propolis','honey','mead',
    'kombucha','kefir','algae','seaweed','nori','kelp','wakame',
    'spirulina','chlorella','agar','agar-agar','carrageenan',
    'guar gum','xanthan gum','locust bean gum','gum arabic',
    'gelatin','collagen','bone meal','cod liver oil'
  ], 'Miscellaneous common intolerances', 1),

  ('nightshades_item', 'nightshades', 'Nightshades', ARRAY[
    'tomato','tomatoes','green pepper','bell pepper','red pepper',
    'yellow pepper','orange pepper','white potato','potato',
    'eggplant','aubergine','tomatillo','pepino','goji berry',
    'cape gooseberry','paprika','cayenne','chili pepper','chili',
    'red pepper flakes','jalapeño','habanero','serrano','chipotle',
    'ancho pepper','poblano','pimento','tobacco','ashwagandha',
    'potato starch','potato flour','tomato sauce','ketchup',
    'salsa','marinara','tomato paste','tomato juice','v8 juice'
  ], 'Nightshade vegetables and related plants', 1),

  ('seeds_item', 'seeds', 'Seeds', ARRAY[
    'sesame seed','flaxseed','flax','linseed','poppy seed','rapeseed',
    'canola','sunflower seed','hemp seed','hemp','chia seed','chia',
    'mustard seed','pumpkin seed','watermelon seed','pomegranate seed',
    'psyllium seed','psyllium','fennel seed','caraway seed','coriander seed',
    'cumin seed','nigella seed','nigella','black seed','black cumin',
    'sesame oil','flaxseed oil','hemp oil','sunflower oil',
    'flaxseed meal','chia gel','flax egg','seed butter',
    'sunflower butter','pumpkin seed butter','hemp butter'
  ], 'Seeds and seed-derived products', 1),

  ('fruits_item', 'fruits', 'Fruits', ARRAY[
    'apple','apricot','avocado','banana','blackberry','blueberry',
    'cherry','coconut','cranberry','currant','date','fig','grape',
    'grapefruit','guava','jackfruit','kiwi','kiwifruit','lemon','lime',
    'lychee','mango','melon','cantaloupe','honeydew','watermelon',
    'nectarine','orange','mandarin','tangerine','clementine','papaya',
    'passion fruit','peach','pear','pineapple','plum','pomegranate',
    'raspberry','strawberry','starfruit','tamarind','tomato',
    'dried fruit','fruit juice','fruit concentrate','fruit extract',
    'fruit flavoring','fruit salad','fruit cocktail','tropical fruit',
    'stone fruit','berry','citrus fruit','raisin','sultana','currant'
  ], 'Fresh, dried, and processed fruits', 1),

  ('vegetables_item', 'vegetables', 'Vegetables', ARRAY[
    'broccoli','cabbage','carrot','cauliflower','celery','cucumber',
    'garlic','onion','leek','shallot','chive','green bean','string bean',
    'kale','spinach','lettuce','arugula','rocket','watercress',
    'mushroom','sweet potato','yam','zucchini','courgette','squash',
    'pumpkin','butternut squash','beet','beetroot','radish','turnip',
    'parsnip','artichoke','asparagus','fennel','kohlrabi','Brussels sprouts',
    'bok choy','chard','collard greens','mustard greens','endive',
    'radicchio','chicory','dandelion greens','corn','peas','snap peas',
    'okra','bamboo shoots','water chestnuts','jicama','celeriac',
    'horseradish','ginger root','turmeric root','parsley root',
    'vegetable broth','vegetable stock','vegetable juice','v8'
  ], 'Fresh, frozen, and processed vegetables', 1),

  ('vegan_foods_item', 'vegan_foods', 'Vegan Foods', ARRAY[
    'tofu','tempeh','seitan','vegan cheese','vegan butter','vegan cream',
    'vegan milk','oat milk','almond milk','soy milk','rice milk',
    'coconut milk','cashew milk','hemp milk','pea milk','macadamia milk',
    'vegan mayo','vegan egg','flax egg','chia egg','aquafaba',
    'nutritional yeast','miso','natto','jackfruit','textured vegetable protein',
    'tvp','tsp','plant-based meat','beyond meat','impossible meat',
    'vegan protein powder','pea protein','hemp protein','rice protein',
    'vegan gelatin','agar','carrageenan','vegan chocolate',
    'vegan ice cream','vegan yogurt','vegan sour cream','coconut cream',
    'coconut oil','palm oil','vegan margarine','shortening'
  ], 'Vegan and plant-based food products', 1),

  ('additives_item', 'additives', 'Additives & Preservatives', ARRAY[
    'annatto','beta-carotene','cochineal','carmine','red 40','allura red',
    'yellow 5','tartrazine','yellow 6','sunset yellow','blue 1','brilliant blue',
    'red 3','erythrosine','green 3','fast green','aspartame','acesulfame k',
    'sucralose','splenda','saccharin','stevia','xylitol','sorbitol',
    'mannitol','erythritol','msg','monosodium glutamate','sodium nitrate',
    'sodium nitrite','sodium benzoate','potassium benzoate','bha','bht',
    'tbhq','propyl gallate','sulfites','sulphites','sulfur dioxide',
    'sodium sulfite','potassium metabisulfite','calcium propionate',
    'sodium propionate','nisin','natamycin','guar gum','xanthan gum',
    'carrageenan','carrageenan','lecithin','soy lecithin','sunflower lecithin',
    'bpa','bisphenol a','phthalates','parabens','propylene glycol',
    'polysorbate 80','polysorbate 60','carboxymethyl cellulose','cmc',
    'methylcellulose','hydroxypropyl methylcellulose','hpmc',
    'titanium dioxide','silicon dioxide','calcium silicate',
    'potassium sorbate','sorbic acid','citric acid','ascorbic acid',
    'lactic acid','malic acid','tartaric acid','fumaric acid',
    'phosphoric acid','sodium phosphate','calcium phosphate',
    'mono- and diglycerides','diglycerides','glycerol','glycerin',
    'cellulose','microcrystalline cellulose','modified food starch',
    'food dye','artificial color','artificial flavor','natural flavor',
    'yeast extract','autolyzed yeast','hydrolyzed protein'
  ], 'Food additives, preservatives, colorants, and sweeteners', 1)

ON CONFLICT (id) DO NOTHING;

-- ── Update barley/rye/oats with keywords ─────────────────────────────────────

UPDATE winit_allergies SET keywords = ARRAY[
  'barley','barley flour','barley malt','barley extract','malt','pearl barley',
  'barley grass','barley water','barley bread','barley soup','pot barley',
  'barley beta-glucan','hordeum vulgare'
] WHERE id = 'barley';

UPDATE winit_allergies SET keywords = ARRAY[
  'rye','rye flour','rye bread','pumpernickel','rye crispbread','rye cracker',
  'rye whiskey','rye beer','rye malt','secale cereale','rye grain',
  'rye bran','rye starch','rye extract'
] WHERE id = 'rye';

UPDATE winit_allergies SET keywords = ARRAY[
  'oats','oatmeal','rolled oats','steel cut oats','oat flour','oat bran',
  'oat groats','instant oats','quick oats','oat milk','oat cream',
  'granola','muesli','porridge','oat extract','avena sativa',
  'whole grain oats','gluten-free oats','oat fiber','oat beta-glucan'
] WHERE id = 'oats';
