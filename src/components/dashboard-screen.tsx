
"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { User, signOut } from "firebase/auth";
import { auth, database } from "@/lib/firebase";
import { ref, onValue, push, query, limitToLast, onChildAdded, set } from "firebase/database";
import { 
  LogOut, 
  Plus, 
  Home, 
  Users, 
  Image as ImageIcon, 
  RotateCcw,
  Bell,
  User as UserIcon,
  MessageCircle,
  Settings,
  Building2,
  ChevronDown,
  CloudSun,
  ClipboardCheck,
  Info,
  PenTool
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MemberManager from "./member-manager";
import TransactionManager from "./transaction-manager";
import LiveLetterEditor from "./live-letter-editor";
import DocStorage from "./doc-storage";
import LogoManager from "./logo-manager";
import ChatScreen from "./chat-screen";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { format } from "date-fns";
import { Textarea } from "@/components/ui/textarea";

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-FD96Fos4HsBOHEhs3mG50CyZe4tPWmYsyiam5KL7w7BekgvgrsM8vFYP2GK-FOCG/exec";
const SPREADSHEET_ID = "1tejHpkOfJR0vJZbEhM8NAeXUFrcibX7neGJHEAJd6fc";

const APP_FEATURES_REPORT = `
MINAR GO EXPATRIATE DEVELOPMENT FOUNDATION - APP OVERVIEW

[ ডিজাইন ও থিম ]
- Primary Color: Navy Blue (#002366)
- Accent Color: Premium Gold (#C4A052)
- UI Style: Modern Mobile-First Design, Rounded Corners.

[ প্রধান ফিচারসমূহ ]
১. ওটিপি ভেরিফিকেশন: রেজিস্ট্রেশনের সময় ইমেইলে গোপন কোড।
২. লাইভ মেকার: সরাসরি টেক্সট এডিট করে লেটার জেনারেটর।
৩. স্মার্ট ব্যাকআপ: গুগল শিটে সয়ংক্রিয় ডাটা সেভ।
৪. এডমিন চ্যাট: রিয়েল-টাইম অফিশিয়াল চ্যাট রুম।
`.trim();

type Tab = "home" | "members" | "chat" | "gallery" | "setting" | "tools";

export interface MGMember {
  id: string;
  name: string;
}

export default function DashboardScreen({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [members, setMembers] = useState<MGMember[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [logo, setLogo] = useState<string | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [weather, setWeather] = useState({ city: "Detecting...", temp: "--" });
  const [backupLoading, setBackupLoading] = useState(false);
  const [countdown, setCountdown] = useState({ hajj: 0, ramadan: 0 });
  const [filterMonth, setFilterMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const { toast } = useToast();
  
  const isInitialLoad = useRef(true);

  useEffect(() => {
    const hajjDate = new Date("2026-05-25");
    const ramadanDate = new Date("2026-02-18");
    const now = new Date();
    
    setCountdown({
      hajj: Math.max(0, Math.ceil((hajjDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))),
      ramadan: Math.max(0, Math.ceil((ramadanDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    });

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const data = await res.json();
          setWeather({ city: "Live Location", temp: Math.round(data.current_weather.temperature).toString() });
        } catch (e) {
          setWeather({ city: "Location Access", temp: "26" });
        }
      }, () => setWeather({ city: "Global", temp: "24" }));
    }
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
        toast({ title: "New Deposit Recorded! 🔔", description: `${data.n} deposited ৳${data.a}` });
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

  const filteredTotal = useMemo(() => {
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
    rows.push(["TOTAL ASSETS", "", filteredTotal.toLocaleString()]);

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: JSON.stringify({ spreadsheetId: SPREADSHEET_ID, rows: rows })
      });
      toast({ title: "Backup Success!", description: "Data saved to Google Sheet." });
    } catch (error) {
      toast({ title: "Backup Failed", variant: "destructive" });
    } finally { setBackupLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col font-body pb-32">
      <header className="px-6 py-5 flex items-center justify-between bg-white shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-2xl bg-primary border-2 border-accent/20 flex items-center justify-center overflow-hidden shadow-lg transition-transform active:scale-95 cursor-pointer" onClick={() => setActiveTab("setting")}>
            {logo ? <Image src={logo} alt="Logo" fill className="object-cover" /> : <span className="text-white font-black text-lg">MG</span>}
          </div>
          <div>
            <h1 className="text-[12px] font-black text-primary leading-tight uppercase tracking-tight">Minar Go Foundation</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CloudSun className="h-3 w-3 text-accent" />
              <div className="text-[9px] text-accent font-bold uppercase tracking-widest">{weather.city} • {weather.temp}°C</div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative p-2.5 bg-slate-50 rounded-xl" onClick={() => setActiveTab("chat")}>
            <Bell className="h-5 w-5 text-slate-400" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
          </Button>
          <div className="w-10 h-10 bg-slate-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
             {user.photoURL ? <Image src={user.photoURL} alt="Profile" width={40} height={40} className="object-cover" /> : <UserIcon className="h-5 w-5 text-slate-400" />}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 container max-w-lg mx-auto">
        {activeTab === "home" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="border-none shadow-xl rounded-[2.5rem] bg-primary overflow-hidden relative group p-1">
              <CardContent className="p-8 text-center relative z-10">
                <p className="text-[10px] uppercase font-black text-accent tracking-[0.3em] mb-4">
                  {filterMonth === "All" ? "Total Foundation Assets" : `Total ${filterMonth} Assets`}
                </p>
                <h3 className="text-4xl font-black text-white mb-2">৳{filteredTotal.toLocaleString()}</h3>
                <div className="flex justify-center items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Live Cloud Sync</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-primary rounded-[2.2rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="text-[8px] font-black uppercase text-accent tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="w-1 h-1 bg-accent rounded-full" /> Hajj 2026
                </div>
                <h4 className="text-xs font-bold leading-tight">25 May 2026<br/><span className="text-lg font-black text-accent">{countdown.hajj} Days Left</span></h4>
              </div>
              <div className="p-6 bg-white rounded-[2.2rem] border border-slate-100 shadow-xl relative overflow-hidden">
                <div className="text-[8px] font-black uppercase text-primary tracking-[0.2em] mb-3 flex items-center gap-2">
                   <div className="w-1 h-1 bg-primary rounded-full" /> Ramadan 2026
                </div>
                <h4 className="text-xs font-bold leading-tight text-slate-500">18 Feb 2026<br/><span className="text-lg font-black text-primary">{countdown.ramadan} Days Left</span></h4>
              </div>
            </div>

            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Transaction Log</h3>
              <Button variant="ghost" className="text-[9px] font-black text-accent uppercase p-0 h-auto tracking-widest" onClick={() => setActiveTab("tools")}>
                Tools <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-50">
              <TransactionManager members={members} transactions={transactions} mode="summary" filterMonth={filterMonth} onFilterMonthChange={setFilterMonth} />
            </div>
          </div>
        )}

        {activeTab === "members" && <MemberManager members={members} />}
        {activeTab === "chat" && <ChatScreen user={user} />}
        {activeTab === "gallery" && <DocStorage />}
        {activeTab === "tools" && (
          <div className="animate-in fade-in duration-700">
            <LiveLetterEditor />
          </div>
        )}
        {activeTab === "setting" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-white">
              <h3 className="font-black text-primary uppercase mb-8 text-center text-xl tracking-tight">System Settings</h3>
              <div className="flex flex-col items-center gap-8">
                <div className="p-6 bg-slate-50 rounded-[2rem] w-full flex flex-col items-center gap-4 border border-slate-100">
                  <LogoManager currentLogo={logo} onUpdate={setLogo} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foundation Branding</p>
                </div>
                <div className="w-full space-y-3">
                   <Button className="w-full h-14 rounded-2xl font-black bg-[#E8F5E9] text-[#2E7D32] border-none shadow-md hover:bg-[#C8E6C9] flex items-center justify-center gap-3" onClick={handleCloudBackup} disabled={backupLoading}>
                     {backupLoading ? <RotateCcw className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />} GOOGLE CLOUD BACKUP
                   </Button>
                   <Button variant="outline" className="w-full h-14 rounded-2xl font-black border-slate-200" onClick={() => setActiveTab("gallery")}>
                     <ImageIcon className="mr-2 h-5 w-5" /> DIGITAL GALLERY
                   </Button>
                   <Button variant="destructive" className="w-full h-14 rounded-2xl font-black shadow-xl mt-4" onClick={() => signOut(auth)}>
                    <LogOut className="mr-2 h-5 w-5" /> SECURE LOGOUT
                  </Button>
                </div>
              </div>
            </Card>

            <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
               <div className="flex items-center gap-3 mb-6">
                 <div className="p-2 bg-primary/10 rounded-xl"><Info className="h-5 w-5 text-primary" /></div>
                 <h4 className="text-xs font-black uppercase text-primary tracking-tight">Feature Guide</h4>
               </div>
               <Textarea readOnly value={APP_FEATURES_REPORT} className="h-64 rounded-2xl bg-slate-50 border-none text-[10px] font-medium leading-relaxed mb-4" />
               <Button variant="outline" className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2" onClick={() => {navigator.clipboard.writeText(APP_FEATURES_REPORT); toast({title: "Copied!"})}}>
                 <ClipboardCheck className="h-4 w-4" /> Copy Report
               </Button>
            </Card>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full px-6 pb-10 pt-4 z-50 pointer-events-none">
        <div className="max-w-md mx-auto bg-white/90 rounded-[3rem] shadow-2xl flex items-center justify-between px-3 py-3 border border-white/60 backdrop-blur-xl pointer-events-auto">
          <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "home" ? "text-primary scale-110" : "text-slate-300"}`}>
            <Home className="h-6 w-6" /><span className="text-[8px] font-black uppercase tracking-widest">Home</span>
          </button>
          <button onClick={() => setActiveTab("members")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "members" ? "text-primary scale-110" : "text-slate-300"}`}>
            <Users className="h-6 w-6" /><span className="text-[8px] font-black uppercase tracking-widest">Members</span>
          </button>

          <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center justify-center -mt-14 mx-2 group">
                <div className="w-18 h-18 rounded-full bg-primary border-[6px] border-[#F8FAFF] shadow-2xl flex items-center justify-center text-white transition-all group-active:scale-90 ring-4 ring-primary/5">
                  <Plus className="h-9 w-9 stroke-[3.5px]" />
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] rounded-[3rem] p-8 border-none shadow-2xl">
              <DialogHeader><DialogTitle className="text-center font-black uppercase text-primary text-xl tracking-tight">New Deposit</DialogTitle></DialogHeader>
              <TransactionManager members={members} transactions={transactions} mode="form" onSuccess={() => setIsDepositOpen(false)} />
            </DialogContent>
          </Dialog>

          <button onClick={() => setActiveTab("tools")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "tools" ? "text-primary scale-110" : "text-slate-300"}`}>
            <PenTool className="h-6 w-6" /><span className="text-[8px] font-black uppercase tracking-widest">Maker</span>
          </button>
          <button onClick={() => setActiveTab("setting")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "setting" ? "text-primary scale-110" : "text-slate-300"}`}>
            <Settings className="h-6 w-6" /><span className="text-[8px] font-black uppercase tracking-widest">System</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
