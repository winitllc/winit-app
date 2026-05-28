import { ApiResponse, Client, ClientOptions } from '@elastic/elasticsearch';
import { Bulk, Search, Scroll } from '@elastic/elasticsearch/api/requestParams';
import ElasticSearchFactory from './elasticsearch.factory';

const DEFAULT_SCROLL_DURATION: string = '30s';
const DEFAULT_SCROLL_SIZE: number = 25;

export default class ElasticSearch {

  private client: Client;
  private factory: ElasticSearchFactory;
  constructor (clientOptions: ClientOptions) {
      this.client = new Client(clientOptions);
      this.factory = new ElasticSearchFactory();
  }

  async bulkUpload(index: string, items: any[]): Promise<void> {
    const uploadParams: Bulk = this.factory.makeBulkParams(index, items);
    try {
      const uploadResponse: ApiResponse<any, any> = await this.client.bulk(uploadParams);
      if (uploadResponse.body && uploadResponse.body.hasOwnProperty('errors') && uploadResponse.body.errors) {
        console.log('ElasticSearch.bulkUpload: found errors');
        const erroredDocuments: any[] = this.factory.gatherErrorsFromBulkResponse(uploadResponse, uploadParams);
        console.error(`ElasticSearch.bulkUpload: Error uploading ${JSON.stringify(erroredDocuments)}`);
      }
    } catch (error) {
      console.error(`ElasticSearch.bulkUpload: Error bulk uploading to ${index}`);
      console.error(`ElasticSearch.bulkUpload: Error uploading ${uploadParams.body.length/2} documents`);
      console.error(`ElasticSearch.bulkUpload: Error: ${JSON.stringify(error)}`);
    }
  }

  async search(index: string, searchString: string, exclusions?: string[], scrollSize?: number, scrollDurationSeconds?: number, fields?: string[]): Promise<any> {
    const scroll: string = scrollDurationSeconds ? `${scrollDurationSeconds}s` : DEFAULT_SCROLL_DURATION;
    const size: number = scrollSize ? scrollSize : DEFAULT_SCROLL_SIZE;
    console.log(`ElasticSearch.search: searching ${index} with ${searchString}`);
    const searchParams: Search<any> = this.factory.makeSearchParams(index, searchString, size, scroll, exclusions, fields);
    console.log(`ElasticSearch.normalSearch: search params: ${JSON.stringify(searchParams)}`);
    try {
      const searchResult: ApiResponse<any, any> = await this.client.search(searchParams);
      console.log(`ElasticSearch.normalSearch: results from ElasticSearch: ${JSON.stringify(searchResult)}`);
      return this.factory.makeSearchResults(searchResult);
    } catch (error) {
      console.error(`ElasticSearch.normalSearch: Error searching ${index} with ${searchString}`);
      console.error(`ElasticSearch.normalSearch: Error searchParams: ${JSON.stringify(searchParams)}`);
      console.error(`ElasticSearch.normalSearch: Error: ${JSON.stringify(error)}`);
      return {};
    }
  }

  async scrollSearch(scrollId: string, scrollDurationSeconds?: number): Promise<any> {
    const scroll: string = scrollDurationSeconds ? `${scrollDurationSeconds}s` : DEFAULT_SCROLL_DURATION;
    const scrollParams: Scroll<any> = this.factory.makeScrollParams(scrollId, scroll);
    try {
      const scrollResults: ApiResponse<any, any> = await this.client.scroll(scrollParams);
      console.log(`ElasticSearch.scrollSearch: results from ElasticSearch: ${JSON.stringify(scrollResults)}`);
      return this.factory.makeSearchResults(scrollResults);
    } catch (error) {
      console.error(`ElasticSearch.scrollSearch: Error scrolling with scrollId ${scrollId}`);
      console.error(`ElasticSearch.scrollSearch: Error scrollParams: ${JSON.stringify(scrollParams)}`);
      console.error(`ElasticSearch.scrollSearch: Error: ${JSON.stringify(error)}`);
      return {};
    }
  }
}