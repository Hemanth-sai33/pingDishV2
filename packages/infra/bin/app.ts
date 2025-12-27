#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { DynamoDbStack } from '../lib/dynamodb-stack';
import { ComputeStack } from '../lib/compute-stack';
import { ApiStack } from '../lib/api-stack';

const app = new cdk.App();

const env = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION || 'us-east-1',
};

// Stack 1: DynamoDB Tables
const dynamoDbStack = new DynamoDbStack(app, 'PingDish-DynamoDB', { env });

// Stack 2: Lambda Functions + WebSocket API
const computeStack = new ComputeStack(app, 'PingDish-Compute', {
  env,
  tablesTable: dynamoDbStack.tablesTable,
  sessionsTable: dynamoDbStack.sessionsTable,
  connectionsTable: dynamoDbStack.connectionsTable,
});
computeStack.addDependency(dynamoDbStack);

// Stack 3: REST API Gateway
const apiStack = new ApiStack(app, 'PingDish-API', {
  env,
  scanTableFn: computeStack.scanTableFn,
  pingKitchenFn: computeStack.pingKitchenFn,
  markServingFn: computeStack.markServingFn,
  confirmDeliveryFn: computeStack.confirmDeliveryFn,
  rejectDeliveryFn: computeStack.rejectDeliveryFn,
  closeSessionFn: computeStack.closeSessionFn,
});
apiStack.addDependency(computeStack);
