import { Handler } from 'aws-lambda';
import 'source-map-support/register';
import { model, view } from 'wuzinit-common';
import { ProductController } from './controller';

const controller = new ProductController();

export const addProductUpdate: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }
  
  try {
    console.log('handler.addProductUpdate - beginning of funciton');
    const postBody: any = JSON.parse(event.body);
    await controller.addProductUpdate(postBody.product as model.WuzinitProduct);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Success',
      }, null, 2),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Error',
        error
      })
    };
  }
}

export const getByCode: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }

  console.log('handler.getByCode - beginning of funciton');
  const product: model.Product | string = await controller.getByCode(event.queryStringParameters.code);
  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      message: 'Success',
      data: product,
    }, null, 2),
  };
}

export const scrollSearch: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }

  try {
    console.log('handler.scrollSearch - beginning of funciton');
    const resultsObject: view.ProductSearchResponse = await controller.scrollSearch(event.queryStringParameters.scrollId);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Success',
        data: resultsObject
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Error',
        error
      })
    };
  }
}

export const searchText: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }

  try {
    console.log('handler.searchText - beginning of funciton');
    const postBody: any = JSON.parse(event.body);
    const resultsObject: view.ProductSearchResponse = await controller.searchText(postBody.text, postBody.exclusions);
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Success',
        data: resultsObject
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Error',
        error
      })
    };
  }
}

export const searchCategory: Handler = async (event, _context) => {
  /** Immediate response for WarmUP plugin */
  if (event.source === 'serverless-plugin-warmup') {
    console.log('WarmUP - Lambda is warm!')
    return 'Lambda is warm!';
  }

  try {
    console.log('handler.searchCategory - beginning of funciton');
    let resultsObject: view.ProductSearchResponse;
    if (event.queryStringParameters.lastKey) {
      resultsObject = await controller.searchCategory(event.queryStringParameters.category, JSON.parse(event.queryStringParameters.lastKey));
    } else {
      resultsObject = await controller.searchCategory(event.queryStringParameters.category);
    }
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Success',
        data: resultsObject
      })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        message: 'Error',
        error
      })
    };
  }
}
