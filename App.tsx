/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, Home, MapPin, Briefcase, LayoutDashboard, ShoppingCart, 
  Sprout, CheckCircle, ShieldCheck, Star, ChevronDown, Camera, 
  VideoOff, ArrowRight, ArrowLeft, Edit2, Save, ShieldAlert, 
  Crown, LogOut, Copy, CreditCard, ScanLine, History, Wallet, 
  ShoppingBag, Zap, Gift, Coins, Megaphone, Send, TrendingUp, 
  Settings2, PlusCircle, Plus, Ban, Type, Tag, HelpCircle, 
  Users, Store, BarChart2, Shield, Trash2, Bell, Loader, Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Html5Qrcode } from 'html5-qrcode';
import { QRCodeCanvas } from 'qrcode.react';

// --- Configuration ---
const GS_WEBAPP_URL = 'https://script.google.com/macros/s/AKfycbwcVG-S-LKKJKUwHDwtlluN_325nwbLKyvyA9I3TfFHowVzpG9mjJi67CNEA9STvLhk/exec';
const ADMIN_KEY = 'savelo-admin-2026';

// --- Types ---
type Section = 'home' | 'shops' | 'agent' | 'dashboard' | 'buy' | 'krishiBazar' | 'admin';
type Role = 'customer' | 'agent';
type AdminTab = 'allCards' | 'agentApprovals' | 'addCard' | 'editLanding' | 'editCustomers' | 'editAgents' | 'adminStats' | 'manageAdmins';

