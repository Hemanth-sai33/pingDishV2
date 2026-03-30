import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bell, QrCode, Zap, Clock, Check, Download, ExternalLink, ArrowRight, ChefHat, Smartphone, BarChart3, Shield, Menu, X, Star, Users, Timer, UtensilsCrossed, Sparkles, MonitorSmartphone, MessageSquare, Send, Building2, Headphones, Globe, Crown, Eye, EyeOff, Lock, LogIn, Quote, BookOpen, Wand2 } from 'lucide-react';
import { escapeHtml, isValidKitchenUrl } from './utils/security';

/* ═══════════════════════════════════════════════════════
   SCROLL REVEAL HOOK — Animate elements on scroll
   ═══════════════════════════════════════════════════════ */

function useScrollReveal() {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale, .reveal-stagger').forEach(el => {
      observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);
}

/* ═══════════════════════════════════════════════════════
   TESTIMONIALS — Social proof from restaurant owners
   ═══════════════════════════════════════════════════════ */

function Testimonials() {
  const testimonials = [
    {
      name: 'Priya Sharma',
      role: 'Owner, Spice Garden',
      text: 'Our kitchen response time dropped by 40% after installing PingDish. Customers love the QR code experience — no more waving hands or waiting forever.',
      rating: 5,
      avatar: 'PS',
    },
    {
      name: 'Rajesh Kumar',
      role: 'Manager, The Biryani House',
      text: 'The real-time dashboard is a game-changer. We can see exactly which tables need attention. Our Google reviews improved from 3.8 to 4.5 stars in two months.',
      rating: 5,
      avatar: 'RK',
    },
    {
      name: 'Ananya Patel',
      role: 'Co-founder, Café Bloom',
      text: 'Setup took literally 5 minutes. We printed QR codes, stuck them on tables, and started receiving pings the same evening. Brilliant simplicity.',
      rating: 5,
      avatar: 'AP',
    },
  ];

  return (
    <section className="bg-navy-950 py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-16 reveal-up">
          <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3 mb-4">
            Loved by{' '}
            <span className="animated-gradient-text">restaurant owners</span>
          </h2>
          <p className="text-gray-500 text-lg max-w-2xl mx-auto">
            Don't just take our word for it — hear from restaurants already using PingDish.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 reveal-stagger reveal-up">
          {testimonials.map((t, i) => (
            <div key={i} className="glass-card rounded-2xl p-8 testimonial-hover transition-all duration-300 reveal-up" style={{animationDelay: `${i * 0.15}s`}}>
              <Quote className="w-8 h-8 text-primary-500/30 mb-4" />
              <p className="text-gray-300 leading-relaxed mb-6 text-sm">{t.text}</p>
              <div className="flex items-center gap-3 mt-auto">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm font-bold">
                  {t.avatar}
                </div>
                <div>
                  <div className="text-white font-semibold text-sm">{t.name}</div>
                  <div className="text-gray-500 text-xs">{t.role}</div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════
   SOCIAL PROOF TICKER — Trust bar
   ═══════════════════════════════════════════════════════ */

function SocialProofTicker() {
  const items = [
    '🍕 Pizza Palace just joined PingDish',
    '⭐ 4.9/5 average customer rating',
    '🔔 10,000+ pings sent this week',
    '🏆 #1 table service tool in India',
    '🚀 Setup in under 5 minutes',
    '💚 Free for restaurants under 30 tables',
    '🍜 Noodle Barn improved response time by 50%',
    '📱 Works on any smartphone — no app needed',
  ];

  return (
    <div className="bg-navy-900 border-y border-white/5 py-3 overflow-hidden relative">
      <div className="ticker-scroll flex whitespace-nowrap gap-12">
        {[...items, ...items].map((item, i) => (
          <span key={i} className="text-gray-500 text-sm font-medium flex items-center gap-2 shrink-0">
            {item}
            <span className="text-primary-500/30">·</span>
          </span>
        ))}
      </div>
    </div>
  );
}

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
    const safeUrl = encodeURI(getQrCodeUrl(t.qrUrl, 150));
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
    <div className={`absolute inset-0 flex flex-col p-6 transition-all duration-500 ${scene === 0 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
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
      <div className={`absolute inset-0 flex flex-col p-5 transition-all duration-500 ${scene === 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
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
    <div className={`absolute inset-0 flex flex-col items-center justify-center p-6 transition-all duration-500 ${scene === 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
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
    <div className="relative hidden lg:flex items-center justify-center animate-slide-in-right">
      <div className="relative w-full max-w-md">
        {/* Phone frame */}
        <div className="relative bg-navy-800 rounded-[2.5rem] p-3 shadow-2xl shadow-primary-500/10 border border-white/10">
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

        {/* Floating contextual cards */}
        {renderFloatingCards()}
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
    <div ref={ref} className="glass-card rounded-2xl p-6 text-center stat-shimmer">
      <div className="text-primary-500 mb-2 flex justify-center">{icon}</div>
      <div className="text-3xl md:text-4xl font-extrabold text-white mb-1 tabular-nums">
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
  const [searchQuery, setSearchQuery] = useState('');
  const [loginFocused, setLoginFocused] = useState(false);

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

  /* ═══ Premium Pill Button Component ═══ */
  const PillButton = ({ children, variant = 'outline', onClick, type, className = '' }: { children: React.ReactNode; variant?: 'outline' | 'solid'; onClick?: () => void; type?: 'submit' | 'button'; className?: string }) => (
    <button type={type || 'button'} onClick={onClick}
      className={`admin-pill-btn relative rounded-full transition-all duration-300 group ${className}`}
      style={{ padding: '1px' }}>
      <span className="admin-pill-glow" />
      <span className={`relative z-10 block rounded-full font-medium text-sm transition-all duration-300 ${
        variant === 'solid'
          ? 'bg-gradient-to-b from-orange-400 to-orange-600 text-white hover:from-orange-500 hover:to-orange-700 shadow-lg shadow-orange-500/25'
          : 'bg-[#080e1a] text-white hover:bg-[#0d1526]'
      }`} style={{ padding: '11px 29px' }}>
        {children}
      </span>
    </button>
  );

  /* ═══ LOGIN — Full-screen hero with video background ═══ */
  if (!loggedIn) {
    return (
      <div className="admin-hero-login min-h-screen relative overflow-hidden" style={{ fontFamily: "'General Sans', 'Inter', system-ui, sans-serif" }}>
        {/* Background video */}
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4"
        />
        {/* Dark overlay with orange tint */}
        <div className="absolute inset-0 bg-[#080e1a]/70" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#080e1a]/40 via-transparent to-[#080e1a]/90" />

        {/* Navbar */}
        <nav className="relative z-20 flex items-center justify-between" style={{ padding: '20px 40px' }}>
          <div className="flex items-center gap-8">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white tracking-tight">PingDish</span>
            </a>
            {/* Nav links — hidden on mobile */}
            <div className="hidden md:flex items-center" style={{ gap: '30px' }}>
              {['Dashboard', 'Restaurants', 'Analytics', 'Settings'].map(link => (
                <span key={link} className="text-white/70 text-sm font-medium cursor-default hover:text-white transition-colors flex items-center" style={{ gap: '6px' }}>
                  {link}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-50"><polyline points="6 9 12 15 18 9"/></svg>
                </span>
              ))}
            </div>
          </div>
          <a href="/">
            <PillButton variant="outline">
              <span className="flex items-center gap-2">
                <Globe className="w-4 h-4" /> Back to Site
              </span>
            </PillButton>
          </a>
        </nav>

        {/* Hero content — centered */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center" style={{ paddingTop: 'clamp(120px, 20vh, 280px)', paddingBottom: '102px' }}>
          <div className="flex flex-col items-center" style={{ gap: '40px' }}>
            {/* Badge pill */}
            <div className="admin-badge-pill inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2" style={{ background: 'rgba(255,255,255,0.06)' }}>
              <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-white/50 text-xs font-medium">Admin Console</span>
              <span className="text-orange-400 text-xs font-medium">Authorized Access Only</span>
            </div>

            {/* Heading with gradient */}
            <h1 className="admin-hero-heading font-medium leading-tight" style={{ maxWidth: '613px', fontSize: 'clamp(36px, 5vw, 56px)', lineHeight: '1.28' }}>
              Command Center for PingDish
            </h1>

            {/* Subtitle */}
            <p className="text-white/60 font-normal leading-relaxed" style={{ maxWidth: '680px', fontSize: '15px', marginTop: '-16px' }}>
              Manage restaurant onboarding, review enquiries, monitor platform health, and keep your ecosystem running at peak performance — all from one place.
            </p>

            {/* Login card — floating glass */}
            <form onSubmit={handleLogin} className="w-full" style={{ maxWidth: '420px' }}>
              <div className={`admin-login-card rounded-2xl p-8 transition-all duration-500 ${loginFocused ? 'admin-login-card-focused' : ''}`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 border border-orange-500/20 flex items-center justify-center">
                    <Lock className="w-5 h-5 text-orange-400" />
                  </div>
                  <div className="text-left">
                    <div className="text-white font-semibold text-sm">Secure Login</div>
                    <div className="text-white/40 text-xs">HMAC-SHA256 authenticated</div>
                  </div>
                </div>
                <div className="relative mb-5">
                  <input
                    type="password"
                    value={adminKey}
                    onChange={e => setAdminKey(e.target.value)}
                    onFocus={() => setLoginFocused(true)}
                    onBlur={() => setLoginFocused(false)}
                    required
                    autoFocus
                    placeholder="Enter admin secret key"
                    className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/10 rounded-xl text-white placeholder-white/25 text-sm focus:border-orange-500/50 focus:outline-none focus:bg-white/[0.06] transition-all duration-300"
                  />
                  <Shield className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                </div>
                <PillButton variant="solid" type="submit" className="w-full">
                  <span className="flex items-center justify-center gap-2">
                    <LogIn className="w-4 h-4" /> Access Dashboard
                  </span>
                </PillButton>
              </div>
            </form>
          </div>
        </div>

        {/* Bottom ambient glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none" />
      </div>
    );
  }

  /* ═══ DASHBOARD — Premium admin interface ═══ */
  return (
    <div className="min-h-screen bg-[#060b14] text-white" style={{ fontFamily: "'General Sans', 'Inter', system-ui, sans-serif" }}>
      {/* Dashboard header with glass effect */}
      <header className="admin-dash-header sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex items-center justify-between" style={{ padding: '16px 32px' }}>
          <div className="flex items-center gap-4">
            <a href="/" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">PingDish</span>
            </a>
            <div className="h-6 w-px bg-white/10 mx-2 hidden md:block" />
            <span className="hidden md:block text-white/40 text-xs font-medium uppercase tracking-widest">Admin Console</span>
          </div>
          <div className="flex items-center gap-3">
            <PillButton variant="outline">
              <span className="flex items-center gap-2 text-xs">
                <Shield className="w-3.5 h-3.5 text-orange-400" /> Secured
              </span>
            </PillButton>
            <a href="/">
              <PillButton variant="outline">
                <span className="flex items-center gap-2 text-xs">
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Back to Site
                </span>
              </PillButton>
            </a>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto" style={{ padding: '32px 32px 64px' }}>
        {/* ═══ Stats Overview Cards — Premium Glass ═══ */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5 mb-10">
          {[
            { label: 'Restaurants', value: restaurants.length, icon: Building2, color: 'orange' },
            { label: 'Pending', value: enquiries.filter(e => e.Status === 'PENDING').length, icon: Clock, color: 'amber' },
            { label: 'Active', value: restaurants.filter(r => r.Status === 'ACTIVE').length, icon: Check, color: 'emerald' },
            { label: 'Total Tables', value: restaurants.reduce((sum: number, r: any) => sum + (parseInt(r.NumberOfTables) || 0), 0), icon: BarChart3, color: 'blue' },
          ].map((stat, i) => (
            <div key={i} className="admin-stat-card group relative overflow-hidden rounded-2xl p-5 transition-all duration-300 hover:scale-[1.02]">
              <div className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-3xl opacity-20 -translate-y-8 translate-x-8 transition-opacity group-hover:opacity-30 ${
                stat.color === 'orange' ? 'bg-orange-500' : stat.color === 'amber' ? 'bg-amber-500' : stat.color === 'emerald' ? 'bg-emerald-500' : 'bg-blue-500'
              }`} />
              <div className="relative z-10">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${
                  stat.color === 'orange' ? 'bg-orange-500/10 border border-orange-500/20' :
                  stat.color === 'amber' ? 'bg-amber-500/10 border border-amber-500/20' :
                  stat.color === 'emerald' ? 'bg-emerald-500/10 border border-emerald-500/20' :
                  'bg-blue-500/10 border border-blue-500/20'
                }`}>
                  <stat.icon className={`w-5 h-5 ${
                    stat.color === 'orange' ? 'text-orange-400' : stat.color === 'amber' ? 'text-amber-400' : stat.color === 'emerald' ? 'text-emerald-400' : 'text-blue-400'
                  }`} />
                </div>
                <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-[11px] text-white/40 font-semibold uppercase tracking-widest">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Toast */}
        {msg && (
          <div className={`admin-toast mb-8 px-5 py-4 rounded-2xl text-sm font-medium flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
            <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${msg.type === 'success' ? 'bg-emerald-500/20' : 'bg-red-500/20'}`}>
              {msg.type === 'success' ? '✓' : '✕'}
            </span>
            {msg.text}
          </div>
        )}

        {/* Tab bar + Search in a single row */}
        <div className="flex flex-col md:flex-row md:items-center gap-4 mb-8">
          <div className="flex gap-1 bg-white/[0.03] border border-white/5 rounded-2xl p-1.5 shrink-0">
            <button onClick={() => { setTab('enquiries'); loadEnquiries(filter); }}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${tab === 'enquiries' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
              Enquiries
            </button>
            <button onClick={() => { setTab('restaurants'); loadRestaurants(); }}
              className={`px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 ${tab === 'restaurants' ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/20' : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
              Restaurants
            </button>
          </div>
          <div className="relative flex-1">
            <input
              type="text"
              placeholder={tab === 'enquiries' ? 'Search enquiries by name, email, or company...' : 'Search restaurants by name, ID, or email...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="admin-search-input w-full pl-11 pr-4 py-3 bg-white/[0.03] border border-white/5 rounded-xl text-white placeholder-white/20 focus:border-orange-500/30 focus:outline-none focus:bg-white/[0.05] transition-all duration-300 text-sm"
            />
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </div>
        </div>

        {/* Enquiries Tab */}
        {tab === 'enquiries' && (
          <>
            <div className="flex items-center gap-2 mb-6">
              {['PENDING', 'APPROVED', 'DECLINED'].map(s => (
                <button key={s} onClick={() => { setFilter(s); loadEnquiries(s); }}
                  className={`px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-widest transition-all duration-300 border ${
                    filter === s
                      ? s === 'PENDING' ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' : s === 'APPROVED' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                      : 'border-white/5 text-white/30 hover:text-white/60 hover:border-white/10'
                  }`}>
                  {s}
                </button>
              ))}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="admin-spinner w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full" />
              </div>
            ) : enquiries.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-4">
                  <MessageSquare className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-white/30 text-sm">No {filter.toLowerCase()} enquiries</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {enquiries.filter(eq => {
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (eq.Company?.toLowerCase().includes(q) || eq.Name?.toLowerCase().includes(q) || eq.Email?.toLowerCase().includes(q));
                }).map(eq => (
                  <div key={eq.EnquiryId} className="admin-card group bg-white/[0.02] border border-white/5 rounded-2xl p-6 hover:border-orange-500/10 hover:bg-white/[0.03] transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/10 flex items-center justify-center">
                          <Building2 className="w-5 h-5 text-orange-400/70" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-white text-sm">{eq.Company}</h3>
                          <p className="text-white/30 text-xs">{eq.Name} · {eq.Email}</p>
                        </div>
                      </div>
                      <span className="text-white/20 text-xs font-mono">{eq.CreatedAt?.slice(0, 10)}</span>
                    </div>
                    {eq.Tables && <p className="text-white/30 text-xs mb-1 ml-13">Tables: {eq.Tables}</p>}
                    {eq.Message && (
                      <p className="text-white/40 text-sm mt-3 bg-white/[0.02] rounded-xl p-4 border border-white/5 italic leading-relaxed">
                        &ldquo;{eq.Message}&rdquo;
                      </p>
                    )}
                    {filter === 'PENDING' && (
                      <div className="flex gap-3 mt-5 pt-5 border-t border-white/5">
                        <button onClick={() => setApproveForm({ id: eq.EnquiryId, restaurantId: eq.Company.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''), restaurantName: eq.Company, numberOfTables: eq.Tables || '10' })}
                          className="admin-action-btn bg-emerald-500/10 hover:bg-emerald-500/15 text-emerald-400 border border-emerald-500/20 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2">
                          <Check className="w-4 h-4" /> Approve
                        </button>
                        <button onClick={() => handleDecline(eq.EnquiryId)}
                          className="admin-action-btn bg-red-500/10 hover:bg-red-500/15 text-red-400 border border-red-500/20 px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 flex items-center gap-2">
                          <X className="w-4 h-4" /> Decline
                        </button>
                      </div>
                    )}
                    {filter === 'APPROVED' && eq.RestaurantId && (
                      <p className="text-emerald-400/60 text-xs mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                        <Check className="w-3.5 h-3.5" /> Restaurant ID: <span className="font-mono text-emerald-400/80">{eq.RestaurantId}</span>
                      </p>
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
              <div className="flex items-center justify-center py-20">
                <div className="admin-spinner w-8 h-8 border-2 border-orange-500/20 border-t-orange-500 rounded-full" />
              </div>
            ) : restaurants.length === 0 ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-7 h-7 text-white/20" />
                </div>
                <p className="text-white/30 text-sm">No restaurants onboarded yet</p>
              </div>
            ) : (
              <div className="admin-table-wrapper overflow-x-auto rounded-2xl border border-white/5 bg-white/[0.015]">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-widest py-4 px-6">Restaurant</th>
                      <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-widest py-4 px-4">Owner</th>
                      <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-widest py-4 px-4">Email</th>
                      <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-widest py-4 px-4">Tables</th>
                      <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-widest py-4 px-4">Status</th>
                      <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-widest py-4 px-4">Created</th>
                      <th className="text-left text-[11px] font-semibold text-white/30 uppercase tracking-widest py-4 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {restaurants.filter(r => {
                      if (!searchQuery) return true;
                      const q = searchQuery.toLowerCase();
                      return (r.RestaurantName?.toLowerCase().includes(q) || r.RestaurantId?.toLowerCase().includes(q) || r.OwnerEmail?.toLowerCase().includes(q) || r.OwnerName?.toLowerCase().includes(q));
                    }).map(r => (
                      <tr key={r.RestaurantId} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/10 to-orange-600/5 border border-orange-500/10 flex items-center justify-center shrink-0">
                              <span className="text-orange-400 text-xs font-bold">{r.RestaurantName?.[0]}</span>
                            </div>
                            <div>
                              <div className="font-medium text-white text-sm">{r.RestaurantName}</div>
                              <div className="text-white/20 text-xs font-mono">{r.RestaurantId}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-white/50 text-sm">{r.OwnerName}</td>
                        <td className="py-4 px-4 text-white/50 text-sm">{r.OwnerEmail}</td>
                        <td className="py-4 px-4 text-white/50 text-sm text-center">{r.NumberOfTables}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${r.Status === 'ACTIVE' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border border-red-500/20 text-red-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${r.Status === 'ACTIVE' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                            {r.Status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-white/30 text-xs font-mono">{r.CreatedAt?.slice(0, 10)}</td>
                        <td className="py-4 px-4">
                          <button onClick={() => handleResetPassword(r.RestaurantId)}
                            className="text-orange-400/70 hover:text-orange-400 text-xs font-medium transition-all duration-300 hover:underline underline-offset-4">
                            Reset Password
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Approve Modal — Premium Glass */}
        {approveForm && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 admin-modal-overlay">
            <div className="admin-modal bg-[#0a1120] border border-white/10 rounded-3xl p-8 w-full max-w-md shadow-2xl shadow-black/50 relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Check className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Approve Restaurant</h3>
                  <p className="text-white/30 text-xs">Credentials will be auto-generated and emailed</p>
                </div>
              </div>
              <div className="space-y-4 mb-8">
                <div>
                  <label className="block text-[11px] font-semibold text-white/30 mb-1.5 uppercase tracking-widest">Restaurant ID (URL slug)</label>
                  <input value={approveForm.restaurantId} onChange={e => setApproveForm({ ...approveForm, restaurantId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/5 rounded-xl text-white font-mono text-sm focus:border-orange-500/30 focus:outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-white/30 mb-1.5 uppercase tracking-widest">Restaurant Name</label>
                  <input value={approveForm.restaurantName} onChange={e => setApproveForm({ ...approveForm, restaurantName: e.target.value })}
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/5 rounded-xl text-white text-sm focus:border-orange-500/30 focus:outline-none transition-all duration-300" />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-white/30 mb-1.5 uppercase tracking-widest">Number of Tables</label>
                  <input type="number" value={approveForm.numberOfTables} onChange={e => setApproveForm({ ...approveForm, numberOfTables: e.target.value })} min="1"
                    className="w-full px-4 py-3 bg-white/[0.04] border border-white/5 rounded-xl text-white text-sm focus:border-orange-500/30 focus:outline-none transition-all duration-300" />
                </div>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setApproveForm(null)} className="flex-1 bg-white/[0.04] hover:bg-white/[0.08] py-3 rounded-xl text-sm font-medium transition-all duration-300 border border-white/5">Cancel</button>
                <button onClick={handleApprove} className="flex-1 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-lg shadow-emerald-500/20">Approve & Send</button>
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

      // Store auth token if returned
      if (data.token) {
        localStorage.setItem('pingdish_token', data.token);
        localStorage.setItem('pingdish_restaurant', loginForm.restaurantId);
      }

      // Redirect to kitchen dashboard
      window.location.href = `https://kitchen.pingdish.com/${loginForm.restaurantId}`;
    } catch (err) {
      setLoginError(err instanceof Error ? err.message : 'Login failed. Please try again.');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden" style={{ fontFamily: "'Poppins', 'Inter', system-ui, sans-serif" }}>
      {/* Background video */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
        src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260315_073750_51473149-4350-4920-ae24-c8214286f323.mp4"
      />
      {/* Dark overlay with warm orange undertone */}
      <div className="absolute inset-0 z-[1] bg-[#080e1a]/40" />

      {/* Two-panel split layout */}
      <div className="relative z-10 flex min-h-screen">

        {/* ─── LEFT PANEL (52%) — Hero branding ─── */}
        <div className="w-full lg:w-[52%] relative flex flex-col">
          {/* Liquid glass strong overlay — orange-tinted */}
          <div className="liquid-glass-orange absolute inset-4 lg:inset-6 rounded-3xl" />

          {/* Nav */}
          <nav className="relative z-20 flex items-center justify-between px-8 lg:px-12 pt-6 lg:pt-8">
            <a href="#" className="flex items-center gap-2.5">
              <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Bell className="w-4.5 h-4.5 text-white" />
              </div>
              <span className="text-2xl font-semibold text-white tracking-tighter">PingDish</span>
            </a>
            <a href="#" className="liquid-glass rounded-full px-4 py-2 text-white/80 text-sm font-medium flex items-center gap-2 hover:scale-105 transition-transform">
              <ArrowRight className="w-3.5 h-3.5 rotate-180" /> Home
            </a>
          </nav>

          {/* Hero content — centered */}
          <div className="relative z-10 flex-1 flex flex-col items-start justify-center px-8 lg:px-12 py-12">
            {/* Logo mark — orange accent */}
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-3xl flex items-center justify-center mb-8 backdrop-blur-sm" style={{ background: 'rgba(249, 115, 22, 0.12)', boxShadow: '0 0 40px rgba(249, 115, 22, 0.08)' }}>
              <Bell className="w-8 h-8 lg:w-10 lg:h-10 text-orange-400" />
            </div>

            {/* Heading — orange gradient on italic */}
            <h1 className="text-5xl lg:text-7xl font-medium text-white tracking-[-0.05em] leading-[1.05] mb-6" style={{ fontFamily: "'Poppins', sans-serif" }}>
              Welcome to<br />
              <span style={{ fontFamily: "'Source Serif 4', Georgia, serif" }} className="italic text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-300">your kitchen</span>{' '}
              hub
            </h1>

            {/* Subtitle */}
            <p className="text-white/50 text-sm leading-relaxed max-w-sm mb-8 lg:mb-0">
              Sign in to access your real-time kitchen dashboard, manage tables, and respond to customer pings instantly.
            </p>

            {/* Mobile login form — shown only below lg breakpoint */}
            <div className="w-full lg:hidden mt-4">
              <div className="liquid-glass-orange rounded-3xl p-6">
                {loginError && (
                  <div className="bg-red-500/10 rounded-xl p-3 mb-4 flex items-start gap-2">
                    <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-xs">{loginError}</p>
                  </div>
                )}
                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-orange-400/50 mb-1.5 uppercase tracking-widest">Restaurant ID</label>
                    <input
                      type="text" required autoFocus
                      value={loginForm.restaurantId}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, restaurantId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                      className="w-full px-4 py-3 bg-white/[0.04] rounded-xl text-white placeholder-white/20 text-sm font-mono focus:outline-none focus:bg-orange-500/[0.04] transition-all"
                      style={{ border: '1px solid rgba(249,115,22,0.1)', boxShadow: 'inset 0 1px 1px rgba(249,115,22,0.05)' }}
                      placeholder="the-cozy-bistro"
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-xs font-medium text-orange-400/50 mb-1.5 uppercase tracking-widest">Password</label>
                    <input
                      type={showPassword ? 'text' : 'password'} required
                      value={loginForm.password}
                      onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full px-4 py-3 pr-11 bg-white/[0.04] rounded-xl text-white placeholder-white/20 text-sm focus:outline-none focus:bg-orange-500/[0.04] transition-all"
                      style={{ border: '1px solid rgba(249,115,22,0.1)', boxShadow: 'inset 0 1px 1px rgba(249,115,22,0.05)' }}
                      placeholder="Enter your password"
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-[2.1rem] text-orange-400/30 hover:text-orange-400/60 transition-colors">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <button type="submit" disabled={isLoggingIn}
                    className="w-full rounded-full py-3.5 text-white text-sm font-medium flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/20">
                    {isLoggingIn ? (
                      <><div className="admin-spinner w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> Signing in...</>
                    ) : (
                      <><LogIn className="w-4 h-4" /> Sign In to Dashboard</>
                    )}
                  </button>
                </form>
                <div className="flex items-center gap-3 mt-5">
                  <div className="h-px flex-1 bg-orange-500/10" />
                  <span className="text-orange-400/30 text-xs">Need help?</span>
                  <div className="h-px flex-1 bg-orange-500/10" />
                </div>
                <a href="#contact-sales" className="block text-center text-orange-400/40 text-xs mt-3 hover:text-orange-400/70 transition-colors">
                  Don't have an account? Contact Sales
                </a>
              </div>
            </div>

            {/* Liquid glass pills — orange tinted */}
            <div className="hidden lg:flex flex-wrap gap-3 mt-8">
              {['Real-Time Alerts', 'WebSocket Powered', 'Multi-Branch Ready'].map(pill => (
                <span key={pill} className="liquid-glass rounded-full px-4 py-2 text-xs font-medium" style={{ color: 'rgba(251,191,36,0.7)', borderColor: 'rgba(249,115,22,0.15)' }}>
                  {pill}
                </span>
              ))}
            </div>

            {/* Bottom quote */}
            <div className="mt-auto pt-8 hidden lg:block">
              <p className="text-xs tracking-widest uppercase text-orange-400/30 mb-3">Trusted Platform</p>
              <p className="text-white/60 text-sm leading-relaxed max-w-sm" style={{ fontFamily: "'Poppins', sans-serif" }}>
                &ldquo;PingDish transformed how we <span style={{ fontFamily: "'Source Serif 4', Georgia, serif" }} className="italic text-orange-300/50">connect with every table</span> in real time.&rdquo;
              </p>
              <div className="flex items-center gap-3 mt-3">
                <div className="h-px flex-1 bg-orange-500/15 max-w-[40px]" />
                <span className="text-[10px] tracking-[0.2em] uppercase text-orange-400/20 font-medium">500+ Restaurants</span>
                <div className="h-px flex-1 bg-orange-500/15 max-w-[40px]" />
              </div>
            </div>
          </div>
        </div>

        {/* ─── RIGHT PANEL (48%) — Login form (Desktop) ─── */}
        <div className="hidden lg:flex w-[48%] flex-col py-6 pr-6 gap-5 relative z-10">

          {/* Top bar */}
          <div className="flex items-center justify-between">
            <div className="liquid-glass rounded-full px-1.5 py-1.5 flex items-center gap-1">
              {[
                { label: 'Features', href: '#features' },
                { label: 'Pricing', href: '#pricing' },
                { label: 'Contact', href: '#contact-sales' },
              ].map(({ label, href }) => (
                <a key={label} href={href} className="px-3 py-1.5 text-xs text-white/50 hover:text-orange-400 font-medium transition-colors rounded-full hover:bg-orange-500/5">
                  {label}
                </a>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <a href="#contact-sales" className="liquid-glass rounded-full p-2 text-orange-400/70 hover:text-orange-400 hover:scale-105 transition-all">
                <Sparkles className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Info card — orange accent */}
          <div className="liquid-glass rounded-3xl p-5 w-64 self-end" style={{ borderColor: 'rgba(249,115,22,0.08)' }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded-lg bg-orange-500/15 flex items-center justify-center">
                <Zap className="w-3 h-3 text-orange-400" />
              </div>
              <h4 className="text-white text-sm font-medium">Kitchen Dashboard</h4>
            </div>
            <p className="text-white/40 text-xs leading-relaxed">Manage pings, track response times, and serve customers faster than ever.</p>
          </div>

          {/* Login form card — fills remaining space */}
          <div className="mt-auto liquid-glass-orange rounded-[2.5rem] p-8 flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.12)', boxShadow: '0 0 30px rgba(249,115,22,0.06)' }}>
                <LogIn className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h2 className="text-white text-xl font-medium" style={{ fontFamily: "'Poppins', sans-serif" }}>
                  Sign <span style={{ fontFamily: "'Source Serif 4', Georgia, serif" }} className="italic text-orange-400/80">in</span>
                </h2>
                <p className="text-white/40 text-xs">Access your kitchen dashboard</p>
              </div>
            </div>

            {/* Error */}
            {loginError && (
              <div className="rounded-xl p-3 mb-5 flex items-start gap-2" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)' }}>
                <X className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <p className="text-red-400 text-xs leading-relaxed">{loginError}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleLogin} className="space-y-5 flex-1">
              <div>
                <label className="block text-[11px] font-medium text-orange-400/40 mb-2 uppercase tracking-widest">Restaurant ID</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <ChefHat className="w-4 h-4 text-orange-400/25" />
                  </div>
                  <input
                    type="text" required autoFocus
                    value={loginForm.restaurantId}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, restaurantId: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') }))}
                    className="login-glass-input w-full pl-11 pr-4 py-3.5 bg-white/[0.03] rounded-2xl text-white placeholder-white/15 text-sm font-mono focus:outline-none focus:bg-orange-500/[0.04] transition-all"
                    style={{ border: '1px solid rgba(249,115,22,0.1)', boxShadow: 'inset 0 1px 1px rgba(249,115,22,0.04)' }}
                    placeholder="the-cozy-bistro"
                  />
                </div>
                <p className="text-[10px] text-white/20 mt-1.5 pl-1">The unique ID given during registration</p>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-orange-400/40 mb-2 uppercase tracking-widest">Password</label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <Lock className="w-4 h-4 text-orange-400/25" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'} required
                    value={loginForm.password}
                    onChange={(e) => setLoginForm(prev => ({ ...prev, password: e.target.value }))}
                    className="login-glass-input w-full pl-11 pr-12 py-3.5 bg-white/[0.03] rounded-2xl text-white placeholder-white/15 text-sm focus:outline-none focus:bg-orange-500/[0.04] transition-all"
                    style={{ border: '1px solid rgba(249,115,22,0.1)', boxShadow: 'inset 0 1px 1px rgba(249,115,22,0.04)' }}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-orange-400/20 hover:text-orange-400/50 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* CTA — PingDish orange gradient */}
              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full rounded-full py-4 text-white text-sm font-medium flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-[0.98] transition-transform disabled:opacity-50 group bg-gradient-to-r from-orange-500 to-orange-600 shadow-lg shadow-orange-500/25 hover:shadow-orange-500/35"
              >
                {isLoggingIn ? (
                  <><div className="admin-spinner w-4 h-4 border-2 border-white/20 border-t-white rounded-full" /> Signing in...</>
                ) : (
                  <>
                    Sign In to Dashboard
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                      <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Bottom help section */}
            <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(249,115,22,0.08)' }}>
              <div className="flex items-center justify-between">
                <a href="#contact-sales" className="text-white/30 text-xs hover:text-orange-400/60 transition-colors">
                  Don't have an account?
                </a>
                <a href="#contact-sales" className="liquid-glass rounded-full px-4 py-1.5 text-xs text-orange-400/60 font-medium hover:scale-105 hover:text-orange-400 transition-all">
                  Contact Sales
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom ambient orange glow */}
      <div className="absolute bottom-0 left-1/4 w-[600px] h-[250px] bg-orange-500/5 rounded-full blur-[150px] pointer-events-none z-[2]" />
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

  // Initialize scroll reveal animations
  useScrollReveal();

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
        <div className="max-w-7xl mx-auto px-6 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left - Text */}
            <div className="animate-fade-in-up">
              <div className="inline-flex items-center gap-2 bg-primary-500/10 border border-primary-500/20 rounded-full px-4 py-1.5 mb-6">
                <span className="w-2 h-2 bg-primary-500 rounded-full animate-pulse" />
                <span className="text-primary-400 text-xs font-medium tracking-wide uppercase">Now Live</span>
              </div>

              <h1 className="text-5xl md:text-7xl font-extrabold text-white leading-[1.05] mb-6">
                Register your{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                  restaurant
                </span>{' '}
                now!
              </h1>

              <p className="text-lg md:text-xl text-gray-400 leading-relaxed mb-10 max-w-lg">
                With PingDish, any restaurant can upgrade table service instantly. Just scan, ping, and serve. It's that easy.
              </p>

              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-start gap-4 max-w-md">
                <a
                  href="#contact-sales"
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25 flex items-center gap-2"
                >
                  Get Started <ArrowRight className="w-5 h-5" />
                </a>
                <a
                  href="#how-it-works"
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-8 py-4 rounded-2xl font-semibold text-lg transition-all flex items-center gap-2"
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

      {/* ─── SOCIAL PROOF TICKER ─── */}
      <SocialProofTicker />

      {/* ─── TRUSTED BY / STATS BAR ─── */}
      <StatsBar />

      {/* ─── FEATURES ─── */}
      <section id="features" className="bg-navy-950 py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16 reveal-up">
            <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">Features</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3 mb-4">
              Everything you need to{' '}
              <span className="animated-gradient-text">
                level up
              </span>{' '}
              service
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              PingDish gives your restaurant real-time communication between tables and kitchen, with zero friction.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 reveal-stagger reveal-up">
            {[
              {
                icon: <Bell className="w-7 h-7" />,
                title: 'Instant Notifications',
                desc: 'Real-time alerts sent to your kitchen dashboard the moment a customer taps.',
                color: 'from-primary-500/20 to-primary-600/5',
              },
              {
                icon: <QrCode className="w-7 h-7" />,
                title: 'Simple QR Codes',
                desc: 'Each table gets a unique QR code. Customers scan with any phone camera. No app needed.',
                color: 'from-blue-500/20 to-blue-600/5',
              },
              {
                icon: <Zap className="w-7 h-7" />,
                title: 'Lightning Fast',
                desc: 'Powered by WebSockets for sub-second delivery. Your kitchen knows instantly.',
                color: 'from-yellow-500/20 to-yellow-600/5',
              },
              {
                icon: <Clock className="w-7 h-7" />,
                title: 'Track Response Time',
                desc: 'Monitor how fast your team responds. Improve service metrics and customer satisfaction.',
                color: 'from-emerald-500/20 to-emerald-600/5',
              },
            ].map((feature, i) => (
              <div key={i} className="feature-card glass-card rounded-2xl p-7 group cursor-default">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-5 group-hover:scale-110 transition-transform`}>
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
          <div className="text-center mb-16 reveal-up">
            <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">How It Works</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3 mb-4">
              Set up in{' '}
              <span className="animated-gradient-text">
                3 simple steps
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              From sign-up to first ping in under 2 minutes. No technical knowledge needed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: <ChefHat className="w-8 h-8" />,
                title: 'Register your restaurant',
                desc: 'Enter your restaurant name and number of tables. We generate everything for you.',
              },
              {
                step: '02',
                icon: <QrCode className="w-8 h-8" />,
                title: 'Print QR codes',
                desc: 'Download and print unique QR codes for each table. Place them where customers can see.',
              },
              {
                step: '03',
                icon: <Smartphone className="w-8 h-8" />,
                title: 'Customers scan & ping',
                desc: 'Customers scan the QR code and tap to notify your kitchen. Real-time, no app required.',
              },
            ].map((step, i) => (
              <div key={i} className="relative group">
                <div className="glass-card rounded-2xl p-8 h-full hover:border-primary-500/20 transition-all">
                  <div className="text-6xl font-black text-white/5 absolute top-4 right-6">{step.step}</div>
                  <div className="w-14 h-14 bg-primary-500/10 rounded-2xl flex items-center justify-center text-primary-500 mb-5">
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
          <div className="text-center mb-16 reveal-up">
            <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">Pricing</span>
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3 mb-4">
              Plans that{' '}
              <span className="animated-gradient-text">
                scale with you
              </span>
            </h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">
              Start free, upgrade when you need more. Enterprise solutions for restaurant chains and franchises.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* ── Free Plan ── */}
            <div className="relative bg-gradient-to-br from-navy-800 to-navy-900 rounded-3xl p-8 border border-white/10 shadow-xl">
              <div className="mb-6">
                <h3 className="text-lg font-bold text-white mb-1">Starter</h3>
                <p className="text-gray-500 text-sm">Perfect for single-location restaurants</p>
              </div>

              <div className="mb-6">
                <div className="text-5xl font-black text-white mb-1">$0<span className="text-lg font-medium text-gray-500">/mo</span></div>
                <p className="text-gray-500 text-sm">Free forever</p>
              </div>

              <div className="space-y-3 mb-8">
                {[
                  'Up to 30 tables',
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

              <a href="#contact-sales" className="block w-full bg-white/10 hover:bg-white/15 text-white text-center py-4 rounded-xl font-semibold text-lg transition-all border border-white/10">
                Get Started Free <ArrowRight className="w-4 h-4 inline ml-1" />
              </a>
            </div>

            {/* ── Enterprise Plan ── */}
            <div className="relative bg-gradient-to-br from-navy-800 to-navy-900 rounded-3xl p-8 border border-primary-500/20 shadow-2xl shadow-primary-500/5">
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
                <div className="text-4xl font-black text-white mb-1">Custom</div>
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

              <a href="#contact-sales" className="block w-full bg-primary-500 hover:bg-primary-600 text-white text-center py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25">
                Talk to Sales <ArrowRight className="w-4 h-4 inline ml-1" />
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <Testimonials />

      {/* ─── CONTACT SALES ─── */}
      <section id="contact-sales" className="bg-navy-900 py-24 relative overflow-hidden">
        <div className="grid-pattern absolute inset-0 z-0 opacity-30" />
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 items-start">
            {/* Left — Info */}
            <div>
              <span className="text-primary-500 text-sm font-semibold tracking-widest uppercase">Contact Sales</span>
              <h2 className="text-4xl md:text-5xl font-extrabold text-white mt-3 mb-6">
                Let's find the{' '}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-400 to-primary-600">
                  right plan
                </span>{' '}
                for you
              </h2>
              <p className="text-gray-400 text-lg leading-relaxed mb-10">
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
            <div className="glass-card rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl">
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
                      className="w-full bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25 flex items-center justify-center gap-2"
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
            <div className="glass-card rounded-3xl p-8 md:p-10 border border-white/10 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 bg-yellow-500/10 border border-yellow-500/20 rounded-full px-4 py-1.5 mb-4">
                  <Shield className="w-3.5 h-3.5 text-yellow-400" />
                  <span className="text-yellow-400 text-xs font-medium tracking-wide uppercase">PingDish Admin</span>
                </div>
                <div className="w-14 h-14 bg-primary-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <ChefHat className="w-7 h-7 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-2">Register Restaurant</h2>
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
                  className="w-full bg-primary-500 hover:bg-primary-600 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all hover:shadow-lg hover:shadow-primary-500/25 disabled:opacity-50 disabled:cursor-not-allowed"
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

            <div className="flex items-center gap-6 text-sm">
              <a href="#features" className="text-gray-500 hover:text-gray-300 transition-colors">Features</a>
              <a href="#how-it-works" className="text-gray-500 hover:text-gray-300 transition-colors">How It Works</a>
              <a href="#pricing" className="text-gray-500 hover:text-gray-300 transition-colors">Pricing</a>
              <a href="#contact-sales" className="text-gray-500 hover:text-gray-300 transition-colors">Contact</a>
            </div>

            <p className="text-gray-600 text-sm">&copy; 2026 PingDish. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
