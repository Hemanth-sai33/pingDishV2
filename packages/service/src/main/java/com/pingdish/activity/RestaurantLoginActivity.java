package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.pingdish.util.AdminAuthHelper;
import com.pingdish.util.AuditLogger;
import com.pingdish.util.ErrorHandler;
import com.pingdish.util.RateLimiter;
import com.pingdish.util.ResponseHelper;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.GetItemRequest;
import software.amazon.awssdk.services.dynamodb.model.UpdateItemRequest;
import java.time.Duration;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

public class RestaurantLoginActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final DynamoDbClient ddb = DynamoDbClient.create();

    // [SECURITY] Rate limit: max 1 login attempt per 3 seconds per restaurant (brute-force protection)
    private static final Duration LOGIN_COOLDOWN = Duration.ofSeconds(3);

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

            // [SECURITY] Rate limit login attempts to prevent brute-force
            long remainingCooldown = RateLimiter.checkCooldown(item, "LastLoginAttemptAt", LOGIN_COOLDOWN);
            if (remainingCooldown > 0) {
                AuditLogger.log(ddb, "LOGIN_RATE_LIMITED", "RESTAURANT", restaurantId,
                        "Login rate limited. Cooldown remaining: " + remainingCooldown + "s", event);
                return ResponseHelper.respond(429, Map.of(
                        "error", "Too many login attempts. Please wait a moment.",
                        "remainingSeconds", remainingCooldown
                ), event);
            }

            // [SECURITY] Record this login attempt timestamp
            ddb.updateItem(UpdateItemRequest.builder()
                    .tableName("PingDish-Restaurants")
                    .key(Map.of("RestaurantId", AttributeValue.builder().s(restaurantId).build()))
                    .updateExpression("SET LastLoginAttemptAt = :t")
                    .expressionAttributeValues(Map.of(
                            ":t", AttributeValue.builder().s(Instant.now().toString()).build()))
                    .build());

            String storedHash = item.get("PasswordHash").s();
            String inputHash = ReviewEnquiryActivity.hashPassword(password);

            if (!storedHash.equals(inputHash)) {
                // [SECURITY] Audit failed login attempt
                AuditLogger.log(ddb, "LOGIN_FAILED", "RESTAURANT", restaurantId,
                        "Failed login attempt", event);
                return ResponseHelper.respond(401, Map.of("error", "Invalid Restaurant ID or password"), event);
            }

            if (!"ACTIVE".equals(item.get("Status").s())) {
                AuditLogger.log(ddb, "LOGIN_SUSPENDED", "RESTAURANT", restaurantId,
                        "Login attempt on suspended account", event);
                return ResponseHelper.respond(403, Map.of("error", "Restaurant account is suspended"), event);
            }

            // [SECURITY] Check if user must change their temporary password
            boolean mustChangePassword = item.containsKey("MustChangePassword")
                    && item.get("MustChangePassword").bool() != null
                    && item.get("MustChangePassword").bool();

            // [SECURITY] Audit successful login
            AuditLogger.log(ddb, "LOGIN_SUCCESS", "RESTAURANT", restaurantId,
                    "Successful login" + (mustChangePassword ? " (must change password)" : ""), event);

            // Build response with MustChangePassword flag
            Map<String, Object> responseBody = new HashMap<>();
            responseBody.put("success", true);
            responseBody.put("restaurantId", restaurantId);
            responseBody.put("restaurantName", item.get("RestaurantName").s());
            responseBody.put("mustChangePassword", mustChangePassword);

            return ResponseHelper.respond(200, responseBody, event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }
}
