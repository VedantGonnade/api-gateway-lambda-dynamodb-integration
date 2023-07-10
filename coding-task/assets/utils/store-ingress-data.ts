import { IngressInput } from '../models/ingress-input';
import * as AWS from 'aws-sdk';
import { uid } from 'uid/secure';

// Create an instance of DynamoDB Document Client
const ddb = new AWS.DynamoDB.DocumentClient({ region: 'eu-central-1' });

let tableName = '';
if (process.env.MatchDynamoDBTable) tableName = process.env.MatchDynamoDBTable;

/**
 * Stores the provided data in DynamoDB.
 *
 * @param body - The data to be stored in DynamoDB.
 * @returns A promise that resolves to an object indicating the status and result of the operation.
 */
export async function storeDataInDynamoDB(
    body: IngressInput
): Promise<
    | {
  data: {
    event_id: string;
    timestamp: string;
  };
  message: string;
  status: string;
}
    | {
  error: string;
  message: string;
  status: string;
}
> {
  console.log('BODY::::', JSON.stringify(body));

  // Create the parameters for the DynamoDB put operation
  const params = {
    TableName: tableName,
    Item: {
      match_id: body.match_id,
      date: body.timestamp,
      team: body.team,
      opponent: body.opponent,
      event_type: body.event_type,
      event_details: {
        player: {
          name: body.event_details?.player.name,
          position: body.event_details?.player.position,
          number: body.event_details?.player.number,
        },
        goal_type: body.event_details?.goal_type,
        minute: body.event_details?.minute,
        assist: {
          name: body.event_details?.assist.name,
          position: body.event_details?.assist.position,
          number: body.event_details?.assist.number,
        },
        video_url: body.event_details?.video_url,
      },
    },
  };

  try {
    // Store the data in DynamoDB
    await ddb.put(params).promise();

    // Generate a unique ID
    const uuid = uid();

    return {
      status: 'success',
      message: 'Data successfully ingested.',
      data: {
        event_id: uuid,
        timestamp: new Date().toISOString(),
      },
    };
  } catch (err: any) {
    console.log('Error during injection in DynamoDB:', err);

    return {
      status: 'error',
      message: 'Failed to ingest data.',
      error: err,
    };
  }
}
