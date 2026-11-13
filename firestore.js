// api/_lib/firestore.js
// Firestore REST helper — firebase SDK ছাড়াই পাবলিক প্রোডাক্ট পড়ার জন্য।
// firestore.rules-এ products-এর `allow read: if true` থাকায় কোনো সার্ভিস অ্যাকাউন্ট লাগে না।

export const SITE_URL = (process.env.SITE_URL || 'https://www.drutolink.shop').replace(/\/$/, '');
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID || 'drutolink-db';
const BASE = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

// Firestore REST-এর typed value → সাধারণ JS মান
export function decodeValue(v) {
  if (!v || typeof v !== 'object') return null;
  if ('stringValue' in v) return v.stringValue;
  if ('integerValue' in v) return Number(v.integerValue);
  if ('doubleValue' in v) return Number(v.doubleValue);
  if ('booleanValue' in v) return v.booleanValue;
  if ('timestampValue' in v) return v.timestampValue;
  if ('nullValue' in v) return null;
  if ('arrayValue' in v) return (v.arrayValue.values || []).map(decodeValue);
  if ('mapValue' in v) return decodeFields(v.mapValue.fields || {});
  return null;
}
export function decodeFields(fields) {
  const out = {};
  for (const k of Object.keys(fields || {})) out[k] = decodeValue(fields[k]);
  return out;
}

/** একটা প্রোডাক্ট আনে। পাওয়া না গেলে null, অন্য ত্রুটিতে throw। */
export async function fetchProduct(id) {
  const r = await fetch(`${BASE}/products/${encodeURIComponent(id)}`);
  if (r.status === 404 || r.status === 403) return null;
  if (!r.ok) throw new Error(`Firestore ${r.status}`);
  const d = await r.json();
  return { id, ...decodeFields(d.fields), _updateTime: d.updateTime };
}

/** সব প্রোডাক্টের id + updateTime (সাইটম্যাপের জন্য)। শুধু একটা ছোট ফিল্ড mask করা হয়। */
export async function listProductStubs(maxPages = 40) {
  const out = [];
  let pageToken = '';
  for (let i = 0; i < maxPages; i++) {
    const url = `${BASE}/products?pageSize=300&mask.fieldPaths=title${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
    const r = await fetch(url);
    if (!r.ok) throw new Error(`Firestore ${r.status}`);
    const d = await r.json();
    for (const doc of d.documents || []) {
      out.push({ id: doc.name.split('/').pop(), updateTime: doc.updateTime });
    }
    if (!d.nextPageToken) break;
    pageToken = d.nextPageToken;
  }
  return out;
}
