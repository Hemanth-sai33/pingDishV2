package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.inject.Inject;
import com.pingdish.component.SessionComponent;
import com.pingdish.config.ServiceInjector;
import com.pingdish.util.ErrorHandler;
import com.pingdish.util.ResponseHelper;
import java.util.Map;

public class CloseSessionActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final SessionComponent sessionComponent;

    public CloseSessionActivity() {
        this.sessionComponent = ServiceInjector.getInstance(SessionComponent.class);
    }

    @Inject
    public CloseSessionActivity(SessionComponent sessionComponent) {
        this.sessionComponent = sessionComponent;
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            String qrCode = event.getPathParameters().get("qrCode");
            boolean success = sessionComponent.closeSession(qrCode);

            if (!success) {
                return ResponseHelper.respond(404, Map.of("error", "Session not found"), event);
            }
            return ResponseHelper.respond(200, Map.of("success", true), event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }
}
