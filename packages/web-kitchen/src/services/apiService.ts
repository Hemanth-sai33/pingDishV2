const WS_URL = 'wss://4dido96orb.execute-api.ap-south-2.amazonaws.com/prod';
const API_URL = 'https://7fqrf6dfl6.execute-api.ap-south-2.amazonaws.com/prod/api';

// Default restaurant for demo - in production, this would come from auth/config
const RESTAURANT_ID = 'demo-restaurant';

export interface WSMessage {
  event: string;
  tableNumber: number;
  sessionId?: string;
  pingCount?: number;
  message?: string;
}

let ws: WebSocket | null = null;

export const connectWebSocket = (onMessage: (msg: WSMessage) => void, restaurantId = RESTAURANT_ID) => {
  if (ws) return;
  
  const url = `${WS_URL}?type=KITCHEN&restaurantId=${restaurantId}`;
  console.log('Connecting kitchen WebSocket to:', url);
  ws = new WebSocket(url);
  
  ws.onopen = () => console.log('Kitchen WebSocket connected for restaurant:', restaurantId);
  ws.onmessage = (e) => {
    console.log('Kitchen WS raw message:', e.data);
    try {
      const data = JSON.parse(e.data);
      console.log('Kitchen WS parsed:', data);
      onMessage(data);
    } catch (err) {
      console.error('Failed to parse WS message:', err);
    }
  };
  ws.onerror = (e) => console.error('Kitchen WebSocket error:', e);
  ws.onclose = (e) => {
    console.log('Kitchen WebSocket closed:', e.code, e.reason);
    ws = null;
    setTimeout(() => connectWebSocket(onMessage, restaurantId), 3000);
  };
};

export const markServing = async (sessionId: string) => {
  await fetch(`${API_URL}/sessions/${sessionId}/serving`, { method: 'POST' });
};

export const getTables = async (restaurantId: string): Promise<number[]> => {
  const res = await fetch(`${API_URL}/restaurants/${restaurantId}/tables`);
  if (!res.ok) return [];
  const data = await res.json();
  return data.tables || [];
};
