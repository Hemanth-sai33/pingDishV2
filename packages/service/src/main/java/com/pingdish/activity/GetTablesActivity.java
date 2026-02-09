package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.pingdish.util.ErrorHandler;
import com.pingdish.util.ResponseHelper;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.ScanRequest;
import java.util.List;
import java.util.Map;

public class GetTablesActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final DynamoDbClient dynamoDbClient = DynamoDbClient.create();

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            String restaurantId = event.getPathParameters().get("restaurantId");

            var response = dynamoDbClient.scan(ScanRequest.builder()
                .tableName("PingDish-Tables")
                .filterExpression("RestaurantId = :rid")
                .expressionAttributeValues(Map.of(":rid", AttributeValue.builder().s(restaurantId).build()))
                .build());

            List<Integer> tables = response.items().stream()
                .map(item -> Integer.parseInt(item.get("TableNumber").n()))
                .sorted()
                .toList();

            return ResponseHelper.respond(200, Map.of("tables", tables), event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }
}
