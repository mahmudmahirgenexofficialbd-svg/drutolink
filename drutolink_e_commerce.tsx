// ... existing code ...
import React, { useState } from 'react';
import { 
  Search, 
  Camera, 
  ShoppingCart, 
  Package, 
  MessageCircle, 
  Menu, 
  ChevronRight,
  ShoppingBag,
  Gem,
  Sparkles,
  Shirt,
  Baby,
  Smartphone,
  Watch,
  Briefcase,
  MapPin,
  CreditCard,
  ShieldCheck,
  ArrowLeft
} from 'lucide-react';

const CheckoutView = ({ onBack }) => {
  const [paymentMethod, setPaymentMethod] = useState('bkash');

  return (
    <div className="max-w-[1400px] mx-auto px-4 py-8 animate-in fade-in duration-300">
      
      {/* Back Button & Title */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-full text-gray-600 transition-colors"
        >
          <ArrowLeft size={20} />
        </button>
        <h2 className="text-2xl font-extrabold text-gray-800">Secure Checkout</h2>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Left Column: Forms */}
        <div className="flex-1 space-y-6">
          
          {/* Shipping Address Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-5">
              <MapPin className="text-violet-600" size={20} />
              Shipping Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Full Name</label>
                <input type="text" placeholder="e.g. Rahim Uddin" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Phone Number (Active WhatsApp)</label>
                <input type="tel" placeholder="+880 17XXXXXXXX" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all" />
              </div>
              
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">Division</label>
                <select className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all bg-white">
                  <option>Select Division</option>
                  <option>Dhaka</option>
                  <option>Chattogram</option>
                  <option>Sylhet</option>
                  <option>Khulna</option>
                  <option>Rajshahi</option>
                  <option>Barishal</option>
                  <option>Rangpur</option>
                  <option>Mymensingh</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-gray-600">City / District</label>
                <input type="text" placeholder="e.g. Mirpur, Dhaka" className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all" />
              </div>

              <div className="md:col-span-2 space-y-1">
                <label className="text-xs font-medium text-gray-600">Full Delivery Address</label>
                <textarea rows="2" placeholder="House/Flat No, Street Name, Area..." className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 outline-none transition-all resize-none"></textarea>
              </div>
            </div>
          </div>

          {/* Payment Method Section */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-5">
              <CreditCard className="text-violet-600" size={20} />
              Payment Method
            </h3>

            {/* Payment Tabs */}
            <div className="grid grid-cols-3 gap-2 md:gap-4 mb-6">
              <button 
                onClick={() => setPaymentMethod('bkash')}
                className={`py-3 px-2 rounded-lg border-2 font-bold text-sm transition-all ${paymentMethod === 'bkash' ? 'border-pink-600 text-pink-600 bg-pink-50' : 'border-gray-200 text-gray-500 hover:border-pink-200'}`}
              >
                bKash
              </button>
              <button 
                onClick={() => setPaymentMethod('nagad')}
                className={`py-3 px-2 rounded-lg border-2 font-bold text-sm transition-all ${paymentMethod === 'nagad' ? 'border-orange-500 text-orange-600 bg-orange-50' : 'border-gray-200 text-gray-500 hover:border-orange-200'}`}
              >
                Nagad
              </button>
              <button 
                onClick={() => setPaymentMethod('bank')}
                className={`py-3 px-2 rounded-lg border-2 font-bold text-sm transition-all ${paymentMethod === 'bank' ? 'border-violet-600 text-violet-700 bg-violet-50' : 'border-gray-200 text-gray-500 hover:border-violet-200'}`}
              >
                Bank Transfer
              </button>
            </div>

            {/* Dynamic Payment Content */}
            <div className="bg-gray-50 rounded-lg p-5 border border-gray-100">
              
              {(paymentMethod === 'bkash' || paymentMethod === 'nagad') && (
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${paymentMethod === 'bkash' ? 'bg-pink-600' : 'bg-orange-500'}`}>
                      1
                    </div>
                    <div>
                      <p className="text-sm text-gray-800 font-medium">Go to your {paymentMethod === 'bkash' ? 'bKash' : 'Nagad'} App and select <strong>Send Money</strong>.</p>
                      <p className="text-sm text-gray-600 mt-1">Send the total amount to this Personal Number:</p>
                      <div className="mt-2 bg-white border border-gray-200 rounded px-3 py-2 font-mono text-lg font-bold tracking-wider inline-block">
                        +880 1620 177883
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white shrink-0 ${paymentMethod === 'bkash' ? 'bg-pink-600' : 'bg-orange-500'}`}>
                      2
                    </div>
                    <div className="w-full">
                      <p className="text-sm text-gray-800 font-medium">Enter the Transaction ID (TrxID) below to verify your payment.</p>
                      <div className="mt-3 space-y-3 max-w-sm">
                        <input 
                          type="text" 
                          placeholder="Sender Account Number" 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500" 
                        />
                        <input 
                          type="text" 
                          placeholder="Enter TrxID (e.g. 9J6A7B8C)" 
                          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500 uppercase" 
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'bank' && (
                <div className="space-y-4 text-sm text-gray-700">
                  <p>Please transfer the total amount to the following bank account. Your order will not ship until the funds have cleared in our account.</p>
                  <div className="bg-white p-4 border border-gray-200 rounded-md space-y-2">
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Bank Name:</span> <span className="font-bold">City Bank Ltd.</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Account Name:</span> <span className="font-bold">DrutoLink Traders</span></div>
                    <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Account Number:</span> <span className="font-bold font-mono">1100 2233 4455</span></div>
                    <div className="flex justify-between"><span className="text-gray-500">Branch:</span> <span className="font-bold">Gulshan Avenue</span></div>
                  </div>
                  <input 
                    type="text" 
                    placeholder="Enter Payment Reference / Deposit Slip Number" 
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm outline-none focus:border-violet-500 mt-2" 
                  />
                </div>
              )}

            </div>
          </div>
        </div>

        {/* Right Column: Order Summary */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm sticky top-24">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-3">Order Summary</h3>
            
            {/* Mock Items */}
            <div className="space-y-4 mb-4 border-b pb-4">
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center shrink-0">
                  <Package size={24} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-800 truncate">Premium Item Model 2024</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Variant: Black / XL</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">Qty: 50</span>
                    <span className="text-sm font-bold text-gray-800">৳ 25,000</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center shrink-0">
                  <Package size={24} className="text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium text-gray-800 truncate">Wholesale Smart Gadgets</h4>
                  <p className="text-xs text-gray-500 mt-0.5">Variant: Standard</p>
                  <div className="flex justify-between items-center mt-1">
                    <span className="text-xs text-gray-600">Qty: 20</span>
                    <span className="text-sm font-bold text-gray-800">৳ 12,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Calculations */}
            <div className="space-y-2 text-sm mb-4 border-b pb-4">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal (70 Items)</span>
                <span>৳ 37,000</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Intl. Shipping (China to BD)</span>
                <span>৳ 1,500</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Local Courier</span>
                <span>৳ 120</span>
              </div>
            </div>

            <div className="flex justify-between items-center mb-6">
              <span className="text-base font-bold text-gray-800">Total</span>
              <span className="text-2xl font-extrabold text-violet-600">৳ 38,620</span>
            </div>

            <button className="w-full bg-violet-600 hover:bg-violet-700 text-white py-3.5 rounded-lg font-bold text-sm transition-colors shadow-lg shadow-violet-200 flex justify-center items-center gap-2">
              <ShieldCheck size={18} />
              Confirm & Place Order
            </button>
            <p className="text-center text-[11px] text-gray-400 mt-3">By placing your order, you agree to DrutoLink's B2B terms and conditions.</p>
          </div>
        </div>

      </div>
    </div>
  );
};
// ... existing code ...
const PRODUCTS = Array.from({ length: 15 }).map((_, index) => ({
  id: index + 1,
  title: `Wholesale High Quality New Design Premium Item Model ${2024 + index} - Fast Shipping BD`,
  price: Math.floor(Math.random() * 3000) + 500,
  sold: (Math.random() * 5 + 0.1).toFixed(1),
  imgHue: Math.floor(Math.random() * 360),
}));

export default function App() {
  const [searchQuery, setSearchQuery] = useState('');
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState('home'); // State to handle navigation

  return (
    <div className="min-h-screen bg-[#f4f6f8] font-sans text-gray-800">
      
      {/* Topmost thin utility bar (Typical for wholesale sites) */}
      <div className="bg-gray-100 border-b border-gray-200 text-xs text-gray-500 py-1.5 hidden md:block">
         <div className="max-w-[1400px] mx-auto px-4 flex justify-between">
            <span>Welcome to DrutoLink - Bangladesh's #1 B2B Sourcing Hub</span>
            <div className="flex gap-4">
              <span className="cursor-pointer hover:text-violet-600">Help Center</span>
              <span className="cursor-pointer hover:text-violet-600">Track Order</span>
            </div>
         </div>
      </div>

      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-[1400px] mx-auto px-4 py-5 flex items-center justify-between gap-4 lg:gap-8">
          
          {/* Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Menu className="h-6 w-6 text-gray-700 lg:hidden cursor-pointer" />
            <h1 
              onClick={() => setCurrentView('home')}
              className="text-3xl font-extrabold text-violet-600 tracking-tight cursor-pointer"
            >
              Druto<span className="text-gray-800">Link</span>
            </h1>
          </div>

          {/* Massive Search Bar (Center) */}
          <div className="hidden lg:flex flex-1 max-w-3xl relative group">
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products by name, category, or URL..." 
              className="w-full border-2 border-violet-600 rounded-lg py-2.5 pl-4 pr-24 focus:outline-none focus:ring-2 focus:ring-violet-200 text-gray-800 transition-all"
            />
            <div className="absolute right-1 top-1 bottom-1 flex items-center space-x-1">
              <button 
                onClick={() => setIsImageModalOpen(true)}
                className="p-1.5 hover:bg-gray-100 rounded-md transition-colors border-r border-gray-300 pr-2"
                title="Image Search"
              >
                <Camera className="h-5 w-5 text-gray-500 hover:text-violet-600" />
              </button>
              <button className="bg-violet-600 hover:bg-violet-700 text-white px-4 h-full rounded-md font-medium transition-colors">
                Search
              </button>
            </div>
          </div>

          {/* User & Cart Actions */}
          <div className="flex items-center gap-6 shrink-0">
            <div className="flex flex-col items-center cursor-pointer text-gray-600 hover:text-violet-600 group">
              <MessageCircle size={22} className="group-hover:-translate-y-1 transition-transform" />
              <span className="text-[11px] mt-1 font-medium">Chat</span>
            </div>
            <div className="flex flex-col items-center cursor-pointer text-gray-600 hover:text-violet-600 group">
              <Package size={22} className="group-hover:-translate-y-1 transition-transform" />
              <span className="text-[11px] mt-1 font-medium">Orders</span>
            </div>
            <div 
              onClick={() => setCurrentView('checkout')}
              className="flex flex-col items-center cursor-pointer text-gray-600 hover:text-violet-600 group relative"
            >
              <ShoppingCart size={22} className="group-hover:-translate-y-1 transition-transform" />
              <span className="absolute -top-1.5 -right-2 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-white">
                2
              </span>
              <span className="text-[11px] mt-1 font-medium">Cart</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {currentView === 'home' ? (
        <main className="max-w-[1400px] mx-auto px-4 py-6 flex gap-6">
          
          {/* Left Column: Sidebar Categories */}
          <aside className="w-[260px] shrink-0 hidden lg:block">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <div className="bg-violet-600 text-white p-4 font-bold flex items-center gap-2">
                <Menu size={20} />
                Categories
              </div>
              <ul className="py-2">
                {['Bags', 'Shoes', 'Jewelry', 'Beauty Products', 'Mens Clothing', 'Womens Clothing', 'Baby Items', 'Sunglass', 'Phone Accessories', 'Watches'].map((cat) => (
                  <li key={cat} className="px-5 py-2.5 hover:bg-violet-50 text-sm text-gray-700 hover:text-violet-700 cursor-pointer flex justify-between items-center group">
                    {cat}
                    <ChevronRight size={16} className="text-gray-400 group-hover:text-violet-500" />
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Right Column: Hero & Products */}
          <div className="flex-1 min-w-0">
            {/* Hero Banner */}
            <div className="bg-gradient-to-r from-violet-600 to-indigo-800 rounded-xl mb-8 p-8 text-white shadow-lg flex items-center justify-between overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
              <div className="relative z-10 max-w-lg">
                <h2 className="text-3xl font-extrabold mb-3 leading-tight">Direct Wholesale from China to Bangladesh</h2>
                <p className="text-violet-100 mb-6 font-medium">Sourced instantly. Shipped rapidly. Tracked locally.</p>
                <button className="bg-white text-violet-700 px-6 py-2.5 rounded-full font-bold hover:bg-gray-50 transition-colors shadow-md">
                  Start Sourcing
                </button>
              </div>
              <div className="hidden md:flex relative z-10 items-center justify-center p-4">
                <Sparkles className="w-24 h-24 text-violet-200 opacity-50 absolute" />
                <Package className="w-32 h-32 text-white" />
              </div>
            </div>

            {/* Product Grid */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800">You May Like</h3>
              <span className="text-sm font-semibold text-violet-600 cursor-pointer hover:underline">View All</span>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {PRODUCTS.map(product => (
                <div key={product.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow group">
                  {/* Product Image Placeholder */}
                  <div 
                    className="w-full aspect-square bg-gray-100 relative overflow-hidden"
                    style={{ filter: `hue-rotate(${product.imgHue}deg)` }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-gray-300">
                      <ShoppingBag size={48} />
                    </div>
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <button className="bg-white text-gray-900 px-4 py-2 rounded-full font-bold text-sm flex items-center gap-2 transform translate-y-4 group-hover:translate-y-0 transition-transform">
                        <ShoppingCart size={16} /> Quick Add
                      </button>
                    </div>
                  </div>
                  {/* Product Info */}
                  <div className="p-3">
                    <h4 className="text-sm font-medium text-gray-700 line-clamp-2 mb-2 leading-snug group-hover:text-violet-600 transition-colors">
                      {product.title}
                    </h4>
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-extrabold text-violet-600">
                        ৳ {product.price.toLocaleString()}
                      </span>
                      <span className="text-[11px] text-gray-400 font-medium pb-0.5">
                        {product.sold}k+ SOLD
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </main>
      ) : (
        <CheckoutView onBack={() => setCurrentView('home')} />
      )}

      {/* Image Search Modal */}
      {isImageModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl relative">
            <button 
              onClick={() => setIsImageModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full p-1"
            >
              <ChevronRight className="rotate-180" size={20} />
            </button>
            <h3 className="text-xl font-extrabold text-gray-800 mb-2">Image Search</h3>
            <p className="text-sm text-gray-500 mb-6">Upload an image to automatically find matching wholesale products.</p>
            <div className="border-2 border-dashed border-violet-300 bg-violet-50 rounded-xl p-10 hover:border-violet-500 hover:bg-violet-100 cursor-pointer transition-all group">
              <Camera className="h-12 w-12 mx-auto text-violet-400 group-hover:text-violet-600 mb-3 transition-colors" />
              <span className="text-violet-600 font-medium text-sm">Drag & drop or click to upload</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}