import { ApiResponse } from '@elastic/elasticsearch';
import { Bulk, Search, Scroll } from '@elastic/elasticsearch/api/requestParams';
export default class ElasticSearchFactory {
    makeSearchResults(result: ApiResponse<any, any>): any;
    private extractHitSource;
    makeBulkParams(index: string, items: any[]): Bulk;
    gatherErrorsFromBulkResponse(uploadResponse: ApiResponse<any, any>, uploadParams: Bulk): any[];
    makeSearchParams(index: string, searchString: string, size: number, scroll: string, exclusions?: string[], fields?: string[]): Search;
    makeScrollParams(scrollId: string, scroll: string): Scroll;
}
