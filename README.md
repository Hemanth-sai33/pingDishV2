# PingDish

Real-time restaurant table service notification system. Customers scan QR codes and ping the kitchen when they need service.

## Live URLs

| URL | Purpose |
|-----|---------|
| https://www.pingdish.com | Landing page |
| https://www.pingdish.com/#login | Restaurant owner login |
| https://www.pingdish.com/#admin | Admin panel |
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
│  Customer App   │◄───────►│  │ DynamoDB (5 tables)    │  │
│ app.pingdish.com│   WS    │  │ CloudFront + S3        │  │
└─────────────────┘         │  │ SES (transactional)    │  │
                            │  └────────────────────────┘  │
┌─────────────────┐         │                              │
│Kitchen Dashboard│◄───────►│                              │
│kitchen.pingdish │   WS    │                              │
└─────────────────┘         └──────────────────────────────┘
```

## Features

- **Multi-tenant**: Each restaurant is isolated with unique ID and tables
- **Enquiry-based onboarding**: Restaurant owners enquire via contact form → admin approves → credentials auto-generated and emailed
- **Admin panel**: View enquiries, approve/decline restaurants, manage onboarded restaurants, reset passwords
- **Restaurant login**: Owners log in at `#login` to access their kitchen dashboard
- **QR code generation**: Printable QR codes for each table
- **Real-time sync**: WebSocket broadcasts sync across all browsers
- **Cooldown system**: 15-second cooldown between pings
- **Session lifecycle**: Sessions auto-close on delivery confirmation; customers see a thank you screen

## Restaurant Onboarding Flow

```
1. Owner fills "Reach Out" form on landing page
   → Enquiry saved to DynamoDB + email sent to support@pingdish.com

2. Admin visits #admin → reviews pending enquiries
   → Approves with restaurantId + table count
   → Password auto-generated (12-char alphanumeric)

3. System creates restaurant record + table entries in DynamoDB
   → Credentials emailed to owner via SES

4. Owner logs in at #login → redirected to kitchen dashboard
```

## Security

- **CORS**: Restricted to `*.pingdish.com` and localhost (dev)
- **CSRF protection**: Custom `X-Requested-With: PingDish` header on all API calls
- **CSP**: Content Security Policy on all frontends
- **Security headers**: `X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`
- **Input validation**: Server-side validation on all registration fields
- **Error handling**: Centralized — no stack traces leak to clients
- **XSS prevention**: `escapeHtml()` on user-generated content
- **Admin auth**: Admin endpoints protected by `X-Admin-Key` header
- **Password hashing**: SHA-256 hashed passwords stored in DynamoDB
- **API throttling**: 50 req/s burst, 10,000 req/day
- **WebSocket limits**: Max 50 connections/restaurant, 2-hour TTL
- **DynamoDB**: TTL on sessions/connections, encryption at rest, PITR, RETAIN policy

## Project Structure

```
packages/
├── service/              # Java 21 Lambda handlers
│   └── src/main/java/com/pingdish/
│       ├── activity/     # Lambda handlers (15 total)
│       ├── component/    # Business logic
│       ├── dao/          # Data access
│       ├── model/        # Domain models
│       └── util/         # ResponseHelper, ErrorHandler, InputValidator
├── infra/                # CDK TypeScript (3 stacks)
├── web-landing/          # Landing page + login + admin panel
├── web-customer/         # Customer app
└── web-kitchen/          # Kitchen dashboard
```

## API Endpoints

### Public
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/enquiries` | Submit restaurant enquiry |
| POST | `/api/restaurants/{id}/login` | Restaurant owner login |
| POST | `/api/tables/{qrCode}/scan` | Customer scans QR |
| POST | `/api/sessions/{id}/ping` | Send ping |
| POST | `/api/sessions/{id}/serving` | Mark as serving |
| POST | `/api/sessions/{id}/confirm` | Confirm delivery |
| POST | `/api/sessions/{id}/reject` | Still waiting |

### Admin (requires `X-Admin-Key` header)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/enquiries?status=PENDING` | List enquiries |
| POST | `/api/enquiries/{id}/review` | Approve or decline enquiry |
| GET | `/api/restaurants` | List onboarded restaurants |
| POST | `/api/restaurants/{id}/reset-password` | Reset restaurant password |
| POST | `/api/restaurants` | Register restaurant (legacy) |
| GET | `/api/restaurants/{id}/tables` | Get restaurant tables |

