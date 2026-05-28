export default interface PremiumFeaturePurchaseConfirmation {
    transactionId: string;
    profileId: string;
    featureId: string;
    featureTitle: string;
    purchasedOn: number;
}
