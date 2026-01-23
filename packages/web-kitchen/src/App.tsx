import React, { useState, useEffect, useCallback } from 'react';
import { TableCard } from './components/TableCard';
import { TableData } from './types';
import { connectWebSocket, markServing, WSMessage, getTables } from './services/apiService';

const getRestaurantId = (): string | null => {
  const path = window.location.pathname.replace(/^\/|\/$/g, '');
  return path || null;
};

const formatName = (id: string) => id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

const App: React.FC = () => {
  const [restaurantId] = useState<string | null>(getRestaurantId);
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortedTables, setSortedTables] = useState<TableData[]>([]);
  const [alert, setAlert] = useState<{ tableNumber: number; message: string } | null>(null);

  // Fetch tables for this restaurant
  useEffect(() => {
    if (!restaurantId) return;
    getTables(restaurantId).then(tableNumbers => {
      setTables(tableNumbers.map(n => ({
        id: `table-${n}`,
        tableNumber: n,
        pings: 0,
        pingStatus: 'IDLE' as const,
        sessionId: null,
        firstPingTimestamp: null,
        orderTimestamp: Date.now(),
        items: []
      })));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [restaurantId]);

  useEffect(() => {
    if (!restaurantId) return;
    connectWebSocket((msg: WSMessage) => {
      console.log("Kitchen received:", msg.event, "table:", msg.tableNumber);
      
      if (msg.event === 'REJECTED') {
        setAlert({ tableNumber: msg.tableNumber, message: msg.message || "Customer hasn't received food yet!" });
        setTimeout(() => setAlert(null), 5000);
      }
      
      setTables(prev => prev.map(t => {
        if (t.tableNumber !== msg.tableNumber) return t;
        
        switch (msg.event) {
          case 'PING':
            return {
              ...t,
              pings: msg.pingCount || t.pings + 1,
              pingStatus: 'PINGED',
              sessionId: msg.sessionId,
              firstPingTimestamp: t.firstPingTimestamp || Date.now()
            };
          case 'SERVING':
            return { ...t, pingStatus: 'SERVING' };
          case 'CONFIRMED':
            return { ...t, pings: 0, pingStatus: 'IDLE', firstPingTimestamp: null };
          case 'REJECTED':
            return { ...t, pingStatus: 'PINGED' };
          case 'SESSION_CLOSED':
            return { ...t, pings: 0, pingStatus: 'IDLE', sessionId: null, firstPingTimestamp: null };
          default:
            return t;
        }
      }));
    }, restaurantId);
  }, [restaurantId]);

  const sortTables = useCallback((currentTables: TableData[]) => {
    return [...currentTables].sort((a, b) => {
      if (b.pings !== a.pings) return b.pings - a.pings;
      if (a.pings > 0) return (a.firstPingTimestamp || 0) - (b.firstPingTimestamp || 0);
      return a.tableNumber - b.tableNumber;
    });
  }, []);

  useEffect(() => {
    setSortedTables(sortTables(tables));
  }, [tables, sortTables]);

  const handleServing = async (id: string) => {
    const table = tables.find(t => t.id === id);
    if (table?.sessionId) {
      await markServing(table.sessionId);
    }
  };

  const handlePing = (id: string) => {
    setTables(prev => prev.map(t => 
      t.id === id ? { ...t, pings: t.pings + 1, pingStatus: 'PINGED', firstPingTimestamp: t.firstPingTimestamp || Date.now() } : t
    ));
  };

  if (!restaurantId) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md bg-slate-900 border border-red-500 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-red-500 mb-4">Invalid URL</h1>
          <p className="text-slate-300 mb-4">Please access with a restaurant ID in the URL.</p>
          <code className="text-blue-400 text-sm">kitchen.pingdish.com/<span className="text-orange-500">your-restaurant-id</span></code>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {alert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold">Table {alert.tableNumber}</div>
            <div className="text-sm">{alert.message}</div>
          </div>
        </div>
      )}

      <header className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex items-center justify-center">
            <svg width="60" height="60" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M15 75H85" stroke="#3b82f6" strokeWidth="6" strokeLinecap="round"/>
              <path d="M20 75C20 45 30 25 50 25C70 25 80 45 80 75" stroke="#3b82f6" strokeWidth="6"/>
              <circle cx="50" cy="20" r="6" fill="#3b82f6"/>
              <path d="M15 35C10 40 5 50 5 60" stroke="#f97316" strokeWidth="5" strokeLinecap="round"/>
              <path d="M25 45C22 48 20 52 20 58" stroke="#f97316" strokeWidth="4" strokeLinecap="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-4xl font-black tracking-tighter text-white leading-none">PingDish</h1>
            <p className="text-orange-500 font-medium text-sm tracking-wide">Kitchen Dashboard</p>
            <p className="text-blue-400 font-semibold text-base">{formatName(restaurantId)}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-wider text-slate-400">
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-700 rounded-full"></div> Idle</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-600 rounded-full"></div> 1 Ping</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> 2 Pings</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div> 3+</div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Serving</div>
        </div>
      </header>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedTables.map((table) => (
          <TableCard key={table.id} data={table} onPing={handlePing} onServing={handleServing} />
        ))}
      </div>
    </div>
  );
};

export default App;
