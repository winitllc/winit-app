import { Handler } from 'aws-lambda';
import 'source-map-support/register';
import { model } from 'wuzinit-common';
import MedicalConditionsService from './service';

const service = new MedicalConditionsService();

export const getMedicalConditions: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }

  try {
    const medicalConditions: model.Medical[] = await service.getMedicalConditions();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        medicalConditions
      }, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Error',
        error
      }, null, 2),
    };
  }
}
