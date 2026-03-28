import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, QrCode, Zap, Clock, Check, Download, ExternalLink, ArrowRight, ChefHat, Smartphone, BarChart3, Shield, Menu, X, Star, Users, Timer, UtensilsCrossed, Sparkles, MonitorSmartphone, MessageSquare, Send, Building2, Headphones, Globe, Crown, Eye, EyeOff, Lock, LogIn } from 'lucide-react';
import { escapeHtml, isValidKitchenUrl } from './utils/security';

/* ═══════════════════════════════════════════════════════
   ANIMATED COUNT-UP HOOK
   Triggers when element is in viewport via IntersectionObserver
   ═══════════════════════════════════════════════════════ */

function useCountUp(end: number, duration: number = 2000, suffix: string = '') {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated) {
          setHasAnimated(true);
          const startTime = performance.now();

          const animate = (currentTime: number) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            // Ease-out cubic for smooth deceleration
            const eased = 1 - Math.pow(1 - progress, 3);
            setCount(Math.round(eased * end));

            if (progress < 1) {
              requestAnimationFrame(animate);
            }
          };

          requestAnimationFrame(animate);
        }
      },
      { threshold: 0.3 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [end, duration, hasAnimated]);

  return { ref, displayValue: count, hasAnimated };
}

interface FormData {
  restaurantName: string;
  restaurantId: string;
  numberOfTables: string;
  ownerEmail: string;
  password: string;
  confirmPassword: string;
}

interface TableInfo { tableNumber: number; qrUrl: string; }
interface SubmissionResult {
  success: boolean;
  kitchenUrl: string;
  tables: TableInfo[];
}

// [FIX 5.1] Use environment variables instead of hardcoded URLs
const API_URL = import.meta.env.VITE_API_URL || 'https://7fqrf6dfl6.execute-api.ap-south-2.amazonaws.com/prod/api';

const getQrCodeUrl = (url: string, size = 200) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(url)}`;

// [FIX 4.4] Download all QR codes as printable HTML — with XSS-safe escaping
const downloadQrCodes = (tables: TableInfo[], restaurantName: string) => {
  const safeName = escapeHtml(restaurantName);
  const html = `<!DOCTYPE html>
