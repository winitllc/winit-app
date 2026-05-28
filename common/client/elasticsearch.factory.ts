import { ApiResponse } from '@elastic/elasticsearch';
import { Bulk, Search, Scroll } from '@elastic/elasticsearch/api/requestParams';

const DEFAULT_TIMEOUT: string = '2s';

export default class ElasticSearchFactory {

  makeSearchResults(result: ApiResponse<any, any>): any {
    return {
      hits: this.extractHitSource(result.body.hits.hits),
      scrollId: result.body._scroll_id
    };
  }

  private extractHitSource(hits: any[]): any[] {
    return hits.map((hit: any): any => {
      return hit._source ? hit._source : {};
    });
  }

  makeBulkParams(index: string, items: any[]): Bulk {
    const body: any[] = [];
    items.forEach((item: any): void => {
      body.push({
        index: {
          _index: index,
          _type: '_doc'
        }
      });
      body.push(item);
    });
    return {
      body,
      refresh: 'true'
    };
  }

  gatherErrorsFromBulkResponse(uploadResponse: ApiResponse<any, any>, uploadParams: Bulk): any[] {
    const erroredDocuments: any[] = [];
    uploadResponse.body.items.forEach((action: any, i: number) => {
      const operation = Object.keys(action)[0]
      if (action[operation].error) {
        erroredDocuments.push({
          // If the status is 429 it means that you can retry the document
          status: action[operation].status,
          error: action[operation].error,
          operation: uploadParams.body[i * 2],
          document: uploadParams.body[i * 2 + 1]
        })
      }
    });
    return erroredDocuments;
  }

  makeSearchParams(index: string, searchString: string, size: number, scroll: string, exclusions?: string[], fields?: string[]): Search {
    const query = fields ? {
      simple_query_string: {
        query: exclusions ? `${searchString} -${exclusions.join(' -')}` : searchString,
        fields
      }
    } : {
      simple_query_string: {
        query: exclusions ? `${searchString} -${exclusions.join(' -')}` : searchString
      }
    };
    return {
      index,
      scroll,
      size,
      timeout: DEFAULT_TIMEOUT,
      type: '_doc',
      body: {
        query
      }
    };
  }

  makeScrollParams(scrollId: string, scroll: string): Scroll {
    return {
      scroll_id: scrollId,
      scroll
    };
  }
}
