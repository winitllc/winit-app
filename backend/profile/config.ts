export const Config = {
  profile: {
    tableName: 'Profile',
    getByEmailIndex: 'Profile_EmailIndex',
    idKey: 'id',
    emailKey: 'primaryUserEmail'
  },
  user: {
    tableName: 'User',
    getByEmailIndex: 'User_EmailIndex',
    idKey: 'id',
    emailKey: 'email'
  },
  allergy: {
    tableName: 'Allergy',
    idKey: 'id'
  },
  medicalConditions: {
    tableName: 'Medical',
    idKey: 'id'
  },
  profilePoints: {
    tableName: 'WuzinitPoints',
    idKey: 'profileId'
  },
  premiumFeatures: {
    tableName: 'WuzinitPremiumFeature',
    idKey: 'featureId'
  },
  premiumFeaturePurchaseConfirmations: {
    tableName: 'WuzinitPremiumFeaturePurchase',
    rangeKey: 'profileId',
    sortKey: 'transactionId'
  },
  inAppPurchaseConfirmations: {
    tableName: 'WuzinitInAppPurchaseConfirmations',
    rangeKey: 'profileId',
    sortKey: 'transactionId'
  },
  symptoms: {
    tableName: 'Symptoms',
    idKey: 'symptomId'
  }
};
