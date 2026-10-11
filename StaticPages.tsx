import React, { useEffect } from 'react';
import {
  ChevronRight, Phone, Mail, MapPin, Facebook, Instagram, MessageCircle, ShieldCheck,
  Truck, Wallet, Clock, Plane, Search, ChevronDown,
} from 'lucide-react';
import { Link } from '../Link';
import { SITE, FAQ_LIST } from '../site';

/* ---------- shared shell ---------- */

export function PageShell({ eyebrow, title, subtitle, crumb, children, narrow = true }: {
  eyebrow?: string; title: string; subtitle?: string; crumb: string; children: React.ReactNode; narrow?: boolean;
}) {
  return (
    <main>
      <section className="bg-slate-50 border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 py-8 md:py-12">
          <nav aria-label="breadcrumb" className="text-xs text-gray-500 flex items-center gap-1.5 mb-4">
            <Link to="/" className="hover:text-red-600">হোম</Link>
            <ChevronRight className="h-3 w-3" />
            <span className="text-gray-800 font-medium">{crumb}</span>
          </nav>
          {eyebrow && <p className="text-xs font-bold uppercase tracking-wider text-red-600">{eyebrow}</p>}
          <h1 className="font-display text-3xl md:text-4xl font-extrabold text-gray-900 mt-1 leading-tight">{title}</h1>
          {subtitle && <p className="text-gray-600 mt-3 max-w-2xl leading-7">{subtitle}</p>}
        </div>
      </section>
      <div className={`${narrow ? 'max-w-4xl' : 'max-w-6xl'} mx-auto px-4 py-10 md:py-14`}>{children}</div>
    </main>
  );
}

