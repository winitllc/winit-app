import ProductSearchResult from './productSearchResult';
export default interface ProductSearchResponse {
    results: ProductSearchResult[];
    service: ('dynamodb' | 'elasticsearch');
    nextObjectId: any | string;
}
