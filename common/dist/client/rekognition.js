"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
class Rekognition {
    constructor(credentialProvider) {
        this.client = new aws_sdk_1.Rekognition({ region: 'us-west-2', credentialProvider: credentialProvider || undefined });
    }
    async imageToText(imageData) {
        var params = {
            Image: {
                Bytes: imageData
            }
        };
        try {
            const rekognitionResponse = await this.client.detectText(params).promise();
            console.log(`Rekognition.imageToText: response from Rekognition: ${JSON.stringify(rekognitionResponse)}`);
            const detectedText = rekognitionResponse.TextDetections.map((detectionObject) => {
                return detectionObject.DetectedText;
            });
            return detectedText.join(' ');
        }
        catch (error) {
            console.error(`Rekognition.imageToText: error detecting text in image: ${JSON.stringify(error)}`);
            throw error;
        }
    }
}
exports.default = Rekognition;
