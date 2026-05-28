import { model, requestModel, view } from 'wuzinit-common';

export default class ProfileFactory {

  public makeProfileView(profile: model.Profile, userViews: view.User[], points: model.WuzinitPoints, inAppPurchasesMade: model.InAppPurchaseConfirmation[], premiumFeaturesPurchasesMade: model.PremiumFeaturePurchaseConfirmation[]): view.Profile {
    return {
      id: profile.id,
      primaryUserEmail: profile.primaryUserEmail,
      users: userViews,
      points,
      inAppPurchasesMade,
      premiumFeaturesPurchasesMade
    };
  }

  public makeUserView(user: model.User, allergies: model.Allergy[], conditions: model.Medical[], symptoms: model.Symptom[]): view.User {
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name,
      allergies: allergies,
      medicalConditions: conditions,
      symptoms: symptoms
    };
  }

  public updateProfileModel(currentProfile: model.Profile, currentUser: model.User, newProfileObject: any): model.Profile {
    return {
      id: currentProfile.id,
      primaryUserEmail: newProfileObject.primaryUserEmail,
      users: [currentUser.id],
      lifestyleDiets: newProfileObject.lifestyleDiets ? newProfileObject.lifestyleDiets : []
    };
  }

  public updateUserModel(currentUser: model.User, newUserObject: any): model.User {
    return {
      id: currentUser.id,
      username: newUserObject.username,
      email: newUserObject.email,
      name: newUserObject.name,
      allergies: newUserObject.allergies,
      medicalConditions: newUserObject.medicalConditions,
      symptoms: newUserObject.symptoms
    };
  }

  public createProfileModel(profileId: string, userId: string, newProfileObject: any): model.Profile {
    return {
      id: profileId,
      primaryUserEmail: newProfileObject.primaryUserEmail,
      users: [userId]
    };
  }

  public createUserModel(userId: string, newUserObject: any): model.User {
    return {
      id: userId,
      username: newUserObject.username,
      email: newUserObject.email,
      name: newUserObject.name,
      allergies: newUserObject.hasOwnProperty('allergies') && newUserObject.allergies.hasOwnProperty('length')
        ? newUserObject.allergies.map((allergy: model.Allergy): string => {
          return allergy.id;
        })
        : [],
      medicalConditions: newUserObject.hasOwnProperty('medicalConditions') && newUserObject.medicalConditions.hasOwnProperty('length')
        ? newUserObject.medicalConditions.map((medical: model.Medical): string => {
          return medical.id;
        })
        : [],
      symptoms: newUserObject.hasOwnProperty('symptoms') && newUserObject.symptoms.hasOwnProperty('length')
        ? newUserObject.symptoms.map((symptom: model.Symptom): string => {
          return symptom.id;
        })
        : []
    };
  }

  public createNewProfilePoints(profileId: string): model.WuzinitPoints {
    return {
      profileId,
      pointsBalance: 0,
      pointsPending: 0,
      pointsAllTime: 0,
      pointsUsedAllTime: 0,
      scansAllTime: 0,
      searchesAllTime: 0,
      sectionsAddedAllTime: 0,
      sectionsPending: 0,
      productsPending: 0,
      productsAddedAllTime: 0
    };
  }

  public makePremiumFeaturePurchaseConfirmation(purchaseObject: requestModel.PremiumFeaturePurchaseRequest, transactionId: string, timestamp: number): model.PremiumFeaturePurchaseConfirmation {
    return {
      transactionId,
      profileId: purchaseObject.profileId,
      featureId: purchaseObject.featureId,
      featureTitle: purchaseObject.featureTitle,
      purchasedOn: timestamp
    };
  }
}