## Development

### Prerequisites
- Java 21, Maven 3.8+
- Node.js 18+
- AWS CLI configured
- AWS CDK (`npm install -g aws-cdk`)

### Environment Variables

Frontend apps use Vite env vars. Create `.env` files:

```bash
# web-landing
VITE_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com/prod

# web-kitchen & web-customer
VITE_API_URL=https://<api-id>.execute-api.<region>.amazonaws.com/prod
VITE_WS_URL=wss://<ws-api-id>.execute-api.<region>.amazonaws.com/prod
```

### Deploy Backend
```bash
cd packages/service && mvn clean package -DskipTests
cd ../infra && npx cdk deploy --all --outputs-file cdk-outputs.json
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
aws cloudfront create-invalidation --distribution-id EQOTWHMCH7SLT --paths "/*"   # landing
aws cloudfront create-invalidation --distribution-id ETPQ6399GKM4Z --paths "/*"   # kitchen
aws cloudfront create-invalidation --distribution-id E27HLZ7L718G74 --paths "/*"  # customer
```

### Local Development
```bash
cd packages/web-landing && npm run dev  # http://localhost:5173
cd packages/web-kitchen && npm run dev  # http://localhost:3000
cd packages/web-customer && npm run dev # http://localhost:3001
```

## Infrastructure

### AWS Services (Region: ap-south-2)
- **CloudFront**: 3 distributions (landing, kitchen, customer)
- **S3**: Static website hosting
- **API Gateway**: REST API + WebSocket API (with throttling)
- **Lambda**: 15 Java 21 handlers (512 MB memory)
- **DynamoDB**: 5 tables (encrypted, PITR, RETAIN)
- **SES**: Transactional emails (credentials, password resets)
- **ACM**: SSL certificate for *.pingdish.com

### DynamoDB Tables

| Table | Primary Key | TTL | Purpose |
|-------|-------------|-----|---------|
| PingDish-Tables | QrCode | — | Restaurant tables |
| PingDish-Sessions | SessionId | ExpiresAt (4hr) | Active customer sessions |
| PingDish-Connections | ConnectionId | ExpiresAt (2hr) | WebSocket connections |
| PingDish-Enquiries | EnquiryId | — | Contact form submissions |
| PingDish-Restaurants | RestaurantId | — | Onboarded restaurants + credentials |

### CloudFront Distributions

| Domain | Distribution ID | S3 Bucket |
|--------|----------------|-----------|
| www.pingdish.com | EQOTWHMCH7SLT | www.pingdish.com |
| kitchen.pingdish.com | ETPQ6399GKM4Z | kitchen.example.com |
| app.pingdish.com | E27HLZ7L718G74 | customer.example.com |

## DNS Setup (GoDaddy)

| Type | Name | Value |
|------|------|-------|
| CNAME | www | d239v2muci68mi.cloudfront.net |
| CNAME | kitchen | dn6lifgiaw8ql.cloudfront.net |
| CNAME | app | dnuhkplxl5ahm.cloudfront.net |
| CNAME | w7sxg3tfwilsec7yodi6m4pplilggb5s._domainkey | w7sxg3tfwilsec7yodi6m4pplilggb5s.dkim.amazonses.com |
| CNAME | vxvctbvo42rcqggdgefziy63kvax3f6x._domainkey | vxvctbvo42rcqggdgefziy63kvax3f6x.dkim.amazonses.com |
| CNAME | jrtmm4vo33shnetid2ol6o6xs3gj3e63._domainkey | jrtmm4vo33shnetid2ol6o6xs3gj3e63.dkim.amazonses.com |
