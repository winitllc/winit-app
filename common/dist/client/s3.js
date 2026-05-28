"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
class S3 {
    constructor(credentialProvider) {
        this.client = new aws_sdk_1.S3({ region: 'us-west-2', credentialProvider: credentialProvider || undefined });
    }
    async storeObject(object, bucket, key) {
        var params = {
            Body: object,
            Bucket: bucket,
            Key: key
        };
        try {
            await this.client.putObject(params).promise();
        }
        catch (error) {
            console.error(`Rekognition.imageToText: error detecting text in image: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}
exports.default = S3;
