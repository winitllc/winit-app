
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
    // image: local asset path under assets/browse/
    mainCategories: [
      { tag: 'cheese',            displayName: 'Cheeses',         image: 'assets/browse/cheeses.png' },
      { tag: 'chicken',           displayName: 'Chicken',         image: 'assets/browse/chicken.png' },
      { tag: 'pizza',             displayName: 'Pizza',           image: 'assets/browse/pizza.png' },
      { tag: 'pasta',             displayName: 'Pasta',           image: 'assets/browse/pasta.png' },
      { tag: 'breakfast-cereals', displayName: 'Cereals',         image: 'assets/browse/cereal.png' },
      { tag: 'bread',             displayName: 'Bread',           image: 'assets/browse/bread.png' },
      { tag: 'yogurts',           displayName: 'Yogurt',          image: 'assets/browse/yogurt.png' },
      { tag: 'plant-based-foods', displayName: 'Plant Based',     image: 'assets/browse/plant.png' },
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
