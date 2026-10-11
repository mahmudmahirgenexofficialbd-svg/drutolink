// src/router.ts
// ছোট্ট নিজস্ব রাউটার — নতুন কোনো প্যাকেজ (react-router) লাগে না।
// URL পাথ ↔ App-এর currentView ম্যাপিং এখানে। Netlify/Vercel-এ SPA fallback আগে থেকেই আছে।

export type Route = { view: string; param?: string };

const STATIC: Record<string, string> = {
  '': 'home',
  '/products': 'products',
  '/about': 'about',
  '/contact': 'contact',
  '/faq': 'faq',
  '/how-it-works': 'how',
  '/shipping': 'shipping',
  '/return-policy': 'returns',
  '/privacy-policy': 'privacy',
  '/terms': 'terms',
  '/track-order': 'track',
  '/login': 'login',
  '/signup': 'signup',
  '/account': 'account',
  '/checkout': 'checkout',
  '/admin': 'admin',
  '/worker': 'worker',
};

const VIEW_TO_PATH: Record<string, string> = Object.fromEntries(
  Object.entries(STATIC).map(([p, v]) => [v, p || '/'])
);

export function parsePath(pathname: string): Route {
  const p = pathname.replace(/\/+$/, '');
  if (p in STATIC) return { view: STATIC[p] };
  const cat = p.match(/^\/category\/([^/]+)$/);
  if (cat) return { view: 'category', param: decodeURIComponent(cat[1]) };
  const prod = p.match(/^\/product\/([^/]+)$/);
  if (prod) return { view: 'product', param: decodeURIComponent(prod[1]) };
  return { view: 'notfound' };
}

export function buildPath(view: string, param?: string): string {
  if (view === 'category' && param) return `/category/${encodeURIComponent(param)}`;
  if (view === 'product' && param) return `/product/${encodeURIComponent(param)}`;
  return VIEW_TO_PATH[view] || '/';
}

// পেজ বদলালে উপরে স্ক্রল করা + ট্যাব টাইটেল/ডেসক্রিপশন আপডেট
export function applyMeta(title: string, description?: string) {
  if (typeof document === 'undefined') return;
  document.title = title;
  if (description) {
    let m = document.querySelector('meta[name="description"]') as HTMLMetaElement | null;
    if (!m) { m = document.createElement('meta'); m.name = 'description'; document.head.appendChild(m); }
    m.content = description;
  }
  let c = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!c) { c = document.createElement('link'); c.rel = 'canonical'; document.head.appendChild(c); }
  c.href = window.location.origin + window.location.pathname;
}

// যেকোনো জায়গা থেকে পেজ বদলাতে: navigate('/about')
// pushState করে popstate ইভেন্ট ছোড়ে — App সেটা শুনে currentView আপডেট করে।
export function navigate(path: string) {
  if (typeof window === 'undefined') return;
  if (window.location.pathname + window.location.search !== path) {
    window.history.pushState(null, '', path);
  }
  window.dispatchEvent(new PopStateEvent('popstate'));
  window.scrollTo({ top: 0, behavior: 'auto' });
}
