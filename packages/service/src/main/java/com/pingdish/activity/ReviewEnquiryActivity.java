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
import software.amazon.awssdk.services.dynamodb.model.*;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.*;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.*;

public class ReviewEnquiryActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final DynamoDbClient ddb = DynamoDbClient.create();
    private final SesV2Client ses = SesV2Client.builder().region(software.amazon.awssdk.regions.Region.AP_SOUTH_1).build();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            String adminKey = event.getHeaders() != null ? event.getHeaders().get("x-admin-key") : null;
            if (adminKey == null || !adminKey.equals(System.getenv("ADMIN_SECRET"))) {
                return ResponseHelper.respond(403, Map.of("error", "Unauthorized"), event);
            }

            String enquiryId = event.getPathParameters().get("enquiryId");
            JsonObject body = JsonParser.parseString(event.getBody()).getAsJsonObject();
            String action = body.get("action").getAsString(); // APPROVE or DECLINE

            // Get enquiry
            var enquiry = ddb.getItem(GetItemRequest.builder()
                    .tableName("PingDish-Enquiries")
                    .key(Map.of("EnquiryId", AttributeValue.builder().s(enquiryId).build()))
                    .build()).item();

            if (enquiry == null || enquiry.isEmpty()) {
                return ResponseHelper.respond(404, Map.of("error", "Enquiry not found"), event);
            }

            String ownerEmail = enquiry.get("Email").s();
            String company = enquiry.get("Company").s();

            if ("APPROVE".equals(action)) {
                String restaurantId = body.get("restaurantId").getAsString().trim();
                String restaurantName = body.has("restaurantName") ? body.get("restaurantName").getAsString().trim() : company;
                int numberOfTables = body.get("numberOfTables").getAsInt();

                // Auto-generate password
                String password = generatePassword();
                String passwordHash = hashPassword(password);

                // Save to Restaurants table
                Map<String, AttributeValue> restItem = new HashMap<>();
                restItem.put("RestaurantId", AttributeValue.builder().s(restaurantId).build());
                restItem.put("RestaurantName", AttributeValue.builder().s(restaurantName).build());
                restItem.put("OwnerName", AttributeValue.builder().s(enquiry.get("Name").s()).build());
                restItem.put("OwnerEmail", AttributeValue.builder().s(ownerEmail).build());
                restItem.put("PasswordHash", AttributeValue.builder().s(passwordHash).build());
                restItem.put("NumberOfTables", AttributeValue.builder().n(String.valueOf(numberOfTables)).build());
                restItem.put("Status", AttributeValue.builder().s("ACTIVE").build());
                restItem.put("EnquiryId", AttributeValue.builder().s(enquiryId).build());
                restItem.put("CreatedAt", AttributeValue.builder().s(Instant.now().toString()).build());
                ddb.putItem(PutItemRequest.builder().tableName("PingDish-Restaurants").item(restItem).build());

                // Create table entries (same as RegisterRestaurantActivity)
                for (int i = 1; i <= numberOfTables; i++) {
                    Map<String, AttributeValue> tableItem = new HashMap<>();
                    tableItem.put("QrCode", AttributeValue.builder().s(restaurantId + "#" + i).build());
                    tableItem.put("RestaurantId", AttributeValue.builder().s(restaurantId).build());
                    tableItem.put("TableId", AttributeValue.builder().s(String.valueOf(i)).build());
                    tableItem.put("TableNumber", AttributeValue.builder().n(String.valueOf(i)).build());
                    tableItem.put("Status", AttributeValue.builder().s("ACTIVE").build());
                    ddb.putItem(PutItemRequest.builder().tableName("PingDish-Tables").item(tableItem).build());
                }

                // Update enquiry status
                ddb.updateItem(UpdateItemRequest.builder()
                        .tableName("PingDish-Enquiries")
                        .key(Map.of("EnquiryId", AttributeValue.builder().s(enquiryId).build()))
                        .updateExpression("SET #s = :s, ApprovedAt = :t, RestaurantId = :rid")
                        .expressionAttributeNames(Map.of("#s", "Status"))
                        .expressionAttributeValues(Map.of(
                                ":s", AttributeValue.builder().s("APPROVED").build(),
                                ":t", AttributeValue.builder().s(Instant.now().toString()).build(),
                                ":rid", AttributeValue.builder().s(restaurantId).build()))
                        .build());

                // Email credentials to owner
                sendEmail(ownerEmail, "Welcome to PingDish - Your Login Credentials",
                        "Hi " + enquiry.get("Name").s() + ",\n\n" +
                        "Your restaurant has been approved on PingDish!\n\n" +
                        "Login at: https://www.pingdish.com/#login\n" +
                        "Restaurant ID: " + restaurantId + "\n" +
                        "Password: " + password + "\n\n" +
                        "Kitchen Dashboard: https://kitchen.pingdish.com/" + restaurantId + "\n\n" +
                        "Please change your password after first login.\n\nTeam PingDish", context);

                return ResponseHelper.respond(200, Map.of("success", true, "restaurantId", restaurantId), event);

            } else if ("DECLINE".equals(action)) {
                ddb.updateItem(UpdateItemRequest.builder()
                        .tableName("PingDish-Enquiries")
                        .key(Map.of("EnquiryId", AttributeValue.builder().s(enquiryId).build()))
                        .updateExpression("SET #s = :s, DeclinedAt = :t")
                        .expressionAttributeNames(Map.of("#s", "Status"))
                        .expressionAttributeValues(Map.of(
                                ":s", AttributeValue.builder().s("DECLINED").build(),
                                ":t", AttributeValue.builder().s(Instant.now().toString()).build()))
                        .build());

                sendEmail(ownerEmail, "PingDish - Enquiry Update",
                        "Hi " + enquiry.get("Name").s() + ",\n\n" +
                        "Thank you for your interest in PingDish. Unfortunately, we're unable to onboard your restaurant at this time.\n\n" +
                        "Please feel free to reach out again.\n\nTeam PingDish", context);

                return ResponseHelper.respond(200, Map.of("success", true), event);
            }

            return ResponseHelper.respond(400, Map.of("error", "Invalid action"), event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }

    private String generatePassword() {
        String chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
        SecureRandom random = new SecureRandom();
        StringBuilder sb = new StringBuilder(12);
        for (int i = 0; i < 12; i++) sb.append(chars.charAt(random.nextInt(chars.length())));
        return sb.toString();
    }

    static String hashPassword(String password) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(password.getBytes(StandardCharsets.UTF_8));
            return Base64.getEncoder().encodeToString(hash);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    private void sendEmail(String to, String subject, String bodyText, Context context) {
        try {
            ses.sendEmail(SendEmailRequest.builder()
                    .fromEmailAddress("support@pingdish.com")
                    .destination(Destination.builder().toAddresses(to).build())
                    .content(EmailContent.builder().simple(Message.builder()
                            .subject(Content.builder().data(subject).build())
                            .body(Body.builder().text(Content.builder().data(bodyText).build()).build())
                            .build()).build())
                    .build());
        } catch (Exception e) {
            context.getLogger().log("SES send failed: " + e.getMessage());
        }
    }
}
