# PingDish

Real-time restaurant table service notification system. Customers scan QR codes and ping the kitchen when they need service.

## Live URLs

| URL | Purpose |
|-----|---------|
| https://www.pingdish.com | Landing page + Restaurant registration |
| https://kitchen.pingdish.com/{restaurantId} | Kitchen dashboard |
| https://app.pingdish.com/{restaurantId}/{tableNumber} | Customer app (QR code destination) |

## Architecture

```
┌─────────────────┐         ┌──────────────────────────────┐
│  Landing Page   │         │      AWS Backend             │
│ www.pingdish.com│────────►│  ┌────────────────────────┐  │
└─────────────────┘         │  │ API Gateway (REST)     │  │
                            │  │ API Gateway (WebSocket)│  │
┌─────────────────┐         │  │ Lambda (Java 21)       │  │
│  Customer App   │◄───────►│  │ DynamoDB (3 tables)    │  │
│ app.pingdish.com│   WS    │  │ CloudFront + S3        │  │
└─────────────────┘         │  └────────────────────────┘  │
                            │                              │
┌─────────────────┐         │                              │
│Kitchen Dashboard│◄───────►│                              │
│kitchen.pingdish │   WS    │                              │
└─────────────────┘         └──────────────────────────────┘
```

## Features

- **Multi-tenant**: Each restaurant is isolated with unique ID and tables
- **Self-service onboarding**: Restaurant owners register via landing page
- **QR code generation**: Printable QR codes for each table
- **Real-time sync**: WebSocket broadcasts sync across all browsers
- **Cooldown system**: 15-second cooldown between pings

## Project Structure

```
packages/
├── service/              # Java 21 Lambda handlers
│   └── src/main/java/com/pingdish/
│       ├── activity/     # Lambda handlers
│       ├── component/    # Business logic
│       ├── dao/          # Data access
│       └── model/        # Domain models
├── infra/                # CDK TypeScript
├── web-landing/          # Landing page + onboarding
├── web-customer/         # Customer app
└── web-kitchen/          # Kitchen dashboard
```

## User Flow

### Restaurant Owner
1. Visit `www.pingdish.com`
2. Fill registration form (name, tables count, email)
3. Get kitchen dashboard URL + printable QR codes
4. Print QR codes and place on tables

### Customer
1. Scan QR code on table
2. App opens automatically
3. Tap "Ping Kitchen" when service needed
4. Receive notification when food is being served
5. Confirm receipt

### Kitchen Staff
1. Open kitchen dashboard (bookmarked URL)
2. See real-time table status (idle/pinged/serving)
3. Tables sorted by urgency (ping count)
4. Tap "Serving" when delivering food

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/restaurants` | Register new restaurant |
| GET | `/api/restaurants/{id}/tables` | Get restaurant tables |
| POST | `/api/tables/{qrCode}/scan` | Customer scans QR |
| POST | `/api/sessions/{id}/ping` | Send ping |
| POST | `/api/sessions/{id}/serving` | Mark as serving |
| POST | `/api/sessions/{id}/confirm` | Confirm delivery |
| POST | `/api/sessions/{id}/reject` | Still waiting |

## Development

### Prerequisites
- Java 21, Maven 3.8+
- Node.js 18+
- AWS CLI configured
- AWS CDK (`npm install -g aws-cdk`)

### Deploy Backend
```bash
cd packages/service && mvn clean package -DskipTests
cd ../infra && npx cdk deploy --all
```

### Deploy Frontends
```bash
# Build all
cd packages/web-landing && npm run build
cd ../web-kitchen && npm run build
cd ../web-customer && npm run build

# Deploy to S3
aws s3 sync packages/web-landing/dist s3://www.pingdish.com --delete
aws s3 sync packages/web-kitchen/dist s3://kitchen.example.com --delete
aws s3 sync packages/web-customer/dist s3://customer.example.com --delete

# Invalidate CloudFront
aws cloudfront create-invalidation --distribution-id <ID> --paths "/*"
```

### Local Development
```bash
# Kitchen Dashboard
cd packages/web-kitchen && npm run dev  # http://localhost:3000

# Customer App
cd packages/web-customer && npm run dev  # http://localhost:3001
```

## Infrastructure

### AWS Services
- **CloudFront**: 3 distributions (landing, kitchen, customer)
- **S3**: Static website hosting
- **API Gateway**: REST API + WebSocket API
- **Lambda**: Java 21 handlers
- **DynamoDB**: Tables, Sessions, Connections
- **ACM**: SSL certificate for *.pingdish.com

### DynamoDB Tables

| Table | Primary Key | Purpose |
|-------|-------------|---------|
| PingDish-Tables | QrCode | Restaurant tables |
| PingDish-Sessions | SessionId | Active customer sessions |
| PingDish-Connections | ConnectionId | WebSocket connections |

## DNS Setup (GoDaddy)

| Type | Name | Value |
|------|------|-------|
| CNAME | www | d239v2muci68mi.cloudfront.net |
| CNAME | kitchen | dn6lifgiaw8ql.cloudfront.net |
| CNAME | app | dnuhkplxl5ahm.cloudfront.net |
