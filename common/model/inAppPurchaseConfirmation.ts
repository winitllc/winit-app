export default interface InAppPurchaseConfirmation {
    transactionId: string; // primary index
    profileId?: string; // local secondary index
    receipt: string;
    signature: string;
    productType: string;
    productTitle: string;
}
