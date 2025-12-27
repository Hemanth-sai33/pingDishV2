package com.pingdish.dao;

import com.pingdish.model.Connection;
import com.pingdish.model.ConnectionType;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import java.util.List;
import java.util.Map;

/**
 * Data access object for WebSocket connection management.
 */
public class ConnectionDao {
    private final DynamoDbClient client;
    private static final String TABLE_NAME = "PingDish-Connections";

    public ConnectionDao(DynamoDbClient client) {
        this.client = client;
    }

    /**
     * Saves a new WebSocket connection to the database.
     */
    public void saveConnection(Connection conn) {
        var item = new java.util.HashMap<String, AttributeValue>();
        item.put("ConnectionId", AttributeValue.builder().s(conn.connectionId()).build());
        item.put("Type", AttributeValue.builder().s(conn.type().name()).build());
        item.put("ConnectedAt", AttributeValue.builder().s(conn.connectedAt()).build());
        if (conn.restaurantId() != null) {
            item.put("RestaurantId", AttributeValue.builder().s(conn.restaurantId()).build());
        }
        if (conn.sessionId() != null) {
            item.put("SessionId", AttributeValue.builder().s(conn.sessionId()).build());
        }
        client.putItem(PutItemRequest.builder().tableName(TABLE_NAME).item(item).build());
    }

    /**
     * Deletes a WebSocket connection from the database.
     */
    public void deleteConnection(String connectionId) {
        client.deleteItem(DeleteItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(Map.of("ConnectionId", AttributeValue.builder().s(connectionId).build()))
                .build());
    }

    /**
     * Retrieves all kitchen connections for a specific restaurant.
     */
    public List<Connection> getKitchenConnections(String restaurantId) {
        var response = client.scan(ScanRequest.builder()
                .tableName(TABLE_NAME)
                .filterExpression("#type = :t AND RestaurantId = :rid")
                .expressionAttributeNames(Map.of("#type", "Type"))
                .expressionAttributeValues(Map.of(
                        ":t", AttributeValue.builder().s(ConnectionType.KITCHEN.name()).build(),
                        ":rid", AttributeValue.builder().s(restaurantId).build()))
                .build());
        return response.items().stream().map(this::mapToConnection).toList();
    }

    /**
     * Retrieves all customer connections for a specific session.
     */
    public List<Connection> getSessionConnections(String sessionId) {
        var response = client.scan(ScanRequest.builder()
                .tableName(TABLE_NAME)
                .filterExpression("SessionId = :sid")
                .expressionAttributeValues(Map.of(":sid", AttributeValue.builder().s(sessionId).build()))
                .build());
        return response.items().stream().map(this::mapToConnection).toList();
    }

    private Connection mapToConnection(Map<String, AttributeValue> item) {
        return Connection.builder()
                .connectionId(item.get("ConnectionId").s())
                .type(ConnectionType.valueOf(item.get("Type").s()))
                .restaurantId(item.containsKey("RestaurantId") ? item.get("RestaurantId").s() : null)
                .sessionId(item.containsKey("SessionId") ? item.get("SessionId").s() : null)
                .connectedAt(item.containsKey("ConnectedAt") ? item.get("ConnectedAt").s() : null)
                .build();
    }
}
