package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.pingdish.util.ErrorHandler;
import com.pingdish.util.ResponseHelper;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.*;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Map;

public class ResetPasswordActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final DynamoDbClient ddb = DynamoDbClient.create();
    private final SesV2Client ses = SesV2Client.create();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            String adminKey = event.getHeaders() != null ? event.getHeaders().get("x-admin-key") : null;
            if (adminKey == null || !adminKey.equals(System.getenv("ADMIN_SECRET"))) {
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

            // Generate new password
            String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
            SecureRandom random = new SecureRandom();
            StringBuilder sb = new StringBuilder(12);
            for (int i = 0; i < 12; i++) sb.append(chars.charAt(random.nextInt(chars.length())));
            String newPassword = sb.toString();

            ddb.updateItem(UpdateItemRequest.builder()
                    .tableName("PingDish-Restaurants")
                    .key(Map.of("RestaurantId", AttributeValue.builder().s(restaurantId).build()))
                    .updateExpression("SET PasswordHash = :h, PasswordResetAt = :t")
                    .expressionAttributeValues(Map.of(
                            ":h", AttributeValue.builder().s(ReviewEnquiryActivity.hashPassword(newPassword)).build(),
                            ":t", AttributeValue.builder().s(Instant.now().toString()).build()))
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
                                        "Your PingDish password has been reset.\n\n" +
                                        "Login at: https://www.pingdish.com/#login\n" +
                                        "Restaurant ID: " + restaurantId + "\n" +
                                        "New Password: " + newPassword + "\n\n" +
                                        "Team PingDish"
                                ).build()).build())
                                .build()).build())
                        .build());
            } catch (Exception e) {
                context.getLogger().log("SES send failed: " + e.getMessage());
            }

            return ResponseHelper.respond(200, Map.of("success", true, "emailSentTo", ownerEmail), event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }
}
