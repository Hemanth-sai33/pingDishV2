import * as cdk from 'aws-cdk-lib';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';

/**
 * Stack for DynamoDB tables used by PingDish.
 * QrCode format: restaurantId#tableId (enables multi-restaurant support)
 */
export class DynamoDbStack extends cdk.Stack {
  public readonly tablesTable: dynamodb.Table;
  public readonly sessionsTable: dynamodb.Table;
  public readonly connectionsTable: dynamodb.Table;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Tables: PK = QrCode (restaurantId#tableId)
    this.tablesTable = new dynamodb.Table(this, 'TablesTable', {
      tableName: 'PingDish-Tables',
      partitionKey: { name: 'QrCode', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,                   // [FIX 6.6] Don't destroy production data
      encryption: dynamodb.TableEncryption.AWS_MANAGED,           // [FIX 6.6] Explicit encryption
      pointInTimeRecovery: true,                                  // [FIX 6.6] Enable PITR
    });

    // Sessions: PK = SessionId, GSI for active session lookup by restaurant+table
    this.sessionsTable = new dynamodb.Table(this, 'SessionsTable', {
      tableName: 'PingDish-Sessions',
      partitionKey: { name: 'SessionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ExpiresAt',                           // [FIX 6.3] Auto-expire sessions
    });
    this.sessionsTable.addGlobalSecondaryIndex({
      indexName: 'RestaurantTable-Status-Index',
      partitionKey: { name: 'RestaurantTableId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'Status', type: dynamodb.AttributeType.STRING },
    });

    // Connections: PK = ConnectionId
    this.connectionsTable = new dynamodb.Table(this, 'ConnectionsTable', {
      tableName: 'PingDish-Connections',
      partitionKey: { name: 'ConnectionId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.RETAIN,
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ExpiresAt',                           // [FIX 6.3] Auto-expire stale connections
    });
  }
}
