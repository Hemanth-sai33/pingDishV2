export interface OrderItem {
  id: string;
  name: string;
  qty: number;
}

export interface TableData {
  id: string;
  tableNumber: number;
  pings: number;
  pingStatus: 'IDLE' | 'PINGED' | 'SERVING';
  sessionId: string | null;
  firstPingTimestamp: number | null;
  orderTimestamp: number;
  items: OrderItem[];
}
