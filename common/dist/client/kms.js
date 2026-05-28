"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const aws_sdk_1 = require("aws-sdk");
class KMS {
    constructor(credentialProvider) {
        this.client = new aws_sdk_1.KMS({ region: 'us-west-2', credentialProvider: credentialProvider || undefined });
    }
    async decrypt(encryptedString) {
        try {
            const decryptResponse = await this.client.decrypt({
                CiphertextBlob: new Buffer(encryptedString, 'base64')
            }).promise();
            console.log(`KMS.decrypt: decrypt response: ${JSON.stringify(JSON.stringify(decryptResponse))}`);
            const decryptedText = decryptResponse.Plaintext.toString('utf8');
            console.log(`KMS.decrypt: decrypted text: ${JSON.stringify(JSON.stringify(decryptResponse))}`);
            return decryptedText || '';
        }
        catch (error) {
            console.error(`KMS.decrypt: error: ${JSON.stringify(error)}`);
            return '';
        }
    }
}
exports.default = KMS;
