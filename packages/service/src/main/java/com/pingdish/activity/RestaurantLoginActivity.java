package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.pingdish.util.ErrorHandler;
import com.pingdish.util.ResponseHelper;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import java.util.Map;

public class RestaurantLoginActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final DynamoDbClient ddb = DynamoDbClient.create();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            String restaurantId = event.getPathParameters().get("restaurantId");
            JsonObject body = JsonParser.parseString(event.getBody()).getAsJsonObject();
            String password = body.get("password").getAsString();

            var item = ddb.getItem(GetItemRequest.builder()
                    .tableName("PingDish-Restaurants")
                    .key(Map.of("RestaurantId", AttributeValue.builder().s(restaurantId).build()))
                    .build()).item();

            if (item == null || item.isEmpty()) {
                return ResponseHelper.respond(401, Map.of("error", "Invalid Restaurant ID or password"), event);
            }

            String storedHash = item.get("PasswordHash").s();
            String inputHash = ReviewEnquiryActivity.hashPassword(password);

            if (!storedHash.equals(inputHash)) {
                return ResponseHelper.respond(401, Map.of("error", "Invalid Restaurant ID or password"), event);
            }

            if (!"ACTIVE".equals(item.get("Status").s())) {
                return ResponseHelper.respond(403, Map.of("error", "Restaurant account is suspended"), event);
            }

            return ResponseHelper.respond(200, Map.of(
                    "success", true,
                    "restaurantId", restaurantId,
                    "restaurantName", item.get("RestaurantName").s()
            ), event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }
}
