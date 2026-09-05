import React, { useState, useEffect } from 'react';
import { 
  Search, Camera, ShoppingCart, User, Menu, MapPin, Phone, CreditCard, 
  LayoutDashboard, ShoppingBag, Package, CheckCircle, Plus, Upload, ArrowLeft, Lock, Key, Trash2 
} from 'lucide-react';

// --- SECURE ADMIN DASHBOARD ---
function AdminDashboard({ goHome, products, setProducts }) {
  const [activeTab, setActiveTab] = useState('orders');
  
  // New product form state
  const [title, setTitle] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  // Handle image file upload to base64 so it previews and saves locally
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddProduct = (e) => {
    e.preventDefault();
    if (!title || !price) {
      alert('Please fill in the product title and price.');
      return;
    }

    const newProduct = {
      id: Date.now(),
      title,
      price,
      image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60' // fallback placeholder
    };

    const updatedProducts = [newProduct, ...products];
    setProducts(updatedProducts);
    localStorage.setItem('drutolink_products', JSON.stringify(updatedProducts));

    // Reset form
    setTitle('');
    setPrice('');
    setImage('');
    alert('Product successfully added and published to the store!');
    setActiveTab('orders');
  };

  const handleDeleteProduct = (id) => {
    const updatedProducts = products.filter(p => p.id !== id);
    setProducts(updatedProducts);
    localStorage.setItem('drutolink_products', JSON.stringify(updatedProducts));
  };

  return (
    <div className="flex h-screen bg-gray-50 font-sans w-full">
      {/* Sidebar */}
      <div className="w-64 bg-[#121212] text-white flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-violet-500 tracking-tight">
            Druto<span className="text-[#E0E0E0]">Admin</span>
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-[#1A1A1A]'}`}>
            <ShoppingBag className="h-5 w-5" />
            <span>Orders & TrxID</span>
          </button>
          <button onClick={() => setActiveTab('products')} className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'products' ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-[#1A1A1A]'}`}>
            <Package className="h-5 w-5" />
            <span>Products ({products.length})</span>
          </button>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button onClick={goHome} className="w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Store</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 border-b-2 border-violet-500 pb-1">
            {activeTab === 'orders' ? 'Order Management' : 'Product Inventory Management'}
          </h2>
          <span className="text-xs bg-green-100 text-green-700 font-bold px-3 py-1 rounded-full">Securely Logged In</span>
        </header>

        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'orders' && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-lg font-bold mb-4">Recent Orders (Manual Verification)</h3>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-600 text-sm border-y border-gray-200">
                    <th className="p-4 font-medium">Order ID</th>
                    <th className="p-4 font-medium">Payment (TrxID)</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Action</th>
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
              {/* Add Product Form */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
                <h3 className="text-lg font-bold mb-4">Add New Wholesale Product</h3>
                <form onSubmit={handleAddProduct} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Title</label>
                    <input 
                      type="text" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-violet-500" 
                      placeholder="e.g., Putian Sports Shoes" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (BDT)</label>
                    <input 
                      type="number" 
                      value={price} 
                      onChange={(e) => setPrice(e.target.value)} 
                      className="w-full border rounded-lg p-2.5 outline-none focus:border-violet-500" 
                      placeholder="2500" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="w-full border border-gray-300 rounded-lg p-2 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100" 
                    />
                    {image && (
                      <div className="mt-2">
                        <p className="text-xs text-green-600 mb-1">Image loaded successfully:</p>
                        <img src={image} alt="Preview" className="h-20 w-20 object-cover rounded border" />
                      </div>
                    )}
                  </div>
                  <button type="submit" className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg hover:bg-violet-700 transition-colors">
                    Save & Publish Product
                  </button>
                </form>
              </div>

              {/* Existing Products List in Admin */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-bold mb-4">Active Catalog ({products.length} Items)</h3>
                {products.length === 0 ? (
                  <p className="text-gray-500 text-sm">No products added yet. Use the form above to add your first product!</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {products.map(p => (
                      <div key={p.id} className="border rounded-lg p-4 flex items-center justify-between bg-gray-50">
                        <div className="flex items-center space-x-3">
                          <img src={p.image} alt={p.title} className="h-12 w-12 object-cover rounded" />
                          <div>
                            <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{p.title}</h4>
                            <p className="text-xs text-violet-600 font-semibold">৳ {p.price}</p>
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
  
  // Persistent Products State loaded from LocalStorage
  const [products, setProducts] = useState(() => {
    const saved = localStorage.getItem('drutolink_products');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { return []; }
    }
    return [
      { id: 1, title: 'Putian Shox Sports Shoes', price: '2760', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=500&auto=format&fit=crop&q=60' },
      { id: 2, title: 'Multi-Compartment Casual Crossbody Bag', price: '4148', image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=500&auto=format&fit=crop&q=60' }
    ];
  });
  
  // Admin Login States
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

  if (currentView === 'admin' && isAdminLoggedIn) {
    return <AdminDashboard goHome={() => setCurrentView('home')} products={products} setProducts={setProducts} />;
  }

  if (currentView === 'admin' && !isAdminLoggedIn) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center font-sans px-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
          <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="h-6 w-6" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Admin Portal Restricted</h2>
          <p className="text-sm text-gray-500 mb-6">Enter your secret master password to access DrutoLink management.</p>
          
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div className="relative">
              <Key className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
              <input 
                type="password" 
                placeholder="Enter Admin Password" 
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg py-3 pl-10 pr-4 outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" 
              />
            </div>
            {loginError && <p className="text-red-500 text-xs text-left">Incorrect password. Access denied.</p>}
            
            <button type="submit" className="w-full bg-violet-600 hover:bg-violet-700 text-white font-bold py-3 rounded-lg transition-colors">
              Unlock Dashboard
            </button>
          </form>

          <button onClick={() => setCurrentView('home')} className="mt-4 text-sm text-gray-500 hover:text-gray-800 underline">
            Return to Storefront
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 font-sans">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 cursor-pointer" onClick={() => setCurrentView('home')}>
            <Menu className="h-6 w-6 text-violet-600 lg:hidden" />
            <h1 className="text-3xl font-bold text-violet-600 tracking-tight">Druto<span className="text-gray-800">Link</span></h1>
          </div>
          
          <div className="hidden lg:flex flex-1 max-w-2xl mx-8 relative">
            <input type="text" placeholder="Search products..." className="w-full border border-gray-300 rounded-full py-2.5 pl-5 pr-24 focus:outline-none focus:border-violet-500" />
            <div className="absolute right-2 top-1.5 flex items-center space-x-2">
              <button className="p-1.5 hover:bg-gray-100 rounded-full text-gray-500"><Camera className="h-5 w-5" /></button>
              <button className="bg-violet-600 hover:bg-violet-700 text-white p-1.5 rounded-full"><Search className="h-5 w-5" /></button>
            </div>
          </div>

          <div className="flex items-center space-x-6">
            <div onClick={() => setCurrentView('admin')} className="flex flex-col items-center cursor-pointer text-gray-500 hover:text-violet-600">
              <User className="h-5 w-5" />
              <span className="text-xs mt-1 font-medium">Admin</span>
            </div>
            <div onClick={() => setCurrentView('checkout')} className="flex flex-col items-center cursor-pointer text-gray-500 hover:text-violet-600 relative">
              <ShoppingCart className="h-5 w-5" />
              <span className="absolute -top-2 -right-2 bg-violet-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">3</span>
              <span className="text-xs mt-1 font-medium">Cart</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      {currentView === 'checkout' ? (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <h2 className="text-2xl font-bold mb-6">Checkout</h2>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 mb-6">
            <h3 className="text-lg font-bold mb-4 flex items-center"><CreditCard className="h-5 w-5 mr-2 text-violet-600" /> Payment Method</h3>
            <div className="flex space-x-4 mb-6">
              <button onClick={() => setPaymentMethod('bkash')} className={`flex-1 py-3 border rounded-lg font-bold ${paymentMethod === 'bkash' ? 'border-pink-500 bg-pink-50 text-pink-600' : 'border-gray-200'}`}>bKash</button>
              <button onClick={() => setPaymentMethod('nagad')} className={`flex-1 py-3 border rounded-lg font-bold ${paymentMethod === 'nagad' ? 'border-orange-500 bg-orange-50 text-orange-600' : 'border-gray-200'}`}>Nagad</button>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Please Send Money to our official number:</p>
              <p className="text-xl font-bold text-gray-900 mb-4">+880 1620 177883</p>
              <input type="text" placeholder="Enter your Account Number" className="w-full border p-2.5 rounded mb-3 outline-none focus:border-violet-500" />
              <input type="text" placeholder="Enter TrxID (Transaction ID)" className="w-full border p-2.5 rounded outline-none focus:border-violet-500" />
            </div>
          </div>
          <button className="w-full bg-violet-600 text-white font-bold py-4 rounded-xl hover:bg-violet-700 text-lg">Confirm Wholesale Order</button>
        </div>
      ) : (
        <div className="container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Wholesale Products from China</h2>
            <p className="text-gray-500">Click the "Admin" button on top to securely log in and upload products.</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                <img src={p.image} alt={p.title} className="h-48 w-full object-cover" />
                <div className="p-4 flex flex-col flex-1 justify-between">
                  <h3 className="font-semibold text-gray-800 text-sm mb-2">{p.title}</h3>
                  <div className="flex items-center justify-between mt-auto">
                    <span className="text-violet-600 font-bold text-base">৳ {p.price}</span>
                    <button className="bg-violet-600 hover:bg-violet-700 text-white text-xs px-3 py-2 rounded-lg font-medium transition-colors">
                      Buy Now
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
