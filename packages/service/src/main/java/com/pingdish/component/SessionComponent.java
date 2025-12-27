package com.pingdish.component;

import com.pingdish.accessor.WebSocketAccessor;
import com.pingdish.dao.SessionDao;
import com.pingdish.dao.TableDao;
import com.pingdish.model.*;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import java.time.Instant;
import java.util.Map;
import java.util.UUID;

/**
 * Core business logic component for managing customer sessions and kitchen interactions.
 */
public class SessionComponent {
    private static final long COOLDOWN_MS = 15000;

    private final TableDao tableDao;
    private final SessionDao sessionDao;
    private final WebSocketAccessor wsAccessor;

    public SessionComponent(TableDao tableDao, SessionDao sessionDao, WebSocketAccessor wsAccessor) {
        this.tableDao = tableDao;
        this.sessionDao = sessionDao;
        this.wsAccessor = wsAccessor;
    }

    private String nowUtc() {
        return Instant.now().toString();
    }

    /**
     * Scans a table QR code and returns or creates an active session.
     * QR code format: restaurantId#tableId
     */
    public Session scanTable(String qrCode) {
        TableInfo table = tableDao.getTable(qrCode);
        if (table == null) return null;

        Session session = sessionDao.getActiveSession(table.restaurantId(), table.tableId());
        if (session == null) {
            session = Session.builder()
                    .sessionId(UUID.randomUUID().toString())
                    .restaurantId(table.restaurantId())
                    .tableId(table.tableId())
                    .tableNumber(table.tableNumber())
                    .status(SessionStatus.ACTIVE)
                    .pingStatus(PingStatus.IDLE)
                    .pingCount(0)
                    .createdAt(nowUtc())
                    .build();
            sessionDao.createSession(session);
        }
        return session;
    }

    /**
     * Sends a ping from customer to kitchen, subject to cooldown period.
     */
    public PingResult ping(String sessionId) {
        Session session = sessionDao.getSession(sessionId);
        if (session == null || session.status() != SessionStatus.ACTIVE) {
            return PingResult.notFound();
        }

        if (session.lastPingAt() != null) {
            long lastPing = Instant.parse(session.lastPingAt()).toEpochMilli();
            if (System.currentTimeMillis() - lastPing < COOLDOWN_MS) {
                int remaining = (int) Math.ceil((COOLDOWN_MS - (System.currentTimeMillis() - lastPing)) / 1000.0);
                return PingResult.cooldown(remaining);
            }
        }

        int newPingCount = session.pingCount() + 1;
        String pingTime = nowUtc();
        sessionDao.updateSession(sessionId, Map.of(
                "PingStatus", AttributeValue.builder().s(PingStatus.PINGED.name()).build(),
                "PingCount", AttributeValue.builder().n(String.valueOf(newPingCount)).build(),
                "LastPingAt", AttributeValue.builder().s(pingTime).build()
        ));

        wsAccessor.broadcastToAll(session.restaurantId(), sessionId, Map.of(
                "event", WebSocketEvent.PING.name(),
                "tableNumber", session.tableNumber(),
                "tableId", session.tableId(),
                "sessionId", sessionId,
                "pingCount", newPingCount,
                "lastPingAt", pingTime
        ));

        return PingResult.success(newPingCount);
    }

    /**
     * Marks a session as being served by kitchen staff.
     */
    public boolean markServing(String sessionId) {
        Session session = sessionDao.getSession(sessionId);
        if (session == null || session.status() != SessionStatus.ACTIVE) return false;

        sessionDao.updateSession(sessionId, Map.of(
                "PingStatus", AttributeValue.builder().s(PingStatus.SERVING.name()).build(),
                "ServingStartedAt", AttributeValue.builder().s(nowUtc()).build()
        ));

        wsAccessor.broadcastToAll(session.restaurantId(), sessionId, Map.of(
                "event", WebSocketEvent.SERVING.name(),
                "tableNumber", session.tableNumber(),
                "tableId", session.tableId(),
                "sessionId", sessionId
        ));
        return true;
    }

    /**
     * Confirms food delivery, resetting ping status to idle.
     */
    public boolean confirmDelivery(String sessionId, boolean auto) {
        Session session = sessionDao.getSession(sessionId);
        if (session == null || session.status() != SessionStatus.ACTIVE) return false;

        sessionDao.updateSession(sessionId, Map.of(
                "PingStatus", AttributeValue.builder().s(PingStatus.IDLE.name()).build(),
                "PingCount", AttributeValue.builder().n("0").build(),
                "LastConfirmedAt", AttributeValue.builder().s(nowUtc()).build()
        ));

        wsAccessor.broadcastToAll(session.restaurantId(), sessionId, Map.of(
                "event", WebSocketEvent.CONFIRMED.name(),
                "tableNumber", session.tableNumber(),
                "tableId", session.tableId(),
                "sessionId", sessionId,
                "auto", auto
        ));
        return true;
    }

    /**
     * Rejects serving notification when customer hasn't received food yet.
     */
    public boolean rejectDelivery(String sessionId) {
        Session session = sessionDao.getSession(sessionId);
        if (session == null || session.status() != SessionStatus.ACTIVE) return false;

        sessionDao.updateSession(sessionId, Map.of(
                "PingStatus", AttributeValue.builder().s(PingStatus.PINGED.name()).build()
        ));

        wsAccessor.broadcastToAll(session.restaurantId(), sessionId, Map.of(
                "event", WebSocketEvent.REJECTED.name(),
                "tableNumber", session.tableNumber(),
                "tableId", session.tableId(),
                "sessionId", sessionId,
                "message", "Customer hasn't received food yet"
        ));
        return true;
    }

    /**
     * Closes an active session for a table.
     * QR code format: restaurantId#tableId
     */
    public boolean closeSession(String qrCode) {
        TableInfo table = tableDao.getTable(qrCode);
        if (table == null) return false;

        Session session = sessionDao.getActiveSession(table.restaurantId(), table.tableId());
        if (session == null) return false;

        sessionDao.updateSession(session.sessionId(), Map.of(
                "Status", AttributeValue.builder().s(SessionStatus.CLOSED.name()).build(),
                "ClosedAt", AttributeValue.builder().s(nowUtc()).build()
        ));

        wsAccessor.broadcastToKitchen(table.restaurantId(), Map.of(
                "event", WebSocketEvent.SESSION_CLOSED.name(),
                "tableNumber", table.tableNumber(),
                "tableId", table.tableId(),
                "sessionId", session.sessionId()
        ));
        return true;
    }

    public record PingResult(boolean success, int pingCount, String error, Integer remainingSeconds) {
        public static PingResult success(int pingCount) { return new PingResult(true, pingCount, null, null); }
        public static PingResult notFound() { return new PingResult(false, 0, "Session not found", null); }
        public static PingResult cooldown(int remaining) { return new PingResult(false, 0, "Cooldown", remaining); }
    }
}
