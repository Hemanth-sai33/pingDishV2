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
}

/**
 * Stack for REST API Gateway.
 */
export class ApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: ApiStackProps) {
    super(scope, id, props);

    const restApi = new apigateway.RestApi(this, 'RestApi', {
      restApiName: 'PingDish-API',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
      },
    });

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

    new cdk.CfnOutput(this, 'RestApiUrl', { 
      value: restApi.url,
      exportName: 'PingDish-RestApiUrl',
    });
  }
}
