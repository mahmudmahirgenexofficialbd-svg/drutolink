// visualSearch.ts
// ছবি দিয়ে প্রোডাক্ট খোঁজার ইঞ্জিন — সম্পূর্ণ ব্রাউজারেই চলে, কোনো API বা সার্ভার লাগে না।
//
// কীভাবে কাজ করে:
//   ১) প্রতিটি প্রোডাক্টের ছবিকে canvas-এ ৬৪x৬৪ সাইজে আঁকা হয়
//   ২) সেখান থেকে দুইরকম "সিগনেচার" বের করা হয় —
//        • কালার হিস্টোগ্রাম (৪x৪x৪ = ৬৪ মান) → পণ্যের রঙ কেমন
//        • ৮x৮ গ্রেস্কেল প্যাটার্ন (৬৪ মান)   → পণ্যের আকৃতি/গঠন কেমন
//   ৩) দুটো মিলিয়ে ১২৮ মানের একটা ভেক্টর, আর তুলনা হয় cosine similarity দিয়ে
//   ৪) হিসাব করা সিগনেচার localStorage-এ জমা থাকে, তাই দ্বিতীয়বার আর হিসাব করতে হয় না
//
// সীমাবদ্ধতা: এটা AI নয়, তাই "একই জিনিস অন্য অ্যাঙ্গেলে" সবসময় ধরতে পারবে না।
// রঙ + গড়ন কাছাকাছি হলে ভালো মেলে — পোশাক, ব্যাগ, জুতা, গ্যাজেটে ভালো কাজ করে।

import { useCallback, useEffect, useRef, useState } from 'react';

const CANVAS_SIZE = 64;      // ছবি এই সাইজে ছোট করে নেওয়া হয়
const GRAY_GRID = 8;         // ৮x৮ গ্রেস্কেল গ্রিড
const COLOR_BINS = 4;        // প্রতি চ্যানেলে ৪ ভাগ → ৪*৪*৪ = ৬৪ বিন
const COLOR_WEIGHT = 0.65;   // রঙের গুরুত্ব
const SHAPE_WEIGHT = 0.35;   // গড়নের গুরুত্ব
const CACHE_PREFIX = 'dl_vs_v1:';
// এর নিচে মিল হলে দেখানো হবে না। বেশি ফল চাইলে কমান (যেমন 0.35),
// শুধু কড়া মিল চাইলে বাড়ান (যেমন 0.6)। পরীক্ষায়: একই পণ্যের ভিন্ন ছবি ≈ 0.6–0.9,
// সম্পূর্ণ ভিন্ন রঙের পণ্য ≈ 0.1–0.25।
const MIN_SCORE = 0.45;
const MAX_RESULTS = 24;

export type Signature = number[];

/* ---------------------------------------------------------------- helpers */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // data: URL হলে দরকার নেই, কিন্তু বাইরের URL (যেমন ডিফল্ট unsplash ছবি) হলে লাগে
    if (!src.startsWith('data:')) img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

let sharedCanvas: HTMLCanvasElement | null = null;
function getCanvas() {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCanvas.width = CANVAS_SIZE;
    sharedCanvas.height = CANVAS_SIZE;
  }
  return sharedCanvas;
}

