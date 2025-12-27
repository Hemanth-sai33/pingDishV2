package com.pingdish.activity;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import com.google.inject.Inject;
import com.pingdish.component.SessionComponent;
import com.pingdish.config.ServiceInjector;
import com.pingdish.model.Session;
import java.net.URLDecoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

public class ScanTableActivity implements RequestHandler<APIGatewayProxyRequestEvent, APIGatewayProxyResponseEvent> {
    private static final Gson GSON = new Gson();
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
        String qrCode = URLDecoder.decode(event.getPathParameters().get("qrCode"), StandardCharsets.UTF_8);
        Session session = sessionComponent.scanTable(qrCode);

        if (session == null) {
            return response(404, Map.of("error", "Table not found"));
        }
        return response(200, session);
    }

    private APIGatewayProxyResponseEvent response(int statusCode, Object body) {
        return new APIGatewayProxyResponseEvent()
                .withStatusCode(statusCode)
                .withHeaders(Map.of("Access-Control-Allow-Origin", "*"))
                .withBody(GSON.toJson(body));
    }
}
