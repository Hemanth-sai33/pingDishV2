package com.pingdish.accessor;

import com.pingdish.dao.ConnectionDao;
import com.google.gson.Gson;
import software.amazon.awssdk.core.SdkBytes;
import software.amazon.awssdk.services.apigatewaymanagementapi.ApiGatewayManagementApiClient;
import software.amazon.awssdk.services.apigatewaymanagementapi.model.GoneException;
import software.amazon.awssdk.services.apigatewaymanagementapi.model.PostToConnectionRequest;
import java.net.URI;
import java.util.Map;

/**
 * Accessor for broadcasting messages via WebSocket API Gateway.
 */
public class WebSocketAccessor {
    private final ConnectionDao connectionDao;
    private final String wsEndpoint;
    private final Gson gson = new Gson();

    public WebSocketAccessor(ConnectionDao connectionDao, String wsEndpoint) {
        this.connectionDao = connectionDao;
        this.wsEndpoint = wsEndpoint;
    }

    /**
     * Broadcasts a message to all connected kitchen dashboards for a restaurant.
     */
    public void broadcastToKitchen(String restaurantId, Map<String, Object> data) {
        var connections = connectionDao.getKitchenConnections(restaurantId);
        connections.forEach(c -> sendToConnection(c.connectionId(), data));
    }

    /**
     * Broadcasts a message to all customer connections for a session.
     */
    public void broadcastToSession(String sessionId, Map<String, Object> data) {
        var connections = connectionDao.getSessionConnections(sessionId);
        connections.forEach(c -> sendToConnection(c.connectionId(), data));
    }

    /**
     * Broadcasts a message to both kitchen and customer connections.
     */
    public void broadcastToAll(String restaurantId, String sessionId, Map<String, Object> data) {
        broadcastToKitchen(restaurantId, data);
        broadcastToSession(sessionId, data);
    }

    private void sendToConnection(String connectionId, Map<String, Object> data) {
        try (var client = ApiGatewayManagementApiClient.builder()
                .endpointOverride(URI.create(wsEndpoint))
                .build()) {
            client.postToConnection(PostToConnectionRequest.builder()
                    .connectionId(connectionId)
                    .data(SdkBytes.fromUtf8String(gson.toJson(data)))
                    .build());
        } catch (GoneException e) {
            connectionDao.deleteConnection(connectionId);
        } catch (Exception e) {
            System.err.println("Failed to send to " + connectionId + ": " + e.getMessage());
        }
    }
}
