import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShieldCheck, Truck, Wallet, Package, Plane, ChevronRight, ChevronLeft,
  Menu, ShoppingCart, User, CreditCard, LayoutDashboard, ShoppingBag,
  CheckCircle, Upload, ArrowLeft, Lock, Key, Trash2, Plus, Minus, LogOut, X,
  Eye, EyeOff, Phone as PhoneIcon, Mail, Circle, MapPin
} from 'lucide-react';
import { db, auth } from './firebase';
import {
  collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, where,
  serverTimestamp, updateDoc, setDoc, getDoc,
} from 'firebase/firestore';
import {
  onAuthStateChanged, signInWithEmailAndPassword, signOut,
  createUserWithEmailAndPassword, updateProfile,
  GoogleAuthProvider, signInWithPopup,
} from 'firebase/auth';

// এই ইমেইলটা Firebase Console → Authentication → Users এ যে অ্যাডমিন ইউজার বানাবেন, সেটার সাথে হুবহু মিলতে হবে
const ADMIN_EMAIL = 'admin@drutolink.com';

// অর্ডারের ধাপগুলো — ঠিক এই ক্রমে, AdminDashboard-এর স্ট্যাটাস ড্রপডাউনের সাথে মিলিয়ে
const ORDER_STAGES = ['Pending TrxID', 'Order Placed', 'Sourced in China', 'Delivered'];

const FONTS = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+Da+2:wght@500;700;800&family=Hind+Siliguri:wght@400;500;600;700&display=swap');
.font-display { font-family: 'Baloo Da 2', 'Hind Siliguri', sans-serif; }
.font-body { font-family: 'Hind Siliguri', sans-serif; }
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
  { image: 'https://raw.githubusercontent.com/mahmudmahirgenexofficialbd-svg/drutolink/main/slide1.jpg', alt: 'চায়না টু বাংলাদেশ শিপিং' },
  { image: 'https://raw.githubusercontent.com/mahmudmahirgenexofficialbd-svg/drutolink/main/slide2.jpg', alt: 'চায়না টু বাংলাদেশ শিপিং তথ্য' },
  { image: 'https://raw.githubusercontent.com/mahmudmahirgenexofficialbd-svg/drutolink/main/slide3.jpg', alt: 'সোর্সিং টু শিপিং এক ওয়েবসাইটে' },
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
    <div className="relative w-full overflow-hidden rounded-2xl border border-gray-200">
      <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${active * 100}%)` }}>
        {SLIDES.map((s, i) => (
          <div key={i} className="min-w-full relative h-48 md:h-72">
            <img src={s.image} alt={s.alt} className="absolute inset-0 w-full h-full object-cover" />
          </div>
        ))}
      </div>
      <button onClick={() => goTo((active - 1 + SLIDES.length) % SLIDES.length)}
        className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-1.5">
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button onClick={() => goTo((active + 1) % SLIDES.length)}
        className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white text-gray-900 rounded-full p-1.5">
        <ChevronRight className="h-5 w-5" />
      </button>
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2">
        {SLIDES.map((_, i) => (
          <button key={i} onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all ${i === active ? 'w-6 bg-red-600' : 'w-2 bg-white/70'}`} />
        ))}
      </div>
    </div>
  );
}

