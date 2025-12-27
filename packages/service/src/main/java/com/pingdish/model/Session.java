package com.pingdish.model;

public record Session(
    String sessionId,
    String restaurantId,
    String tableId,
    int tableNumber,
    SessionStatus status,
    PingStatus pingStatus,
    int pingCount,
    String createdAt,
    String lastPingAt,
    String servingStartedAt
) {
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private String sessionId;
        private String restaurantId;
        private String tableId;
        private int tableNumber;
        private SessionStatus status;
        private PingStatus pingStatus;
        private int pingCount;
        private String createdAt;
        private String lastPingAt;
        private String servingStartedAt;
        
        public Builder sessionId(String v) { this.sessionId = v; return this; }
        public Builder restaurantId(String v) { this.restaurantId = v; return this; }
        public Builder tableId(String v) { this.tableId = v; return this; }
        public Builder tableNumber(int v) { this.tableNumber = v; return this; }
        public Builder status(SessionStatus v) { this.status = v; return this; }
        public Builder pingStatus(PingStatus v) { this.pingStatus = v; return this; }
        public Builder pingCount(int v) { this.pingCount = v; return this; }
        public Builder createdAt(String v) { this.createdAt = v; return this; }
        public Builder lastPingAt(String v) { this.lastPingAt = v; return this; }
        public Builder servingStartedAt(String v) { this.servingStartedAt = v; return this; }
        
        public Session build() {
            return new Session(sessionId, restaurantId, tableId, tableNumber, status, pingStatus, pingCount, createdAt, lastPingAt, servingStartedAt);
        }
    }
}
