package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.pingdish.util.ErrorHandler;
import com.pingdish.util.InputValidator;
import com.pingdish.util.ResponseHelper;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RegisterRestaurantActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private static final String TABLE_NAME = "PingDish-Tables";
    private final DynamoDbClient dynamoDbClient;

    public RegisterRestaurantActivity() {
        this.dynamoDbClient = DynamoDbClient.create();
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            JsonObject body = JsonParser.parseString(event.getBody()).getAsJsonObject();
            String restaurantId = body.get("restaurantId").getAsString();
            String restaurantName = body.has("restaurantName") ? body.get("restaurantName").getAsString() : "";
            String ownerEmail = body.has("ownerEmail") ? body.get("ownerEmail").getAsString() : "";
            int numberOfTables = body.get("numberOfTables").getAsInt();

            // [FIX 6.4] Comprehensive server-side validation
            InputValidator.validateRestaurantId(restaurantId);
            InputValidator.validateRestaurantName(restaurantName);
            InputValidator.validateEmail(ownerEmail);
            InputValidator.validateNumberOfTables(numberOfTables);

            List<Map<String, Object>> tables = new ArrayList<>();
            for (int i = 1; i <= numberOfTables; i++) {
                String qrCode = restaurantId + "#" + i;
                Map<String, AttributeValue> item = new HashMap<>();
                item.put("QrCode", AttributeValue.builder().s(qrCode).build());
                item.put("RestaurantId", AttributeValue.builder().s(restaurantId).build());
                item.put("TableId", AttributeValue.builder().s(String.valueOf(i)).build());
                item.put("TableNumber", AttributeValue.builder().n(String.valueOf(i)).build());
                item.put("Status", AttributeValue.builder().s("ACTIVE").build());
                dynamoDbClient.putItem(PutItemRequest.builder().tableName(TABLE_NAME).item(item).build());
                tables.add(Map.of("tableNumber", i, "qrUrl", "https://app.pingdish.com/" + restaurantId + "/" + i));
            }

            return ResponseHelper.respond(200, Map.of(
                "success", true,
                "kitchenUrl", "https://kitchen.pingdish.com/" + restaurantId,
                "tables", tables
            ), event);
        } catch (IllegalArgumentException e) {
            // [FIX 5.4] Return validation error without internal details
            return ResponseHelper.respond(400, Map.of("error", e.getMessage()), event);
        } catch (Exception e) {
            // [FIX 5.4] Centralized error handling — no raw e.getMessage()
            return ErrorHandler.handle(e, event);
        }
    }
}
