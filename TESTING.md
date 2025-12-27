# PingDish Backend Testing Guide

## Prerequisites
- Java 21, Maven, Node.js installed
- AWS CLI configured with credentials

## Build & Deploy

```bash
# 1. Build Java service
cd packages/service
mvn clean package

# 2. Deploy to AWS
cd ../infra
npx cdk deploy --all --require-approval never
```

## API Endpoints

Base URL: `https://ctf7r5ruce.execute-api.us-east-1.amazonaws.com/prod`

### Test Commands

```bash
# Scan table (creates session)
curl -X POST https://ctf7r5ruce.execute-api.us-east-1.amazonaws.com/prod/api/tables/table-1/scan

# Ping kitchen (use sessionId from scan response)
curl -X POST https://ctf7r5ruce.execute-api.us-east-1.amazonaws.com/prod/api/sessions/{sessionId}/ping

# Mark as serving
curl -X POST https://ctf7r5ruce.execute-api.us-east-1.amazonaws.com/prod/api/sessions/{sessionId}/serving

# Confirm delivery
curl -X POST https://ctf7r5ruce.execute-api.us-east-1.amazonaws.com/prod/api/sessions/{sessionId}/confirm

# Reject delivery
curl -X POST https://ctf7r5ruce.execute-api.us-east-1.amazonaws.com/prod/api/sessions/{sessionId}/reject

# Close session
curl -X POST https://ctf7r5ruce.execute-api.us-east-1.amazonaws.com/prod/api/sessions/{sessionId}/close
```

## WebSocket

URL: `wss://rihn49nxzj.execute-api.us-east-1.amazonaws.com/prod`

```bash
# Test with wscat
npx wscat -c "wss://rihn49nxzj.execute-api.us-east-1.amazonaws.com/prod?tableId=table-1&type=KITCHEN"
```

## Seed Test Data

```bash
bash scripts/seed-tables.sh
```

## View Logs

```bash
# Lambda logs
aws logs tail /aws/lambda/PingDish-ScanTable --follow
aws logs tail /aws/lambda/PingDish-PingKitchen --follow
```

## Cleanup

```bash
cd packages/infra
npx cdk destroy --all
```
