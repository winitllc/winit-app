"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const elasticsearch_1 = require("@elastic/elasticsearch");
const elasticsearch_factory_1 = __importDefault(require("./elasticsearch.factory"));
const DEFAULT_SCROLL_DURATION = '30s';
const DEFAULT_SCROLL_SIZE = 25;
class ElasticSearch {
    constructor(clientOptions) {
        this.client = new elasticsearch_1.Client(clientOptions);
        this.factory = new elasticsearch_factory_1.default();
    }
    async bulkUpload(index, items) {
        const uploadParams = this.factory.makeBulkParams(index, items);
        try {
            const uploadResponse = await this.client.bulk(uploadParams);
            if (uploadResponse.body && uploadResponse.body.hasOwnProperty('errors') && uploadResponse.body.errors) {
                console.log('ElasticSearch.bulkUpload: found errors');
                const erroredDocuments = this.factory.gatherErrorsFromBulkResponse(uploadResponse, uploadParams);
                console.error(`ElasticSearch.bulkUpload: Error uploading ${JSON.stringify(erroredDocuments)}`);
            }
        }
        catch (error) {
            console.error(`ElasticSearch.bulkUpload: Error bulk uploading to ${index}`);
            console.error(`ElasticSearch.bulkUpload: Error uploading ${uploadParams.body.length / 2} documents`);
            console.error(`ElasticSearch.bulkUpload: Error: ${JSON.stringify(error)}`);
        }
    }
    async search(index, searchString, exclusions, scrollSize, scrollDurationSeconds, fields) {
        const scroll = scrollDurationSeconds ? `${scrollDurationSeconds}s` : DEFAULT_SCROLL_DURATION;
        const size = scrollSize ? scrollSize : DEFAULT_SCROLL_SIZE;
        console.log(`ElasticSearch.search: searching ${index} with ${searchString}`);
        const searchParams = this.factory.makeSearchParams(index, searchString, size, scroll, exclusions, fields);
        console.log(`ElasticSearch.normalSearch: search params: ${JSON.stringify(searchParams)}`);
        try {
            const searchResult = await this.client.search(searchParams);
            console.log(`ElasticSearch.normalSearch: results from ElasticSearch: ${JSON.stringify(searchResult)}`);
            return this.factory.makeSearchResults(searchResult);
        }
        catch (error) {
            console.error(`ElasticSearch.normalSearch: Error searching ${index} with ${searchString}`);
            console.error(`ElasticSearch.normalSearch: Error searchParams: ${JSON.stringify(searchParams)}`);
            console.error(`ElasticSearch.normalSearch: Error: ${JSON.stringify(error)}`);
            return {};
        }
    }
    async scrollSearch(scrollId, scrollDurationSeconds) {
        const scroll = scrollDurationSeconds ? `${scrollDurationSeconds}s` : DEFAULT_SCROLL_DURATION;
        const scrollParams = this.factory.makeScrollParams(scrollId, scroll);
        try {
            const scrollResults = await this.client.scroll(scrollParams);
            console.log(`ElasticSearch.scrollSearch: results from ElasticSearch: ${JSON.stringify(scrollResults)}`);
            return this.factory.makeSearchResults(scrollResults);
        }
        catch (error) {
            console.error(`ElasticSearch.scrollSearch: Error scrolling with scrollId ${scrollId}`);
            console.error(`ElasticSearch.scrollSearch: Error scrollParams: ${JSON.stringify(scrollParams)}`);
            console.error(`ElasticSearch.scrollSearch: Error: ${JSON.stringify(error)}`);
            return {};
        }
    }
}
exports.default = ElasticSearch;
