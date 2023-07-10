import { Matches } from '../models/matches';
import * as AWS from 'aws-sdk';

// Create an instance of the DynamoDB Document Client
const ddb = new AWS.DynamoDB.DocumentClient();

// Retrieve the DynamoDB table name from environment variables
let tableName = '';
if (process.env.MatchDynamoDBTable) tableName = process.env.MatchDynamoDBTable;

/**
 * Lambda function for retrieving match data from DynamoDB by using match_id.
 *
 * @param event - The event object containing the request details.
 * @returns The response object with the status code and body.
 */
export async function main(event: any): Promise<{
  statusCode: number;
  body: string;
}> {
  try {
    // Extract the matchID from the path
    const matchID = event.path.split('/').pop();

    // Set the page size for pagination
    const pageSize = 10;

    // Initialize the exclusiveStartKey
    let exclusiveStartKey = null;

    // Create an array to store the retrieved matches
    const matches: Array<Matches> = [];

    // Extract exclusiveStartKey from query parameters if provided
    if (event.queryStringParameters && event.queryStringParameters.exclusiveStartKey) {
      exclusiveStartKey = JSON.parse(event.queryStringParameters.exclusiveStartKey);
    }

    // Define the DynamoDB query parameters with pagination
    const params = {
      TableName: tableName,
      ExclusiveStartKey: exclusiveStartKey,
      Limit: pageSize,
      KeyConditionExpression: 'match_id = :value',
      ExpressionAttributeValues: {
        ':value': matchID,
      },
    };

    // Perform the DynamoDB query
    const result = await ddb.query(params).promise();

    // Process the query result
    if (result.Items) {
      const events = result.Items.map((item) => ({
        event_type: item.event_type,
        timestamp: item.date,
        player: item.event_details.player.name,
        goal_type: item.event_details.goal_type,
        minute: item.event_details.minute,
        video_url: item.event_details.video_url,
        assist: item.event_details.assist.name,
      }));

      const match = {
        match_id: result.Items[0].match_id,
        team: result.Items[0].team,
        opponent: result.Items[0].opponent,
        date: result.Items[0].date,
        events: events,
      };

      matches.push(match);
    }

    // Prepare a success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        match: matches,
        exclusiveStartKey: result.LastEvaluatedKey,
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
