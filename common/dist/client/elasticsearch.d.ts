import { ClientOptions } from '@elastic/elasticsearch';
export default class ElasticSearch {
    private client;
    private factory;
    constructor(clientOptions: ClientOptions);
    bulkUpload(index: string, items: any[]): Promise<void>;
    search(index: string, searchString: string, exclusions?: string[], scrollSize?: number, scrollDurationSeconds?: number, fields?: string[]): Promise<any>;
    scrollSearch(scrollId: string, scrollDurationSeconds?: number): Promise<any>;
}
