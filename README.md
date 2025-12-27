# PingDish MVP

Real-time restaurant customer-kitchen communication system with multi-restaurant support.

## Architecture

```
┌─────────────────┐         ┌──────────────────────────────┐
│  Customer App   │◄───────►│      AWS Backend             │
│   (React/Vite)  │   WS    │  ┌────────────────────────┐  │
│   Port 3001     │         │  │ API Gateway (REST)     │  │
└─────────────────┘         │  │ API Gateway (WebSocket)│  │
                            │  │ Lambda (Java 21)       │  │
┌─────────────────┐         │  │ DynamoDB (3 tables)    │  │
│Kitchen Dashboard│◄───────►│  └────────────────────────┘  │
│   (React/Vite)  │   WS    │                              │
│   Port 3000     │         └──────────────────────────────┘
└─────────────────┘
```

## Project Structure

```
packages/
├── service/              # Java 21 Lambda (Maven + Guice DI)
│   └── src/main/java/com/pingdish/
│       ├── activity/     # Lambda handlers (API layer)
│       ├── component/    # Business logic
│       ├── dao/          # Data access layer
│       ├── accessor/     # External API calls (WebSocket)
│       ├── model/        # Domain models (Java records)
│       └── config/       # Guice DI module
├── infra/                # CDK TypeScript
├── web-customer/         # Customer React app
└── web-kitchen/          # Kitchen React dashboard
```

## Key Features

- **Multi-restaurant support**: Each restaurant has a unique UUID, enabling SaaS deployment
- **Real-time sync**: WebSocket broadcasts sync ping count and cooldown across all browsers
- **ISO 8601 timestamps**: Human-readable timestamps in DynamoDB
- **QR Code format**: `{restaurantId}#{tableId}` (e.g., `897c1f8d-fe37-4f0f-bddb-3623234bf349#table-1`)

## Prerequisites

- Java 21
- Maven 3.8+
- Node.js 18+
- AWS CLI configured with credentials
- AWS CDK (`npm install -g aws-cdk`)

## Quick Start

### 1. Deploy Backend

```bash
# Build Java service
cd packages/service
mvn clean package -DskipTests

# Deploy CDK stacks
cd ../infra
npm install
npx cdk bootstrap  # First time only
npx cdk deploy --all --outputs-file cdk-outputs.json
```

### 2. Seed Table Data

```bash
# Creates a new restaurant with UUID and 12 tables
./scripts/seed-tables.sh

# Or use existing restaurant ID
./scripts/seed-tables.sh <restaurant-uuid> "Restaurant Name"
```

The script outputs the restaurant ID and customer app URL.

### 3. Update Frontend Config

Update the API URLs in:
- `packages/web-kitchen/src/services/apiService.ts` - Set `RESTAURANT_ID`
- `packages/web-customer/src/services/kitchenService.ts` - API endpoints

### 4. Run Frontends

```bash
# Terminal 1 - Kitchen Dashboard
cd packages/web-kitchen
npm install
npm run dev  # http://localhost:3000

# Terminal 2 - Customer App  
cd packages/web-customer
npm install
npm run dev  # http://localhost:3001?restaurant=<UUID>&table=table-1
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/tables/{qrCode}/scan` | Customer scans QR code (URL-encoded) |
| POST | `/api/sessions/{sessionId}/ping` | Customer pings kitchen |
| POST | `/api/sessions/{sessionId}/serving` | Kitchen marks as serving |
| POST | `/api/sessions/{sessionId}/confirm` | Customer confirms receipt |
| POST | `/api/sessions/{sessionId}/reject` | Customer still waiting |
| POST | `/api/tables/{qrCode}/close` | Close table session |

**Note**: QR code must be URL-encoded (e.g., `restaurant-id%23table-1`)

## WebSocket Events

| Event | Direction | Payload |
|-------|-----------|---------|
| PING | Server → All | `{tableNumber, sessionId, pingCount, lastPingAt}` |
| SERVING | Server → All | `{tableNumber, sessionId}` |
| CONFIRMED | Server → All | `{tableNumber, sessionId}` |
| REJECTED | Server → All | `{tableNumber, sessionId, message}` |
| SESSION_CLOSED | Server → Kitchen | `{tableNumber, sessionId}` |

## DynamoDB Tables

### PingDish-Tables
- **PK**: `QrCode` (restaurantId#tableId)
- Stores: RestaurantId, RestaurantName, TableId, TableNumber

### PingDish-Sessions
- **PK**: `SessionId`
- **GSI**: `RestaurantTable-Status-Index` (RestaurantTableId, Status)
- Stores: RestaurantId, TableId, PingCount, PingStatus, LastPingAt (ISO 8601)

### PingDish-Connections
- **PK**: `ConnectionId`
- Stores: Type (KITCHEN/CUSTOMER), RestaurantId, SessionId

## Development

### Rebuild & Redeploy Backend

```bash
cd packages/service && mvn package -q
cd ../infra && npx cdk deploy PingDish-Compute --require-approval never
```

### Clear Test Data

```bash
# Clear sessions and connections (keeps tables)
aws dynamodb scan --table-name PingDish-Sessions --region us-east-1 --query 'Items[*].SessionId.S' --output text | \
  tr '\t' '\n' | xargs -I{} aws dynamodb delete-item --table-name PingDish-Sessions --key '{"SessionId":{"S":"{}"}}' --region us-east-1

aws dynamodb scan --table-name PingDish-Connections --region us-east-1 --query 'Items[*].ConnectionId.S' --output text | \
  tr '\t' '\n' | xargs -I{} aws dynamodb delete-item --table-name PingDish-Connections --key '{"ConnectionId":{"S":"{}"}}' --region us-east-1
```

### Destroy Stack

```bash
cd packages/infra && npx cdk destroy --all
```

## Testing Flow

1. Open Kitchen Dashboard at `http://localhost:3000`
2. Open Customer App at `http://localhost:3001?restaurant=<UUID>&table=table-1`
3. Open same URL in second browser to test multi-browser sync
4. Customer taps "Ping Kitchen" → All browsers show ping, cooldown syncs
5. Kitchen sees table turn green/amber/red based on ping count
6. Kitchen taps "Serving" → Customer gets notification
7. Customer confirms "Food Received" → Both reset

## Deployed Endpoints (Example)

```
REST API: https://ctf7r5ruce.execute-api.us-east-1.amazonaws.com/prod/
WebSocket: wss://rihn49nxzj.execute-api.us-east-1.amazonaws.com/prod
```
