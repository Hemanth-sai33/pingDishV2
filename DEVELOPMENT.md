# PingDish MVP - Development Guide

## First Time Setup

### 1. Configure AWS Credentials
```bash
aws configure
# Enter your Access Key, Secret Key, region (us-east-1)
```

### 2. Deploy Infrastructure
```bash
cd /Users/kilapc/pingdish-mvp

# Build Java service
cd packages/service && mvn clean package -DskipTests

# Bootstrap CDK (first time only)
cd ../infra && npx cdk bootstrap aws://348165961383/us-east-1

# Deploy all stacks
npx cdk deploy --all --require-approval never --outputs-file cdk-outputs.json
```

### 3. Seed Table Data
```bash
cd /Users/kilapc/pingdish-mvp
./scripts/seed-tables.sh
```

### 4. Configure Frontends
```bash
# Get API URLs from deployment output
cat packages/infra/cdk-outputs.json

# Create .env files
echo "VITE_API_URL=<RestApiUrl from output>" > packages/web-customer/.env
echo "VITE_WS_URL=<WebSocketUrl from output>" >> packages/web-customer/.env
cp packages/web-customer/.env packages/web-kitchen/.env
```

### 5. Install & Run Frontends
```bash
# Terminal 1 - Kitchen Dashboard
cd packages/web-kitchen && npm install && npm run dev

# Terminal 2 - Customer App  
cd packages/web-customer && npm install && npm run dev
```

---

## Development Workflows

### Backend Changes (Java)
```bash
cd packages/service
mvn clean package -DskipTests
cd ../infra
npx cdk deploy PingDish-Compute --require-approval never
```

### Infrastructure Changes (CDK)
```bash
cd packages/infra
npx cdk deploy --all --require-approval never
```

### Frontend Changes (React)
No deployment needed - Vite hot-reloads automatically.
Just save your files and the browser refreshes.

### Full Redeploy
```bash
cd /Users/kilapc/pingdish-mvp
cd packages/service && mvn clean package -DskipTests
cd ../infra && npx cdk deploy --all --require-approval never
```

---

## Quick Reference

| Change Type | Command |
|-------------|---------|
| Java code | `mvn package && cdk deploy PingDish-Compute` |
| DynamoDB schema | `cdk deploy PingDish-DynamoDB` |
| API routes | `cdk deploy PingDish-API` |
| Lambda + WebSocket | `cdk deploy PingDish-Compute` |
| All infra | `cdk deploy --all` |
| Frontend | Auto hot-reload (just save) |

---

## URLs

- Kitchen Dashboard: http://localhost:3000
- Customer App: http://localhost:3001?table=table-1

---

## Destroy Everything
```bash
cd packages/infra
npx cdk destroy --all
```
