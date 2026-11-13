// api/sitemap.js — /sitemap.xml (vercel.json-এর rewrite দিয়ে)
// স্ট্যাটিক পেজ + ক্যাটাগরি + Firestore-এর প্রতিটি প্রোডাক্ট। নতুন প্রোডাক্ট যোগ হলে নিজে থেকেই ঢোকে।

import { listProductStubs, SITE_URL } from './_lib/firestore.js';

const STATIC_PAGES = [
  ['/', '1.0'], ['/products', '0.8'], ['/how-it-works', '0.5'], ['/shipping', '0.5'], ['/about', '0.5'],
  ['/faq', '0.5'], ['/contact', '0.5'], ['/return-policy', '0.5'], ['/privacy-policy', '0.5'], ['/terms', '0.5'],
];
// site.ts-এর CATEGORY_SLUGS-এর সাথে মিল রাখুন
const CATEGORY_SLUGS = ['electronics', 'fashion', 'shoes', 'bags-luggage', 'home-kitchen', 'toys-gifts', 'beauty', 'mobile-accessories'];

const xmlEsc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const day = (iso) => (iso ? String(iso).slice(0, 10) : new Date().toISOString().slice(0, 10));

export default async function handler(req, res) {
  const today = day();
  const rows = [
    ...STATIC_PAGES.map(([p, pr]) => ({ loc: SITE_URL + (p === '/' ? '/' : p), lastmod: today, pr })),
    ...CATEGORY_SLUGS.map((s) => ({ loc: `${SITE_URL}/category/${s}`, lastmod: today, pr: '0.8' })),
  ];
  try {
    const stubs = await listProductStubs();
    for (const s of stubs) rows.push({ loc: `${SITE_URL}/product/${encodeURIComponent(s.id)}`, lastmod: day(s.updateTime), pr: '0.7' });
  } catch (e) {
    // Firestore ব্যর্থ হলে অন্তত স্ট্যাটিক অংশটা দিই, কিন্তু ক্যাশ করি না
    res.setHeader('Cache-Control', 'no-store');
  }
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    rows.map((r) => `  <url><loc>${xmlEsc(r.loc)}</loc><lastmod>${r.lastmod}</lastmod><priority>${r.pr}</priority></url>`).join('\n') + `\n</urlset>\n`;
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  if (!res.getHeader('Cache-Control')) res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400');
  res.status(200).send(xml);
}
