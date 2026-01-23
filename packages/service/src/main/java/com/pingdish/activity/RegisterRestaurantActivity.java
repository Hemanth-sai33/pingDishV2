package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class RegisterRestaurantActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private static final Gson GSON = new Gson();
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
            int numberOfTables = body.get("numberOfTables").getAsInt();

            if (!restaurantId.matches("^[a-z0-9-]+$")) {
                return response(400, Map.of("error", "restaurantId must be lowercase alphanumeric with hyphens"));
            }
            if (numberOfTables < 1 || numberOfTables > 500) {
                return response(400, Map.of("error", "numberOfTables must be between 1 and 500"));
            }

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

            return response(200, Map.of(
                "success", true,
                "kitchenUrl", "https://kitchen.pingdish.com/" + restaurantId,
                "tables", tables
            ));
        } catch (Exception e) {
            return response(500, Map.of("error", e.getMessage()));
        }
    }

    private APIGatewayProxyResponseEvent response(int statusCode, Object body) {
        return new APIGatewayProxyResponseEvent()
                .withStatusCode(statusCode)
                .withHeaders(Map.of("Access-Control-Allow-Origin", "*", "Content-Type", "application/json"))
                .withBody(GSON.toJson(body));
    }
}
