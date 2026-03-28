import React, { useState, useEffect } from 'react';
import { ViewState, OrderItem, PingLog, Session } from './types';
import { Navbar } from './components/Navbar';
import { ClockTimer } from './components/ClockTimer';
import { Logo } from './components/Logo';
import { scanTable, pingKitchen, confirmFood, rejectServing, connectCustomerWebSocket, generateBillSummary } from './services/kitchenService';
import { Bell, Clock, ChefHat, History, Utensils } from 'lucide-react';

const COOLDOWN_SECONDS = 15;

const ORDER_ITEMS: OrderItem[] = [
  { id: '1', name: 'Paneer Butter Masala', quantity: 1, price: 260 },
  { id: '2', name: 'Garlic Naan', quantity: 2, price: 60 },
  { id: '3', name: 'Fresh Lime Soda', quantity: 1, price: 80 },
];

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentView, setCurrentView] = useState<ViewState>(ViewState.STATUS);
  const [pings, setPings] = useState<PingLog[]>([]);
  const [isPinging, setIsPinging] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [showServingNotification, setShowServingNotification] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [billMessage, setBillMessage] = useState("");

  const totalBill = ORDER_ITEMS.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = totalBill * 0.05;
  const finalTotal = totalBill + tax;

  const getQrCode = () => {
    // Try URL path first: /restaurantId/tableNumber
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      return `${pathParts[0]}#${pathParts[1]}`;
    }
    // Fall back to query params
    const params = new URLSearchParams(window.location.search);
    const restaurant = params.get('restaurant') || 'demo-restaurant';
    const table = params.get('table') || 'table-1';
    return `${restaurant}#${table}`;
  };

  // Initialize session and WebSocket
  useEffect(() => {
    const init = async () => {
      const qrCode = getQrCode();

      // If this tab already saw a closed session, don't create a new one
      if (sessionStorage.getItem(`pingdish_closed_${qrCode}`)) {
        setSession({ sessionId: '', tableId: '', tableNumber: 0, status: 'CLOSED', pingStatus: 'IDLE', pingCount: 0, createdAt: 0 } as Session);
        setLoading(false);
        return;
      }

      try {
        const sess = await scanTable(qrCode);
        setSession(sess);
        setLoading(false);
        
        // Initialize pings array from existing pingCount
        if (sess.pingCount > 0) {
          setPings(Array.from({ length: sess.pingCount }, (_, i) => ({
            id: `existing-${i}`,
            timestamp: new Date(sess.lastPingAt || sess.createdAt),
            response: "Kitchen was notified"
          })));
          // Initialize cooldown if recent ping
          if (sess.lastPingAt) {
            const elapsed = Math.floor((Date.now() - new Date(sess.lastPingAt).getTime()) / 1000);
            const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
            setCooldownRemaining(remaining);
          }
        }
        
        // Show serving notification if already in SERVING state
        if (sess.pingStatus === 'SERVING') setShowServingNotification(true);
        
        // Connect WebSocket for real-time updates
        connectCustomerWebSocket(sess.sessionId, (msg) => {
          if (msg.event === 'PING') {
            const count = msg.pingCount || 1;
            setPings(Array.from({ length: count }, (_, i) => ({
              id: `ping-${i}`,
              timestamp: new Date(),
              response: "Kitchen has been notified!"
            })));
            setSession(prev => prev ? { ...prev, pingCount: count, pingStatus: 'PINGED' } : null);
            // Sync cooldown across all browsers
            if (msg.lastPingAt) {
              const elapsed = Math.floor((Date.now() - new Date(msg.lastPingAt).getTime()) / 1000);
              const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
              setCooldownRemaining(remaining);
            }
          } else if (msg.event === 'SERVING') {
            setShowServingNotification(true);
            setSession(prev => prev ? { ...prev, pingStatus: 'SERVING' } : null);
          } else if (msg.event === 'CONFIRMED' || msg.event === 'SESSION_CLOSED') {
            setShowServingNotification(false);
            setShowConfirmDialog(false);
            setPings([]);
            sessionStorage.setItem(`pingdish_closed_${getQrCode()}`, '1');
            setSession(prev => prev ? { ...prev, status: 'CLOSED' } : null);
          }
        });
      } catch (e) {
        console.error('Failed to scan table:', e);
        setLoading(false);
      }
    };
    init();
    generateBillSummary(ORDER_ITEMS, finalTotal).then(setBillMessage);
  }, []);

  // Cooldown timer
  useEffect(() => {
    if (cooldownRemaining > 0) {
      const timer = setTimeout(() => setCooldownRemaining(c => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownRemaining]);

  const handlePing = async () => {
    if (!session || isPinging || cooldownRemaining > 0) return;
    
    setIsPinging(true);
    const result = await pingKitchen(session.sessionId);
    
    if (result.error === 'Cooldown') {
      setCooldownRemaining(result.remainingSeconds || COOLDOWN_SECONDS);
    } else if (result.success) {
      // State update handled by WebSocket PING event
      setCooldownRemaining(COOLDOWN_SECONDS);
    }
    setIsPinging(false);
  };

  const handleConfirmClick = () => {
    setShowConfirmDialog(true);
  };

  const handleConfirmYes = async () => {
    if (!session) return;
    setShowConfirmDialog(false);
    try {
      await confirmFood(session.sessionId);
      setShowServingNotification(false);
      setPings([]);
      sessionStorage.setItem(`pingdish_closed_${getQrCode()}`, '1');
      setSession({ ...session, status: 'CLOSED' });
    } catch (e) {
      console.error("Confirm failed:", e);
    }
  };

  const handleConfirmNo = () => {
    setShowConfirmDialog(false);
  };

  const handleStillWaiting = async () => {
    if (!session) return;
    setShowServingNotification(false);
    try {
      await rejectServing(session.sessionId);
      setSession({ ...session, pingStatus: 'PINGED' });
    } catch (e) {
      console.error("Reject failed:", e);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800 mb-2">Invalid QR Code</h1>
          <p className="text-gray-500">Please scan a valid table QR code</p>
        </div>
      </div>
    );
  }

  if (session.status === 'CLOSED') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Utensils size={32} className="text-green-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Thank you for using PingDish!</h1>
          <p className="text-gray-500 mb-6">Your order has been served to your table. We'd love to hear your feedback!</p>
        </div>
      </div>
    );
  }

  const canPing = cooldownRemaining === 0;

  const renderProgressSection = () => (
    <div className="flex flex-col items-center w-full px-6">
      <div className="mb-8 flex justify-center">
        {cooldownRemaining > 0 ? (
          <ClockTimer 
            percentage={(1 - cooldownRemaining / COOLDOWN_SECONDS) * 100} 
            label={`${cooldownRemaining}s`} 
            subLabel="Cooldown"
            color="#FCD34D"
          />
        ) : (
          <div className="w-48 h-48 rounded-full bg-orange-100 flex items-center justify-center shadow-inner animate-fade-in">
            <Bell size={64} className="text-primary animate-pulse" />
          </div>
        )}
      </div>
      
      <button
        onClick={handlePing}
        disabled={!canPing || isPinging}
        className={`w-full max-w-xs font-bold py-4 px-8 rounded-full shadow-lg transform transition flex items-center justify-center space-x-2
          ${(!canPing || isPinging) 
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' 
            : 'bg-primary hover:bg-primaryHover text-white active:scale-95'
          }`}
      >
        {isPinging ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
            <span>Pinging...</span>
          </>
        ) : (
          <span>Ping Kitchen</span>
        )}
      </button>

      <p className="mt-6 text-gray-500 text-center text-sm px-4">
        {cooldownRemaining > 0 
          ? "Please wait before sending another ping."
          : "Tap to send a gentle reminder to the kitchen."}
      </p>

      {pings.length > 0 && (
        <div className="mt-4 bg-orange-100 px-4 py-2 rounded-full">
          <span className="text-orange-600 font-medium">Pings sent: {pings.length}</span>
        </div>
      )}
    </div>
  );

  const renderHistory = () => {
    if (pings.length === 0) return null;
    return (
      <div className="mt-8 w-full px-6 pb-20">
        <div className="flex items-center space-x-2 mb-3">
          <History size={16} className="text-gray-400" />
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ping History</h3>
        </div>
        <div className="space-y-3">
          {pings.map((ping, index) => (
            <div key={ping.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-sm">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>{ping.timestamp.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                <span className="font-semibold text-primary">Ping #{index + 1}</span>
              </div>
              <p className="text-gray-700 italic">" {ping.response} "</p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderStatusView = () => (
    <div className="flex flex-col items-center pt-8 overflow-y-auto h-full">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-secondary">Your Order Status</h1>
        <div className="flex items-center justify-center space-x-2 mt-2 text-gray-500">
          <span className="bg-gray-200 px-2 py-1 rounded text-xs font-medium">Table {session.tableNumber}</span>
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center">
        {renderProgressSection()}
      </div>

      {renderHistory()}
    </div>
  );

  const renderBillView = () => (
    <div className="flex flex-col h-full pt-8 px-6 overflow-y-auto pb-20">
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={() => setCurrentView(ViewState.STATUS)} className="text-gray-400">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-xl font-bold text-secondary">Your Bill</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="text-center border-b border-dashed border-gray-200 pb-4 mb-4">
          <h2 className="text-lg font-bold text-secondary">Table {session.tableNumber}</h2>
        </div>

        <div className="space-y-4 mb-6">
          {ORDER_ITEMS.map(item => (
            <div key={item.id} className="flex justify-between text-sm text-gray-700">
              <span>{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
              <span className="font-medium">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span>₹{totalBill}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>GST (5%)</span><span>₹{tax}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-secondary mt-2 pt-2 border-t border-gray-100">
            <span>Total</span><span>₹{finalTotal}</span>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 p-4 rounded-xl text-center mb-6">
        <p className="text-primary text-sm font-medium italic">{billMessage}</p>
      </div>

      <button className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-4 rounded-xl shadow-md transition">
        Request Bill
      </button>
    </div>
  );

  const renderFeedbackView = () => (
    <div className="flex flex-col h-full pt-12 px-6 items-center text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600">
        <ChefHat size={32} />
      </div>
      <h1 className="text-2xl font-bold text-secondary mb-4">Enjoyed your meal?</h1>
      <p className="text-gray-500 mb-8">How was your experience today?</p>
      
      <div className="flex justify-between w-full max-w-xs mb-10">
        {['😠', '🙁', '😐', '🙂', '😃'].map((emoji, idx) => (
          <button key={idx} className="text-4xl hover:scale-125 transition transform">{emoji}</button>
        ))}
      </div>

      <button className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-4 rounded-xl shadow-md transition">
        Submit Feedback
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-md h-[100dvh] bg-cream overflow-hidden flex flex-col relative">

        <header className="pt-8 pb-4 px-6 bg-cream shrink-0 z-10">
          <div className="flex items-center justify-center pt-2">
            <Logo />
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          {currentView === ViewState.STATUS && renderStatusView()}
          {currentView === ViewState.BILL && renderBillView()}
          {currentView === ViewState.FEEDBACK && renderFeedbackView()}
        </main>

        <Navbar currentView={currentView} onNavigate={setCurrentView} />

        {/* Food Serving Notification */}
        {showServingNotification && !showConfirmDialog && (
          <div className="absolute inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative bg-white w-full rounded-t-3xl p-8 z-10">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-1 bg-gray-300 rounded-full mb-6"></div>
                <div className="bg-yellow-100 p-4 rounded-full mb-4">
                  <Utensils size={32} className="text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">Food on the way!</h3>
                <p className="text-gray-600 mb-6">The kitchen is serving your order now.</p>
                
                <button onClick={handleConfirmClick} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg mb-3 active:bg-green-700">
                  ✓ Food Received
                </button>
                <button onClick={handleStillWaiting} className="w-full bg-gray-200 text-gray-700 font-bold py-4 rounded-xl active:bg-gray-300">
                  Still Waiting...
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Dialog */}
        {showConfirmDialog && (
          <div className="absolute inset-0 z-50 flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-black/50"></div>
            <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 z-10">
              <h3 className="text-lg font-bold text-secondary mb-3 text-center">Confirm Receipt</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you have received your food? This will notify the kitchen that your order is complete.
              </p>
              <div className="flex gap-3">
                <button onClick={handleConfirmNo} className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl active:bg-gray-300">
                  No, Wait
                </button>
                <button onClick={handleConfirmYes} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl active:bg-green-700">
                  Yes, Received
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
