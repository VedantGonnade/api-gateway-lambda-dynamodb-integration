import * as cdk from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { join } from 'path';
import { ApiKey, LambdaIntegration, LambdaRestApi, UsagePlan } from 'aws-cdk-lib/aws-apigateway';
import { AttributeType, BillingMode, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { DynamoEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import { LambdaFunctionProps } from '../assets/models/lambda-function-props';
import { Configuration } from '../bin/configuration';
import { CloudWatchStack } from './cloud-watch-stack';
import { RestApiProps } from '../assets/models/rest-api';

export interface CodingStackProps extends cdk.StackProps, Configuration {
  envName: string;
}

export class CodingTaskStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CodingStackProps) {
    super(scope, id, props);

    // Create DynamoDB tables for storing match data and statistics
    const matchDataDynamoDB = new Table(this, `match-dynamoDB-table-${props.envName}`, {
      tableName: `${props.dynamoDBMatchDataTable}-${props.envName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'match_id',
        type: AttributeType.STRING,
      },
      sortKey: {
        name: 'date',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      stream: StreamViewType.NEW_IMAGE,
    });

    const statsDataDynamoDB = new Table(this, `stats-dynamoDB-table-${props.envName}`, {
      tableName: `${props.dynamoDBStatsDataTable}-${props.envName}`,
      removalPolicy: RemovalPolicy.DESTROY,
      partitionKey: {
        name: 'team',
        type: AttributeType.STRING,
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
    });

    // Define environment variables for Lambda functions
    const envs = {
      MatchDynamoDBTable: matchDataDynamoDB.tableName,
      StatsDynamoDBTable: statsDataDynamoDB.tableName,
    };

    // Create the Lambda function for ingesting data
    const ingressLambda = this.createLambda(`ingest-${props.envName}`, {
      functionName: `ingest-lambda-${props.envName}`,
      lambdaPath: 'assets/lambdas/ingress.ts',
      nodeModules: ['joi', 'uid'],
      envs: envs,
    });

    // Create the Lambda function for retrieving all matches
    const getAllMatches = this.createLambda(`get-all-matches-${props.envName}`, {
      functionName: `get-all-matches-lambda-${props.envName}`,
      lambdaPath: 'assets/lambdas/get-matches.ts',
      envs: envs,
    });

    // Create the Lambda function for retrieving a specific match by ID
    const getMatchById = this.createLambda(`get-match-by-id-${props.envName}`, {
      functionName: `get-match-by-id-lambda-${props.envName}`,
      lambdaPath: 'assets/lambdas/get-match-by-id.ts',
      envs: envs,
    });

    // Create the Lambda function for retrieving match statistics
    const getMatchStatistics = this.createLambda(`get-match-statistics-${props.envName}`, {
      functionName: `get-match-statistics-lambda-${props.envName}`,
      lambdaPath: 'assets/lambdas/get-match-statistics.ts',
      envs: envs,
    });

    // Create the Lambda function for storing team statistics
    const storeTeamStats = this.createLambda(`store-team-stats-${props.envName}`, {
      functionName: `store-team-stats-lambda-${props.envName}`,
      lambdaPath: 'assets/lambdas/store-team-statistics.ts',
      envs: envs,
    });
    storeTeamStats.addEventSource(new DynamoEventSource(matchDataDynamoDB, {
      startingPosition: StartingPosition.LATEST
    }));

    // Create the Lambda function for retrieving team statistics
    const getTeamStats = this.createLambda(`get-team-stats-${props.envName}`, {
      functionName: `get-team-stats-lambda-${props.envName}`,
      lambdaPath: 'assets/lambdas/get-team-stats.ts',
      envs: envs,
    });

    // Create the REST API for ingesting data
    const ingressApi = this.createRestApi(`ingress-data-api-${props.envName}`, {
      handler: ingressLambda,
      restApiName: `ingress-data-api-${props.envName}`,
      methods: ['POST'],
    });

    // Add the POST method for ingesting data to the root resource
    const ingestEndpoint = ingressApi.root.addResource('ingest');
    ingestEndpoint.addMethod('POST', new LambdaIntegration(ingressLambda), {
      apiKeyRequired: true,
    });

    // Create the REST API for querying data
    const queryApi = this.createRestApi(`query-api-${props.envName}`, {
      handler: getAllMatches,
      restApiName: `query-data-api-${props.envName}`,
      methods: ['GET'],
    });

    // Add the GET method for retrieving all matches to the root resource
    const getAllMatchesEndpoint = queryApi.root.addResource('matches');
    getAllMatchesEndpoint.addMethod('GET', new LambdaIntegration(getAllMatches), {
      apiKeyRequired: true
    });

    // Add the GET method for retrieving a specific match by ID
    const getMatchEndpoint = getAllMatchesEndpoint.addResource('{match_id}');
    getMatchEndpoint.addMethod('GET', new LambdaIntegration(getMatchById), {
      apiKeyRequired: true
    });

    // Add the GET method for retrieving match statistics
    const getMatchStatisticsEndpoint = getMatchEndpoint.addResource('statistics');
    getMatchStatisticsEndpoint.addMethod('GET', new LambdaIntegration(getMatchStatistics), {
      apiKeyRequired: true
    });

    // Add the GET method for retrieving team statistics
    const getTeamStatsEndpoint = queryApi.root.addResource('teams')
    .addResource('{team_name}')
    .addResource('statistics');
    getTeamStatsEndpoint.addMethod('GET', new LambdaIntegration(getTeamStats), {
      apiKeyRequired: true
    });

    // Create an API key for the ingress API
    const apiKey = new ApiKey(this, 'ingress-api-key', {
      apiKeyName: 'ingress-data-api-key',
      enabled: true,
    });

    // Create a usage plan for the ingress API
    const ingressDataUsagePlan = ingressApi.addUsagePlan(`ingress-usage-plan-${props.envName}`, {
      name: `ingress-data-usage-plan-${props.envName}`,
      throttle: {
        rateLimit: 10,
        burstLimit: 2
      },
    });

    // Create a usage plan for the query API
    const queryDataUsagePlan = queryApi.addUsagePlan(`query-data-usage-plan-${props.envName}`, {
      name: `query-data-usage-plan-${props.envName}`,
      throttle: {
        rateLimit: 10,
        burstLimit: 2
      }
    });

    // Associate the API key with the ingress usage plan
    ingressDataUsagePlan.addApiKey(apiKey);

    // Associate the API key with the query usage plan
    queryDataUsagePlan.addApiKey(apiKey);

    // Add the API stages to the ingress usage plan
    ingressDataUsagePlan.addApiStage({
      stage: ingressApi.deploymentStage
    });

    // Add the API stages to the query usage plan
    queryDataUsagePlan.addApiStage({
      stage: queryApi.deploymentStage
    });

    // Grant necessary permissions to the Lambdas for accessing DynamoDB
    if (ingressLambda.role !== null) {
      matchDataDynamoDB.grantWriteData(ingressLambda);
    }
    if (getAllMatches.role !== null) {
      matchDataDynamoDB.grantReadData(getAllMatches);
    }
    if (getMatchById.role !== null) {
      matchDataDynamoDB.grantReadData(getMatchById);
    }
    if (getMatchStatistics.role !== null) {
      matchDataDynamoDB.grantReadData(getMatchStatistics);
    }
    if (storeTeamStats.role !== null) {
      statsDataDynamoDB.grantReadWriteData(storeTeamStats);
    }
    if (getTeamStats.role !== null) {
      statsDataDynamoDB.grantReadData(getTeamStats);
    }

    // Create the CloudWatch stack and pass the Lambda function
    const cloudWatchStack = new CloudWatchStack(this, 'CloudWatchStack', {
      lambda: ingressLambda,
      envName: props.envName
    });
  }

  // helper method to create a lambda function
  private createLambda(
      functionId: string,
      props: LambdaFunctionProps
  ): NodejsFunction {
    return new NodejsFunction(this, functionId, {
      runtime: Runtime.NODEJS_16_X,
      functionName: props.functionName,
      memorySize: 256,
      timeout: Duration.seconds(60),
      handler: 'main',
      entry: join(__dirname, '..', props.lambdaPath),
      bundling: {
        minify: false,
        externalModules: ['aws-sdk'],
        nodeModules: props.nodeModules
      },
      environment: {
        ...props.envs
      }
    });
  }

  // helper method to create rest api
  private createRestApi(
      apiId: string,
      props: RestApiProps
  ): LambdaRestApi {
    return new LambdaRestApi(this, apiId, {
      handler: props.handler,
      proxy: false,
      restApiName: props.restApiName,
      defaultCorsPreflightOptions: {
        allowHeaders: [
          'Content-Type',
          'X-Api-Key',
        ],
        allowMethods: [...props.methods],
        allowOrigins: ['*'],
      }
    });
  }
}
