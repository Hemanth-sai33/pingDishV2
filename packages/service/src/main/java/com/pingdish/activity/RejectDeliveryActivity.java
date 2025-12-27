package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.google.inject.Inject;
import com.pingdish.component.SessionComponent;
import com.pingdish.config.ServiceInjector;
import java.util.Map;

public class RejectDeliveryActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private static final Gson GSON = new Gson();
    private final SessionComponent sessionComponent;

    public RejectDeliveryActivity() {
        this.sessionComponent = ServiceInjector.getInstance(SessionComponent.class);
    }

    @Inject
    public RejectDeliveryActivity(SessionComponent sessionComponent) {
        this.sessionComponent = sessionComponent;
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        String sessionId = event.getPathParameters().get("sessionId");
        boolean success = sessionComponent.rejectDelivery(sessionId);

        if (!success) {
            return response(404, Map.of("error", "Session not found"));
        }
        return response(200, Map.of("success", true));
    }

    private APIGatewayProxyResponseEvent response(int statusCode, Object body) {
        return new APIGatewayProxyResponseEvent()
                .withStatusCode(statusCode)
                .withHeaders(Map.of("Access-Control-Allow-Origin", "*"))
                .withBody(GSON.toJson(body));
    }
}
