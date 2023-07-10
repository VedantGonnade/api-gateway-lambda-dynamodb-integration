#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { CodingTaskStack } from '../lib/coding-task-stack';
import * as fs from 'fs';
import { Configuration } from './configuration';

const app = new cdk.App();

// Retrieve the environment name from the context
const envName = app.node.tryGetContext('env')?.toLowerCase();

// Validate that the environment name is specified
if (!envName) {
  throw new Error('Must specify environment name in context, use -c env=<ENV_NAME>');
}

// Load the environment configuration based on the environment name
const envConfig = loadEnvironmentConfiguration(envName);

// Create the CodingTaskStack with the specified environment configuration
new CodingTaskStack(app, 'CodingTaskStack', {
  env: {
    region: envConfig.awsRegion,
  },
  envName: envName,
  ...envConfig,
});

/**
 * Loads the environment configuration based on the environment name.
 *
 * @param envName - The name of the environment.
 * @returns The environment configuration.
 */
function loadEnvironmentConfiguration(envName: string): Configuration {
  const envConfigFile = `environments/${envName}.json`;

  try {
    // Read the environment configuration file and parse its contents
    return JSON.parse(fs.readFileSync(envConfigFile).toString());
  } catch (error) {
    throw new Error(`Could not read environment config file (${envConfigFile})`);
  }
}
