#!/bin/bash
set -e

echo "🍽️  PingDish MVP Setup"
echo "====================="

# Check prerequisites
command -v java >/dev/null 2>&1 || { echo "❌ Java is required"; exit 1; }
command -v mvn >/dev/null 2>&1 || { echo "❌ Maven is required"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "❌ Node.js is required"; exit 1; }
command -v aws >/dev/null 2>&1 || { echo "❌ AWS CLI is required"; exit 1; }

echo "✅ Prerequisites checked"

# Build Java service
echo ""
echo "📦 Building Java service..."
cd packages/service
mvn clean package -DskipTests -q
echo "✅ Java service built"

# Install CDK dependencies
echo ""
echo "📦 Installing CDK dependencies..."
cd ../infra
npm install --silent
echo "✅ CDK dependencies installed"

# Bootstrap CDK (if needed)
echo ""
echo "🚀 Bootstrapping CDK..."
npx cdk bootstrap --quiet 2>/dev/null || true

# Deploy stack
echo ""
echo "🚀 Deploying PingDish stack..."
npx cdk deploy --require-approval never --outputs-file cdk-outputs.json

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "1. Run: ./scripts/seed-tables.sh"
echo "2. Update frontend .env files with API URLs from cdk-outputs.json"
echo "3. Run frontends: npm run dev:kitchen / npm run dev:customer"
