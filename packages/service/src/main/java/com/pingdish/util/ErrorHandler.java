package com.pingdish.util;

import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent;
import com.amazonaws.services.lambda.runtime.events.APIGatewayProxyResponseEvent;
import java.util.Map;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * [FIX 5.4] Centralized error handler — logs full details internally,
 * returns generic messages to clients.
 */
public final class ErrorHandler {
    private static final Logger LOG = Logger.getLogger(ErrorHandler.class.getName());

    private ErrorHandler() {}

    public static APIGatewayProxyResponseEvent handle(Exception e, APIGatewayProxyRequestEvent event) {
        LOG.log(Level.SEVERE, "Internal error", e);

        if (e instanceof IllegalArgumentException) {
            return ResponseHelper.respond(400, Map.of("error", "Invalid request"), event);
        }
        return ResponseHelper.respond(500, Map.of("error", "An internal error occurred"), event);
    }
}
