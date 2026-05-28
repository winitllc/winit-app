import { client, model } from 'wuzinit-common';
import { Config } from './config';

export default class SymptomsService {

  private dynamoDB: client.DynamoDB;

  constructor () {
      this.dynamoDB = new client.DynamoDB();
  }

  public async getSymptoms(): Promise<model.Symptom[]> {
    try {
      return (await this.dynamoDB.getAllPaginated(Config.tableName, Config.defaultPageSize)) as model.Symptom[];
    } catch (error) {
      console.error(`SymptomsService.getSymptoms: Error: ${JSON.stringify(error)}`)
    }
  }
}
