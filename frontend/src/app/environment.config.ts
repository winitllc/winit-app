
const Dev = {
  api: {
    imageService: {
      baseUrl: 'https://pj4pduykha.execute-api.us-west-2.amazonaws.com/dev/',
      uploadToS3: 'uploadToS3',
      imageToText: 'imageToText'
    },
    wuzinitProducts: {
      baseUrl: 'https://zik33f1e36.execute-api.us-west-2.amazonaws.com/dev/',
      addProductUpdate: 'addProductUpdate',
      getByCode: 'getByCode'
    },
    openFoodFactsProducts: {
      baseUrl: 'https://us.openfoodfacts.org',
      testUrl: 'https://world.openfoodfacts.net',
      addProductUpdate: '/cgi/product_jqm2.pl',
      getByCode: '/api/v2/product/',
      searchByTag: '/api/v2/search',
      // searchByTag: '/cgi/search.pl',
      headerUserAgent: 'What\'s In It/1.0 - (info@winitclinic.com)'
    },
    spoonacularProducts: {
      baseUrl: 'https://api.spoonacular.com/',
      getByCode: 'food/products/upc/',
      getById: 'food/products/',
      getByText: 'food/products/search'
    },
    profile: {
      baseUrl: 'https://r4rbuvlfrg.execute-api.us-west-2.amazonaws.com/dev/',
      getById: 'getById',
      getByEmail: 'getByEmail',
      getProfilePoints: 'getProfilePoints',
      updateProfilePoints: 'updateProfilePoints',
      postUpdateProfile: 'updateProfile',
      postCreateProfile: 'createProfile',
      getFeatures: 'getFeatures',
      purchaseFeature: 'makePurchase',
      storeInAppPurchaseConfirmation: 'storeInAppPurchaseConfirmation'
    },
    allergies: {
      baseUrl: 'https://uwiejnbst7.execute-api.us-west-2.amazonaws.com/dev/',
      getAll: 'getAllergies'
    },
    medicalConditions: {
      baseUrl: 'https://p0e2k4kdze.execute-api.us-west-2.amazonaws.com/dev/',
      getAll: 'getMedicalConditions'
    },
    diets: {
      baseUrl: 'https://pnvzzf0xi1.execute-api.us-west-2.amazonaws.com/dev/',
      getAll: 'getLifestyleDiets'
    },
    symptoms: {
      baseUrl: 'https://yn2jdewg47.execute-api.us-west-2.amazonaws.com/dev/',
      getAll: 'getSymptoms'
    },
    utilService: {
      baseUrl: 'https://1s1pzxqg79.execute-api.us-west-2.amazonaws.com/dev/',
      awsCredentials: 'awsCredentials',
      spoonacularAPIKey: 'spoonacularAPIKey'
    }
  },
  auth: {
    region: 'us-west-2',
    userPoolId: 'us-west-2_FbdljGJSe',
    cognitoDomain: 'wuzinit.auth.us-west-2.amazoncognito.com',
    clientId: '1i8d0jefbqk3rguhkn80hlhvpt',
    clientSecret: 'pc5bisl3m4ghv8qm567254j61poiouupmftpgs80t917mgrrmg8',
    loginSuccessCallbackURL: 'https://localhost/login-success',
    logoutSuccessCallbackURL: 'https://localhost/logout-success'
  },
  s3: {
    bucket: 'wuzinit-product-images-bucket',
    cloudfrontURL: 'd37c5yx0fg82pb.cloudfront.net'
  }
};

const Prod = {
  api: {
    wuzinitProducts: {
      baseUrl: 'https://dj5mommsj7.execute-api.us-west-2.amazonaws.com/prod/',
      addProductUpdate: 'addProductUpdate',
      getByCode: 'getByCode'
    },
    spoonacularProducts: {
      baseUrl: 'https://api.spoonacular.com/',
      getByCode: 'food/products/upc/',
      getById: 'food/products/',
      getByText: 'food/products/search'
    },
    profile: {
      baseUrl: 'https://vmytunue3f.execute-api.us-west-2.amazonaws.com/prod/',
      getById: 'getById',
      getByEmail: 'getByEmail',
      getProfilePoints: 'getProfilePoints',
      updateProfilePoints: 'updateProfilePoints',
      postUpdateProfile: 'updateProfile',
      postCreateProfile: 'createProfile',
      getFeatures: 'getFeatures',
      purchaseFeature: 'makePurchase',
      storeInAppPurchaseConfirmation: 'storeInAppPurchaseConfirmation'
    },
    allergies: {
      baseUrl: 'https://nx66diuxme.execute-api.us-west-2.amazonaws.com/prod/',
      getAll: 'getAllergies'
    },
    medicalConditions: {
      baseUrl: 'https://qv7xox0lb3.execute-api.us-west-2.amazonaws.com/prod/',
      getAll: 'getMedicalConditions'
    },
    diets: {
      baseUrl: 'https://k5234rq1v7.execute-api.us-west-2.amazonaws.com/prod/',
      getAll: 'getLifestyleDiets'
    },
    symptoms: {
      baseUrl: 'https://.execute-api.us-west-2.amazonaws.com/prod/',
      getAll: 'getSymptoms'
    },
    utilService: {
      baseUrl: 'https://8x9ah5bdtb.execute-api.us-west-2.amazonaws.com/prod/',
      awsCredentials: 'awsCredentials',
      spoonacularAPIKey: 'spoonacularAPIKey'
    }
  },
  auth: {
    region: 'us-west-2',
    userPoolId: 'us-west-2_FbdljGJSe',
    cognitoDomain: 'wuzinit.auth.us-west-2.amazoncognito.com',
    clientId: '1i8d0jefbqk3rguhkn80hlhvpt',
    clientSecret: 'pc5bisl3m4ghv8qm567254j61poiouupmftpgs80t917mgrrmg8',
    loginSuccessCallbackURL: 'https://localhost/login-success',
    logoutSuccessCallbackURL: 'https://localhost/logout-success'
  },
  s3: {
    bucket: 'wuzinit-product-images-bucket',
    cloudfrontURL: 'd37c5yx0fg82pb.cloudfront.net'
  }
};

let config: any = Dev;

// switch (process.env.ENV) {
//   case 'prod':
//       config = Prod;
//       break;
//   case 'dev':
//   default:
//       config = Dev;
//       break;
// }

export const EnvironmentConfig = config;
