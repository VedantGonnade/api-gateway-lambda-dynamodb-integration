# Sportec Solution AG Coding Task CDK Stack

This application is built using AWS CDK and TypeScript programming language. It provides functionality for ingesting sports data into a DynamoDB table via a REST API and querying the ingested data using different API calls. The application includes features such as AWS CloudWatch monitoring, Bitbucket pipeline for automated deployment, and unit tests for the Lambda functions.

## Deployment Instructions

To run the application, follow these steps:

1. Install dependencies:
  - For Linux: `sudo apt-get install unzip curl`
  - Download AWS CLI: `curl -q "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"` and `unzip -o -qq awscliv2.zip`
  - Install AWS CLI: `sudo ./aws/install`
  - Verify installation: `aws --version`
  - Configure AWS CLI: `aws configure --profile CodingTaskStack` (Provide your AWS credentials)
  - Install project dependencies: `npm install`

2. Bootstrap the AWS environment ( Windows OS ):
  - For development: `cdk bootstrap --app "npx ts-node bin/coding-task.ts" --all -c env=dev`
  - For production: `cdk bootstrap --app "npx ts-node bin/coding-task.ts" --all -c env=prod` (Make sure to have `prod.json` in the `environments` directory)

3. Deploy the stacks ( Windows OS ):
  - For development: `cdk deploy --app "npx ts-node bin/coding-task.ts" --all -c env=dev` (Confirm with 'y' when prompted)
  - For production: `cdk deploy --app "npx ts-node bin/coding-task.ts" --all -c env=prod` (Confirm with 'y' when prompted)

4. After deployment, you will see two HTTPS endpoints in the terminal, indicating a successful deployment.

## API Endpoints

The application provides two API endpoints: Ingress and Query. Both endpoints require authentication using an API key, which can be obtained from the AWS API Gateway.

- Ingress Endpoint: `CodingTaskStack.ingressdataapidevEndpoint`
- Query Endpoint: `CodingTaskStack.queryapidevEndpoint`

To use the API endpoints:

1. Use a platform like Postman to send requests.
2. Add the API key to the request headers with the variable name `x-api-key` and the value as the API key obtained from the API Gateway.

### Available Endpoints:

1. **Ingress Endpoint** - Insert data: `POST {ingressEndpoint}/ingest`
  - Send a JSON body with appropriate data to perform the ingress request.

2. **Query Endpoint** - Query by matches: `GET {queryEndpoint}/matches`
  - Retrieve a list of all matches.

3. **Query Endpoint** - Query by match_id: `GET {queryEndpoint}/matches/{match_id}`
  - Retrieve details of a specific match.

4. **Query Endpoint** - Query for match statistics: `GET {queryEndpoint}/matches/{match_id}/statistics`
  - Retrieve statistics for a specific match.

5. **Query Endpoint** - Query for team statistics: `GET {queryEndpoint}/teams/{team_name}/statistics`
  - Retrieve statistics for a specific team.

Feel free to use the provided API endpoints with the necessary authentication to interact with the application and retrieve sports data.

---

This README provides an overview of the Sportec Solution AG Coding Task CDK Stack, deployment instructions, and details about the available API endpoints.