function RouteGraphic() {
  return (
    <svg viewBox="0 0 400 220" className="w-full h-auto">
      <path d="M 40 170 Q 200 20 360 60" fill="none" stroke="#dc2626" strokeWidth="2" strokeDasharray="6 6" opacity="0.6" />
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
function CartDrawer({ isOpen, onClose, cart, onUpdateQuantity, onRemove, cartTotal, onCheckout }) {
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 bg-black/40 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      />
      {/* Slide-in panel */}
      <div
        role="dialog"
        aria-label="কার্ট"
        className={`fixed top-0 right-0 h-full w-full max-w-sm bg-white z-50 shadow-2xl flex flex-col font-body transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 shrink-0">
          <h3 className="font-display text-lg font-bold text-gray-900 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-red-600" /> আপনার কার্ট ({cartCount})
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 p-1 rounded-full hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
          {cart.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">
              আপনার কার্ট খালি। প্রোডাক্ট বেছে "কার্টে যোগ করুন" চাপুন।
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.cartLineId} className="p-4 flex items-center gap-3">
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
                  <div className="flex items-center border rounded-lg mt-2 w-fit">
                    <button onClick={() => onUpdateQuantity(item.cartLineId, -1)} className="p-1.5 text-gray-600 hover:bg-gray-50">
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="px-3 text-xs font-semibold">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.cartLineId, 1)} className="p-1.5 text-gray-600 hover:bg-gray-50">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                </div>
                <button onClick={() => onRemove(item.cartLineId)} className="text-gray-400 hover:text-red-600 p-1 shrink-0">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))
          )}
        </div>

        {cart.length > 0 && (
          <div className="border-t border-gray-200 p-5 space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700">সর্বমোট</span>
              <span className="font-display text-red-700 font-bold text-lg">৳ {cartTotal}</span>
            </div>
            <button onClick={onCheckout} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">
              চেকআউটে যান
            </button>
            <button onClick={onClose} className="w-full text-sm text-gray-500 hover:text-gray-800 py-1">
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

  useEffect(() => {
    setSelectedSize(product?.sizes?.[0] || '');
    setSelectedColor(product?.colors?.[0]?.name || '');
  }, [product]);

  if (!product) return null;

  const hasSizes = product.sizes && product.sizes.length > 0;
  const hasColors = product.colors && product.colors.length > 0;

  const handleAdd = () => {
    onAddToCart(product, {
      selectedSize: hasSizes ? selectedSize : undefined,
      selectedColor: hasColors ? selectedColor : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 font-body">
      <div onClick={onClose} className="absolute inset-0 bg-black/50" />
      <div className="relative bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <button onClick={onClose} className="absolute top-3 right-3 bg-white/90 hover:bg-white rounded-full p-1.5 shadow z-10">
          <X className="h-5 w-5 text-gray-700" />
        </button>
        <img src={product.image} alt={product.title} className="w-full h-56 object-cover rounded-t-2xl" />
        <div className="p-5">
          <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">{product.category}</span>
          <h3 className="font-display text-xl font-bold text-gray-900 mt-2">{product.title}</h3>
          <p className="text-red-600 font-bold text-lg mt-1">৳ {product.price}</p>

          {hasSizes && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">সাইজ বাছাই করুন</p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s) => (
                  <button key={s} onClick={() => setSelectedSize(s)}
                    className={`px-3.5 py-1.5 rounded-lg border text-sm font-semibold ${selectedSize === s ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasColors && (
            <div className="mt-4">
              <p className="text-sm font-semibold text-gray-700 mb-2">কালার বাছাই করুন</p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c) => (
                  <button key={c.name} onClick={() => setSelectedColor(c.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium ${selectedColor === c.name ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-300 text-gray-700 hover:border-gray-400'}`}>
                    <span className="h-4 w-4 rounded-full border border-gray-300" style={{ backgroundColor: c.hex || '#ccc' }} />
                    {c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button onClick={handleAdd}
            className="w-full mt-6 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl transition-colors">
            কার্টে যোগ করুন
          </button>
        </div>
      </div>
    </div>
  );
}

// --- ORDER STATUS TIMELINE ---
function OrderStatusTimeline({ status }) {
  const currentIndex = Math.max(0, ORDER_STAGES.indexOf(status));
  return (
    <div className="flex items-center w-full">
      {ORDER_STAGES.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <React.Fragment key={stage}>
            <div className="flex flex-col items-center text-center w-20">
              <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                done ? 'bg-red-600 border-red-600 text-white'
                : active ? 'border-red-600 text-red-600 bg-red-50'
                : 'border-gray-300 text-gray-300 bg-white'
              }`}>
                {done ? <CheckCircle className="h-4 w-4" /> : <Circle className="h-3 w-3 fill-current" />}
              </div>
              <span className={`mt-1.5 text-[10px] leading-tight ${active ? 'text-red-700 font-bold' : done ? 'text-gray-700' : 'text-gray-400'}`}>
                {stage}
              </span>
            </div>
            {i < ORDER_STAGES.length - 1 && (
              <div className={`flex-1 h-0.5 -mt-5 ${i < currentIndex ? 'bg-red-600' : 'bg-gray-200'}`} />
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
      <div className="bg-white w-full max-w-md rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="flex items-center gap-2 justify-center mb-1 cursor-pointer" onClick={goHome}>
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
            className="w-full flex items-center justify-center gap-2 border border-gray-200 rounded-xl py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60">
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
                className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-red-500" />
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
                className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-red-500" />
            </div>
          )}

          {!isSignup && loginMethod === 'phone' && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5" /> Phone Number</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-red-500" />
              <p className="text-[11px] text-amber-600 mt-1">ফোন নম্বর দিয়ে লগইন এখনো চালু হয়নি — আপাতত ইমেইল ব্যবহার করুন।</p>
            </div>
          )}

          {isSignup && (
            <div>
              <label className="text-sm font-medium text-gray-700 flex items-center gap-1"><PhoneIcon className="h-3.5 w-3.5" /> ফোন নম্বর</label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full mt-1 border border-gray-200 rounded-lg p-2.5 outline-none focus:border-red-500" />
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700">Password</label>
            <div className="relative mt-1">
              <input type={showPassword ? 'text' : 'password'} required minLength={6} value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-200 rounded-lg p-2.5 pr-10 outline-none focus:border-red-500" />
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
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl disabled:opacity-60">
            {authLoading ? 'অপেক্ষা করুন...' : isSignup ? 'Sign up' : 'Sign in'}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-5">
          {isSignup ? (
            <>Already have an account? <button onClick={() => setMode('login')} className="text-red-700 font-semibold">Sign in</button></>
          ) : (
            <>New here? <button onClick={() => setMode('signup')} className="text-red-700 font-semibold">Sign up</button></>
          )}
        </p>

        <button onClick={goHome} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 mt-4">
          স্টোরে ফিরে যান
        </button>
      </div>
    </div>
  );
}

// --- SECURE ADMIN DASHBOARD ---
function AdminDashboard({ goHome, handleLogout, products, orders }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0].name);
  const [saving, setSaving] = useState(false);

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
      await addDoc(collection(db, 'products'), {
        title,
        price,
        category,
        image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
        sizes,
        colors,
        createdAt: serverTimestamp(),
      });
      setTitle(''); setPrice(''); setImage(''); setCategory(CATEGORIES[0].name);
      setSizes([]); setColors([]); setSizeInput(''); setColorNameInput('');
      alert('প্রোডাক্ট সফলভাবে যোগ হয়েছে!');
      setActiveTab('orders');
    } catch (err) {
      alert('প্রোডাক্ট সেভ করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProduct = async (id) => {
    await deleteDoc(doc(db, 'products', id));
  };

  const handleUpdateStatus = async (orderId, status) => {
    await updateDoc(doc(db, 'orders', orderId), { status });
  };

  return (
    <div className="flex h-screen bg-gray-50 font-body w-full">
      <div className="w-64 bg-red-700 text-white flex flex-col">
        <div className="p-6">
          <h1 className="font-display text-2xl font-bold">
            Druto<span className="text-red-100 font-medium">Admin</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-white text-red-700' : 'text-red-100 hover:bg-red-800'}`}>
            <ShoppingBag className="h-5 w-5" />
            <span>অর্ডার ও TrxID ({orders.length})</span>
          </button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'products' ? 'bg-white text-red-700' : 'text-red-100 hover:bg-red-800'}`}>
            <Package className="h-5 w-5" />
            <span>প্রোডাক্ট ({products.length})</span>
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

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-red-600 pb-1">
            {activeTab === 'orders' ? 'অর্ডার ম্যানেজমেন্ট' : 'প্রোডাক্ট ইনভেন্টরি'}
          </h2>
          <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">নিরাপদভাবে লগ ইন করা আছে</span>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold mb-4">সাম্প্রতিক অর্ডার (ম্যানুয়াল যাচাই)</h3>
              {orders.length === 0 ? (
                <p className="text-gray-500 text-sm">এখনো কোনো অর্ডার আসেনি।</p>
              ) : (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200">
                      <th className="p-4 font-medium">প্রোডাক্ট</th>
                      <th className="p-4 font-medium">পেমেন্ট (TrxID)</th>
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
                          <p className="text-xs text-red-600 font-bold mt-1">মোট ৳ {o.totalPrice}</p>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-bold mb-1 ${o.paymentMethod === 'bkash' ? 'bg-pink-100 text-pink-700' : 'bg-orange-100 text-orange-700'}`}>
                            {o.paymentMethod === 'bkash' ? 'bKash' : 'Nagad'}
                          </span>
                          <p className="font-mono text-sm">{o.trxId}</p>
                          <p className="text-[11px] text-gray-500">A/C: {o.accountNumber}</p>
                        </td>
                        <td className="p-4">
                          <select value={o.status} onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                            className="bg-gray-50 border border-gray-200 text-sm rounded p-2">
                            <option>Pending TrxID</option>
                            <option>Order Placed</option>
                            <option>Sourced in China</option>
                            <option>Delivered</option>
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
              )}
            </div>
          )}

          {activeTab === 'products' && (
            <div className="space-y-8">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
                <h3 className="text-lg font-bold mb-4">নতুন পাইকারি প্রোডাক্ট যোগ করুন</h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">প্রোডাক্টের নাম</label>
                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500" placeholder="যেমনঃ পুতিয়ান স্পোর্টস জুতা" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ক্যাটাগরি</label>
                    <select value={category} onChange={(e) => setCategory(e.target.value)}
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500 bg-white">
                      {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">দাম (টাকা)</label>
                    <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-red-500" placeholder="2500" />
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
                        placeholder="যেমনঃ 26" className="flex-1 border rounded-lg p-2.5 outline-none focus:border-red-500" />
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
                        placeholder="যেমনঃ লাল" className="flex-1 border rounded-lg p-2.5 outline-none focus:border-red-500" />
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

                  <button type="submit" disabled={saving} className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60">
                    {saving ? 'সেভ হচ্ছে...' : 'সেভ করুন ও পাবলিশ করুন'}
                  </button>
                </form>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold mb-4">চালু ক্যাটালগ ({products.length} টি)</h3>
                {products.length === 0 ? (
                  <p className="text-gray-500 text-sm">এখনো কোনো প্রোডাক্ট যোগ করা হয়নি।</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {products.map((p) => (
                      <div key={p.id} className="border rounded-lg p-4 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <img src={p.image} alt={p.title} className="h-12 w-12 object-cover rounded" />
                          <div>
                            <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{p.title}</h4>
                            <p className="text-xs text-red-600 font-semibold">৳ {p.price}</p>
                            {((p.sizes && p.sizes.length > 0) || (p.colors && p.colors.length > 0)) && (
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                {p.sizes?.length ? `${p.sizes.length} সাইজ` : ''}
                                {p.sizes?.length && p.colors?.length ? ' · ' : ''}
                                {p.colors?.length ? `${p.colors.length} কালার` : ''}
                              </p>
                            )}
                          </div>
                        </div>
                        <button onClick={() => handleDeleteProduct(p.id)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    ))}
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

// --- MAIN STOREFRONT & PASSWORD GATE COMPONENT ---
export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [paymentMethod, setPaymentMethod] = useState('bkash');
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [detailProduct, setDetailProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [accountNumber, setAccountNumber] = useState('');
  const [trxId, setTrxId] = useState('');
  const [orderSubmitting, setOrderSubmitting] = useState(false);

  const productsRef = useRef(null);
  const howItWorksRef = useRef(null);

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);

  // Real-time product feed from Firestore — visible to every visitor, not just this browser
  useEffect(() => {
    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setProducts(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Real-time order feed for the admin dashboard
  useEffect(() => {
    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // --- AUTH (single Firebase Authentication instance, shared by admin + customers) ---
  const [authUser, setAuthUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [customerProfile, setCustomerProfile] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [loggingIn, setLoggingIn] = useState(false);

  // Admin is identified by email match, NOT merely by "someone is logged in" —
  // otherwise any signed-in customer would also see the admin dashboard.
  const isAdminLoggedIn = !!authUser && authUser.email === ADMIN_EMAIL;
  const isCustomerLoggedIn = !!authUser && authUser.email !== ADMIN_EMAIL;

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setAuthChecked(true);
    });
    return () => unsub();
  }, []);

  // Load the logged-in customer's profile (name/phone) from Firestore
  useEffect(() => {
    if (!authUser || authUser.email === ADMIN_EMAIL) {
      setCustomerProfile(null);
      return;
    }
    (async () => {
      const snap = await getDoc(doc(db, 'customers', authUser.uid));
      setCustomerProfile(snap.exists() ? snap.data() : null);
    })();
  }, [authUser]);

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

  const handleConfirmOrder = async () => {
    if (cart.length === 0) return;

    // Checkout requires a logged-in customer, so every order can be tied to an account
    if (!isCustomerLoggedIn) {
      setRedirectAfterLogin('checkout');
      setCurrentView('login');
      return;
    }

    if (!accountNumber || !trxId) {
      alert('অনুগ্রহ করে আপনার একাউন্ট নাম্বার ও ট্রানজেকশন আইডি দিন।');
      return;
    }
    setOrderSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        items: cart.map((item) => ({ title: item.title, price: item.price, quantity: item.quantity, image: item.image, selectedSize: item.selectedSize || null, selectedColor: item.selectedColor || null })),
        totalPrice: cartTotal,
        paymentMethod,
        accountNumber,
        trxId,
        status: 'Pending TrxID',
        createdAt: serverTimestamp(),
        customerId: authUser.uid,
        customerName: customerProfile?.name || authUser.displayName || '',
        customerEmail: authUser.email || '',
        customerPhone: customerProfile?.phone || null,
      });
      alert('অর্ডার সফলভাবে দেওয়া হয়েছে! আমরা আপনার TrxID যাচাই করব।');
      setAccountNumber(''); setTrxId(''); setCart([]);
      setCurrentView('home');
    } catch (err) {
      alert('দুঃখিত, অর্ডার সাবমিট করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setOrderSubmitting(false);
    }
  };

  const scrollToProducts = () => productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  const scrollToHowItWorks = () => howItWorksRef.current?.scrollIntoView({ behavior: 'smooth' });

  const visibleProducts = products
    .filter((p) => !selectedCategory || p.category === selectedCategory)
    .filter((p) => p.title?.toLowerCase().includes(searchQuery.toLowerCase()));

  if (!authChecked && currentView === 'admin') {
    return <div className="min-h-screen flex items-center justify-center text-gray-500 font-body">লোড হচ্ছে...</div>;
  }

  if (currentView === 'admin' && isAdminLoggedIn) {
    return <AdminDashboard goHome={() => setCurrentView('home')} handleLogout={handleLogout} products={products} orders={orders} />;
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
            <button type="submit" disabled={loggingIn} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors disabled:opacity-60">
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6 flex items-center gap-4">
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
                <div key={o.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      {(o.items || []).map((it, idx) => (
                        <p key={idx} className="text-sm font-semibold">{it.title} × {it.quantity}</p>
                      ))}
                    </div>
                    <span className="font-display text-red-700 font-bold">৳ {o.totalPrice}</span>
                  </div>
                  <OrderStatusTimeline status={o.status} />
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

      {/* Header */}
      <header className="bg-red-700 text-white sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <Menu className="h-6 w-6 lg:hidden" />
            <span className="font-display text-2xl font-extrabold tracking-tight text-white">
              Druto<span className="font-medium text-red-100">Link</span>
            </span>
          </div>
          <form onSubmit={(e) => { e.preventDefault(); scrollToProducts(); }} className="hidden md:flex flex-1 max-w-xl relative">
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="প্রোডাক্ট খুঁজুন..." className="w-full rounded-full py-2 pl-4 pr-11 text-gray-900 bg-white outline-none" />
            <button type="submit" className="absolute right-1.5 top-1.5 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full">
              <Search className="h-4 w-4" />
            </button>
          </form>
          <div className="flex items-center gap-5 text-sm">
            {isCustomerLoggedIn ? (
              <div onClick={() => setCurrentView('account')} className="flex flex-col items-center cursor-pointer">
                <User className="h-5 w-5" />
                <span className="text-xs mt-0.5">{customerProfile?.name?.split(' ')[0] || 'অ্যাকাউন্ট'}</span>
              </div>
            ) : (
              <div onClick={() => { setRedirectAfterLogin('home'); setCurrentView('login'); }} className="flex flex-col items-center cursor-pointer">
                <User className="h-5 w-5" />
                <span className="text-xs mt-0.5">লগ ইন</span>
              </div>
            )}
            <div onClick={() => setIsCartOpen(true)} className="flex flex-col items-center cursor-pointer relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 bg-white text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cartCount}</span>
              <span className="text-xs mt-0.5">কার্ট</span>
            </div>
          </div>
        </div>
      </header>

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
          <button onClick={() => setCurrentView('home')} className="flex items-center text-sm text-gray-600 mb-4 hover:text-red-600">
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-6 divide-y divide-gray-100">
              {cart.map((item) => (
                <div key={item.cartLineId} className="p-4 flex items-center space-x-4">
                  <img src={item.image} alt={item.title} className="h-16 w-16 object-cover rounded" />
                  <div className="flex-1">
                    <h3 className="font-bold text-gray-800 text-sm">{item.title}</h3>
                    {(item.selectedSize || item.selectedColor) && (
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        {item.selectedSize && `সাইজ: ${item.selectedSize}`}
                        {item.selectedSize && item.selectedColor && ' · '}
                        {item.selectedColor && `কালার: ${item.selectedColor}`}
                      </p>
                    )}
                    <p className="text-red-600 font-bold text-sm mt-1">৳ {item.price}</p>
                  </div>
                  <div className="flex items-center border rounded-lg">
                    <button onClick={() => handleUpdateQuantity(item.cartLineId, -1)} className="p-2 text-gray-600 hover:bg-gray-50"><Minus className="h-3.5 w-3.5" /></button>
                    <span className="px-3 text-sm font-semibold">{item.quantity}</span>
                    <button onClick={() => handleUpdateQuantity(item.cartLineId, 1)} className="p-2 text-gray-600 hover:bg-gray-50"><Plus className="h-3.5 w-3.5" /></button>
                  </div>
                  <button onClick={() => handleRemoveFromCart(item.cartLineId)} className="text-gray-400 hover:text-red-600 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
              <div className="p-4 flex items-center justify-between bg-gray-50">
                <span className="font-bold text-gray-700">সর্বমোট</span>
                <span className="font-display text-red-700 font-bold text-lg">৳ {cartTotal}</span>
              </div>
            </div>
          )}

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center"><CreditCard className="h-5 w-5 mr-2 text-red-600" /> পেমেন্ট মাধ্যম বেছে নিন</h3>
            <div className="flex space-x-4 mb-6">
              <button onClick={() => setPaymentMethod('bkash')} className={`flex-1 py-3 border rounded-lg font-bold ${paymentMethod === 'bkash' ? 'border-red-500 bg-red-50 text-red-600' : 'border-gray-200'}`}>bKash</button>
              <button onClick={() => setPaymentMethod('nagad')} className={`flex-1 py-3 border rounded-lg font-bold ${paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200'}`}>Nagad</button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">অনুগ্রহ করে <b>{paymentMethod.toUpperCase()}</b>-এ টাকা পাঠান:</p>
              <p className="text-xl font-bold text-gray-900 mb-4">+880 1620 177883</p>
              <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="আপনার একাউন্ট নাম্বার (যেমনঃ 017xxxxxxxx)" className="w-full border p-2.5 rounded mb-3 outline-none focus:border-red-500" />
              <input type="text" value={trxId} onChange={(e) => setTrxId(e.target.value)}
                placeholder="ট্রানজেকশন আইডি (TrxID) লিখুন" className="w-full border p-2.5 rounded outline-none focus:border-red-500" />
            </div>
          </div>
          <button onClick={handleConfirmOrder} disabled={cart.length === 0 || orderSubmitting}
            className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 text-lg disabled:opacity-60">
            {orderSubmitting ? 'সাবমিট হচ্ছে...' : isCustomerLoggedIn ? 'পাইকারি অর্ডার নিশ্চিত করুন' : 'লগ ইন করে অর্ডার নিশ্চিত করুন'}
          </button>
        </div>
      ) : (
        <>
          {/* Image slider */}
          <section className="bg-gray-50 border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 py-6">
              <ImageSlider />
            </div>
          </section>

          {/* Hero */}
          <section className="bg-gray-50 border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 pb-12 grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold leading-snug text-gray-900">
                  চীনের পাইকারি বাজার, এখন আপনার দোকান পর্যন্ত
                </h1>
                <p className="mt-4 text-gray-600 text-base leading-relaxed max-w-md">
                  হাজারো ভেরিফায়েড চীনা সাপ্লায়ারের প্রোডাক্ট সরাসরি অর্ডার করুন, বিকাশ বা নগদে পেমেন্ট করুন — আমরা সোর্স করে আপনার ঠিকানায় পৌঁছে দেব।
                </p>
                <div className="mt-6 flex gap-3">
                  <button onClick={scrollToProducts} className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg">
                    প্রোডাক্ট দেখুন
                  </button>
                  <button onClick={scrollToHowItWorks} className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-lg">
                    কীভাবে অর্ডার করব?
                  </button>
                </div>
              </div>
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <RouteGraphic />
              </div>
            </div>
          </section>

          {/* Stats / trust strip */}
          <section className="bg-white border-b border-gray-200">
            <div className="max-w-6xl mx-auto px-4 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div className="flex items-center gap-2"><Package className="h-5 w-5 text-red-600 shrink-0" /><span>৫,০০০+ পণ্যের ক্যাটালগ</span></div>
              <div className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-red-600 shrink-0" /><span>ভেরিফায়েড সাপ্লায়ার</span></div>
              <div className="flex items-center gap-2"><Wallet className="h-5 w-5 text-red-600 shrink-0" /><span>বিকাশ ও নগদ পেমেন্ট</span></div>
              <div className="flex items-center gap-2"><Truck className="h-5 w-5 text-red-600 shrink-0" /><span>৬৪ জেলায় ডেলিভারি</span></div>
            </div>
          </section>

          {/* Categories */}
          <section className="max-w-6xl mx-auto px-4 py-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-gray-900">ক্যাটাগরি ঘুরে দেখুন</h2>
              {selectedCategory && (
                <button onClick={() => setSelectedCategory(null)} className="text-xs text-red-600 hover:underline">সব দেখুন ✕</button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {CATEGORIES.map((c) => (
                <button key={c.name} onClick={() => { setSelectedCategory(c.name === selectedCategory ? null : c.name); scrollToProducts(); }}
                  className={`shrink-0 flex flex-col items-center gap-2 border rounded-xl px-5 py-4 min-w-[110px] transition-colors ${selectedCategory === c.name ? 'bg-red-50 border-red-400' : 'bg-gray-50 hover:bg-red-50 border-gray-200 hover:border-red-300'}`}>
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section ref={howItWorksRef} className="bg-red-700 text-white">
            <div className="max-w-6xl mx-auto px-4 py-12">
              <h2 className="font-display text-xl font-bold mb-8">মাত্র ৩ ধাপে অর্ডার করুন</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { n: '১', t: 'প্রোডাক্ট বাছাই করুন', d: 'ক্যাটালগ থেকে পছন্দের প্রোডাক্ট ও পরিমাণ বেছে নিন।' },
                  { n: '২', t: 'বিকাশ/নগদে পেমেন্ট করুন', d: 'নির্দিষ্ট নাম্বারে টাকা পাঠিয়ে ট্রানজেকশন আইডি দিন।' },
                  { n: '৩', t: 'আমরা সোর্স করে পাঠাই', d: 'চীন থেকে প্রোডাক্ট সংগ্রহ করে আপনার ঠিকানায় ডেলিভারি করি।' },
                ].map((s) => (
                  <div key={s.n} className="flex gap-4">
                    <span className="font-display text-3xl font-extrabold text-white">{s.n}</span>
                    <div>
                      <h3 className="font-semibold mb-1">{s.t}</h3>
                      <p className="text-sm text-red-100 leading-relaxed">{s.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Product grid */}
          <section ref={productsRef} className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-gray-900">
                {selectedCategory ? selectedCategory : 'জনপ্রিয় পণ্য'}
              </h2>
            </div>
            {visibleProducts.length === 0 ? (
              <p className="text-gray-500 text-sm">কোনো প্রোডাক্ট পাওয়া যায়নি। {products.length === 0 && 'অ্যাডমিন প্যানেল থেকে প্রোডাক্ট যোগ করুন।'}</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                {visibleProducts.map((p) => {
                  const hasVariants = (p.sizes && p.sizes.length > 0) || (p.colors && p.colors.length > 0);
                  return (
                    <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                      <button onClick={() => setDetailProduct(p)} className="block">
                        <img src={p.image} alt={p.title} className="h-40 w-full object-cover" />
                      </button>
                      <div className="p-3 flex flex-col flex-1">
                        <button onClick={() => setDetailProduct(p)} className="text-left">
                          <h3 className="text-sm font-semibold text-gray-800 leading-snug">{p.title}</h3>
                        </button>
                        {hasVariants && (
                          <p className="text-[11px] text-gray-400 mt-1">
                            {p.sizes?.length ? `${p.sizes.length} সাইজ` : ''}
                            {p.sizes?.length && p.colors?.length ? ' · ' : ''}
                            {p.colors?.length ? `${p.colors.length} কালার` : ''}
                          </p>
                        )}
                        <div className="mt-auto pt-3 flex items-center justify-between">
                          <span className="font-display text-red-700 font-bold">৳ {p.price}</span>
                          <button
                            onClick={() => hasVariants ? setDetailProduct(p) : handleAddToCart(p)}
                            className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
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
          <footer className="bg-red-700 text-red-100">
            <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between gap-4 text-sm">
              <span className="font-display text-lg font-bold text-white">
                Druto<span className="font-medium text-red-100">Link</span>
              </span>
              <span>© ২০২৬ ড্রুটোলিংক। বিকাশ ও নগদে নিরাপদ পেমেন্ট।</span>
              <button onClick={() => setCurrentView('admin')} className="text-red-200 hover:text-white underline underline-offset-2 self-start md:self-auto">
                অ্যাডমিন প্যানেল
              </button>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
