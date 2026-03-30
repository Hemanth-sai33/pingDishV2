import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TableCard } from './components/TableCard';
import { TableData } from './types';
import { connectWebSocket, markServing, WSMessage, getTables } from './services/apiService';

const getRestaurantId = (): string | null => {
  const path = window.location.pathname.replace(/^\/|\/$/g, '');
  return path || null;
};

const formatName = (id: string) => id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// ═══ Audio Alert System ═══
class AlertSoundManager {
  private audioCtx: AudioContext | null = null;

  private getCtx(): AudioContext {
    if (!this.audioCtx) this.audioCtx = new AudioContext();
    return this.audioCtx;
  }

  playPing(urgency: 'low' | 'medium' | 'high') {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (urgency === 'high') {
        // Urgent: rapid double beep
        osc.frequency.value = 880;
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.15);

        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.frequency.value = 1046;
        gain2.gain.setValueAtTime(0.3, ctx.currentTime + 0.2);
        gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
        osc2.start(ctx.currentTime + 0.2);
        osc2.stop(ctx.currentTime + 0.4);
      } else if (urgency === 'medium') {
        // Warning: medium tone
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.25);
      } else {
        // Normal: gentle ding
        osc.frequency.value = 523;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.15, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.3);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch (e) {
      // Audio not available
    }
  }
}

const soundManager = new AlertSoundManager();

// ═══ Stats Calculator ═══
function useStats(tables: TableData[]) {
  const activePings = tables.filter(t => t.pingStatus === 'PINGED').length;
  const serving = tables.filter(t => t.pingStatus === 'SERVING').length;
  const idle = tables.filter(t => t.pingStatus === 'IDLE').length;
  const totalPings = tables.reduce((sum, t) => sum + t.pings, 0);
  const longestWait = tables.reduce((max, t) => {
    if (t.firstPingTimestamp && t.pingStatus === 'PINGED') {
      const wait = Date.now() - t.firstPingTimestamp;
      return Math.max(max, wait);
    }
    return max;
  }, 0);

  return { activePings, serving, idle, totalPings, longestWait };
}

