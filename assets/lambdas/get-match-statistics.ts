import * as AWS from 'aws-sdk';
import { MatchStatisticsEvent } from '../models/match-statistics-event';
import { getMatchStatistics } from '../utils/get-match-statistics';

// Create an instance of the DynamoDB Document Client
const ddb = new AWS.DynamoDB.DocumentClient();

// Retrieve the DynamoDB table name from environment variables
let tableName = '';
if (process.env.MatchDynamoDBTable) tableName = process.env.MatchDynamoDBTable;

/**
 * Lambda function for retrieving match statistics from DynamoDB.
 *
 * @param event - The event object containing the request details.
 * @returns The response object with the status code and body.
 */
export async function main(event: any): Promise<{
  statusCode: number;
  body: string;
}> {
  try {
    let matchID = '';

    // Extract the match ID from the path
    if (event.path.split('/').pop() === 'statistics') {
      const pathSegments = event.path.split('/');
      const matchIdIndex = pathSegments.indexOf('matches') + 1;
      matchID = pathSegments[matchIdIndex];
    }

    let stats;
    const pageSize = 10;
    let exclusiveStartKey = null;

    // Extract exclusiveStartKey from query parameters if provided
    if (event.queryStringParameters && event.queryStringParameters.exclusiveStartKey) {
      exclusiveStartKey = JSON.parse(event.queryStringParameters.exclusiveStartKey);
    }

    // Define the DynamoDB query parameters with pagination and projection expression
    const params = {
      TableName: tableName,
      ExclusiveStartKey: exclusiveStartKey,
      Limit: pageSize,
      KeyConditionExpression: 'match_id = :value',
      ExpressionAttributeValues: {
        ':value': matchID,
      },
      ProjectionExpression: 'match_id, team, opponent, event_type',
    };

    // Perform the DynamoDB query
    const result = await ddb.query(params).promise();

    // Process the query result
    if (result.Items) {
      stats = getMatchStatistics(matchID, result.Items as MatchStatisticsEvent[]);
    }

    // Prepare a success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        match_id: matchID,
        statistics: stats,
      }),
    };
  } catch (e) {
    console.error('Error retrieving matches:', e);

    // Prepare an error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: 'Failed to retrieve matches',
      }),
    };
  }
}
