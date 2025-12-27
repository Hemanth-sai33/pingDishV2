package com.pingdish.model;

public record TableInfo(String restaurantId, String tableId, int tableNumber) {
    
    /** Composite key for DynamoDB: restaurantId#tableId */
    public String qrCode() {
        return restaurantId + "#" + tableId;
    }
    
    public static Builder builder() { return new Builder(); }
    
    public static class Builder {
        private String restaurantId;
        private String tableId;
        private int tableNumber;
        
        public Builder restaurantId(String v) { this.restaurantId = v; return this; }
        public Builder tableId(String v) { this.tableId = v; return this; }
        public Builder tableNumber(int v) { this.tableNumber = v; return this; }
        
        public TableInfo build() { return new TableInfo(restaurantId, tableId, tableNumber); }
    }
}
