"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dynamodb_1 = __importDefault(require("./dynamodb"));
exports.DynamoDB = dynamodb_1.default;
const elasticsearch_1 = __importDefault(require("./elasticsearch"));
exports.ElasticSearch = elasticsearch_1.default;
const http_1 = __importDefault(require("./http"));
exports.Http = http_1.default;
const kms_1 = __importDefault(require("./kms"));
exports.KMS = kms_1.default;
const rekognition_1 = __importDefault(require("./rekognition"));
exports.Rekognition = rekognition_1.default;
const s3_1 = __importDefault(require("./s3"));
exports.S3 = s3_1.default;
