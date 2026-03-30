package com.pingdish.util;

import software.amazon.awssdk.services.dynamodb.model.AttributeValue;

import java.time.Duration;
import java.time.Instant;
import java.util.Map;
import java.util.logging.Logger;

/**
 * Simple rate limiter that checks timestamps in DynamoDB items
 * to enforce cooldown periods on sensitive operations.
 */
public final class RateLimiter {
    private static final Logger LOG = Logger.getLogger(RateLimiter.class.getName());

    private RateLimiter() {}

    /**
     * Checks if a rate-limited operation should be allowed based on the last action timestamp.
     *
     * @param item           The DynamoDB item containing the timestamp field
     * @param timestampField The attribute name holding the ISO-8601 timestamp of the last action
     * @param cooldown       Minimum duration between actions
     * @return remaining seconds in cooldown, or 0 if allowed
     */
    public static long checkCooldown(Map<String, AttributeValue> item, String timestampField, Duration cooldown) {
        if (item == null || !item.containsKey(timestampField)) {
            return 0; // No previous action — allow
        }

        try {
            String lastActionStr = item.get(timestampField).s();
            if (lastActionStr == null || lastActionStr.isBlank()) {
                return 0;
            }

            Instant lastAction = Instant.parse(lastActionStr);
            Instant now = Instant.now();
            Duration elapsed = Duration.between(lastAction, now);

            if (elapsed.compareTo(cooldown) < 0) {
                long remaining = cooldown.minus(elapsed).getSeconds();
                LOG.info("[RATE_LIMIT] Cooldown active. Remaining: " + remaining + "s for field: " + timestampField);
                return remaining;
            }

            return 0;
        } catch (Exception e) {
            LOG.warning("[RATE_LIMIT] Failed to parse timestamp: " + e.getMessage());
            return 0; // On parse failure, allow the action
        }
    }
}
