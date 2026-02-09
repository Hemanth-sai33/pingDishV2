import React, { useState } from 'react';
import { Bell, QrCode, Zap, Clock, Check, Download, ExternalLink } from 'lucide-react';
import { escapeHtml, isValidKitchenUrl } from './utils/security';

interface FormData {
  restaurantName: string;
  restaurantId: string;
  numberOfTables: string;
  ownerEmail: string;
}

interface TableInfo { tableNumber: number; qrUrl: string; }
interface SubmissionResult {
  success: boolean;
  kitchenUrl: string;
  tables: TableInfo[];
}

// [FIX 5.1] Use environment variables instead of hardcoded URLs
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5173/api';

// Generate QR code URL using QR Server API (free, no API key needed)
// TODO [FIX 7.2]: Replace with client-side qrcode library (npm install qrcode)
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

function App() {
  const [formData, setFormData] = useState<FormData>({ restaurantName: '', restaurantId: '', numberOfTables: '', ownerEmail: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
    try {
      const res = await apiFetch(`${API_URL}/restaurants`, {
        method: 'POST',
        body: JSON.stringify({ ...formData, numberOfTables: parseInt(formData.numberOfTables, 10) })
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

  const features = [
    { icon: <Bell className="w-8 h-8" />, title: 'Instant Notifications', desc: 'Real-time alerts when customers need service.' },
    { icon: <QrCode className="w-8 h-8" />, title: 'Simple QR Codes', desc: 'Each table gets a unique QR code. No app needed.' },
    { icon: <Zap className="w-8 h-8" />, title: 'Lightning Fast', desc: 'Notifications reach your kitchen instantly.' },
    { icon: <Clock className="w-8 h-8" />, title: 'Track Response Time', desc: 'Monitor service times and improve satisfaction.' },
  ];

  if (result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-slate-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <Check className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-800 mb-2">Welcome to PingDish! 🎉</h2>
            <p className="text-slate-600">Your restaurant has been registered.</p>
          </div>
          <div className="space-y-6">
            <div className="bg-orange-50 border-2 border-orange-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <ExternalLink className="w-5 h-5 text-orange-600" /> Kitchen Dashboard
              </h3>
              {/* [FIX 4.5] Validate kitchen URL before rendering as link */}
              {isValidKitchenUrl(result.kitchenUrl) ? (
                <a href={result.kitchenUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block bg-orange-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-orange-700">
                  Open Dashboard →
                </a>
              ) : (
                <p className="text-red-600 font-semibold">Invalid dashboard URL received. Please contact support.</p>
              )}
              <p className="text-sm text-slate-500 mt-2 font-mono">{result.kitchenUrl}</p>
            </div>
            <div className="bg-slate-50 border-2 border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <QrCode className="w-5 h-5 text-slate-600" /> Table QR Codes
              </h3>
              <button onClick={() => downloadQrCodes(result.tables, formData.restaurantName)}
                className="inline-block bg-slate-700 text-white px-6 py-3 rounded-lg font-semibold hover:bg-slate-800 mb-4">
                <Download className="w-4 h-4 inline mr-2" /> Print All QR Codes
              </button>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-64 overflow-y-auto">
                {result.tables.slice(0, 12).map(t => (
                  <div key={t.tableNumber} className="bg-white p-2 rounded border text-center">
                    <img src={getQrCodeUrl(t.qrUrl, 100)} alt={`Table ${t.tableNumber}`} className="w-16 h-16 mx-auto" />
                    <p className="text-xs font-semibold mt-1">Table {t.tableNumber}</p>
                  </div>
                ))}
                {result.tables.length > 12 && (
                  <div className="bg-slate-100 p-2 rounded border text-center flex items-center justify-center">
                    <p className="text-xs text-slate-500">+{result.tables.length - 12} more</p>
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
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-slate-50">
      <header className="bg-white shadow-sm">
        <nav className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-2">
          <Bell className="w-8 h-8 text-orange-600" />
          <span className="text-2xl font-bold text-slate-800">PingDish</span>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl md:text-6xl font-bold text-slate-800 mb-6">
            Table Service, <span className="text-orange-600">Simplified</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Customers scan QR codes and ping your kitchen when they need service. No more waving, no more waiting.
          </p>
          <a href="#onboarding" className="bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-700 text-lg shadow-lg">
            Get Started Free
          </a>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-24">
          {features.map((f, i) => (
            <div key={i} className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-orange-600 mb-4">{f.icon}</div>
              <h3 className="text-xl font-semibold text-slate-800 mb-2">{f.title}</h3>
              <p className="text-slate-600">{f.desc}</p>
            </div>
          ))}
        </div>

        <div id="onboarding" className="max-w-xl mx-auto bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-3xl font-bold text-slate-800 mb-2 text-center">Register Your Restaurant</h2>
          <p className="text-slate-600 text-center mb-8">Set up in under 2 minutes</p>
          {error && <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-red-800">{error}</div>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Restaurant Name *</label>
              <input type="text" name="restaurantName" value={formData.restaurantName} onChange={handleInputChange} required maxLength={100}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-orange-600 focus:outline-none" placeholder="The Cozy Bistro" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Restaurant ID (URL slug) *</label>
              <input type="text" name="restaurantId" value={formData.restaurantId} onChange={handleInputChange} required pattern="[a-z0-9\-]+" minLength={3} maxLength={50}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-orange-600 focus:outline-none font-mono text-sm" placeholder="the-cozy-bistro" />
              <p className="text-xs text-slate-500 mt-1">Lowercase letters, numbers, and hyphens only</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Number of Tables *</label>
              <input type="number" name="numberOfTables" value={formData.numberOfTables} onChange={handleInputChange} required min="1" max="500"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-orange-600 focus:outline-none" placeholder="20" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">Owner Email *</label>
              <input type="email" name="ownerEmail" value={formData.ownerEmail} onChange={handleInputChange} required
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-lg focus:border-orange-600 focus:outline-none" placeholder="owner@restaurant.com" />
            </div>
            <button type="submit" disabled={isSubmitting}
              className="w-full bg-orange-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-orange-700 text-lg shadow-lg disabled:opacity-50">
              {isSubmitting ? 'Setting up...' : 'Register Restaurant →'}
            </button>
          </form>
        </div>
      </main>

      <footer className="bg-slate-800 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-orange-500" />
            <span className="text-xl font-bold">PingDish</span>
          </div>
          <p className="text-slate-400 text-sm">© 2026 PingDish. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
