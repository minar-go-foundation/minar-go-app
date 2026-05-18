
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { User, signOut } from "firebase/auth";
import { auth, database } from "@/lib/firebase";
import { ref, onValue, query, limitToLast, onChildAdded } from "firebase/database";
import { 
  LogOut, 
  Plus, 
  Home, 
  Users, 
  Image as ImageIcon, 
  RotateCcw,
  User as UserIcon,
  Settings,
  CloudSun,
  ClipboardCheck,
  Clock,
  ShieldCheck,
  Video,
  MessageSquare,
  Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MemberManager from "./member-manager";
import TransactionManager from "./transaction-manager";
import DocStorage from "./doc-storage";
import LogoManager from "./logo-manager";
import ChatScreen from "./chat-screen";
import VideoCall from "./video-call";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { format, differenceInDays, isAfter } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-FD96Fos4HsBOHEhs3mG50CyZe4tPWmYsyiam5KL7w7BekgvgrsM8vFYP2GK-FOCG/exec";
const SPREADSHEET_ID = "1tejHpkOfJR0vJZbEhM8NAeXUFrcibX7neGJHEAJd6fc";

const APP_SYSTEM_PROFILE = `
MINAR GO EXPATRIATE DEVELOPMENT FOUNDATION - SYSTEM PROFILE

[ ১. ব্র্যান্ডিং ও ডিজাইন (Identity) ]
- নাম: মিনার গো এক্সপ্যাট্রিয়েট ডেভেলপমেন্ট ফাউন্ডেশন
- থিম: নেভি ব্লু (#002366) ও প্রিমিয়াম গোল্ড (#C4A052)
- ফন্ট: ইন্টার (ইংরেজি) এবং নটো সানস বেঙ্গলি (বাংলা)
- স্টাইল: মডার্ন কার্ড-বেসড ডিজাইন, রাউন্ডেড কর্নার এবং গ্লাস-মর্ফিজম।

[ ২. নিরাপত্তা (Security) ]
- ওটিপি ভেরিফিকেশন: Nodemailer ও Gmail SMTP ব্যবহার করে সরাসরি ইমেইলে ৬-ডিজিটের কোড।
- সিকিউরিটি লকআউট: হেডারে সরাসরি দ্রুত লগআউট বাটন।
- ভিডিও কল: ZegoCloud UIKit এনক্রিপ্টেড গেটওয়ে।

[ ৩. ম্যানেজমেন্ট (Management) ]
- মেম্বার ডিরেক্টরি: রিয়েল-টাইম মেম্বার ডাটাবেজ (Add/Remove)।
- ট্রানজ্যাকশন লগ: প্রতি মাসের আলাদা হিসাব এবং অটোমেটিক মান্থলি ফিল্টার।
- ডিজিটাল গ্যালারি: ৫ মেগাবাইট পর্যন্ত ফাইল আপলোড ও স্টোরেজ সুবিধা।

[ ৪. অটোমেশন ও ডাইনামিক ফিচার ]
- লাইভ ক্লক: হেডারে প্রতি সেকেন্ডে আপডেট হওয়া ডিজিটাল ঘড়ি।
- স্মার্ট কাউন্টডাউন: হজ্জ ও রমাদানের তারিখ সয়ংক্রিয়ভাবে পরবর্তী বছরের জন্য আপডেট হয়।
- ক্লাউড ব্যাকআপ: গুগল শিটে নির্ভুল তারিখ ও সময়ের স্ট্যাম্পসহ সয়ংক্রিয় ব্যাকআপ।

[ ৫. কমিউনিকেশন ]
- অ্যাডমিন চ্যাট: ফাউন্ডেশনের কর্মকর্তাদের জন্য নিরাপদ রিয়েল-টাইম চ্যাট রুম।
- ভিডিও কানেক্ট: হাই-ডেফিনিশন ভিডিও ও অডিও কনফারেন্সিং।
`.trim();

type Tab = "home" | "members" | "chat" | "gallery" | "setting" | "call";

export interface MGMember {
  id: string;
  name: string;
}

const GET_NEXT_DATE = (baseDate: Date) => {
  const now = new Date();
  let target = baseDate;
  while (isAfter(now, target)) {
    target = new Date(target.getFullYear() + 1, target.getMonth(), target.getDate() - 11);
  }
  return target;
};

export default function DashboardScreen({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [members, setMembers] = useState<MGMember[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [logo, setLogo] = useState<string | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [weather, setWeather] = useState({ city: "Detecting...", temp: "--" });
  const [backupLoading, setBackupLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const { toast } = useToast();
  
  const isInitialLoad = useRef(true);

  const nextHajj = useMemo(() => GET_NEXT_DATE(new Date("2026-05-25")), []);
  const nextRamadan = useMemo(() => GET_NEXT_DATE(new Date("2026-02-18")), []);

  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const data = await res.json();
          setWeather({ city: "Live", temp: Math.round(data.current_weather.temperature).toString() });
        } catch (e) {
          setWeather({ city: "Global", temp: "26" });
        }
      }, () => setWeather({ city: "Global", temp: "24" }));
    }

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const transRef = ref(database, "transactions");
    const unsubscribeTrans = onValue(transRef, (snapshot) => {
      const list: any[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => { list.push({ id: child.key, ...child.val() }); });
        setTransactions(list);
      }
    });

    const notifyQuery = query(ref(database, "transactions"), limitToLast(1));
    const unsubscribeNotify = onChildAdded(notifyQuery, (snapshot) => {
      if (isInitialLoad.current) { isInitialLoad.current = false; return; }
      const data = snapshot.val();
      if (data) {
        new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play().catch(() => {});
        toast({ title: "নতুন জমা হয়েছে! 🔔", description: `${data.n} থেকে ৳${data.a} জমা হয়েছে।` });
      }
    });

    const membersRef = ref(database, "members");
    const unsubscribeMembers = onValue(membersRef, (snapshot) => {
      const list: MGMember[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => { list.push({ id: child.key!, name: child.val().name }); });
        setMembers(list);
      }
    });

    const storedLogo = localStorage.getItem("mg_logo");
    if (storedLogo) setLogo(storedLogo);

    return () => {
      unsubscribeMembers();
      unsubscribeTrans();
      unsubscribeNotify();
    };
  }, [toast]);

  const dashboardTotal = useMemo(() => {
    if (filterMonth === "All") return transactions.reduce((acc, curr) => acc + (parseFloat(curr.a) || 0), 0);
    return transactions.reduce((acc, curr) => {
      const tDate = new Date(curr.d);
      if (MONTHS[tDate.getMonth()] === filterMonth) return acc + (parseFloat(curr.a) || 0);
      return acc;
    }, 0);
  }, [transactions, filterMonth]);

  const handleCloudBackup = async () => {
    setBackupLoading(true);
    const now = new Date();
    const rows = transactions.map(t => [t.n, t.d, t.a]);
    rows.unshift([`--- BACKUP SESSION: ${format(now, "dd/MM/yyyy HH:mm:ss")} ---`, "", ""]);
    rows.push(["TOTAL FOUNDATION ASSETS", "", dashboardTotal.toLocaleString()]);

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ spreadsheetId: SPREADSHEET_ID, rows: rows })
      });
      toast({ title: "ব্যাকআপ সফল হয়েছে!", description: "ডাটা এখন গুগল শিটে সংরক্ষিত।" });
    } catch (error) {
      toast({ title: "ব্যাকআপ ব্যর্থ", variant: "destructive" });
    } finally { setBackupLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col font-body pb-32">
      <header className="px-6 py-4 flex items-center justify-between bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07)] sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <div className="relative w-11 h-11 rounded-xl border border-primary/10 flex items-center justify-center overflow-hidden shadow-sm transition-transform active:scale-95 cursor-pointer" onClick={() => setActiveTab("setting")}>
            {logo ? <Image src={logo} alt="Logo" fill className="object-cover" /> : <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black">MG</div>}
          </div>
          <div className="flex flex-col">
            <h1 className="text-[11px] font-[900] text-primary uppercase tracking-tight leading-none mb-1">
              MINAR GO FOUNDATION
            </h1>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <CloudSun className="h-3 w-3 text-secondary" />
                <span className="text-[10px] font-bold text-secondary">{weather.temp}°C</span>
              </div>
              <div className="h-3 w-[1px] bg-slate-200" />
              {currentTime && (
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-black text-primary">
                    {format(currentTime, "hh:mm:ss a")}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 bg-red-50 hover:bg-red-100 rounded-xl group transition-all" 
            onClick={() => {
              signOut(auth);
              toast({title: "Security Lockout", description: "You have been securely logged out."});
            }}
            title="Security Lockout"
          >
            <Lock className="h-5 w-5 text-red-500 group-hover:scale-110 transition-transform" />
          </Button>
          <div className="h-8 w-[1px] bg-slate-100 mx-1" />
          <div className="w-10 h-10 bg-slate-100 rounded-xl border border-slate-100 shadow-sm flex items-center justify-center overflow-hidden">
             {user.photoURL ? <Image src={user.photoURL} alt="Profile" width={40} height={40} className="object-cover" /> : <UserIcon className="h-5 w-5 text-slate-400" />}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 container max-w-lg mx-auto">
        {activeTab === "home" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Today's Date</p>
              <h2 className="text-sm font-black text-primary tracking-tight">
                {currentTime ? format(currentTime, "EEEE, MMMM dd") : "Loading..."}
              </h2>
            </div>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-primary overflow-hidden relative group p-1">
              <CardContent className="p-8 text-center relative z-10">
                <p className="text-[10px] uppercase font-black text-accent tracking-[0.3em] mb-4">
                  {filterMonth === "All" ? "Total Assets" : `${filterMonth} Assets`}
                </p>
                <h3 className="text-4xl font-black text-white mb-2">৳{dashboardTotal.toLocaleString()}</h3>
                <div className="flex justify-center items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Active System</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-primary rounded-[2.2rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="text-[8px] font-black uppercase text-accent tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="w-1 h-1 bg-accent rounded-full" /> Hajj Countdown
                </div>
                <h4 className="text-xs font-bold leading-tight">
                  {format(nextHajj, "dd MMMM yyyy")}<br/>
                  <span className="text-lg font-black text-accent">
                    {differenceInDays(nextHajj, new Date())} Days
                  </span>
                </h4>
              </div>
              <div className="p-6 bg-white rounded-[2.2rem] border border-slate-100 shadow-xl relative overflow-hidden">
                <div className="text-[8px] font-black uppercase text-primary tracking-[0.2em] mb-3 flex items-center gap-2">
                   <div className="w-1 h-1 bg-primary rounded-full" /> Ramadan Countdown
                </div>
                <h4 className="text-xs font-bold leading-tight text-slate-500">
                  {format(nextRamadan, "dd MMMM yyyy")}<br/>
                  <span className="text-lg font-black text-primary">
                    {differenceInDays(nextRamadan, new Date())} Days
                  </span>
                </h4>
              </div>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-50">
              <TransactionManager members={members} transactions={transactions} mode="summary" filterMonth={filterMonth} onFilterMonthChange={setFilterMonth} />
            </div>
          </div>
        )}

        {activeTab === "members" && <MemberManager members={members} />}
        {activeTab === "chat" && <ChatScreen user={user} />}
        {activeTab === "call" && <VideoCall user={user} />}
        {activeTab === "gallery" && <DocStorage />}
        {activeTab === "setting" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 blur-3xl" />
              <div className="flex flex-col items-center gap-8 relative z-10">
                <div className="p-6 bg-slate-50 rounded-[2rem] w-full flex flex-col items-center gap-4 border border-slate-100">
                  <LogoManager currentLogo={logo} onUpdate={setLogo} />
                  <div className="text-center">
                    <h3 className="font-black text-primary uppercase text-lg tracking-tight">Admin System</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Foundation Settings</p>
                  </div>
                </div>

                <div className="w-full space-y-3">
                   <Button className="w-full h-14 rounded-2xl font-black bg-[#E8F5E9] text-[#2E7D32] border-none shadow-md hover:bg-[#C8E6C9] flex items-center justify-center gap-3" onClick={handleCloudBackup} disabled={backupLoading}>
                     {backupLoading ? <RotateCcw className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />} GOOGLE CLOUD BACKUP
                   </Button>
                   <Button variant="outline" className="w-full h-14 rounded-2xl font-black border-slate-200" onClick={() => setActiveTab("gallery")}>
                     <ImageIcon className="mr-2 h-5 w-5" /> DIGITAL VAULT
                   </Button>
                   <Button variant="destructive" className="w-full h-14 rounded-2xl font-black shadow-xl mt-4" onClick={() => signOut(auth)}>
                    <LogOut className="mr-2 h-5 w-5" /> SECURE LOGOUT
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-primary/10 rounded-xl"><ShieldCheck className="h-5 w-5 text-primary" /></div>
                 <div>
                   <h4 className="text-xs font-black uppercase text-primary tracking-tight">System Profile</h4>
                   <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Full Feature Report</p>
                 </div>
               </div>
               <div className="relative group">
                 <Textarea 
                   readOnly 
                   value={APP_SYSTEM_PROFILE} 
                   className="h-80 rounded-2xl bg-slate-50 border-none text-[10px] font-medium leading-relaxed mb-4 scrollbar-hide focus:ring-0" 
                 />
                 <div className="absolute inset-0 bg-gradient-to-t from-slate-50/50 to-transparent pointer-events-none h-12 bottom-4 rounded-b-2xl" />
               </div>
               <Button 
                variant="outline" 
                className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 border-slate-200" 
                onClick={() => {
                  navigator.clipboard.writeText(APP_SYSTEM_PROFILE); 
                  toast({title: "Report Copied!", description: "System profile has been copied to clipboard."})
                }}
               >
                 <ClipboardCheck className="h-4 w-4" /> Copy System Report
               </Button>
            </Card>
          </div>
        )}
      </main>

      {/* Unique Dynamic Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 w-full px-4 pb-8 z-50 pointer-events-none">
        <div className="max-w-md mx-auto relative pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-[0_15px_50px_-12px_rgba(0,35,102,0.25)] border border-slate-100 flex items-center justify-between px-3 py-3 ring-1 ring-black/5">
            
            <div className="flex items-center justify-around flex-1">
              <button 
                onClick={() => setActiveTab("home")} 
                className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 active:scale-75 hover:-translate-y-1 ${activeTab === "home" ? "text-primary scale-110" : "text-slate-300"}`}
              >
                <Home className={`h-7 w-7 transition-all ${activeTab === "home" ? "stroke-[3px] drop-shadow-md" : "stroke-[2px]"}`} />
                <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${activeTab === "home" ? "opacity-100" : "opacity-60"}`}>Home</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("members")} 
                className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 active:scale-75 hover:-translate-y-1 ${activeTab === "members" ? "text-primary scale-110" : "text-slate-300"}`}
              >
                <Users className={`h-7 w-7 transition-all ${activeTab === "members" ? "stroke-[3px] drop-shadow-md" : "stroke-[2px]"}`} />
                <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${activeTab === "members" ? "opacity-100" : "opacity-60"}`}>Members</span>
              </button>

              <button 
                onClick={() => setActiveTab("chat")} 
                className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 active:scale-75 hover:-translate-y-1 ${activeTab === "chat" ? "text-primary scale-110" : "text-slate-300"}`}
              >
                <MessageSquare className={`h-7 w-7 transition-all ${activeTab === "chat" ? "stroke-[3px] drop-shadow-md" : "stroke-[2px]"}`} />
                <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${activeTab === "chat" ? "opacity-100" : "opacity-60"}`}>Chat</span>
              </button>
            </div>

            <div className="px-5 -mt-12 relative">
              <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                <DialogTrigger asChild>
                  <button className="group relative focus:outline-none focus:ring-0">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl group-hover:blur-3xl transition-all animate-pulse" />
                    <div className="w-18 h-18 rounded-full bg-primary border-[6px] border-white shadow-[0_12px_30px_rgba(0,35,102,0.4)] flex items-center justify-center text-white relative z-10 transition-all active:scale-90 active:rotate-90 hover:scale-110 hover:-translate-y-2">
                      <Plus className="h-10 w-10 stroke-[4px]" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] rounded-[3rem] p-8 border-none shadow-2xl animate-in zoom-in-95 duration-300">
                  <DialogHeader><DialogTitle className="text-center font-black uppercase text-primary text-xl tracking-tight">New Deposit</DialogTitle></DialogHeader>
                  <TransactionManager members={members} transactions={transactions} mode="form" onSuccess={() => setIsDepositOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center justify-around flex-1">
              <button 
                onClick={() => setActiveTab("call")} 
                className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 active:scale-75 hover:-translate-y-1 ${activeTab === "call" ? "text-primary scale-110" : "text-slate-300"}`}
              >
                <Video className={`h-7 w-7 transition-all ${activeTab === "call" ? "stroke-[3px] drop-shadow-md" : "stroke-[2px]"}`} />
                <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${activeTab === "call" ? "opacity-100" : "opacity-60"}`}>Call</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("setting")} 
                className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 active:scale-75 hover:-translate-y-1 ${activeTab === "setting" ? "text-primary scale-110" : "text-slate-300"}`}
              >
                <Settings className={`h-7 w-7 transition-all ${activeTab === "setting" ? "stroke-[3px] drop-shadow-md" : "stroke-[2px]"}`} />
                <span className={`text-[10px] font-black uppercase tracking-tighter mt-1 ${activeTab === "setting" ? "opacity-100" : "opacity-60"}`}>System</span>
              </button>
            </div>

          </div>
        </div>
      </nav>
    </div>
  );
}
