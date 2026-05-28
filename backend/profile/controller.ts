import { v4 as uuid } from 'uuid';
import { model, requestModel, view } from 'wuzinit-common';
import ProfileService from './service';
import ProfileFactory from './factory';

export default class ProfileController {

    constructor(
        private service: ProfileService,
        private factory: ProfileFactory
    ) {}

    async getProfileById(id: string): Promise<view.Profile | string> {
        try {
            const profile: model.Profile = await this.service.getProfileById(id);
            if (profile && profile.hasOwnProperty('id')) {
                const userViews: view.User[] = await this.getUserViewsById(profile.users);
                const points: model.WuzinitPoints = await this.service.getProfilePoints(id);
                const inAppPurchasesMade: model.InAppPurchaseConfirmation[] = await this.service.getInAppPurchaseConfirmationsByProfileId(id);
                const premiumFeaturesPurchasesMade: model.PremiumFeaturePurchaseConfirmation[] = await this.service.getPremiumFeaturePurchaseConfirmationsByProfileId(id);
                const profileView: view.Profile = this.factory.makeProfileView(profile, userViews, points, inAppPurchasesMade, premiumFeaturesPurchasesMade);
                console.log(`ProfileController.getProfileById: profileView = ${JSON.stringify(profileView)}`);
                return profileView;
            }
            return 'Profile not found.';
        } catch (error) {
            console.error(`ProfileController.getProfileById: Error getting profile by id ${JSON.stringify(error)}`);
        }
    }

    async getProfileByEmail(email: string): Promise<view.Profile | string> {
        try {
            const profile: model.Profile = await this.service.getProfileByEmail(email);
            if (profile && profile.hasOwnProperty('id')) {
                const userViews: view.User[] = await this.getUserViewsById(profile.users);
                const points: model.WuzinitPoints = await this.service.getProfilePoints(profile.id);
                const inAppPurchasesMade: model.InAppPurchaseConfirmation[] = await this.service.getInAppPurchaseConfirmationsByProfileId(profile.id);
                const premiumFeaturesPurchasesMade: model.PremiumFeaturePurchaseConfirmation[] = await this.service.getPremiumFeaturePurchaseConfirmationsByProfileId(profile.id);
                const profileView: view.Profile = this.factory.makeProfileView(profile, userViews, points, inAppPurchasesMade, premiumFeaturesPurchasesMade);
                console.log(`ProfileController.getProfileByEmail: profileView = ${JSON.stringify(profileView)}`);
                return profileView;
            }
            return 'Profile not found.';
        } catch (error) {
            console.error(`ProfileController.getProfileByEmail: Error getting profile by email ${JSON.stringify(error)}`);
        }
    }

    async updateProfile(newProfileObject: any): Promise<void> {
        try {
            const newUserObject: any = newProfileObject.users[0];
            const currentProfile: model.Profile = await this.service.getProfileById(newProfileObject.id);
            const currentUser: model.User = await this.service.getUserByEmail(newProfileObject.primaryUserEmail);
            const newProfile: model.Profile = this.factory.updateProfileModel(currentProfile, currentUser, newProfileObject);
            const newUser: model.User = this.factory.updateUserModel(currentUser, newUserObject);
            console.log(`ProfileController.updateProfile: new Profile: ${JSON.stringify(newProfile)}`);
            console.log(`ProfileController.updateProfile: new User: ${JSON.stringify(newUser)}`);
            await this.service.saveUser(newUser);
            await this.service.saveProfile(newProfile);
        } catch (error) {
            console.error(`ProfileController.updateProfile: Error updating profile ${JSON.stringify(error)}`);
        }
    }

    async createProfile(newProfileObject: any): Promise<view.Profile> {
        try {
            const newUserObject: any = newProfileObject.users[0];
            const newProfileId: string = uuid();
            const newProfile: model.Profile = this.factory.createProfileModel(newProfileId, newProfileId, newProfileObject);
            const newUser: model.User = this.factory.createUserModel(newProfileId, newUserObject);
            console.log(`ProfileController.createProfile: new Profile: ${JSON.stringify(newProfile)}`);
            console.log(`ProfileController.createProfile: new User: ${JSON.stringify(newUser)}`);
            await this.service.saveUser(newUser);
            await this.service.saveProfile(newProfile);
            const newUserView: view.User = this.factory.makeUserView(
                newUser,
                newUserObject.allergies ? newUserObject.allergies as model.Allergy[] : [],
                newUserObject.medicalConditions ? newUserObject.medicalConditions as model.Medical[] : [],
                newUserObject.symptoms ? newUserObject.symptoms as model.Symptom[] : []
            );
            const points: model.WuzinitPoints = await this.service.getProfilePoints(newProfile.id);
            return this.factory.makeProfileView(newProfile, [newUserView], points, [], []);
        } catch (error) {
            console.error(`ProfileController.createProfile: Error updating profile ${JSON.stringify(error)}`);
        }
    }

