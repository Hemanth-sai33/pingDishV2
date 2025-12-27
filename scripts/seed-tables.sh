#!/bin/bash
# Seeds initial table data into DynamoDB for multi-restaurant support
# Uses UUID for restaurantId to ensure uniqueness

REGION=${AWS_REGION:-us-east-1}
TABLE_NAME="PingDish-Tables"

# Generate a UUID for the restaurant (or use provided one)
if [ -z "$1" ]; then
  RESTAURANT_ID=$(uuidgen | tr '[:upper:]' '[:lower:]')
  RESTAURANT_NAME="Demo Restaurant"
else
  RESTAURANT_ID=$1
  RESTAURANT_NAME=${2:-"Restaurant"}
fi

echo "🌱 Seeding tables for restaurant..."
echo "   ID: $RESTAURANT_ID"
echo "   Name: $RESTAURANT_NAME"
echo ""

for i in {1..12}; do
  aws dynamodb put-item \
    --table-name $TABLE_NAME \
    --item "{
      \"QrCode\": {\"S\": \"$RESTAURANT_ID#table-$i\"},
      \"RestaurantId\": {\"S\": \"$RESTAURANT_ID\"},
      \"RestaurantName\": {\"S\": \"$RESTAURANT_NAME\"},
      \"TableId\": {\"S\": \"table-$i\"},
      \"TableNumber\": {\"N\": \"$i\"}
    }" \
    --region $REGION \
    --no-cli-pager
  echo "  ✅ Table $i created"
done

echo ""
echo "✅ Seeded 12 tables!"
echo ""
echo "Restaurant ID: $RESTAURANT_ID"
echo "QR Code URL: http://localhost:3001?restaurant=$RESTAURANT_ID&table=table-1"
