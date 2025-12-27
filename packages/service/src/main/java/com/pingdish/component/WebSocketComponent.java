package com.pingdish.component;

import com.pingdish.dao.ConnectionDao;
import com.pingdish.model.Connection;
import com.pingdish.model.ConnectionType;
import java.time.Instant;

/**
 * Manages WebSocket connection lifecycle for kitchen and customer clients.
 */
public class WebSocketComponent {
    private final ConnectionDao connectionDao;

    public WebSocketComponent(ConnectionDao connectionDao) {
        this.connectionDao = connectionDao;
    }

    /**
     * Handles new WebSocket connection, storing connection metadata.
     *
     * @param connectionId the WebSocket connection identifier
     * @param restaurantId the restaurant ID for scoping
     * @param sessionId the customer session ID, or null for kitchen connections
     */
    public void onConnect(String connectionId, String restaurantId, String sessionId) {
        ConnectionType type = sessionId != null ? ConnectionType.CUSTOMER : ConnectionType.KITCHEN;
        connectionDao.saveConnection(Connection.builder()
                .connectionId(connectionId)
                .type(type)
                .restaurantId(restaurantId)
                .sessionId(sessionId)
                .connectedAt(Instant.now().toString())
                .build());
    }

    /**
     * Handles WebSocket disconnection, removing connection from storage.
     */
    public void onDisconnect(String connectionId) {
        connectionDao.deleteConnection(connectionId);
    }
}
