// api/product-page.js
// /product/:id → একই SPA index.html, কিন্তু <head>-এ ওই প্রোডাক্টের title, description,
// Open Graph (Facebook/WhatsApp শেয়ার প্রিভিউ), canonical ও Product JSON-LD বসানো।
// ক্লায়েন্ট-সাইড React আগের মতোই চলে — শুধু ক্রলার/শেয়ার-বট প্রথম রেসপন্সেই সব তথ্য পায়।

import { fetchProduct, SITE_URL } from './_lib/firestore.js';

const SITE_NAME = 'DrutoLink';
const FALLBACK_IMAGE = `${SITE_URL}/promo-popup.jpg`;

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// JSON-LD <script>-এর ভেতরে </script> ঢুকে যেন না ভাঙে
const jsonForScript = (o) => JSON.stringify(o).replace(/</g, '\\u003c').replace(/\u2028|\u2029/g, '');

let templateCache = { html: '', at: 0 };
async function getTemplate(host) {
  if (templateCache.html && Date.now() - templateCache.at < 5 * 60 * 1000) return templateCache.html;
  const r = await fetch(`https://${host}/index.html`);
  if (!r.ok) throw new Error(`index.html ${r.status}`);
  templateCache = { html: await r.text(), at: Date.now() };
  return templateCache.html;
}

// data: URL (base64) ছবি og:image-এ চলে না, তাই শুধু http(s)/relative URL নিই
function usableImage(src) {
  if (!src || typeof src !== 'string' || src.startsWith('data:')) return null;
  if (/^https?:\/\//i.test(src)) return src;
  if (src.startsWith('/')) return SITE_URL + src;
  return null;
}

export function injectHead(html, p, id) {
  const title = `${p.title} — দাম ও অর্ডার | ${SITE_NAME}`;
  const desc = `${p.title} এখন ৳${p.price} টাকায়। চীন থেকে সোর্সিং ও বাংলাদেশে ডেলিভারি — ${SITE_NAME}।`;
  const url = `${SITE_URL}/product/${encodeURIComponent(id)}`;
  const gallery = [p.image, ...(Array.isArray(p.images) ? p.images : [])].map(usableImage).filter(Boolean);
  const images = [...new Set(gallery)];
  const ogImage = images[0] || FALLBACK_IMAGE;

  const ld = {
    '@context': 'https://schema.org', '@type': 'Product', name: p.title,
    image: images.length ? images : [FALLBACK_IMAGE],
    description: desc,
    ...(p.category ? { category: p.category } : {}),
    offers: { '@type': 'Offer', priceCurrency: 'BDT', price: String(p.price), url },
  };

  const head = [
    `<meta name="description" content="${esc(desc)}" />`,
    `<link rel="canonical" href="${esc(url)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="product" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(desc)}" />`,
    `<meta property="og:url" content="${esc(url)}" />`,
    `<meta property="og:image" content="${esc(ogImage)}" />`,
    `<meta property="product:price:amount" content="${esc(p.price)}" />`,
    `<meta property="product:price:currency" content="BDT" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<script type="application/ld+json" data-ssr="product">${jsonForScript(ld)}</script>`,
  ].join('\n    ');

  // টেমপ্লেটের পুরনো ডিফল্ট ট্যাগ সরিয়ে প্রোডাক্টের ট্যাগ বসাই (ডুপ্লিকেট এড়াতে)
  let out = html
    .replace(/<title>[\s\S]*?<\/title>/i, () => `<title>${esc(title)}</title>`)
    .replace(/<meta\s+name="description"[^>]*>\s*/i, '')
    .replace(/<meta\s+property="og:[a-z_:]+"[^>]*>\s*/gi, '')
    .replace(/<link\s+rel="canonical"[^>]*>\s*/i, '');
  out = out.replace('</head>', () => `    ${head}\n  </head>`);

  // React mount হলে এই কনটেন্ট বদলে যায়; JS ছাড়া ক্রলারও পণ্যের মূল তথ্য দেখতে পায়
  const body = `<main><h1>${esc(p.title)}</h1><p>দাম: ৳${esc(p.price)}</p>${p.category ? `<p>ক্যাটাগরি: ${esc(p.category)}</p>` : ''}<p>${esc(desc)}</p></main>`;
  out = out.replace(/<div id="root"><\/div>/, () => `<div id="root">${body}</div>`);
  return out;
}

export default async function handler(req, res) {
  const id = String(req.query.id || '').trim();
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  try {
    const html = await getTemplate(host);
    if (!id) { res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8'); return res.send(html); }

    const p = await fetchProduct(id);
    if (!p || !p.title) {
      // পণ্য নেই: SPA-র "পণ্যটি পাওয়া যায়নি" পেজই দেখাবে, কিন্তু Google যেন ইনডেক্স না করে
      res.status(404).setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', 'noindex');
      res.setHeader('Cache-Control', 'public, s-maxage=60');
      return res.send(html);
    }
    res.status(200).setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=86400');
    return res.send(injectHead(html, p, id));
  } catch (e) {
    // Firestore/টেমপ্লেটে সমস্যা হলে সাইট যেন না ভাঙে — সাধারণ SPA-তে ফেরত পাঠাই
    res.setHeader('Location', '/index.html');
    res.setHeader('Cache-Control', 'no-store');
    return res.status(302).end();
  }
}
