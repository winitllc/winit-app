export default interface PremiumFeaturePurchaseConfirmation {
  transactionId: string; // primary index
  profileId: string; // local secondary index
  featureId: string;
  featureTitle: string;
  purchasedOn: number;
}