    async getProfilePoints(profileId: string): Promise<model.WuzinitPoints> {
        try {
            const points: model.WuzinitPoints = await this.service.getProfilePoints(profileId);
            return points;
        } catch (error) {
            console.error(`ProfileController.getProfileById: Error getting profile points by id ${JSON.stringify(error)}`);
        }
    }

    async updateProfilePoints(newPointsObject: model.WuzinitPoints): Promise<void> {
        try {
            await this.service.saveProfilePoints(newPointsObject);
        } catch (error) {
            console.error(`ProfileController.updateProfilePoints: Error updating profile points ${JSON.stringify(error)}`);
        }
    }

    async getFeatures(): Promise<model.PremiumFeature[]> {
        try {
            const features: model.PremiumFeature[] = await this.service.getFeatures();
            return features;
        } catch (error) {
            console.error(`ProfileController.getFeatures: Error getting profile points by id ${JSON.stringify(error)}`);
        }
    }

    async makePurchase(purchaseObject: requestModel.PremiumFeaturePurchaseRequest): Promise<model.PremiumFeaturePurchaseConfirmation> {
        try {
            const confirmationObject: model.PremiumFeaturePurchaseConfirmation = this.factory.makePremiumFeaturePurchaseConfirmation(purchaseObject, uuid(), Date.now());
            await this.service.savePremiumFeaturePurchaseConfirmation(confirmationObject);
            return confirmationObject;
        } catch (error) {
            console.error(`ProfileController.makePurchase: Error updating profile points ${JSON.stringify(error)}`);
        }
    }

    async storeInAppPurchaseConfirmation(inAppPurchaseConfirmation: model.InAppPurchaseConfirmation): Promise<void> {
        try {
            await this.service.saveInAppPuchaseConfirmation(inAppPurchaseConfirmation);
        } catch (error) {
            console.error(`ProfileController.storeInAppPurchaseConfirmation: Error updating profile points ${JSON.stringify(error)}`);
        }
    }

    async getInAppPurchaseConfirmationsByProfileId(profileId: string): Promise<model.InAppPurchaseConfirmation[]> {
        try {
            return await this.service.getInAppPurchaseConfirmationsByProfileId(profileId);
        } catch (error) {
            console.error(`ProfileController.getInAppPurchaseConfirmationsByProfileId: error: ${JSON.stringify(error)}`);
        }
    }

    async getPremiumFeaturePurchaseConfirmationsByProfileId(profileId: string): Promise<model.PremiumFeaturePurchaseConfirmation[]> {
        try {
            return await this.service.getPremiumFeaturePurchaseConfirmationsByProfileId(profileId);
        } catch (error) {
            console.error(`ProfileController.getPremiumFeaturePurchaseConfirmationsByProfileId: error: ${JSON.stringify(error)}`);
        }
    }

    // PRIVATE
    private async getUserViewsById(userIds: string[]): Promise<view.User[]> {
        try {
            const users: view.User[] = [];
            let user: model.User;
            let userView: view.User;
            let allergies: model.Allergy[];
            let conditions: model.Medical[];
            let symptoms: model.Symptom[];
            for(const userId of userIds) {
                user = await this.service.getUserById(userId);
                allergies = await this.service.getAllergiesById(user.allergies || []);
                conditions = await this.service.getMedicalConditionsById(user.medicalConditions || []);
                symptoms = await this.service.getSymptomsById(user.symptoms || []);
                userView = this.factory.makeUserView(user, allergies, conditions, symptoms);
                users.push(userView);
            }
            return users;
        } catch (error) {
            console.error(`ProfileController.getUserViewsById: Error getting user views by id ${JSON.stringify(error)}`);
        }
    }
}
