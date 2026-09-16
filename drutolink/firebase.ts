// firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyA_tlF7dDeJzGiGEjVv9jKzA86X3ZE2dEc",
  authDomain: "drutolink-db.firebaseapp.com",
  projectId: "drutolink-db",
  storageBucket: "drutolink-db.firebasestorage.app",
  messagingSenderId: "1096684485848",
  appId: "1:1096684485848:web:570057b3d35a63c129abad",
  measurementId: "G-FNV95K5WE5",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// দ্বিতীয় একটা Firebase App instance — শুধু অ্যাডমিন প্যানেল থেকে নতুন
// worker অ্যাকাউন্ট তৈরি করার জন্য ব্যবহার হয়। createUserWithEmailAndPassword
// কল করলে সেই instance-এ নতুন ইউজার সাইন-ইন হয়ে যায়, কিন্তু যেহেতু এটা আলাদা
// app instance, তাই মূল `auth`-এ লগ-ইন করা অ্যাডমিন সেশন অক্ষত থাকে।
const secondaryApp = initializeApp(firebaseConfig, "Secondary");
export const secondaryAuth = getAuth(secondaryApp);
