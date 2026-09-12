import React, { useState, useEffect, useRef } from 'react';
import {
  Search, ShieldCheck, Truck, Wallet, Package, Plane, ChevronRight, ChevronLeft,
  Menu, ShoppingCart, User, CreditCard, LayoutDashboard, ShoppingBag,
  CheckCircle, ArrowLeft, Lock, Key, Trash2
} from 'lucide-react';

// --- FIREBASE IMPORTS ---
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyA_tlF7dDeJzGiGEjVv9jKzA86X3ZE2dEc",
  authDomain: "drutolink-db.firebaseapp.com",
  projectId: "drutolink-db",
  storageBucket: "drutolink-db.firebasestorage.app",
  messagingSenderId: "1096684485848",
  appId: "1:1096684485848:web:570057b3d35a63c129abad",
  measurementId: "G-FNV95K5WE5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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

const SLIDES = [
  { image: 'https://raw.githubusercontent.com/mahmudmahirgenexofficialbd-svg/drutolink/main/slide1.jpg', alt: 'চায়না টু বাংলাদেশ শিপিং' },
  { image: 'https://raw.githubusercontent.com/mahmudmahirgenexofficialbd-svg/drutolink/main/slide2.jpg', alt: 'চায়না টু বাংলাদেশ শিপিং তথ্য' },
  { image: 'https://raw.githubusercontent.com/mahmudmahirgenexofficialbd-svg/drutolink/main/slide3.jpg', alt: 'সোর্সিং টু শিপিং এক ওয়েবসাইটে' },
];

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