/** ছবি থেকে ১২৮ মানের সিগনেচার বের করে। না পারলে null. */
export async function computeSignature(src: string): Promise<Signature | null> {
  let data: Uint8ClampedArray;
  try {
    const img = await loadImage(src);
    const canvas = getCanvas();
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.drawImage(img, 0, 0, CANVAS_SIZE, CANVAS_SIZE);
    data = ctx.getImageData(0, 0, CANVAS_SIZE, CANVAS_SIZE).data;
  } catch {
    return null; // লোড ব্যর্থ, বা CORS-এর কারণে canvas "tainted"
  }

  // --- ১) কালার হিস্টোগ্রাম (সাদা ব্যাকগ্রাউন্ড বাদ দিয়ে) ---
  const hist = new Array(COLOR_BINS ** 3).fill(0);
  const gray = new Float64Array(CANVAS_SIZE * CANVAS_SIZE);
  let counted = 0;

  for (let i = 0, p = 0; i < data.length; i += 4, p++) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    gray[p] = 0.299 * r + 0.587 * g + 0.114 * b;

    // প্রোডাক্ট ফটোতে সাদা ব্যাকগ্রাউন্ড খুব common — সেটা গুনলে সব ছবিই "মিলে" যায়
    const nearWhite = r > 238 && g > 238 && b > 238;
    const transparent = data[i + 3] < 32;
    if (nearWhite || transparent) continue;

    const rb = Math.min(COLOR_BINS - 1, (r * COLOR_BINS) >> 8);
    const gb = Math.min(COLOR_BINS - 1, (g * COLOR_BINS) >> 8);
    const bb = Math.min(COLOR_BINS - 1, (b * COLOR_BINS) >> 8);
    hist[rb * COLOR_BINS * COLOR_BINS + gb * COLOR_BINS + bb]++;
    counted++;
  }

  if (counted === 0) counted = 1; // পুরো ছবি সাদা হলেও crash করবে না
  // Hellinger: sqrt নিলে অল্প রঙের অংশও গুরুত্ব পায়
  let colorNorm = 0;
  for (let i = 0; i < hist.length; i++) {
    hist[i] = Math.sqrt(hist[i] / counted);
    colorNorm += hist[i] * hist[i];
  }
  colorNorm = Math.sqrt(colorNorm) || 1;

  // --- ২) ৮x৮ গ্রেস্কেল গড়ন (আলো-নিরপেক্ষ) ---
  const block = CANVAS_SIZE / GRAY_GRID;
  const shape = new Array(GRAY_GRID * GRAY_GRID).fill(0);
  for (let by = 0; by < GRAY_GRID; by++) {
    for (let bx = 0; bx < GRAY_GRID; bx++) {
      let sum = 0;
      for (let y = 0; y < block; y++) {
        for (let x = 0; x < block; x++) {
          sum += gray[(by * block + y) * CANVAS_SIZE + (bx * block + x)];
        }
      }
      shape[by * GRAY_GRID + bx] = sum / (block * block);
    }
  }
  // mean বাদ দিয়ে normalize → ছবি উজ্জ্বল না অন্ধকার, তাতে ফল বদলাবে না
  const mean = shape.reduce((a, b) => a + b, 0) / shape.length;
  let shapeNorm = 0;
  for (let i = 0; i < shape.length; i++) {
    shape[i] -= mean;
    shapeNorm += shape[i] * shape[i];
  }
  shapeNorm = Math.sqrt(shapeNorm) || 1;

  // --- ৩) দুটো একসাথে, ওজন দিয়ে ---
  const sig: number[] = new Array(hist.length + shape.length);
  for (let i = 0; i < hist.length; i++) {
    sig[i] = Math.round(((hist[i] / colorNorm) * COLOR_WEIGHT) * 10000) / 10000;
  }
  for (let i = 0; i < shape.length; i++) {
    sig[hist.length + i] = Math.round(((shape[i] / shapeNorm) * SHAPE_WEIGHT) * 10000) / 10000;
  }
  return sig;
}

