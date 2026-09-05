import React, { useState } from 'react';
import { 
  Search, Camera, ShoppingCart, User, Menu, MapPin, Phone, CreditCard, 
  LayoutDashboard, ShoppingBag, Package, CheckCircle, Plus, Upload, ArrowLeft 
} from 'lucide-react';

// --- ADMIN DASHBOARD COMPONENT ---
function AdminDashboard({ goHome }) {
  const [activeTab, setActiveTab] = useState('orders');

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
            <span>Products</span>
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
            {activeTab === 'orders' ? 'Order Management' : 'Product Inventory'}
          </h2>
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 max-w-2xl">
              <h3 className="text-lg font-bold mb-4">Add New Product</h3>
              <div className="space-y-4">
                <input type="text" className="w-full border rounded-lg p-2.5 outline-none focus:border-violet-500" placeholder="Product Title" />
                <input type="number" className="w-full border rounded-lg p-2.5 outline-none focus:border-violet-500" placeholder="Price (BDT)" />
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:bg-gray-50">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Upload image from PC</p>
                </div>
                <button className="w-full bg-violet-600 text-white font-bold py-3 rounded-lg hover:bg-violet-700">Save Product</button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

// --- MAIN STOREFRONT COMPONENT ---
export default function App() {
  const [currentView, setCurrentView] = useState('home');
  const [paymentMethod, setPaymentMethod] = useState('bkash');

  // If view is admin, show only the admin dashboard
  if (currentView === 'admin') {
    return <AdminDashboard goHome={() => setCurrentView('home')} />;
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
        <div className="container mx-auto px-4 py-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Wholesale Products from China</h2>
          <p className="text-gray-500 mb-8">Click the "Admin" button in the top right to start adding products manually.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
             {/* Empty placeholders ready for backend data */}
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 h-64 flex items-center justify-center text-gray-300">
                <Camera className="h-10 w-10" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
