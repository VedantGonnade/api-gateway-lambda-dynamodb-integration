import { storeTeamStats } from '../utils/store-team-stats';

// Retrieve the DynamoDB table name from environment variables
let statsTableName: string = '';
if (process.env.StatsDynamoDBTable) statsTableName = process.env.StatsDynamoDBTable;

/**
 * Lambda function for processing DynamoDB stream records and storing team stats.
 *
 * @param event - The event object containing the DynamoDB stream records.
 */
export async function main(event: any): Promise<void> {
  try {
    // Iterate through each record in the DynamoDB stream
    for (const record of event.Records) {
      // Retrieve the new image of the record
      const newImage = record.dynamodb.NewImage;

      // Extract the opponent, team, and match ID from the new image
      const opponent = newImage.opponent.S;
      const team = newImage.team.S;
      const matchID = Number(newImage.match_id.S);

      // Store team stats for the team and opponent in DynamoDB
      await storeTeamStats(statsTableName, team, matchID);
      await storeTeamStats(statsTableName, opponent, matchID);
    }
  } catch (err) {
    console.log('Error:', err);
  }
}
