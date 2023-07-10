import * as AWS from 'aws-sdk';
import * as Joi from 'joi';

// Create an instance of the DynamoDB Document Client
const ddb = new AWS.DynamoDB.DocumentClient();

// Retrieve the DynamoDB table name from environment variables
let tableName = '';
if (process.env.StatsDynamoDBTable) tableName = process.env.StatsDynamoDBTable;

/**
 * Lambda function for retrieving team statistics from DynamoDB based on the team name.
 *
 * @param event - The event object containing the request details.
 * @returns The response object with the status code and body.
 */
export async function main(event: any): Promise<{
  statusCode: number;
  body: string;
}> {
  try {
    let teamName = '';

    // Check if the last segment of the path is 'statistics'
    if (event.path.split('/').pop() === 'statistics') {
      const pathSegments = event.path.split('/');
      const teamNameIndex = pathSegments.indexOf('teams') + 1;
      teamName = pathSegments[teamNameIndex];
    }

    // Decode the team name from the URL
    const decodedTeamName = decodeURIComponent(teamName);

    // Define the validation schema using Joi
    const schema = Joi.string().min(3).max(30).required();

    // Validate the decoded team name against the schema
    const { error } = schema.validate(decodedTeamName);

    // If there is an error in validation, return a 400 Bad Request response
    if (error) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          message: 'Invalid input',
          details: error.details.map((detail) => detail.message),
        }),
      };
    }

    // Retrieve team statistics from DynamoDB
    const response = await ddb
    .get({
      TableName: tableName,
      Key: {
        team: decodedTeamName,
      },
    })
    .promise();

    if(Object.keys(response).length === 0){
      return {
        statusCode: 404,
        body: JSON.stringify({
          message: "This team does not exist in the database"
        }),
      };
    }
    // Prepare the API response with team statistics
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        team: response.Item?.team,
        statistics: {
          total_matches: response.Item?.total_matches,
        },
      }),
    };
  } catch (err) {
    console.error(err);

    // Prepare an error response
    return {
      statusCode: 404,
      body: JSON.stringify({
        message: 'Error retrieving data',
      }),
    };
  }
}
