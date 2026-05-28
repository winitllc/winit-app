import { Handler } from 'aws-lambda';
import 'source-map-support/register';
import { model } from 'wuzinit-common';
import SymptomsService from './service';

const service = new SymptomsService();

export const getSymptoms: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }

  try {
    const symptoms: model.Symptom[] = await service.getSymptoms();
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Success',
        symptoms
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
