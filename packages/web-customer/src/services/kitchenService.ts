import { OrderItem } from "../types";

const API_BASE = "https://7fqrf6dfl6.execute-api.ap-south-2.amazonaws.com/prod";
const WS_URL = "wss://4dido96orb.execute-api.ap-south-2.amazonaws.com/prod";

export const scanTable = async (qrCode: string) => {
  const res = await fetch(`${API_BASE}/api/tables/${encodeURIComponent(qrCode)}/scan`, { method: "POST" });
  return res.json();
};

export const pingKitchen = async (sessionId: string) => {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/ping`, { method: "POST" });
  return res.json();
};

export const confirmFood = async (sessionId: string, auto = false) => {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/confirm`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ auto })
  });
  return res.json();
};

export const rejectServing = async (sessionId: string) => {
  const res = await fetch(`${API_BASE}/api/sessions/${sessionId}/reject`, { method: "POST" });
  return res.json();
};

export type WSMessage = {
  event: "PING" | "SERVING" | "CONFIRMED" | "REJECTED" | "SESSION_CLOSED";
  tableNumber: number;
  sessionId: string;
  message?: string;
  pingCount?: number;
  lastPingAt?: string;
};

export const connectCustomerWebSocket = (sessionId: string, onMessage: (msg: WSMessage) => void): WebSocket => {
  const ws = new WebSocket(`${WS_URL}?sessionId=${sessionId}`);
  
  ws.onopen = () => console.log("Customer WebSocket connected for session:", sessionId);
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      console.log("WS message received:", data);
      onMessage(data);
    } catch {}
  };
  ws.onerror = (e) => console.error("WebSocket error:", e);
  ws.onclose = () => setTimeout(() => connectCustomerWebSocket(sessionId, onMessage), 3000);
  
  return ws;
};

export const generateBillSummary = async (items: OrderItem[], total: number): Promise<string> => {
  return `Thanks for your order of ${items.length} delicious items! Enjoy your meal! 🍽️`;
};
