export default interface InAppPurchaseConfirmation {
    transactionId: string;
    profileId?: string;
    receipt: string;
    signature: string;
    productType: string;
    productTitle: string;
}
