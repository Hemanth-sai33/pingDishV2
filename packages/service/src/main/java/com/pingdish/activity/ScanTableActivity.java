package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.inject.Inject;
import com.pingdish.component.SessionComponent;
import com.pingdish.config.ServiceInjector;
import com.pingdish.model.Session;
import com.pingdish.util.ErrorHandler;
import com.pingdish.util.ResponseHelper;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class ScanTableActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private final SessionComponent sessionComponent;

    public ScanTableActivity() {
        this.sessionComponent = ServiceInjector.getInstance(SessionComponent.class);
    }

    @Inject
    public ScanTableActivity(SessionComponent sessionComponent) {
        this.sessionComponent = sessionComponent;
    }

    @Override
    public APIGatewayProxyResponseEvent handleRequest(APIGatewayProxyRequestEvent event, Context context) {
        try {
            String qrCode = URLDecoder.decode(event.getPathParameters().get("qrCode"), StandardCharsets.UTF_8);
            Session session = sessionComponent.scanTable(qrCode);

            if (session == null) {
                return ResponseHelper.respond(404, Map.of("error", "Table not found"), event);
            }
            return ResponseHelper.respond(200, session, event);
        } catch (Exception e) {
            return ErrorHandler.handle(e, event);
        }
    }
}
