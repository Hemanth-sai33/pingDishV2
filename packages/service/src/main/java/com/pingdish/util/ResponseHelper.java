package com.pingdish.util;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import com.google.gson.Gson;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

/**
 * [FIX 4.2, 6.1, 6.5] Shared response helper with CORS validation,
 * CSRF protection via custom header, and security headers.
 */
public final class ResponseHelper {
    private static final Gson GSON = new Gson();
    private static final Set<String> ALLOWED_ORIGINS = Set.of(
            "https://www.pingdish.com",
            "https://kitchen.pingdish.com",
            "https://app.pingdish.com",
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:5173"
    );

    private ResponseHelper() {}

    public static APIGatewayProxyResponseEvent respond(int statusCode, Object body, APIGatewayProxyRequestEvent event) {
        Map<String, String> headers = new HashMap<>();
        headers.put("Content-Type", "application/json");
        headers.put("X-Content-Type-Options", "nosniff");
        headers.put("X-Frame-Options", "DENY");
        headers.put("Referrer-Policy", "strict-origin-when-cross-origin");

        // Dynamic CORS origin validation
        String origin = getHeader(event, "Origin");
        if (origin != null && ALLOWED_ORIGINS.contains(origin)) {
            headers.put("Access-Control-Allow-Origin", origin);
            headers.put("Access-Control-Allow-Credentials", "true");
        }

        return new APIGatewayProxyResponseEvent()
                .withStatusCode(statusCode)
                .withHeaders(headers)
                .withBody(GSON.toJson(body));
    }

    /** [FIX 6.1] Validates the X-Requested-With custom header for CSRF protection. */
    public static boolean isValidCsrfHeader(APIGatewayProxyRequestEvent event) {
        return "PingDish".equals(getHeader(event, "X-Requested-With"));
    }

    private static String getHeader(APIGatewayProxyRequestEvent event, String name) {
        if (event == null || event.getHeaders() == null) return null;
        // API Gateway lowercases headers
        String val = event.getHeaders().get(name);
        if (val == null) val = event.getHeaders().get(name.toLowerCase());
        return val;
    }
}