const App: React.FC = () => {
  const [restaurantId] = useState<string | null>(getRestaurantId);
  const [tables, setTables] = useState<TableData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortedTables, setSortedTables] = useState<TableData[]>([]);
  const [alert, setAlert] = useState<{ tableNumber: number; message: string } | null>(null);
  const [bellShake, setBellShake] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const prevTablesRef = useRef<TableData[]>([]);
  const stats = useStats(tables);

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

      if (msg.event === 'PING') {
        // Trigger bell animation
        setBellShake(true);
        setTimeout(() => setBellShake(false), 700);

        // Play escalating audio
        const table = prevTablesRef.current.find(t => t.tableNumber === msg.tableNumber);
        const newCount = msg.pingCount || (table ? table.pings + 1 : 1);
        if (soundEnabled) {
          if (newCount >= 3) soundManager.playPing('high');
          else if (newCount === 2) soundManager.playPing('medium');
          else soundManager.playPing('low');
        }
      }

      setTables(prev => {
        const updated = prev.map(t => {
          if (t.tableNumber !== msg.tableNumber) return t;

          switch (msg.event) {
            case 'PING':
              return {
                ...t,
                pings: msg.pingCount || t.pings + 1,
                pingStatus: 'PINGED' as const,
                sessionId: msg.sessionId || t.sessionId,
                firstPingTimestamp: t.firstPingTimestamp || Date.now()
              };
            case 'SERVING':
              return { ...t, pingStatus: 'SERVING' as const };
            case 'CONFIRMED':
              return { ...t, pings: 0, pingStatus: 'IDLE' as const, firstPingTimestamp: null };
            case 'REJECTED':
              return { ...t, pingStatus: 'PINGED' as const };
            case 'SESSION_CLOSED':
              return { ...t, pings: 0, pingStatus: 'IDLE' as const, sessionId: null, firstPingTimestamp: null };
            default:
              return t;
          }
        });
        prevTablesRef.current = updated;
        return updated;
      });
    }, restaurantId);
  }, [restaurantId, soundEnabled]);

  const sortTables = useCallback((currentTables: TableData[]) => {
    return [...currentTables].sort((a, b) => {
      if (b.pings !== a.pings) return b.pings - a.pings;
      if (a.pings > 0) return (a.firstPingTimestamp || 0) - (b.firstPingTimestamp || 0);
      return a.tableNumber - b.tableNumber;
    });
  }, []);

  useEffect(() => {
    setSortedTables(sortTables(tables));
    prevTablesRef.current = tables;
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

  // ═══ Error: No Restaurant ID ═══
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

  const formatWaitTime = (ms: number) => {
    const secs = Math.floor(ms / 1000);
    const mins = Math.floor(secs / 60);
    if (mins > 0) return `${mins}m`;
    return `${secs}s`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8">
      {/* ═══ Alert Banner ═══ */}
      {alert && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 bg-red-600 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <span className="text-2xl">⚠️</span>
          <div>
            <div className="font-bold">Table {alert.tableNumber}</div>
            <div className="text-sm">{alert.message}</div>
          </div>
        </div>
      )}

      {/* ═══ Header ═══ */}
      <header className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-4">
          <div className={`relative w-16 h-16 flex items-center justify-center ${bellShake ? 'bell-shake' : ''}`}>
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

        <div className="flex items-center gap-4">
          {/* Sound toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
              soundEnabled
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-slate-800 text-slate-500 border border-slate-700'
            }`}
            title={soundEnabled ? 'Sound On' : 'Sound Off'}
          >
            {soundEnabled ? '🔔 Sound On' : '🔕 Sound Off'}
          </button>

          <div className="flex items-center gap-3 text-[10px] uppercase font-bold tracking-wider text-slate-400">
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-slate-700 rounded-full"></div> Idle</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-green-600 rounded-full"></div> 1 Ping</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-amber-500 rounded-full"></div> 2 Pings</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div> 3+</div>
            <div className="flex items-center gap-1"><div className="w-2 h-2 bg-yellow-500 rounded-full"></div> Serving</div>
          </div>
        </div>
      </header>

      {/* ═══ Live Stats Bar ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-white tabular-nums count-up">{tables.length}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Tables</div>
        </div>
        <div className={`rounded-xl p-3 text-center transition-all ${stats.activePings > 0 ? 'bg-orange-500/10 border border-orange-500/20' : 'bg-slate-900 border border-slate-800'}`}>
          <div className={`text-2xl font-black tabular-nums count-up ${stats.activePings > 0 ? 'text-orange-400' : 'text-white'}`}>{stats.activePings}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Active Pings</div>
        </div>
        <div className={`rounded-xl p-3 text-center transition-all ${stats.serving > 0 ? 'bg-yellow-500/10 border border-yellow-500/20' : 'bg-slate-900 border border-slate-800'}`}>
          <div className={`text-2xl font-black tabular-nums count-up ${stats.serving > 0 ? 'text-yellow-400' : 'text-white'}`}>{stats.serving}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Serving</div>
        </div>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-black text-green-400 tabular-nums count-up">{stats.idle}</div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Idle</div>
        </div>
        <div className={`rounded-xl p-3 text-center transition-all ${stats.longestWait > 120000 ? 'bg-red-500/10 border border-red-500/20' : stats.longestWait > 60000 ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-slate-900 border border-slate-800'}`}>
          <div className={`text-2xl font-black tabular-nums count-up ${stats.longestWait > 120000 ? 'text-red-400 timer-urgent' : stats.longestWait > 60000 ? 'text-amber-400' : 'text-white'}`}>
            {stats.longestWait > 0 ? formatWaitTime(stats.longestWait) : '—'}
          </div>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Longest Wait</div>
        </div>
      </div>

      {/* ═══ Table Grid ═══ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {sortedTables.map((table, i) => (
          <div key={table.id} className="card-enter" style={{animationDelay: `${i * 0.03}s`}}>
            <TableCard data={table} onPing={handlePing} onServing={handleServing} />
          </div>
        ))}
      </div>

      {/* ═══ Keyboard Shortcuts Hint ═══ */}
      <div className="fixed bottom-4 right-4 hidden lg:block">
        <div className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-[10px] text-slate-600">
          Press <kbd className="bg-slate-800 px-1 rounded text-slate-400">S</kbd> to toggle sound
        </div>
      </div>
    </div>
  );
};

export default App;
