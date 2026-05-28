import { client, model } from 'wuzinit-common';
import { Config } from './config';
import ProfileFactory from './factory';

export default class ProfileService {

    private dynamoDB: client.DynamoDB;

    constructor (
        private factory: ProfileFactory
    ) {
        this.dynamoDB = new client.DynamoDB();
    }

    public async getProfileById(id: string): Promise<model.Profile> {
        try {
            const profile = await this.dynamoDB.getByHashKey(Config.profile.tableName, Config.profile.idKey, id);
            console.log(`ProfileService.getProfileById: profile = ${JSON.stringify(profile)}`);
            if (profile && profile.hasOwnProperty(Config.profile.idKey)) {
                return profile as model.Profile;
            }
        } catch (error) {
            console.error(`ProfileService.getProfileById: Error: ${JSON.stringify(error)}`);
        }
    }

    public async getProfileByEmail(email: string): Promise<model.Profile> {
        try {
            const profile = await this.dynamoDB.getBySecondaryHashKey(Config.profile.tableName, Config.profile.getByEmailIndex, Config.profile.emailKey, email);
            console.log(`ProfileService.getProfileByEmail: profile = ${JSON.stringify(profile)}`);
            if (profile && profile.hasOwnProperty(Config.profile.idKey)) {
                return profile as model.Profile;
            }
        } catch (error) {
            console.error(`ProfileService.getProfileByEmail: Error: ${JSON.stringify(error)}`);
        }
    }

    public async getUserById(id: string): Promise<model.User> {
        try {
            const user = await this.dynamoDB.getByHashKey(Config.user.tableName, Config.user.idKey, id);
            console.log(`ProfileService.getUserById: user = ${JSON.stringify(user)}`);
            if (user && user.hasOwnProperty(Config.user.idKey)) {
                return user as model.User;
            }
        } catch (error) {
            console.error(`ProfileService.getUserById: Error: ${JSON.stringify(error)}`);
        }
    }

    public async getUserByEmail(email: string): Promise<model.User> {
        try {
            const user = await this.dynamoDB.getBySecondaryHashKey(Config.user.tableName, Config.user.getByEmailIndex, Config.user.emailKey, email);
            console.log(`ProfileService.getUserById: user = ${JSON.stringify(user)}`);
            if (user && user.hasOwnProperty(Config.user.idKey)) {
                return user as model.User;
            }
        } catch (error) {
            console.error(`ProfileService.getUserById: Error: ${JSON.stringify(error)}`);
        }
    }

    public async getAllergiesById(conditionIds: string[]): Promise<model.Allergy[]> {
        try {
            const allergies: model.Allergy[] = [];
            let allergy: model.Allergy;
            for(const allergyId of conditionIds) {
                allergy = await this.dynamoDB.getByHashKey(Config.allergy.tableName, Config.allergy.idKey, allergyId);
                if (allergy && allergy.hasOwnProperty(Config.allergy.idKey)) {
                    allergies.push(allergy);
                }
            }
            console.log(`ProfileService.getAllergiesById: allergies = ${JSON.stringify(allergies)}`);
            return allergies;
        } catch (error) {
            console.error(`ProfileService.getAllergiesById: Error: ${JSON.stringify(error)}`);
        }
    }

    public async getMedicalConditionsById(conditionIds: string[]): Promise<model.Medical[]> {
        try {
            const conditions: model.Medical[] = [];
            let condition: model.Medical;
            for(const conditionId of conditionIds) {
                condition = await this.dynamoDB.getByHashKey(Config.medicalConditions.tableName, Config.medicalConditions.idKey, conditionId);
                if (condition && condition.hasOwnProperty(Config.medicalConditions.idKey)) {
                    conditions.push(condition);
                }
            }
            console.log(`ProfileService.getMedicalConditionsById: conditions = ${JSON.stringify(conditions)}`);
            return conditions;
        } catch (error) {
            console.error(`ProfileService.getMedicalConditionsById: Error: ${JSON.stringify(error)}`);
        }
    }

    public async getSymptomsById(symptomIds: string[]): Promise<model.Symptom[]> {
        try {
            const symptoms: model.Symptom[] = [];
            let symptom: model.Symptom;
            for(const symptomId of symptomIds) {
                symptom = await this.dynamoDB.getByHashKey(Config.symptoms.tableName, Config.symptoms.idKey, symptomId);
                if (symptom && symptom.hasOwnProperty(Config.symptoms.idKey)) {
                    symptoms.push(symptom);
                }
            }
            console.log(`ProfileService.getSymptomsById: symptoms = ${JSON.stringify(symptoms)}`);
            return symptoms;
        } catch (error) {
            console.error(`ProfileService.getSymptomsById: Error: ${JSON.stringify(error)}`);
        }
    }

    public async saveUser(newUser: model.User): Promise<void> {
        try {
            return this.dynamoDB.putItem(Config.user.tableName, newUser);
        } catch (error) {
            console.error(`ProfileService.saveUser: Error: ${JSON.stringify(error)}`);
        }
    }

    public async saveProfile(newProfile: model.Profile): Promise<void> {
        try {
            return this.dynamoDB.putItem(Config.profile.tableName, newProfile);
        } catch (error) {
            console.error(`ProfileService.saveProfile: Error: ${JSON.stringify(error)}`);
        }
    }

