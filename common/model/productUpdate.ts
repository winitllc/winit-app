import Product from './product';
export default interface ProductUpdate extends Product {
    pendingPointsId: string;
    timestamp: number;
}
