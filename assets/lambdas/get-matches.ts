import * as AWS from 'aws-sdk';
import { Matches } from '../models/matches';

// Create an instance of the DynamoDB Document Client
const ddb = new AWS.DynamoDB.DocumentClient();

// Retrieve the DynamoDB table name from environment variables
let tableName = '';
if (process.env.MatchDynamoDBTable) tableName = process.env.MatchDynamoDBTable;

/**
 * Lambda function for retrieving all matches from DynamoDB.
 *
 * @param event - The event object containing the request details.
 * @returns The response object with the status code and body.
 */
export async function main(event: any): Promise<{
  statusCode: number;
  body: string;
}> {
  try {
    const pageSize = 10;
    let exclusiveStartKey = null;

    // Extract exclusiveStartKey from query parameters if provided
    if (event.queryStringParameters && event.queryStringParameters.exclusiveStartKey) {
      exclusiveStartKey = JSON.parse(event.queryStringParameters.exclusiveStartKey);
    }

    // Define the DynamoDB scan parameters with pagination
    const params = {
      TableName: tableName,
      ExclusiveStartKey: exclusiveStartKey,
      Limit: pageSize,
    };

    // Perform the DynamoDB scan operation
    const result = await ddb.scan(params).promise();

    // Use a Set to track unique matches
    const uniqueMatches = new Set();
    const matches: Array<Matches> = [];

    // Filter and add unique matches to the response
    if (result.Items) {
      for (let i = 0; i < result.Items.length; i++) {
        const item = result.Items[i];
        const matchId = item.match_id;

        // If the match_id is not in the Set, add the match to the response
        if (!uniqueMatches.has(matchId)) {
          const match: Matches = {
            match_id: item.match_id,
            team: item.team,
            opponent: item.opponent,
            date: item.date,
          };

          matches.push(match);
          uniqueMatches.add(matchId);
        }
      }
    }

    // Prepare the API response with pagination details
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        matches: matches,
        exclusiveStartKey: result.LastEvaluatedKey,
      }),
    };
  } catch (error) {
    console.error('Error retrieving matches:', error);

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
