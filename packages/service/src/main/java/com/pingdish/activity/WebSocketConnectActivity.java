package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketResponse;
import com.google.inject.Inject;
import com.pingdish.component.WebSocketComponent;
import com.pingdish.config.ServiceInjector;
import java.util.logging.Logger;

public class WebSocketConnectActivity implements RequestHandler<APIGatewayV2WebSocketEvent, APIGatewayV2WebSocketResponse> {
    // [FIX 7.1] Replace System.out.println with java.util.logging
    private static final Logger LOG = Logger.getLogger(WebSocketConnectActivity.class.getName());
    private final WebSocketComponent wsComponent;

    public WebSocketConnectActivity() {
        this.wsComponent = ServiceInjector.getInstance(WebSocketComponent.class);
    }

    @Inject
    public WebSocketConnectActivity(WebSocketComponent wsComponent) {
        this.wsComponent = wsComponent;
    }

    @Override
    public APIGatewayV2WebSocketResponse handleRequest(APIGatewayV2WebSocketEvent event, Context context) {
        String connectionId = event.getRequestContext().getConnectionId();
        var params = event.getQueryStringParameters();
        String restaurantId = params != null ? params.get("restaurantId") : null;
        String sessionId = params != null ? params.get("sessionId") : null;

        // [FIX 4.3] Reject connections without a restaurantId or sessionId
        if (restaurantId == null && sessionId == null) {
            LOG.warning("WS Connect rejected: no restaurantId or sessionId provided");
            APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
            response.setStatusCode(400);
            return response;
        }

        LOG.info("WS Connect: connectionId=" + mask(connectionId) + ", restaurantId=" + restaurantId);

        wsComponent.onConnect(connectionId, restaurantId, sessionId);

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        return response;
    }

    private static String mask(String value) {
        if (value == null || value.length() < 8) return "***";
        return value.substring(0, 4) + "..." + value.substring(value.length() - 4);
    }
}
