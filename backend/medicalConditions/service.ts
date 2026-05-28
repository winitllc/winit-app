import { client, model } from 'wuzinit-common';
import { Config } from './config';

export default class MedicalConditionsService {

  private dynamoDB: client.DynamoDB;

  constructor () {
      this.dynamoDB = new client.DynamoDB();
  }

  public async getMedicalConditions(): Promise<model.Medical[]> {
    try {
      return (await this.dynamoDB.getAllPaginated(Config.tableName, Config.defaultPageSize)) as model.Medical[];
    } catch (error) {
      console.error(`MedicalConditionsService.getMedicalConditions: Error: ${JSON.stringify(error)}`)
    }
  }
}
