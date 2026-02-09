// [FIX 5.1] Use environment variables instead of hardcoded URLs
const WS_URL = import.meta.env.VITE_WS_URL;
const API_URL = import.meta.env.VITE_API_URL;

if (!WS_URL || !API_URL) {
  throw new Error('Missing required environment variables: VITE_API_URL, VITE_WS_URL');
}

export interface WSMessage {
  event: string;
  tableNumber: number;
  sessionId?: string;
  pingCount?: number;
  message?: string;
}

let ws: WebSocket | null = null;

export const connectWebSocket = (onMessage: (msg: WSMessage) => void, restaurantId: string) => {
  if (ws) return;
  
  const url = `${WS_URL}?type=KITCHEN&restaurantId=${restaurantId}`;
  ws = new WebSocket(url);
  
  ws.onopen = () => console.log('Kitchen WebSocket connected for restaurant:', restaurantId);
  ws.onmessage = (e) => {
    try { onMessage(JSON.parse(e.data)); } catch {}
  };
  ws.onerror = (e) => console.error('Kitchen WebSocket error:', e);
  ws.onclose = () => {
    ws = null;
    setTimeout(() => connectWebSocket(onMessage, restaurantId), 3000);
  };
};

// [FIX 6.1] Add CSRF custom header to all API requests
const apiFetch = (url: string, options: RequestInit = {}) =>
  fetch(url, {
    ...options,
    headers: { ...options.headers as Record<string, string>, 'Content-Type': 'application/json', 'X-Requested-With': 'PingDish' },
  });

export const markServing = async (sessionId: string) => {
  await apiFetch(`${API_URL}/sessions/${sessionId}/serving`, { method: 'POST' });
};

export const getTables = async (restaurantId: string): Promise<number[]> => {
  const res = await apiFetch(`${API_URL}/restaurants/${restaurantId}/tables`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.tables || [];
};
