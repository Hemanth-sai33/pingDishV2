package com.pingdish.dao;

import com.pingdish.model.TableInfo;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.*;
import java.util.Map;

/**
 * Data access object for restaurant table information.
 */
public class TableDao {
    private final DynamoDbClient client;
    private static final String TABLE_NAME = "PingDish-Tables";

    public TableDao(DynamoDbClient client) {
        this.client = client;
    }

    /**
     * Retrieves table information by QR code (restaurantId#tableId).
     *
     * @param qrCode the composite key: restaurantId#tableId
     * @return table information, or null if not found
     */
    public TableInfo getTable(String qrCode) {
        var response = client.getItem(GetItemRequest.builder()
                .tableName(TABLE_NAME)
                .key(Map.of("QrCode", AttributeValue.builder().s(qrCode).build()))
                .build());

        if (!response.hasItem()) return null;

        var item = response.item();
        return TableInfo.builder()
                .restaurantId(item.get("RestaurantId").s())
                .tableId(item.get("TableId").s())
                .tableNumber(Integer.parseInt(item.get("TableNumber").n()))
                .build();
    }
}
