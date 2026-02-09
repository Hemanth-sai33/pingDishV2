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
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;
import software.amazon.awssdk.services.sesv2.SesV2Client;
import software.amazon.awssdk.services.sesv2.model.*;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

public class SubmitEnquiryActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final DynamoDbClient ddb = DynamoDbClient.create();
    private final SesV2Client ses = SesV2Client.create();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            JsonObject body = JsonParser.parseString(event.getBody()).getAsJsonObject();
            String name = body.get("name").getAsString().trim();
            String email = body.get("email").getAsString().trim();
            String company = body.get("company").getAsString().trim();
            String tables = body.has("tables") ? body.get("tables").getAsString().trim() : "";
            String message = body.has("message") ? body.get("message").getAsString().trim() : "";

            if (name.isEmpty() || email.isEmpty() || company.isEmpty()) {
                return ResponseHelper.respond(400, Map.of("error", "Name, email, and company are required"), event);
            }

            String enquiryId = UUID.randomUUID().toString();
            Map<String, AttributeValue> item = new HashMap<>();
            item.put("EnquiryId", AttributeValue.builder().s(enquiryId).build());
            item.put("Name", AttributeValue.builder().s(name).build());
            item.put("Email", AttributeValue.builder().s(email).build());
            item.put("Company", AttributeValue.builder().s(company).build());
            item.put("Tables", AttributeValue.builder().s(tables).build());
            item.put("Message", AttributeValue.builder().s(message).build());
            item.put("Status", AttributeValue.builder().s("PENDING").build());
            item.put("CreatedAt", AttributeValue.builder().s(Instant.now().toString()).build());

            ddb.putItem(PutItemRequest.builder().tableName("PingDish-Enquiries").item(item).build());

            // Send notification email to admin
            try {
                ses.sendEmail(SendEmailRequest.builder()
                        .fromEmailAddress("support@pingdish.com")
                        .destination(Destination.builder().toAddresses("support@pingdish.com").build())
                        .content(EmailContent.builder().simple(Message.builder()
                                .subject(Content.builder().data("New Restaurant Enquiry - " + company).build())
                                .body(Body.builder().text(Content.builder().data(
                                        "New enquiry received:\n\nName: " + name +
                                        "\nEmail: " + email +
                                        "\nCompany: " + company +
                                        "\nLocations: " + tables +
                                        "\nMessage: " + message +
                                        "\n\nEnquiry ID: " + enquiryId
                                ).build()).build())
                                .build()).build())
                        .build());
            } catch (Exception e) {
                // Log but don't fail — enquiry is saved
                context.getLogger().log("SES send failed: " + e.getMessage());
            }

            return ResponseHelper.respond(200, Map.of("success", true, "enquiryId", enquiryId), event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }
}
