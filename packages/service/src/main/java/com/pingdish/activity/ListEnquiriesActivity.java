package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.pingdish.util.AdminAuthHelper;
import com.pingdish.util.AuditLogger;
import com.pingdish.util.ErrorHandler;
import com.pingdish.util.ResponseHelper;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ListEnquiriesActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final DynamoDbClient ddb = DynamoDbClient.create();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            // [SECURITY] Use AdminAuthHelper instead of raw key comparison
            if (!AdminAuthHelper.isAuthenticated(event)) {
                return ResponseHelper.respond(403, Map.of("error", "Unauthorized"), event);
            }

            // [SECURITY] Audit log
            AuditLogger.log(ddb, "LIST_ENQUIRIES", "ENQUIRY", "ALL",
                    "Admin listed enquiries" + (event.getQueryStringParameters() != null && event.getQueryStringParameters().get("status") != null
                            ? " (filter: " + event.getQueryStringParameters().get("status") + ")" : ""), event);

            String statusFilter = event.getQueryStringParameters() != null
                    ? event.getQueryStringParameters().get("status") : null;

            ScanRequest.Builder scanBuilder = ScanRequest.builder().tableName("PingDish-Enquiries");
            if (statusFilter != null) {
                scanBuilder.filterExpression("#s = :status")
                        .expressionAttributeNames(Map.of("#s", "Status"))
                        .expressionAttributeValues(Map.of(":status", AttributeValue.builder().s(statusFilter).build()));
            }

            ScanResponse response = ddb.scan(scanBuilder.build());
            List<Map<String, String>> enquiries = new ArrayList<>();
            for (var item : response.items()) {
                Map<String, String> e = new HashMap<>();
                item.forEach((k, v) -> e.put(k, v.s() != null ? v.s() : v.n()));
                enquiries.add(e);
            }

            return ResponseHelper.respond(200, Map.of("enquiries", enquiries), event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }
}
