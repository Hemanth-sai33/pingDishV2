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
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import software.amazon.awssdk.services.dynamodb.model.ScanResponse;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

public class ListRestaurantsActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final DynamoDbClient ddb = DynamoDbClient.create();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            // [SECURITY] Use AdminAuthHelper instead of raw key comparison
            if (!AdminAuthHelper.isAuthenticated(event)) {
                return ResponseHelper.respond(403, Map.of("error", "Unauthorized"), event);
            }

            // [SECURITY] Audit log
            AuditLogger.log(ddb, "LIST_RESTAURANTS", "RESTAURANT", "ALL",
                    "Admin listed all restaurants", event);

            ScanResponse response = ddb.scan(ScanRequest.builder().tableName("PingDish-Restaurants").build());
            List<Map<String, String>> restaurants = new ArrayList<>();
            for (var item : response.items()) {
                Map<String, String> r = new HashMap<>();
                item.forEach((k, v) -> { if (!"PasswordHash".equals(k)) r.put(k, v.s() != null ? v.s() : v.n()); });
                restaurants.add(r);
            }
            return ResponseHelper.respond(200, Map.of("restaurants", restaurants), event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }
}
