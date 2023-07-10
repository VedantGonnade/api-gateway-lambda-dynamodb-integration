import * as AWS from 'aws-sdk';

// Create an instance of DynamoDB Document Client
const ddb = new AWS.DynamoDB.DocumentClient();

/**
 * Stores team statistics in DynamoDB.
 *
 * @param statsTableName - The name of the DynamoDB table to store the statistics in.
 * @param team - The team name.
 * @param matchID - The ID of the match.
 * @returns A promise that resolves to void.
 */
export async function storeTeamStats(
    statsTableName: string,
    team: string,
    matchID: number
): Promise<void> {
  try {
    const matchIDs: number[] = [];

    // Retrieve the existing record for the team from DynamoDB
    const existingRecord = await ddb.get({
      TableName: statsTableName,
      Key: {
        team: team,
      },
    }).promise();

    if (Object.keys(existingRecord).length === 0) {
      // If no record exists for the team, create a new record
      const matchesPlayed: number = 1;
      matchIDs.push(matchID);

      await ddb.put({
        TableName: statsTableName,
        Item: {
          team: team,
          total_matches: matchesPlayed,
          match_ids: matchIDs,
        },
      }).promise();
    } else {
      // If the record already exists, update the matches_played field
      if (existingRecord.Item?.match_ids.includes(matchID)) {
        console.log('repeat content');
      } else {
        const update = existingRecord.Item?.total_matches + 1;
        for (const id of existingRecord.Item?.match_ids) matchIDs.push(Number(id));
        matchIDs.push(matchID);

        // Update the record in the second DynamoDB table
        await ddb.update({
          TableName: statsTableName,
          Key: {
            team: team,
          },
          UpdateExpression: 'SET match_ids = :match_ids, total_matches = :total_matches',
          ExpressionAttributeValues: {
            ':match_ids': matchIDs,
            ':total_matches': update,
          },
        }).promise();
      }
    }
  } catch (err) {
    console.error(err);
  }
}