export default function App() {
  const [currentSection, setCurrentSection] = useState<Section>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [smsAlert, setSmsAlert] = useState<{ text: string, isSuccess: boolean, time: string } | null>(null);
  
  // Auth States
  const [loginType, setLoginType] = useState<Role>('customer');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [adminUser, setAdminUser] = useState<any>(null);
  
  // Dashboard Tabs
  const [activeDashTab, setActiveDashTab] = useState<string>('myCard');
  const [activeAgentTab, setActiveAgentTab] = useState<string>('verifyCard');
  const [activeAdminTab, setActiveAdminTab] = useState<AdminTab>('allCards');

  // Registration States
  const [regStep, setRegStep] = useState(1);
  const [regData, setRegData] = useState<any>({
    cardId: '', cardType: '', name: '', nameEn: '', phone: '', email: '', 
    dob: '', gender: '', nid: '', blood: '', address: '', pin: '',
    occupation: '', income: '', health: '', height: '', weight: '', 
    smoking: 'no', nomineeName: '', nomineeRelation: '', nomineeNID: '', 
    nomineePhone: '', nomineeAddress: '', trxId: '', referral: '',
    payMethod: ''
  });

  // Agent Registration States
  const [agRegStep, setAgRegStep] = useState(1);
  const [agRegData, setAgRegData] = useState<any>({
    shopName: '', shopType: '', shopAddress: '', tradeLicense: '',
    ownerName: '', ownerNameEn: '', phone: '', email: '', nid: '',
    dob: '', pin: '', discountRate: 10, trxId: '', payMethod: '',
    lat: '', lng: ''
  });

  const captureLocation = () => {
    if (!navigator.geolocation) {
      showToast('⚠️ আপনার ব্রাউজার লোকেশন সাপোর্ট করে না!');
      return;
    }
    
    showToast('⏳ লোকেশন পারমিশন দিন এবং অপেক্ষা করুন...');
    
    const options = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0
    };

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setAgRegData((prev: any) => ({ 
          ...prev, 
          lat: pos.coords.latitude.toFixed(6), 
          lng: pos.coords.longitude.toFixed(6) 
        }));
        showToast('✅ দোকানের লোকেশন সফলভাবে সেট করা হয়েছে!');
      },
      (err) => {
        let msg = '❌ লোকেশন নিতে সমস্যা হয়েছে!';
        if (err.code === 1) msg = '❌ লোকেশন পারমিশন ডিনাই করা হয়েছে!';
        if (err.code === 2) msg = '❌ পজিশন পাওয়া যাচ্ছে না (GPS চেক করুন)!';
        if (err.code === 3) msg = '❌ লোকেশন নিতে অনেক সময় লাগছে!';
        showToast(msg);
      },
      options
    );
  };

  // Site Settings
  const [settings, setSettings] = useState<any>({
    hero1: 'Luxury Savings',
    hero2: 'Modern Living.',
    subtitle: 'সাভেলো নিও কার্ডের সাথে উপভোগ করুন প্রিমিয়াম ডিসকাউন্ট এবং এক্সক্লুসিভ লাইফস্টাইল সুবিধা।',
    priceDiscount: 499,
    priceNeoMonthly: 199,
    priceNeoYearly: 1499,
    faq1q: 'কার্ডের মেয়াদ কতদিন থাকবে?',
    faq1a: 'আপনার কার্ডটি অ্যাক্টিভেশনের তারিখ থেকে ১ বছর পর্যন্ত মেয়াদ থাকবে।',
    faq2q: 'কিভাবে ডিসকাউন্ট ব্যবহার করবেন?',
    faq2a: 'যেকোনো পার্টনার শপে কেনাকাটার সময় কার্ড শো করুন।',
    krishiUrl: 'https://krishibazar.gov.bd',
    krishiBtnText: 'কৃষক বাজারে যান',
    krishiTitle: 'কৃষক বাজার ওয়েবসাইট',
    krishiDesc: 'সরাসরি কৃষক বাজার প্ল্যাটফর্মে যান।'
  });

  // Data Lists
  const [adminCards, setAdminCards] = useState<any[]>([]);
  const [pendingAgents, setPendingAgents] = useState<any[]>([]);
  const [approvedAgents, setApprovedAgents] = useState<any[]>([]);
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [pointHistory, setPointHistory] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({ totalCards: 0, activeAgents: 0, totalDiscount: 0, totalRevenue: 0 });

  // Refs for Scanners
  const qrReaderRef = useRef<Html5Qrcode | null>(null);

  // --- Effects ---
  useEffect(() => {
    loadSiteSettings();
    checkAdminURL();
    gsRead('Agents').then(data => {
      if (data) setApprovedAgents(data.filter((a: any) => a.status === 'active'));
    });
  }, []);

  useEffect(() => {
    if (isLoggedIn) {
      if (user.role === 'customer') {
        loadCustomerData(user.cardId);
      } else {
        loadAgentData(user.agentId || user.phone);
      }
    }
  }, [isLoggedIn]);

  // --- Helper Functions ---
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const showSms = (text: string, isSuccess = true) => {
    setSmsAlert({ text, isSuccess, time: new Date().toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' }) + ' — এইমাত্র' });
    setTimeout(() => setSmsAlert(null), 5000);
  };

  const checkAdminURL = () => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('key') === ADMIN_KEY) {
      setCurrentSection('admin');
    }
  };

  // --- API Calls ---
  const gsRead = async (sheet: string, filterKey = '', filterVal = '') => {
    try {
      const url = `${GS_WEBAPP_URL}?action=read&sheet=${encodeURIComponent(sheet)}&filterKey=${encodeURIComponent(filterKey)}&filterVal=${encodeURIComponent(filterVal)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      return json.data || [];
    } catch (e) {
      console.error('GS Read failed:', e);
      return null;
    }
  };

  const gsWrite = async (sheet: string, data: any) => {
    try {
      await fetch(GS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'write', sheet, data })
      });
    } catch (e) {
      console.error('GS Write failed:', e);
      showToast('❌ ডেটা সেভ করতে সমস্যা হয়েছে!');
    }
  };

  const gsUpdate = async (sheet: string, keyCol: string, keyVal: string, data: any) => {
    try {
      await fetch(GS_WEBAPP_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'update', sheet, keyCol, keyVal, data })
      });
    } catch (e) {
      console.error('GS Update failed:', e);
      showToast('❌ ডেটা আপডেট করতে সমস্যা হয়েছে!');
    }
  };

  const loadSiteSettings = async () => {
    try {
      const res = await fetch(`${GS_WEBAPP_URL}?action=settings`);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const json = await res.json();
      if (json.settings) {
        setSettings((prev: any) => ({ ...prev, ...json.settings }));
      }
    } catch (e) {
      console.warn('Settings load failed');
    }
  };

  const loadCustomerData = async (cardId: string) => {
    const [points, txs] = await Promise.all([
      gsRead('PointLedger', 'cardId', cardId),
      gsRead('Transactions', 'cardId', cardId)
    ]);
    if (points) setPointHistory(points);
    if (txs) setTxHistory(txs);
  };

  const loadAgentData = async (agentId: string) => {
    const txs = await gsRead('Transactions', 'agentId', agentId);
    if (txs) setTxHistory(txs);
  };

  const loadAdminData = async () => {
    showToast('⏳ ডেটা লোড হচ্ছে...');
    const [customers, agents, txs, statsRes] = await Promise.all([
      gsRead('Customers'),
      gsRead('Agents'),
      gsRead('Transactions'),
      fetch(`${GS_WEBAPP_URL}?action=stats`).then(r => r.json())
    ]);
    if (customers) setAdminCards(customers);
    if (agents) {
      setApprovedAgents(agents.filter((a: any) => a.status === 'active'));
      setPendingAgents(agents.filter((a: any) => a.status === 'pending'));
    }
    if (statsRes.stats) setStats(statsRes.stats);
    showToast('✅ ডেটা লোড সম্পন্ন!');
  };

  // --- Auth Logic ---
  const handleLogin = async (phone: string, pin: string) => {
    if (!phone || pin.length < 4) {
      showToast('⚠️ ফোন নম্বর ও ৪ সংখ্যার পিন দিন!');
      return;
    }
    
    const sheet = loginType === 'customer' ? 'Customers' : 'Agents';
    const rows = await gsRead(sheet, 'phone', phone);
    
    if (!rows || rows.length === 0) {
      // Fallback for demo if network fails or no data
      if (phone === '01711234567' && pin === '1234' && loginType === 'customer') {
        const demoUser = { name: 'রবিন আহমেদ', cardId: 'SN-10254', cardType: 'Gold Member', role: 'customer', status: 'active' };
        setUser(demoUser);
        setIsLoggedIn(true);
        return;
      }
      showToast('❌ এই নম্বরে কোনো অ্যাকাউন্ট নেই!');
      return;
    }

    const foundUser = rows[0];
    if (String(foundUser.pin).trim() === pin) {
      if (foundUser.status === 'blocked') {
        showToast('🚫 অ্যাকাউন্ট ব্লক!');
        return;
      }
      setUser({ ...foundUser, role: loginType });
      setIsLoggedIn(true);
      gsWrite('AdminLogs', { timestamp: new Date().toISOString(), adminUser: phone, action: 'login', target: phone, details: `${loginType} login` });
    } else {
      showToast('❌ পিন সঠিক নয়!');
    }
  };

  const handleAdminLogin = (user: string, pass: string) => {
    if (user === 'superadmin' && pass === 'SN@admin#2026') {
      setAdminUser({ name: 'Super Admin', role: 'super', permissions: ['allCards', 'agentApprovals', 'addCard', 'editLanding', 'editCustomers', 'editAgents', 'adminStats', 'manageAdmins'] });
      loadAdminData();
    } else {
      showToast('❌ ভুল Username বা Password!');
    }
  };

  // --- UI Components ---
  const Nav = () => (
    <nav className="fixed top-0 w-full z-50 backdrop-blur-xl border-b border-white/5 px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentSection('home')}>
          <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center font-black text-black">SN</div>
          <span className="text-xl font-bold tracking-tight uppercase">SAVELO <span className="text-yellow-400">Neo</span></span>
        </div>
        
        <div className="hidden md:flex gap-10 text-sm font-medium text-gray-400">
          <button onClick={() => setCurrentSection('home')} className="hover:text-yellow-400 transition-colors">হোম</button>
          <button onClick={() => setCurrentSection('shops')} className="hover:text-yellow-400 transition-colors">পার্টনার শপ</button>
          <button onClick={() => setCurrentSection('agent')} className="hover:text-yellow-400 transition-colors">এজেন্ট</button>
          <button onClick={() => setCurrentSection('dashboard')} className="hover:text-yellow-400 transition-colors">ড্যাশবোর্ড</button>
          <button onClick={() => setCurrentSection('krishiBazar')} className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1.5">
            <Sprout className="w-3.5 h-3.5" /> কৃষক বাজার
          </button>
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => setCurrentSection('buy')} className="bg-gradient-to-r from-yellow-200 to-yellow-500 text-black text-xs font-bold px-6 py-3 rounded-full uppercase shadow-lg shadow-yellow-500/20">Buy Now</button>
          <button onClick={() => setIsSidebarOpen(true)} className="md:hidden text-white p-2 bg-white/5 rounded-lg border border-white/10">
            <Menu />
          </button>
        </div>
      </div>
    </nav>
  );

  const Sidebar = () => (
    <AnimatePresence>
      {isSidebarOpen && (
        <motion.div 
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed inset-0 bg-black/95 z-[100] md:hidden flex flex-col p-10 backdrop-blur-2xl"
        >
          <div className="flex justify-between items-center mb-16">
            <span className="text-2xl font-bold text-yellow-400 tracking-widest">MENU</span>
            <button onClick={() => setIsSidebarOpen(false)} className="p-3 bg-white/5 rounded-full"><X /></button>
          </div>
          <div className="flex flex-col gap-8 text-3xl font-bold italic tracking-tighter">
            <button onClick={() => { setCurrentSection('home'); setIsSidebarOpen(false); }} className="text-left flex items-center gap-4 hover:text-yellow-400"><Home /> হোম</button>
            <button onClick={() => { setCurrentSection('shops'); setIsSidebarOpen(false); }} className="text-left flex items-center gap-4 hover:text-yellow-400"><MapPin /> পার্টনার শপ</button>
            <button onClick={() => { setCurrentSection('agent'); setIsSidebarOpen(false); }} className="text-left flex items-center gap-4 hover:text-yellow-400"><Briefcase /> এজেন্ট রেজিস্ট্রেশন</button>
            <button onClick={() => { setCurrentSection('dashboard'); setIsSidebarOpen(false); }} className="text-left flex items-center gap-4 hover:text-yellow-400"><LayoutDashboard /> ড্যাশবোর্ড</button>
            <button onClick={() => { setCurrentSection('buy'); setIsSidebarOpen(false); }} className="text-left flex items-center gap-4 hover:text-yellow-400"><ShoppingCart /> Buy Now</button>
            <button onClick={() => { setCurrentSection('krishiBazar'); setIsSidebarOpen(false); }} className="text-left flex items-center gap-4 text-green-400 hover:text-green-300"><Sprout /> কৃষক বাজার</button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const HomeSection = () => (
    <div className="space-y-20">
      <div className="text-center space-y-8">
        <h1 className="text-5xl md:text-8xl font-bold tracking-tighter leading-[1.1]">{settings.hero1} <br /> <span className="text-yellow-400 italic">{settings.hero2}</span></h1>
        <p className="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto">{settings.subtitle}</p>
        <div className="flex flex-wrap justify-center gap-4">
          <button onClick={() => setCurrentSection('buy')} className="bg-gradient-to-r from-yellow-200 to-yellow-500 text-black font-bold px-10 py-5 rounded-full text-lg shadow-xl shadow-yellow-500/30 hover:scale-105 transition-transform">Get Your Card</button>
          <button onClick={() => setCurrentSection('buy')} className="bg-white/5 backdrop-blur-md border border-white/10 px-10 py-5 rounded-full font-bold hover:bg-white/10 transition-all">🎁 উপহার দিন</button>
        </div>
      </div>

      {/* Card Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white/5 backdrop-blur-xl border border-teal-500/30 p-10 rounded-[2rem] hover:border-teal-500/60 transition-all group">
          <h3 className="text-3xl font-bold text-teal-400 mb-2">ডিসকাউন্ট কার্ড</h3>
          <p className="text-gray-400 text-sm mb-6">সাশ্রয়ী কেনাকাটার নতুন দিগন্ত</p>
          <div className="mb-8">
            <p className="text-5xl font-bold italic text-white">৳ {settings.priceDiscount}</p>
            <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">বাৎসরিক মেম্বারশিপ</p>
          </div>
          <ul className="space-y-4 mb-10">
            <li className="flex items-center gap-3 text-sm text-gray-300"><CheckCircle className="text-teal-500 w-5 h-5" /> লোকাল শপ ও ফার্মেসিতে আনলিমিটেড ছাড়।</li>
            <li className="flex items-center gap-3 text-sm font-bold text-white"><ShieldCheck className="text-emerald-400 w-5 h-5 animate-pulse" /> 🛡️ লাইফ ইন্স্যুরেন্স সুবিধা (মেম্বারশিপ পিরিয়ডে)।</li>
          </ul>
          <button onClick={() => setCurrentSection('buy')} className="w-full py-5 rounded-2xl border border-teal-500/50 text-teal-400 font-bold hover:bg-teal-500 hover:text-white transition-all">Buy Teal Card</button>
        </div>

        <div className="bg-white/5 backdrop-blur-xl border border-yellow-400/30 p-10 rounded-[2rem] hover:border-yellow-400/60 transition-all group">
          <h3 className="text-3xl font-bold text-yellow-400 mb-2">সাভেলো নিও কার্ড</h3>
          <p className="text-gray-400 text-sm mb-6">প্রিমিয়াম লাইফস্টাইল ও VIP মর্যাদা</p>
          <div className="flex gap-6 items-end mb-8">
            <div>
              <p className="text-4xl font-bold italic text-white">৳ {settings.priceNeoMonthly}</p>
              <p className="text-[10px] text-gray-500 uppercase">মাসিক প্ল্যান</p>
            </div>
            <div className="h-10 w-px bg-white/10 mb-2"></div>
            <div>
              <p className="text-4xl font-bold italic text-yellow-400">৳ {settings.priceNeoYearly}</p>
              <p className="text-[10px] text-gray-500 uppercase">বাৎসরিক প্ল্যান</p>
            </div>
          </div>
          <ul className="space-y-4 mb-10">
            <li className="flex items-center gap-3 text-sm text-gray-300"><Star className="text-yellow-400 w-5 h-5" /> এক্সক্লুসিভ ইভেন্ট ও VIP সুবিধা।</li>
            <li className="flex items-center gap-3 text-sm font-bold text-white"><ShieldCheck className="text-emerald-400 w-5 h-5 animate-pulse" /> 🛡️ লাইফ ইন্স্যুরেন্স সুবিধা (মেম্বারশিপ পিরিয়ডে)।</li>
          </ul>
          <button onClick={() => setCurrentSection('buy')} className="w-full py-5 rounded-2xl bg-gradient-to-r from-yellow-200 to-yellow-500 text-black font-bold uppercase tracking-widest shadow-lg shadow-yellow-500/20">Buy Gold Card</button>
        </div>
      </div>

      {/* FAQ */}
      <div className="max-w-2xl mx-auto space-y-4">
        <h2 className="text-3xl font-bold text-center text-yellow-400 mb-10 italic uppercase tracking-tighter">সাধারণ জিজ্ঞাসা (FAQ)</h2>
        <FaqItem q={settings.faq1q} a={settings.faq1a} />
        <FaqItem q={settings.faq2q} a={settings.faq2a} />
      </div>
    </div>
  );

  const FaqItem = ({ q, a }: { q: string, a: string }) => {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300">
        <button onClick={() => setIsOpen(!isOpen)} className="w-full p-6 flex justify-between items-center font-bold text-sm text-left hover:bg-white/5 transition-colors">
          <span>{q}</span>
          <ChevronDown className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="px-6 pb-6 text-xs text-gray-400 leading-relaxed border-t border-white/5 pt-4"
            >
              {a}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const BuySection = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Step indicator */}
      <div className="flex items-center justify-center gap-2 mb-2">
        {[1, 2, 3, 4].map(step => (
          <React.Fragment key={step}>
            <div className={`flex items-center gap-2 ${regStep < step ? 'opacity-40' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm ${regStep >= step ? 'bg-yellow-400 text-black' : 'bg-white/10 text-white'}`}>
                {regStep > step ? '✓' : step}
              </div>
              <span className={`text-xs font-bold ${regStep === step ? 'text-yellow-400' : 'text-gray-400'}`}>
                {step === 1 && 'কার্ড তথ্য'}
                {step === 2 && 'ব্যক্তিগত তথ্য'}
                {step === 3 && 'ইন্স্যুরেন্স'}
                {step === 4 && 'পেমেন্ট'}
              </span>
            </div>
            {step < 4 && <div className="flex-1 h-px bg-white/10 max-w-12" />}
          </React.Fragment>
        ))}
      </div>

      {regStep === 1 && (
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-5">
          <h2 className="text-xl font-black text-yellow-400 uppercase">ধাপ ১ — কার্ড তথ্য</h2>
          <div className="p-4 bg-white/5 border border-dashed border-yellow-400/30 rounded-2xl space-y-3">
            <p className="text-xs text-gray-400 font-bold flex items-center gap-2"><ScanLine className="w-4 h-4 text-yellow-400" /> QR স্ক্যান করে Card ID স্বয়ংক্রিয় পূরণ করুন</p>
            <div id="reg-qr-reader" className="rounded-xl overflow-hidden bg-black/30" />
            <div className="flex gap-2">
              <button onClick={startRegScanner} className="flex-1 bg-yellow-400 text-black font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1"><Camera className="w-3 h-3" /> QR স্ক্যান করুন</button>
              <button onClick={stopScanner} className="flex-1 bg-white/5 border border-white/10 py-2.5 rounded-xl text-xs font-bold hover:bg-white/10 flex items-center justify-center gap-1"><VideoOff className="w-3 h-3" /> বন্ধ করুন</button>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">Card ID <span className="text-red-400">*</span></label>
              <input value={regData.cardId} onChange={e => setRegData({...regData, cardId: e.target.value.toUpperCase()})} placeholder="SN-XXXX" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-yellow-400 font-mono font-bold text-yellow-400" />
            </div>
            <div>
              <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">কার্ডের ধরন <span className="text-red-400">*</span></label>
              <select value={regData.cardType} onChange={e => setRegData({...regData, cardType: e.target.value})} className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-yellow-400 text-sm text-gray-300">
                <option value="">— নির্বাচন করুন —</option>
                <option value="gold">সাভেলো নিও কার্ড — Gold (৳ ১৪৯৯/বছর)</option>
                <option value="monthly">সাভেলো নিও কার্ড — Monthly (৳ ১৯৯/মাস)</option>
                <option value="discount">ডিসকাউন্ট কার্ড (৳ ৪৯৯/বছর)</option>
              </select>
            </div>
          </div>
          <button onClick={() => setRegStep(2)} className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2">পরবর্তী ধাপ <ArrowRight className="w-4 h-4" /></button>
        </div>
      )}

      {regStep === 2 && (
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-5">
          <h2 className="text-xl font-black text-yellow-400 uppercase">ধাপ ২ — ব্যক্তিগত তথ্য</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="পূর্ণ নাম (বাংলা)" value={regData.name} onChange={v => setRegData({...regData, name: v})} required />
            <Input label="পূর্ণ নাম (ইংরেজি)" value={regData.nameEn} onChange={v => setRegData({...regData, nameEn: v})} required />
            <Input label="মোবাইল নম্বর" value={regData.phone} onChange={v => setRegData({...regData, phone: v})} required />
            <Input label="ইমেইল (ঐচ্ছিক)" value={regData.email} onChange={v => setRegData({...regData, email: v})} />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRegStep(1)} className="flex-1 bg-white/5 border border-white/10 py-4 rounded-xl font-bold text-sm hover:bg-white/10 flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> পূর্ববর্তী</button>
            <button onClick={() => setRegStep(3)} className="flex-1 bg-yellow-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2">পরবর্তী ধাপ <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {regStep === 3 && (
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6">
          <h2 className="text-xl font-black text-emerald-400 uppercase">ধাপ ৩ — লাইফ ইন্স্যুরেন্স আবেদন</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input label="পেশা" value={regData.occupation} onChange={v => setRegData({...regData, occupation: v})} required />
            <Input label="বার্ষিক আয়" value={regData.income} onChange={v => setRegData({...regData, income: v})} />
            <Input label="নমিনির নাম" value={regData.nomineeName} onChange={v => setRegData({...regData, nomineeName: v})} required />
            <Input label="সম্পর্ক" value={regData.nomineeRelation} onChange={v => setRegData({...regData, nomineeRelation: v})} required />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setRegStep(2)} className="flex-1 bg-white/5 border border-white/10 py-4 rounded-xl font-bold text-sm hover:bg-white/10 flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> পূর্ববর্তী</button>
            <button onClick={() => setRegStep(4)} className="flex-1 bg-yellow-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2">পরবর্তী ধাপ <ArrowRight className="w-4 h-4" /></button>
          </div>
        </div>
      )}

      {regStep === 4 && (
        <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-5">
          <h2 className="text-xl font-black text-yellow-400 uppercase">ধাপ ৪ — পেমেন্ট</h2>
          <div className="p-5 bg-white/5 rounded-2xl border border-yellow-400/20 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-gray-400">নাম:</span><span className="font-bold">{regData.name}</span></div>
            <div className="flex justify-between"><span className="text-gray-400">Card ID:</span><span className="font-mono text-yellow-400 font-bold">{regData.cardId}</span></div>
            <div className="h-px bg-white/10" />
            <div className="flex justify-between"><span className="text-gray-400 font-bold">মোট পরিমাণ:</span><span className="font-black text-yellow-400 text-lg">৳ {regData.cardType === 'gold' ? 1499 : regData.cardType === 'monthly' ? 199 : 499}</span></div>
          </div>
          <div className="p-4 bg-yellow-400/10 rounded-xl border border-yellow-400/20 space-y-3">
            <p className="text-xs text-gray-300 font-bold">পেমেন্ট নম্বর: <span className="text-yellow-400 font-mono">01337147436</span></p>
            <input value={regData.trxId} onChange={e => setRegData({...regData, trxId: e.target.value})} placeholder="Transaction ID (TrxID)" className="w-full p-3 bg-black/40 rounded-xl outline-none border border-white/10 focus:border-yellow-400 text-sm font-mono" />
          </div>
          <button onClick={handleRegistration} className="w-full bg-yellow-400 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> সাবমিট করুন</button>
        </div>
      )}
    </div>
  );

  const Input = ({ label, value, onChange, required, type = 'text' }: any) => (
    <div>
      <label className="text-[10px] text-gray-400 uppercase tracking-widest mb-1 block">{label} {required && <span className="text-red-400">*</span>}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl outline-none focus:border-yellow-400 text-sm" />
    </div>
  );

  const startRegScanner = () => {
    if (qrReaderRef.current) return;
    const scanner = new Html5Qrcode("reg-qr-reader");
    qrReaderRef.current = scanner;
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 200, height: 200 } },
      (decodedText) => {
        setRegData((prev: any) => ({ ...prev, cardId: decodedText.trim().toUpperCase() }));
        showToast('✅ Card ID স্ক্যান হয়েছে!');
        stopScanner();
      },
      () => {}
    ).catch(() => showToast('ক্যামেরা পারমিশন দিন!'));
  };

  const startAgentScanner = () => {
    if (qrReaderRef.current) return;
    const scanner = new Html5Qrcode("agent-qr-reader");
    qrReaderRef.current = scanner;
    scanner.start(
      { facingMode: "environment" },
      { fps: 10, qrbox: { width: 200, height: 200 } },
      (decodedText) => {
        showToast('✅ কার্ড স্ক্যান হয়েছে: ' + decodedText);
        // Logic to verify card would go here
        stopScanner();
      },
      () => {}
    ).catch(() => showToast('ক্যামেরা পারমিশন দিন!'));
  };

  const stopScanner = () => {
    if (qrReaderRef.current) {
      qrReaderRef.current.stop().then(() => {
        qrReaderRef.current?.clear();
        qrReaderRef.current = null;
      }).catch(() => {});
    }
  };

  const AgentSection = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-bold text-yellow-400 italic uppercase">এজেন্ট রেজিস্ট্রেশন</h2>
        <p className="text-gray-400 text-sm">আপনার দোকানের তথ্য দিয়ে এজেন্টশিপের আবেদন করুন।</p>
      </div>
      
      <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-5">
        <Input label="দোকানের নাম" value={agRegData.shopName} onChange={(v: string) => setAgRegData({...agRegData, shopName: v})} required />
        <Input label="দোকানের ধরন" value={agRegData.shopType} onChange={(v: string) => setAgRegData({...agRegData, shopType: v})} required />
        <Input label="মালিকের নাম" value={agRegData.ownerName} onChange={(v: string) => setAgRegData({...agRegData, ownerName: v})} required />
        <Input label="মোবাইল নম্বর" value={agRegData.phone} onChange={(v: string) => setAgRegData({...agRegData, phone: v})} required />
        
        <div className="space-y-2">
          <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">দোকানের লোকেশন (GPS)</label>
          <div className="flex gap-2">
            <div className={`flex-1 bg-white/5 border border-white/10 p-4 rounded-xl text-xs font-mono flex items-center gap-2 ${agRegData.lat ? 'text-emerald-400 border-emerald-500/30' : 'text-gray-500'}`}>
              <MapPin className={`w-4 h-4 ${agRegData.lat ? 'text-emerald-400' : 'text-gray-600'}`} />
              {agRegData.lat ? `${agRegData.lat}, ${agRegData.lng}` : 'লোকেশন সেট করা নেই'}
            </div>
            {agRegData.lat ? (
              <button 
                onClick={() => setAgRegData({...agRegData, lat: '', lng: ''})}
                className="px-4 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl hover:bg-red-500/30 transition-all"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            ) : (
              <button 
                onClick={captureLocation}
                className="px-6 bg-yellow-400 text-black font-bold rounded-xl text-xs flex items-center gap-2 hover:bg-yellow-500 transition-all shadow-lg shadow-yellow-400/20"
              >
                লোকেশন দিন
              </button>
            )}
          </div>
          <p className="text-[9px] text-gray-500 italic">দোকানে দাঁড়িয়ে এই বাটনে ক্লিক করুন যাতে গ্রাহকরা আপনাকে ম্যাপে খুঁজে পায়।</p>
        </div>

        <div className="p-4 bg-yellow-400/10 rounded-xl border border-yellow-400/20 space-y-3">
          <p className="text-xs text-gray-300 font-bold">এজেন্ট ফি: <span className="text-yellow-400 font-mono">৳ ৫,০০০</span></p>
          <p className="text-[10px] text-gray-400">পেমেন্ট নম্বর: 01337147436</p>
          <input value={agRegData.trxId} onChange={e => setAgRegData({...agRegData, trxId: e.target.value})} placeholder="Transaction ID (TrxID)" className="w-full p-3 bg-black/40 rounded-xl outline-none border border-white/10 focus:border-yellow-400 text-sm font-mono" />
        </div>
        <button onClick={handleAgentRegistration} className="w-full bg-teal-500 text-black font-black py-4 rounded-xl flex items-center justify-center gap-2 uppercase tracking-widest">আবেদন জমা দিন</button>
      </div>
    </div>
  );

  const handleRegistration = async () => {
    if (!regData.trxId) { showToast('⚠️ TrxID দিন!'); return; }
    showToast('⏳ সাবমিট হচ্ছে...');
    await gsWrite('Customers', { ...regData, timestamp: new Date().toISOString(), status: 'pending' });
    showToast('✅ রেজিস্ট্রেশন সফল!');
    setCurrentSection('dashboard');
  };

  const handleAgentRegistration = async () => {
    if (!agRegData.trxId) { showToast('⚠️ TrxID দিন!'); return; }
    showToast('⏳ সাবমিট হচ্ছে...');
    await gsWrite('Agents', { ...agRegData, timestamp: new Date().toISOString(), status: 'pending' });
    showToast('✅ আবেদন সফল! অ্যাডমিন যাচাই করবেন।');
    setCurrentSection('dashboard');
  };

  const redeemPoints = async (pts: number) => {
    const balance = pointHistory.reduce((s,r)=>s+(parseInt(r.points)||0),0);
    if (balance < pts) { showToast('⚠️ পর্যাপ্ত পয়েন্ট নেই!'); return; }
    showToast('⏳ রিডিম হচ্ছে...');
    await gsWrite('PointLedger', { cardId: user.cardId, points: -pts, type: 'redeem', description: `Redeemed ${pts} pts`, timestamp: new Date().toISOString() });
    showToast(`✅ ${pts} পয়েন্ট রিডিম সফল!`);
    loadCustomerData(user.cardId);
  };

  // --- Main Render ---
  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-yellow-400 selection:text-black">
      {/* Background Glow */}
      <div className="fixed top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px] rounded-full -z-10" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-yellow-600/5 blur-[120px] rounded-full -z-10" />

      <Nav />
      <Sidebar />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ y: -50, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: -50, opacity: 0, x: '-50%' }}
            className="fixed top-24 left-1/2 z-[300] bg-yellow-400 text-black px-8 py-3 rounded-full font-bold shadow-2xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* SMS Alert */}
      <AnimatePresence>
        {smsAlert && (
          <motion.div 
            initial={{ y: -20, opacity: 0, x: '-50%' }}
            animate={{ y: 0, opacity: 1, x: '-50%' }}
            exit={{ y: -20, opacity: 0, x: '-50%' }}
            className="fixed top-20 left-1/2 z-[310] w-[90vw] max-w-[400px]"
          >
            <div className={`p-4 rounded-2xl border backdrop-blur-xl flex items-start gap-3 shadow-2xl ${smsAlert.isSuccess ? 'border-emerald-500/40 bg-emerald-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${smsAlert.isSuccess ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                <Bell className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[10px] font-black uppercase tracking-widest ${smsAlert.isSuccess ? 'text-emerald-400' : 'text-red-400'}`}>Savelo Neo — নোটিফিকেশন</p>
                <p className="text-sm font-bold text-white mt-0.5 leading-snug">{smsAlert.text}</p>
                <p className="text-[10px] text-gray-400 mt-1">{smsAlert.time}</p>
              </div>
              <button onClick={() => setSmsAlert(null)} className="text-gray-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {currentSection === 'home' && <HomeSection />}
        {currentSection === 'buy' && <BuySection />}
        {currentSection === 'agent' && <AgentSection />}
        
        {currentSection === 'shops' && (
          <div className="space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-4xl font-bold text-yellow-400 italic">পার্টনার শপ</h2>
                <p className="text-gray-400 text-sm mt-1">আমাদের সকল পার্টনার শপ এবং ডিসকাউন্ট অফারসমূহ।</p>
              </div>
              <button onClick={() => gsRead('Agents').then(data => data && setApprovedAgents(data.filter((a:any)=>a.status==='active')))} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-yellow-400"><Loader className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {approvedAgents.length > 0 ? approvedAgents.map((agent, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-6 group hover:border-yellow-400/30 transition-all"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-bold">{agent.shopName}</h4>
                      <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-yellow-400" /> {agent.shopAddress || 'গাইবান্ধা'}
                      </p>
                    </div>
                    <div className="bg-yellow-400/10 text-yellow-400 text-[10px] font-black px-3 py-1 rounded-full border border-yellow-400/20">
                      {agent.discountRate || 10}% OFF
                    </div>
                  </div>
                  <div className="h-px bg-white/5 w-full" />
                  <p className="text-[10px] text-gray-500 leading-relaxed italic">
                    {agent.shopType} ক্যাটাগরিতে সাভেলো নিও কার্ড হোল্ডারদের জন্য আকর্ষণীয় ডিসকাউন্ট প্রযোজ্য।
                  </p>
                  {agent.lat && agent.lng ? (
                    <button 
                      onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${agent.lat},${agent.lng}`)} 
                      className="w-full py-4 bg-white/5 rounded-xl text-[10px] font-bold uppercase hover:bg-yellow-400 hover:text-black transition-all flex items-center justify-center gap-2"
                    >
                      <MapPin className="w-3 h-3" /> লোকেশন দেখে দোকানে যান
                    </button>
                  ) : (
                    <div className="w-full py-4 bg-white/5 rounded-xl text-[10px] font-bold uppercase text-gray-500 text-center">লোকেশন পাওয়া যায়নি</div>
                  )}
                </motion.div>
              )) : (
                <div className="col-span-full py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                    <Store className="w-8 h-8 text-gray-600" />
                  </div>
                  <p className="text-gray-500 italic">বর্তমানে কোনো পার্টনার শপ পাওয়া যায়নি।</p>
                </div>
              )}
            </div>
          </div>
        )}

        {currentSection === 'krishiBazar' && (
          <div className="space-y-8">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 mx-auto rounded-3xl bg-green-500/10 flex items-center justify-center">
                <span className="text-4xl">🌾</span>
              </div>
              <h2 className="text-4xl md:text-5xl font-black text-green-400">{settings.krishiTitle}</h2>
              <p className="text-gray-400 max-w-xl mx-auto text-sm">{settings.krishiDesc}</p>
            </div>
            
            <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 p-8 rounded-[2.5rem] space-y-6">
              <div className="flex items-center gap-3">
                <ShieldCheck className="text-green-400 w-6 h-6" />
                <span className="text-[10px] font-black uppercase tracking-widest text-green-400 bg-green-500/15 px-3 py-1 rounded-full">কার্ডধারীদের এক্সক্লুসিভ সুবিধা</span>
              </div>
              <h3 className="text-2xl font-black text-white leading-tight">সরাসরি কৃষকের কাছ থেকে<br /><span className="text-green-400">ন্যায্যমূল্যে পণ্য নেওয়ার সুযোগ!</span></h3>
              <button onClick={() => window.open(settings.krishiUrl, '_blank')} className="w-full flex items-center justify-center gap-3 bg-green-500/20 border-2 border-green-500/40 text-green-400 font-black py-5 rounded-2xl hover:bg-green-500/30 transition-all text-sm uppercase tracking-widest">
                <Sprout className="w-5 h-5" /> {settings.krishiBtnText} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {currentSection === 'dashboard' && !isLoggedIn && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-full max-w-sm space-y-6">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-yellow-400/10 flex items-center justify-center">
                  <span className="text-xl font-black text-yellow-400">SN</span>
                </div>
                <h2 className="text-xl font-black">Savelo <span className="text-yellow-400">Neo</span></h2>
                <p className="text-[11px] text-gray-500">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>
              </div>

              <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 gap-1">
                <button onClick={() => setLoginType('customer')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${loginType === 'customer' ? 'bg-yellow-400/20 text-yellow-400 border border-yellow-400/30' : 'text-gray-400'}`}>
                  <Users className="w-4 h-4" /> কাস্টমার
                </button>
                <button onClick={() => setLoginType('agent')} className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${loginType === 'agent' ? 'bg-teal-500/20 text-teal-400 border border-teal-500/30' : 'text-gray-400'}`}>
                  <Store className="w-4 h-4" /> এজেন্ট
                </button>
              </div>

              <div className="bg-white/5 border border-white/10 p-8 rounded-3xl space-y-5">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">মোবাইল নম্বর</label>
                  <input type="tel" id="loginPhone" placeholder="01XXXXXXXXX" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-yellow-400 font-bold" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block">৪ সংখ্যার পিন</label>
                  <input type="password" id="loginPin" maxLength={4} placeholder="••••" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-yellow-400 text-center text-2xl tracking-widest font-bold" />
                </div>
                <button 
                  onClick={() => handleLogin((document.getElementById('loginPhone') as HTMLInputElement).value, (document.getElementById('loginPin') as HTMLInputElement).value)} 
                  className="w-full bg-gradient-to-r from-yellow-200 to-yellow-500 text-black font-black py-4 rounded-2xl text-sm uppercase tracking-widest"
                >
                  প্রবেশ করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {currentSection === 'dashboard' && isLoggedIn && user.role === 'customer' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-yellow-400 text-black flex items-center justify-center font-black text-lg">{(user.name || 'K').charAt(0)}</div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">স্বাগতম</p>
                  <h2 className="text-xl font-black text-yellow-400">{user.name}</h2>
                </div>
              </div>
              <button onClick={() => setIsLoggedIn(false)} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-red-400 transition-colors"><LogOut className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <p className="text-[10px] text-gray-500 uppercase font-bold">Membership</p>
                <p className="text-lg font-black text-yellow-400 mt-1">{user.cardType}</p>
                <p className="text-[10px] text-emerald-400">Expires: {user.expires}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">Card ID</p>
                  <p className="text-lg font-mono font-bold text-yellow-400 mt-1">{user.cardId}</p>
                </div>
                <Copy className="w-5 h-5 text-gray-500 cursor-pointer hover:text-yellow-400" onClick={() => { navigator.clipboard.writeText(user.cardId); showToast('Copied!'); }} />
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <p className="text-[10px] text-gray-500 uppercase font-bold">মোট সাশ্রয়</p>
                <p className="text-2xl font-black text-emerald-400 mt-1">৳ {txHistory.reduce((s,r)=>s+(parseFloat(r.discountAmount)||0),0).toLocaleString('bn-BD')}</p>
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {['myCard', 'scanQR', 'history', 'pointWallet'].map(tab => (
                <button key={tab} onClick={() => setActiveDashTab(tab)} className={`px-6 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeDashTab === tab ? 'bg-yellow-400 text-black' : 'bg-white/5 text-gray-400'}`}>
                  {tab === 'myCard' && 'আমার কার্ড'}
                  {tab === 'scanQR' && 'QR স্ক্যান'}
                  {tab === 'history' && 'লেনদেন'}
                  {tab === 'pointWallet' && 'পয়েন্ট'}
                </button>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
              {activeDashTab === 'myCard' && (
                <div className="text-center space-y-6">
                  <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl shadow-yellow-400/10">
                    <QRCodeCanvas value={user.cardId} size={200} />
                  </div>
                  <p className="text-sm text-gray-400 font-bold">আপনার কার্ড QR কোড</p>
                  <div className="bg-black/30 p-4 rounded-2xl flex justify-between items-center max-w-sm mx-auto">
                    <span className="font-mono text-yellow-400 font-bold">{user.cardId}</span>
                    <span className="text-xs text-gray-500">{user.cardType}</span>
                  </div>
                </div>
              )}
              {activeDashTab === 'history' && (
                <div className="space-y-4">
                  <h3 className="font-bold text-gray-400 uppercase tracking-widest text-xs">সাম্প্রতিক লেনদেন</h3>
                  {txHistory.length === 0 ? (
                    <p className="text-center text-gray-500 py-10">কোনো লেনদেন পাওয়া যায়নি।</p>
                  ) : (
                    txHistory.map((tx, i) => (
                      <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl">
                        <div>
                          <p className="font-bold">{tx.agentId}</p>
                          <p className="text-[10px] text-gray-500">{tx.timestamp.slice(0,10)} — {tx.discountRate}</p>
                        </div>
                        <span className="text-emerald-400 font-bold">-৳ {tx.discountAmount}</span>
                      </div>
                    ))
                  )}
                </div>
              )}
              {activeDashTab === 'pointWallet' && (
                <div className="space-y-6">
                  <div className="bg-gradient-to-br from-yellow-400/10 to-purple-500/5 p-8 rounded-3xl border border-yellow-400/20 space-y-5">
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest">মোট পয়েন্ট ব্যালেন্স</p>
                    <div className="flex items-end gap-2 mt-2">
                      <h2 className="text-5xl font-black text-yellow-400">{pointHistory.reduce((s,r)=>s+(parseInt(r.points)||0),0).toLocaleString('bn-BD')}</h2>
                      <span className="text-sm text-gray-400 mb-1">pts</span>
                    </div>
                    <p className="text-xs text-emerald-400 mt-1">≈ ৳ {(pointHistory.reduce((s,r)=>s+(parseInt(r.points)||0),0)/10).toLocaleString('bn-BD')} সমমান</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {[100, 500, 1000].map(pts => (
                      <button key={pts} onClick={() => redeemPoints(pts)} className="p-4 bg-white/5 border border-white/10 rounded-xl text-center hover:border-purple-500/40 transition-all">
                        <p className="text-lg font-black text-purple-400">{pts}</p>
                        <p className="text-[10px] text-gray-400 mt-1">pts = ৳{pts/10}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentSection === 'dashboard' && isLoggedIn && user.role === 'agent' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-teal-500 text-black flex items-center justify-center font-black text-lg">{(user.shopName || 'S').charAt(0)}</div>
                <div>
                  <p className="text-[10px] text-gray-400 uppercase tracking-widest">এজেন্ট প্যানেল</p>
                  <h2 className="text-xl font-black text-teal-400">{user.shopName}</h2>
                </div>
              </div>
              <button onClick={() => setIsLoggedIn(false)} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-red-400 transition-colors"><LogOut className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <p className="text-[10px] text-gray-500 uppercase font-bold">আজকের লেনদেন</p>
                <p className="text-2xl font-black text-teal-400 mt-1">১২ টি</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl">
                <p className="text-[10px] text-gray-500 uppercase font-bold">মোট ডিসকাউন্ট</p>
                <p className="text-2xl font-black text-yellow-400 mt-1">৳ ৫,৬৮০</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-3xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase font-bold">স্ট্যাটাস</p>
                  <p className="text-lg font-black text-emerald-400 mt-1">Active ✓</p>
                </div>
                <ShieldCheck className="text-emerald-400 w-8 h-8" />
              </div>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {['verifyCard', 'applyDiscount', 'agentQR', 'agentHistory'].map(tab => (
                <button key={tab} onClick={() => setActiveAgentTab(tab)} className={`px-6 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeAgentTab === tab ? 'bg-teal-500 text-black' : 'bg-white/5 text-gray-400'}`}>
                  {tab === 'verifyCard' && 'কার্ড স্ক্যান'}
                  {tab === 'applyDiscount' && 'ডিসকাউন্ট'}
                  {tab === 'agentQR' && 'আমার QR'}
                  {tab === 'agentHistory' && 'ইতিহাস'}
                </button>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
              {activeAgentTab === 'verifyCard' && (
                <div className="space-y-6">
                  <h3 className="font-bold text-lg">কাস্টমারের কার্ড স্ক্যান করুন</h3>
                  <div className="rounded-2xl overflow-hidden bg-black/30 border border-white/5">
                    <div id="agent-qr-reader" className="min-h-[200px]" />
                  </div>
                  <div className="flex gap-3">
                    <button onClick={startAgentScanner} className="flex-1 bg-teal-500/20 border border-teal-500/40 text-teal-400 font-bold py-3 rounded-xl text-sm flex items-center justify-center gap-2"><Camera className="w-4 h-4" /> স্ক্যানার চালু</button>
                    <button onClick={stopScanner} className="flex-1 bg-white/5 border border-white/10 py-3 rounded-xl text-sm font-bold hover:bg-white/10 flex items-center justify-center gap-2"><VideoOff className="w-4 h-4" /> বন্ধ করুন</button>
                  </div>
                </div>
              )}
              {activeAgentTab === 'agentQR' && (
                <div className="text-center space-y-6">
                  <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl shadow-teal-400/10">
                    <QRCodeCanvas value={user.agentId || user.phone} size={200} />
                  </div>
                  <p className="text-sm text-gray-400 font-bold">আপনার দোকানের QR কোড</p>
                  <div className="bg-black/30 p-4 rounded-2xl flex justify-between items-center max-w-sm mx-auto">
                    <span className="font-mono text-teal-400 font-bold">{user.agentId || user.phone}</span>
                    <span className="text-xs text-gray-500">Agent</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {currentSection === 'admin' && !adminUser && (
          <div className="max-w-md mx-auto py-20 space-y-8">
            <div className="text-center space-y-2">
              <ShieldAlert className="w-16 h-16 mx-auto text-red-500 mb-4" />
              <h2 className="text-3xl font-black uppercase tracking-widest text-red-500">Admin Access</h2>
              <p className="text-xs text-gray-500">শুধুমাত্র অথরাইজড ব্যক্তির জন্য</p>
            </div>
            <div className="bg-white/5 border border-red-500/20 p-8 rounded-[2.5rem] space-y-5">
              <input type="text" id="adminUser" placeholder="Username" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-red-500" />
              <input type="password" id="adminPass" placeholder="Password" className="w-full bg-white/5 border border-white/10 p-4 rounded-xl outline-none focus:border-red-500" />
              <button 
                onClick={() => handleAdminLogin((document.getElementById('adminUser') as HTMLInputElement).value, (document.getElementById('adminPass') as HTMLInputElement).value)}
                className="w-full bg-red-500/20 border border-red-500/40 text-red-500 font-black py-4 rounded-xl hover:bg-red-500/30 transition-all uppercase tracking-widest"
              >
                প্রবেশ করুন
              </button>
            </div>
          </div>
        )}

        {currentSection === 'admin' && adminUser && (
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-500/20 flex items-center justify-center text-red-500"><Crown /></div>
                <div>
                  <h2 className="text-2xl font-black text-red-400">{adminUser.name}</h2>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest">👑 Super Admin</p>
                </div>
              </div>
              <button onClick={() => setAdminUser(null)} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-red-400 transition-colors"><LogOut className="w-5 h-5" /></button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <AdminStatCard label="মোট কার্ড" value={stats.totalCards || 0} color="yellow" />
              <AdminStatCard label="অ্যাক্টিভ এজেন্ট" value={stats.activeAgents || 0} color="teal" />
              <AdminStatCard label="মোট ডিসকাউন্ট" value={`৳ ${(stats.totalDiscount || 0).toLocaleString()}`} color="emerald" />
              <AdminStatCard label="মোট আয়" value={`৳ ${(stats.totalRevenue || 0).toLocaleString()}`} color="purple" />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-2">
              {adminUser.permissions.map((tab: AdminTab) => (
                <button key={tab} onClick={() => setActiveAdminTab(tab)} className={`px-6 py-3 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${activeAdminTab === tab ? 'bg-red-500 text-white' : 'bg-white/5 text-gray-400'}`}>
                  {tab === 'allCards' && 'সব কার্ড'}
                  {tab === 'agentApprovals' && 'এজেন্ট অ্যাপ্রুভাল'}
                  {tab === 'addCard' && 'কার্ড যোগ/ব্লক'}
                  {tab === 'editLanding' && 'ল্যান্ডিং পেজ এডিট'}
                  {tab === 'editCustomers' && 'কাস্টমার এডিট'}
                  {tab === 'editAgents' && 'এজেন্ট এডিট'}
                  {tab === 'adminStats' && 'স্ট্যাটিস্টিক্স'}
                  {tab === 'manageAdmins' && 'অ্যাডমিন ম্যানেজ'}
                </button>
              ))}
            </div>

            <div className="bg-white/5 border border-white/10 p-8 rounded-[2.5rem]">
              {activeAdminTab === 'editLanding' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <h3 className="font-bold text-yellow-400 flex items-center gap-2"><Type className="w-5 h-5" /> Hero সেকশন</h3>
                    <input value={settings.hero1} onChange={e => setSettings({...settings, hero1: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl" placeholder="হেডলাইন লাইন ১" />
                    <input value={settings.hero2} onChange={e => setSettings({...settings, hero2: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl" placeholder="হেডলাইন লাইন ২" />
                    <textarea value={settings.subtitle} onChange={e => setSettings({...settings, subtitle: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl h-24" placeholder="সাবটাইটেল" />
                    <button onClick={() => { gsWrite('SiteSettings', { key: 'heroSection', heroLine1: settings.hero1, heroLine2: settings.hero2, subtitle: settings.subtitle }); showToast('Saved!'); }} className="w-full bg-yellow-400 text-black font-bold py-3 rounded-xl">Save Hero</button>
                  </div>
                  <div className="space-y-4">
                    <h3 className="font-bold text-green-400 flex items-center gap-2"><Sprout className="w-5 h-5" /> কৃষক বাজার লিংক</h3>
                    <input value={settings.krishiUrl} onChange={e => setSettings({...settings, krishiUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl" placeholder="URL" />
                    <input value={settings.krishiBtnText} onChange={e => setSettings({...settings, krishiBtnText: e.target.value})} className="w-full bg-white/5 border border-white/10 p-3 rounded-xl" placeholder="Button Text" />
                    <button onClick={() => { gsWrite('SiteSettings', { key: 'krishiBazar', krishiUrl: settings.krishiUrl, krishiBtnText: settings.krishiBtnText }); showToast('Saved!'); }} className="w-full bg-green-500 text-black font-bold py-3 rounded-xl">Save Krishi Settings</button>
                  </div>
                </div>
              )}
              {activeAdminTab === 'allCards' && (
                <div className="space-y-4">
                   <div className="flex justify-between items-center">
                     <h3 className="font-bold text-gray-400 uppercase text-xs">কার্ড হোল্ডার লিস্ট</h3>
                     <div className="flex gap-2">
                        <input placeholder="Search..." className="bg-white/5 border border-white/10 p-2 rounded-lg text-sm" />
                        <button onClick={loadAdminData} className="p-2 bg-white/5 rounded-lg"><History className="w-4 h-4" /></button>
                     </div>
                   </div>
                   <div className="space-y-2">
                     {adminCards.map((card, i) => (
                       <div key={i} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-white/10 transition-all">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center text-yellow-400 font-bold">{card.name.charAt(0)}</div>
                           <div>
                             <p className="font-bold text-sm">{card.name}</p>
                             <p className="text-[10px] text-gray-500">{card.cardId} • {card.cardType}</p>
                           </div>
                         </div>
                         <div className="flex items-center gap-3">
                           <span className={`text-[10px] px-2 py-1 rounded-full font-bold ${card.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>{card.status}</span>
                           <button className="p-2 text-gray-500 hover:text-red-400"><Ban className="w-4 h-4" /></button>
                         </div>
                       </div>
                     ))}
                   </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Mobile Bottom Bar */}
      {isLoggedIn && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/90 backdrop-blur-xl border-t border-white/10 flex items-center px-4 py-3 justify-around">
          <button onClick={() => setActiveDashTab('myCard')} className={`flex flex-col items-center gap-1 ${activeDashTab === 'myCard' ? 'text-yellow-400' : 'text-gray-500'}`}>
            <CreditCard className="w-5 h-5" />
            <span className="text-[9px] font-bold">কার্ড</span>
          </button>
          <button onClick={() => setActiveDashTab('scanQR')} className={`flex flex-col items-center gap-1 ${activeDashTab === 'scanQR' ? 'text-yellow-400' : 'text-gray-500'}`}>
            <ScanLine className="w-5 h-5" />
            <span className="text-[9px] font-bold">স্ক্যান</span>
          </button>
          <button onClick={() => setActiveDashTab('history')} className={`flex flex-col items-center gap-1 ${activeDashTab === 'history' ? 'text-yellow-400' : 'text-gray-500'}`}>
            <History className="w-5 h-5" />
            <span className="text-[9px] font-bold">লেনদেন</span>
          </button>
          <button onClick={() => setActiveDashTab('pointWallet')} className={`flex flex-col items-center gap-1 ${activeDashTab === 'pointWallet' ? 'text-yellow-400' : 'text-gray-500'}`}>
            <Wallet className="w-5 h-5" />
            <span className="text-[9px] font-bold">পয়েন্ট</span>
          </button>
        </div>
      )}
    </div>
  );
}

function AdminStatCard({ label, value, color }: { label: string, value: any, color: string }) {
  const colors: any = {
    yellow: 'border-yellow-400/10 text-yellow-400',
    teal: 'border-teal-500/10 text-teal-400',
    emerald: 'border-emerald-500/10 text-emerald-400',
    purple: 'border-purple-500/10 text-purple-400'
  };
  return (
    <div className={`bg-white/5 border p-5 rounded-3xl ${colors[color]}`}>
      <p className="text-[10px] uppercase text-gray-500 font-bold tracking-widest">{label}</p>
      <h3 className="text-2xl font-black mt-1">{value}</h3>
    </div>
  );
}