<html><head><title>QR Codes - ${safeName}</title>
<style>
  body { font-family: Arial, sans-serif; }
  .qr-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; padding: 20px; }
  .qr-card { border: 2px solid #333; padding: 15px; text-align: center; page-break-inside: avoid; }
  .qr-card img { width: 150px; height: 150px; }
  .qr-card h3 { margin: 10px 0 5px; font-size: 18px; }
  .qr-card p { margin: 0; font-size: 11px; color: #666; }
  @media print { .qr-grid { grid-template-columns: repeat(3, 1fr); } }
</style></head><body>
<h1 style="text-align:center;margin-bottom:20px;">${safeName} - Table QR Codes</h1>
<div class="qr-grid">
${tables.map(t => {
    const safeTableNum = escapeHtml(String(t.tableNumber));
    const safeUrl = getQrCodeUrl(t.qrUrl, 150);
    return `<div class="qr-card">
  <img src="${safeUrl}" alt="Table ${safeTableNum}"/>
  <h3>Table ${safeTableNum}</h3>
  <p>Scan to ping kitchen</p>
</div>`;
  }).join('')}
</div>
<script>window.print();</script>
</body></html>`;

  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
};

// [FIX 6.1] Shared fetch wrapper with CSRF custom header
const apiFetch = (url: string, options: RequestInit = {}) =>
  fetch(url, {
    ...options,
    headers: { ...options.headers as Record<string, string>, 'Content-Type': 'application/json', 'X-Requested-With': 'PingDish' },
  });

/* ═══════════════════════════════════════════════════════
   HERO ANIMATION — 3-scene looping story
   Scene 0: Customer taps "Ping Kitchen" on phone
   Scene 1: Kitchen dashboard receives ping, marks serving
   Scene 2: Dish delivered, celebration
   ═══════════════════════════════════════════════════════ */

function HeroAnimation() {
  const [scene, setScene] = useState(0);       // 0 | 1 | 2
  const [subStep, setSubStep] = useState(0);   // sub-states within each scene
  const timerRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timerRef.current.forEach(t => clearTimeout(t));
    timerRef.current = [];
  }, []);

  const addTimer = useCallback((fn: () => void, ms: number) => {
    timerRef.current.push(setTimeout(fn, ms));
  }, []);

  // Scene lifecycle
  useEffect(() => {
    clearTimers();
    setSubStep(0);

    if (scene === 0) {
      // Customer Ping scene: idle → finger appears → tap → sending → notified
      addTimer(() => setSubStep(1), 800);    // finger appears
      addTimer(() => setSubStep(2), 1800);   // tap + ripple
      addTimer(() => setSubStep(3), 2600);   // "Sending..."
      addTimer(() => setSubStep(4), 3400);   // "Kitchen notified"
      addTimer(() => { setScene(1); }, 4800); // transition to kitchen
    } else if (scene === 1) {
      // Kitchen scene: dashboard → ping arrives → flash → mark serving
      addTimer(() => setSubStep(1), 600);    // ping arrives on Table 5
      addTimer(() => setSubStep(2), 1500);   // notification toast
      addTimer(() => setSubStep(3), 2800);   // mark as serving
      addTimer(() => setSubStep(4), 3600);   // serving confirmed
      addTimer(() => { setScene(2); }, 4800); // transition to delivery
    } else if (scene === 2) {
      // Delivery scene: checkmark → dish → celebrate → loop
      addTimer(() => setSubStep(1), 500);    // checkmark draws
      addTimer(() => setSubStep(2), 1200);   // dish slides in
      addTimer(() => setSubStep(3), 2000);   // sparkles
      addTimer(() => setSubStep(4), 3200);   // "Enjoy!"
      addTimer(() => { setScene(0); }, 4800); // loop back
    }

    return clearTimers;
  }, [scene, clearTimers, addTimer]);

  // ─── Scene 0: Customer Phone ───
  const renderCustomerScene = () => (
    <div className={`absolute inset-0 flex flex-col p-4 sm:p-6 transition-all duration-500 ${scene === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
      {/* Phone header */}
      <div className="flex justify-between items-center mb-5">
        <span className="text-white/60 text-xs font-medium">9:41</span>
        <div className="w-20 h-5 bg-navy-800 rounded-full" />
        <div className="w-3.5 h-2 bg-white/40 rounded-sm" />
      </div>

      {/* App header */}
      <div className="text-center mb-5">
        <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center mx-auto mb-2">
          <Bell className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-white font-bold text-sm">Table 5</h3>
        <p className="text-gray-500 text-xs">The Cozy Bistro</p>
      </div>

      {/* Ping Button with tap animation */}
      <div className="relative mb-4">
        <button className={`w-full bg-gradient-to-r from-primary-500 to-primary-600 text-white py-4 rounded-2xl font-bold text-lg shadow-lg shadow-primary-500/30 ${subStep === 2 ? 'btn-tap' : ''}`}>
          {subStep >= 3 ? 'Sending...' : 'Ping Kitchen'}
        </button>
        {/* Ripple rings */}
        {subStep >= 2 && subStep < 4 && (
          <>
            <div className="ping-ripple ping-ripple-1" />
            <div className="ping-ripple ping-ripple-2" />
            <div className="ping-ripple ping-ripple-3" />
          </>
        )}
        {/* Finger cursor */}
        {subStep >= 1 && subStep <= 2 && (
          <div className="absolute left-1/2 -bottom-2 finger-tap pointer-events-none">
            <svg width="24" height="28" viewBox="0 0 24 28" fill="none">
              <path d="M12 2C12 2 8 6 8 10V16L6 14C5 13 3 13 2 14C1 15 1 17 2 18L8 24C9 25 10 26 12 26H16C19 26 22 23 22 20V12C22 10 20 8 18 8C17 8 16 8.5 15.5 9C15 7 13.5 6 12 6C11 6 10 6.5 9.5 7.5" fill="white" opacity="0.9"/>
            </svg>
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="bg-white/5 rounded-xl p-3 mb-3">
        {subStep < 3 ? (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-gray-500 rounded-full" />
            <span className="text-gray-500 text-xs font-medium">Tap to ping kitchen</span>
          </div>
        ) : subStep === 3 ? (
          <div className="flex items-center gap-2 status-enter">
            <svg className="animate-spin w-3 h-3 text-primary-500" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-primary-400 text-xs font-medium">Sending ping...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 status-enter">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            <span className="text-green-400 text-xs font-medium">Kitchen notified</span>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div className="mt-auto flex justify-around bg-white/5 rounded-2xl p-2">
        <div className="text-center px-3 py-1.5 bg-primary-500/20 rounded-xl">
          <Bell className="w-4 h-4 text-primary-500 mx-auto" />
          <span className="text-primary-400 text-[10px] mt-0.5 block">Status</span>
        </div>
        <div className="text-center px-3 py-1.5">
          <BarChart3 className="w-4 h-4 text-gray-600 mx-auto" />
          <span className="text-gray-600 text-[10px] mt-0.5 block">Bill</span>
        </div>
        <div className="text-center px-3 py-1.5">
          <Star className="w-4 h-4 text-gray-600 mx-auto" />
          <span className="text-gray-600 text-[10px] mt-0.5 block">Feedback</span>
        </div>
      </div>
    </div>
  );

  // ─── Scene 1: Kitchen Dashboard ───
  const renderKitchenScene = () => {
    const tables = [
      { num: 1, status: 'idle' },
      { num: 2, status: 'idle' },
      { num: 3, status: 'serving' },
      { num: 4, status: 'idle' },
      { num: 5, status: subStep >= 1 ? (subStep >= 3 ? 'serving' : 'pinged') : 'idle' },
      { num: 6, status: 'idle' },
    ];

    return (
      <div className={`absolute inset-0 flex flex-col p-4 sm:p-5 transition-all duration-500 ${scene === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        {/* Dashboard header */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            <MonitorSmartphone className="w-4 h-4 text-primary-500" />
            <span className="text-white text-xs font-bold">Kitchen Dashboard</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            <span className="text-green-400 text-[10px]">Live</span>
          </div>
        </div>

        {/* Notification toast */}
        {subStep >= 2 && (
          <div className="bg-primary-500/15 border border-primary-500/30 rounded-xl p-2.5 mb-3 toast-enter">
            <div className="flex items-center gap-2">
              <Bell className="w-3.5 h-3.5 text-primary-500" />
              <span className="text-primary-400 text-[10px] font-semibold">New Ping! Table 5 needs service</span>
            </div>
          </div>
        )}

        {/* Table grid */}
        <div className="grid grid-cols-3 gap-2 flex-1">
          {tables.map((table) => (
            <div
              key={table.num}
              className={`rounded-xl p-2.5 flex flex-col items-center justify-center transition-all duration-300 ${
                table.status === 'pinged'
                  ? 'bg-primary-500/15 border border-primary-500/30 card-ping-flash'
                  : table.status === 'serving'
                  ? 'bg-yellow-500/10 border border-yellow-500/20 serving-pulse'
                  : 'bg-white/5 border border-white/5'
              }`}
            >
              <span className={`text-[10px] font-semibold mb-0.5 ${
                table.status === 'pinged' ? 'text-primary-400' : table.status === 'serving' ? 'text-yellow-400' : 'text-gray-500'
              }`}>
                T{table.num}
              </span>
              {table.status === 'pinged' && subStep >= 1 && (
                <div className="badge-bounce">
                  <div className="w-4 h-4 bg-primary-500 rounded-full flex items-center justify-center">
                    <span className="text-[8px] text-white font-bold">1</span>
                  </div>
                </div>
              )}
              {table.status === 'serving' && (
                <span className="text-[8px] text-yellow-400 font-medium">Serving</span>
              )}
              {table.status === 'idle' && (
                <span className="text-[8px] text-gray-600">Idle</span>
              )}
            </div>
          ))}
        </div>

        {/* Action indicator */}
        <div className="mt-3">
          {subStep >= 3 ? (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-2.5 status-enter">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-yellow-400 text-[10px] font-medium">Table 5 marked as serving</span>
              </div>
            </div>
          ) : subStep >= 1 ? (
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-xl p-2.5 status-enter">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-primary-500" />
                <span className="text-primary-400 text-[10px] font-medium">Table 5 is waiting for service</span>
              </div>
            </div>
          ) : (
            <div className="bg-white/5 rounded-xl p-2.5">
              <span className="text-gray-600 text-[10px]">All tables monitored</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ─── Scene 2: Dish Delivered ───
  const renderDeliveryScene = () => (
    <div className={`absolute inset-0 flex flex-col items-center justify-center p-4 sm:p-6 transition-all duration-500 ${scene === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
      {/* Success checkmark */}
      <div className="relative mb-5">
        <div className={`w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center ${subStep >= 1 ? 'circle-grow' : 'opacity-0'}`}>
          <svg className={`w-10 h-10 text-green-400 ${subStep >= 1 ? 'check-draw' : 'opacity-0'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </div>

        {/* Sparkles around checkmark */}
        {subStep >= 3 && (
          <>
            <div className="absolute -top-2 -right-2 text-yellow-400 sparkle-1"><Sparkles className="w-4 h-4" /></div>
            <div className="absolute -top-3 left-0 text-primary-400 sparkle-2"><Star className="w-3 h-3" /></div>
            <div className="absolute -bottom-1 -right-3 text-yellow-300 sparkle-3"><Sparkles className="w-3 h-3" /></div>
            <div className="absolute top-0 -left-3 text-primary-300 sparkle-4"><Star className="w-3.5 h-3.5" /></div>
            <div className="absolute -bottom-2 left-1 text-yellow-400 sparkle-5"><Sparkles className="w-3.5 h-3.5" /></div>
          </>
        )}
      </div>

      {/* Dish icon */}
      {subStep >= 2 && (
        <div className="mb-4 dish-slide-in">
          <div className="w-14 h-14 bg-primary-500/20 rounded-2xl flex items-center justify-center">
            <UtensilsCrossed className="w-7 h-7 text-primary-500" />
          </div>
        </div>
      )}

      {/* Text */}
      {subStep >= 1 && (
        <h3 className="text-white font-bold text-base mb-1 status-enter">Order Served!</h3>
      )}
      {subStep >= 2 && (
        <p className="text-gray-400 text-xs text-center status-enter">Your dish has been delivered to Table 5</p>
      )}
      {subStep >= 4 && (
        <p className="text-yellow-400 text-sm font-semibold mt-3 status-enter">Enjoy your meal!</p>
      )}

      {/* Rating prompt */}
      {subStep >= 3 && (
        <div className="mt-4 flex gap-1.5 status-enter">
          {['😊', '😍', '🤩'].map((emoji, i) => (
            <div key={i} className={`w-9 h-9 bg-white/5 rounded-xl flex items-center justify-center text-lg transition-all duration-300 ${i === 1 ? 'ring-2 ring-primary-500/40 bg-primary-500/10 scale-110' : ''}`}>
              {emoji}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Floating contextual cards ───
  const renderFloatingCards = () => (
    <>
      {/* Scene 0: Scan & Go card */}
      <div className={`absolute -bottom-2 -left-10 bg-navy-800 border border-white/10 rounded-2xl p-3 shadow-xl transition-all duration-500 z-20 ${scene === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <QrCode className="w-5 h-5 text-navy-900" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Scan & Go</p>
            <p className="text-gray-500 text-[10px]">No app download</p>
          </div>
        </div>
      </div>

      {/* Scene 1: New Ping card */}
      <div className={`absolute -top-4 -right-8 bg-navy-800 border border-white/10 rounded-2xl p-3 shadow-xl transition-all duration-500 z-20 ${scene === 1 && subStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <Bell className="w-4 h-4 text-primary-500" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">New Ping!</p>
            <p className="text-gray-500 text-[10px]">Table 5 needs service</p>
          </div>
        </div>
      </div>

      {/* Scene 2: Delivered card */}
      <div className={`absolute -top-4 -right-8 bg-navy-800 border border-green-500/20 rounded-2xl p-3 shadow-xl transition-all duration-500 z-20 ${scene === 2 && subStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
            <Check className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Delivered!</p>
            <p className="text-gray-500 text-[10px]">Dish served to table</p>
          </div>
        </div>
      </div>

      {/* Scene 1: Kitchen active card (bottom-left) */}
      <div className={`absolute -bottom-2 -left-10 bg-navy-800 border border-white/10 rounded-2xl p-3 shadow-xl transition-all duration-500 z-20 ${scene === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-yellow-500/20 rounded-lg flex items-center justify-center">
            <ChefHat className="w-4 h-4 text-yellow-400" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Kitchen Active</p>
            <p className="text-gray-500 text-[10px]">6 tables monitored</p>
          </div>
        </div>
      </div>

      {/* Scene 2: Enjoy card (bottom-left) */}
      <div className={`absolute -bottom-2 -left-10 bg-navy-800 border border-primary-500/20 rounded-2xl p-3 shadow-xl transition-all duration-500 z-20 ${scene === 2 && subStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center">
            <UtensilsCrossed className="w-4 h-4 text-primary-500" />
          </div>
          <div>
            <p className="text-white text-xs font-semibold">Bon Appetit!</p>
            <p className="text-gray-500 text-[10px]">Rate your experience</p>
          </div>
        </div>
      </div>
    </>
  );

  // ─── Scene indicator dots & label ───
  const sceneLabels = ['Customer Pings', 'Kitchen Receives', 'Dish Delivered'];

  return (
    <div className="relative flex items-center justify-center animate-slide-in-right mx-auto lg:mx-0">
      <div className="relative">
        {/* Phone frame */}
        <div className="relative w-[300px] bg-navy-800 rounded-[2.5rem] p-3 shadow-2xl shadow-primary-500/10 border border-white/10">
          <div className="bg-navy-900 rounded-[2rem] min-h-[460px] relative overflow-hidden">
            {renderCustomerScene()}
            {renderKitchenScene()}
            {renderDeliveryScene()}
          </div>
        </div>

        {/* Scene indicator */}
        <div className="flex items-center justify-center gap-3 mt-5">
          {[0, 1, 2].map(i => (
            <button
              key={i}
              onClick={() => setScene(i)}
              className="flex items-center gap-1.5 group"
            >
              <div className={`h-1.5 rounded-full transition-all duration-500 ${scene === i ? 'w-8 bg-primary-500' : 'w-1.5 bg-white/20 group-hover:bg-white/40'}`} />
            </button>
          ))}
        </div>
        <p className="text-center text-gray-500 text-[10px] mt-2 h-3 transition-all duration-300">
          {sceneLabels[scene]}
        </p>

        {/* Floating contextual cards — hidden on small screens to prevent overflow */}
        <div className="hidden sm:block">
          {renderFloatingCards()}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   STATS BAR — Animated count-up numbers
   ═══════════════════════════════════════════════════════ */

function StatCard({ end, suffix, prefix, label, icon, duration = 2000, decimals = 0, divideBy = 1, displaySuffix = '' }: {
  end: number; suffix?: string; prefix?: string; label: string; icon: React.ReactNode; duration?: number; decimals?: number; divideBy?: number; displaySuffix?: string;
}) {
  const { ref, displayValue, hasAnimated } = useCountUp(end, duration);

  const formatDisplay = (n: number) => {
    const val = n / divideBy;
    if (displaySuffix === 'K') {
      if (val >= 1000) {
        const k = val / 1000;
        return n === end ? `${Math.round(k)}K` : `${k.toFixed(1)}K`;
      }
      return val.toFixed(0);
    }
    if (decimals > 0) {
      return val.toFixed(decimals);
    }
    return val.toString();
  };

  return (
    <div ref={ref} className="glass-card rounded-2xl p-4 sm:p-6 text-center stat-shimmer">
      <div className="text-primary-500 mb-2 flex justify-center">{icon}</div>
      <div className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white mb-1 tabular-nums">
        {prefix || ''}{hasAnimated ? formatDisplay(displayValue) : (decimals > 0 ? '0.' + '0'.repeat(decimals) : '0')}{suffix || ''}
      </div>
      <div className="text-gray-500 text-sm font-medium">{label}</div>
    </div>
  );
}

function StatsBar() {
  return (
    <section className="bg-navy-950 py-16 relative z-20">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <StatCard end={500} suffix="+" label="Restaurants" icon={<ChefHat className="w-5 h-5" />} duration={2000} />
          <StatCard end={50000} suffix="+" label="Tables Served" icon={<Users className="w-5 h-5" />} duration={2200} displaySuffix="K" />
          <StatCard end={2} prefix="<" suffix="s" label="Notification Speed" icon={<Timer className="w-5 h-5" />} duration={1500} />
          <StatCard end={999} suffix="%" label="Uptime" icon={<Shield className="w-5 h-5" />} duration={2400} decimals={1} divideBy={10} />
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   LOGIN PAGE — Restaurant owners access their dashboard
   ═══════════════════════════════════════════════════════ */

function AdminPanel({ apiUrl, apiFetch }: { apiUrl: string; apiFetch: (url: string, opts?: RequestInit) => Promise<Response> }) {
  const [adminKey, setAdminKey] = useState('');
  const [loggedIn, setLoggedIn] = useState(false);
  const [tab, setTab] = useState<'enquiries' | 'restaurants'>('enquiries');
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [filter, setFilter] = useState('PENDING');
  const [loading, setLoading] = useState(false);
  const [approveForm, setApproveForm] = useState<{ id: string; restaurantId: string; restaurantName: string; numberOfTables: string } | null>(null);
  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const authHeaders = { 'X-Admin-Key': adminKey };

  const loadEnquiries = async (status: string) => {
    setLoading(true);
    try {
      const res = await apiFetch(`${apiUrl}/enquiries?status=${status}`, { headers: authHeaders });
      const data = await res.json();
      setEnquiries(data.enquiries || []);
    } catch { setEnquiries([]); }
    setLoading(false);
  };

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`${apiUrl}/restaurants`, { headers: authHeaders });
      const data = await res.json();
      setRestaurants(data.restaurants || []);
    } catch { setRestaurants([]); }
    setLoading(false);
  };

  const showMsg = (text: string, type: 'success' | 'error') => {
    setMsg({ text, type });
    setTimeout(() => setMsg(null), 5000);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoggedIn(true);
    loadEnquiries('PENDING');
  };

  const handleApprove = async () => {
    if (!approveForm) return;
    const res = await apiFetch(`${apiUrl}/enquiries/${approveForm.id}/review`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ action: 'APPROVE', restaurantId: approveForm.restaurantId, restaurantName: approveForm.restaurantName, numberOfTables: parseInt(approveForm.numberOfTables) }),
    });
    const data = await res.json();
    showMsg(data.success ? `Approved! Credentials sent. Restaurant ID: ${data.restaurantId}` : data.error, data.success ? 'success' : 'error');
    setApproveForm(null);
    loadEnquiries(filter);
  };

  const handleDecline = async (id: string) => {
    if (!confirm('Decline this enquiry?')) return;
    const res = await apiFetch(`${apiUrl}/enquiries/${id}/review`, {
      method: 'POST', headers: authHeaders,
      body: JSON.stringify({ action: 'DECLINE' }),
    });
    const data = await res.json();
    showMsg(data.success ? 'Enquiry declined' : data.error, data.success ? 'success' : 'error');
    loadEnquiries(filter);
  };

  const handleResetPassword = async (restaurantId: string) => {
    if (!confirm(`Reset password for ${restaurantId}?`)) return;
    const res = await apiFetch(`${apiUrl}/restaurants/${restaurantId}/reset-password`, { method: 'POST', headers: authHeaders });
    const data = await res.json();
    showMsg(data.success ? `Password reset — email sent to ${data.emailSentTo}` : data.error, data.success ? 'success' : 'error');
  };

  if (!loggedIn) {
    return (
      <div className="min-h-screen bg-[#080e1a] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">PingDish Admin</h1>
            <p className="text-gray-500 text-sm mt-1">Enter your admin key to continue</p>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <input type="password" value={adminKey} onChange={e => setAdminKey(e.target.value)} required autoFocus
              className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white mb-4 focus:border-orange-500 focus:outline-none transition-colors" placeholder="Admin secret key" />
            <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-xl font-semibold transition-colors">Sign In</button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080e1a] text-white">
      {/* Header */}
      <header className="border-b border-white/5 bg-[#0a1120]">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-orange-500 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold">PingDish Admin</span>
          </div>
          <a href="/" className="text-gray-500 hover:text-white text-sm transition-colors">← Back to site</a>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Toast */}
        {msg && (
          <div className={`mb-6 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${msg.type === 'success' ? 'bg-green-500/10 border border-green-500/20 text-green-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            {msg.type === 'success' ? '✓' : '✕'} {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 w-fit">
          <button onClick={() => { setTab('enquiries'); loadEnquiries(filter); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'enquiries' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            Enquiries
          </button>
          <button onClick={() => { setTab('restaurants'); loadRestaurants(); }}
            className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === 'restaurants' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}>
            Restaurants
          </button>
        </div>

        {/* Enquiries Tab */}
        {tab === 'enquiries' && (
          <>
            <div className="flex items-center gap-2 mb-6">
              {['PENDING', 'APPROVED', 'DECLINED'].map(s => (
                <button key={s} onClick={() => { setFilter(s); loadEnquiries(s); }}
                  className={`px-4 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-colors ${filter === s ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
                  {s}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-500">Loading...</div>
            ) : enquiries.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500">No {filter.toLowerCase()} enquiries</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {enquiries.map(eq => (
                  <div key={eq.EnquiryId} className="bg-white/[0.03] border border-white/5 rounded-xl p-5 hover:border-white/10 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-white">{eq.Company}</h3>
                        <p className="text-gray-500 text-sm">{eq.Name} · {eq.Email}</p>
                      </div>
                      <span className="text-gray-600 text-xs">{eq.CreatedAt?.slice(0, 10)}</span>
                    </div>
                    {eq.Tables && <p className="text-gray-500 text-xs mb-1">📍 Locations: {eq.Tables}</p>}
                    {eq.Message && <p className="text-gray-400 text-sm mt-2 bg-white/[0.02] rounded-lg p-3 italic">"{eq.Message}"</p>}
                    {filter === 'PENDING' && (
                      <div className="flex gap-2 mt-4 pt-4 border-t border-white/5">
                        <button onClick={() => setApproveForm({ id: eq.EnquiryId, restaurantId: eq.Company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), restaurantName: eq.Company, numberOfTables: eq.Tables || '10' })}
                          className="bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-5 py-2 rounded-lg text-sm font-medium transition-colors">✓ Approve</button>
                        <button onClick={() => handleDecline(eq.EnquiryId)}
                          className="bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 px-5 py-2 rounded-lg text-sm font-medium transition-colors">✕ Decline</button>
                      </div>
                    )}
                    {filter === 'APPROVED' && eq.RestaurantId && (
                      <p className="text-green-400/70 text-xs mt-3 pt-3 border-t border-white/5">Restaurant ID: <span className="font-mono">{eq.RestaurantId}</span></p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* Restaurants Tab */}
        {tab === 'restaurants' && (
          <>
            {loading ? (
              <div className="text-center py-16 text-gray-500">Loading...</div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-gray-500">No restaurants onboarded yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-left text-gray-500 text-xs uppercase tracking-wider">
                      <th className="pb-3 pr-4">Restaurant</th>
                      <th className="pb-3 pr-4">Owner</th>
                      <th className="pb-3 pr-4">Email</th>
                      <th className="pb-3 pr-4">Tables</th>
                      <th className="pb-3 pr-4">Status</th>
                      <th className="pb-3 pr-4">Created</th>
                      <th className="pb-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.map(r => (
                      <tr key={r.RestaurantId} className="border-b border-white/5 hover:bg-white/[0.02]">
                        <td className="py-4 pr-4">
                          <div className="font-medium text-white">{r.RestaurantName}</div>
                          <div className="text-gray-600 text-xs font-mono">{r.RestaurantId}</div>
                        </td>
                        <td className="py-4 pr-4 text-gray-400">{r.OwnerName}</td>
                        <td className="py-4 pr-4 text-gray-400">{r.OwnerEmail}</td>
                        <td className="py-4 pr-4 text-gray-400">{r.NumberOfTables}</td>
                        <td className="py-4 pr-4">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium ${r.Status === 'ACTIVE' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{r.Status}</span>
                        </td>
                        <td className="py-4 pr-4 text-gray-500 text-xs">{r.CreatedAt?.slice(0, 10)}</td>
                        <td className="py-4">
                          <button onClick={() => handleResetPassword(r.RestaurantId)}
                            className="text-orange-400 hover:text-orange-300 text-xs font-medium transition-colors">Reset Password</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Approve Modal */}
        {approveForm && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
            <div className="bg-[#0d1526] border border-white/10 rounded-2xl p-8 w-full max-w-md shadow-2xl">
              <h3 className="font-bold text-xl mb-1">Approve Restaurant</h3>
              <p className="text-gray-500 text-sm mb-6">Password will be auto-generated and emailed to the owner.</p>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Restaurant ID (URL slug)</label>
                  <input value={approveForm.restaurantId} onChange={e => setApproveForm({ ...approveForm, restaurantId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-orange-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Restaurant Name</label>
                  <input value={approveForm.restaurantName} onChange={e => setApproveForm({ ...approveForm, restaurantName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-orange-500 focus:outline-none transition-colors" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wide">Number of Tables</label>
                  <input type="number" value={approveForm.numberOfTables} onChange={e => setApproveForm({ ...approveForm, numberOfTables: e.target.value })} min="1"
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:border-orange-500 focus:outline-none transition-colors" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setApproveForm(null)} className="flex-1 bg-white/5 hover:bg-white/10 py-3 rounded-xl text-sm font-medium transition-colors">Cancel</button>
                <button onClick={handleApprove} className="flex-1 bg-green-600 hover:bg-green-700 py-3 rounded-xl text-sm font-semibold transition-colors">Approve & Send Credentials</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function LoginPage() {
  const [loginForm, setLoginForm] = useState({ restaurantId: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loggedInRestaurant, setLoggedInRestaurant] = useState<{ id: string; name: string; tables: TableInfo[] } | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    setLoginError(null);

    try {
      const res = await apiFetch(`${API_URL}/restaurants/${loginForm.restaurantId}/login`, {
        method: 'POST',
        body: JSON.stringify({ password: loginForm.password })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Invalid Restaurant ID or password');
      }

      const data = await res.json();

      // Fetch tables for QR codes
      const tablesRes = await apiFetch(`${API_URL}/restaurants/${loginForm.restaurantId}/tables`);
      const tablesData = await tablesRes.json();
      const tables = (tablesData.tables || []).map((t: number) => ({
        tableNumber: t,
        qrUrl: `https://app.pingdish.com/${loginForm.restaurantId}/${t}`,
      }));

      setLoggedInRestaurant({ id: loginForm.restaurantId, name: data.restaurantName || loginForm.restaurantId, tables });
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  // ─── Restaurant Owner Dashboard (post-login) ───
  if (loggedInRestaurant) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Animated background layers */}
        <div className="absolute inset-0 z-0">
          <div className="hero-gradient absolute inset-0" />
          <div className="grid-pattern absolute inset-0 opacity-40" />

          {/* Floating orbs with different speeds */}
          <div className="absolute top-[10%] left-[15%] w-80 h-80 bg-primary-500/10 rounded-full blur-[100px]" style={{ animation: 'float-slow 8s ease-in-out infinite' }} />
          <div className="absolute bottom-[15%] right-[10%] w-96 h-96 bg-primary-500/[0.07] rounded-full blur-[120px]" style={{ animation: 'float-slow 10s ease-in-out infinite reverse' }} />
          <div className="absolute top-[50%] left-[60%] w-64 h-64 bg-blue-500/[0.04] rounded-full blur-[80px]" style={{ animation: 'float-slow 6s ease-in-out infinite' }} />

          {/* Animated rings */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] border border-primary-500/[0.06] rounded-full" style={{ animation: 'ring-pulse 4s ease-in-out infinite' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] border border-white/[0.03] rounded-full" style={{ animation: 'ring-pulse 4s ease-in-out infinite 1s' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-primary-500/[0.04] rounded-full" style={{ animation: 'ring-pulse 4s ease-in-out infinite 2s' }} />

          {/* Floating particles */}
          {[...Array(6)].map((_, i) => (
            <div key={i} className="absolute w-1 h-1 bg-primary-500/30 rounded-full" style={{
              top: `${15 + i * 15}%`, left: `${10 + i * 16}%`,
              animation: `particle-float ${3 + i * 0.5}s ease-in-out infinite ${i * 0.4}s`,
            }} />
          ))}
        </div>

        <div className="w-full max-w-lg relative z-10">
          {/* Logo + Restaurant info */}
          <div className="text-center mb-10 animate-fade-in-up">
            <div className="relative inline-block mb-6">
              <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto shadow-2xl shadow-primary-500/40" style={{ animation: 'logo-glow 3s ease-in-out infinite' }}>
                <ChefHat className="w-12 h-12 text-white" />
              </div>
              {/* Animated status ring */}
              <div className="absolute -inset-2 border-2 border-primary-500/20 rounded-[1.75rem]" style={{ animation: 'ring-pulse 2s ease-in-out infinite' }} />
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-3 border-navy-950 flex items-center justify-center shadow-lg shadow-green-500/40">
                <div className="w-2.5 h-2.5 bg-white rounded-full" style={{ animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            </div>
            <h1 className="text-4xl font-extrabold text-white mb-3 tracking-tight">{loggedInRestaurant.name}</h1>
            <div className="inline-flex items-center gap-3 bg-white/[0.04] border border-white/10 rounded-full px-5 py-2 backdrop-blur-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-gray-300 text-sm font-medium">{loggedInRestaurant.tables.length} tables</span>
              <span className="text-gray-600">·</span>
              <span className="font-mono text-primary-400 text-sm">{loggedInRestaurant.id}</span>
            </div>
          </div>

          {/* Action cards */}
          <div className="space-y-5 animate-fade-in-up" style={{ animationDelay: '0.15s', animationFillMode: 'both' }}>
            {/* Print QR Codes */}
            <button
              onClick={() => downloadQrCodes(loggedInRestaurant.tables, loggedInRestaurant.name)}
              className="w-full relative overflow-hidden bg-white/[0.03] hover:bg-white/[0.07] border border-white/10 hover:border-primary-500/40 text-white px-7 py-7 rounded-3xl font-semibold transition-all duration-500 group flex items-center gap-5"
            >
              {/* Shimmer effect on hover */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary-500/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <div className="w-16 h-16 bg-gradient-to-br from-primary-500/15 to-primary-500/5 group-hover:from-primary-500/25 group-hover:to-primary-500/10 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary-500/20 relative">
                <QrCode className="w-8 h-8 text-primary-500" />
              </div>
              <div className="text-left flex-1 relative">
                <div className="text-white font-bold text-xl mb-1 group-hover:text-primary-100 transition-colors">Print QR Codes</div>
                <div className="text-gray-500 text-sm font-normal group-hover:text-gray-400 transition-colors">Printable codes for all {loggedInRestaurant.tables.length} tables</div>
              </div>
              <ArrowRight className="w-6 h-6 text-gray-600 group-hover:text-primary-400 group-hover:translate-x-2 transition-all duration-300 relative" />
            </button>

            {/* Kitchen Dashboard */}
            <a
              href={`https://kitchen.pingdish.com/${loggedInRestaurant.id}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full relative overflow-hidden bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-400 hover:to-primary-500 text-white px-7 py-7 rounded-3xl font-semibold transition-all duration-500 hover:shadow-2xl hover:shadow-primary-500/30 group flex items-center gap-5"
            >
              {/* Animated shine */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {/* Subtle pulse border */}
              <div className="absolute inset-0 rounded-3xl border border-white/20" style={{ animation: 'ring-pulse 3s ease-in-out infinite' }} />
              <div className="w-16 h-16 bg-white/15 group-hover:bg-white/25 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 relative">
                <MonitorSmartphone className="w-8 h-8 text-white" />
              </div>
              <div className="text-left flex-1 relative">
                <div className="text-white font-bold text-xl mb-1">Open Kitchen Dashboard</div>
                <div className="text-white/50 text-sm font-normal group-hover:text-white/70 transition-colors">Monitor tables & pings in real-time</div>
              </div>
              <ArrowRight className="w-6 h-6 text-white/50 group-hover:text-white group-hover:translate-x-2 transition-all duration-300 relative" />
            </a>
          </div>

          {/* Sign out */}
          <div className="text-center mt-10 animate-fade-in-up" style={{ animationDelay: '0.3s', animationFillMode: 'both' }}>
            <button onClick={() => { setLoggedInRestaurant(null); setLoginForm({ restaurantId: '', password: '' }); }} className="text-gray-600 hover:text-gray-300 text-sm transition-all duration-300 inline-flex items-center gap-2 hover:gap-3 px-4 py-2 rounded-xl hover:bg-white/5">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" />
              Sign out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4 relative">
      <div className="grid-pattern absolute inset-0 z-0 opacity-30" />

      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <a href="#" className="inline-flex items-center gap-2.5">
            <div className="w-11 h-11 bg-primary-500 rounded-xl flex items-center justify-center">
              <Bell className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-white tracking-tight">PingDish</span>
          </a>
        </div>

        {/* Login Card */}
        <div className="glass-card rounded-3xl p-5 sm:p-8 md:p-10 border border-white/10 shadow-2xl">
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-primary-500/10 border border-primary-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LogIn className="w-7 h-7 text-primary-500" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-white mb-2">Welcome back</h1>
            <p className="text-gray-500 text-sm">Sign in to manage your restaurant</p>
          </div>

          {loginError && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <div className="w-5 h-5 bg-red-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                <X className="w-3 h-3 text-red-400" />
              </div>
              <p className="text-red-400 text-sm">{loginError}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Restaurant ID *</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <ChefHat className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  required
                  value={loginForm.restaurantId}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, restaurantId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                  className="w-full pl-11 pr-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors font-mono text-sm"
                  placeholder="the-cozy-bistro"
                />
              </div>
              <p className="text-xs text-gray-600 mt-1">The unique ID given to you when your restaurant was registered</p>
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">Password *</label>
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full pl-11 pr-12 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoggingIn}
              className="w-full bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoggingIn ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign In to Dashboard
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-gray-600 text-xs">Need help?</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Help links */}
          <div className="space-y-3">
            <a
              href="#contact-sales"
              className="block w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-center py-3 rounded-xl text-sm font-medium transition-all"
            >
              Don't have an account? Get Started
            </a>
            <p className="text-center text-gray-600 text-xs">
              Forgot your credentials?{' '}
              <a href="#contact-sales" className="text-primary-400 hover:text-primary-300 transition-colors">
                Reach out to our team
              </a>
            </p>
          </div>
        </div>

        {/* Back to landing */}
        <div className="text-center mt-6">
          <a href="#" className="text-gray-500 hover:text-gray-300 text-sm transition-colors inline-flex items-center gap-1.5">
            <ArrowRight className="w-3.5 h-3.5 rotate-180" />
            Back to PingDish
          </a>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [formData, setFormData] = useState<FormData>({ restaurantName: '', restaurantId: '', numberOfTables: '', ownerEmail: '', password: '', confirmPassword: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', company: '', tables: '', message: '' });
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [isLoginRoute, setIsLoginRoute] = useState(false);
  const [isAdminPanel, setIsAdminPanel] = useState(false);

  // Hash-based routing: #admin-register (admin only), #login (restaurant owners), #admin (admin panel)
  useEffect(() => {
    const checkRoute = () => {
      const hash = window.location.hash;
      setIsAdminRoute(hash === '#admin-register');
      setIsLoginRoute(hash === '#login');
      setIsAdminPanel(hash === '#admin');
    };
    checkRoute();
    window.addEventListener('hashchange', checkRoute);
    return () => window.removeEventListener('hashchange', checkRoute);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'restaurantName') {
      const slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, restaurantId: slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    // Validate passwords
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      setIsSubmitting(false);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsSubmitting(false);
      return;
    }

    try {
      const { confirmPassword, ...submitData } = formData;
      const res = await apiFetch(`${API_URL}/restaurants`, {
        method: 'POST',
        body: JSON.stringify({ ...submitData, numberOfTables: parseInt(submitData.numberOfTables, 10) })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Admin panel — full-screen route for PingDish admins
  if (isAdminPanel) {
    return <AdminPanel apiUrl={API_URL} apiFetch={apiFetch} />;
  }

  // Login page — full-screen route for restaurant owners
  if (isLoginRoute) {
    return <LoginPage />;
  }

  // Success screen after registration
  if (result) {
    return (
      <div className="min-h-screen bg-navy-950 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-navy-800 rounded-3xl shadow-2xl p-8 border border-white/5">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-500/20 rounded-full mb-4">
              <Check className="w-8 h-8 text-primary-500" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">Welcome to PingDish!</h2>
            <p className="text-gray-400">Your restaurant has been registered successfully.</p>
          </div>
          <div className="space-y-6">
            <div className="bg-primary-500/10 border border-primary-500/20 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-primary-500" /> Kitchen Dashboard
              </h3>
              {/* [FIX 4.5] Validate kitchen URL before rendering as link */}
              {isValidKitchenUrl(result.kitchenUrl) ? (
                <a href={result.kitchenUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block bg-primary-500 text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary-600 transition-colors">
                  Open Dashboard <ArrowRight className="w-4 h-4 inline ml-1" />
                </a>
              ) : (
                <p className="text-red-400 font-semibold">Invalid dashboard URL received. Please contact support.</p>
              )}
              <p className="text-sm text-gray-500 mt-2 font-mono">{result.kitchenUrl}</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-gray-400" /> Table QR Codes
              </h3>
              <button onClick={() => downloadQrCodes(result.tables, formData.restaurantName)}
                className="inline-block bg-white/10 text-white px-6 py-3 rounded-xl font-semibold hover:bg-white/20 transition-colors mb-4">
                <Download className="w-4 h-4 inline mr-2" /> Print All QR Codes
              </button>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                {result.tables.slice(0, 12).map(t => (
                  <div key={t.tableNumber} className="bg-white/5 p-2 rounded-xl border border-white/10 text-center">
                    <img src={getQrCodeUrl(t.qrUrl, 100)} alt={`Table ${t.tableNumber}`} className="w-16 h-16 mx-auto rounded" />
                    <p className="text-xs font-semibold mt-1 text-gray-300">Table {t.tableNumber}</p>
                  </div>
                ))}
                {result.tables.length > 12 && (
                  <div className="bg-white/5 p-2 rounded-xl border border-white/10 text-center flex items-center justify-center">
                    <p className="text-xs text-gray-500">+{result.tables.length - 12} more</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950">
      {/* ─── NAVIGATION ─── */}
      <nav className="fixed top-0 w-full z-50 bg-navy-950/80 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white tracking-tight">PingDish</span>
          </div>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Features</a>
            <a href="#how-it-works" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">How It Works</a>
            <a href="#pricing" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Pricing</a>
            <a href="#contact-sales" className="text-gray-400 hover:text-white transition-colors text-sm font-medium">Contact</a>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <a href="#login" className="text-gray-400 hover:text-white transition-colors text-sm font-medium flex items-center gap-1.5 px-3 py-2.5">
              <LogIn className="w-4 h-4" />
              Login
            </a>
            <a href="#contact-sales" className="bg-primary-500 hover:bg-primary-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-all hover:shadow-lg hover:shadow-primary-500/25">
              Get Started
            </a>
          </div>

          {/* Mobile menu toggle */}
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden text-white">
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-navy-900 border-t border-white/5 px-6 py-4 space-y-3">
            <a href="#features" className="block text-gray-400 hover:text-white py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#how-it-works" className="block text-gray-400 hover:text-white py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>How It Works</a>
            <a href="#pricing" className="block text-gray-400 hover:text-white py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#contact-sales" className="block text-gray-400 hover:text-white py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>Contact</a>
            <div className="border-t border-white/5 pt-3 mt-1 flex flex-col gap-2">
              <a href="#login" className="block bg-white/5 border border-white/10 text-white px-5 py-2.5 rounded-xl text-sm font-semibold text-center flex items-center justify-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <LogIn className="w-4 h-4" />
                Login to Dashboard
              </a>
              <a href="#contact-sales" className="block bg-primary-500 text-white px-5 py-2.5 rounded-xl text-sm font-semibold text-center" onClick={() => setMobileMenuOpen(false)}>
                Get Started
              </a>
            </div>
          </div>
        )}
      </nav>

      {/* ─── HERO SECTION ─── */}
      <section className="hero-gradient min-h-screen flex items-center pt-20 relative">
        <div className="grid-pattern absolute inset-0 z-0" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8 lg:gap-12 items-center">
            {/* Left - Text */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                <span className="text-primary-400 text-xs font-medium tracking-wide uppercase">Now Live</span>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-7xl font-extrabold text-white leading-[1.05] mb-6">
                Your customers{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                  shouldn't wait
                </span>{' '}
                to be served
              </h1>

              <p className="text-base sm:text-lg md:text-xl text-gray-400 leading-relaxed mb-10 max-w-lg">
                One scan. One tap. Kitchen notified instantly. PingDish replaces hand-waving and waiting with real-time table-to-kitchen communication.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4 max-w-md">
                <a
                  href="#contact-sales"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-base sm:text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25 flex items-center gap-2"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#how-it-works"
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-2xl font-semibold text-base sm:text-lg transition-all flex items-center gap-2"
                >
                  See How It Works
                </a>
              </div>

              <p className="text-gray-600 text-xs mt-4">Free for small restaurants. Enterprise plans for chains.</p>
            </div>

            {/* Right - Animated Story Visual */}
            <HeroAnimation />
          </div>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-navy-950 to-transparent z-10" />
      </section>

      {/* ─── TRUSTED BY / STATS BAR ─── */}
      <StatsBar />

      {/* ─── FEATURES ─── */}
      <section id="features" className="bg-navy-950 py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">Features</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3 mb-4">
              Everything you need to{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                delight customers
              </span>
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
              PingDish bridges the gap between your tables and kitchen — no hardware, no training, no friction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <Bell className="w-7 h-7" />,
                title: 'Zero Wait Time',
                desc: 'Customers tap once — your kitchen knows instantly. No more hand-waving or ignored tables.',
                color: 'from-primary-500/20 to-primary-600/5',
              },
              {
                icon: <QrCode className="w-7 h-7" />,
                title: 'No App Required',
                desc: 'Customers scan a QR code with their phone camera. Works instantly — no downloads, no sign-ups.',
                color: 'from-blue-500/20 to-blue-600/5',
              },
              {
                icon: <Zap className="w-7 h-7" />,
                title: 'Real-Time Sync',
                desc: 'WebSocket-powered live updates. Kitchen sees every ping the moment it happens across all devices.',
                color: 'from-yellow-500/20 to-yellow-600/5',
              },
              {
                icon: <Clock className="w-7 h-7" />,
                title: 'Serve Smarter',
                desc: 'See which tables need attention, who\'s being served, and track your team\'s response times.',
                color: 'from-emerald-500/20 to-emerald-600/5',
              },
            ].map((feature, i) => (
              <div key={i} className="feature-card glass-card rounded-2xl p-5 sm:p-6 md:p-7 group cursor-default">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section id="how-it-works" className="bg-navy-900 py-24 relative overflow-hidden">
        <div className="grid-pattern absolute inset-0 z-0 opacity-50" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">How It Works</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3 mb-4">
              Set up in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                3 simple steps
              </span>
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
              From sign-up to first ping in under 2 minutes. No technical knowledge needed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-4 md:gap-6 lg:gap-8">
            {[
              {
                step: '01',
                icon: <ChefHat className="w-8 h-8" />,
                title: 'Sign up your restaurant',
                desc: 'Reach out to us — we set up your account, generate table QR codes, and get you live in minutes.',
              },
              {
                step: '02',
                icon: <QrCode className="w-8 h-8" />,
                title: 'Place QR codes on tables',
                desc: 'Download and print unique QR codes for each table. Stick them where customers can easily scan.',
              },
              {
                step: '03',
                icon: <Smartphone className="w-8 h-8" />,
                title: 'Customers ping, you serve',
                desc: 'Customers scan and tap to notify your kitchen in real-time. No app install, no waiting around.',
              },
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="glass-card rounded-2xl p-5 sm:p-6 md:p-8 h-full hover:border-primary-500/20 transition-all">
                  <div className="text-4xl sm:text-5xl md:text-6xl font-black text-white/5 absolute top-4 right-6">{step.step}</div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500 mb-5">
                    {step.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">{step.title}</h3>
                  <p className="text-gray-500 leading-relaxed">{step.desc}</p>
                </div>
                {/* Connector arrow for desktop */}
                {i < 2 && (
                  <div className="hidden md:block absolute top-1/2 -right-4 transform -translate-y-1/2 z-20">
                    <ArrowRight className="w-6 h-6 text-primary-500/30" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="pricing" className="bg-navy-950 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">Pricing</span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3 mb-4">
              Plans that{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                scale with you
              </span>
            </h2>
            <p className="text-gray-500 text-base sm:text-lg max-w-2xl mx-auto">
              Start free, upgrade when you need more. Enterprise solutions for restaurant chains and franchises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 max-w-4xl mx-auto">
            {/* ── Free Plan ── */}
            <div className="relative bg-gradient-to-br from-navy-800 to-navy-900 rounded-3xl p-5 sm:p-6 md:p-8 border border-white/10 shadow-xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Starter</h3>
                <p className="text-gray-500 text-sm">Perfect for single-location restaurants</p>
              </div>

              <div className="mb-6">
                <div className="text-4xl sm:text-5xl font-black text-white mb-1">$0<span className="text-lg font-medium text-gray-500">/mo</span></div>
                <p className="text-gray-500 text-sm">Free forever</p>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Up to 3 tables',
                  'Real-time notifications',
                  'Kitchen dashboard',
                  'Printable QR codes',
                  'Customer feedback',
                  'Mobile-optimized view',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary-500" />
                    </div>
                    <span className="text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
          </div>

            {/* ── Enterprise Plan ── */}
            <div className="relative bg-gradient-to-br from-navy-800 to-navy-900 rounded-3xl p-5 sm:p-6 md:p-8 border border-primary-500/20 shadow-2xl shadow-primary-500/5">
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <span className="bg-primary-500 text-white text-xs font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                  Most Popular
                </span>
              </div>

              <div className="mb-6 pt-2">
                <div className="flex items-center gap-2 mb-1">
                  <Crown className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-bold text-white">Enterprise</h3>
                </div>
                <p className="text-gray-500 text-sm">For chains, franchises & large venues</p>
              </div>

              <div className="mb-6">
                <div className="text-3xl sm:text-4xl font-black text-white mb-1">Custom</div>
                <p className="text-gray-500 text-sm">Tailored to your scale</p>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Unlimited tables & locations',
                  'Multi-branch dashboard',
                  'Advanced analytics & reports',
                  'Priority WebSocket infrastructure',
                  'Dedicated account manager',
                  'Custom branding & white-label',
                  'API access & integrations',
                  'SLA & priority support',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-5 h-5 bg-primary-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-3 h-3 text-primary-500" />
                    </div>
                    <span className="text-gray-300 text-sm">{item}</span>
                  </div>
                ))}
              </div>
          </div>
          </div>
        </div>
      </section>

      {/* ─── CONTACT SALES ─── */}
      <section id="contact-sales" className="bg-navy-900 py-24 relative overflow-hidden">
        <div className="grid-pattern absolute inset-0 z-0 opacity-30" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {/* Left — Info */}
            <div>
              <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">Contact Sales</span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mt-3 mb-6">
                Let's find the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                  right plan
                </span>{' '}
                for you
              </h2>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-10">
                Whether you run a single restaurant or a nationwide franchise, our team will build a custom package that fits your needs and budget.
              </p>

              <div className="space-y-6">
                {[
                  {
                    icon: <Building2 className="w-6 h-6" />,
                    title: 'Multi-Location Support',
                    desc: 'Manage all your branches from one centralized dashboard with unified analytics.',
                  },
                  {
                    icon: <Headphones className="w-6 h-6" />,
                    title: 'Dedicated Support',
                    desc: 'Get a dedicated account manager and priority support with guaranteed response times.',
                  },
                  {
                    icon: <Globe className="w-6 h-6" />,
                    title: 'Custom Integrations',
                    desc: 'Connect PingDish with your POS, CRM, or any third-party tool via our API.',
                  },
                ].map((item, i) => (
                  <div key={i} className="flex gap-4">
                    <div className="w-12 h-12 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500 flex-shrink-0">
                      {item.icon}
                    </div>
                    <div>
                      <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                      <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — Contact Form */}
            <div className="glass-card rounded-3xl p-5 sm:p-8 md:p-10 border border-white/10 shadow-2xl">
              {contactSubmitted ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Check className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Message Sent!</h3>
                  <p className="text-gray-400 mb-6">Our sales team will get back to you within 24 hours.</p>
                  <button
                    onClick={() => { setContactSubmitted(false); setContactForm({ name: '', email: '', company: '', tables: '', message: '' }); }}
                    className="text-primary-400 hover:text-primary-300 text-sm font-medium transition-colors"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3 mb-8">
                    <div className="w-10 h-10 bg-primary-500 rounded-xl flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-white">Reach Out to Our Team</h3>
                      <p className="text-gray-500 text-xs">We typically respond within a few hours</p>
                    </div>
                  </div>

                  <form
                    onSubmit={async (e) => {
                      e.preventDefault();
                      try {
                        await apiFetch(`${API_URL}/enquiries`, {
                          method: 'POST',
                          body: JSON.stringify(contactForm),
                        });
                      } catch {}
                      setContactSubmitted(true);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Full Name *</label>
                        <input
                          type="text" required
                          value={contactForm.name}
                          onChange={(e) => setContactForm(prev => ({ ...prev, name: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors text-sm"
                          placeholder="John Doe"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Work Email *</label>
                        <input
                          type="email" required
                          value={contactForm.email}
                          onChange={(e) => setContactForm(prev => ({ ...prev, email: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors text-sm"
                          placeholder="john@restaurant.com"
                        />
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Company / Restaurant *</label>
                        <input
                          type="text" required
                          value={contactForm.company}
                          onChange={(e) => setContactForm(prev => ({ ...prev, company: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors text-sm"
                          placeholder="Bistro Chain Inc."
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-300 mb-1.5">Number of Locations</label>
                        <input
                          type="text"
                          value={contactForm.tables}
                          onChange={(e) => setContactForm(prev => ({ ...prev, tables: e.target.value }))}
                          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors text-sm"
                          placeholder="e.g. 5-10 locations"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">How can we help? *</label>
                      <textarea
                        required rows={4}
                        value={contactForm.message}
                        onChange={(e) => setContactForm(prev => ({ ...prev, message: e.target.value }))}
                        className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors text-sm resize-none"
                        placeholder="Tell us about your restaurant setup, the features you need, or any questions..."
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      Send Message
                    </button>

                    <p className="text-gray-600 text-xs text-center">
                      By submitting, you agree to be contacted by our sales team. No spam, ever.
                    </p>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── REGISTRATION FORM (Admin Only — access via #admin-register) ─── */}
      {isAdminRoute && (
        <section id="onboarding" className="bg-navy-900 py-24 relative overflow-hidden">
          <div className="grid-pattern absolute inset-0 z-0 opacity-30" />
          <div className="max-w-xl mx-auto px-6 relative z-10">
            <div className="glass-card rounded-3xl p-5 sm:p-8 md:p-10 border border-white/10 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 mb-4">
                  <Shield className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-medium tracking-wide uppercase">PingDish Admin</span>
                </div>
                <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Register Restaurant</h2>
                <p className="text-gray-500">Internal tool — create a restaurant account after sales approval.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Restaurant Name *</label>
                  <input
                    type="text" name="restaurantName" value={formData.restaurantName} onChange={handleInputChange} required
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors"
                    placeholder="The Cozy Bistro"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Restaurant ID (URL slug) *</label>
                  <input
                    type="text" name="restaurantId" value={formData.restaurantId} onChange={handleInputChange} required pattern="[a-z0-9-]+"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors font-mono text-sm"
                    placeholder="the-cozy-bistro"
                  />
                  <p className="text-xs text-gray-600 mt-1">Lowercase letters, numbers, and hyphens only</p>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Number of Tables *</label>
                  <input
                    type="number" name="numberOfTables" value={formData.numberOfTables} onChange={handleInputChange} required min="1" max="500"
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1.5">Owner Email *</label>
                  <input
                    type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleInputChange} required
                    className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors"
                    placeholder="owner@restaurant.com"
                  />
                </div>

                {/* Password section */}
                <div className="border-t border-white/5 pt-5 mt-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="w-4 h-4 text-primary-500" />
                    <span className="text-sm font-semibold text-gray-300">Dashboard Login Credentials</span>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">Password *</label>
                      <input
                        type="password" name="password" value={formData.password} onChange={handleInputChange} required minLength={8}
                        className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500/50 transition-colors"
                        placeholder="Min. 8 characters"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">Confirm Password *</label>
                      <input
                        type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange} required minLength={8}
                        className={`w-full px-4 py-3.5 bg-white/5 border rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-1 transition-colors ${
                          formData.confirmPassword && formData.password !== formData.confirmPassword
                            ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/50'
                            : 'border-white/10 focus:border-primary-500 focus:ring-primary-500/50'
                        }`}
                        placeholder="Re-enter password"
                      />
                      {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                        <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 mt-2">This password will be used by the restaurant owner to access their kitchen dashboard.</p>
                </div>

                <button
                  type="submit" disabled={isSubmitting}
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-base sm:text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Setting up...
                    </span>
                  ) : (
                    <>Register Restaurant <ArrowRight className="w-4 h-4 inline ml-1" /></>
                  )}
                </button>
              </form>
            </div>
          </div>
        </section>
      )}

      {/* ─── FOOTER ─── */}
      <footer className="bg-navy-950 border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-primary-500 rounded-xl flex items-center justify-center">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">PingDish</span>
            </div>

            <div className="flex items-center gap-4 md:gap-6 text-xs sm:text-sm">
              <a href="#features" className="text-gray-500 hover:text-gray-300 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-500 hover:text-gray-300 transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-500 hover:text-gray-300 transition-colors">Pricing</a>
              <a href="#contact-sales" className="text-gray-500 hover:text-gray-300 transition-colors">Contact</a>
            </div>

            <p className="text-gray-600 text-xs sm:text-sm">&copy; 2026 PingDish. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
