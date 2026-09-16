import React, { useState, useEffect, useRef, useMemo } from 'react';
import logoAsset from './logo.png';
import slide1Asset from './slide1.jpg';
import slide2Asset from './slide2.jpg';
import slide3Asset from './slide3.jpg';
const productPlaceholderAsset = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='400' height='400'><rect width='100%25' height='100%25' fill='%23f3f4f6'/><text x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='20' fill='%239ca3af'>No Image</text></svg>";
import {
  Search, ShieldCheck, Truck, Wallet, Package, Plane, ChevronRight, ChevronLeft,
  Menu, ShoppingCart, User, CreditCard, LayoutDashboard, ShoppingBag,
  CheckCircle, Upload, ArrowLeft, Lock, Key, Trash2, Plus, Minus, LogOut, X,
  Eye, EyeOff, Phone as PhoneIcon, Mail, Circle, MapPin, Users, UserPlus, Pencil,
  Camera, Loader2, TrendingUp, Clock, AlertTriangle, BarChart3, Banknote, Award
} from 'lucide-react';
import { db, auth, secondaryAuth } from './firebase';
import { useVisualSearch } from './visualSearch';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, where,
  serverTimestamp, updateDoc, setDoc, getDoc, runTransaction,
} from 'firebase/firestore';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  createUserWithEmailAndPassword, updateProfile,
  GoogleAuthProvider, signInWithPopup,
} from 'firebase/auth';

// এই ইমেইলটা Firebase Console → Authentication → Users এ যে অ্যাডমিন ইউজার বানাবেন, সেটার সাথে হুবহু মিলতে হবে
const ADMIN_EMAIL = 'admin@drutolink.com';

// সাইটের লোগো — সব হেডার/সাইডবার/ফুটার এই একই লিংক থেকে লোগো দেখায়
const LOGO_URL = logoAsset;

// অর্ডারের ধাপগুলো — ঠিক এই ক্রমে, AdminDashboard-এর স্ট্যাটাস ড্রপডাউনের সাথে মিলিয়ে
// একটা এলিমেন্ট স্ক্রল করে চোখের সামনে এলে true হয়ে যায় — নিচের দিকের সেকশনগুলোকে
// (যেমন "৩ ধাপে অর্ডার করুন") পেজ লোডের বদলে স্ক্রলে আসার সময় অ্যানিমেট করাতে ব্যবহার হয়।
function useInView(threshold = 0.25) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // IntersectionObserver না থাকলে (খুব পুরোনো ব্রাউজার) সরাসরি দেখিয়ে দিই, লুকিয়ে রাখার দরকার নেই
    if (typeof IntersectionObserver === 'undefined') { setInView(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, inView];
}

const SHIPPING_RATE_PER_KG = 900;

// Product-level weight is preferred. For legacy products that don't have a weight yet,
// use a conservative category-based estimate so the cart can still show an approximate
// shipping amount. Admin can set the product's own estimated weight at any time.
const CATEGORY_WEIGHT_ESTIMATES = {
  'ইলেকট্রনিক্স': 0.35,
  'ফ্যাশন ও পোশাক': 0.45,
  'জুতা': 0.75,
  'ব্যাগ ও লাগেজ': 0.80,
  'হোম ও কিচেন': 0.65,
  'খেলনা ও গিফট': 0.40,
  'বিউটি ও কসমেটিক্স': 0.25,
  'মোবাইল এক্সেসরিজ': 0.20,
};

function getEstimatedWeightKg(product) {
  const explicit = Number(product?.estimatedWeightKg ?? product?.weightKg ?? product?.weight);
  if (Number.isFinite(explicit) && explicit > 0) return explicit;
  return Number(CATEGORY_WEIGHT_ESTIMATES[product?.category] || 0.50);
}

const ORDER_STAGES = [
  'Pending TrxID',
  'Order Placed',
  'Processing',
  'Sourced in China',
  'In Transit',
  'Arrived in Bangladesh',
  'Out for Delivery',
  'Delivered'
];

// --- "৩ ধাপে অর্ডার করুন" সেকশনের কার্টুন-স্টাইল আইকন ---
// সহজ, ফ্ল্যাট শেপ দিয়ে আঁকা (কোনো ইমেজ ফাইল লাগে না), প্রতিটা নিজের রঙে —
// দেখতে যেন একটু মজার/হাতে আঁকা মনে হয়, প্লেইন নম্বরের চেয়ে বেশি প্রাণবন্ত।

function StepIconChoose() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7">
      {/* বাক্স/প্যাকেজ */}
      <rect x="10" y="20" width="24" height="18" rx="3" fill="#f59e0b" />
      <rect x="10" y="20" width="24" height="6" rx="2" fill="#fbbf24" />
      <path d="M10 23 L34 23" stroke="#d97706" strokeWidth="1.2" />
      <path d="M22 20 L22 38" stroke="#d97706" strokeWidth="1.2" />
      {/* উপরে ফিতা/বো */}
      <path d="M18 20 C14 14, 22 12, 22 20" fill="none" stroke="#b45309" strokeWidth="1.6" strokeLinecap="round" />
      <path d="M26 20 C30 14, 22 12, 22 20" fill="none" stroke="#b45309" strokeWidth="1.6" strokeLinecap="round" />
      {/* পছন্দ বোঝাতে ছোট্ট তারা */}
      <path d="M37 12 l1.3 2.7 3 0.4 -2.2 2.1 0.5 3 -2.6 -1.4 -2.6 1.4 0.5 -3 -2.2 -2.1 3 -0.4 Z" fill="#fde68a" />
    </svg>
  );
}

function StepIconPay() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7">
      {/* মোবাইল ফোন */}
      <rect x="14" y="7" width="18" height="34" rx="4" fill="#6d28d9" />
      <rect x="16.5" y="11" width="13" height="22" rx="1.5" fill="#ede9fe" />
      <circle cx="23" cy="36.5" r="1.6" fill="#c4b5fd" />
      {/* স্ক্রিনে টাকা চিহ্ন */}
      <text x="23" y="26" textAnchor="middle" fontSize="10" fontWeight="800" fill="#6d28d9" fontFamily="sans-serif">৳</text>
      {/* সফল পেমেন্টের চেকমার্ক বাবল */}
      <circle cx="35" cy="14" r="7" fill="#22c55e" />
      <path d="M31.7 14.2 l2 2 3.2 -4" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function StepIconShip() {
  return (
    <svg viewBox="0 0 48 48" className="h-7 w-7">
      {/* কার্গো বক্স */}
      <rect x="4" y="16" width="20" height="14" rx="2" fill="#0ea5e9" />
      <rect x="4" y="16" width="20" height="4" rx="1.5" fill="#7dd3fc" />
      {/* ক্যাব */}
      <path d="M24 21 h9 l6 6 v3 h-15 Z" fill="#0284c7" />
      <rect x="29" y="23" width="5" height="4" rx="0.8" fill="#bae6fd" />
      {/* চাকা */}
      <circle cx="12" cy="32" r="3.4" fill="#1e293b" />
      <circle cx="12" cy="32" r="1.3" fill="#94a3b8" />
      <circle cx="31" cy="32" r="3.4" fill="#1e293b" />
      <circle cx="31" cy="32" r="1.3" fill="#94a3b8" />
      {/* গতির দাগ */}
      <path d="M0 20 h4 M0 25 h3" stroke="#bae6fd" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const STEP_ICONS = [StepIconChoose, StepIconPay, StepIconShip];

// "৩ ধাপে অর্ডার করুন" সেকশনের একেকটা কার্ড। useInView দিয়ে বোঝে কখন স্ক্রল করে
// চোখের সামনে এসেছে, আর index অনুযায়ী সামান্য দেরি করে একে একে ভেসে ওঠে (স্ট্যাগার ইফেক্ট)।
// নম্বরের বদলে কার্টুন-স্টাইল আইকন — নম্বরটা এখন ছোট চিপ হিসেবে কোণায় থাকে, ধাপের ক্রমটা বোঝাতে।
function StepCard({ step, index }) {
  const [ref, inView] = useInView(0.35);
  const Icon = STEP_ICONS[index];
  return (
    <div
      ref={ref}
      className={`flex gap-4 relative reveal-step ${inView ? 'reveal-step-in' : ''}`}
      style={{ animationDelay: inView ? `${index * 0.15}s` : undefined }}
    >
      <span
        className="step-badge relative h-12 w-12 shrink-0 rounded-full bg-white flex items-center justify-center shadow-md"
        style={{ animationDelay: `${index * 0.35}s` }}
      >
        <Icon />
        <span className="font-display absolute -bottom-1 -right-1 h-5 w-5 rounded-full bg-red-800 border-2 border-red-700 flex items-center justify-center text-[10px] font-extrabold text-white">
          {step.n}
        </span>
      </span>
      <div className="pt-1">
        <h3 className="font-semibold mb-1">{step.t}</h3>
        <p className="text-sm text-red-100 leading-relaxed">{step.d}</p>
      </div>
      {index < 2 && <div className="hidden md:block absolute top-6 left-[calc(100%-1.25rem)] w-6 border-t border-dashed border-white/30" />}
    </div>
  );
}


const FONTS = `
.font-display { font-family: 'Poppins', 'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif; }
.font-body { font-family: 'Noto Sans Bengali', 'Hind Siliguri', system-ui, sans-serif; }

html { scroll-behavior: smooth; }
* { -webkit-tap-highlight-color: transparent; }
::selection { background: #fecaca; color: #7f1d1d; }

/* thin, quiet scrollbars for drawers/modals */
.thin-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
.thin-scroll::-webkit-scrollbar-track { background: transparent; }
.thin-scroll::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 999px; }
.thin-scroll::-webkit-scrollbar-thumb:hover { background: #d1d5db; }

@keyframes fadeInUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
@keyframes scaleIn { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
@keyframes floatSlow { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
@keyframes dashMove { to { stroke-dashoffset: -24; } }
@keyframes catMarquee { from { transform: translateX(0); } to { transform: translateX(-50%); } }
@keyframes stepPop { 0% { opacity: 0; transform: translateY(22px) scale(0.94); } 100% { opacity: 1; transform: translateY(0) scale(1); } }
@keyframes stepBadgePulse { 0% { box-shadow: 0 0 0 0 rgba(255,255,255,0.45); } 70% { box-shadow: 0 0 0 10px rgba(255,255,255,0); } 100% { box-shadow: 0 0 0 0 rgba(255,255,255,0); } }
@keyframes stepBadgeFloat { 0%, 100% { transform: translateY(0) rotate(0deg); } 50% { transform: translateY(-5px) rotate(-3deg); } }
@keyframes heroGlow { 0%,100% { opacity:.55; transform:scale(1); } 50% { opacity:.8; transform:scale(1.04); } }
@keyframes routePulse { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-4px); } }
.hero-glow { animation: heroGlow 5s ease-in-out infinite; }
.route-pulse { animation: routePulse 3s ease-in-out infinite; }
.product-trust-card { transition: transform .2s ease, box-shadow .2s ease, border-color .2s ease; }
.product-trust-card:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(15,23,42,.07); border-color:#e5e7eb; }


.animate-hero-in { animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-hero-in-delay { animation: fadeInUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.12s both; }
.animate-fade-in { animation: fadeIn 0.4s ease-out both; }
.animate-scale-in { animation: scaleIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) both; }
.animate-float { animation: floatSlow 5s ease-in-out infinite; }
.route-dash { stroke-dasharray: 6 6; animation: dashMove 1.2s linear infinite; }

/* ক্যাটাগরি বার — বাম থেকে ডানে অনবরত স্ক্রল হয়। লিস্টটা দুইবার বসিয়ে
   -50% পর্যন্ত সরালেই লুপ নিরবচ্ছিন্ন দেখায় (কোনো ঝাঁকুনি বা ফাঁকা জায়গা পড়ে না)। */
.cat-marquee-track { animation: catMarquee 26s linear infinite; }
.cat-marquee-track:hover, .cat-marquee-track:focus-within { animation-play-state: paused; }

/* "৩ ধাপে অর্ডার করুন" সেকশনের প্রতিটা ধাপ স্ক্রল করে দেখা যাওয়ার আগে অদৃশ্য থাকে (opacity: 0),
   .reveal-step-in ক্লাস যোগ হলে (useInView হুক দিয়ে) অ্যানিমেট হয়ে ভেসে ওঠে। */
.reveal-step { opacity: 0; }
.reveal-step-in { animation: stepPop 0.6s cubic-bezier(0.16, 1, 0.3, 1) both; }
.reveal-step-in .step-badge { animation: stepBadgePulse 1.6s ease-out 0.4s, stepBadgeFloat 3.2s ease-in-out 1.2s infinite; }
.reveal-step-in .step-badge:hover { animation-play-state: paused; }

@media (prefers-reduced-motion: reduce) {
  .animate-hero-in, .animate-hero-in-delay, .animate-fade-in, .animate-scale-in, .animate-float, .route-dash, .cat-marquee-track, .reveal-step-in, .reveal-step-in .step-badge {
    animation: none !important;
  }
  .reveal-step { opacity: 1; }
  html { scroll-behavior: auto; }
}
`;

const CATEGORIES = [
  { name: 'ইলেকট্রনিক্স', emoji: '🔌' },
  { name: 'ফ্যাশন ও পোশাক', emoji: '👕' },
  { name: 'জুতা', emoji: '👟' },
  { name: 'ব্যাগ ও লাগেজ', emoji: '🎒' },
  { name: 'হোম ও কিচেন', emoji: '🍽️' },
  { name: 'খেলনা ও গিফট', emoji: '🧸' },
  { name: 'বিউটি ও কসমেটিক্স', emoji: '💄' },
  { name: 'মোবাইল এক্সেসরিজ', emoji: '📱' },
];

const SLIDES = [
  { image: slide1Asset, alt: 'চায়না টু বাংলাদেশ শিপিং' },
  { image: slide2Asset, alt: 'চায়না টু বাংলাদেশ শিপিং তথ্য' },
  { image: slide3Asset, alt: 'সোর্সিং টু শিপিং এক ওয়েবসাইটে' },
];

// --- IMAGE SLIDER ---
function ImageSlider() {
  const [active, setActive] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setActive((i) => (i + 1) % SLIDES.length);
    }, 4500);
    return () => clearInterval(timerRef.current);
  }, []);

  const goTo = (i) => {
    clearInterval(timerRef.current);
    setActive(i);
  };

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${active * 100}%)` }}>
        {SLIDES.map((s, i) => (
          <div key={i} className="min-w-full relative h-48 md:h-72">
            <img src={s.image} alt={s.alt} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        ))}
      </div>
      <button onClick={() => goTo((active - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-1.5 shadow-sm transition-all duration-150 hover:scale-105">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={() => goTo((active + 1) % SLIDES.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-1.5 shadow-sm transition-all duration-150 hover:scale-105">
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${i === active ? 'w-6 bg-red-600' : 'w-2 bg-white/70 hover:bg-white/90'}`} />
        ))}
      </div>
    </div>
  );
}

