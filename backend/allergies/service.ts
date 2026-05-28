import { client, model } from 'wuzinit-common';
import { Config } from './config';

export default class AllergiesService {

  private dynamoDB: client.DynamoDB;

  constructor () {
      this.dynamoDB = new client.DynamoDB();
  }

  public async getAllergies(): Promise<model.Allergy[]> {
    try {
      return (await this.dynamoDB.getAllPaginated(Config.tableName, Config.defaultPageSize)) as model.Allergy[];
    } catch (error) {
      console.error(`AllergiesService.getAllergies: Error: ${JSON.stringify(error)}`)
    }
  }
}
