const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

export interface WSMessage {
  event: string;
  tableNumber: number;
  sessionId?: string;
  pingCount?: number;
  message?: string;
}

let ws: WebSocket | null = null;

export const connectWebSocket = (onMessage: (msg: WSMessage) => void) => {
  if (ws) return;
  ws = new WebSocket(`${WS_URL}?type=KITCHEN`);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch {}
  };
  ws.onclose = () => {
    ws = null;
    setTimeout(() => connectWebSocket(onMessage), 3000);
  };
};

export const markServing = async (sessionId: string) => {
  await fetch(`${API_URL}/sessions/${sessionId}/serving`, { method: 'POST' });
};
