import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";

export interface RestApiProps{
  handler: NodejsFunction,
  restApiName: string;
  methods: string[];
}