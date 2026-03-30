import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ViewState, OrderItem, PingLog, Session } from './types';
import { Navbar } from './components/Navbar';
import { ClockTimer } from './components/ClockTimer';
import { Logo } from './components/Logo';
import { scanTable, pingKitchen, confirmFood, rejectServing, connectCustomerWebSocket, generateBillSummary } from './services/kitchenService';
import { Bell, Clock, ChefHat, History, Utensils, Star, MessageCircle, Sparkles } from 'lucide-react';

const COOLDOWN_SECONDS = 15;

const ORDER_ITEMS: OrderItem[] = [
  { id: '1', name: 'Paneer Butter Masala', quantity: 1, price: 260 },
  { id: '2', name: 'Garlic Naan', quantity: 2, price: 60 },
  { id: '3', name: 'Fresh Lime Soda', quantity: 1, price: 80 },
];

// ═══ Confetti Celebration ═══
const launchConfetti = () => {
  const colors = ['#E86C23', '#FCD34D', '#34D399', '#60A5FA', '#F472B6', '#A78BFA'];
  const container = document.createElement('div');
  container.id = 'confetti-container';
  document.body.appendChild(container);

  for (let i = 0; i < 60; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = `${Math.random() * 100}vw`;
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.width = `${6 + Math.random() * 8}px`;
    piece.style.height = `${6 + Math.random() * 8}px`;
    piece.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
    piece.style.animationDuration = `${2 + Math.random() * 2}s`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    container.appendChild(piece);
  }

  setTimeout(() => container.remove(), 5000);
};

// ═══ Haptic Feedback ═══
const triggerHaptic = (pattern: number | number[] = 50) => {
  if ('vibrate' in navigator) {
    navigator.vibrate(pattern);
  }
};

