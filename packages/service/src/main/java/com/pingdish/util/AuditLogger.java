package com.pingdish.util;

import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.logging.Level;
import java.util.logging.Logger;

/**
 * Audit trail logger for admin actions.
 *
 * Logs every admin action to the PingDish-AuditLog DynamoDB table with:
 *   - Who performed the action (admin identifier from request context)
 *   - What action was performed
 *   - What entity was affected
 *   - When it happened
 *   - Source IP address
 *   - TTL for auto-expiry after 90 days
 *
 * Falls back to CloudWatch logging if DynamoDB write fails.
 */
public final class AuditLogger {
    private static final Logger LOG = Logger.getLogger(AuditLogger.class.getName());
    private static final String AUDIT_TABLE = "PingDish-AuditLog";
    private static final long TTL_DAYS = 90;

    private AuditLogger() {}

    /**
     * Log an admin action to the audit trail.
     *
     * @param ddb       DynamoDB client
     * @param action    The action performed (e.g., "APPROVE_ENQUIRY", "DECLINE_ENQUIRY", "RESET_PASSWORD")
     * @param entityType The type of entity (e.g., "ENQUIRY", "RESTAURANT")
     * @param entityId  The ID of the entity acted upon
     * @param details   Free-text description of the action
     * @param event     The API Gateway event (for extracting source IP)
     */
    public static void log(
            DynamoDbClient ddb,
            String action,
            String entityType,
            String entityId,
            String details,
            com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent event
    ) {
        try {
            Instant now = Instant.now();
            long ttl = now.getEpochSecond() + (TTL_DAYS * 24 * 60 * 60);

            Map<String, AttributeValue> item = new HashMap<>();
            item.put("AuditId", AttributeValue.builder().s(UUID.randomUUID().toString()).build());
            item.put("Action", AttributeValue.builder().s(action).build());
            item.put("EntityType", AttributeValue.builder().s(entityType).build());
            item.put("EntityId", AttributeValue.builder().s(entityId).build());
            item.put("Details", AttributeValue.builder().s(details).build());
            item.put("Timestamp", AttributeValue.builder().s(now.toString()).build());
            item.put("ExpiresAt", AttributeValue.builder().n(String.valueOf(ttl)).build());

            // Extract source IP from API Gateway request context
            if (event != null && event.getRequestContext() != null && event.getRequestContext().getIdentity() != null) {
                String sourceIp = event.getRequestContext().getIdentity().getSourceIp();
                if (sourceIp != null) {
                    item.put("SourceIp", AttributeValue.builder().s(sourceIp).build());
                }
            }

            ddb.putItem(PutItemRequest.builder()
                    .tableName(AUDIT_TABLE)
                    .item(item)
                    .build());

            LOG.info("[AUDIT] " + action + " | " + entityType + ":" + entityId + " | " + details);
        } catch (Exception e) {
            // Never let audit logging failures break the main operation.
            // Fall back to CloudWatch logging.
            LOG.log(Level.WARNING, "[AUDIT FALLBACK] " + action + " | " + entityType + ":" + entityId + " | " + details +
                    " | DynamoDB write failed: " + e.getMessage(), e);
        }
    }
}
