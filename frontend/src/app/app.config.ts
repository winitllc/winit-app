
export const AppConfig = {
  cache: {
      keys: {
          profile: 'profile',
          currentProduct: 'currentProduct',
          dangerousIngredients: 'dangerousIngredients',
          oauthTokens: 'authTokens',
          iamCredentials: 'iamCredentials',
          spoonacularAPIKey: 'spoonacularAPIKey'
      },
      prefix: 'wii15'
  },
  auth: {
    scopes: {
      appUser: 'openid'
    }
  },
  socialMediaSupport: [
    'facebook',
    'instagram',
    'twitter',
    'whatsapp'
  ],
  controlMessages: {
    noProduct: 'no product found'
  },
  inAppPurchases: [
    'one_dollar_points'
  ],
  pointAwards: {
    addProduct: [0, 40, 80, 140],
    updateSection: 40,
    scan: 3,
    search: 1,
    shareOnSocialMedia: 50,
    inAppPurchase: {
      oneDollar: 900,
      fiveDollars: 4650,
      tenDollars: 9550
    }
  },
  categories: {
    // tag: verified OpenFoodFacts category slug (without "en:" prefix — service adds it)
    // image: local asset path or Pexels URL
    mainCategories: [
      { tag: 'snacks',            displayName: 'Snacks',           image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'beverages',         displayName: 'Beverages',        image: 'https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'breakfast-cereals', displayName: 'Breakfast Cereals', image: 'assets/browse/cereal.png' },
      { tag: 'bread',             displayName: 'Bread',            image: 'assets/browse/bread.png' },
      { tag: 'yogurts',           displayName: 'Yogurts',          image: 'assets/browse/yogurt.png' },
      { tag: 'cheese',            displayName: 'Cheese',           image: 'assets/browse/cheeses.png' },
      { tag: 'plant-based-foods', displayName: 'Plant-Based Foods', image: 'assets/browse/plant.png' },
      { tag: 'sauces',            displayName: 'Sauces',           image: 'https://images.pexels.com/photos/1435706/pexels-photo-1435706.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'frozen-foods',      displayName: 'Frozen Foods',     image: 'https://images.pexels.com/photos/3872373/pexels-photo-3872373.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'desserts',          displayName: 'Desserts',         image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400' },
    ]
  },
  emptySpoonacularProduct: {
    "credits":{},
    "servings":{
      "number":0,
      "raw":"N/A",
      "unit":"N/A",
      "size":0
    },
    "title":"Not Found",
    "id":0,
    "importantBadges":[],
    "nutrition":{
      "caloricBreakdown":{
        "percentProtein":0,
        "percentCarbs":0,
        "percentFat":0
      },
      "nutrients":[],
      "fat":"N/A",
      "carbs":"N/A",
      "calories":0,
      "protein":"N/A"
    },
    "upc":"0",
    "generatedText":null,
    "image":null,
    "usdaCode":null,
    "ingredients":[],
    "imageType":null,
    "images":[],
    "description":null,
    "breadcrumbs":[],
    "aisle":null,
    "badges":[],
    "ingredientCount":0,
    "likes":0,
    "spoonacularScore":null,
    "ingredientList":"N/A",
    "price":0,
    "brand":"N/A",
    "category":"upc 0",
    "type":"spoonacular"
  },
  emptyWuzinitProduct: {
    code: '',
    type: 'wuzinit',
    productName: '',
    breadcrumbs: [
        'N/A'
    ],
    images: {},
    badges: [],
    important_badges: [],
    ingredientsText: '',
    ingredientsList: [],
    tracesList: [],
    containsList: [],
    nutrition: {
        calories: 0,
        carbs: '0g',
        fat: '0g',
        protein: '0g'
    }
  }
};
