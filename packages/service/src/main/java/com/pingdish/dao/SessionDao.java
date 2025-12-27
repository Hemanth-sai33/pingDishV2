package com.pingdish.dao;

import com.pingdish.model.Session;
import com.pingdish.model.SessionStatus;
import com.pingdish.model.PingStatus;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import java.util.HashMap;
import java.util.Map;

/**
 * Data access object for customer session management.
 */
public class SessionDao {
    private final DynamoDbClient client;
    private static final String TABLE_NAME = "PingDish-Sessions";

    public SessionDao(DynamoDbClient client) {
        this.client = client;
    }

    /**
     * Retrieves a session by its unique identifier.
     */
    public Session getSession(String sessionId) {
        var response = client.getItem(GetItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(Map.of("SessionId", AttributeValue.builder().s(sessionId).build()))
                .build());
        return response.hasItem() ? mapToSession(response.item()) : null;
    }

    /**
     * Retrieves the active session for a given restaurant and table.
     */
    public Session getActiveSession(String restaurantId, String tableId) {
        String compositeKey = restaurantId + "#" + tableId;
        var response = client.query(QueryRequest.builder()
                .tableName(TABLE_NAME)
                .indexName("RestaurantTable-Status-Index")
                .keyConditionExpression("RestaurantTableId = :rtid AND #status = :s")
                .expressionAttributeNames(Map.of("#status", "Status"))
                .expressionAttributeValues(Map.of(
                        ":rtid", AttributeValue.builder().s(compositeKey).build(),
                        ":s", AttributeValue.builder().s(SessionStatus.ACTIVE.name()).build()))
                .build());
        return response.items().isEmpty() ? null : mapToSession(response.items().get(0));
    }

    /**
     * Creates a new session in the database.
     */
    public void createSession(Session session) {
        client.putItem(PutItemRequest.builder()
                .tableName(TABLE_NAME)
                .item(sessionToMap(session))
                .build());
    }

    /**
     * Updates specific attributes of an existing session.
     */
    public void updateSession(String sessionId, Map<String, AttributeValue> updates) {
        var expr = new StringBuilder("SET ");
        var names = new HashMap<String, String>();
        var values = new HashMap<String, AttributeValue>();
        int i = 0;
        for (var entry : updates.entrySet()) {
            if (i > 0) expr.append(", ");
            expr.append("#k").append(i).append(" = :v").append(i);
            names.put("#k" + i, entry.getKey());
            values.put(":v" + i, entry.getValue());
            i++;
        }
        client.updateItem(UpdateItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(Map.of("SessionId", AttributeValue.builder().s(sessionId).build()))
                .updateExpression(expr.toString())
                .expressionAttributeNames(names)
                .expressionAttributeValues(values)
                .build());
    }

    private Session mapToSession(Map<String, AttributeValue> item) {
        return Session.builder()
                .sessionId(item.get("SessionId").s())
                .restaurantId(item.get("RestaurantId").s())
                .tableId(item.get("TableId").s())
                .tableNumber(Integer.parseInt(item.get("TableNumber").n()))
                .status(SessionStatus.valueOf(item.get("Status").s()))
                .pingStatus(PingStatus.valueOf(item.get("PingStatus").s()))
                .pingCount(item.containsKey("PingCount") ? Integer.parseInt(item.get("PingCount").n()) : 0)
                .createdAt(item.containsKey("CreatedAt") ? item.get("CreatedAt").s() : null)
                .lastPingAt(item.containsKey("LastPingAt") ? item.get("LastPingAt").s() : null)
                .servingStartedAt(item.containsKey("ServingStartedAt") ? item.get("ServingStartedAt").s() : null)
                .build();
    }

    private Map<String, AttributeValue> sessionToMap(Session s) {
        var map = new HashMap<String, AttributeValue>();
        map.put("SessionId", AttributeValue.builder().s(s.sessionId()).build());
        map.put("RestaurantId", AttributeValue.builder().s(s.restaurantId()).build());
        map.put("TableId", AttributeValue.builder().s(s.tableId()).build());
        map.put("RestaurantTableId", AttributeValue.builder().s(s.restaurantId() + "#" + s.tableId()).build());
        map.put("TableNumber", AttributeValue.builder().n(String.valueOf(s.tableNumber())).build());
        map.put("Status", AttributeValue.builder().s(s.status().name()).build());
        map.put("PingStatus", AttributeValue.builder().s(s.pingStatus().name()).build());
        map.put("PingCount", AttributeValue.builder().n(String.valueOf(s.pingCount())).build());
        map.put("CreatedAt", AttributeValue.builder().s(s.createdAt()).build());
        return map;
    }
}
