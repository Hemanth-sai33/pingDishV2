export interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
}

export interface PingLog {
  id: string;
  timestamp: Date;
  response: string;
}

export enum ViewState {
  STATUS = 'STATUS',
  BILL = 'BILL',
  FEEDBACK = 'FEEDBACK'
}

export interface Session {
  sessionId: string;
  tableId: string;
  tableNumber: number;
  status: string;
  pingStatus: string;
  pingCount: number;
  createdAt: number;
}
