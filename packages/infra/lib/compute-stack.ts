import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigatewayv2 from 'aws-cdk-lib/aws-apigatewayv2';
import * as integrations from 'aws-cdk-lib/aws-apigatewayv2-integrations';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';

export interface ComputeStackProps extends cdk.StackProps {
  tablesTable: dynamodb.ITable;
  sessionsTable: dynamodb.ITable;
  connectionsTable: dynamodb.ITable;
}

/**
 * Stack for Lambda functions and WebSocket API.
 * Combined to avoid cyclic dependencies between Lambda env vars and WebSocket routes.
 */
export class ComputeStack extends cdk.Stack {
  public readonly scanTableFn: lambda.Function;
  public readonly pingKitchenFn: lambda.Function;
  public readonly markServingFn: lambda.Function;
  public readonly confirmDeliveryFn: lambda.Function;
  public readonly rejectDeliveryFn: lambda.Function;
  public readonly closeSessionFn: lambda.Function;
  public readonly registerRestaurantFn: lambda.Function;
  public readonly getTablesFn: lambda.Function;
  public readonly webSocketUrl: string;

  constructor(scope: Construct, id: string, props: ComputeStackProps) {
    super(scope, id, props);

    // Create WebSocket API first to get ID
    const wsApi = new apigatewayv2.WebSocketApi(this, 'WebSocketApi', {
      apiName: 'PingDish-WebSocket',
    });

    const wsStage = new apigatewayv2.WebSocketStage(this, 'WebSocketStage', {
      webSocketApi: wsApi,
      stageName: 'prod',
      autoDeploy: true,
    });

    this.webSocketUrl = wsStage.url;

    const servicePath = path.join(__dirname, '../../service/target/pingdish-service-1.0.0.jar');

    const createLambda = (name: string, handler: string): lambda.Function => {
      const fn = new lambda.Function(this, name, {
        functionName: `PingDish-${name}`,
        runtime: lambda.Runtime.JAVA_21,
        handler,
        code: lambda.Code.fromAsset(servicePath),
        memorySize: 512,
        timeout: cdk.Duration.seconds(30),
        environment: {
          WS_API_ID: wsApi.apiId,
        },
      });

      props.tablesTable.grantReadWriteData(fn);
      props.sessionsTable.grantReadWriteData(fn);
      props.connectionsTable.grantReadWriteData(fn);

      fn.addToRolePolicy(new iam.PolicyStatement({
        actions: ['execute-api:ManageConnections'],
        resources: [`arn:aws:execute-api:${this.region}:${this.account}:${wsApi.apiId}/*`],
      }));

      return fn;
    };

    // REST API Lambdas
    this.scanTableFn = createLambda('ScanTable', 'com.pingdish.activity.ScanTableActivity');
    this.pingKitchenFn = createLambda('PingKitchen', 'com.pingdish.activity.PingKitchenActivity');
    this.markServingFn = createLambda('MarkServing', 'com.pingdish.activity.MarkServingActivity');
    this.confirmDeliveryFn = createLambda('ConfirmDelivery', 'com.pingdish.activity.ConfirmDeliveryActivity');
    this.rejectDeliveryFn = createLambda('RejectDelivery', 'com.pingdish.activity.RejectDeliveryActivity');
    this.closeSessionFn = createLambda('CloseSession', 'com.pingdish.activity.CloseSessionActivity');
    this.registerRestaurantFn = createLambda('RegisterRestaurant', 'com.pingdish.activity.RegisterRestaurantActivity');
    this.getTablesFn = createLambda('GetTables', 'com.pingdish.activity.GetTablesActivity');

    // WebSocket Lambdas + Routes
    const wsConnectFn = createLambda('WsConnect', 'com.pingdish.activity.WebSocketConnectActivity');
    const wsDisconnectFn = createLambda('WsDisconnect', 'com.pingdish.activity.WebSocketDisconnectActivity');

    wsApi.addRoute('$connect', {
      integration: new integrations.WebSocketLambdaIntegration('ConnectIntegration', wsConnectFn),
    });
    wsApi.addRoute('$disconnect', {
      integration: new integrations.WebSocketLambdaIntegration('DisconnectIntegration', wsDisconnectFn),
    });

    new cdk.CfnOutput(this, 'WebSocketUrl', { value: wsStage.url });
  }
}
