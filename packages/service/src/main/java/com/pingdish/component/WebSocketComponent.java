package com.pingdish.component;

import com.pingdish.dao.ConnectionDao;
import com.pingdish.model.Connection;
import com.pingdish.model.ConnectionType;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.logging.Logger;

/**
 * Manages WebSocket connection lifecycle for kitchen and customer clients.
 */
public class WebSocketComponent {
    // [FIX 7.1] Replace System.out.println with java.util.logging
    private static final Logger LOG = Logger.getLogger(WebSocketComponent.class.getName());
    // [FIX 4.3] Limit connections per restaurant
    private static final int MAX_CONNECTIONS_PER_RESTAURANT = 50;

    private final ConnectionDao connectionDao;

    public WebSocketComponent(ConnectionDao connectionDao) {
        this.connectionDao = connectionDao;
    }

    public void onConnect(String connectionId, String restaurantId, String sessionId) {
        ConnectionType type = sessionId != null ? ConnectionType.CUSTOMER : ConnectionType.KITCHEN;
        LOG.info("WebSocketComponent.onConnect: type=" + type + ", restaurantId=" + restaurantId);

        // [FIX 4.3] Enforce connection limit per restaurant
        if (restaurantId != null) {
            var existing = connectionDao.getKitchenConnections(restaurantId);
            if (existing.size() >= MAX_CONNECTIONS_PER_RESTAURANT) {
                LOG.warning("Connection limit reached for restaurant: " + restaurantId);
                throw new RuntimeException("Connection limit reached");
            }
        }

        // [FIX 6.3] Set TTL for auto-expiry (2 hours)
        long expiresAt = Instant.now().plus(2, ChronoUnit.HOURS).getEpochSecond();

        connectionDao.saveConnection(Connection.builder()
                .connectionId(connectionId)
                .type(type)
                .restaurantId(restaurantId)
                .sessionId(sessionId)
                .connectedAt(Instant.now().toString())
                .expiresAt(expiresAt)
                .build());
    }

    public void onDisconnect(String connectionId) {
        connectionDao.deleteConnection(connectionId);
    }
}
