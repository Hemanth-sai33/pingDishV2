package com.pingdish.util;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Base64;
import java.util.logging.Logger;

/**
 * Admin authentication helper with HMAC-SHA256 session tokens.
 *
 * Flow:
 *   1. Admin sends x-admin-key header with the ADMIN_SECRET → gets back a session token
 *   2. Subsequent requests use Authorization: Bearer <token> header
 *   3. Tokens expire after 8 hours
 *
 * Token format: base64(payload)|base64(hmac-sha256(payload, secret))
 * Payload format: admin:<issuedAtEpoch>:<expiresAtEpoch>
 *
 * Also validates the raw admin key for backward compatibility.
 */
public final class AdminAuthHelper {
    private static final Logger LOG = Logger.getLogger(AdminAuthHelper.class.getName());
    private static final long TOKEN_TTL_SECONDS = 8 * 60 * 60; // 8 hours
    private static final String HMAC_ALGO = "HmacSHA256";

    private AdminAuthHelper() {}

    /**
     * Validates admin access via either:
     *   - x-admin-key header (raw secret match)
     *   - Authorization: Bearer <token> header (HMAC token validation)
     *
     * @return true if authenticated, false otherwise
     */
    public static boolean isAuthenticated(com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent event) {
        if (event.getHeaders() == null) return false;

        String secret = System.getenv("ADMIN_SECRET");
        if (secret == null || secret.isBlank()) return false;

        // Method 1: Direct admin key (backward compatible)
        String adminKey = getHeader(event, "x-admin-key");
        if (adminKey != null && adminKey.equals(secret)) {
            return true;
        }

        // Method 2: Bearer token
        String authHeader = getHeader(event, "Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7).trim();
            return validateToken(token, secret);
        }

        return false;
    }

    /**
     * Generates a time-limited HMAC session token.
     */
    public static String generateToken() {
        String secret = System.getenv("ADMIN_SECRET");
        if (secret == null) throw new IllegalStateException("ADMIN_SECRET not configured");

        long now = Instant.now().getEpochSecond();
        long expires = now + TOKEN_TTL_SECONDS;
        String payload = "admin:" + now + ":" + expires;

        String signature = hmacSign(payload, secret);
        String encodedPayload = Base64.getUrlEncoder().withoutPadding().encodeToString(payload.getBytes(StandardCharsets.UTF_8));
        return encodedPayload + "|" + signature;
    }

    /**
     * Validates an HMAC token's signature and expiry.
     */
    static boolean validateToken(String token, String secret) {
        try {
            String[] parts = token.split("\\|");
            if (parts.length != 2) return false;

            String encodedPayload = parts[0];
            String providedSignature = parts[1];

            // Verify HMAC signature
            String payload = new String(Base64.getUrlDecoder().decode(encodedPayload), StandardCharsets.UTF_8);
            String expectedSignature = hmacSign(payload, secret);

            if (!constantTimeEquals(providedSignature, expectedSignature)) {
                return false;
            }

            // Check expiry
            String[] payloadParts = payload.split(":");
            if (payloadParts.length != 3) return false;
            long expiresAt = Long.parseLong(payloadParts[2]);

            return Instant.now().getEpochSecond() < expiresAt;
        } catch (Exception e) {
            LOG.warning("Token validation failed: " + e.getMessage());
            return false;
        }
    }

    private static String hmacSign(String data, String secret) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGO));
            byte[] signature = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return Base64.getUrlEncoder().withoutPadding().encodeToString(signature);
        } catch (Exception e) {
            throw new RuntimeException("HMAC signing failed", e);
        }
    }

    /**
     * Constant-time string comparison to prevent timing attacks.
     */
    private static boolean constantTimeEquals(String a, String b) {
        if (a.length() != b.length()) return false;
        int result = 0;
        for (int i = 0; i < a.length(); i++) {
            result |= a.charAt(i) ^ b.charAt(i);
        }
        return result == 0;
    }

    private static String getHeader(com.amazonaws.services.lambda.runtime.events.APIGatewayProxyRequestEvent event, String name) {
        if (event.getHeaders() == null) return null;
        String val = event.getHeaders().get(name);
        if (val == null) val = event.getHeaders().get(name.toLowerCase());
        return val;
    }
}