// ═══ Elapsed Time Hook ═══
function useElapsedTime(startTime: number | null) {
  const [elapsed, setElapsed] = useState('');

  useEffect(() => {
    if (!startTime) { setElapsed(''); return; }

    const update = () => {
      const diff = Math.floor((Date.now() - startTime) / 1000);
      const mins = Math.floor(diff / 60);
      const secs = diff % 60;
      setElapsed(mins > 0 ? `${mins}m ${secs}s` : `${secs}s`);
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  return elapsed;
}

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
  const [showRipple, setShowRipple] = useState(false);
  const [firstPingTime, setFirstPingTime] = useState<number | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState('');
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const waitingTime = useElapsedTime(firstPingTime);

  const totalBill = ORDER_ITEMS.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const tax = totalBill * 0.05;
  const finalTotal = totalBill + tax;

  const getQrCode = () => {
    const pathParts = window.location.pathname.split('/').filter(Boolean);
    if (pathParts.length >= 2) {
      return `${pathParts[0]}#${pathParts[1]}`;
    }
    const params = new URLSearchParams(window.location.search);
    const restaurant = params.get('restaurant') || 'demo-restaurant';
    const table = params.get('table') || 'table-1';
    return `${restaurant}#${table}`;
  };

  // Initialize session and WebSocket
  useEffect(() => {
    const init = async () => {
      const qrCode = getQrCode();

      if (sessionStorage.getItem(`pingdish_closed_${qrCode}`)) {
        setSession({ sessionId: '', tableId: '', tableNumber: 0, status: 'CLOSED', pingStatus: 'IDLE', pingCount: 0, createdAt: 0 } as Session);
        setLoading(false);
        return;
      }

      try {
        const sess = await scanTable(qrCode);
        setSession(sess);
        setLoading(false);

        if (sess.pingCount > 0) {
          setPings(Array.from({ length: sess.pingCount }, (_, i) => ({
            id: `existing-${i}`,
            timestamp: new Date(sess.lastPingAt || sess.createdAt),
            response: "Kitchen was notified"
          })));
          setFirstPingTime(sess.createdAt);
          if (sess.lastPingAt) {
            const elapsed = Math.floor((Date.now() - new Date(sess.lastPingAt).getTime()) / 1000);
            const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
            setCooldownRemaining(remaining);
          }
        }

        if (sess.pingStatus === 'SERVING') setShowServingNotification(true);

        connectCustomerWebSocket(sess.sessionId, (msg) => {
          if (msg.event === 'PING') {
            const count = msg.pingCount || 1;
            setPings(Array.from({ length: count }, (_, i) => ({
              id: `ping-${i}`,
              timestamp: new Date(),
              response: "Kitchen has been notified!"
            })));
            setSession(prev => prev ? { ...prev, pingCount: count, pingStatus: 'PINGED' } : null);
            if (msg.lastPingAt) {
              const elapsed = Math.floor((Date.now() - new Date(msg.lastPingAt).getTime()) / 1000);
              const remaining = Math.max(0, COOLDOWN_SECONDS - elapsed);
              setCooldownRemaining(remaining);
            }
          } else if (msg.event === 'SERVING') {
            setShowServingNotification(true);
            setSession(prev => prev ? { ...prev, pingStatus: 'SERVING' } : null);
            triggerHaptic([100, 50, 100, 50, 100]);
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

    // Haptic feedback + ripple animation
    triggerHaptic([30, 20, 60]);
    setShowRipple(true);
    setTimeout(() => setShowRipple(false), 1500);

    if (!firstPingTime) setFirstPingTime(Date.now());

    setIsPinging(true);
    const result = await pingKitchen(session.sessionId);

    if (result.error === 'Cooldown') {
      setCooldownRemaining(result.remainingSeconds || COOLDOWN_SECONDS);
    } else if (result.success) {
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

    // Celebration!
    setShowCelebration(true);
    launchConfetti();
    triggerHaptic([50, 30, 50, 30, 100]);

    try {
      await confirmFood(session.sessionId);
      setShowServingNotification(false);
      setPings([]);
      setFirstPingTime(null);

      setTimeout(() => {
        sessionStorage.setItem(`pingdish_closed_${getQrCode()}`, '1');
        setSession({ ...session, status: 'CLOSED' });
        setShowCelebration(false);
      }, 2500);
    } catch (e) {
      console.error("Confirm failed:", e);
      setShowCelebration(false);
    }
  };

  const handleConfirmNo = () => {
    setShowConfirmDialog(false);
  };

  const handleStillWaiting = async () => {
    if (!session) return;
    setShowServingNotification(false);
    triggerHaptic(30);
    try {
      await rejectServing(session.sessionId);
      setSession({ ...session, pingStatus: 'PINGED' });
    } catch (e) {
      console.error("Reject failed:", e);
    }
  };

  const handleFeedbackSubmit = () => {
    if (feedbackRating === null) return;
    triggerHaptic(50);
    setFeedbackSubmitted(true);
  };

  // ═══ Loading Screen ═══
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="flex flex-col items-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-orange-100"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-orange-500 animate-spin"></div>
          </div>
          <p className="mt-4 text-gray-400 text-sm font-medium">Setting up your table...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center view-enter">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
          </div>
          <h1 className="text-xl font-bold text-gray-800 mb-2">Invalid QR Code</h1>
          <p className="text-gray-500">Please scan a valid table QR code</p>
        </div>
      </div>
    );
  }

  // ═══ Celebration Overlay ═══
  if (showCelebration) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="celebration-pop mb-6">
            <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto relative">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#22C55E" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12l5 5L20 7" />
              </svg>
              <Sparkles size={20} className="absolute -top-2 -right-2 text-yellow-400 float-gentle" />
              <Sparkles size={16} className="absolute -bottom-1 -left-2 text-orange-400 float-gentle" style={{animationDelay: '0.5s'}} />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2 celebration-pop" style={{animationDelay: '0.2s'}}>
            Bon Appetit!
          </h1>
          <p className="text-gray-500 celebration-pop" style={{animationDelay: '0.4s'}}>
            Enjoy your meal! We hope you love it.
          </p>
        </div>
      </div>
    );
  }

  // ═══ Session Closed — Thank You Screen ═══
  if (session.status === 'CLOSED') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center view-enter max-w-sm">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 float-gentle">
            <Utensils size={36} className="text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-3">Thank you for dining!</h1>
          <p className="text-gray-500 mb-8">We hope you enjoyed your meal. Your feedback means the world to us.</p>

          {!feedbackSubmitted ? (
            <div className="bg-white rounded-2xl p-6 shadow-sm view-enter">
              <p className="text-gray-600 text-sm font-medium mb-4">How was your experience?</p>
              <div className="flex justify-center gap-3 mb-4">
                {['😠', '🙁', '😐', '🙂', '😍'].map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setFeedbackRating(idx + 1); triggerHaptic(20); }}
                    className={`text-3xl transition-all duration-200 ${
                      feedbackRating === idx + 1
                        ? 'scale-125 star-selected'
                        : feedbackRating !== null && feedbackRating !== idx + 1
                        ? 'opacity-40 scale-90'
                        : 'hover:scale-110'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              {feedbackRating !== null && (
                <div className="view-enter">
                  <textarea
                    value={feedbackComment}
                    onChange={(e) => setFeedbackComment(e.target.value)}
                    placeholder="Any thoughts? (optional)"
                    className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none h-20 focus:outline-none focus:border-orange-300 transition-colors mb-3"
                  />
                  <button
                    onClick={handleFeedbackSubmit}
                    className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-3 rounded-xl shadow-md transition active:scale-95"
                  >
                    Submit Feedback
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 shadow-sm celebration-pop">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Star size={24} className="text-green-500" />
              </div>
              <p className="text-gray-700 font-semibold">Thanks for your feedback!</p>
              <p className="text-gray-400 text-sm mt-1">See you next time!</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  const canPing = cooldownRemaining === 0;

  // ═══ Status View — The Ping Experience ═══
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
          <div className="relative">
            {/* Animated gradient ring */}
            <div className="absolute -inset-3 rounded-full overflow-hidden">
              <div className="w-full h-full gradient-ring-spin" style={{
                background: 'conic-gradient(from 0deg, #E86C23, #FCD34D, #E86C23, transparent, #E86C23)',
                opacity: 0.2,
              }}></div>
            </div>
            <div className="w-48 h-48 rounded-full bg-orange-50 flex items-center justify-center shadow-inner animate-fade-in breathing-glow relative">
              <Bell size={64} className="text-primary animate-pulse" />

              {/* Ripple waves on ping */}
              {showRipple && (
                <>
                  <div className="ping-ripple-ring ping-ripple-ring-1" />
                  <div className="ping-ripple-ring ping-ripple-ring-2" />
                  <div className="ping-ripple-ring ping-ripple-ring-3" />
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Live waiting timer */}
      {firstPingTime && cooldownRemaining === 0 && pings.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-gray-400 text-xs timer-pulse view-enter">
          <Clock size={12} />
          <span>Waiting for <span className="font-bold text-gray-600 tabular-nums">{waitingTime}</span></span>
        </div>
      )}

      <button
        onClick={handlePing}
        disabled={!canPing || isPinging}
        className={`w-full max-w-xs font-bold py-4 px-8 rounded-full shadow-lg transform transition-all duration-200 flex items-center justify-center space-x-2 relative overflow-hidden
          ${(!canPing || isPinging)
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
            : 'bg-primary hover:bg-primaryHover text-white active:scale-[0.93] hover:shadow-xl hover:shadow-orange-500/20'
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
          : pings.length === 0
          ? "Tap to send a gentle reminder to the kitchen."
          : "Need to ping again? Go ahead!"}
      </p>

      {pings.length > 0 && (
        <div className="mt-4 bg-orange-100 px-4 py-2 rounded-full badge-pop">
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
            <div key={ping.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm text-sm view-enter" style={{animationDelay: `${index * 0.05}s`}}>
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
    <div className="flex flex-col items-center pt-8 overflow-y-auto h-full view-enter">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-bold text-secondary">Your Order Status</h1>
        <div className="flex items-center justify-center space-x-2 mt-2 text-gray-500">
          <span className="bg-gray-200 px-2 py-1 rounded text-xs font-medium">Table {session.tableNumber}</span>
          {session.pingStatus === 'PINGED' && (
            <span className="bg-orange-100 text-orange-600 px-2 py-1 rounded text-xs font-medium animate-pulse">Kitchen notified</span>
          )}
          {session.pingStatus === 'SERVING' && (
            <span className="bg-green-100 text-green-600 px-2 py-1 rounded text-xs font-medium">Being served</span>
          )}
        </div>
      </div>

      <div className="flex-1 w-full flex flex-col items-center">
        {renderProgressSection()}
      </div>

      {renderHistory()}
    </div>
  );

  // ═══ Bill View — Enhanced ═══
  const renderBillView = () => (
    <div className="flex flex-col h-full pt-8 px-6 overflow-y-auto pb-20 view-enter">
      <div className="flex items-center space-x-3 mb-6">
        <button onClick={() => setCurrentView(ViewState.STATUS)} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <h1 className="text-xl font-bold text-secondary">Your Bill</h1>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="text-center border-b border-dashed border-gray-200 pb-4 mb-4">
          <h2 className="text-lg font-bold text-secondary">Table {session.tableNumber}</h2>
          <p className="text-xs text-gray-400 mt-1">Order Summary</p>
        </div>

        <div className="space-y-4 mb-6">
          {ORDER_ITEMS.map((item, i) => (
            <div key={item.id} className="flex justify-between text-sm text-gray-700 view-enter" style={{animationDelay: `${i * 0.1}s`}}>
              <span>{item.name} <span className="text-gray-400">x{item.quantity}</span></span>
              <span className="font-medium tabular-nums">₹{item.price * item.quantity}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-gray-100 pt-4 space-y-2">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span><span className="tabular-nums">₹{totalBill}</span>
          </div>
          <div className="flex justify-between text-sm text-gray-500">
            <span>GST (5%)</span><span className="tabular-nums">₹{tax}</span>
          </div>
          <div className="flex justify-between text-lg font-bold text-secondary mt-2 pt-2 border-t border-gray-100">
            <span>Total</span><span className="tabular-nums">₹{finalTotal}</span>
          </div>
        </div>
      </div>

      <div className="bg-orange-50 p-4 rounded-xl text-center mb-6">
        <p className="text-primary text-sm font-medium italic">{billMessage}</p>
      </div>

      <button className="w-full bg-primary hover:bg-primaryHover text-white font-bold py-4 rounded-xl shadow-md transition active:scale-[0.97]">
        Request Bill
      </button>
    </div>
  );

  // ═══ Feedback View — Enhanced with interactive rating ═══
  const renderFeedbackView = () => (
    <div className="flex flex-col h-full pt-12 px-6 items-center text-center view-enter">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 float-gentle">
        <ChefHat size={32} />
      </div>
      <h1 className="text-2xl font-bold text-secondary mb-4">Enjoyed your meal?</h1>
      <p className="text-gray-500 mb-8">How was your experience today?</p>

      <div className="flex justify-between w-full max-w-xs mb-6">
        {['😠', '🙁', '😐', '🙂', '😍'].map((emoji, idx) => (
          <button
            key={idx}
            onClick={() => { setFeedbackRating(idx + 1); triggerHaptic(20); }}
            className={`text-4xl transition-all duration-200 ${
              feedbackRating === idx + 1
                ? 'scale-125 star-selected'
                : feedbackRating !== null && feedbackRating !== idx + 1
                ? 'opacity-30 scale-90'
                : 'hover:scale-125'
            }`}
          >
            {emoji}
          </button>
        ))}
      </div>

      {feedbackRating !== null && (
        <div className="w-full max-w-xs view-enter">
          <p className="text-sm text-gray-400 mb-2">
            {feedbackRating <= 2 ? "We're sorry to hear that. What went wrong?"
             : feedbackRating === 3 ? "How can we do better next time?"
             : "Glad you enjoyed it! Any highlights?"}
          </p>
          <textarea
            value={feedbackComment}
            onChange={(e) => setFeedbackComment(e.target.value)}
            placeholder="Share your thoughts... (optional)"
            className="w-full p-3 border border-gray-200 rounded-xl text-sm resize-none h-20 mb-4 focus:outline-none focus:border-orange-300 transition-colors"
          />
        </div>
      )}

      <button
        onClick={handleFeedbackSubmit}
        disabled={feedbackRating === null}
        className={`w-full max-w-xs font-bold py-4 rounded-xl shadow-md transition-all active:scale-[0.97] ${
          feedbackRating !== null
            ? 'bg-primary hover:bg-primaryHover text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
      >
        Submit Feedback
      </button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center py-0 sm:py-8">
      <div className="w-full sm:w-[375px] h-[100dvh] sm:h-[812px] bg-cream sm:rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative border-0 sm:border-8 sm:border-gray-900 box-content">

        <div className="hidden sm:block absolute top-0 left-1/2 transform -translate-x-1/2 w-40 h-6 bg-gray-900 rounded-b-2xl z-20"></div>

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

        <Navbar currentView={currentView} onNavigate={(view) => { setCurrentView(view); triggerHaptic(10); }} />

        {/* Food Serving Notification */}
        {showServingNotification && !showConfirmDialog && (
          <div className="absolute inset-0 z-50 flex items-end justify-center">
            <div className="absolute inset-0 bg-black/40"></div>
            <div className="relative bg-white w-full rounded-t-3xl p-8 z-10 slide-up-bounce">
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-1 bg-gray-300 rounded-full mb-6"></div>
                <div className="bg-yellow-100 p-4 rounded-full mb-4 float-gentle">
                  <Utensils size={32} className="text-yellow-600" />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">Food on the way!</h3>
                <p className="text-gray-600 mb-6">The kitchen is serving your order now.</p>

                <button onClick={handleConfirmClick} className="w-full bg-green-600 text-white font-bold py-4 rounded-xl shadow-lg mb-3 active:bg-green-700 active:scale-[0.97] transition-all">
                  ✓ Food Received
                </button>
                <button onClick={handleStillWaiting} className="w-full bg-gray-200 text-gray-700 font-bold py-4 rounded-xl active:bg-gray-300 active:scale-[0.97] transition-all">
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
            <div className="relative bg-white w-full max-w-sm rounded-2xl p-6 z-10 celebration-pop">
              <h3 className="text-lg font-bold text-secondary mb-3 text-center">Confirm Receipt</h3>
              <p className="text-gray-600 text-center mb-6">
                Are you sure you have received your food? This will notify the kitchen that your order is complete.
              </p>
              <div className="flex gap-3">
                <button onClick={handleConfirmNo} className="flex-1 bg-gray-200 text-gray-700 font-bold py-3 rounded-xl active:bg-gray-300 active:scale-[0.97] transition-all">
                  No, Wait
                </button>
                <button onClick={handleConfirmYes} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-xl active:bg-green-700 active:scale-[0.97] transition-all">
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
