export const Config = {
  elasticSearch: {
    config: {
      node: 'https://search-wuzinit-prod-rv5q7sfo7pj2tdqb652uta6h5y.us-west-2.es.amazonaws.com/'
    },
    product: {
      index: 'products'
    }
  },
  dynamoDB: {
    product: {
      // tableName: 'Product', // REMOVE WHEN THE MODERATOR FEATURE IS IMPLEMENTED
      tableName: 'ProductUpdates',
      hashKey: 'code',
      categoryKey: 'categoriesTags'
    },
    productUpdate: {
      tableName: 'ProductUpdates',
      hashKey: 'code',
      categoryKey: 'categoriesTags'
    }
  },
  s3: {
    productImageBucket: 'wuzinit-product-images-bucket'
  }
};
