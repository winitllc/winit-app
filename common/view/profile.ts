import { User } from '.';
import { WuzinitPoints, InAppPurchaseConfirmation, Lifestyle, PremiumFeaturePurchaseConfirmation } from '../model';

export default interface Profile {
    id: string;
    primaryUserEmail: string;
    users: User[];
    points: WuzinitPoints;
    inAppPurchasesMade?: InAppPurchaseConfirmation[];
    premiumFeaturesPurchasesMade?: PremiumFeaturePurchaseConfirmation[];
    lifestyleDiets?: Lifestyle[];
}
