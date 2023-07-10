import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { Alarm } from 'aws-cdk-lib/aws-cloudwatch';
import { Topic } from 'aws-cdk-lib/aws-sns';
import {SnsAction} from "aws-cdk-lib/aws-cloudwatch-actions";
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";

interface CloudWatchStackProps extends cdk.StackProps{
  lambda: NodejsFunction;
  envName: string;
}

export class CloudWatchStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: CloudWatchStackProps) {
    super(scope, id);

    // Create a CloudWatch alarm for the number of invocations of ingress queries
    const requestsAlarm = new Alarm(this, `ingress-alarm-${props.envName}`, {
      alarmName: `ingress-alarm-lambda-${props.envName}`,
      alarmDescription: 'Number of requests made to the API exceeds threshold',
      metric:  props.lambda.metricInvocations(),
      threshold: 20,
      evaluationPeriods: 1,
    });

    // Create a new SNS topic
    const snsTopic = new Topic(this, `SNSTopic-${props.envName}`);

    // Add an action to the alarm (sending a notification to the SNS topic)
    requestsAlarm.addAlarmAction(new SnsAction(snsTopic));
  }
}
