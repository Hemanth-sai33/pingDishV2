package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.pingdish.util.AdminAuthHelper;
import com.pingdish.util.AuditLogger;
import com.pingdish.util.ErrorHandler;
import com.pingdish.util.RateLimiter;
import com.pingdish.util.ResponseHelper;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.*;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.Map;

public class ResetPasswordActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final DynamoDbClient ddb = DynamoDbClient.create();
    private final SesV2Client ses = SesV2Client.create();

    // [SECURITY] Rate limit: 1 password reset per restaurant per 5 minutes
    private static final Duration RESET_COOLDOWN = Duration.ofMinutes(5);

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            // [SECURITY] Use new AdminAuthHelper instead of raw key comparison
            if (!AdminAuthHelper.isAuthenticated(event)) {
                return ResponseHelper.respond(403, Map.of("error", "Unauthorized"), event);
            }

            String restaurantId = event.getPathParameters().get("restaurantId");

            var item = ddb.getItem(GetItemRequest.builder()
                    .tableName("PingDish-Restaurants")
                    .key(Map.of("RestaurantId", AttributeValue.builder().s(restaurantId).build()))
                    .build()).item();

            if (item == null || item.isEmpty()) {
                return ResponseHelper.respond(404, Map.of("error", "Restaurant not found"), event);
            }

            // [SECURITY] Rate limiting on password resets
            long remainingCooldown = RateLimiter.checkCooldown(item, "PasswordResetAt", RESET_COOLDOWN);
            if (remainingCooldown > 0) {
                AuditLogger.log(ddb, "RESET_PASSWORD_RATE_LIMITED", "RESTAURANT", restaurantId,
                        "Rate limited. Cooldown remaining: " + remainingCooldown + "s", event);
                return ResponseHelper.respond(429, Map.of(
                        "error", "Password was recently reset. Please wait before trying again.",
                        "remainingSeconds", remainingCooldown
                ), event);
            }

            // Generate new password
            String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
            SecureRandom random = new SecureRandom();
            StringBuilder sb = new StringBuilder(12);
            for (int i = 0; i < 12; i++) sb.append(chars.charAt(random.nextInt(chars.length())));
            String newPassword = sb.toString();

            // [SECURITY] Flag password as temporary — must be changed on next login
            ddb.updateItem(UpdateItemRequest.builder()
                    .tableName("PingDish-Restaurants")
                    .key(Map.of("RestaurantId", AttributeValue.builder().s(restaurantId).build()))
                    .updateExpression("SET PasswordHash = :h, PasswordResetAt = :t, MustChangePassword = :mcp")
                    .expressionAttributeValues(Map.of(
                            ":h", AttributeValue.builder().s(ReviewEnquiryActivity.hashPassword(newPassword)).build(),
                            ":t", AttributeValue.builder().s(Instant.now().toString()).build(),
                            ":mcp", AttributeValue.builder().bool(true).build()))
                    .build());

            // Email new password to owner
            String ownerEmail = item.get("OwnerEmail").s();
            String ownerName = item.containsKey("OwnerName") ? item.get("OwnerName").s() : "";
            try {
                ses.sendEmail(SendEmailRequest.builder()
                        .fromEmailAddress("support@pingdish.com")
                        .destination(Destination.builder().toAddresses(ownerEmail).build())
                        .content(EmailContent.builder().simple(Message.builder()
                                .subject(Content.builder().data("PingDish - Password Reset").build())
                                .body(Body.builder().text(Content.builder().data(
                                        "Hi " + ownerName + ",\n\n" +
                                        "Your PingDish password has been reset by an administrator.\n\n" +
                                        "Login at: https://www.pingdish.com/#login\n" +
                                        "Restaurant ID: " + restaurantId + "\n" +
                                        "Temporary Password: " + newPassword + "\n\n" +
                                        "IMPORTANT: This is a temporary password. You will be required to change it on your next login.\n\n" +
                                        "If you did not request this reset, please contact support@pingdish.com immediately.\n\n" +
                                        "Team PingDish"
                                ).build()).build())
                                .build()).build())
                        .build());
            } catch (Exception e) {
                context.getLogger().log("SES send failed: " + e.getMessage());
            }

            // [SECURITY] Audit log the password reset
            AuditLogger.log(ddb, "RESET_PASSWORD", "RESTAURANT", restaurantId,
                    "Password reset for restaurant. Email sent to " + ownerEmail, event);

            return ResponseHelper.respond(200, Map.of("success", true, "emailSentTo", ownerEmail), event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }
}
