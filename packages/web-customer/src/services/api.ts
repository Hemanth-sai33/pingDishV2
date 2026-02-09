const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export interface Session {
  sessionId: string;
  tableId: string;
  tableNumber: number;
  status: string;
  pingStatus: string;
  pingCount: number;
}

export interface WSMessage {
  event: 'PING' | 'SERVING' | 'CONFIRMED' | 'REJECTED' | 'SESSION_CLOSED';
  tableNumber: number;
  sessionId: string;
}

// [FIX 6.1] Shared fetch wrapper with CSRF custom header
const apiFetch = (url: string, options: RequestInit = {}) =>
  fetch(url, {
    ...options,
    headers: { ...options.headers as Record<string, string>, 'Content-Type': 'application/json', 'X-Requested-With': 'PingDish' },
  });

export const scanTable = async (qrCode: string): Promise<Session> => {
  const res = await apiFetch(`${API_BASE}/api/tables/${qrCode}/scan`, { method: 'POST' });
  return res.json();
};

export const pingKitchen = async (sessionId: string) => {
  const res = await apiFetch(`${API_BASE}/api/sessions/${sessionId}/ping`, { method: 'POST' });
  return res.json();
};

export const confirmFood = async (sessionId: string, auto = false) => {
  const res = await apiFetch(`${API_BASE}/api/sessions/${sessionId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ auto }),
  });
  return res.json();
};

export const rejectServing = async (sessionId: string) => {
  const res = await apiFetch(`${API_BASE}/api/sessions/${sessionId}/reject`, { method: 'POST' });
  return res.json();
};

export const connectCustomerWebSocket = (sessionId: string, onMessage: (msg: WSMessage) => void): WebSocket => {
  const ws = new WebSocket(`${WS_URL}?sessionId=${sessionId}`);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch {}
  };
  ws.onclose = () => setTimeout(() => connectCustomerWebSocket(sessionId, onMessage), 3000);
  return ws;
};
