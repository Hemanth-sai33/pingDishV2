package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayV2WebSocketResponse;
import com.google.inject.Inject;
import com.pingdish.component.WebSocketComponent;
import com.pingdish.config.ServiceInjector;

public class WebSocketConnectActivity implements RequestHandler<APIGatewayV2WebSocketEvent, APIGatewayV2WebSocketResponse> {
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
        
        System.out.println("WS Connect: connectionId=" + connectionId + ", restaurantId=" + restaurantId + ", sessionId=" + sessionId);

        wsComponent.onConnect(connectionId, restaurantId, sessionId);

        APIGatewayV2WebSocketResponse response = new APIGatewayV2WebSocketResponse();
        response.setStatusCode(200);
        return response;
    }
}
