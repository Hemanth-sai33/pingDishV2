package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.inject.Inject;
import com.pingdish.component.SessionComponent;
import com.pingdish.component.SessionComponent.PingResult;
import com.pingdish.config.ServiceInjector;
import com.pingdish.util.ErrorHandler;
import com.pingdish.util.ResponseHelper;
import java.util.Map;

public class PingKitchenActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final SessionComponent sessionComponent;

    public PingKitchenActivity() {
        this.sessionComponent = ServiceInjector.getInstance(SessionComponent.class);
    }

    @Inject
    public PingKitchenActivity(SessionComponent sessionComponent) {
        this.sessionComponent = sessionComponent;
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            String sessionId = event.getPathParameters().get("sessionId");
            PingResult result = sessionComponent.ping(sessionId);

            if (result.error() != null) {
                int status = "Cooldown".equals(result.error()) ? 429 : 404;
                var body = new java.util.HashMap<String, Object>();
                body.put("error", result.error());
                if (result.remainingSeconds() != null) body.put("remainingSeconds", result.remainingSeconds());
                return ResponseHelper.respond(status, body, event);
            }
            return ResponseHelper.respond(200, Map.of("success", true, "pingCount", result.pingCount()), event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }
}