    public async getProfilePoints(profileId: string): Promise<model.WuzinitPoints> {
        try {
            const profilePoints: model.WuzinitPoints = await this.dynamoDB.getByHashKey(Config.profilePoints.tableName, Config.profilePoints.idKey, profileId);
            console.log(`ProfileService.getProfilePoints: profilePoints = ${JSON.stringify(profilePoints)}`);
            if (profilePoints && profilePoints.hasOwnProperty(Config.profilePoints.idKey)) {
                return profilePoints as model.WuzinitPoints;
            } else {
                const newProfilePoints: model.WuzinitPoints = this.factory.createNewProfilePoints(profileId);
                await this.saveProfilePoints(newProfilePoints);
                return newProfilePoints;
            }
        } catch (error) {
            console.error(`ProfileService.getProfilePoints: Error: ${JSON.stringify(error)}`);
        }
    }

    public async saveProfilePoints(newProfilePoints: model.WuzinitPoints): Promise<void> {
        try {
            return this.dynamoDB.putItem(Config.profilePoints.tableName, newProfilePoints);
        } catch (error) {
            console.error(`ProfileService.saveProfilePoints: Error: ${JSON.stringify(error)}`);
        }
    }

    public async getFeatures(): Promise<model.PremiumFeature[]> {
        try {
            return this.dynamoDB.getAllPaginated(Config.premiumFeatures.tableName, 20);
        } catch (error) {
            console.error(`ProfileService.getFeatures: Error ${JSON.stringify(error)}`)
        }
    }

    public async savePremiumFeaturePurchaseConfirmation(confirmation: model.PremiumFeaturePurchaseConfirmation): Promise<void> {
        try {
            return this.dynamoDB.putItem(Config.premiumFeaturePurchaseConfirmations.tableName, confirmation);
        } catch (error) {
            console.error(`ProfileService.savePremiumFeaturePurchaseConfirmation: Error ${JSON.stringify(error)}`)
        }
    }

    public async saveInAppPuchaseConfirmation(confirmation: model.InAppPurchaseConfirmation): Promise<void> {
        try {
            return this.dynamoDB.putItem(Config.inAppPurchaseConfirmations.tableName, confirmation);
        } catch (error) {
            console.error(`ProfileService.saveInAppPuchaseConfirmation: Error ${JSON.stringify(error)}`)
        }
    }

    public async getInAppPurchaseConfirmation(confirmationId: string, profileId: string): Promise<model.InAppPurchaseConfirmation> {
        try {
            const result = await this.dynamoDB.getByCompositeKey(Config.inAppPurchaseConfirmations.tableName, Config.inAppPurchaseConfirmations.rangeKey, profileId, Config.inAppPurchaseConfirmations.sortKey, confirmationId);
            return result as model.InAppPurchaseConfirmation;
        } catch (error) {
            console.error(`ProfileService.getInAppPurchaseConfirmation: Error ${JSON.stringify(error)}`)
        }
    }

    public async getPremiumFeaturePurchaseConfirmation(confirmationId: string, profileId: string): Promise<void> {
        try {
            return this.dynamoDB.getByCompositeKey(Config.premiumFeaturePurchaseConfirmations.tableName, Config.premiumFeaturePurchaseConfirmations.rangeKey, profileId, Config.premiumFeaturePurchaseConfirmations.sortKey, confirmationId);
        } catch (error) {
            console.error(`ProfileService.getPremiumFeaturePurchaseConfirmation: Error ${JSON.stringify(error)}`)
        }
    }

    public async getInAppPurchaseConfirmationsByProfileId(profileId: string, nextPage?: string): Promise<model.InAppPurchaseConfirmation[]> {
        try {
            const results = await this.dynamoDB.getByRangeKey(Config.inAppPurchaseConfirmations.tableName, Config.inAppPurchaseConfirmations.rangeKey, profileId, 20, nextPage);
            console.log(`ProfileService.getInAppPurchaseConfirmationsByProfileId: results from dynamo client: ${JSON.stringify(results)}`);
            return results as model.InAppPurchaseConfirmation[];
        } catch (error) {
            console.error(`ProfileService.getInAppPurchaseConfirmationsByProfileId: Error ${JSON.stringify(error)}`)
        }
    }

    public async getPremiumFeaturePurchaseConfirmationsByProfileId(profileId: string, nextPage?: string): Promise<model.PremiumFeaturePurchaseConfirmation[]> {
        try {
            const results = await this.dynamoDB.getByRangeKey(Config.premiumFeaturePurchaseConfirmations.tableName, Config.premiumFeaturePurchaseConfirmations.rangeKey, profileId, 20, nextPage);
            console.log(`ProfileService.getPremiumFeaturePurchaseConfirmationsByProfileId: results from dynamo client: ${JSON.stringify(results)}`);
            return results as model.PremiumFeaturePurchaseConfirmation[];
        } catch (error) {
            console.error(`ProfileService.getPremiumFeaturePurchaseConfirmationsByProfileId: Error ${JSON.stringify(error)}`)
        }
    }

}