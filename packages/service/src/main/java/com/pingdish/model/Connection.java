package com.pingdish.model;

public record Connection(String connectionId, ConnectionType type, String restaurantId, String sessionId, String connectedAt, long expiresAt) {
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private String connectionId;
        private ConnectionType type;
        private String restaurantId;
        private String sessionId;
        private String connectedAt;
        private long expiresAt;
        
        public Builder connectionId(String v) { this.connectionId = v; return this; }
        public Builder type(ConnectionType v) { this.type = v; return this; }
        public Builder restaurantId(String v) { this.restaurantId = v; return this; }
        public Builder sessionId(String v) { this.sessionId = v; return this; }
        public Builder connectedAt(String v) { this.connectedAt = v; return this; }
        public Builder expiresAt(long v) { this.expiresAt = v; return this; }
        
        public Connection build() { return new Connection(connectionId, type, restaurantId, sessionId, connectedAt, expiresAt); }
    }
}
