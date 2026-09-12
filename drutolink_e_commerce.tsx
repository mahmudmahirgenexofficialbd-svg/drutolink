import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShieldCheck, Truck, Wallet, Package, Plane, ChevronRight, ChevronLeft,
  Menu, ShoppingCart, User, CreditCard, LayoutDashboard, ShoppingBag,
  CheckCircle, Upload, ArrowLeft, Lock, Key, Trash2
} from 'lucide-react';

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

```javascript
const SLIDES = [
  { image: '/slides/slide1.jpg', alt: 'চায়না টু বাংলাদেশ শিপিং' },
  { image: '/slides/slide2.jpg', alt: 'চায়না টু বাংলাদেশ শিপিং তথ্য' },
  { image: '/slides/slide3.jpg', alt: 'সোর্সিং টু শিপিং এক ওয়েবসাইটে' },
];
```

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

// --- SECURE ADMIN DASHBOARD ---
function AdminDashboard({ goHome, products, setProducts }) {
  const [activeTab, setActiveTab] = useState('orders');
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!title || !price) {
      alert('প্রোডাক্টের নাম ও দাম দিন।');
      return;
    }
    const newProduct = {
      id: Date.now(),
      title,
      price,
      image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60',
    };
    const updated = [newProduct, ...products];
    setProducts(updated);
    localStorage.setItem('drutolink_products', JSON.stringify(updated));
    setTitle(''); setPrice(''); setImage('');
    alert('প্রোডাক্ট সফলভাবে যোগ হয়েছে!');
    setActiveTab('orders');
  };

  const handleDeleteProduct = (id) => {
    const updated = products.filter((p) => p.id !== id);
    setProducts(updated);
    localStorage.setItem('drutolink_products', JSON.stringify(updated));
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
            <span>অর্ডার ও TrxID</span>
          </button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'products' ? 'bg-white text-red-700' : 'text-red-100 hover:bg-red-800'}`}>
            <Package className="h-5 w-5" />
            <span>প্রোডাক্ট ({products.length})</span>
          </button>
        </nav>
        <div className="p-4 border-t border-red-600">
          <button onClick={goHome} className="w-full flex items-center justify-center space-x-2 bg-red-800 hover:bg-red-900 text-white px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>স্টোরে ফিরুন</span>
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
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200">
                    <th className="p-4 font-medium">অর্ডার আইডি</th>
                    <th className="p-4 font-medium">পেমেন্ট (TrxID)</th>
                    <th className="p-4 font-medium">স্ট্যাটাস</th>
                    <th className="p-4 font-medium">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4 font-mono text-sm">#DL-8842</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-pink-100 text-pink-700 mb-1">bKash</span>
                      <p className="font-mono text-sm">8J2A9XXQ1</p>
                    </td>
                    <td className="p-4">
                      <select className="bg-gray-50 border border-gray-200 text-sm rounded p-2">
                        <option>Pending TrxID</option>
                        <option>Order Placed</option>
                        <option>Sourced in China</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <button className="flex items-center space-x-1 text-white bg-green-500 hover:bg-green-600 px-3 py-1.5 rounded text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
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
                  <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors">
                    সেভ করুন ও পাবলিশ করুন
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
  const [cartItem, setCartItem] = useState(null);

  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('drutolink_products');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      { id: 1, title: 'Putian Shox স্পোর্টস জুতা', price: '2760', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60' },
      { id: 2, title: 'মাল্টি-কম্পার্টমেন্ট ক্রসবডি ব্যাগ', price: '4148', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=60' },
    ];
  });

  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (passwordInput === 'mahir123') {
      setIsAdminLoggedIn(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleBuyNow = (product) => {
    setCartItem(product);
    setCurrentView('checkout');
  };

  if (currentView === 'admin' && isAdminLoggedIn) {
    return <AdminDashboard goHome={() => setCurrentView('home')} products={products} setProducts={setProducts} />;
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
            <button type="submit" className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-lg transition-colors">
              আনলক করুন
            </button>
          </form>
          <button onClick={() => setCurrentView('home')} className="mt-4 text-sm text-gray-500 hover:text-gray-800 underline">
            স্টোরে ফিরে যান
          </button>
        </div>
      </div>
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
          <div className="hidden md:flex flex-1 max-w-xl relative">
            <input type="text" placeholder="প্রোডাক্ট খুঁজুন..." className="w-full rounded-full py-2 pl-4 pr-11 text-gray-900 bg-white outline-none" />
            <button className="absolute right-1.5 top-1.5 bg-red-600 hover:bg-red-700 text-white p-1.5 rounded-full">
              <Search className="h-4 w-4" />
            </button>
          </div>
          <div className="flex items-center gap-5 text-sm">
            <div onClick={() => setCurrentView('admin')} className="flex flex-col items-center cursor-pointer">
              <User className="h-5 w-5" />
              <span className="text-xs mt-0.5">অ্যাডমিন</span>
            </div>
            <div onClick={() => setCurrentView('checkout')} className="flex flex-col items-center cursor-pointer relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 bg-white text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cartItem ? 1 : 0}</span>
              <span className="text-xs mt-0.5">কার্ট</span>
            </div>
          </div>
        </div>
      </header>

      {currentView === 'checkout' ? (
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button onClick={() => setCurrentView('home')} className="flex items-center text-sm text-gray-600 mb-4 hover:text-red-600">
            <ArrowLeft className="h-4 w-4 mr-1" /> কেনাকাটা চালিয়ে যান
          </button>
          <h2 className="text-2xl font-bold mb-6">চেকআউট ও লোকাল পেমেন্ট</h2>
          {cartItem && (
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex items-center space-x-4">
              <img src={cartItem.image} alt={cartItem.title} className="h-20 w-20 object-cover rounded" />
              <div>
                <h3 className="font-bold text-gray-800">{cartItem.title}</h3>
                <p className="text-red-600 font-bold mt-1">৳ {cartItem.price}</p>
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
              <input type="text" placeholder="আপনার একাউন্ট নাম্বার (যেমনঃ 017xxxxxxxx)" className="w-full border p-2.5 rounded mb-3 outline-none focus:border-red-500" />
              <input type="text" placeholder="ট্রানজেকশন আইডি (TrxID) লিখুন" className="w-full border p-2.5 rounded outline-none focus:border-red-500" />
            </div>
          </div>
          <button onClick={() => alert('অর্ডার সফলভাবে দেওয়া হয়েছে! আমরা আপনার TrxID যাচাই করব।')} className="w-full bg-red-600 text-white font-bold py-4 rounded-xl hover:bg-red-700 text-lg">
            পাইকারি অর্ডার নিশ্চিত করুন
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
                  <button className="bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-lg">
                    প্রোডাক্ট দেখুন
                  </button>
                  <button className="border border-gray-300 hover:border-gray-400 text-gray-700 font-semibold px-6 py-3 rounded-lg">
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
            <h2 className="font-display text-xl font-bold text-gray-900 mb-4">ক্যাটাগরি ঘুরে দেখুন</h2>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {CATEGORIES.map((c) => (
                <button key={c.name} className="shrink-0 flex flex-col items-center gap-2 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-300 rounded-xl px-5 py-4 min-w-[110px] transition-colors">
                  <span className="text-2xl">{c.emoji}</span>
                  <span className="text-xs font-medium text-gray-700 text-center leading-tight">{c.name}</span>
                </button>
              ))}
            </div>
          </section>

          {/* How it works */}
          <section className="bg-red-700 text-white">
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
          <section className="max-w-6xl mx-auto px-4 py-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-display text-xl font-bold text-gray-900">জনপ্রিয় পণ্য</h2>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {products.map((p) => (
                <div key={p.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden flex flex-col">
                  <img src={p.image} alt={p.title} className="h-40 w-full object-cover" />
                  <div className="p-3 flex flex-col flex-1">
                    <h3 className="text-sm font-semibold text-gray-800 leading-snug">{p.title}</h3>
                    <div className="mt-auto pt-3 flex items-center justify-between">
                      <span className="font-display text-red-700 font-bold">৳ {p.price}</span>
                      <button onClick={() => handleBuyNow(p)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg">
                        কিনুন
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Footer */}
          <footer className="bg-red-700 text-red-100">
            <div className="max-w-6xl mx-auto px-4 py-8 flex flex-col md:flex-row justify-between gap-4 text-sm">
              <span className="font-display text-lg font-bold text-white">
                Druto<span className="font-medium text-red-100">Link</span>
              </span>
              <span>© ২০২৬ ড্রুটোলিংক। বিকাশ ও নগদে নিরাপদ পেমেন্ট।</span>
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