function RouteGraphic() {
  return (
    <svg viewBox="0 0 400 220" className="w-full h-auto">
      <path d="M 40 170 Q 200 20 360 60" fill="none" stroke="#dc2626" strokeWidth="2" className="route-dash" opacity="0.6" />
      <circle cx="40" cy="170" r="7" fill="#111827" />
      <text x="40" y="196" textAnchor="middle" className="font-body" fontSize="14" fill="#111827">চীন</text>
      <circle cx="360" cy="60" r="7" fill="#dc2626" />
      <text x="360" y="40" textAnchor="middle" className="font-body" fontSize="14" fill="#111827">বাংলাদেশ</text>
      <g transform="translate(195, 65) rotate(-25)">
        <circle r="18" fill="#fff" stroke="#dc2626" strokeWidth="2" />
        <foreignObject x="-10" y="-10" width="20" height="20">
          <div style={{ width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Plane size={14} color="#dc2626" />
          </div>
        </foreignObject>
      </g>
    </svg>
  );
}

// --- SIDE CART DRAWER (opens on Add to Cart, and from the header cart icon) ---
function CartDrawer({ isOpen, onClose, cart, onUpdateQuantity, onRemove, cartTotal, estimatedWeightKg, estimatedShipping, estimatedGrandTotal, onCheckout }) {
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Slide-in panel */}
      <div
        role="dialog"
        aria-label="কার্ট"
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col font-body transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 shrink-0">
          <h3 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-red-600" /> আপনার কার্ট
            {cartCount > 0 && (
              <span className="text-xs font-semibold bg-red-50 text-red-700 px-2 py-0.5 rounded-full">{cartCount}</span>
            )}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto thin-scroll divide-y divide-gray-100">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 p-8 text-center">
              <div className="h-16 w-16 rounded-full bg-gray-50 flex items-center justify-center">
                <ShoppingCart className="h-7 w-7 text-gray-300" />
              </div>
              <p className="text-gray-500 text-sm max-w-[220px]">আপনার কার্ট খালি। প্রোডাক্ট বেছে "কার্টে যোগ করুন" চাপুন।</p>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartLineId} className="p-4 flex items-center gap-3 hover:bg-gray-50/60 transition-colors">
                <img src={item.image} alt={item.title} className="h-16 w-16 object-cover rounded-lg border border-gray-100 shrink-0" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-gray-800 truncate">{item.title}</h4>
                  {(item.selectedSize || item.selectedColor) && (
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      {item.selectedSize && `সাইজ: ${item.selectedSize}`}
                      {item.selectedSize && item.selectedColor && ' · '}
                      {item.selectedColor && `কালার: ${item.selectedColor}`}
                    </p>
                  )}
                  <p className="text-red-600 font-bold text-sm mt-0.5">৳ {item.price}</p>
                  <div className="flex items-center border border-gray-200 rounded-lg mt-2 w-fit overflow-hidden">
                    <button onClick={() => onUpdateQuantity(item.cartLineId, -1)} className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 text-xs font-semibold tabular-nums">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.cartLineId, 1)} className="p-1.5 text-gray-600 hover:bg-gray-100 transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <button onClick={() => onRemove(item.cartLineId)} className="text-gray-400 hover:text-red-600 p-1 shrink-0 transition-colors">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-100 p-5 space-y-3 shrink-0 bg-gray-50/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">পণ্যের মোট</span>
              <span className="font-semibold text-gray-800">৳ {cartTotal.toLocaleString('en-BD')}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">আনুমানিক ওজন</span>
              <span className="font-semibold text-gray-800">{estimatedWeightKg.toFixed(2)} KG</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">আনুমানিক Shipping</span>
              <span className="font-semibold text-gray-800">৳ {estimatedShipping.toLocaleString('en-BD')}</span>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-700">আনুমানিক মোট</span>
              <span className="font-display text-red-700 font-bold text-lg">৳ {estimatedGrandTotal.toLocaleString('en-BD')}</span>
            </div>
            <div className="text-[11px] leading-5 text-amber-900 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <strong>বিঃদ্রঃ</strong> এখানে দেখানো ওজন ও Shipping Charge আনুমানিক। পণ্য বাংলাদেশে পৌঁছানোর পর প্রকৃত ওজন অনুযায়ী চূড়ান্ত Shipping Charge আপনার অর্ডারে যোগ করা হবে। Shipping Rate: <strong>৳ {SHIPPING_RATE_PER_KG}/kg</strong>।
            </div>
            <button onClick={onCheckout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98]">
              চেকআউটে যান
            </button>
            <button onClick={onClose} className="w-full text-sm text-gray-500 hover:text-gray-800 py-1 transition-colors">
              কেনাকাটা চালিয়ে যান
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// --- PRODUCT DETAIL MODAL (size / color selection) ---
function ProductDetailModal({ product, onClose, onAddToCart }) {
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);

  useEffect(() => {
    setSelectedSize(product?.sizes?.[0] || '');
    setSelectedColor(product?.colors?.[0]?.name || '');
    setQuantity(1);
    setActiveImage(0);
  }, [product]);

  if (!product) return null;

  const hasSizes = product.sizes && product.sizes.length > 0;
  const hasColors = product.colors && product.colors.length > 0;
  const images = Array.from(new Set([product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean)));
  const hasExtraInfo = product.description || product.material || product.weight || product.model || product.specification;

  const handleAdd = () => {
    for (let i = 0; i < quantity; i += 1) {
      onAddToCart(product, {
        selectedSize: hasSizes ? selectedSize : undefined,
        selectedColor: hasColors ? selectedColor : undefined,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 font-body">
      <div onClick={onClose} className="absolute inset-0 bg-slate-950/60 backdrop-blur-[3px] animate-fade-in" />
      <div role="dialog" aria-modal="true" aria-label="পণ্যের বিস্তারিত" className="relative bg-white rounded-3xl max-w-5xl w-full max-h-[94vh] overflow-y-auto thin-scroll shadow-2xl animate-scale-in">
        <button onClick={onClose} className="absolute top-3 right-3 bg-white/95 hover:bg-white rounded-full p-2 shadow-lg z-20 transition-transform hover:scale-105" aria-label="বন্ধ করুন">
          <X className="h-5 w-5 text-gray-700" />
        </button>

        <div className="grid lg:grid-cols-[1.02fr_.98fr]">
          <div className="p-4 md:p-6 bg-slate-50 border-b lg:border-b-0 lg:border-r border-gray-100">
            <div className="aspect-square md:aspect-[4/3] bg-white rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center">
              <img src={images[activeImage]} alt={product.title} className="w-full h-full object-contain" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
                {images.map((src, i) => (
                  <button key={`${src}-${i}`} onClick={() => setActiveImage(i)} className={`h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 bg-white ${activeImage === i ? 'border-red-600 ring-2 ring-red-100' : 'border-gray-200'}`}>
                    <img src={src} alt={`${product.title} ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-2 mt-4">
              <div className="product-trust-card bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><ShieldCheck className="h-4 w-4" /></span>
                <div><p className="text-xs font-bold text-gray-800">নিরাপদ অর্ডার</p><p className="text-[10px] text-gray-500">সহজ অর্ডার প্রক্রিয়া</p></div>
              </div>
              <div className="product-trust-card bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-2.5">
                <span className="h-8 w-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center"><Truck className="h-4 w-4" /></span>
                <div><p className="text-xs font-bold text-gray-800">ডেলিভারি</p><p className="text-[10px] text-gray-500">বাংলাদেশে ডেলিভারি</p></div>
              </div>
            </div>
          </div>

          <div className="p-5 md:p-7 lg:p-8">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
              <button onClick={onClose} className="hover:text-red-600">হোম</button>
              <ChevronRight className="h-3.5 w-3.5" />
              <span>{product.category || 'পণ্য'}</span>
            </div>
            <span className="inline-flex text-xs font-bold text-red-700 bg-red-50 border border-red-100 px-2.5 py-1 rounded-full">{product.category || 'পণ্য'}</span>
            <h3 className="font-display text-2xl md:text-3xl font-extrabold text-gray-900 mt-3 leading-tight">{product.title}</h3>
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1 mt-4">
              <p className="font-display text-3xl font-extrabold text-red-700">৳ {product.price}</p>
              <span className="text-xs text-gray-500 mb-1">বাংলাদেশি টাকা</span>
            </div>
            {product.description && (
              <p className="text-sm text-gray-600 leading-7 mt-4">{product.description}</p>
            )}

            {hasSizes && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-2"><p className="text-sm font-bold text-gray-800">সাইজ বাছাই করুন</p><span className="text-xs text-gray-400">{selectedSize}</span></div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((s) => (
                    <button key={s} onClick={() => setSelectedSize(s)} className={`min-w-12 px-3.5 py-2 rounded-xl border text-sm font-semibold transition-all ${selectedSize === s ? 'border-red-600 bg-red-50 text-red-700 ring-1 ring-red-600' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>{s}</button>
                  ))}
                </div>
              </div>
            )}

            {hasColors && (
              <div className="mt-5">
                <p className="text-sm font-bold text-gray-800 mb-2">কালার বাছাই করুন</p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((c) => (
                    <button key={c.name} onClick={() => setSelectedColor(c.name)} className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-medium transition-all ${selectedColor === c.name ? 'border-red-600 bg-red-50 text-red-700 ring-1 ring-red-600' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                      <span className="h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: c.hex || '#ccc' }} />{c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex items-center justify-between gap-3">
              <div><p className="text-xs font-semibold text-gray-500 mb-1">পরিমাণ</p><div className="flex items-center border border-gray-200 rounded-xl overflow-hidden h-11">
                <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="h-full px-3 text-gray-600 hover:bg-gray-50"><Minus className="h-4 w-4" /></button>
                <span className="w-10 text-center font-bold text-sm tabular-nums">{quantity}</span>
                <button onClick={() => setQuantity((q) => q + 1)} className="h-full px-3 text-gray-600 hover:bg-gray-50"><Plus className="h-4 w-4" /></button>
              </div></div>
              <div className="text-right"><p className="text-xs text-gray-500">এই অর্ডারের মূল্য</p><p className="font-display text-xl font-extrabold text-gray-900">৳ {Number(product.price) * quantity}</p></div>
            </div>

            <button onClick={handleAdd} className="w-full mt-5 bg-red-600 hover:bg-red-700 text-white font-bold py-3.5 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.99] flex items-center justify-center gap-2">
              <ShoppingCart className="h-5 w-5" /> কার্টে যোগ করুন
            </button>
            <p className="text-center text-xs text-gray-400 mt-2">কার্টে যোগ করার পর চেকআউট থেকে অর্ডার নিশ্চিত করতে পারবেন।</p>

            {hasExtraInfo && (
              <div className="mt-7 border-t border-gray-100 pt-5">
                <h4 className="font-display font-bold text-gray-900 mb-3">পণ্যের তথ্য</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                  {product.material && <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="text-gray-500">Material:</span> <b>{product.material}</b></div>}
                  {product.weight && <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="text-gray-500">Weight:</span> <b>{product.weight}</b></div>}
                  {product.model && <div className="bg-gray-50 rounded-lg px-3 py-2"><span className="text-gray-500">Model:</span> <b>{product.model}</b></div>}
                  {product.specification && <div className="bg-gray-50 rounded-lg px-3 py-2 sm:col-span-2"><span className="text-gray-500">Specification:</span> <b>{product.specification}</b></div>}
                </div>
              </div>
            )}

            <div className="mt-5 bg-red-50/70 border border-red-100 rounded-2xl p-4">
              <div className="flex items-start gap-3">
                <div className="h-9 w-9 shrink-0 rounded-full bg-white text-red-600 flex items-center justify-center shadow-sm"><Wallet className="h-4 w-4" /></div>
                <div><p className="text-sm font-bold text-gray-900">পেমেন্ট ও ডেলিভারি</p><p className="text-xs text-gray-600 mt-1 leading-5">বিকাশ ও নগদ পেমেন্ট সুবিধা রয়েছে। অর্ডার প্রসেসিং শেষে বাংলাদেশে ডেলিভারি করা হয়।</p></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- ORDER STATUS TIMELINE ---
function OrderStatusTimeline({ status }) {
  const stageIndex = ORDER_STAGES.indexOf(status);
  const currentIndex = Math.max(0, stageIndex === -1 ? 0 : stageIndex);
  return (
    <div className="flex items-center w-full">
      {ORDER_STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center text-center w-20">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors duration-300 ${
                done ? 'bg-red-600 border-red-600 text-white'
                : active ? 'border-red-600 text-red-600 bg-red-50 ring-4 ring-red-50'
                : 'border-gray-300 text-gray-300 bg-white'
              }`}>
                {done ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-3 w-3 fill-current" />}
              </div>
              <span className={`mt-1.5 text-[10px] leading-tight ${active ? 'text-red-700 font-bold' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                {stage}
              </span>
            </div>
            {i < ORDER_STAGES.length - 1 && (
              <div className={`flex-1 h-0.5 -mt-5 transition-colors duration-500 ${i < currentIndex ? 'bg-red-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// --- CUSTOMER LOGIN / SIGN UP ---
function AuthPage({ mode, setMode, onLogin, onSignup, onGoogleLogin, authError, authLoading, goHome }) {
  const [loginMethod, setLoginMethod] = useState('email'); // 'email' | 'phone'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const isSignup = mode === 'signup';

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isSignup) {
      onSignup({ name, email, phone, password });
    } else {
      onLogin({ email, password, rememberMe });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-body flex items-center justify-center px-4 py-10">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg shadow-gray-200/60 border border-gray-100 p-8 animate-scale-in">
        <div className="flex items-center gap-2 justify-center mb-1 cursor-pointer group" onClick={goHome}>
          <img src={LOGO_URL} alt="DrutoLink" className="h-10 w-10 object-contain rounded-lg transition-transform duration-200 group-hover:scale-105" />
          <span className="font-display text-2xl font-extrabold tracking-tight text-red-700">
            Druto<span className="font-medium text-gray-700">Link</span>
          </span>
        </div>
        <h1 className="text-xl font-bold text-center mt-3">{isSignup ? 'অ্যাকাউন্ট তৈরি করুন' : 'সাইন ইন করুন'}</h1>
        <p className="text-sm text-gray-500 text-center mt-1">
          {isSignup ? 'শুরু করতে আপনার তথ্য দিন' : 'ফিরে আসার জন্য ধন্যবাদ! আপনার অ্যাকাউন্টে লগ ইন করুন'}
        </p>

        <div className="mt-6 space-y-3">
          <button type="button" onClick={() => onGoogleLogin()} disabled={authLoading}
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-colors disabled:opacity-60">
            <svg className="h-4 w-4" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3c-1.6 4.6-6 8-11.3 8-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6 29.5 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.2-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 15.6 18.9 12 24 12c3 0 5.8 1.1 7.9 3l5.7-5.7C34.5 6 29.5 4 24 4c-7.5 0-14 4.2-17.7 10.7z"/><path fill="#4CAF50" d="M24 44c5.4 0 10.3-1.8 14.1-5l-6.5-5.5C29.5 35.4 26.9 36 24 36c-5.3 0-9.7-3.4-11.3-8l-6.6 5C9.9 39.7 16.4 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.2 4.2-4.1 5.6l6.5 5.5C40.8 36.3 44 30.8 44 24c0-1.2-.1-2.4-.4-3.5z"/></svg>
            Sign in with Google
          </button>
        </div>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-gray-200" />
          <span className="text-xs text-gray-400">or</span>
          <div className="flex-1 h-px bg-gray-200" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isSignup && (
            <div>
              <label className="text-sm font-medium text-gray-700">আপনার নাম</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)}
                placeholder="পুরো নাম লিখুন"
                className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
            </div>
          )}

          {!isSignup && (
            <div className="flex gap-4 text-sm font-medium border-b border-gray-100">
              <button type="button" onClick={() => setLoginMethod('email')}
                className={`pb-2 -mb-px border-b-2 ${loginMethod === 'email' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-400'}`}>
                Email Address
              </button>
              <button type="button" onClick={() => setLoginMethod('phone')}
                className={`pb-2 -mb-px border-b-2 ${loginMethod === 'phone' ? 'border-red-600 text-red-700' : 'border-transparent text-gray-400'}`}>
                Phone Number
              </button>
            </div>
          )}

          {(isSignup || loginMethod === 'email') && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> Email Address</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
            </div>
          )}

          {!isSignup && loginMethod === 'phone' && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5" /> Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
              <p className="text-[11px] text-amber-600 mt-1">ফোন নম্বর দিয়ে লগইন এখনো চালু হয়নি — আপাতত ইমেইল ব্যবহার করুন।</p>
            </div>
          )}

          {isSignup && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5" /> ফোন নম্বর</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-1">
              <input type={showPassword ? 'text' : 'password'} required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2.5 pr-10 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
              <button type="button" onClick={() => setShowPassword((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {!isSignup && (
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" checked={rememberMe} onChange={(e) => setRememberMe(e.target.checked)} />
                Remember me
              </label>
            </div>
          )}

          {authError && <p className="text-red-600 text-xs">{authError}</p>}

          <button type="submit" disabled={authLoading}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100">
            {authLoading ? 'অপেক্ষা করুন...' : isSignup ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          {isSignup ? (
            <>Already have an account? <button onClick={() => setMode('login')} className="text-red-700 font-semibold hover:underline">Sign in</button></>
          ) : (
            <>New here? <button onClick={() => setMode('signup')} className="text-red-700 font-semibold hover:underline">Sign up</button></>
          )}
        </p>

        <button onClick={goHome} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-4 transition-colors">
          স্টোরে ফিরে যান
        </button>
      </div>
    </div>
  );
}

// --- SECURE ADMIN DASHBOARD ---

// Firestore Timestamp বা প্লেইন ভ্যালু, দুটো থেকেই নিরাপদে JS Date বের করে
function toJsDate(ts) {
  if (!ts) return null;
  if (typeof ts.toDate === 'function') return ts.toDate();
  const d = new Date(ts);
  return isNaN(d.getTime()) ? null : d;
}

const DAY_LABELS_BN = ['রবি', 'সোম', 'মঙ্গল', 'বুধ', 'বৃহঃ', 'শুক্র', 'শনি'];

/** ছোট্ট KPI কার্ড — আইকন, লেবেল, বড় সংখ্যা, আর একটা সহায়ক সাব-টেক্সট */
function KpiCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3">
        <span className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent.bg}`}>
          <Icon className={`h-5 w-5 ${accent.text}`} />
        </span>
      </div>
      <p className="text-xl sm:text-2xl font-extrabold text-gray-900 font-display leading-tight">{value}</p>
      <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{label}</p>
      {sub && <p className="text-[11px] text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

/** একটা লেবেলড হরাইজন্টাল বার — অর্ডার স্ট্যাটাস ব্রেকডাউন, ক্যাটাগরি ডিস্ট্রিবিউশন ইত্যাদিতে ব্যবহৃত */
function StatBar({ label, count, max, colorClass, suffix }) {
  const pct = max > 0 ? Math.round((count / max) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
        <span className="text-gray-700 font-medium truncate pr-2">{label}</span>
        <span className="text-gray-500 shrink-0">{count}{suffix || ''}</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${colorClass} transition-all duration-500`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/** প্রফেশনাল ওভারভিউ ড্যাশবোর্ড — সব ডেটার এক নজরে সারসংক্ষেপ, শুধু props হিসেবে পাওয়া
    products/orders/workers/withdrawalRequests থেকে হিসাব করা, আলাদা কোনো API/কল লাগে না। */
function OverviewTab({ products, orders, workers, withdrawalRequests }) {
  const stats = useMemo(() => {
    const num = (v) => { const n = Number(v); return isNaN(n) ? 0 : n; };

    const totalOrders = orders.length;
    const pendingOrders = orders.filter((o) => o.status === 'Pending TrxID').length;
    const confirmedOrders = orders.filter((o) => o.status !== 'Pending TrxID');
    const confirmedRevenue = confirmedOrders.reduce((sum, o) => sum + num(o.totalPrice), 0);
    const deliveredOrders = orders.filter((o) => o.status === 'Delivered').length;
    const avgOrderValue = confirmedOrders.length > 0 ? Math.round(confirmedRevenue / confirmedOrders.length) : 0;

    const pendingWithdrawalAmount = withdrawalRequests
      .filter((r) => r.status === 'pending')
      .reduce((sum, r) => sum + num(r.amount), 0);

    // --- অর্ডার স্ট্যাটাস ব্রেকডাউন ---
    const stageCounts = ORDER_STAGES.map((stage) => ({
      stage,
      count: orders.filter((o) => o.status === stage).length,
    }));
    const maxStageCount = Math.max(1, ...stageCounts.map((s) => s.count));

    // --- গত ১৪ দিনের অর্ডার ট্রেন্ড ---
    const days = [];
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() - i);
      days.push({ date: d, count: 0, revenue: 0 });
    }
    orders.forEach((o) => {
      const od = toJsDate(o.createdAt);
      if (!od) return;
      const odDay = new Date(od); odDay.setHours(0, 0, 0, 0);
      const bucket = days.find((d) => d.date.getTime() === odDay.getTime());
      if (bucket) { bucket.count += 1; if (o.status !== 'Pending TrxID') bucket.revenue += num(o.totalPrice); }
    });
    const maxDayCount = Math.max(1, ...days.map((d) => d.count));

    // --- ক্যাটাগরি অনুযায়ী প্রোডাক্ট বিতরণ ---
    const catMap = new Map();
    products.forEach((p) => {
      const key = p.category || 'অন্যান্য';
      catMap.set(key, (catMap.get(key) || 0) + 1);
    });
    const categoryDist = [...catMap.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6);
    const maxCatCount = Math.max(1, ...categoryDist.map((c) => c.count));

    // --- সবচেয়ে বেশি বিক্রি হওয়া প্রোডাক্ট (অর্ডার আইটেম থেকে) ---
    const soldMap = new Map();
    orders.forEach((o) => {
      (o.items || []).forEach((it) => {
        const key = it.title || 'অজানা';
        const prev = soldMap.get(key) || { title: key, qty: 0, revenue: 0 };
        prev.qty += num(it.quantity) || 1;
        prev.revenue += num(it.price) * (num(it.quantity) || 1);
        soldMap.set(key, prev);
      });
    });
    const topProducts = [...soldMap.values()].sort((a, b) => b.qty - a.qty).slice(0, 5);
    const maxSoldQty = Math.max(1, ...topProducts.map((p) => p.qty));

    // --- কর্মী লিডারবোর্ড (কে কত প্রোডাক্ট তুলেছে, টার্গেটের কত %) ---
    const workerStats = workers
      .map((w) => {
        const listed = products.filter((p) => p.createdBy === w.id).length;
        const target = num(w.listingTarget);
        const progress = target > 0 ? Math.min(100, Math.round((listed / target) * 100)) : null;
        return { id: w.id, name: w.name || w.email, listed, target, progress };
      })
      .sort((a, b) => b.listed - a.listed)
      .slice(0, 5);

    const recentOrders = orders.slice(0, 5);

    return {
      totalOrders, pendingOrders, confirmedRevenue, deliveredOrders, avgOrderValue,
      pendingWithdrawalAmount, stageCounts, maxStageCount, days, maxDayCount,
      categoryDist, maxCatCount, topProducts, maxSoldQty, workerStats, recentOrders,
    };
  }, [products, orders, workers, withdrawalRequests]);

  const STAGE_COLORS = { 'Pending TrxID': 'bg-amber-400', 'Order Placed': 'bg-blue-500', 'Sourced in China': 'bg-purple-500', 'Delivered': 'bg-green-500' };
  const STAGE_LABELS_BN = { 'Pending TrxID': 'TrxID অপেক্ষমান', 'Order Placed': 'অর্ডার প্লেসড', 'Sourced in China': 'চীনে সোর্সিং', 'Delivered': 'ডেলিভারড' };
  const maxDayRevenue = Math.max(1, ...stats.days.map((d) => d.revenue));

  return (
    <div className="space-y-6">
      {/* KPI কার্ড সারি */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
        <KpiCard icon={ShoppingBag} label="মোট অর্ডার" value={stats.totalOrders} accent={{ bg: 'bg-blue-50', text: 'text-blue-600' }} />
        <KpiCard icon={Wallet} label="নিশ্চিত আয়" value={`৳ ${stats.confirmedRevenue.toLocaleString('en-BD')}`} sub={`গড় অর্ডার ৳ ${stats.avgOrderValue}`} accent={{ bg: 'bg-green-50', text: 'text-green-600' }} />
        <KpiCard icon={Clock} label="TrxID অপেক্ষমান" value={stats.pendingOrders} accent={{ bg: 'bg-amber-50', text: 'text-amber-600' }} />
        <KpiCard icon={Package} label="মোট প্রোডাক্ট" value={products.length} accent={{ bg: 'bg-purple-50', text: 'text-purple-600' }} />
        <KpiCard icon={Users} label="সক্রিয় কর্মী" value={workers.length} accent={{ bg: 'bg-indigo-50', text: 'text-indigo-600' }} />
        <KpiCard icon={Banknote} label="উত্তোলন বাকি" value={`৳ ${stats.pendingWithdrawalAmount.toLocaleString('en-BD')}`} accent={{ bg: 'bg-red-50', text: 'text-red-600' }} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* অর্ডার স্ট্যাটাস ব্রেকডাউন */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-5 sm:p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-red-600" /> অর্ডার স্ট্যাটাস
          </h3>
          <div className="space-y-3.5">
            {stats.stageCounts.map((s) => (
              <StatBar key={s.stage} label={STAGE_LABELS_BN[s.stage]} count={s.count} max={stats.maxStageCount} colorClass={STAGE_COLORS[s.stage]} />
            ))}
          </div>
          {stats.deliveredOrders > 0 && stats.totalOrders > 0 && (
            <p className="text-[11px] text-gray-400 mt-4 pt-3 border-t border-gray-100">
              {Math.round((stats.deliveredOrders / stats.totalOrders) * 100)}% অর্ডার সফলভাবে ডেলিভার হয়েছে
            </p>
          )}
        </div>

        {/* গত ১৪ দিনের অর্ডার ট্রেন্ড */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-5 sm:p-6">
          <h3 className="text-base font-bold text-gray-800 mb-1 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-red-600" /> গত ১৪ দিনের অর্ডার
          </h3>
          <p className="text-xs text-gray-400 mb-5">প্রতিটা বার একদিনের মোট অর্ডার সংখ্যা বোঝায়</p>
          <div className="flex items-end gap-1.5 sm:gap-2 h-32">
            {stats.days.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                <div
                  className={`w-full rounded-t-md transition-all duration-500 ${d.count > 0 ? 'bg-red-500 group-hover:bg-red-600' : 'bg-gray-100'}`}
                  style={{ height: `${Math.max(4, (d.count / stats.maxDayCount) * 100)}%` }}
                  title={`${d.date.toLocaleDateString('bn-BD')}: ${d.count} অর্ডার, ৳ ${d.revenue}`}
                />
                <span className="text-[9px] text-gray-400 mt-1.5">{DAY_LABELS_BN[d.date.getDay()]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* ক্যাটাগরি ডিস্ট্রিবিউশন */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-5 sm:p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Package className="h-4 w-4 text-red-600" /> ক্যাটাগরি অনুযায়ী প্রোডাক্ট
          </h3>
          {stats.categoryDist.length === 0 ? (
            <p className="text-sm text-gray-400">এখনো কোনো প্রোডাক্ট নেই।</p>
          ) : (
            <div className="space-y-3.5">
              {stats.categoryDist.map((c) => (
                <StatBar key={c.name} label={c.name} count={c.count} max={stats.maxCatCount} colorClass="bg-red-500" suffix=" টি" />
              ))}
            </div>
          )}
        </div>

        {/* সবচেয়ে বেশি বিক্রি হওয়া প্রোডাক্ট */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-5 sm:p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="h-4 w-4 text-red-600" /> সেরা বিক্রিত প্রোডাক্ট
          </h3>
          {stats.topProducts.length === 0 ? (
            <p className="text-sm text-gray-400">এখনো কোনো অর্ডার আসেনি।</p>
          ) : (
            <div className="space-y-3.5">
              {stats.topProducts.map((p, i) => (
                <div key={p.title} className="flex items-center gap-3">
                  <span className="h-6 w-6 shrink-0 rounded-full bg-red-50 text-red-600 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                      <span className="text-gray-700 font-medium truncate pr-2">{p.title}</span>
                      <span className="text-gray-500 shrink-0">{p.qty} বিক্রি</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-red-500 transition-all duration-500" style={{ width: `${Math.round((p.qty / stats.maxSoldQty) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* সাম্প্রতিক অর্ডার */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-5 sm:p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-red-600" /> সাম্প্রতিক অর্ডার
          </h3>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-gray-400">এখনো কোনো অর্ডার আসেনি।</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {stats.recentOrders.map((o) => (
                <div key={o.id} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{o.customerName || o.customerEmail || 'অজানা কাস্টমার'}</p>
                    <p className="text-[11px] text-gray-400">{(o.items || []).length} আইটেম · ৳ {o.totalPrice}</p>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-1 rounded-full shrink-0 ${
                    o.status === 'Delivered' ? 'bg-green-100 text-green-700'
                    : o.status === 'Pending TrxID' ? 'bg-amber-100 text-amber-700'
                    : 'bg-blue-100 text-blue-700'
                  }`}>
                    {STAGE_LABELS_BN[o.status] || o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* কর্মী লিডারবোর্ড */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow duration-200 p-5 sm:p-6">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users className="h-4 w-4 text-red-600" /> কর্মী লিডারবোর্ড
          </h3>
          {stats.workerStats.length === 0 ? (
            <p className="text-sm text-gray-400">এখনো কোনো কর্মী নেই।</p>
          ) : (
            <div className="space-y-3.5">
              {stats.workerStats.map((w, i) => (
                <div key={w.id} className="flex items-center gap-3">
                  <span className="h-6 w-6 shrink-0 rounded-full bg-red-50 text-red-600 text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-xs sm:text-sm mb-1">
                      <span className="text-gray-700 font-medium truncate pr-2">{w.name}</span>
                      <span className="text-gray-500 shrink-0">{w.listed}{w.target > 0 ? ` / ${w.target}` : ' টি'}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${w.progress != null && w.progress >= 100 ? 'bg-green-500' : 'bg-indigo-500'}`}
                        style={{ width: w.progress != null ? `${w.progress}%` : '100%' }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {stats.pendingOrders > 0 && (
        <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-xl px-4 py-3">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <span>{stats.pendingOrders} টি অর্ডারের TrxID এখনো যাচাই করা বাকি — "অর্ডার ও TrxID" ট্যাবে গিয়ে দেখুন।</span>
        </div>
      )}
    </div>
  );
}

function AdminDashboard({ goHome, handleLogout, products, orders, workers, handleCreateWorker, handleDeleteWorker, handleUpdateWorkerSettings, withdrawalRequests, handleProcessWithdrawal }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false); // মোবাইলে সাইডবার লুকানো/দেখানো নিয়ন্ত্রণ করে

  // --- Worker creation form state ---
  const [workerName, setWorkerName] = useState('');
  const [workerEmail, setWorkerEmail] = useState('');
  const [workerPassword, setWorkerPassword] = useState('');
  const [workerSaving, setWorkerSaving] = useState(false);
  const [workerFormError, setWorkerFormError] = useState('');

  const onCreateWorker = async (e) => {
    e.preventDefault();
    setWorkerFormError('');
    if (!workerName || !workerEmail || !workerPassword) {
      setWorkerFormError('নাম, ইমেইল ও পাসওয়ার্ড — সবগুলো দিন।');
      return;
    }
    if (workerPassword.length < 6) {
      setWorkerFormError('পাসওয়ার্ড কমপক্ষে ৬ ক্যারেক্টারের হতে হবে।');
      return;
    }
    setWorkerSaving(true);
    try {
      await handleCreateWorker({ name: workerName, email: workerEmail, password: workerPassword });
      setWorkerName(''); setWorkerEmail(''); setWorkerPassword('');
    } catch (err) {
      setWorkerFormError(
        err.code === 'auth/email-already-in-use'
          ? 'এই ইমেইল দিয়ে আগে থেকেই অ্যাকাউন্ট আছে।'
          : 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      );
    } finally {
      setWorkerSaving(false);
    }
  };
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [saving, setSaving] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null); // null হলে নতুন প্রোডাক্ট যোগ হচ্ছে, id থাকলে ঐ প্রোডাক্ট এডিট হচ্ছে

  // --- Size / color variants ---
  const [sizeInput, setSizeInput] = useState('');
  const [sizes, setSizes] = useState([]);
  const [colorNameInput, setColorNameInput] = useState('');
  const [colorHexInput, setColorHexInput] = useState('#dc2626');
  const [colors, setColors] = useState([]);

  const handleAddSize = () => {
    const val = sizeInput.trim();
    if (!val) return;
    if (sizes.includes(val)) { setSizeInput(''); return; }
    setSizes((prev) => [...prev, val]);
    setSizeInput('');
  };

  const handleRemoveSize = (val) => setSizes((prev) => prev.filter((s) => s !== val));

  const handleAddColor = () => {
    const name = colorNameInput.trim();
    if (!name) return;
    if (colors.some((c) => c.name === name)) { setColorNameInput(''); return; }
    setColors((prev) => [...prev, { name, hex: colorHexInput }]);
    setColorNameInput('');
  };

  const handleRemoveColor = (name) => setColors((prev) => prev.filter((c) => c.name !== name));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    if (!title || !price) {
      alert('প্রোডাক্টের নাম ও দাম দিন।');
      return;
    }
    setSaving(true);
    try {
      const data = {
        title,
        price,
        estimatedWeightKg: Number(estimatedWeightKg) > 0 ? Number(estimatedWeightKg) : null,
        category,
        image: image || 'productPlaceholderAsset',
        sizes,
        colors,
      };
      if (editingProductId) {
        await updateDoc(doc(db, 'products', editingProductId), data);
        alert('প্রোডাক্ট আপডেট হয়েছে!');
      } else {
        await addDoc(collection(db, 'products'), {
          ...data,
          createdAt: serverTimestamp(),
          createdBy: 'admin',
          createdByName: 'Admin',
        });
        alert('প্রোডাক্ট সফলভাবে যোগ হয়েছে!');
      }
      setEditingProductId(null);
      setTitle(''); setPrice(''); setEstimatedWeightKg(''); setImage(''); setCategory(CATEGORIES[0].name);
      setSizes([]); setColors([]); setSizeInput(''); setColorNameInput('');
      setActiveTab('orders');
    } catch (err) {
      alert(err?.message || 'প্রোডাক্ট সেভ করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  // প্রোডাক্ট কার্ডের এডিট বাটনে ক্লিক করলে ফর্মে বিদ্যমান তথ্য বসে যায়, সেভ করলে addDoc না হয়ে updateDoc হয়
  const handleStartEditProduct = (p) => {
    setEditingProductId(p.id);
    setTitle(p.title || '');
    setPrice(p.price || '');
    setEstimatedWeightKg(p.estimatedWeightKg || '');
    setImage(p.image || '');
    setCategory(p.category || CATEGORIES[0].name);
    setSizes(p.sizes || []);
    setColors(p.colors || []);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEditProduct = () => {
    setEditingProductId(null);
    setTitle(''); setPrice(''); setEstimatedWeightKg(''); setImage(''); setCategory(CATEGORIES[0].name);
    setSizes([]); setColors([]); setSizeInput(''); setColorNameInput('');
  };

  const handleDeleteProduct = async (id) => {
    await deleteDoc(doc(db, 'products', id));
  };

  const handleUpdateStatus = async (orderId, status) => {
    await updateDoc(doc(db, 'orders', orderId), { status });
  };

  const handleUpdateOrderShipping = async (orderId, actualWeightKg) => {
    const weight = Number(actualWeightKg);
    if (!Number.isFinite(weight) || weight <= 0) throw new Error('সঠিক প্রকৃত ওজন দিন।');
    const order = orders.find((o) => o.id === orderId);
    if (!order) throw new Error('অর্ডার পাওয়া যায়নি।');
    const productSubtotal = Number(order.productSubtotal ?? order.totalPrice ?? 0);
    const finalShippingCharge = Math.round(weight * SHIPPING_RATE_PER_KG);
    await updateDoc(doc(db, 'orders', orderId), {
      actualWeightKg: weight,
      finalShippingCharge,
      totalPrice: productSubtotal + finalShippingCharge,
      shippingRatePerKg: SHIPPING_RATE_PER_KG,
      shippingFinalizedAt: serverTimestamp(),
    });
  };

  return (
    <div className="flex h-screen bg-gray-50 font-body w-full overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-red-700 text-white flex flex-col shadow-xl shadow-red-900/20 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src={LOGO_URL} alt="DrutoLink" className="h-10 w-10 object-contain rounded-lg" />
              <h1 className="font-display text-2xl font-bold">
                Druto<span className="text-red-100 font-medium">Admin</span>
              </h1>
            </div>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-red-100 hover:text-white p-1 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => { setActiveTab('overview'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-150 ${activeTab === 'overview' ? 'bg-white text-red-700 shadow-sm' : 'text-red-100 hover:bg-red-800'}`}>
            <LayoutDashboard className="h-5 w-5" />
            <span>ওভারভিউ</span>
          </button>
          <button onClick={() => { setActiveTab('orders'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-150 ${activeTab === 'orders' ? 'bg-white text-red-700 shadow-sm' : 'text-red-100 hover:bg-red-800'}`}>
            <ShoppingBag className="h-5 w-5" />
            <span>অর্ডার ও TrxID ({orders.length})</span>
          </button>
          <button onClick={() => { setActiveTab('products'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-150 ${activeTab === 'products' ? 'bg-white text-red-700 shadow-sm' : 'text-red-100 hover:bg-red-800'}`}>
            <Package className="h-5 w-5" />
            <span>প্রোডাক্ট ({products.length})</span>
          </button>
          <button onClick={() => { setActiveTab('workers'); setSidebarOpen(false); }} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-150 ${activeTab === 'workers' ? 'bg-white text-red-700 shadow-sm' : 'text-red-100 hover:bg-red-800'}`}>
            <Users className="h-5 w-5" />
            <span>কর্মী ({workers.length})</span>
          </button>
        </nav>
        <div className="p-4 border-t border-red-600 space-y-2">
          <button onClick={goHome} className="w-full flex items-center justify-center space-x-2 bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>স্টোরে ফিরুন</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" />
            <span>লগ-আউট</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex justify-between items-center gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-red-700 p-1 shrink-0">
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-b-2 border-red-600 pb-1 truncate">
              {activeTab === 'overview' ? 'ড্যাশবোর্ড ওভারভিউ' : activeTab === 'orders' ? 'অর্ডার ম্যানেজমেন্ট' : activeTab === 'products' ? 'প্রোডাক্ট ইনভেন্টরি' : 'কর্মী ম্যানেজমেন্ট'}
            </h2>
          </div>
          <span className="hidden sm:inline text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full shrink-0">নিরাপদভাবে লগ ইন করা আছে</span>
        </header>

        <main className="flex-1 overflow-y-auto thin-scroll p-4 sm:p-8">
          {activeTab === 'overview' && (
            <OverviewTab products={products} orders={orders} workers={workers} withdrawalRequests={withdrawalRequests} />
          )}
          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">সাম্প্রতিক অর্ডার (ম্যানুয়াল যাচাই)</h3>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-sm">এখনো কোনো অর্ডার আসেনি।</p>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200">
                      <th className="p-4 font-medium">প্রোডাক্ট</th>
                      <th className="p-4 font-medium">পেমেন্ট (TrxID)</th>
                      <th className="p-4 font-medium">ডেলিভারি / শিপিং</th>
                      <th className="p-4 font-medium">স্ট্যাটাস</th>
                      <th className="p-4 font-medium">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((o) => (
                      <tr key={o.id} className="border-b border-gray-100 hover:bg-gray-50 align-top">
                        <td className="p-4 text-sm">
                          {(o.items || []).map((it, idx) => (
                            <p key={idx} className="font-semibold">
                              {it.title} × {it.quantity} <span className="text-gray-500 font-normal">(৳ {it.price})</span>
                              {(it.selectedSize || it.selectedColor) && (
                                <span className="block text-[11px] text-gray-500 font-normal">
                                  {it.selectedSize && `সাইজ: ${it.selectedSize}`}
                                  {it.selectedSize && it.selectedColor && ' · '}
                                  {it.selectedColor && `কালার: ${it.selectedColor}`}
                                </span>
                              )}
                            </p>
                          ))}
                          <p className="text-[11px] text-gray-400 font-mono mt-2">{o.orderNumber || `DL-${o.id?.slice(0,8)?.toUpperCase()}`}</p>
                          <p className="text-xs text-red-600 font-bold mt-1">মোট ৳ {Number(o.totalPrice || 0).toLocaleString('en-BD')}</p>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold mb-1 ${o.paymentMethod === 'bkash' ? 'bg-pink-100 text-pink-700' : 'bg-orange-100 text-orange-700'}`}>
                            {o.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'}
                          </span>
                          <p className="font-mono text-sm">{o.trxId}</p>
                          <p className="text-[11px] text-gray-500">A/C: {o.accountNumber}</p>
                        </td>
                        <td className="p-4 min-w-[230px]">
                          <p className="text-xs text-gray-500 mb-1">আনুমানিক: {Number(o.estimatedWeightKg || 0).toFixed(2)} KG · ৳ {Number(o.estimatedShippingCharge || 0).toLocaleString('en-BD')}</p>
                          <p className="text-xs text-gray-600 mb-2">ডেলিভারি: {o.deliveryAddress?.district || '—'}{o.deliveryAddress?.area ? `, ${o.deliveryAddress.area}` : ''}</p>
                          <div className="flex gap-2">
                            <input type="number" min="0.01" step="0.01" defaultValue={o.actualWeightKg || ''} placeholder="প্রকৃত KG"
                              id={`actual-weight-${o.id}`} className="w-24 border border-gray-200 rounded px-2 py-1.5 text-xs" />
                            <button onClick={async () => {
                              const el = document.getElementById(`actual-weight-${o.id}`);
                              try { await handleUpdateOrderShipping(o.id, el?.value); alert('প্রকৃত ওজন ও Shipping Charge আপডেট হয়েছে।'); }
                              catch (err) { alert(err?.message || 'Shipping আপডেট করা যায়নি।'); }
                            }} className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded">ওজন সেভ</button>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-1">
                            চূড়ান্ত: {o.actualWeightKg ? `${Number(o.actualWeightKg).toFixed(2)} KG · ৳ ${Number(o.finalShippingCharge || 0).toLocaleString('en-BD')}` : 'এখনো নির্ধারণ করা হয়নি'}
                          </p>
                        </td>
                        <td className="p-4">
                          <select value={o.status} onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-sm rounded p-2">
                            {ORDER_STAGES.map((stage) => <option key={stage}>{stage}</option>)}
                          </select>
                        </td>
                        <td className="p-4">
                          <button onClick={() => handleUpdateStatus(o.id, 'Order Placed')}
                            className="flex items-center space-x-1 text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded text-sm">
                            <CheckCircle className="h-4 w-4" />
                            <span>Approve</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-6 max-w-2xl">
                <h3 className="text-lg font-bold mb-4">{editingProductId ? 'প্রোডাক্ট এডিট করুন' : 'নতুন পাইকারি প্রোডাক্ট যোগ করুন'}</h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">প্রোডাক্টের নাম</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" placeholder="যেমনঃ পুতিয়ান স্পোর্টস জুতা" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150 bg-white">
                      {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">দাম (টাকা)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" placeholder="2500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">আনুমানিক ওজন (KG)</label>
                    <input type="number" min="0.01" step="0.01" value={estimatedWeightKg} onChange={(e) => setEstimatedWeightKg(e.target.value)}
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" placeholder="যেমনঃ 0.50" />
                    <p className="text-[11px] text-gray-400 mt-1">কার্টের আনুমানিক Shipping Charge হিসাবের জন্য ব্যবহার হবে।</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">পিসি থেকে ছবি আপলোড করুন</label>
                    <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                      <input type="file" accept="image/*" onChange={handleImageUpload}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer" />
                    </div>
                    {image && (
                      <div className="mt-3 flex items-center space-x-3 bg-red-50 p-3 rounded-lg border border-red-100">
                        <img src={image} alt="Preview" className="h-16 w-16 object-cover rounded border" />
                        <div>
                          <p className="text-xs font-bold text-red-700">ছবি প্রস্তুত!</p>
                          <p className="text-[10px] text-gray-500">ফাইল লোড হয়ে গেছে।</p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">সাইজ (ঐচ্ছিক — জুতা/পোশাকের জন্য)</label>
                    <div className="flex gap-2">
                      <input type="text" value={sizeInput}
                        onChange={(e) => setSizeInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSize(); } }}
                        placeholder="যেমনঃ 26" className="flex-1 border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
                      <button type="button" onClick={handleAddSize}
                        className="bg-gray-800 hover:bg-gray-900 text-white px-4 rounded-lg text-sm font-semibold">যোগ করুন</button>
                    </div>
                    {sizes.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {sizes.map((s) => (
                          <span key={s} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                            {s}
                            <button type="button" onClick={() => handleRemoveSize(s)} className="text-gray-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">কালার (ঐচ্ছিক)</label>
                    <div className="flex gap-2">
                      <input type="color" value={colorHexInput} onChange={(e) => setColorHexInput(e.target.value)}
                        className="h-[42px] w-14 border rounded-lg cursor-pointer p-1" />
                      <input type="text" value={colorNameInput}
                        onChange={(e) => setColorNameInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddColor(); } }}
                        placeholder="যেমনঃ লাল" className="flex-1 border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
                      <button type="button" onClick={handleAddColor}
                        className="bg-gray-800 hover:bg-gray-900 text-white px-4 rounded-lg text-sm font-semibold">যোগ করুন</button>
                    </div>
                    {colors.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {colors.map((c) => (
                          <span key={c.name} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                            <span className="h-3.5 w-3.5 rounded-full border border-gray-300" style={{ backgroundColor: c.hex }} />
                            {c.name}
                            <button type="button" onClick={() => handleRemoveColor(c.name)} className="text-gray-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-3">
                    <button type="submit" disabled={saving} className="flex-1 bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60">
                      {saving ? 'সেভ হচ্ছে...' : editingProductId ? 'পরিবর্তন সংরক্ষণ করুন' : 'সেভ করুন ও পাবলিশ করুন'}
                    </button>
                    {editingProductId && (
                      <button type="button" onClick={handleCancelEditProduct}
                        className="px-5 bg-gray-200 text-gray-700 font-semibold rounded-lg hover:bg-gray-300 transition-colors">
                        বাতিল
                      </button>
                    )}
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">চালু ক্যাটালগ ({products.length} টি)</h3>
                {products.length === 0 ? (
                  <p className="text-gray-500 text-sm">এখনো কোনো প্রোডাক্ট যোগ করা হয়নি।</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {products.map((p) => (
                      <div key={p.id} className="border rounded-lg p-4 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <img src={p.image} alt={p.title} className="h-12 w-12 object-cover rounded" />
                          <div>
                            <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{p.title}</h4>
                            <p className="text-xs text-red-600 font-semibold">৳ {p.price}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{p.category}</p>
                            {((p.sizes && p.sizes.length > 0) || (p.colors && p.colors.length > 0)) && (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {p.sizes?.length ? `${p.sizes.length} সাইজ` : ''}
                                {p.sizes?.length && p.colors?.length ? ' · ' : ''}
                                {p.colors?.length ? `${p.colors.length} কালার` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleStartEditProduct(p)} className="text-gray-500 hover:text-red-600 p-1">
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'workers' && (
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-6 max-w-xl">
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-red-600" /> নতুন কর্মী অ্যাকাউন্ট তৈরি করুন
                </h3>
                <p className="text-xs text-gray-500 mb-4">এই অ্যাকাউন্ট দিয়ে কর্মী শুধু প্রোডাক্ট লিস্টিং করতে পারবে — অর্ডার বা অন্য কোনো ডেটা দেখতে/বদলাতে পারবে না।</p>
                <form onSubmit={onCreateWorker} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">কর্মীর নাম</label>
                    <input type="text" value={workerName} onChange={(e) => setWorkerName(e.target.value)}
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" placeholder="যেমনঃ রহিম উদ্দিন" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল (লগইন আইডি)</label>
                    <input type="email" value={workerEmail} onChange={(e) => setWorkerEmail(e.target.value)}
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" placeholder="worker1@drutolink.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
                    <input type="text" value={workerPassword} onChange={(e) => setWorkerPassword(e.target.value)}
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" placeholder="কমপক্ষে ৬ ক্যারেক্টার" />
                  </div>
                  {workerFormError && <p className="text-red-600 text-xs">{workerFormError}</p>}
                  <button type="submit" disabled={workerSaving} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60">
                    {workerSaving ? 'তৈরি হচ্ছে...' : 'কর্মী অ্যাকাউন্ট তৈরি করুন'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">কর্মী তালিকা, লিমিট ও পেমেন্ট সেটিংস ({workers.length} জন)</h3>
                {workers.length === 0 ? (
                  <p className="text-gray-500 text-sm">এখনো কোনো কর্মী অ্যাকাউন্ট তৈরি করা হয়নি।</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {workers.map((w) => (
                      <WorkerCard
                        key={w.id}
                        worker={w}
                        productCount={products.filter((p) => p.createdBy === w.id).length}
                        onSaveSettings={handleUpdateWorkerSettings}
                        onDeleteWorker={handleDeleteWorker}
                      />
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-6">
                <h3 className="text-lg font-bold mb-4">
                  পেমেন্ট / উত্তোলনের অনুরোধ
                  {withdrawalRequests.filter((r) => r.status === 'pending').length > 0 && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded-full align-middle">
                      {withdrawalRequests.filter((r) => r.status === 'pending').length} টি অপেক্ষমান
                    </span>
                  )}
                </h3>
                {withdrawalRequests.length === 0 ? (
                  <p className="text-gray-500 text-sm">এখনো কোনো উত্তোলনের অনুরোধ আসেনি।</p>
                ) : (
                  <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200">
                        <th className="p-3 font-medium">কর্মী</th>
                        <th className="p-3 font-medium">পরিমাণ</th>
                        <th className="p-3 font-medium">রিকোয়েস্টের সময়</th>
                        <th className="p-3 font-medium">স্ট্যাটাস</th>
                        <th className="p-3 font-medium">প্রসেসের সময়</th>
                        <th className="p-3 font-medium">অ্যাকশন</th>
                      </tr>
                    </thead>
                    <tbody>
                      {withdrawalRequests.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100 align-middle">
                          <td className="p-3 text-sm font-semibold">{r.workerName}</td>
                          <td className="p-3 text-sm text-red-600 font-bold">৳ {Number(r.amount || 0).toLocaleString('en-BD')}</td>
                          <td className="p-3 text-xs text-gray-500">{toJsDate(r.createdAt)?.toLocaleString('bn-BD') || '—'}</td>
                          <td className="p-3">
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                              r.status === 'paid' ? 'bg-green-100 text-green-700'
                              : r.status === 'rejected' ? 'bg-gray-200 text-gray-600'
                              : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {r.status === 'paid' ? 'পরিশোধিত' : r.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমান'}
                            </span>
                          </td>
                          <td className="p-3 text-xs text-gray-500">{toJsDate(r.processedAt)?.toLocaleString('bn-BD') || '—'}</td>
                          <td className="p-3">
                            {r.status === 'pending' && (
                              <div className="flex gap-2">
                                <button onClick={() => handleProcessWithdrawal(r.id, 'paid')}
                                  className="flex items-center space-x-1 text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded text-xs font-semibold">
                                  <CheckCircle className="h-3.5 w-3.5" /><span>পরিশোধ হয়েছে</span>
                                </button>
                                <button onClick={() => handleProcessWithdrawal(r.id, 'rejected')}
                                  className="flex items-center space-x-1 text-gray-600 bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-xs font-semibold">
                                  <X className="h-3.5 w-3.5" /><span>বাতিল করুন</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- WORKER CARD (in AdminDashboard's Workers tab) ---
function WorkerCard({ worker, productCount, onSaveSettings, onDeleteWorker }) {
  const [assignedCategory, setAssignedCategory] = useState(worker.assignedCategory || '');
  const [listingTarget, setListingTarget] = useState(worker.listingTarget ?? '');
  const [ratePerListing, setRatePerListing] = useState(worker.ratePerListing ?? '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setAssignedCategory(worker.assignedCategory || '');
    setListingTarget(worker.listingTarget ?? '');
    setRatePerListing(worker.ratePerListing ?? '');
  }, [worker.assignedCategory, worker.listingTarget, worker.ratePerListing]);

  const cycleUsed = Number(worker.listingUsed ?? productCount ?? 0);
  const lifetimeListings = Number(worker.lifetimeListings ?? productCount ?? 0);
  const listingLimit = worker.listingTarget == null || worker.listingTarget === '' ? null : Number(worker.listingTarget);
  const currentEarnings = Number(worker.currentEarnings ?? (cycleUsed * (Number(ratePerListing) || 0)));
  const limitReached = listingLimit !== null && cycleUsed >= listingLimit;
  const progress = listingLimit !== null && listingLimit > 0 ? Math.min(100, Math.round((cycleUsed / listingLimit) * 100)) : 0;

  const onSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSaveSettings(worker.id, {
        assignedCategory, listingTarget, ratePerListing,
        currentListingUsed: cycleUsed,
        currentLifetimeListings: lifetimeListings,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-3 transition-shadow duration-200 hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="h-10 w-10 rounded-full bg-red-100 text-red-700 font-bold flex items-center justify-center shrink-0">
            {(worker.name || worker.email || '?')[0].toUpperCase()}
          </div>
          <div className="min-w-0">
            <h4 className="font-bold text-sm text-gray-800 truncate">{worker.name || 'নামহীন'}</h4>
            <p className="text-xs text-gray-500 truncate">{worker.email}</p>
          </div>
        </div>
        <button onClick={() => onDeleteWorker(worker.id)} className="text-red-500 hover:text-red-700 p-1 transition-colors shrink-0" title="কর্মী প্রোফাইল মুছুন">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="bg-white rounded-lg border p-3">
          <p className="text-[10px] text-gray-400">বর্তমান লিমিট</p>
          <p className={`text-lg font-bold ${limitReached ? 'text-red-600' : 'text-gray-800'}`}>
            {listingLimit === null ? '∞' : `${cycleUsed} / ${listingLimit}`}
          </p>
          <p className="text-[10px] text-gray-400">{limitReached ? 'লিমিট শেষ' : 'চলতি সাইকেল'}</p>
        </div>
        <div className="bg-white rounded-lg border p-3">
          <p className="text-[10px] text-gray-400">মোট লিস্টিং</p>
          <p className="text-lg font-bold text-indigo-600">{lifetimeListings}</p>
          <p className="text-[10px] text-gray-400">শুরু থেকে আজ পর্যন্ত</p>
        </div>
      </div>

      {listingLimit !== null && listingLimit > 0 && (
        <div>
          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
            <span>চলতি লিমিটের অগ্রগতি</span><span>{progress}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all ${limitReached ? 'bg-red-600' : 'bg-green-500'}`} style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        <div className="col-span-2">
          <label className="block text-[11px] font-medium text-gray-600 mb-1">অ্যাসাইন করা ক্যাটাগরি</label>
          <select value={assignedCategory} onChange={(e) => setAssignedCategory(e.target.value)}
            className="w-full border rounded-lg p-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150 bg-white">
            <option value="">সব ক্যাটাগরি (নির্দিষ্ট নয়)</option>
            {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">লিস্টিং লিমিট</label>
          <input type="number" min="0" value={listingTarget} onChange={(e) => setListingTarget(e.target.value)}
            placeholder="যেমনঃ 100" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">প্রতি লিস্টিং রেট (৳)</label>
          <input type="number" min="0" value={ratePerListing} onChange={(e) => setRatePerListing(e.target.value)}
            placeholder="যেমনঃ 5" className="w-full border rounded-lg p-2 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
        </div>
      </div>

      {limitReached && <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg p-2">এই কর্মীর বর্তমান লিস্টিং লিমিট শেষ। নতুন লিমিট সেট করলে নতুন সাইকেল শুরু হবে।</p>}

      <div className="flex items-center justify-between gap-3 pt-1">
        <p className="text-xs text-gray-500">চলতি আয়: <span className="font-bold text-red-600">৳ {currentEarnings}</span></p>
        <button onClick={onSave} disabled={saving}
          className="bg-gray-800 hover:bg-gray-900 text-white text-xs font-semibold px-4 py-2 rounded-lg transition-all duration-150 active:scale-95 disabled:opacity-60 disabled:active:scale-100">
          {saving ? 'সেভ হচ্ছে...' : saved ? 'সেভ হয়েছে ✓' : 'সেটিংস সংরক্ষণ করুন'}
        </button>
      </div>
    </div>
  );
}

// --- WORKER DASHBOARD (product-listing-only access) ---
function WorkerDashboard({ goHome, handleLogout, workerProfile, myProducts, handleAddWorkerProduct, handleDeleteWorkerProduct, myWithdrawalRequests, handleRequestWithdrawal }) {
  const [sidebarOpen, setSidebarOpen] = useState(false); // মোবাইলে সাইডবার লুকানো/দেখানো নিয়ন্ত্রণ করে
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [estimatedWeightKg, setEstimatedWeightKg] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState(workerProfile?.assignedCategory || CATEGORIES[0].name);
  const [saving, setSaving] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [sizeInput, setSizeInput] = useState('');
  const [sizes, setSizes] = useState([]);
  const [colorNameInput, setColorNameInput] = useState('');
  const [colorHexInput, setColorHexInput] = useState('#dc2626');
  const [colors, setColors] = useState([]);

  const handleAddSize = () => {
    const val = sizeInput.trim();
    if (!val) return;
    if (sizes.includes(val)) { setSizeInput(''); return; }
    setSizes((prev) => [...prev, val]);
    setSizeInput('');
  };
  const handleRemoveSize = (val) => setSizes((prev) => prev.filter((s) => s !== val));

  const handleAddColor = () => {
    const name = colorNameInput.trim();
    if (!name) return;
    if (colors.some((c) => c.name === name)) { setColorNameInput(''); return; }
    setColors((prev) => [...prev, { name, hex: colorHexInput }]);
    setColorNameInput('');
  };
  const handleRemoveColor = (name) => setColors((prev) => prev.filter((c) => c.name !== name));

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // --- চলতি লিমিট, আজীবন লিস্টিং ও উত্তোলনের হিসাব ---
  // Stored counters are used instead of myProducts.length because deleting a product
  // must never give a worker a new quota slot or erase lifetime listing history.
  const legacyProductCount = myProducts.length;
  const listingsDone = Number(workerProfile?.listingUsed ?? legacyProductCount);
  const lifetimeListings = Number(workerProfile?.lifetimeListings ?? legacyProductCount);
  const listingTarget = workerProfile?.listingTarget == null || workerProfile?.listingTarget === ''
    ? null : Number(workerProfile.listingTarget);
  const ratePerListing = Number(workerProfile?.ratePerListing) || 0;
  const currentEarnings = Number(workerProfile?.currentEarnings ?? (listingsDone * ratePerListing));
  const pendingAmount = Number(workerProfile?.pendingWithdrawal || 0);
  const availableBalance = Math.max(0, currentEarnings - pendingAmount);
  const hasPendingRequest = pendingAmount > 0 || myWithdrawalRequests.some((r) => r.status === 'pending');
  const canWithdraw = availableBalance >= 500 && !hasPendingRequest;
  const limitReached = listingTarget !== null && listingsDone >= listingTarget;
  const targetPct = listingTarget !== null && listingTarget > 0 ? Math.min(100, Math.round((listingsDone / listingTarget) * 100)) : 0;

  const onWithdraw = async () => {
    if (!canWithdraw) return;
    if (!window.confirm(`৳ ${availableBalance} উত্তোলনের অনুরোধ পাঠাতে চান?`)) return;
    setWithdrawing(true);
    try {
      await handleRequestWithdrawal(availableBalance);
    } catch (err) {
      alert(err?.message || 'উইথড্রও রিকোয়েস্ট পাঠাতে সমস্যা হয়েছে।');
    } finally {
      setWithdrawing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !price) {
      alert('প্রোডাক্টের নাম ও দাম দিন।');
      return;
    }
    setSaving(true);
    try {
      await handleAddWorkerProduct({ title, price, category, image, sizes, colors, estimatedWeightKg });
      setTitle(''); setPrice(''); setEstimatedWeightKg(''); setImage('');
      setCategory(workerProfile?.assignedCategory || CATEGORIES[0].name); // ফিক্স: নির্ধারিত ক্যাটাগরি থাকলে সেটাতেই ফিরবে, ভুল করে CATEGORIES[0]-এ চলে যাবে না
      setSizes([]); setColors([]); setSizeInput(''); setColorNameInput('');
      alert('প্রোডাক্ট সফলভাবে যোগ হয়েছে!');
    } catch (err) {
      alert(err?.message || 'প্রোডাক্ট সেভ করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 font-body w-full overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-red-700 text-white flex flex-col shadow-xl shadow-red-900/20 transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <img src={LOGO_URL} alt="DrutoLink" className="h-10 w-10 object-contain rounded-lg" />
              <h1 className="font-display text-2xl font-bold">
                Druto<span className="text-red-100 font-medium">Worker</span>
              </h1>
            </div>
            <p className="text-xs text-red-100 mt-1">{workerProfile?.name || workerProfile?.email}</p>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-red-100 hover:text-white p-1 transition-colors">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <div className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg bg-white text-red-700 shadow-sm">
            <Package className="h-5 w-5" />
            <span>আমার প্রোডাক্ট ({myProducts.length})</span>
          </div>
        </nav>
        <div className="p-4 border-t border-red-600 space-y-2">
          <button onClick={goHome} className="w-full flex items-center justify-center space-x-2 bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>স্টোরে ফিরুন</span>
          </button>
          <button onClick={handleLogout} className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-900 text-white px-4 py-2 rounded-lg transition-colors">
            <LogOut className="h-4 w-4" />
            <span>লগ-আউট</span>
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="bg-white border-b border-gray-200 px-4 sm:px-8 py-4 flex justify-between items-center gap-2">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-600 hover:text-red-700 p-1 shrink-0">
              <Menu className="h-6 w-6" />
            </button>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 border-b-2 border-red-600 pb-1 truncate">প্রোডাক্ট লিস্টিং</h2>
          </div>
          <span className="hidden sm:inline text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full shrink-0">কর্মী হিসেবে লগ ইন করা আছে</span>
        </header>

        <main className="flex-1 overflow-y-auto thin-scroll p-4 sm:p-8">
          <div className="space-y-8">
            {/* --- অ্যাডমিনের সেট করা ক্যাটাগরি/টার্গেট/আয়ের লাইভ তথ্য-বক্স --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-5">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-2">
                  <Package className="h-4 w-4" /> অ্যাসাইন করা ক্যাটাগরি
                </div>
                <p className="text-lg font-bold text-gray-800">
                  {workerProfile?.assignedCategory || 'সব ক্যাটাগরি'}
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-5">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-2">
                  <ShoppingBag className="h-4 w-4" /> লিস্টিং টার্গেট
                </div>
                <p className="text-lg font-bold text-gray-800 mb-2">
                  {listingsDone} {listingTarget > 0 ? `/ ${listingTarget}` : ''} <span className="text-xs font-normal text-gray-400">টি</span>
                </p>
                {listingTarget > 0 && (
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-red-600 rounded-full transition-all" style={{ width: `${targetPct}%` }} />
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-5">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-2">
                  <Award className="h-4 w-4" /> মোট লিস্টিং
                </div>
                <p className="text-2xl font-bold text-indigo-600">{lifetimeListings}</p>
                <p className="text-[10px] text-gray-400 mt-1">লিস্টিং শুরু থেকে আজ পর্যন্ত</p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-5">
                <div className="flex items-center gap-2 text-gray-500 text-xs font-semibold mb-2">
                  <Wallet className="h-4 w-4" /> জমা হওয়া টাকা
                </div>
                <p className="text-lg font-bold text-red-600 mb-2">৳ {availableBalance}</p>
                <button onClick={onWithdraw} disabled={!canWithdraw || withdrawing}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-gray-200 disabled:text-gray-400 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                  {withdrawing ? 'পাঠানো হচ্ছে...' : hasPendingRequest ? 'অনুরোধ পর্যালোচনাধীন' : 'উত্তোলনের অনুরোধ পাঠান'}
                </button>
                {!hasPendingRequest && availableBalance < 500 && (
                  <p className="text-[10px] text-gray-400 mt-1.5">সর্বনিম্ন ৳৫০০ জমা হলে উত্তোলন করা যাবে।</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-6 max-w-2xl">
              <h3 className="text-lg font-bold mb-4">নতুন প্রোডাক্ট যোগ করুন</h3>
              {limitReached && (
                <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <strong>লিস্টিং লিমিট শেষ।</strong> এই সাইকেলে আর নতুন প্রোডাক্ট যোগ করা যাবে না। অ্যাডমিন নতুন লিমিট সেট করলে আবার listing করা যাবে।
                </div>
              )}
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">প্রোডাক্টের নাম</label>
                  <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                    className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" placeholder="যেমনঃ পুতিয়ান স্পোর্টস জুতা" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি</label>
                  {workerProfile?.assignedCategory ? (
                    <div className="w-full border rounded-lg p-2.5 bg-gray-100 text-gray-700 text-sm">
                      {workerProfile.assignedCategory} <span className="text-xs text-gray-400">(অ্যাডমিন কর্তৃক নির্ধারিত)</span>
                    </div>
                  ) : (
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150 bg-white">
                      {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">দাম (টাকা)</label>
                  <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                    className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" placeholder="2500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">আনুমানিক ওজন (KG)</label>
                  <input type="number" min="0.01" step="0.01" value={estimatedWeightKg} onChange={(e) => setEstimatedWeightKg(e.target.value)}
                    className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" placeholder="যেমনঃ 0.50" />
                  <p className="text-[11px] text-gray-400 mt-1">কার্টে আনুমানিক Shipping হিসাবের জন্য ব্যবহার হবে।</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">পিসি থেকে ছবি আপলোড করুন</label>
                  <div className="border border-gray-300 rounded-lg p-4 bg-gray-50">
                    <input type="file" accept="image/*" onChange={handleImageUpload}
                      className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-red-600 file:text-white hover:file:bg-red-700 cursor-pointer" />
                  </div>
                  {image && (
                    <div className="mt-3 flex items-center space-x-3 bg-red-50 p-3 rounded-lg border border-red-100">
                      <img src={image} alt="Preview" className="h-16 w-16 object-cover rounded border" />
                      <div>
                        <p className="text-xs font-bold text-red-700">ছবি প্রস্তুত!</p>
                        <p className="text-[10px] text-gray-500">ফাইল লোড হয়ে গেছে।</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">সাইজ (ঐচ্ছিক)</label>
                  <div className="flex gap-2">
                    <input type="text" value={sizeInput}
                      onChange={(e) => setSizeInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSize(); } }}
                      placeholder="যেমনঃ 26" className="flex-1 border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
                    <button type="button" onClick={handleAddSize}
                      className="bg-gray-800 hover:bg-gray-900 text-white px-4 rounded-lg text-sm font-semibold">যোগ করুন</button>
                  </div>
                  {sizes.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {sizes.map((s) => (
                        <span key={s} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                          {s}
                          <button type="button" onClick={() => handleRemoveSize(s)} className="text-gray-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">কালার (ঐচ্ছিক)</label>
                  <div className="flex gap-2">
                    <input type="color" value={colorHexInput} onChange={(e) => setColorHexInput(e.target.value)}
                      className="h-[42px] w-14 border rounded-lg cursor-pointer p-1" />
                    <input type="text" value={colorNameInput}
                      onChange={(e) => setColorNameInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddColor(); } }}
                      placeholder="যেমনঃ লাল" className="flex-1 border rounded-lg p-2.5 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
                    <button type="button" onClick={handleAddColor}
                      className="bg-gray-800 hover:bg-gray-900 text-white px-4 rounded-lg text-sm font-semibold">যোগ করুন</button>
                  </div>
                  {colors.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {colors.map((c) => (
                        <span key={c.name} className="flex items-center gap-1.5 bg-gray-100 border border-gray-200 text-gray-700 text-xs font-semibold px-3 py-1.5 rounded-lg">
                          <span className="h-3.5 w-3.5 rounded-full border border-gray-300" style={{ backgroundColor: c.hex }} />
                          {c.name}
                          <button type="button" onClick={() => handleRemoveColor(c.name)} className="text-gray-400 hover:text-red-600"><X className="h-3 w-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <button type="submit" disabled={saving || limitReached} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                  {limitReached ? 'লিস্টিং লিমিট শেষ' : saving ? 'সেভ হচ্ছে...' : 'সেভ করুন ও পাবলিশ করুন'}
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-6">
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className="text-lg font-bold">উইথড্রও হিস্টোরি</h3>
                <span className="text-xs text-gray-400">সর্বনিম্ন ৳৫০০</span>
              </div>
              {myWithdrawalRequests.length === 0 ? (
                <p className="text-sm text-gray-500">এখনো কোনো উইথড্রও রিকোয়েস্ট নেই।</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead><tr className="bg-gray-50 text-gray-500 text-xs border-y border-gray-200">
                      <th className="p-3">তারিখ</th><th className="p-3">পরিমাণ</th><th className="p-3">স্ট্যাটাস</th>
                    </tr></thead>
                    <tbody>
                      {myWithdrawalRequests.map((r) => {
                        const d = toJsDate(r.createdAt);
                        return (
                          <tr key={r.id} className="border-b border-gray-100">
                            <td className="p-3 text-xs text-gray-600">{d ? d.toLocaleString('bn-BD') : '—'}</td>
                            <td className="p-3 text-sm font-bold text-red-600">৳ {Number(r.amount || 0).toLocaleString('en-BD')}</td>
                            <td className="p-3">
                              <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${r.status === 'paid' ? 'bg-green-100 text-green-700' : r.status === 'rejected' ? 'bg-gray-200 text-gray-600' : 'bg-yellow-100 text-yellow-700'}`}>
                                {r.status === 'paid' ? 'পরিশোধিত' : r.status === 'rejected' ? 'বাতিল' : 'অপেক্ষমান'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-6">
              <h3 className="text-lg font-bold mb-4">আমার লিস্ট করা প্রোডাক্ট ({myProducts.length} টি)</h3>
              {myProducts.length === 0 ? (
                <p className="text-gray-500 text-sm">আপনি এখনো কোনো প্রোডাক্ট যোগ করেননি।</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {myProducts.map((p) => (
                    <div key={p.id} className="border rounded-lg p-4 flex items-center justify-between bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <img src={p.image} alt={p.title} className="h-12 w-12 object-cover rounded" />
                        <div>
                          <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{p.title}</h4>
                          <p className="text-xs text-red-600 font-semibold">৳ {p.price}</p>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteWorkerProduct(p.id)} className="text-red-500 hover:text-red-700 p-1">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

// --- MAIN STOREFRONT & PASSWORD GATE COMPONENT ---
export default function App() {
  // পণ্য বাড়ার সাথে সাথে ফুটার অনেক নিচে চলে যায়, তাই worker/admin প্যানেলে
  // সরাসরি URL হ্যাশ (#worker, #admin) দিয়ে ঢোকা যাবে — স্ক্রল করার দরকার নেই।
  const [currentView, setCurrentView] = useState(() => {
    const h = typeof window !== 'undefined' ? window.location.hash.replace('#', '') : '';
    return (h === 'admin' || h === 'worker') ? h : 'home';
  });
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [deliveryDistrict, setDeliveryDistrict] = useState('');
  const [deliveryArea, setDeliveryArea] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryPhone, setDeliveryPhone] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);
  const [staffMenuOpen, setStaffMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false); // মোবাইলে হেডারের ৩-বার আইকনে ক্লিক করলে এই ড্রয়ার খোলে

  const productsRef = useRef(null);
  const howItWorksRef = useRef(null);

  // currentView admin/worker হলে URL হ্যাশ আপডেট রাখি, যাতে লিংকটা বুকমার্ক করা যায়
  // এবং রিফ্রেশ দিলেও সরাসরি প্যানেলে ঢোকা যায় — ফুটার পর্যন্ত স্ক্রল করা লাগবে না।
  useEffect(() => {
    if (currentView === 'admin' || currentView === 'worker') {
      if (window.location.hash !== `#${currentView}`) window.location.hash = currentView;
    } else if (window.location.hash === '#admin' || window.location.hash === '#worker') {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [currentView]);

  const [products, setProducts] = useState([]);
  const [productsLoadError, setProductsLoadError] = useState(false);
  const [orders, setOrders] = useState([]);

  // Real-time product feed from Firestore — visible to every visitor, not just this browser
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setProductsLoadError(false);
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {
      setProductsLoadError(true);
    });
    return () => unsub();
  }, []);

  // ছবি দিয়ে প্রোডাক্ট খোঁজা — পুরোটাই ব্রাউজারে চলে, কোনো API লাগে না (visualSearch.ts দেখুন)
  const visual = useVisualSearch(products);
  const imageInputRef = useRef(null);
  const openImageSearch = () => imageInputRef.current?.click();
  const handleImageSearchPick = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      visual.searchByFile(file);
      productsRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    e.target.value = ''; // একই ছবি আবার দিলেও যেন সার্চ চলে
  };

  // --- AUTH (single Firebase Authentication instance, shared by admin + customers) ---
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [workerProfile, setWorkerProfile] = useState(null);
  const [profileChecked, setProfileChecked] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // Admin is identified by email match, NOT merely by "someone is logged in" —
  // otherwise any signed-in customer would also see the admin dashboard.
  const isAdminLoggedIn = !!authUser && authUser.email === ADMIN_EMAIL;
  // A worker is any non-admin auth user who has a matching doc in the `workers`
  // collection (created by the admin from the Workers tab).
  const isWorkerLoggedIn = !!authUser && authUser.email !== ADMIN_EMAIL && !!workerProfile;
  const isCustomerLoggedIn = !!authUser && authUser.email !== ADMIN_EMAIL && !isWorkerLoggedIn;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // Figure out whether the logged-in (non-admin) user is a worker or a regular
  // customer. Worker profiles are listened to in real time so admin limit changes
  // and automatic post-withdrawal resets appear immediately on the worker dashboard.
  useEffect(() => {
    if (!authUser || authUser.email === ADMIN_EMAIL) {
      setCustomerProfile(null);
      setWorkerProfile(null);
      setProfileChecked(true);
      return;
    }

    setProfileChecked(false);
    let workerUnsub = null;
    let cancelled = false;

    (async () => {
      const workerRef = doc(db, 'workers', authUser.uid);
      const workerSnap = await getDoc(workerRef);
      if (cancelled) return;

      if (workerSnap.exists()) {
        setCustomerProfile(null);
        workerUnsub = onSnapshot(workerRef, (snap) => {
          if (snap.exists()) setWorkerProfile({ id: authUser.uid, ...snap.data() });
          else setWorkerProfile(null);
          setProfileChecked(true);
        });
      } else {
        setWorkerProfile(null);
        const custSnap = await getDoc(doc(db, 'customers', authUser.uid));
        if (cancelled) return;
        setCustomerProfile(custSnap.exists() ? custSnap.data() : null);
        setProfileChecked(true);
      }
    })().catch(() => {
      if (!cancelled) setProfileChecked(true);
    });

    return () => {
      cancelled = true;
      if (workerUnsub) workerUnsub();
    };
  }, [authUser]);

  // Live list of all worker accounts — needed for the admin panel's Workers tab
  // (name/email + real-time product count for each).
  const [workers, setWorkers] = useState([]);
  useEffect(() => {
    if (!isAdminLoggedIn) { setWorkers([]); return; }
    const q = query(collection(db, 'workers'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setWorkers(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {
      setWorkers([]);
    });
    return () => unsub();
  }, [isAdminLoggedIn]);

  // Withdrawal requests — admin sees every request, a worker only sees their own
  // (mirrors the orders pattern above).
  const [withdrawalRequests, setWithdrawalRequests] = useState([]);
  useEffect(() => {
    if (!authUser) { setWithdrawalRequests([]); return; }
    let q = null;
    if (isAdminLoggedIn) {
      q = query(collection(db, 'withdrawalRequests'), orderBy('createdAt', 'desc'));
    } else if (isWorkerLoggedIn) {
      q = query(collection(db, 'withdrawalRequests'), where('workerId', '==', authUser.uid), orderBy('createdAt', 'desc'));
    }
    if (!q) { setWithdrawalRequests([]); return; }
    const unsub = onSnapshot(q, (snapshot) => {
      setWithdrawalRequests(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {
      setWithdrawalRequests([]);
    });
    return () => unsub();
  }, [authUser, isAdminLoggedIn, isWorkerLoggedIn]);

  // Real-time order feed — must match what the Firestore rules allow each role to read:
  // admin sees every order, a customer only sees orders where customerId == their own uid.
  // (A customer querying the whole collection would be denied outright, since "list" rules
  // reject the entire query if any matched document fails the rule.)
  useEffect(() => {
    if (!authChecked) return;
    if (!authUser) { setOrders([]); return; }

    const q = isAdminLoggedIn
      ? query(collection(db, 'orders'), orderBy('createdAt', 'desc'))
      : query(collection(db, 'orders'), where('customerId', '==', authUser.uid), orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    }, () => {
      setOrders([]);
    });
    return () => unsub();
  }, [authChecked, authUser, isAdminLoggedIn]);

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    setLoginError(false);
    try {
      await signInWithEmailAndPassword(auth, ADMIN_EMAIL, passwordInput);
      setPasswordInput('');
    } catch (err) {
      setLoginError(true);
    } finally {
      setLoggingIn(false);
    }
  };

  // --- CUSTOMER AUTH ---
  const [customerAuthError, setCustomerAuthError] = useState('');
  const [customerAuthLoading, setCustomerAuthLoading] = useState(false);
  const [redirectAfterLogin, setRedirectAfterLogin] = useState('home');

  const handleCustomerLogin = async ({ email, password }) => {
    setCustomerAuthLoading(true);
    setCustomerAuthError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setCurrentView(redirectAfterLogin);
    } catch (err) {
      setCustomerAuthError('ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।');
    } finally {
      setCustomerAuthLoading(false);
    }
  };

  const handleCustomerSignup = async ({ name, email, phone, password }) => {
    setCustomerAuthLoading(true);
    setCustomerAuthError('');
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      await setDoc(doc(db, 'customers', cred.user.uid), {
        name, email, phone: phone || null, createdAt: serverTimestamp(),
      });
      setCurrentView(redirectAfterLogin);
    } catch (err) {
      setCustomerAuthError(
        err.code === 'auth/email-already-in-use'
          ? 'এই ইমেইল দিয়ে আগে থেকেই অ্যাকাউন্ট আছে। সাইন ইন করুন।'
          : 'অ্যাকাউন্ট তৈরি করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
      );
    } finally {
      setCustomerAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setCustomerAuthLoading(true);
    setCustomerAuthError('');
    try {
      const result = await signInWithPopup(auth, new GoogleAuthProvider());
      const snap = await getDoc(doc(db, 'customers', result.user.uid));
      if (!snap.exists()) {
        await setDoc(doc(db, 'customers', result.user.uid), {
          name: result.user.displayName || '',
          email: result.user.email || '',
          phone: null,
          createdAt: serverTimestamp(),
        });
      }
      setCurrentView(redirectAfterLogin);
    } catch (err) {
      setCustomerAuthError('গুগল লগইন ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setCustomerAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setCurrentView('home');
  };

  // --- WORKER MANAGEMENT (admin-only actions) ---
  // Uses the secondary Firebase app instance so creating a worker account
  // doesn't sign the admin's own session out.
  const handleCreateWorker = async ({ name, email, password }) => {
    const cred = await createUserWithEmailAndPassword(secondaryAuth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(doc(db, 'workers', cred.user.uid), {
      name, email, createdAt: serverTimestamp(),
      listingUsed: 0, lifetimeListings: 0, currentEarnings: 0, pendingWithdrawal: 0,
      cycleStartedAt: serverTimestamp(),
    });
    await signOut(secondaryAuth);
  };

  // Removes the worker's profile doc, which revokes their worker-dashboard
  // access (they'll no longer be recognized as a worker on next login).
  // Note: this does not delete the underlying Firebase Auth account itself —
  // that requires the Firebase Admin SDK (e.g. a Cloud Function), which isn't
  // available from client-side code. For full account deletion, remove the
  // user from Firebase Console → Authentication as well.
  const handleDeleteWorker = async (workerId) => {
    if (!window.confirm('এই কর্মীর প্রোফাইল মুছে ফেলতে চান? (তাদের লগইন অ্যাক্সেস বন্ধ হয়ে যাবে)')) return;
    await deleteDoc(doc(db, 'workers', workerId));
  };

  // --- WORKER AUTH ---
  const [workerLoginError, setWorkerLoginError] = useState('');
  const [workerLoggingIn, setWorkerLoggingIn] = useState(false);

  const handleWorkerLogin = async ({ email, password }) => {
    setWorkerLoggingIn(true);
    setWorkerLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setWorkerLoginError('ইমেইল বা পাসওয়ার্ড ভুল। আবার চেষ্টা করুন।');
    } finally {
      setWorkerLoggingIn(false);
    }
  };

  // --- WORKER PRODUCT LISTING ---
  // Listing quota is enforced inside a Firestore transaction so two browser tabs
  // cannot bypass the limit by submitting at the same time. The worker document
  // keeps the current-cycle count/earnings and the lifetime listing count.
  const handleAddWorkerProduct = async ({ title, price, category, image, sizes, colors, estimatedWeightKg }) => {
    if (!authUser?.uid) throw new Error('Worker session not found.');

    const workerRef = doc(db, 'workers', authUser.uid);
    const productRef = doc(collection(db, 'products'));

    await runTransaction(db, async (transaction) => {
      const workerSnap = await transaction.get(workerRef);
      if (!workerSnap.exists()) throw new Error('কর্মী প্রোফাইল পাওয়া যায়নি।');

      const worker = workerSnap.data();
      const limit = worker.listingTarget == null || worker.listingTarget === ''
        ? null
        : Number(worker.listingTarget);

      // Backfill legacy worker documents once. Existing products count as the
      // current-cycle usage and lifetime total so an old worker cannot bypass a limit.
      let used = worker.listingUsed == null ? null : Number(worker.listingUsed);
      let lifetime = worker.lifetimeListings == null ? null : Number(worker.lifetimeListings);
      if (used === null || lifetime === null) {
        const existingSnap = await transaction.get(
          query(collection(db, 'products'), where('createdBy', '==', authUser.uid))
        );
        const existingCount = existingSnap.size;
        used = used === null ? existingCount : used;
        lifetime = lifetime === null ? existingCount : lifetime;
      }

      if (limit !== null && used >= limit) {
        throw new Error(`লিস্টিং লিমিট শেষ। বর্তমান লিমিট ${limit} টি।`);
      }

      const rate = Number(worker.ratePerListing || 0);
      const nextUsed = used + 1;
      lifetime = lifetime + 1;
      const currentEarnings = Number(worker.currentEarnings || 0) + rate;

      transaction.set(productRef, {
        title,
        price,
        category,
        image: image || 'productPlaceholderAsset',
        sizes,
        colors,
        createdAt: serverTimestamp(),
        createdBy: authUser.uid,
        createdByName: worker.name || workerProfile?.name || authUser.email,
      });

      transaction.update(workerRef, {
        listingUsed: nextUsed,
        lifetimeListings: lifetime,
        currentEarnings,
      });
    });
  };

  const handleDeleteWorkerProduct = async (productId) => {
    await deleteDoc(doc(db, 'products', productId));
  };

  // Admin sets/updates a worker's category, listing limit, and per-listing rate.
  // If the worker has already exhausted the old limit, assigning a new limit starts
  // a fresh cycle. Lifetime listings are never reset.
  const handleUpdateWorkerSettings = async (workerId, { assignedCategory, listingTarget, ratePerListing, currentListingUsed = 0, currentLifetimeListings = 0 }) => {
    const workerRef = doc(db, 'workers', workerId);
    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(workerRef);
      if (!snap.exists()) throw new Error('কর্মী প্রোফাইল পাওয়া যায়নি।');
      const current = snap.data();
      const oldLimit = current.listingTarget == null || current.listingTarget === '' ? null : Number(current.listingTarget);
      const oldUsed = current.listingUsed == null ? Number(currentListingUsed || 0) : Number(current.listingUsed);
      const newLimit = listingTarget === '' || listingTarget === null ? null : Math.max(0, Number(listingTarget));
      const exhausted = oldLimit !== null && oldUsed >= oldLimit;

      transaction.update(workerRef, {
        assignedCategory: assignedCategory || null,
        listingTarget: newLimit,
        ratePerListing: ratePerListing === '' || ratePerListing === null ? null : Math.max(0, Number(ratePerListing)),
        listingUsed: exhausted && newLimit !== null ? 0 : (current.listingUsed == null ? Number(currentListingUsed || 0) : Number(current.listingUsed)),
        lifetimeListings: current.lifetimeListings == null ? Number(currentLifetimeListings || 0) : Number(current.lifetimeListings),
        currentEarnings: current.currentEarnings == null ? Number(currentListingUsed || 0) * (ratePerListing === '' || ratePerListing === null ? 0 : Math.max(0, Number(ratePerListing))) : Number(current.currentEarnings || 0),
        ...(exhausted && newLimit !== null ? { currentEarnings: 0, cycleStartedAt: serverTimestamp() } : {}),
      });
    });
  };


  // Worker requests to withdraw the current cycle's available balance.
  const handleRequestWithdrawal = async (amount) => {
    const numericAmount = Number(amount || 0);
    if (numericAmount < 500) throw new Error('সর্বনিম্ন ৳৫০০ উত্তোলন করা যাবে।');
    if (!authUser?.uid) throw new Error('Worker session not found.');

    const workerRef = doc(db, 'workers', authUser.uid);
    const withdrawalRef = doc(collection(db, 'withdrawalRequests'));
    await runTransaction(db, async (transaction) => {
      const workerSnap = await transaction.get(workerRef);
      if (!workerSnap.exists()) throw new Error('কর্মী প্রোফাইল পাওয়া যায়নি।');
      const worker = workerSnap.data();
      const currentEarnings = Number(worker.currentEarnings || 0);
      const pending = Number(worker.pendingWithdrawal || 0);
      const available = Math.max(0, currentEarnings - pending);
      if (available < 500) throw new Error('উত্তোলনের জন্য কমপক্ষে ৳৫০০ জমা থাকতে হবে।');
      if (pending > 0) throw new Error('একটি উত্তোলনের অনুরোধ ইতিমধ্যে অপেক্ষমান আছে।');

      transaction.set(withdrawalRef, {
        workerId: authUser.uid,
        workerName: worker.name || workerProfile?.name || authUser.email,
        amount: available,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      transaction.update(workerRef, { pendingWithdrawal: available });
    });
  };

  // Admin marks a withdrawal request as paid or rejected. A PAID withdrawal
  // closes the current earning cycle and resets its limit counter automatically;
  // lifetimeListings remains untouched. A rejected request returns the balance.
  const handleProcessWithdrawal = async (requestId, status) => {
    const requestRef = doc(db, 'withdrawalRequests', requestId);
    await runTransaction(db, async (transaction) => {
      const requestSnap = await transaction.get(requestRef);
      if (!requestSnap.exists()) throw new Error('উত্তোলনের অনুরোধ পাওয়া যায়নি।');
      const request = requestSnap.data();
      if (request.status !== 'pending') return;

      const workerRef = doc(db, 'workers', request.workerId);
      const workerSnap = await transaction.get(workerRef);
      if (!workerSnap.exists()) throw new Error('কর্মী প্রোফাইল পাওয়া যায়নি।');

      transaction.update(requestRef, { status, processedAt: serverTimestamp() });
      if (status === 'paid') {
        transaction.update(workerRef, {
          listingUsed: 0,
          currentEarnings: 0,
          pendingWithdrawal: 0,
          cycleStartedAt: serverTimestamp(),
        });
      } else {
        transaction.update(workerRef, { pendingWithdrawal: 0 });
      }
    });
  };

  // --- MULTI-ITEM CART (variant-aware: same product with different size/color = separate line) ---
  const handleAddToCart = (product, variant = {}) => {
    const { selectedSize, selectedColor } = variant;
    const cartLineId = `${product.id}::${selectedSize || ''}::${selectedColor || ''}`;
    setCart((prev) => {
      const existing = prev.find((item) => item.cartLineId === cartLineId);
      if (existing) {
        return prev.map((item) => item.cartLineId === cartLineId ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, selectedSize, selectedColor, cartLineId, quantity: 1 }];
    });
    setIsCartOpen(true);
  };

  const handleUpdateQuantity = (cartLineId, delta) => {
    setCart((prev) => prev
      .map((item) => item.cartLineId === cartLineId ? { ...item, quantity: item.quantity + delta } : item)
      .filter((item) => item.quantity > 0));
  };

  const handleRemoveFromCart = (cartLineId) => {
    setCart((prev) => prev.filter((item) => item.cartLineId !== cartLineId));
  };

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0);
  const estimatedCartWeightKg = cart.reduce((sum, item) => sum + getEstimatedWeightKg(item) * Number(item.quantity || 0), 0);
  const estimatedShippingCharge = Math.round(estimatedCartWeightKg * SHIPPING_RATE_PER_KG);
  const estimatedGrandTotal = cartTotal + estimatedShippingCharge;

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;

    // Checkout requires a logged-in customer, so every order can be tied to an account
    if (!isCustomerLoggedIn) {
      setRedirectAfterLogin('checkout');
      setCurrentView('login');
      return;
    }

    if (!deliveryDistrict || !deliveryAddress || !deliveryPhone) {
      alert('অনুগ্রহ করে ডেলিভারি জেলা, সম্পূর্ণ ঠিকানা ও মোবাইল নম্বর দিন।');
      return;
    }
    if (!accountNumber || !trxId) {
      alert('অনুগ্রহ করে আপনার একাউন্ট নাম্বার ও ট্রানজেকশন আইডি দিন।');
      return;
    }
    setOrderSubmitting(true);
    try {
      const orderRef = doc(collection(db, 'orders'));
      await setDoc(orderRef, {
        items: cart.map((item) => ({
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          estimatedWeightKg: getEstimatedWeightKg(item),
          selectedSize: item.selectedSize || null,
          selectedColor: item.selectedColor || null
        })),
        orderNumber: `DL-${orderRef.id.slice(0, 8).toUpperCase()}`,
        productSubtotal: cartTotal,
        estimatedWeightKg: Number(estimatedCartWeightKg.toFixed(3)),
        estimatedShippingCharge,
        shippingRatePerKg: SHIPPING_RATE_PER_KG,
        finalShippingCharge: null,
        actualWeightKg: null,
        totalPrice: estimatedGrandTotal,
        paymentMethod,
        accountNumber,
        trxId,
        deliveryAddress: {
          district: deliveryDistrict,
          area: deliveryArea || null,
          address: deliveryAddress,
          phone: deliveryPhone
        },
        status: 'Pending TrxID',
        createdAt: serverTimestamp(),
        customerId: authUser.uid,
        customerName: customerProfile?.name || authUser.displayName || '',
        customerEmail: authUser.email || '',
        customerPhone: customerProfile?.phone || null,
      });
      alert(`অর্ডার সফলভাবে দেওয়া হয়েছে! আপনার Order ID: DL-${orderRef.id.slice(0, 8).toUpperCase()}`);
      setAccountNumber(''); setTrxId(''); setDeliveryDistrict(''); setDeliveryArea(''); setDeliveryAddress(''); setDeliveryPhone(''); setCart([]);
      setCurrentView('account');
    } catch (err) {
      alert('দুঃখিত, অর্ডার সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const scrollToProducts = () => productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToHowItWorks = () => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });
  const goToOrders = () => {
    if (isCustomerLoggedIn) setCurrentView('track');
    else { setRedirectAfterLogin('track'); setCurrentView('login'); }
  };

  // ছবি-সার্চ চালু থাকলে সেটাই অগ্রাধিকার পায় — মিলের ক্রমে সাজানো ফল দেখায়।
  // তখন লেখা-সার্চ ও ক্যাটাগরি ফিল্টার বাদ থাকে, নইলে ফল প্রায় সবসময় খালি আসত।
  const visibleProducts = visual.active
    ? (visual.matches || [])
        .map((m) => {
          const p = products.find((x) => x.id === m.id);
          return p ? { ...p, _matchScore: m.score } : null;
        })
        .filter(Boolean)
    : products
        .filter((p) => !selectedCategory || p.category === selectedCategory)
        .filter((p) => p.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!authChecked && currentView === 'admin') {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 font-body">লোড হচ্ছে...</div>;
  }

  if (currentView === 'admin' && isAdminLoggedIn) {
    return (
      <AdminDashboard
        goHome={() => setCurrentView('home')}
        handleLogout={handleLogout}
        products={products}
        orders={orders}
        workers={workers}
        handleCreateWorker={handleCreateWorker}
        handleDeleteWorker={handleDeleteWorker}
        handleUpdateWorkerSettings={handleUpdateWorkerSettings}
        withdrawalRequests={withdrawalRequests}
        handleProcessWithdrawal={handleProcessWithdrawal}
      />
    );
  }

  if (currentView === 'admin' && !isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center font-body px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">অ্যাডমিন পোর্টাল সুরক্ষিত</h2>
          <p className="text-sm text-gray-500 mb-6">DrutoLink ম্যানেজমেন্টে প্রবেশ করতে পাসওয়ার্ড দিন।</p>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input type="password" placeholder="অ্যাডমিন পাসওয়ার্ড দিন" value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
            </div>
            {loginError && <p className="text-red-500 text-xs text-left">ভুল পাসওয়ার্ড। প্রবেশ করা যায়নি।</p>}
            <button type="submit" disabled={loggingIn} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100">
              {loggingIn ? 'যাচাই হচ্ছে...' : 'আনলক করুন'}
            </button>
          </form>
          <button onClick={() => setCurrentView('home')} className="mt-4 text-sm text-gray-500 hover:text-gray-800 underline">
            স্টোরে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  if (!profileChecked && currentView === 'worker') {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 font-body">লোড হচ্ছে...</div>;
  }

  if (currentView === 'worker' && isWorkerLoggedIn) {
    return (
      <WorkerDashboard
        goHome={() => setCurrentView('home')}
        handleLogout={handleLogout}
        workerProfile={workerProfile}
        myProducts={products.filter((p) => p.createdBy === authUser.uid)}
        handleAddWorkerProduct={handleAddWorkerProduct}
        handleDeleteWorkerProduct={handleDeleteWorkerProduct}
        myWithdrawalRequests={withdrawalRequests}
        handleRequestWithdrawal={handleRequestWithdrawal}
      />
    );
  }

  if (currentView === 'worker' && !isWorkerLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center font-body px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">কর্মী লগইন</h2>
          <p className="text-sm text-gray-500 mb-6">অ্যাডমিনের দেওয়া ইমেইল ও পাসওয়ার্ড দিয়ে লগইন করুন।</p>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const form = e.target;
              handleWorkerLogin({ email: form.workerEmail.value, password: form.workerPassword.value });
            }}
            className="space-y-4 text-left"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">ইমেইল</label>
              <input name="workerEmail" type="email" required
                className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">পাসওয়ার্ড</label>
              <input name="workerPassword" type="password" required
                className="w-full border border-gray-300 rounded-lg py-3 px-4 outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
            </div>
            {workerLoginError && <p className="text-red-500 text-xs">{workerLoginError}</p>}
            <button type="submit" disabled={workerLoggingIn} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-600/20 active:scale-[0.98] disabled:opacity-60 disabled:active:scale-100">
              {workerLoggingIn ? 'যাচাই হচ্ছে...' : 'লগইন করুন'}
            </button>
          </form>
          <button onClick={() => setCurrentView('home')} className="mt-4 text-sm text-gray-500 hover:text-gray-800 underline">
            স্টোরে ফিরে যান
          </button>
        </div>
      </div>
    );
  }

  if (currentView === 'track') {
    if (!isCustomerLoggedIn) {
      return <AuthPage mode="login" setMode={setCurrentView}
        onLogin={async (credentials) => { setRedirectAfterLogin('track'); await handleCustomerLogin(credentials); }}
        onSignup={async (credentials) => { setRedirectAfterLogin('track'); await handleCustomerSignup(credentials); }}
        onGoogleLogin={async () => { setRedirectAfterLogin('track'); await handleGoogleLogin(); }}
        authError={customerAuthError} authLoading={customerAuthLoading} goHome={() => setCurrentView('home')} />;
    }
    const myOrders = orders.filter((o) => o.customerId === authUser.uid);
    return (
      <div className="min-h-screen bg-gray-50 font-body">
        <style>{FONTS}</style>
        <header className="bg-red-700 text-white sticky top-0 z-40">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 text-sm"><ArrowLeft className="h-4 w-4" /> স্টোরে ফিরুন</button>
            <button onClick={() => setCurrentView('account')} className="text-sm bg-red-800 hover:bg-red-900 px-3 py-1.5 rounded-lg">আমার অর্ডার</button>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider text-red-600">Order Tracking</p>
            <h1 className="font-display text-3xl font-extrabold text-gray-900 mt-1">আপনার অর্ডার ট্র্যাক করুন</h1>
            <p className="text-sm text-gray-500 mt-2">অর্ডারের বর্তমান অবস্থান ও Shipping তথ্য এক জায়গায় দেখুন।</p>
          </div>
          {myOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-500">আপনার এখনো কোনো অর্ডার নেই।</div>
          ) : (
            <div className="space-y-5">
              {myOrders.map((o) => (
                <div key={o.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                  <div className="flex flex-wrap justify-between gap-3 mb-6">
                    <div>
                      <p className="text-xs text-gray-400">Order ID</p>
                      <p className="font-mono font-bold text-gray-900">{o.orderNumber || `DL-${o.id?.slice(0,8)?.toUpperCase()}`}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">বর্তমান মোট</p>
                      <p className="text-xl font-bold text-red-700">৳ {Number(o.totalPrice || 0).toLocaleString('en-BD')}</p>
                    </div>
                  </div>
                  <div className="overflow-x-auto pb-2"><div className="min-w-[720px]"><OrderStatusTimeline status={o.status} /></div></div>
                  <div className="grid md:grid-cols-3 gap-3 mt-6">
                    <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">আনুমানিক ওজন</p><p className="font-bold mt-1">{Number(o.estimatedWeightKg || 0).toFixed(2)} KG</p></div>
                    <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">Shipping</p><p className="font-bold mt-1">৳ {Number(o.finalShippingCharge ?? o.estimatedShippingCharge ?? 0).toLocaleString('en-BD')}</p></div>
                    <div className="rounded-xl bg-gray-50 p-4"><p className="text-xs text-gray-500">ডেলিভারি</p><p className="font-bold mt-1">{o.deliveryAddress?.district || '—'}</p></div>
                  </div>
                  <p className="text-[11px] leading-5 text-gray-500 mt-4">Shipping Charge-এর চূড়ান্ত হিসাব পণ্য বাংলাদেশে পৌঁছানোর পর প্রকৃত ওজন অনুযায়ী নির্ধারণ করা হয়।</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    );
  }

  if (currentView === 'account') {
    if (!isCustomerLoggedIn) {
      return (
        <AuthPage
          mode="login"
          setMode={setCurrentView}
          onLogin={handleCustomerLogin}
          onSignup={handleCustomerSignup}
          onGoogleLogin={handleGoogleLogin}
          authError={customerAuthError}
          authLoading={customerAuthLoading}
          goHome={() => setCurrentView('home')}
        />
      );
    }
    const myOrders = orders.filter((o) => o.customerId === authUser.uid);
    return (
      <div className="min-h-screen bg-gray-50 font-body">
        <style>{FONTS}</style>
        <header className="bg-red-700 text-white sticky top-0 z-40">
          <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
            <button onClick={() => setCurrentView('home')} className="flex items-center gap-2 text-sm">
              <ArrowLeft className="h-4 w-4" /> স্টোরে ফিরুন
            </button>
            <button onClick={handleLogout} className="flex items-center gap-1.5 text-sm bg-red-800 hover:bg-red-900 px-3 py-1.5 rounded-lg">
              <LogOut className="h-4 w-4" /> লগ-আউট
            </button>
          </div>
        </header>

        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-6 mb-6 flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold text-xl">
              {(customerProfile?.name || authUser.email || '?')[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-bold text-lg">{customerProfile?.name || 'আপনার অ্যাকাউন্ট'}</h2>
              <p className="text-sm text-gray-500">{authUser.email}</p>
              {customerProfile?.phone && <p className="text-sm text-gray-500">{customerProfile.phone}</p>}
            </div>
          </div>

          <h3 className="font-bold text-lg mb-4">আমার অর্ডার সমূহ</h3>
          {myOrders.length === 0 ? (
            <p className="text-gray-500 text-sm">আপনার এখনো কোনো অর্ডার নেই।</p>
          ) : (
            <div className="space-y-4">
              {myOrders.map((o) => (
                <div key={o.id} className="bg-white rounded-xl shadow-sm border border-gray-100 transition-shadow duration-200 hover:shadow-md p-5">
                  <div className="flex justify-between items-start mb-4 gap-3">
                    <div>
                      <p className="text-[11px] text-gray-400 font-mono mb-1">{o.orderNumber || `DL-${o.id?.slice(0, 8)?.toUpperCase()}`}</p>
                      {(o.items || []).map((it, idx) => (
                        <p key={idx} className="text-sm font-semibold">{it.title} × {it.quantity}</p>
                      ))}
                    </div>
                    <div className="text-right">
                      <span className="font-display text-red-700 font-bold">৳ {Number(o.totalPrice || 0).toLocaleString('en-BD')}</span>
                      <p className="text-[10px] text-gray-400 mt-1">{o.actualWeightKg ? `চূড়ান্ত ওজন ${Number(o.actualWeightKg).toFixed(2)} KG` : `আনুমানিক ${Number(o.estimatedWeightKg || 0).toFixed(2)} KG`}</p>
                    </div>
                  </div>
                  <OrderStatusTimeline status={o.status} />
                  <div className="mt-4 pt-3 border-t border-gray-100 grid sm:grid-cols-3 gap-2 text-xs text-gray-500">
                    <span>পণ্য: ৳ {Number(o.productSubtotal || o.totalPrice || 0).toLocaleString('en-BD')}</span>
                    <span>Shipping: ৳ {Number(o.finalShippingCharge ?? o.estimatedShippingCharge ?? 0).toLocaleString('en-BD')}</span>
                    <span>{o.deliveryAddress?.district || 'ডেলিভারি ঠিকানা সংরক্ষিত'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (currentView === 'login' || currentView === 'signup') {
    return (
      <AuthPage
        mode={currentView}
        setMode={setCurrentView}
        onLogin={handleCustomerLogin}
        onSignup={handleCustomerSignup}
        onGoogleLogin={handleGoogleLogin}
        authError={customerAuthError}
        authLoading={customerAuthLoading}
        goHome={() => setCurrentView('home')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-white font-body text-gray-900">
      <style>{FONTS}</style>

      {/* ছবি সার্চের লুকানো ফাইল ইনপুট — capture থাকায় মোবাইলে সরাসরি ক্যামেরাও খোলা যায় */}
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSearchPick} className="hidden" />

      {productsLoadError && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 text-xs sm:text-sm px-4 py-2 text-center">
          পণ্য লোড করতে সাময়িক সমস্যা হচ্ছে। সংযোগ ঠিক হলে তালিকা স্বয়ংক্রিয়ভাবে আবার চেষ্টা করবে।
        </div>
      )}

      {/* Header */}
      <header className="bg-red-700 text-white sticky top-0 z-40 shadow-md shadow-red-900/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button onClick={() => setMobileNavOpen(true)} className="lg:hidden text-white p-1 -ml-1 transition-opacity hover:opacity-80" aria-label="মেনু খুলুন">
              <Menu className="h-6 w-6" />
            </button>
            <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setCurrentView('home')}>
              <img src={LOGO_URL} alt="DrutoLink" className="h-10 w-10 object-contain rounded-lg transition-transform duration-200 group-hover:scale-105" />
              <span className="font-display text-2xl font-extrabold tracking-tight text-white">
                Druto<span className="font-medium text-red-100">Link</span>
              </span>
            </div>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); scrollToProducts(); }} className="hidden md:flex flex-1 max-w-xl relative">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রোডাক্ট খুঁজুন..." className="w-full rounded-full py-2.5 pl-4 pr-20 text-gray-900 bg-white outline-none ring-0 focus:ring-2 focus:ring-red-300 transition-shadow duration-150" />
            {/* ছবি দিয়ে সার্চ — ক্যামেরা আইকন */}
            <button type="button" onClick={openImageSearch} title="ছবি দিয়ে খুঁজুন"
              className="absolute right-11 top-1.5 text-gray-400 hover:text-red-600 p-1.5 rounded-full transition-colors duration-150">
              {visual.searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <button type="submit" className="absolute right-1.5 top-1.5 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition-all duration-150 hover:scale-105">
              <Search className="h-4 w-4" />
            </button>
          </form>
          <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-white/95">
            <button onClick={scrollToHowItWorks} className="hover:text-white/70 transition-colors">কীভাবে কাজ করে</button>
            <button onClick={goToOrders} className="hover:text-white/70 transition-colors">অর্ডার ট্র্যাক</button>
          </nav>
          <div className="flex items-center gap-4 text-sm">
            {isCustomerLoggedIn ? (
              <div onClick={() => setCurrentView('account')} className="flex flex-col items-center cursor-pointer transition-opacity hover:opacity-80">
                <User className="h-5 w-5" />
                <span className="text-xs mt-0.5">{customerProfile?.name?.split(' ')[0] || 'অ্যাকাউন্ট'}</span>
              </div>
            ) : (
              <div onClick={() => { setRedirectAfterLogin('home'); setCurrentView('login'); }} className="flex flex-col items-center cursor-pointer transition-opacity hover:opacity-80">
                <User className="h-5 w-5" />
                <span className="text-xs mt-0.5">লগ ইন</span>
              </div>
            )}
            <div onClick={() => setIsCartOpen(true)} className="flex flex-col items-center cursor-pointer relative transition-opacity hover:opacity-80">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-white text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full animate-scale-in">{cartCount}</span>
              )}
              <span className="text-xs mt-0.5">কার্ট</span>
            </div>
            {/* কর্মী/অ্যাডমিন প্রবেশ — sticky হেডারে থাকায় পণ্য যতই বাড়ুক, স্ক্রল না করেই সবসময় হাতের কাছে থাকবে */}
            <div className="relative">
              <div onClick={() => setStaffMenuOpen((v) => !v)} className="flex flex-col items-center cursor-pointer opacity-70 hover:opacity-100 transition-opacity">
                <Lock className="h-5 w-5" />
                <span className="text-xs mt-0.5">স্টাফ</span>
              </div>
              {staffMenuOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white text-gray-800 rounded-lg shadow-lg overflow-hidden z-50 text-sm animate-scale-in origin-top-right">
                  <button onClick={() => { setStaffMenuOpen(false); setCurrentView('worker'); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors">কর্মী লগইন</button>
                  <button onClick={() => { setStaffMenuOpen(false); setCurrentView('admin'); }}
                    className="w-full text-left px-4 py-2.5 hover:bg-red-50 border-t border-gray-100 transition-colors">অ্যাডমিন প্যানেল</button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* মোবাইল নেভিগেশন ড্রয়ার — হেডারের ৩-বার আইকনে ক্লিক করলে বাম থেকে খুলবে */}
      {mobileNavOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 lg:hidden animate-fade-in" onClick={() => setMobileNavOpen(false)} />
      )}
      <div className={`fixed inset-y-0 left-0 z-50 w-72 max-w-[85%] bg-white shadow-xl transform transition-transform duration-200 lg:hidden flex flex-col ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="bg-red-700 text-white p-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <img src={LOGO_URL} alt="DrutoLink" className="h-9 w-9 object-contain rounded-lg" />
            <span className="font-display text-lg font-extrabold">Druto<span className="font-medium text-red-100">Link</span></span>
          </div>
          <button onClick={() => setMobileNavOpen(false)} className="text-red-100 hover:text-white p-1 transition-colors" aria-label="মেনু বন্ধ করুন">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4 overflow-y-auto thin-scroll flex-1">
          {/* মোবাইল সার্চ — হেডারের সার্চ বার শুধু md+ স্ক্রিনে দেখায়, তাই এখানেও একটা দিয়ে দিলাম */}
          <form
            onSubmit={(e) => { e.preventDefault(); setMobileNavOpen(false); scrollToProducts(); }}
            className="relative mb-5"
          >
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রোডাক্ট খুঁজুন..." className="w-full rounded-full py-2.5 pl-4 pr-20 text-gray-900 bg-gray-100 outline-none focus:ring-2 focus:ring-red-300 transition-shadow duration-150" />
            <button type="button" onClick={() => { setMobileNavOpen(false); openImageSearch(); }} title="ছবি দিয়ে খুঁজুন"
              className="absolute right-11 top-1.5 text-gray-400 hover:text-red-600 p-1.5 rounded-full transition-colors duration-150">
              {visual.searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
            </button>
            <button type="submit" className="absolute right-1.5 top-1.5 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full transition-all duration-150">
              <Search className="h-4 w-4" />
            </button>
          </form>

          {/* অ্যাকাউন্ট ও কার্ট */}
          <div className="grid grid-cols-2 gap-2 mb-5">
            <button
              onClick={() => { setMobileNavOpen(false); if (isCustomerLoggedIn) { setCurrentView('account'); } else { setRedirectAfterLogin('home'); setCurrentView('login'); } }}
              className="flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl py-3 transition-colors">
              <User className="h-5 w-5 text-red-700" />
              <span className="text-xs font-medium text-gray-700">{isCustomerLoggedIn ? (customerProfile?.name?.split(' ')[0] || 'অ্যাকাউন্ট') : 'লগ ইন'}</span>
            </button>
            <button
              onClick={() => { setMobileNavOpen(false); setIsCartOpen(true); }}
              className="relative flex flex-col items-center justify-center gap-1 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl py-3 transition-colors">
              <ShoppingCart className="h-5 w-5 text-red-700" />
              <span className="text-xs font-medium text-gray-700">কার্ট{cartCount > 0 ? ` (${cartCount})` : ''}</span>
            </button>
          </div>

          {/* ক্যাটাগরি */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">ক্যাটাগরি</p>
          <div className="space-y-1 mb-5">
            <button
              onClick={() => { setSelectedCategory(null); setMobileNavOpen(false); scrollToProducts(); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${!selectedCategory ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
              <span className="text-lg">🛍️</span> সব প্রোডাক্ট
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c.name}
                onClick={() => { setSelectedCategory(c.name); setMobileNavOpen(false); scrollToProducts(); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${selectedCategory === c.name ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
                <span className="text-lg">{c.emoji}</span> {c.name}
              </button>
            ))}
          </div>

          {/* কর্মী/অ্যাডমিন প্রবেশ */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">স্টাফ</p>
          <div className="space-y-1">
            <button onClick={() => { setMobileNavOpen(false); setCurrentView('worker'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Lock className="h-4 w-4" /> কর্মী লগইন
            </button>
            <button onClick={() => { setMobileNavOpen(false); setCurrentView('admin'); }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors">
              <Lock className="h-4 w-4" /> অ্যাডমিন প্যানেল
            </button>
          </div>
        </div>
      </div>

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateQuantity}
        onRemove={handleRemoveFromCart}
        cartTotal={cartTotal}
        onCheckout={() => { setIsCartOpen(false); setCurrentView('checkout'); }}
      />

      <ProductDetailModal
        product={detailProduct}
        onClose={() => setDetailProduct(null)}
        onAddToCart={handleAddToCart}
      />

      {currentView === 'checkout' ? (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => setCurrentView('home')} className="flex items-center text-sm text-gray-600 mb-4 hover:text-red-600 transition-colors">
            <ArrowLeft className="h-4 w-4 mr-1" /> কেনাকাটা চালিয়ে যান
          </button>
          <h2 className="text-2xl font-bold mb-3">চেকআউট ও লোকাল পেমেন্ট</h2>

          {isCustomerLoggedIn ? (
            <p className="text-sm text-gray-500 mb-6">
              লগ ইন করা আছে: <span className="font-semibold text-gray-700">{customerProfile?.name || authUser.email}</span>
            </p>
          ) : (
            <div className="flex items-center justify-between bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-lg px-4 py-3 mb-6">
              <span>অর্ডার নিশ্চিত করতে আগে লগ ইন করতে হবে।</span>
              <button onClick={() => { setRedirectAfterLogin('checkout'); setCurrentView('login'); }} className="font-bold underline">
                লগ ইন করুন
              </button>
            </div>
          )}

          {cart.length === 0 ? (
            <p className="text-gray-500 text-sm mb-6">আপনার কার্টে কোনো প্রোডাক্ট নেই। আগে একটি প্রোডাক্ট বেছে নিন।</p>
          ) : (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 divide-y divide-gray-100">
                {cart.map((item) => (
                  <div key={item.cartLineId} className="p-4 flex items-center gap-4">
                    <img src={item.image} alt={item.title} className="h-16 w-16 object-cover rounded-xl border border-gray-100" />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-800 text-sm truncate">{item.title}</h3>
                      {(item.selectedSize || item.selectedColor) && (
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          {item.selectedSize && `সাইজ: ${item.selectedSize}`}
                          {item.selectedSize && item.selectedColor && ' · '}
                          {item.selectedColor && `কালার: ${item.selectedColor}`}
                        </p>
                      )}
                      <p className="text-red-600 font-bold text-sm mt-1">৳ {Number(item.price).toLocaleString('en-BD')}</p>
                      <p className="text-[11px] text-gray-400 mt-1">আনুমানিক ওজন: {(getEstimatedWeightKg(item) * item.quantity).toFixed(2)} KG</p>
                    </div>
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden shrink-0">
                      <button onClick={() => handleUpdateQuantity(item.cartLineId, -1)} className="p-2 text-gray-600 hover:bg-gray-100 transition-colors"><Minus className="h-3.5 w-3.5" /></button>
                      <span className="px-3 text-sm font-semibold tabular-nums">{item.quantity}</span>
                      <button onClick={() => handleUpdateQuantity(item.cartLineId, 1)} className="p-2 text-gray-600 hover:bg-gray-100 transition-colors"><Plus className="h-3.5 w-3.5" /></button>
                    </div>
                    <button onClick={() => handleRemoveFromCart(item.cartLineId)} className="text-gray-400 hover:text-red-600 p-1 transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <div className="p-5 bg-gray-50 space-y-2">
                  <div className="flex justify-between text-sm"><span className="text-gray-600">পণ্যের মোট</span><span className="font-semibold">৳ {cartTotal.toLocaleString('en-BD')}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">আনুমানিক মোট ওজন</span><span className="font-semibold">{estimatedCartWeightKg.toFixed(2)} KG</span></div>
                  <div className="flex justify-between text-sm"><span className="text-gray-600">আনুমানিক Shipping (৳ {SHIPPING_RATE_PER_KG}/KG)</span><span className="font-semibold">৳ {estimatedShippingCharge.toLocaleString('en-BD')}</span></div>
                  <div className="flex justify-between pt-2 border-t border-gray-200"><span className="font-bold">আনুমানিক মোট</span><span className="font-display text-red-700 font-bold text-lg">৳ {estimatedGrandTotal.toLocaleString('en-BD')}</span></div>
                </div>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
                <h3 className="text-lg font-bold mb-1">ডেলিভারি তথ্য</h3>
                <p className="text-xs text-gray-500 mb-4">চীন থেকে আপনার নির্দিষ্ট লোকেশন পর্যন্ত ডেলিভারি তথ্য দিন।</p>
                <div className="grid sm:grid-cols-2 gap-4">
                  <input value={deliveryDistrict} onChange={(e) => setDeliveryDistrict(e.target.value)} placeholder="জেলা *" className="w-full border rounded-lg p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
                  <input value={deliveryArea} onChange={(e) => setDeliveryArea(e.target.value)} placeholder="উপজেলা / থানা" className="w-full border rounded-lg p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
                  <input value={deliveryPhone} onChange={(e) => setDeliveryPhone(e.target.value)} placeholder="মোবাইল নম্বর *" className="w-full border rounded-lg p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100" />
                  <div className="sm:col-span-2">
                    <textarea value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="সম্পূর্ণ ডেলিভারি ঠিকানা *" rows={3} className="w-full border rounded-lg p-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 resize-none" />
                  </div>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-4 mb-6 text-xs leading-6">
                <strong>বিঃদ্রঃ</strong> এখানে দেখানো ওজন ও Shipping Charge আনুমানিক। পণ্য বাংলাদেশে পৌঁছানোর পর প্রকৃত ওজন অনুযায়ী চূড়ান্ত Shipping Charge আপনার অর্ডারে যোগ করা হবে। Shipping Rate: <strong>৳ {SHIPPING_RATE_PER_KG}/kg</strong>। চূড়ান্ত Shipping Charge পরিবর্তিত হলে অর্ডারের মোট পরিমাণও আপডেট হবে।
              </div>
            </>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center"><CreditCard className="h-5 w-5 mr-2 text-red-600" /> পেমেন্ট মাধ্যম বেছে নিন</h3>
            <div className="flex space-x-4 mb-6">
              <button onClick={() => setPaymentMethod('bkash')} className={`flex-1 py-3 border rounded-lg font-bold transition-all duration-150 ${paymentMethod === 'bkash' ? 'border-red-500 bg-red-50 text-red-600 ring-1 ring-red-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>bKash</button>
              <button onClick={() => setPaymentMethod('nagad')} className={`flex-1 py-3 border rounded-lg font-bold transition-all duration-150 ${paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50 text-orange-600 ring-1 ring-orange-500 shadow-sm' : 'border-gray-200 hover:border-gray-300'}`}>Nagad</button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">অনুগ্রহ করে <b>{paymentMethod.toUpperCase()}</b>-এ টাকা পাঠান:</p>
              <p className="text-xl font-bold text-gray-900 mb-4">+880 1620 177883</p>
              <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="আপনার একাউন্ট নাম্বার (যেমনঃ 017xxxxxxxx)" className="w-full border p-2.5 rounded mb-3 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
              <input type="text" value={trxId} onChange={(e) => setTrxId(e.target.value)}
                placeholder="ট্রানজেকশন আইডি (TrxID) লিখুন" className="w-full border p-2.5 rounded outline-none focus:border-red-500 focus:ring-2 focus:ring-red-100 transition-colors duration-150" />
            </div>
          </div>
          <button onClick={handleConfirmOrder} disabled={cart.length === 0 || orderSubmitting}
            className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 text-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-600/25 active:scale-[0.99] disabled:opacity-60 disabled:active:scale-100">
            {orderSubmitting ? 'সাবমিট হচ্ছে...' : isCustomerLoggedIn ? 'অর্ডার নিশ্চিত করুন' : 'লগ ইন করে অর্ডার নিশ্চিত করুন'}
          </button>
        </div>
      ) : (
        <>
          {/* Homepage 2.0 — premium hero */}
          <section className="relative overflow-hidden bg-slate-50 border-b border-gray-200">
            <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-red-100/70 blur-3xl hero-glow" />
            <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-slate-200/70 blur-3xl" />
            <div className="relative max-w-6xl mx-auto px-4 py-10 md:py-14 lg:py-16 grid lg:grid-cols-[1.05fr_.95fr] gap-10 items-center">
              <div className="animate-hero-in">
                <div className="inline-flex items-center gap-2 rounded-full bg-white border border-red-100 px-3 py-1.5 text-xs font-bold text-red-700 shadow-sm">
                  <span className="h-2 w-2 rounded-full bg-red-600 animate-pulse" /> China → Bangladesh
                </div>
                <h1 className="font-display text-4xl md:text-5xl lg:text-[3.35rem] font-extrabold leading-[1.08] tracking-tight text-slate-950 mt-5">
                  চীন থেকে পছন্দের পণ্য,<br /><span className="text-red-600">সহজে আপনার ঠিকানায়</span>
                </h1>
                <p className="mt-5 text-gray-600 text-base md:text-lg leading-8 max-w-xl">
                  পণ্য খুঁজুন, অর্ডার দিন—চীন থেকে সোর্সিং, অর্ডার প্রসেসিং এবং বাংলাদেশে ডেলিভারির পুরো প্রক্রিয়া এক জায়গায়।
                </p>
                <div className="mt-7 flex flex-col sm:flex-row gap-3">
                  <button onClick={scrollToProducts} className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3.5 rounded-xl transition-all duration-200 hover:shadow-xl hover:shadow-red-600/20 hover:-translate-y-0.5 active:translate-y-0">
                    পণ্য খুঁজুন <ChevronRight className="inline-block h-4 w-4 ml-1" />
                  </button>
                  <button onClick={openImageSearch} className="bg-white border border-gray-300 hover:border-red-300 hover:bg-red-50/50 text-gray-800 font-bold px-6 py-3.5 rounded-xl transition-all duration-200">
                    <Camera className="inline-block h-4 w-4 mr-2 text-red-600" /> ছবি দিয়ে খুঁজুন
                  </button>
                </div>
                <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs md:text-sm text-gray-600">
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-600" /> বিকাশ ও নগদ</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-600" /> ৬৪ জেলায় ডেলিভারি</span>
                  <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4 text-green-600" /> অনলাইন ক্যাটালগ</span>
                </div>
              </div>

              <div className="relative animate-hero-in-delay">
                <div className="absolute -inset-4 rounded-[2rem] bg-red-100/60 blur-2xl" />
                <div className="relative bg-white rounded-[2rem] border border-gray-200 p-5 md:p-7 shadow-xl shadow-slate-200/70">
                  <div className="flex items-center justify-between mb-5">
                    <div><p className="text-xs text-gray-500">DrutoLink delivery route</p><p className="font-display font-bold text-lg text-gray-900">চীন → বাংলাদেশ</p></div>
                    <span className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Package className="h-5 w-5" /></span>
                  </div>
                  <div className="rounded-2xl bg-slate-50 border border-slate-100 p-3 md:p-5">
                    <RouteGraphic />
                  </div>
                  <div className="grid grid-cols-3 gap-2 mt-4">
                    {[{icon: Package, t:'সোর্সিং'}, {icon: ShieldCheck, t:'প্রসেসিং'}, {icon: Truck, t:'ডেলিভারি'}].map(({icon: Icon, t}) => (
                      <div key={t} className="rounded-xl bg-slate-50 border border-gray-100 p-3 text-center">
                        <Icon className="h-4 w-4 mx-auto text-red-600" /><p className="text-[11px] font-semibold text-gray-700 mt-1">{t}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Quick service actions */}
          <section className="bg-white border-b border-gray-100">
            <div className="max-w-6xl mx-auto px-4 py-6 md:py-7 grid md:grid-cols-3 gap-3">
              {[
                { icon: Search, title: 'পণ্য খুঁজুন', desc: 'ক্যাটালগ থেকে আপনার পছন্দের পণ্য বেছে নিন।', action: scrollToProducts },
                { icon: Camera, title: 'ছবি দিয়ে খুঁজুন', desc: 'ছবি আপলোড করে মিল থাকা পণ্য দেখুন।', action: openImageSearch },
                { icon: Truck, title: 'অর্ডার ট্র্যাক করুন', desc: 'লগ ইন করে আপনার অর্ডারের অবস্থা দেখুন।', action: goToOrders },
              ].map(({icon: Icon, title, desc, action}) => (
                <button key={title} onClick={action} className="group text-left flex items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 py-4 hover:border-red-200 hover:bg-red-50/40 hover:-translate-y-0.5 transition-all duration-200">
                  <span className="h-11 w-11 shrink-0 rounded-xl bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-600 group-hover:text-white transition-colors"><Icon className="h-5 w-5" /></span>
                  <span><span className="block font-display font-bold text-gray-900">{title}</span><span className="block text-xs text-gray-500 mt-0.5">{desc}</span></span>
                  <ChevronRight className="h-4 w-4 ml-auto text-gray-300 group-hover:text-red-500" />
                </button>
              ))}
            </div>
          </section>

          {/* Trust strip */}
          <section className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                { icon: Package, label: '৫,০০০+ পণ্যের ক্যাটালগ' },
                { icon: ShieldCheck, label: 'ভেরিফায়েড সাপ্লায়ার' },
                { icon: Wallet, label: 'বিকাশ ও নগদ পেমেন্ট' },
                { icon: Truck, label: '৬৪ জেলায় ডেলিভারি' },
              ].map(({ icon: Icon, label }) => (
                <div key={label} className="flex items-center gap-2.5 rounded-xl px-2 py-1.5 transition-colors hover:bg-red-50/60">
                  <span className="h-8 w-8 rounded-full bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-gray-700">{label}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Categories */}
          <section className="max-w-6xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-4">
              <div><p className="text-xs font-bold uppercase tracking-wider text-red-600 mb-1">Explore</p><h2 className="font-display text-2xl font-extrabold text-gray-900">ক্যাটাগরি থেকে পণ্য খুঁজুন</h2></div>
              {selectedCategory && (
                <button onClick={() => setSelectedCategory(null)} className="text-xs text-red-600 hover:underline transition-colors">সব দেখুন ✕</button>
              )}
            </div>
            <div className="overflow-hidden pb-2">
              <div className="flex gap-3 w-max cat-marquee-track">
                {/* তালিকাটা দুইবার বসানো হয়েছে যাতে -50% পর্যন্ত সরলে লুপটা নিরবচ্ছিন্ন (seamless) দেখায় */}
                {[...CATEGORIES, ...CATEGORIES].map((c, i) => (
                  <button key={`${c.name}-${i}`} onClick={() => { setSelectedCategory(c.name === selectedCategory ? null : c.name); scrollToProducts(); }}
                    className={`shrink-0 flex flex-col items-center gap-2 border rounded-xl px-5 py-4 min-w-[110px] transition-all duration-200 hover:-translate-y-0.5 ${selectedCategory === c.name ? 'bg-red-50 border-red-400 ring-1 ring-red-400 shadow-sm' : 'bg-gray-50 hover:bg-red-50 border-gray-200 hover:border-red-300 hover:shadow-sm'}`}>
                    <span className="text-2xl">{c.emoji}</span>
                    <span className="text-xs font-medium text-gray-700 text-center leading-tight">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* How it works */}
          <section ref={howItWorksRef} className="bg-red-700 text-white">
            <div className="max-w-6xl mx-auto px-4 py-14">
              <p className="text-red-100 text-xs font-bold uppercase tracking-wider mb-2">Simple process</p>
              <h2 className="font-display text-2xl md:text-3xl font-extrabold mb-3">মাত্র ৩ ধাপে অর্ডার করুন</h2>
              <p className="text-red-100 text-sm md:text-base mb-9">পণ্য নির্বাচন থেকে ডেলিভারি—প্রক্রিয়াটি সহজ রাখাই DrutoLink-এর লক্ষ্য।</p>
              <div className="grid md:grid-cols-3 gap-8 md:gap-6 relative">
                {[
                  { n: '১', t: 'প্রোডাক্ট বাছাই করুন', d: 'ক্যাটালগ থেকে পছন্দের প্রোডাক্ট ও পরিমাণ বেছে নিন।' },
                  { n: '২', t: 'বিকাশ/নগদে পেমেন্ট করুন', d: 'নির্দিষ্ট নাম্বারে টাকা পাঠিয়ে ট্রানজেকশন আইডি দিন।' },
                  { n: '৩', t: 'আমরা সোর্স করে পাঠাই', d: 'চীন থেকে প্রোডাক্ট সংগ্রহ করে আপনার ঠিকানায় ডেলিভারি করি।' },
                ].map((s, i) => <StepCard key={s.n} step={s} index={i} />)}
              </div>
            </div>
          </section>

          {/* Product grid */}
          <section ref={productsRef} className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h2 className="font-display text-xl font-bold text-gray-900">
                {visual.active ? 'ছবির সাথে মিলে যাওয়া পণ্য' : (selectedCategory ? selectedCategory : 'জনপ্রিয় পণ্য')}
              </h2>
              {/* মোবাইলেও যেন ছবি-সার্চ হাতের কাছে থাকে (হেডারের সার্চ বার শুধু বড় স্ক্রিনে দেখায়) */}
              <button onClick={openImageSearch} disabled={visual.searching}
                className="flex items-center gap-1.5 text-sm font-semibold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-full transition-colors disabled:opacity-60">
                {visual.searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
                ছবি দিয়ে খুঁজুন
              </button>
            </div>

            {/* ছবি-সার্চ চালু থাকলে উপরে কোন ছবি দিয়ে খোঁজা হচ্ছে সেটা দেখাই */}
            {visual.active && (
              <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5">
                {visual.queryImage && (
                  <img src={visual.queryImage} alt="সার্চ করা ছবি" className="h-14 w-14 object-cover rounded-lg border border-gray-200" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800">
                    {visual.searching ? 'মিলিয়ে দেখা হচ্ছে...' : `${visibleProducts.length} টি মিল পাওয়া গেছে`}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">আপনার দেওয়া ছবির রঙ ও গড়নের সাথে সবচেয়ে কাছাকাছি পণ্যগুলো উপরে।</p>
                </div>
                <button onClick={visual.clear} className="text-gray-400 hover:text-red-600 p-1.5 rounded-full transition-colors" title="ছবি সার্চ বাতিল">
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}

            {visual.error && (
              <p className="text-sm text-red-600 mb-4">{visual.error}</p>
            )}

            {visibleProducts.length === 0 ? (
              visual.active ? (
                <div className="text-sm text-gray-500">
                  <p className="mb-2">এই ছবির সাথে মিলে এমন পণ্য ক্যাটালগে পাওয়া যায়নি।</p>
                  <p className="text-gray-400">পরিষ্কার ব্যাকগ্রাউন্ডে তোলা ছবি দিলে ভালো ফল আসে। অথবা পণ্যের নাম লিখে খুঁজে দেখুন — না পেলে আমরা চীন থেকে সোর্স করে দিতে পারি।</p>
                  <button onClick={visual.clear} className="mt-3 text-red-700 font-semibold underline underline-offset-2">সব পণ্য দেখুন</button>
                </div>
              ) : (
                <p className="text-gray-500 text-sm">কোনো প্রোডাক্ট পাওয়া যায়নি। {products.length === 0 && 'অ্যাডমিন প্যানেল থেকে প্রোডাক্ট যোগ করুন।'}</p>
              )
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
                {visibleProducts.map((p) => {
                  const hasVariants = (p.sizes && p.sizes.length > 0) || (p.colors && p.colors.length > 0);
                  return (
                    <div key={p.id} className="group bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/70 hover:-translate-y-1 hover:border-gray-300">
                      <button onClick={() => setDetailProduct(p)} className="block overflow-hidden relative w-full">
                        <img src={p.image} alt={p.title} className="h-40 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
                        {p._matchScore != null && (
                          <span className="absolute top-2 left-2 bg-black/65 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                            {Math.round(p._matchScore * 100)}% মিল
                          </span>
                        )}
                      </button>
                      <div className="p-3.5 flex flex-col flex-1">
                        <button onClick={() => setDetailProduct(p)} className="text-left">
                          <h3 className="text-sm font-semibold text-gray-800 leading-snug transition-colors group-hover:text-red-700">{p.title}</h3>
                        </button>
                        {hasVariants && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            {p.sizes?.length ? `${p.sizes.length} সাইজ` : ''}
                            {p.sizes?.length && p.colors?.length ? ' · ' : ''}
                            {p.colors?.length ? `${p.colors.length} কালার` : ''}
                          </p>
                        )}
                        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                          <span className="font-display text-red-700 font-bold">৳ {p.price}</span>
                          <button
                            onClick={() => hasVariants ? setDetailProduct(p) : handleAddToCart(p)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 hover:shadow-md hover:shadow-red-600/25 active:scale-95">
                            {hasVariants ? 'অপশন বাছাই' : 'কার্টে যোগ করুন'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Footer */}
          <footer className="bg-slate-950 text-slate-300">
            <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-4 gap-8">
              <div className="md:col-span-2">
                <div className="flex items-center gap-2 font-display text-xl font-extrabold text-white">
                  <img src={LOGO_URL} alt="DrutoLink" className="h-9 w-9 object-contain rounded-lg" />
                  Druto<span className="font-medium text-slate-300">Link</span>
                </div>
                <p className="text-sm leading-6 text-slate-400 max-w-md mt-4">চীন থেকে পণ্য সোর্সিং, অর্ডার প্রসেসিং এবং বাংলাদেশে ডেলিভারির জন্য একটি সহজ ও আধুনিক প্ল্যাটফর্ম।</p>
              </div>
              <div>
                <h3 className="font-bold text-white mb-3">দ্রুত লিংক</h3>
                <div className="space-y-2 text-sm">
                  <button onClick={() => setCurrentView('home')} className="block hover:text-white">হোম</button>
                  <button onClick={scrollToProducts} className="block hover:text-white">পণ্য</button>
                  <button onClick={scrollToHowItWorks} className="block hover:text-white">কীভাবে কাজ করে</button>
                  <button onClick={goToOrders} className="block hover:text-white">অর্ডার ট্র্যাক</button>
                </div>
              </div>
              <div>
                <h3 className="font-bold text-white mb-3">স্টাফ</h3>
                <div className="space-y-2 text-sm">
                  <button onClick={() => setCurrentView('worker')} className="block hover:text-white">কর্মী লগইন</button>
                  <button onClick={() => setCurrentView('admin')} className="block hover:text-white">অ্যাডমিন প্যানেল</button>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10">
              <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row gap-2 items-center justify-between text-xs text-slate-500">
                <span>© ২০২৬ DrutoLink. সর্বস্বত্ব সংরক্ষিত।</span>
                <span>বিকাশ ও নগদ পেমেন্ট সুবিধা</span>
              </div>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
