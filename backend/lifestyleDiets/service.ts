import { client, model } from 'wuzinit-common';
import { Config } from './config';

export default class LifestyleDietService {

  private dynamoDB: client.DynamoDB;

  constructor () {
      this.dynamoDB = new client.DynamoDB();
  }

  public async getLifestyleDiets(): Promise<model.Lifestyle[]> {
    try {
      return (await this.dynamoDB.getAllPaginated(Config.tableName, Config.defaultPageSize)) as model.Lifestyle[];
    } catch (error) {
      console.error(`LifestyleDietService.getLifestyleDiets: Error: ${JSON.stringify(error)}`)
    }
  }
}
