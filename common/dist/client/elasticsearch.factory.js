"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const DEFAULT_TIMEOUT = '2s';
class ElasticSearchFactory {
    makeSearchResults(result) {
        return {
            hits: this.extractHitSource(result.body.hits.hits),
            scrollId: result.body._scroll_id
        };
    }
    extractHitSource(hits) {
        return hits.map((hit) => {
            return hit._source ? hit._source : {};
        });
    }
    makeBulkParams(index, items) {
        const body = [];
        items.forEach((item) => {
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
    gatherErrorsFromBulkResponse(uploadResponse, uploadParams) {
        const erroredDocuments = [];
        uploadResponse.body.items.forEach((action, i) => {
            const operation = Object.keys(action)[0];
            if (action[operation].error) {
                erroredDocuments.push({
                    // If the status is 429 it means that you can retry the document
                    status: action[operation].status,
                    error: action[operation].error,
                    operation: uploadParams.body[i * 2],
                    document: uploadParams.body[i * 2 + 1]
                });
            }
        });
        return erroredDocuments;
    }
    makeSearchParams(index, searchString, size, scroll, exclusions, fields) {
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
    makeScrollParams(scrollId, scroll) {
        return {
            scroll_id: scrollId,
            scroll
        };
    }
}
exports.default = ElasticSearchFactory;
