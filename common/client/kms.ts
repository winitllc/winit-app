import { KMS as Client, CredentialProviderChain, AWSError } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';

export default class KMS {
  private client: Client;

  constructor (credentialProvider?: CredentialProviderChain) {
    this.client = new Client({region: 'us-west-2', credentialProvider: credentialProvider || undefined});
  }

  async decrypt(encryptedString: string): Promise<string> {
    try {
      const decryptResponse: any = await this.client.decrypt({
        CiphertextBlob: Buffer.from(encryptedString, 'base64')
      }).promise();
      console.log(`KMS.decrypt: decrypt response: ${JSON.stringify(JSON.stringify(decryptResponse))}`);
      const decryptedText: string = decryptResponse.Plaintext.toString('utf8');
      console.log(`KMS.decrypt: decrypted text: ${JSON.stringify(JSON.stringify(decryptResponse))}`);
      return decryptedText || '';
    } catch (error) {
      console.error(`KMS.decrypt: error: ${JSON.stringify(error)}`);
      return '';
    }
  }
}
