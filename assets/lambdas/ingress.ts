import { validateInput } from '../utils/validate-ingress-input';
import { storeDataInDynamoDB } from '../utils/store-ingress-data';

/**
 * Lambda function for ingesting data.
 *
 * @param event - The event object containing the request details.
 * @returns The response object with the status code and body.
 */
export async function main(event: any): Promise<{
  statusCode: number,
  body: string
}> {
  // Check if the API path is "/ingest"
  if (event.path !== '/ingest') {
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: 'No Content, Please check the API URL and API key'
      })
    };
  }

  // Parse the request body
  const body = JSON.parse(event.body);

  // Validate the input data
  const validationError = validateInput(body);
  if (validationError) {
    return {
      statusCode: 404,
      body: JSON.stringify({
        status: 'error',
        message: 'Failed to ingest data.',
        error: validationError
      })
    };
  }

  // Store the ingested data in DynamoDB
  const result = await storeDataInDynamoDB(body);

  // Check the result of storing data in DynamoDB
  if (result.status === 'success') {
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } else {
    return {
      statusCode: 404,
      body: JSON.stringify(result)
    };
  }
}