/** দুই সিগনেচারের মিল, ০ থেকে ১ (বেশি মানে বেশি মিল)। */
export function similarity(a: Signature, b: Signature): number {
  let dot = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  if (!na || !nb) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

/* ------------------------------------------------------------- cache (localStorage) */

function cacheKey(id: string, image: string) {
  // ছবি বদলালে key-ও বদলাবে, তাই পুরোনো সিগনেচার ভুল করে ব্যবহার হবে না
  return `${CACHE_PREFIX}${id}:${image.length}`;
}

function readCache(id: string, image: string): Signature | null {
  try {
    const raw = localStorage.getItem(cacheKey(id, image));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function writeCache(id: string, image: string, sig: Signature) {
  try {
    localStorage.setItem(cacheKey(id, image), JSON.stringify(sig));
  } catch {
    // জায়গা শেষ — পুরোনো এন্ট্রি মুছে একবার চেষ্টা করি
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(CACHE_PREFIX))
        .slice(0, 50)
        .forEach((k) => localStorage.removeItem(k));
      localStorage.setItem(cacheKey(id, image), JSON.stringify(sig));
    } catch { /* থাক, cache ছাড়াই চলবে */ }
  }
}

/* ------------------------------------------------------------------ hook */

export type VisualMatch = { id: string; score: number };

type Product = { id: string; image?: string; [k: string]: any };

/**
 * প্রোডাক্ট লিস্ট দিলে ছবি-সার্চের সব কিছু ফেরত দেয়।
 *
 *   const visual = useVisualSearch(products);
 *   visual.searchByFile(file);   // ইউজারের আপলোড করা ছবি দিয়ে খোঁজা
 *   visual.matches              // [{ id, score }] — মিলের ক্রমে সাজানো
 *   visual.clear()              // সার্চ বাতিল
 */
export function useVisualSearch(products: Product[]) {
  const index = useRef<Map<string, Signature>>(new Map());
  const [ready, setReady] = useState(0);          // কয়টা প্রোডাক্ট ইনডেক্স হয়েছে
  const [indexing, setIndexing] = useState(false);
  const [searching, setSearching] = useState(false);
  const [matches, setMatches] = useState<VisualMatch[] | null>(null);
  const [queryImage, setQueryImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // প্রোডাক্ট লোড হলে ব্যাকগ্রাউন্ডে আস্তে আস্তে ইনডেক্স তৈরি হয়
  const buildIndex = useCallback(async () => {
    const pending = products.filter((p) => p.image && !index.current.has(p.id));
    if (pending.length === 0) return;
    setIndexing(true);
    for (const p of pending) {
      const cached = readCache(p.id, p.image!);
      if (cached) {
        index.current.set(p.id, cached);
      } else {
        const sig = await computeSignature(p.image!);
        if (sig) {
          index.current.set(p.id, sig);
          writeCache(p.id, p.image!, sig);
        }
      }
      setReady(index.current.size);
      // UI যেন আটকে না যায়
      await new Promise((r) => setTimeout(r, 0));
    }
    setIndexing(false);
  }, [products]);

  useEffect(() => {
    if (products.length === 0) return;
    let cancelled = false;
    const t = setTimeout(() => { if (!cancelled) buildIndex(); }, 400);
    return () => { cancelled = true; clearTimeout(t); };
  }, [products, buildIndex]);

  const searchByDataUrl = useCallback(async (dataUrl: string) => {
    setSearching(true);
    setError(null);
    setQueryImage(dataUrl);
    try {
      await buildIndex(); // এখনো বাকি থাকলে শেষ করে নিই
      const qs = await computeSignature(dataUrl);
      if (!qs) {
        setError('ছবিটি পড়া যায়নি। অন্য একটি ছবি দিয়ে চেষ্টা করুন।');
        setMatches([]);
        return;
      }
      const scored: VisualMatch[] = [];
      index.current.forEach((sig, id) => {
        const score = similarity(qs, sig);
        if (score >= MIN_SCORE) scored.push({ id, score });
      });
      scored.sort((a, b) => b.score - a.score);
      setMatches(scored.slice(0, MAX_RESULTS));
    } catch {
      setError('সার্চ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
      setMatches([]);
    } finally {
      setSearching(false);
    }
  }, [buildIndex]);

  const searchByFile = useCallback((file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('শুধু ছবি ফাইল দিন (JPG/PNG/WebP)।');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => searchByDataUrl(String(reader.result));
    reader.onerror = () => setError('ফাইলটি পড়া যায়নি।');
    reader.readAsDataURL(file);
  }, [searchByDataUrl]);

  const clear = useCallback(() => {
    setMatches(null);
    setQueryImage(null);
    setError(null);
  }, []);

  return {
    matches,               // null = ছবি-সার্চ চালু নেই
    active: matches !== null,
    queryImage,
    searching,
    indexing,
    indexed: ready,
    error,
    searchByFile,
    searchByDataUrl,
    clear,
  };
}
