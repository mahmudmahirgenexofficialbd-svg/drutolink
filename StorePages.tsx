import React, { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Loader2, Minus, Plus, ShoppingCart, Search, Package, Camera, Truck, ShieldCheck, Wallet, X } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Link } from '../Link';
import { navigate } from '../router';
import { SITE, categoryPath } from '../site';

type Cat = { name: string; emoji: string };
const toBn = (n: number | string) => Number(n).toLocaleString('en-BD');

/* ---------- product card (সবখানে একই) ---------- */

export function ProductCard({ p, onAddToCart }: { p: any; onAddToCart: (p: any, v?: any) => void }) {
  const hasVariants = (p.sizes && p.sizes.length > 0) || (p.colors && p.colors.length > 0);
  const href = `/product/${encodeURIComponent(p.id)}`;
  return (
    <div className="group bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col transition-all duration-300 hover:shadow-lg hover:shadow-gray-200/70 hover:-translate-y-1 hover:border-gray-300">
      <Link to={href} className="block overflow-hidden relative w-full bg-gray-50" aria-label={p.title}>
        <img src={p.image} alt={p.title} loading="lazy" className="h-40 md:h-48 w-full object-cover transition-transform duration-500 ease-out group-hover:scale-110" />
      </Link>
      <div className="p-3.5 flex flex-col flex-1">
        <Link to={href}><h3 className="text-sm font-semibold text-gray-800 leading-snug line-clamp-2 group-hover:text-red-700 transition-colors">{p.title}</h3></Link>
        {hasVariants && (
          <p className="text-[11px] text-gray-400 mt-1">
            {p.sizes?.length ? `${p.sizes.length} সাইজ` : ''}{p.sizes?.length && p.colors?.length ? ' · ' : ''}{p.colors?.length ? `${p.colors.length} কালার` : ''}
          </p>
        )}
        <div className="mt-auto pt-3 flex items-center justify-between gap-2">
          <span className="font-display text-red-700 font-bold">৳ {p.price}</span>
          {hasVariants ? (
            <Link to={href} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">অপশন বাছাই</Link>
          ) : (
            <button onClick={() => onAddToCart(p)} className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors">কার্টে যোগ করুন</button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- /products  এবং  /category/:slug ---------- */

export function ProductsPage({
  title, subtitle, activeCategory, categories, products, loading, hasMore, loadingMore, onLoadMore,
  searchQuery, setSearchQuery, onAddToCart, onImageSearch, imageSearching, visualActive, onClearVisual, queryImage,
}: {
  title: string; subtitle?: string; activeCategory: string | null; categories: Cat[]; products: any[];
  loading: boolean; hasMore: boolean; loadingMore: boolean; onLoadMore: () => void;
  searchQuery: string; setSearchQuery: (s: string) => void; onAddToCart: (p: any, v?: any) => void;
  onImageSearch: () => void; imageSearching: boolean; visualActive: boolean; onClearVisual: () => void; queryImage: string | null;
}) {
  const [sort, setSort] = useState<'new' | 'low' | 'high'>('new');
  const [filterOpen, setFilterOpen] = useState(false);

  const sorted = useMemo(() => {
    if (sort === 'new' || visualActive) return products; // ছবি-সার্চে মিলের ক্রমই রাখি
    const arr = products.slice();
    arr.sort((a, b) => (sort === 'low' ? Number(a.price) - Number(b.price) : Number(b.price) - Number(a.price)));
    return arr;
  }, [products, sort, visualActive]);

  const CategoryList = (
    <div className="space-y-1">
      <Link to="/products" onClick={() => setFilterOpen(false)}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${!activeCategory ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
        <span className="text-lg">🛍️</span> সব পণ্য
      </Link>
      {categories.map((c) => (
        <Link key={c.name} to={categoryPath(c.name)} onClick={() => setFilterOpen(false)}
          className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${activeCategory === c.name ? 'bg-red-50 text-red-700 font-semibold' : 'text-gray-700 hover:bg-gray-50'}`}>
          <span className="text-lg">{c.emoji}</span> {c.name}
        </Link>
      ))}
    </div>
  );

  return (
    <main>
      <section className="bg-slate-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-10">
          <nav aria-label="breadcrumb" className="text-xs text-gray-500 flex items-center gap-1.5 mb-3">
            <Link to="/" className="hover:text-red-600">হোম</Link><ChevronRight className="h-3 w-3" />
            {activeCategory ? (<><Link to="/products" className="hover:text-red-600">সব পণ্য</Link><ChevronRight className="h-3 w-3" /><span className="text-gray-800 font-medium">{activeCategory}</span></>)
              : <span className="text-gray-800 font-medium">সব পণ্য</span>}
          </nav>
          <h1 className="font-display text-3xl font-extrabold text-gray-900">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-2 max-w-2xl leading-7 text-sm md:text-base">{subtitle}</p>}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-8 grid lg:grid-cols-[230px_1fr] gap-8">
        {/* ডেস্কটপ সাইডবার */}
        <aside className="hidden lg:block">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">ক্যাটাগরি</p>
          {CategoryList}
        </aside>

        <section>
          {/* টুলবার */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="পণ্যের নাম লিখে খুঁজুন..."
                className="w-full rounded-xl border border-gray-300 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500" />
              <Search className="h-4 w-4 text-gray-400 absolute left-3.5 top-3.5" />
            </div>
            <button onClick={onImageSearch} disabled={imageSearching}
              className="flex items-center justify-center gap-1.5 text-sm font-semibold text-red-700 border border-red-200 bg-red-50 hover:bg-red-100 px-4 py-2.5 rounded-xl transition-colors disabled:opacity-60">
              {imageSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />} ছবি দিয়ে খুঁজুন
            </button>
            <select value={sort} onChange={(e) => setSort(e.target.value as any)} aria-label="সাজান"
              className="rounded-xl border border-gray-300 py-2.5 px-3 text-sm bg-white outline-none focus:border-red-500">
              <option value="new">নতুন প্রথমে</option>
              <option value="low">দাম: কম → বেশি</option>
              <option value="high">দাম: বেশি → কম</option>
            </select>
            <button onClick={() => setFilterOpen(true)} className="lg:hidden rounded-xl border border-gray-300 py-2.5 px-4 text-sm font-semibold text-gray-700">ক্যাটাগরি</button>
          </div>

          {visualActive && (
            <div className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl p-3 mb-5">
              {queryImage && <img src={queryImage} alt="সার্চ করা ছবি" className="h-14 w-14 object-cover rounded-lg border border-gray-200" />}
              <p className="flex-1 text-sm font-semibold text-gray-800">{imageSearching ? 'মিলিয়ে দেখা হচ্ছে...' : `ছবির সাথে মিলে এমন ${sorted.length} টি পণ্য`}</p>
              <button onClick={onClearVisual} className="text-gray-400 hover:text-red-600 p-1.5" title="ছবি সার্চ বাতিল"><X className="h-5 w-5" /></button>
            </div>
          )}

          {sorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-gray-300 p-10 text-center">
              <Package className="h-8 w-8 text-gray-300 mx-auto mb-3" />
              {loading ? <p className="text-sm text-gray-500">লোড হচ্ছে...</p> : (
                <>
                  <p className="text-sm text-gray-700 font-semibold">কোনো পণ্য পাওয়া যায়নি।</p>
                  <p className="text-sm text-gray-500 mt-1">ক্যাটালগে না থাকলেও আমরা চীন থেকে সোর্স করে দিতে পারি — <Link to="/contact" className="text-red-600 underline font-semibold">যোগাযোগ করুন</Link>।</p>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {sorted.map((p) => <ProductCard key={p.id} p={p} onAddToCart={onAddToCart} />)}
            </div>
          )}

          {!visualActive && !searchQuery.trim() && hasMore && sorted.length > 0 && (
            <div className="flex justify-center mt-8">
              <button onClick={onLoadMore} disabled={loadingMore}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg border border-red-300 text-red-600 font-semibold hover:bg-red-50 transition-colors disabled:opacity-60">
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />} আরও দেখুন
              </button>
            </div>
          )}
        </section>
      </div>

      {/* মোবাইল ক্যাটাগরি ড্রয়ার */}
      {filterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setFilterOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85%] bg-white p-4 overflow-y-auto">
            <div className="flex items-center justify-between mb-3">
              <p className="font-bold text-gray-900">ক্যাটাগরি</p>
              <button onClick={() => setFilterOpen(false)} aria-label="বন্ধ করুন"><X className="h-5 w-5" /></button>
            </div>
            {CategoryList}
          </div>
        </div>
      )}
    </main>
  );
}

/* ---------- /product/:id ---------- */

export function ProductPage({ productId, knownProducts, onAddToCart, getWeightKg, onApplyMeta, onCategoryHint }: {
  productId: string; knownProducts: any[]; onAddToCart: (p: any, v?: any) => void;
  getWeightKg: (p: any) => number; onApplyMeta: (title: string, desc?: string) => void;
  onCategoryHint?: (category: string) => void;
}) {
  const fromList = useMemo(() => knownProducts.find((p) => p.id === productId) || null, [knownProducts, productId]);
  const [fetched, setFetched] = useState<any>(null);
  const [state, setState] = useState<'loading' | 'ok' | 'missing'>(fromList ? 'ok' : 'loading');
  const product = fromList || fetched;

  // লিস্টে না থাকলে (যেমন সরাসরি লিংকে ঢুকলে) Firestore থেকে একটা ডকুমেন্ট আনি
  useEffect(() => {
    let cancelled = false;
    if (fromList) { setState('ok'); return; }
    setState('loading'); setFetched(null);
    getDoc(doc(db, 'products', productId))
      .then((snap) => {
        if (cancelled) return;
        if (snap.exists()) { setFetched({ id: snap.id, ...snap.data() }); setState('ok'); } else setState('missing');
      })
      .catch(() => { if (!cancelled) setState('missing'); });
    return () => { cancelled = true; };
  }, [productId, fromList]);

  // পণ্যের ক্যাটাগরি জানিয়ে দিই, যাতে "একই ক্যাটাগরির আরও পণ্য" দেখানোর ডেটা লোড হয়
  useEffect(() => { if (product?.category) onCategoryHint?.(product.category); }, [product?.category]); // eslint-disable-line react-hooks/exhaustive-deps

  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);
  useEffect(() => {
    setSize(product?.sizes?.[0] || ''); setColor(product?.colors?.[0]?.name || ''); setQty(1); setActiveImg(0);
  }, [product?.id]);

  const images: string[] = useMemo(
    () => (product ? Array.from(new Set([product.image, ...(Array.isArray(product.images) ? product.images : [])].filter(Boolean))) as string[] : []),
    [product]
  );

  // ট্যাব টাইটেল + সার্চ ইঞ্জিনের জন্য Product স্ট্রাকচার্ড ডেটা
  useEffect(() => {
    if (!product) return;
    onApplyMeta(`${product.title} — দাম ও অর্ডার | ${SITE.name}`,
      `${product.title} এখন ৳${product.price} টাকায়। চীন থেকে সোর্সিং ও বাংলাদেশে ডেলিভারি — ${SITE.name}।`);
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.text = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'Product', name: product.title, image: images,
      category: product.category,
      offers: { '@type': 'Offer', priceCurrency: 'BDT', price: String(product.price), url: window.location.href },
    });
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, [product?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const crumb = (
    <nav aria-label="breadcrumb" className="text-xs text-gray-500 flex flex-wrap items-center gap-1.5 mb-5">
      <Link to="/" className="hover:text-red-600">হোম</Link><ChevronRight className="h-3 w-3" />
      <Link to="/products" className="hover:text-red-600">সব পণ্য</Link>
      {product?.category && (<><ChevronRight className="h-3 w-3" /><Link to={categoryPath(product.category)} className="hover:text-red-600">{product.category}</Link></>)}
    </nav>
  );

  if (state === 'loading') {
    return <main className="max-w-6xl mx-auto px-4 py-16 text-center text-sm text-gray-500"><Loader2 className="h-6 w-6 animate-spin mx-auto mb-3 text-red-600" />পণ্য লোড হচ্ছে...</main>;
  }
  if (!product) {
    return (
      <main className="max-w-3xl mx-auto px-4 py-16 text-center">
        <Package className="h-10 w-10 text-gray-300 mx-auto mb-3" />
        <h1 className="font-display text-2xl font-extrabold text-gray-900">পণ্যটি পাওয়া যায়নি</h1>
        <p className="text-gray-600 mt-2">পণ্যটি সরিয়ে ফেলা হয়ে থাকতে পারে।</p>
        <Link to="/products" className="inline-block mt-6 bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl">সব পণ্য দেখুন</Link>
      </main>
    );
  }

  const hasSizes = product.sizes?.length > 0;
  const hasColors = product.colors?.length > 0;
  const weight = getWeightKg(product);
  const unitShip = Math.round(weight * SITE.shippingRatePerKg);
  const similar = knownProducts.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const addToCart = () => {
    for (let i = 0; i < qty; i += 1) onAddToCart(product, { selectedSize: hasSizes ? size : undefined, selectedColor: hasColors ? color : undefined });
  };

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      {crumb}
      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div>
          <div className="aspect-square bg-white rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center">
            <img src={images[activeImg] || images[0]} alt={product.title} className="w-full h-full object-contain" />
          </div>
          {images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 mt-3">
              {images.map((src, i) => (
                <button key={`${src}-${i}`} onClick={() => setActiveImg(i)} aria-label={`ছবি ${i + 1}`}
                  className={`h-16 w-16 shrink-0 rounded-xl overflow-hidden border-2 bg-white ${activeImg === i ? 'border-red-600 ring-2 ring-red-100' : 'border-gray-200'}`}>
                  <img src={src} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && <Link to={categoryPath(product.category)} className="text-xs font-bold uppercase tracking-wider text-red-600 hover:underline">{product.category}</Link>}
          <h1 className="font-display text-2xl md:text-3xl font-extrabold text-gray-900 leading-tight mt-1">{product.title}</h1>
          <p className="font-display text-3xl font-extrabold text-red-600 mt-4">৳ {product.price}</p>
          <p className="text-xs text-gray-500 mt-1">পণ্যের দাম। শিপিং চার্জ আলাদা (নিচে দেখুন)।</p>

          {hasColors && (
            <div className="mt-6">
              <p className="text-sm font-bold text-gray-800 mb-2">কালার: <span className="font-normal text-gray-500">{color}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.colors.map((c: any) => (
                  <button key={c.name} onClick={() => setColor(c.name)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium transition-all ${color === c.name ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-gray-50'}`}>
                    <span className="h-3 w-3 rounded-full border border-gray-300" style={{ backgroundColor: c.hex || '#ccc' }} />{c.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {hasSizes && (
            <div className="mt-5">
              <p className="text-sm font-bold text-gray-800 mb-2">সাইজ: <span className="font-normal text-gray-500">{size}</span></p>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((s: string) => (
                  <button key={s} onClick={() => setSize(s)}
                    className={`min-w-[3rem] px-3 py-1.5 rounded-lg border text-sm font-semibold transition-all ${size === s ? 'border-red-600 bg-red-50 text-red-700' : 'border-gray-200 text-gray-700 hover:border-gray-300 bg-gray-50'}`}>{s}</button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-6 flex items-center gap-3">
            <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden h-11">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))} aria-label="কমান" className="h-full px-3 text-gray-600 hover:bg-gray-100"><Minus className="h-4 w-4" /></button>
              <span className="w-10 text-center font-bold text-sm tabular-nums">{qty}</span>
              <button onClick={() => setQty((q) => q + 1)} aria-label="বাড়ান" className="h-full px-3 text-gray-600 hover:bg-gray-100"><Plus className="h-4 w-4" /></button>
            </div>
            <button onClick={addToCart} className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold h-11 rounded-lg flex items-center justify-center gap-2 transition-colors">
              <ShoppingCart className="h-4 w-4" /> কার্টে যোগ করুন
            </button>
          </div>
          <button onClick={() => { addToCart(); navigate('/checkout'); }}
            className="w-full mt-3 border-2 border-red-600 text-red-700 hover:bg-red-50 font-bold h-11 rounded-lg transition-colors">এখনই অর্ডার করুন</button>

          <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm space-y-2">
            <div className="flex justify-between"><span className="text-gray-500">পণ্যের দাম ({qty} পিস)</span><span className="font-bold text-gray-900">৳ {toBn(Number(product.price) * qty)}</span></div>
            <div className="flex justify-between"><span className="text-gray-500">আনুমানিক ওজন</span><span className="font-bold text-gray-900">{(weight * qty).toFixed(2)} কেজি</span></div>
            <div className="flex justify-between"><span className="text-gray-500">আনুমানিক শিপিং (৳{SITE.shippingRatePerKg}/কেজি)</span><span className="font-bold text-gray-900">৳ {toBn(unitShip * qty)}</span></div>
            <p className="text-[11px] text-red-700 bg-red-50 border border-red-100 rounded-lg p-2.5 leading-5">
              <strong>বিঃদ্রঃ</strong> ওজন ও শিপিং চার্জ আনুমানিক। পণ্য দেশে আসার পর আসল ওজন মেপে চূড়ান্ত শিপিং চার্জ ধরা হয়। <Link to="/shipping" className="underline font-semibold">বিস্তারিত</Link>
            </p>
          </div>

          <div className="mt-5 grid grid-cols-3 gap-2 text-center text-[11px] text-gray-600">
            <div className="rounded-xl bg-slate-50 border border-gray-100 p-3"><Truck className="h-4 w-4 mx-auto text-red-600 mb-1" />১৫–২০ দিনে ডেলিভারি</div>
            <div className="rounded-xl bg-slate-50 border border-gray-100 p-3"><Wallet className="h-4 w-4 mx-auto text-red-600 mb-1" />বিকাশ ও নগদ</div>
            <div className="rounded-xl bg-slate-50 border border-gray-100 p-3"><ShieldCheck className="h-4 w-4 mx-auto text-red-600 mb-1" /><Link to="/return-policy" className="hover:underline">ক্ষতিপূরণ পলিসি</Link></div>
          </div>
        </div>
      </div>

      {similar.length > 0 && (
        <section className="mt-14">
          <h2 className="font-display text-xl font-bold text-gray-900 mb-4">একই ক্যাটাগরির আরও পণ্য</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-5">
            {similar.map((p) => <ProductCard key={p.id} p={p} onAddToCart={onAddToCart} />)}
          </div>
        </section>
      )}
    </main>
  );
}
