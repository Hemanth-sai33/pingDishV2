import * as cdk from 'aws-cdk-lib';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { Construct } from 'constructs';

export interface ApiStackProps extends cdk.StackProps {
  scanTableFn: lambda.IFunction;
  pingKitchenFn: lambda.IFunction;
  markServingFn: lambda.IFunction;
  confirmDeliveryFn: lambda.IFunction;
  rejectDeliveryFn: lambda.IFunction;
  closeSessionFn: lambda.IFunction;
  registerRestaurantFn: lambda.IFunction;
  getTablesFn: lambda.IFunction;
}

/**
 * Stack for REST API Gateway.
 */
export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    // [FIX 4.2] Restrict CORS to PingDish domains only
    const allowedOrigins = [
      'https://www.pingdish.com',
      'https://kitchen.pingdish.com',
      'https://app.pingdish.com',
    ];
    // Add localhost for dev
    if (process.env.STAGE === 'dev') {
      allowedOrigins.push('http://localhost:3000', 'http://localhost:3001', 'http://localhost:5173');
    }

    const restApi = new apigateway.RestApi(this, 'RestApi', {
      restApiName: 'PingDish-API',
      defaultCorsPreflightOptions: {
        allowOrigins: allowedOrigins,
        allowMethods: ['GET', 'POST', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
        allowCredentials: true,
      },
    });

    // [FIX 5.2] Add API Gateway throttling
    const plan = restApi.addUsagePlan('PingDishThrottlePlan', {
      name: 'ThrottlePlan',
      throttle: { rateLimit: 50, burstLimit: 100 },
      quota: { limit: 10000, period: apigateway.Period.DAY },
    });
    plan.addApiStage({ stage: restApi.deploymentStage });

    const api = restApi.root.addResource('api');
    
    // /api/tables/{qrCode}
    const tables = api.addResource('tables').addResource('{qrCode}');
    tables.addResource('scan').addMethod('POST', new apigateway.LambdaIntegration(props.scanTableFn));
    tables.addResource('close').addMethod('POST', new apigateway.LambdaIntegration(props.closeSessionFn));

    // /api/sessions/{sessionId}
    const sessions = api.addResource('sessions').addResource('{sessionId}');
    sessions.addResource('ping').addMethod('POST', new apigateway.LambdaIntegration(props.pingKitchenFn));
    sessions.addResource('serving').addMethod('POST', new apigateway.LambdaIntegration(props.markServingFn));
    sessions.addResource('confirm').addMethod('POST', new apigateway.LambdaIntegration(props.confirmDeliveryFn));
    sessions.addResource('reject').addMethod('POST', new apigateway.LambdaIntegration(props.rejectDeliveryFn));

    // /api/restaurants
    const restaurants = api.addResource('restaurants');
    restaurants.addMethod('POST', new apigateway.LambdaIntegration(props.registerRestaurantFn));
    restaurants.addResource('{restaurantId}').addResource('tables').addMethod('GET', new apigateway.LambdaIntegration(props.getTablesFn));

    new cdk.CfnOutput(this, 'RestApiUrl', { 
      value: restApi.url,
      exportName: 'PingDish-RestApiUrl',
    });
  }
}
