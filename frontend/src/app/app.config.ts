
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
      { tag: 'snacks',            displayName: 'Snacks',            image: 'https://images.pexels.com/photos/1583884/pexels-photo-1583884.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'beverages',         displayName: 'Beverages',         image: 'https://images.pexels.com/photos/1292294/pexels-photo-1292294.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'breakfast-cereals', displayName: 'Breakfast Cereals', image: 'https://images.pexels.com/photos/2802527/pexels-photo-2802527.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'bread',             displayName: 'Bread',             image: 'https://images.pexels.com/photos/1775043/pexels-photo-1775043.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'yogurts',           displayName: 'Yogurts',           image: 'https://images.pexels.com/photos/1435706/pexels-photo-1435706.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'cheese',            displayName: 'Cheese',            image: 'https://images.pexels.com/photos/821365/pexels-photo-821365.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'plant-based-foods', displayName: 'Plant-Based',       image: 'https://images.pexels.com/photos/1580466/pexels-photo-1580466.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'sauces',            displayName: 'Sauces',            image: 'https://images.pexels.com/photos/4518843/pexels-photo-4518843.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'frozen-foods',      displayName: 'Frozen Foods',      image: 'https://images.pexels.com/photos/3872373/pexels-photo-3872373.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'desserts',          displayName: 'Desserts',          image: 'https://images.pexels.com/photos/291528/pexels-photo-291528.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'dairy',             displayName: 'Dairy & Eggs',      image: 'https://images.pexels.com/photos/248412/pexels-photo-248412.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'pasta-rice',        displayName: 'Pasta & Rice',      image: 'https://images.pexels.com/photos/1438672/pexels-photo-1438672.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'chocolate-candy',   displayName: 'Chocolate & Candy', image: 'https://images.pexels.com/photos/918327/pexels-photo-918327.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'bakery',            displayName: 'Bakery',            image: 'https://images.pexels.com/photos/205961/pexels-photo-205961.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'fruits-vegetables', displayName: 'Fruits & Veg',      image: 'https://images.pexels.com/photos/1640777/pexels-photo-1640777.jpeg?auto=compress&cs=tinysrgb&w=400' },
      { tag: 'meat-seafood',      displayName: 'Meat & Seafood',    image: 'https://images.pexels.com/photos/65175/pexels-photo-65175.jpeg?auto=compress&cs=tinysrgb&w=400' },
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