function Prose({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 text-gray-700 leading-8 text-[15px]">{children}</div>;
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="font-display text-xl font-bold text-gray-900 mt-10 mb-3">{children}</h2>;
}
function Note({ children, tone = 'amber' }: { children: React.ReactNode; tone?: 'amber' | 'red' | 'green' }) {
  const t = { amber: 'bg-amber-50 border-amber-200 text-amber-900', red: 'bg-red-50 border-red-100 text-red-800', green: 'bg-green-50 border-green-200 text-green-900' }[tone];
  return <div className={`rounded-xl border p-4 text-sm leading-7 ${t}`}>{children}</div>;
}

export function CtaBand({ title = 'পছন্দের পণ্য খুঁজে নিন', text = 'ক্যাটালগ থেকে বেছে নিন, অথবা ছবি দিয়ে খুঁজুন।' }: { title?: string; text?: string }) {
  return (
    <section className="bg-red-700 text-white">
      <div className="max-w-6xl mx-auto px-4 py-10 flex flex-col md:flex-row items-center justify-between gap-5">
        <div>
          <h2 className="font-display text-2xl font-extrabold">{title}</h2>
          <p className="text-red-100 text-sm mt-1">{text}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/products" className="bg-white text-red-700 font-bold px-6 py-3 rounded-xl hover:bg-red-50 transition-colors">সব পণ্য দেখুন</Link>
          <Link to="/contact" className="border border-white/60 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">যোগাযোগ</Link>
        </div>
      </div>
    </section>
  );
}

/* ---------- About (গল্প অংশটা App থেকে children হিসেবে আসে) ---------- */

export function AboutPage({ children }: { children: React.ReactNode }) {
  const points = [
    { icon: Search, t: 'সোর্সিং', d: 'আপনার পছন্দের পণ্য চীনের সাপ্লায়ারদের কাছ থেকে খুঁজে বের করা।' },
    { icon: ShieldCheck, t: 'প্রসেসিং', d: 'অর্ডার যাচাই, সাপ্লায়ারকে পেমেন্ট ও পণ্য সংগ্রহ।' },
    { icon: Plane, t: 'শিপিং', d: 'চীন থেকে বাংলাদেশে এয়ার শিপমেন্টে পণ্য পাঠানো।' },
    { icon: Truck, t: 'ডেলিভারি', d: 'দেশে আসার পর আসল ওজন মেপে আপনার ঠিকানায় পৌঁছে দেওয়া।' },
  ];
  return (
    <>
      <PageShell crumb="আমাদের সম্পর্কে" eyebrow="About DrutoLink" title="DrutoLink সম্পর্কে"
        subtitle="চীন থেকে বাংলাদেশে পণ্য আনার পুরো প্রক্রিয়া সহজ ও স্বচ্ছ রাখাই আমাদের কাজ।" narrow={false}>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {points.map(({ icon: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border border-gray-200 bg-white p-5">
              <span className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center"><Icon className="h-5 w-5" /></span>
              <h3 className="font-display font-bold text-gray-900 mt-3">{t}</h3>
              <p className="text-sm text-gray-600 mt-1 leading-6">{d}</p>
            </div>
          ))}
        </div>
      </PageShell>
      {children}
      <CtaBand />
    </>
  );
}

/* ---------- How it works ---------- */

export function HowItWorksPage() {
  const steps = [
    { n: '১', t: 'প্রোডাক্ট বাছাই করুন', d: 'ক্যাটালগ থেকে পছন্দের পণ্য, সাইজ/কালার ও পরিমাণ বেছে কার্টে যোগ করুন। ক্যাটালগে না পেলে ছবি বা নাম দিয়ে আমাদের জানান — আমরা সোর্স করে দিতে পারি।' },
    { n: '২', t: 'চেকআউট ও পেমেন্ট', d: `বিকাশ বা নগদে পেমেন্ট করে ট্রানজেকশন আইডি দিন। অর্ডার কনফার্ম করতে অন্তত ${SITE.advancePercent}% অ্যাডভান্স প্রযোজ্য।` },
    { n: '৩', t: 'আমরা সোর্স করি', d: 'আমরা চীনের সাপ্লায়ারের কাছ থেকে পণ্য সংগ্রহ করে নিজেদের কাছে জমা করি।' },
    { n: '৪', t: 'শিপমেন্ট', d: 'পণ্য এয়ার শিপমেন্টে চীন থেকে বাংলাদেশে আসে। প্রতিটি ধাপ আপনার অ্যাকাউন্টের অর্ডার ট্র্যাকিংয়ে দেখা যায়।' },
    { n: '৫', t: 'ডেলিভারি', d: 'দেশে পৌঁছানোর পর আসল ওজন মেপে চূড়ান্ত শিপিং চার্জ নির্ধারণ হয়, তারপর আপনার ঠিকানায় ডেলিভারি।' },
  ];
  return (
    <>
      <PageShell crumb="কীভাবে কাজ করে" eyebrow="Simple process" title="কীভাবে অর্ডার করবেন"
        subtitle="পণ্য নির্বাচন থেকে ডেলিভারি — প্রতিটি ধাপ এখানে সহজ ভাষায়।">
        <ol className="space-y-5">
          {steps.map((s) => (
            <li key={s.n} className="flex gap-4 rounded-2xl border border-gray-200 bg-white p-5">
              <span className="h-10 w-10 shrink-0 rounded-full bg-red-600 text-white font-display font-extrabold flex items-center justify-center">{s.n}</span>
              <div>
                <h3 className="font-display font-bold text-gray-900">{s.t}</h3>
                <p className="text-sm text-gray-600 mt-1 leading-7">{s.d}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-8"><Note tone="red"><strong>জেনে রাখুন:</strong> ডেলিভারি সাধারণত ১৫–২০ দিনের কম সময়ে আসে, তবে নিরাপত্তার জন্য কিছু ক্ষেত্রে একটু বেশি সময় লাগতে পারে। বিস্তারিত <Link to="/shipping" className="underline font-semibold">শিপিং ও ডেলিভারি</Link> পেজে।</Note></div>
      </PageShell>
      <CtaBand />
    </>
  );
}

/* ---------- Shipping ---------- */

export function ShippingPage() {
  return (
    <>
      <PageShell crumb="শিপিং ও ডেলিভারি" eyebrow="Shipping" title="শিপিং ও ডেলিভারি তথ্য"
        subtitle="চীন থেকে বাংলাদেশে পণ্য আসার সময়, চার্জ ও অর্ডারের ধাপগুলো।">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          {[
            { icon: Clock, t: 'আনুমানিক সময়', v: '১৫–২০ দিন' },
            { icon: Wallet, t: 'শিপিং চার্জ (আনুমানিক)', v: `৳ ${SITE.shippingRatePerKg.toLocaleString('bn-BD')} / কেজি` },
            { icon: Plane, t: 'শিপমেন্ট মাধ্যম', v: 'এয়ার শিপমেন্ট' },
          ].map(({ icon: Icon, t, v }) => (
            <div key={t} className="rounded-2xl border border-gray-200 bg-white p-5">
              <Icon className="h-5 w-5 text-red-600" />
              <p className="text-xs text-gray-500 mt-3">{t}</p>
              <p className="font-display text-lg font-extrabold text-gray-900 mt-0.5">{v}</p>
            </div>
          ))}
        </div>
        <Prose>
          <H2>শিপিং চার্জ কীভাবে হিসাব হয়</H2>
          <p>চীন থেকে বাংলাদেশে আপনার ঠিকানা পর্যন্ত ডেলিভারি ও শিপিং চার্জ প্রতি কেজি {SITE.shippingRatePerKg} টাকা হারে ধরা হয়। ওয়েবসাইটে পণ্যের পাশে বা কার্টে যে ওজন ও চার্জ দেখানো হয়, তা <strong>আনুমানিক</strong> — ১০০% নির্ভুল নয়।</p>
          <p>পণ্য বাংলাদেশে পৌঁছানোর পর আসল ওজন মেপে চূড়ান্ত শিপিং চার্জ নির্ধারণ করা হয়। আপনার অর্ডার ট্র্যাকিং পেজে আনুমানিক ও চূড়ান্ত — দুই ধরনের হিসাবই দেখা যায়।</p>
          <H2>অর্ডারের ধাপসমূহ</H2>
          <p>আপনার অর্ডার এই ধাপগুলো পার হয়: পেমেন্ট যাচাই → অর্ডার প্লেসড → প্রসেসিং → চীনে সোর্স করা হয়েছে → ট্রানজিটে → বাংলাদেশে পৌঁছেছে → ডেলিভারির জন্য বের হয়েছে → ডেলিভারড।</p>
          <H2>সী শিপমেন্ট</H2>
          <p>সী শিপমেন্ট এখন চালু নেই। বেশি পরিমাণে (বাল্ক) অর্ডারের ক্ষেত্রে এটি চালু করা হবে।</p>
          <H2>ডেলিভারি এলাকা</H2>
          <p>দেশের ৬৪টি জেলায় ডেলিভারি দেওয়া হয়।</p>
          <Note>ডেলিভারির সময় একটি আনুমানিক হিসাব। কাস্টমস, আবহাওয়া ও এয়ারলাইন শিডিউলের কারণে কখনো কখনো কিছুটা বেশি সময় লাগতে পারে।</Note>
        </Prose>
      </PageShell>
      <CtaBand />
    </>
  );
}

/* ---------- Return policy ---------- */

export function ReturnPolicyPage() {
  return (
    <>
      <PageShell crumb="রিটার্ন ও ক্ষতিপূরণ" eyebrow="Policy" title="রিটার্ন ও ক্ষতিপূরণ পলিসি"
        subtitle={`সর্বশেষ হালনাগাদ: ${SITE.lastUpdated}`}>
        <Prose>
          <Note tone="amber"><strong>সংক্ষেপে:</strong> আমাদের পণ্য চীন থেকে সোর্স করে আনা হয়, তাই সাধারণত রিটার্ন গ্রহণ করা হয় না। তবে ভাঙা বা ভুল পণ্য পেলে আমরা ক্ষতিপূরণ দিয়ে থাকি।</Note>
          <H2>যেসব ক্ষেত্রে আমরা ক্ষতিপূরণ দিই</H2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>ডেলিভারিতে পণ্য ভাঙা বা ক্ষতিগ্রস্ত অবস্থায় পেলে</li>
            <li>আপনার অর্ডার করা পণ্যের বদলে ভুল পণ্য পেলে</li>
          </ul>
          <H2>যেসব ক্ষেত্রে রিটার্ন হয় না</H2>
          <ul className="list-disc pl-6 space-y-1.5">
            <li>পণ্য পছন্দ না হওয়া বা মত বদলানো — কারণ পণ্যটি আপনার অর্ডার অনুযায়ী সোর্স করা হয়েছে</li>
            <li>কাস্টমাইজড বা আপনার চাহিদা অনুযায়ী বানানো পণ্য</li>
            <li>ওয়েবসাইটের ছবি/বর্ণনা অনুযায়ী পণ্য এলে, শুধু রঙের সামান্য তারতম্যের কারণে</li>
          </ul>
          <H2>সমস্যা পেলে কী করবেন</H2>
          <ol className="list-decimal pl-6 space-y-1.5">
            <li>পণ্য হাতে পেয়ে যত তাড়াতাড়ি সম্ভব বক্স খুলে পণ্যটি দেখে নিন।</li>
            <li>সমস্যার স্পষ্ট ছবি বা ভিডিও (সম্ভব হলে বক্স খোলার সময়ের) সংরক্ষণ করুন।</li>
            <li>আপনার অর্ডার আইডিসহ <Link to="/contact" className="text-red-600 underline font-semibold">আমাদের সাথে যোগাযোগ</Link> করুন।</li>
            <li>আমরা যাচাই করে ক্ষতিপূরণের বিষয়ে আপনাকে জানাব।</li>
          </ol>
          <p>কোনো সমস্যা হলে যত দ্রুত জানাবেন, সমাধান তত সহজ হবে।</p>
        </Prose>
      </PageShell>
    </>
  );
}

/* ---------- Privacy ---------- */

export function PrivacyPage() {
  return (
    <PageShell crumb="প্রাইভেসি পলিসি" eyebrow="Policy" title="প্রাইভেসি পলিসি" subtitle={`সর্বশেষ হালনাগাদ: ${SITE.lastUpdated}`}>
      <Prose>
        <p>{SITE.name} ({SITE.url.replace('https://', '')}) আপনার ব্যক্তিগত তথ্যের নিরাপত্তাকে গুরুত্ব দেয়। এই পেজে বলা হয়েছে আমরা কোন তথ্য সংগ্রহ করি এবং কীভাবে ব্যবহার করি।</p>
        <H2>আমরা যে তথ্য সংগ্রহ করি</H2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>অ্যাকাউন্ট তৈরির সময়: নাম, ইমেইল, ফোন নম্বর (অথবা Google অ্যাকাউন্টের মাধ্যমে লগইন করলে সেই অ্যাকাউন্টের নাম ও ইমেইল)</li>
          <li>অর্ডারের সময়: ডেলিভারি ঠিকানা, জেলা/এলাকা, ফোন নম্বর, অর্ডার করা পণ্যের তালিকা</li>
          <li>পেমেন্ট যাচাইয়ের জন্য: বিকাশ/নগদ প্রেরক নম্বর ও ট্রানজেকশন আইডি। অনলাইন পেমেন্ট গেটওয়ের ক্ষেত্রে পেমেন্টের তথ্য গেটওয়ে প্রদানকারীর মাধ্যমে প্রক্রিয়া হয় — আমরা আপনার কার্ড বা পিন নম্বর সংরক্ষণ করি না।</li>
        </ul>
        <H2>তথ্য কীভাবে ব্যবহার হয়</H2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>আপনার অর্ডার প্রসেস, শিপ ও ডেলিভারি করতে</li>
          <li>অর্ডারের অবস্থা সম্পর্কে যোগাযোগ করতে</li>
          <li>পেমেন্ট যাচাই ও জালিয়াতি প্রতিরোধে</li>
          <li>সাইটের সেবা উন্নত করতে</li>
        </ul>
        <H2>তথ্য কোথায় সংরক্ষিত থাকে</H2>
        <p>অ্যাকাউন্ট ও অর্ডারের তথ্য Google Firebase (Authentication ও Firestore) সেবায় সংরক্ষিত হয়। আপনার তথ্য শুধু আপনি এবং সাইটের অনুমোদিত অ্যাডমিন দেখতে পারেন।</p>
        <H2>তথ্য শেয়ার</H2>
        <p>অর্ডার সম্পন্ন করতে প্রয়োজনীয় সীমিত তথ্য (যেমন ডেলিভারি ঠিকানা ও ফোন নম্বর) ডেলিভারি সহযোগীদের সাথে শেয়ার করা হতে পারে। আইনগতভাবে বাধ্য না হলে আমরা আপনার তথ্য অন্য কারো কাছে বিক্রি বা প্রকাশ করি না।</p>
        <H2>আপনার অধিকার</H2>
        <p>আপনি আপনার তথ্য দেখতে, সংশোধন করতে বা মুছে ফেলার অনুরোধ করতে চাইলে <Link to="/contact" className="text-red-600 underline font-semibold">আমাদের সাথে যোগাযোগ</Link> করুন।</p>
        <H2>ব্রাউজারে সংরক্ষিত ডেটা</H2>
        <p>ছবি দিয়ে পণ্য খোঁজার ফিচারটি আপনার ব্রাউজারেই চলে এবং গতি বাড়াতে ব্রাউজারের লোকাল স্টোরেজে পণ্যের ছবির হিসাব জমা রাখে। আপনার আপলোড করা ছবি আমাদের সার্ভারে পাঠানো হয় না।</p>
        <H2>পলিসি পরিবর্তন</H2>
        <p>এই পলিসি সময়ে সময়ে হালনাগাদ হতে পারে। পরিবর্তন হলে এই পেজে নতুন তারিখসহ প্রকাশ করা হবে।</p>
      </Prose>
    </PageShell>
  );
}

/* ---------- Terms ---------- */

export function TermsPage() {
  return (
    <PageShell crumb="শর্তাবলী" eyebrow="Policy" title="শর্তাবলী" subtitle={`সর্বশেষ হালনাগাদ: ${SITE.lastUpdated}`}>
      <Prose>
        <p>{SITE.name}-এ অর্ডার করার মাধ্যমে আপনি নিচের শর্তগুলোতে সম্মত হচ্ছেন।</p>
        <H2>১. আমাদের সেবা</H2>
        <p>{SITE.name} চীনের সাপ্লায়ার থেকে পণ্য সোর্সিং করে বাংলাদেশে পৌঁছে দেওয়ার সেবা দেয়। পণ্য আপনার অর্ডার পাওয়ার পর সংগ্রহ করা হয়।</p>
        <H2>২. দাম ও পেমেন্ট</H2>
        <ul className="list-disc pl-6 space-y-1.5">
          <li>ওয়েবসাইটে দেখানো দাম টাকায় (৳)। সাপ্লায়ারের দাম বা বিনিময় হারের কারণে দাম পরিবর্তন হতে পারে।</li>
          <li>অর্ডার কনফার্ম করতে অন্তত {SITE.advancePercent}% অ্যাডভান্স পেমেন্ট প্রযোজ্য।</li>
          <li>পেমেন্ট বিকাশ/নগদ বা সাইটে চালু থাকা অন্য পেমেন্ট মাধ্যমে নেওয়া হয়। ম্যানুয়াল পেমেন্টে ট্রানজেকশন আইডি যাচাইয়ের পর অর্ডার কনফার্ম হয়।</li>
          <li>ভুল বা যাচাই-অযোগ্য ট্রানজেকশন আইডি দিলে অর্ডার প্রসেস করা নাও হতে পারে।</li>
        </ul>
        <H2>৩. শিপিং চার্জ</H2>
        <p>শিপিং চার্জ প্রতি কেজি {SITE.shippingRatePerKg} টাকা হারে, তবে ওয়েবসাইটে দেখানো ওজন ও চার্জ আনুমানিক। বাংলাদেশে পণ্য পৌঁছানোর পর আসল ওজন অনুযায়ী চূড়ান্ত চার্জ নির্ধারিত হয়। বিস্তারিত <Link to="/shipping" className="text-red-600 underline font-semibold">শিপিং ও ডেলিভারি</Link> পেজে।</p>
        <H2>৪. ডেলিভারির সময়</H2>
        <p>উল্লেখিত সময় আনুমানিক। কাস্টমস, এয়ারলাইন শিডিউল ও অন্যান্য কারণে সময় বাড়তে পারে।</p>
        <H2>৫. রিটার্ন ও ক্ষতিপূরণ</H2>
        <p>এ বিষয়ে <Link to="/return-policy" className="text-red-600 underline font-semibold">রিটার্ন ও ক্ষতিপূরণ পলিসি</Link> প্রযোজ্য।</p>
        <H2>৬. অ্যাকাউন্ট</H2>
        <p>আপনার অ্যাকাউন্টের তথ্য সঠিক রাখা ও পাসওয়ার্ড গোপন রাখার দায়িত্ব আপনার। আপনার অ্যাকাউন্ট থেকে করা সব কাজের দায় আপনার।</p>
        <H2>৭. পণ্যের তথ্য</H2>
        <p>আমরা পণ্যের ছবি ও বর্ণনা যথাসম্ভব সঠিক রাখার চেষ্টা করি। তবে স্ক্রিনের ভিন্নতার কারণে রঙে সামান্য পার্থক্য হতে পারে।</p>
        <H2>৮. শর্ত পরিবর্তন</H2>
        <p>আমরা প্রয়োজনে এই শর্তাবলী হালনাগাদ করতে পারি। সর্বশেষ সংস্করণ সবসময় এই পেজে পাওয়া যাবে।</p>
        <p>কোনো প্রশ্ন থাকলে <Link to="/contact" className="text-red-600 underline font-semibold">যোগাযোগ করুন</Link>।</p>
      </Prose>
    </PageShell>
  );
}

/* ---------- Contact ---------- */

export function ContactPage() {
  const items: { icon: any; label: string; value: string; href: string }[] = [];
  if (SITE.phone) items.push({ icon: Phone, label: 'ফোন', value: SITE.phone, href: `tel:${SITE.phone}` });
  if (SITE.whatsapp) items.push({ icon: MessageCircle, label: 'WhatsApp', value: `+${SITE.whatsapp}`, href: `https://wa.me/${SITE.whatsapp}` });
  if (SITE.email) items.push({ icon: Mail, label: 'ইমেইল', value: SITE.email, href: `mailto:${SITE.email}` });
  items.push({ icon: Facebook, label: 'Facebook পেজ', value: 'DrutoLink', href: SITE.facebook });
  items.push({ icon: Instagram, label: 'Instagram', value: '@drutolink', href: SITE.instagram });
  return (
    <>
      <PageShell crumb="যোগাযোগ" eyebrow="Contact" title="আমাদের সাথে যোগাযোগ করুন"
        subtitle="পণ্য সোর্সিং, অর্ডার বা শিপিং নিয়ে যেকোনো প্রশ্নে আমরা আছি।" narrow={false}>
        <div className="grid lg:grid-cols-[1.1fr_.9fr] gap-8">
          <div className="space-y-3">
            {items.map(({ icon: Icon, label, value, href }) => (
              <a key={label} href={href} target={href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer"
                className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 hover:border-red-200 hover:bg-red-50/40 transition-colors">
                <span className="h-11 w-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><Icon className="h-5 w-5" /></span>
                <span><span className="block text-xs text-gray-500">{label}</span><span className="block font-semibold text-gray-900">{value}</span></span>
                <ChevronRight className="h-4 w-4 ml-auto text-gray-300" />
              </a>
            ))}
            <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">
              <span className="h-11 w-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><MapPin className="h-5 w-5" /></span>
              <span><span className="block text-xs text-gray-500">অবস্থান</span><span className="block font-semibold text-gray-900">{SITE.location}</span></span>
            </div>
            {SITE.supportHours && (
              <div className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4">
                <span className="h-11 w-11 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shrink-0"><Clock className="h-5 w-5" /></span>
                <span><span className="block text-xs text-gray-500">সাপোর্ট সময়</span><span className="block font-semibold text-gray-900">{SITE.supportHours}</span></span>
              </div>
            )}
          </div>
          <div className="rounded-2xl bg-slate-50 border border-gray-200 p-6">
            <h2 className="font-display text-lg font-bold text-gray-900">মেসেজ দেওয়ার আগে</h2>
            <p className="text-sm text-gray-600 mt-2 leading-7">অনেক প্রশ্নের উত্তর আগে থেকেই আছে — শিপিং চার্জ, ডেলিভারি সময়, অ্যাডভান্স পেমেন্ট ইত্যাদি।</p>
            <div className="mt-4 space-y-2 text-sm">
              <Link to="/faq" className="flex items-center gap-2 text-red-700 font-semibold hover:underline"><ChevronRight className="h-4 w-4" /> সাধারণ প্রশ্নোত্তর (FAQ)</Link>
              <Link to="/shipping" className="flex items-center gap-2 text-red-700 font-semibold hover:underline"><ChevronRight className="h-4 w-4" /> শিপিং ও ডেলিভারি তথ্য</Link>
              <Link to="/track-order" className="flex items-center gap-2 text-red-700 font-semibold hover:underline"><ChevronRight className="h-4 w-4" /> অর্ডার ট্র্যাক করুন</Link>
            </div>
            <p className="text-xs text-gray-500 mt-5 leading-6">অর্ডার সংক্রান্ত প্রশ্নে মেসেজে আপনার অর্ডার আইডি জানালে দ্রুত সাহায্য করা যায়।</p>
          </div>
        </div>
      </PageShell>
    </>
  );
}

/* ---------- FAQ ---------- */

export function FaqPage() {
  // সার্চ ইঞ্জিনের জন্য FAQ স্ট্রাকচার্ড ডেটা
  useEffect(() => {
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.text = JSON.stringify({
      '@context': 'https://schema.org', '@type': 'FAQPage',
      mainEntity: FAQ_LIST.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
    });
    document.head.appendChild(el);
    return () => { document.head.removeChild(el); };
  }, []);
  return (
    <>
      <PageShell crumb="প্রশ্নোত্তর" eyebrow="FAQ" title="সাধারণ প্রশ্নোত্তর" subtitle="আমাদের সেবা নিয়ে সবচেয়ে বেশি জিজ্ঞাসিত প্রশ্ন ও উত্তর।">
        <div className="space-y-3">
          {FAQ_LIST.map((f) => (
            <details key={f.q} className="group rounded-2xl border border-gray-200 bg-white open:border-red-200 open:shadow-sm">
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none p-5 font-semibold text-gray-900">
                {f.q}
                <ChevronDown className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180 shrink-0" />
              </summary>
              <p className="px-5 pb-5 -mt-1 text-sm text-gray-600 leading-7">{f.a}</p>
            </details>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-8">উত্তর পাননি? <Link to="/contact" className="text-red-600 font-semibold underline">আমাদের সাথে যোগাযোগ করুন</Link>।</p>
      </PageShell>
    </>
  );
}

/* ---------- 404 ---------- */

export function NotFoundPage() {
  return (
    <PageShell crumb="পেজ পাওয়া যায়নি" title="পেজটি খুঁজে পাওয়া যায়নি" subtitle="লিংকটি ভুল হতে পারে বা পেজটি সরানো হয়েছে।">
      <div className="flex gap-3">
        <Link to="/" className="bg-red-600 hover:bg-red-700 text-white font-bold px-6 py-3 rounded-xl">হোমে ফিরুন</Link>
        <Link to="/products" className="border border-gray-300 hover:border-red-300 text-gray-800 font-bold px-6 py-3 rounded-xl">সব পণ্য</Link>
      </div>
    </PageShell>
  );
}
