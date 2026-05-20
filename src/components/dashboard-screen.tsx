
"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { User, signOut } from "firebase/auth";
import { useAuth, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";
import { 
  LogOut, 
  Plus, 
  Home, 
  Users, 
  RotateCcw,
  User as UserIcon,
  Settings,
  CloudSun,
  Clock,
  ShieldCheck,
  Video,
  MessageSquare,
  Lock,
  History,
  Bell,
  Navigation,
  Calendar,
  Sparkles,
  HardDrive,
  Palette,
  Check
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
import DemandLetterAssistant from "./demand-letter-assistant";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { format, differenceInDays, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const BENGALI_DAYS = ["রবিবার", "সোমবার", "মঙ্গলবার", "বুধবার", "বৃহস্পতিবার", "শুক্রবার", "শনিবার"];
const BENGALI_MONTHS = ["জানুয়ারি", "ফেব্রুয়ারি", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্টেম্বর", "অক্টোবর", "নভেম্বর", "ডিসেম্বর"];
const BENGALI_NUMBERS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

const toBengaliNumber = (num: number | string) => {
  return num.toString().split('').map(d => BENGALI_NUMBERS[parseInt(d)] || d).join('');
};

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-FD96Fos4HsBOHEhs3mG50CyZe4tPWmYsyiam5KL7w7BekgvgrsM8vFYP2GK-FOCG/exec";
const SPREADSHEET_ID = "1tejHpkOfJR0vJZbEhM8NAeXUFrcibX7neGJHEAJd6fc";

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

type Tab = "home" | "members" | "history" | "chat" | "gallery" | "setting" | "call" | "ai";
type Theme = "navy" | "glass" | "gradient" | "midnight" | "emerald" | "royal";

export default function DashboardScreen({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [logo, setLogo] = useState<string | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [weather, setWeather] = useState({ city: "Dhaka, BD", temp: "32°C", desc: "Sunny" });
  const [backupLoading, setBackupLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [hajjData, setHajjData] = useState({ days: 0, date: "" });
  const [ramadanData, setRamadanData] = useState({ days: 0, date: "" });
  const [currentTheme, setCurrentTheme] = useState<Theme>("navy"); 
  const [isHydrated, setIsHydrated] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isFirstLoad = useRef(true);

  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const transactionsQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "transactions"), orderBy("d", "desc"));
  }, [db]);
  const { data: transactions = [] } = useCollection(transactionsQuery);

  const membersQuery = useMemo(() => {
    if (!db) return null;
    return query(collection(db, "members"), orderBy("name", "asc"));
  }, [db]);
  const { data: members = [] } = useCollection(membersQuery);

  useEffect(() => {
    if (!db) return;
    
    audioRef.current = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");

    const unsubscribe = onSnapshot(collection(db, "transactions"), (snapshot) => {
      if (isFirstLoad.current) {
        isFirstLoad.current = false;
        return;
      }

      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data();
          if (audioRef.current) {
            audioRef.current.play().catch(e => console.log("Audio blocked by browser policy"));
          }
          toast({
            title: "নতুন টাকা জমা হয়েছে! 🔔",
            description: `${data.n} - ৳${data.a} জমা দিয়েছেন।`,
            className: "bg-[#002366] text-white border-none rounded-2xl shadow-2xl",
          });
        }
      });
    });

    return () => unsubscribe();
  }, [db, toast]);

  useEffect(() => {
    setIsHydrated(true);
    const now = new Date();
    setCurrentTime(now);
    
    const nextHajj = GET_NEXT_DATE(new Date("2026-05-25"));
    const nextRamadan = GET_NEXT_DATE(new Date("2026-02-18"));
    
    const formatDateBn = (d: Date) => {
      const day = toBengaliNumber(d.getDate());
      const month = BENGALI_MONTHS[d.getMonth()];
      const year = toBengaliNumber(d.getFullYear());
      return `${day} ${month}, ${year}`;
    };

    setHajjData({ 
      days: differenceInDays(nextHajj, now), 
      date: formatDateBn(nextHajj) 
    });
    setRamadanData({ 
      days: differenceInDays(nextRamadan, now), 
      date: formatDateBn(nextRamadan) 
    });

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);

    const storedLogo = localStorage.getItem("mg_logo");
    if (storedLogo) setLogo(storedLogo);

    const storedTheme = localStorage.getItem("mg_theme") as Theme;
    if (storedTheme) setCurrentTheme(storedTheme);

    return () => clearInterval(timer);
  }, []);

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
    const filteredForBackup = filterMonth === "All" 
      ? transactions 
      : transactions.filter(t => {
          const tDate = new Date(t.d);
          return MONTHS[tDate.getMonth()] === filterMonth;
        });
    const total = filteredForBackup.reduce((acc, curr) => acc + (parseFloat(curr.a) || 0), 0);
    const timestamp = format(new Date(), "dd/MM/yyyy HH:mm:ss");
    const headerRow = [`-- BACKUP SESSION (${filterMonth}): ${timestamp} --`, "", ""];
    const dataRows = filteredForBackup.map(t => [t.n, t.d, t.a]);
    const totalRow = [`TOTAL ${filterMonth.toUpperCase()} ASSETS`, "", total.toLocaleString()];
    const finalRows = [headerRow, ...dataRows, totalRow];

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        keepalive: true,
        cache: 'no-cache',
        body: JSON.stringify({ spreadsheetId: SPREADSHEET_ID, rows: finalRows })
      });
      toast({ title: `ব্যাকআপ সফল হয়েছে! (${filterMonth})` });
    } catch (error) {
      console.error("Backup error:", error);
      toast({ title: "ব্যাকআপ ব্যর্থ", variant: "destructive" });
    } finally { 
      setBackupLoading(false); 
    }
  };

  const changeTheme = (theme: Theme) => {
    setCurrentTheme(theme);
    localStorage.setItem("mg_theme", theme);
    toast({ title: "Theme Updated", description: `Switched to ${theme} mode.` });
  };

  const currentBn = useMemo(() => {
    if (!currentTime) return null;
    const dayName = BENGALI_DAYS[currentTime.getDay()];
    const day = toBengaliNumber(currentTime.getDate());
    const month = BENGALI_MONTHS[currentTime.getMonth()];
    const year = toBengaliNumber(currentTime.getFullYear());
    return { dayName, day, month, year };
  }, [currentTime]);

  const themeClasses = useMemo(() => {
    switch(currentTheme) {
      case "navy": return "bg-[#002366] text-white";
      case "gradient": return "bg-gradient-to-br from-[#00d2ff] via-[#3a7bd5] to-[#002366] text-white";
      case "glass": return "bg-slate-50 text-slate-800";
      case "midnight": return "bg-[#0f172a] text-white";
      case "emerald": return "bg-[#064e3b] text-white";
      case "royal": return "bg-[#312e81] text-white";
      default: return "bg-[#002366] text-white";
    }
  }, [currentTheme]);

  if (!isHydrated || !currentTime) return (
    <div className="flex items-center justify-center min-h-screen bg-[#002366]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );

  return (
    <div className={cn("min-h-screen flex flex-col font-body pb-32 transition-all duration-700", themeClasses)}>
      
      {activeTab !== "home" && (
        <header className="px-6 py-5 flex items-center justify-between glass-nav sticky top-0 z-40 mx-4 mt-4 rounded-3xl animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-4">
            <div className="relative w-12 h-12 rounded-2xl border border-white/50 flex items-center justify-center overflow-hidden shadow-sm cursor-pointer" onClick={() => setActiveTab("setting")}>
              {logo ? <Image src={logo} alt="Logo" fill className="object-cover" /> : <div className="w-full h-full bg-[#002366] flex items-center justify-center text-white font-black text-xs">MG</div>}
            </div>
            <div className="flex flex-col">
              <h1 className="text-sm font-[900] text-[#002366] uppercase tracking-tight leading-none mb-1">
                MINAR GO FOUNDATION
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Live System</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-11 w-11 bg-red-50/50 hover:bg-red-100 rounded-2xl transition-all" 
              onClick={() => { if (auth) signOut(auth); }}
            >
              <Lock className="h-5 w-5 text-red-500" />
            </Button>
            <div className="w-11 h-11 bg-white/50 rounded-2xl flex items-center justify-center overflow-hidden border border-white/50">
               {user.photoURL ? <Image src={user.photoURL} alt="Profile" width={44} height={44} className="object-cover" /> : <UserIcon className="h-5 w-5 text-slate-300" />}
            </div>
          </div>
        </header>
      )}

      <main className={cn("flex-1 container max-w-lg mx-auto", activeTab === "home" ? "p-0" : "px-6 py-8")}>
        {activeTab === "home" && (
          <div className="relative min-h-screen flex flex-col items-center pt-10 pb-24 px-6 animate-in fade-in duration-1000">
            {/* Top Stats Bar */}
            <div className="w-full flex items-center justify-between mb-10">
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-2.5 border border-white/20">
                <CloudSun className="h-4 w-4 text-[#C4A052]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{weather.city} | {weather.temp}</span>
              </div>
              <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-5 py-2.5 border border-white/20">
                <Clock className="h-4 w-4 text-[#C4A052]" />
                <span className="text-[10px] font-black uppercase tracking-widest text-white">{format(currentTime, "hh:mm a")}</span>
              </div>
              <button 
                onClick={() => { if (auth) signOut(auth); }}
                className="bg-red-500/20 text-red-400 p-2.5 rounded-2xl hover:bg-red-500/30 transition-all border border-red-500/30"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-8 w-full">
              {/* Profile Logo */}
              <div className="relative w-40 h-40 rounded-[2.5rem] border-[6px] border-white/20 flex items-center justify-center overflow-hidden group shadow-2xl bg-[#002366]">
                {logo ? (
                  <Image src={logo} alt="Logo" fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                  <div className="w-full h-full bg-[#002366] flex items-center justify-center text-white text-4xl font-black">MG</div>
                )}
              </div>

              {/* Foundation Info */}
              <div className="space-y-2">
                <h1 className="text-4xl font-[900] text-[#C4A052] uppercase tracking-tighter leading-none">
                  MINAR GO EXPATRIATE
                </h1>
                <p className="text-lg font-bold text-white tracking-[0.3em] uppercase opacity-80">
                  Development Foundation
                </p>
              </div>

              {/* Countdown Grid */}
              <div className="grid grid-cols-2 gap-5 w-full pt-4">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-7 text-center space-y-3 hover:scale-105 transition-transform duration-500">
                  <div className="flex items-center justify-center gap-2 text-[#C4A052] font-black text-[10px] uppercase tracking-widest">
                    <Calendar className="h-4 w-4" /> হজ্জ
                  </div>
                  <div className="text-xl font-black text-white tracking-tight">
                    {hajjData.date}
                  </div>
                </div>
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2.5rem] p-7 text-center space-y-3 hover:scale-105 transition-transform duration-500">
                  <div className="flex items-center justify-center gap-2 text-[#C4A052] font-black text-[10px] uppercase tracking-widest">
                    <Sparkles className="h-4 w-4" /> রমজান
                  </div>
                  <div className="text-xl font-black text-white tracking-tight">
                    {ramadanData.date}
                  </div>
                </div>
              </div>

              {/* Live Bengali Date Box */}
              <div className="w-full bg-white/10 backdrop-blur-xl border border-white/20 rounded-[2rem] py-5 px-8 text-center">
                 <h2 className="text-xl font-[900] text-white tracking-tight font-bengali uppercase">
                   আজ: <span className="text-[#C4A052]">{currentBn?.dayName}</span> | তারিখ: <span className="text-[#C4A052]">{currentBn?.day} {currentBn?.month}, {currentBn?.year}</span>
                 </h2>
              </div>
              
              {/* Assets Overview */}
              <div className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 rounded-[3rem] p-8 text-center group cursor-pointer hover:shadow-2xl hover:shadow-[#C4A052]/10 transition-all active:scale-95" onClick={() => setActiveTab("history")}>
                <p className="text-[10px] uppercase font-black text-white/60 tracking-[0.4em] mb-3">Foundation Assets</p>
                <h3 className="text-4xl font-[900] text-[#C4A052] tracking-tighter">৳{dashboardTotal.toLocaleString()}</h3>
                <div className="mt-4 flex items-center justify-center gap-2.5 text-[9px] font-black text-white/50 uppercase tracking-[0.2em]">
                  <ShieldCheck className="h-4 w-4 text-green-400" /> Secure Ledger Verified
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "members" && <MemberManager />}
        {activeTab === "history" && (
          <TransactionManager 
            members={members as MGMember[]} 
            transactions={transactions} 
            mode="history" 
            filterMonth={filterMonth} 
            onFilterMonthChange={setFilterMonth} 
          />
        )}
        {activeTab === "chat" && <ChatScreen user={user} />}
        {activeTab === "call" && <VideoCall user={user} />}
        {activeTab === "gallery" && <DocStorage />}
        {activeTab === "ai" && <DemandLetterAssistant />}
        {activeTab === "setting" && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[3rem] border-none shadow-2xl p-10 bg-white/10 backdrop-blur-xl border-white/10">
              <div className="flex flex-col items-center gap-10">
                <LogoManager currentLogo={logo} onUpdate={setLogo} />
                
                <div className="w-full space-y-8">
                   <div className="space-y-4">
                     <h4 className="text-[10px] font-black uppercase text-white/50 tracking-widest flex items-center gap-2">
                       <Palette className="h-4 w-4 text-[#C4A052]" /> Theme Customization
                     </h4>
                     <div className="grid grid-cols-3 gap-3">
                        <button 
                          onClick={() => changeTheme("navy")}
                          className={cn("h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1", currentTheme === "navy" ? "border-[#C4A052] bg-white/10" : "border-transparent bg-white/5")}
                        >
                          <div className="w-5 h-5 rounded-full bg-[#002366] border border-white/20" />
                          <span className="text-[8px] font-black uppercase text-white">Navy</span>
                          {currentTheme === "navy" && <Check className="h-2 w-2 text-white" />}
                        </button>
                        <button 
                          onClick={() => changeTheme("glass")}
                          className={cn("h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1", currentTheme === "glass" ? "border-[#C4A052] bg-white/10" : "border-transparent bg-white/5")}
                        >
                          <div className="w-5 h-5 rounded-full bg-slate-100 border border-slate-300" />
                          <span className="text-[8px] font-black uppercase text-white">Glass</span>
                          {currentTheme === "glass" && <Check className="h-2 w-2 text-white" />}
                        </button>
                        <button 
                          onClick={() => changeTheme("gradient")}
                          className={cn("h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1", currentTheme === "gradient" ? "border-[#C4A052] bg-white/10" : "border-transparent bg-white/5")}
                        >
                          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600" />
                          <span className="text-[8px] font-black uppercase text-white">Gradient</span>
                          {currentTheme === "gradient" && <Check className="h-2 w-2 text-white" />}
                        </button>
                        <button 
                          onClick={() => changeTheme("midnight")}
                          className={cn("h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1", currentTheme === "midnight" ? "border-[#C4A052] bg-white/10" : "border-transparent bg-white/5")}
                        >
                          <div className="w-5 h-5 rounded-full bg-[#0f172a] border border-white/10" />
                          <span className="text-[8px] font-black uppercase text-white">Midnight</span>
                          {currentTheme === "midnight" && <Check className="h-2 w-2 text-white" />}
                        </button>
                        <button 
                          onClick={() => changeTheme("emerald")}
                          className={cn("h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1", currentTheme === "emerald" ? "border-[#C4A052] bg-white/10" : "border-transparent bg-white/5")}
                        >
                          <div className="w-5 h-5 rounded-full bg-[#064e3b] border border-white/10" />
                          <span className="text-[8px] font-black uppercase text-white">Emerald</span>
                          {currentTheme === "emerald" && <Check className="h-2 w-2 text-white" />}
                        </button>
                        <button 
                          onClick={() => changeTheme("royal")}
                          className={cn("h-20 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-1", currentTheme === "royal" ? "border-[#C4A052] bg-white/10" : "border-transparent bg-white/5")}
                        >
                          <div className="w-5 h-5 rounded-full bg-[#312e81] border border-white/10" />
                          <span className="text-[8px] font-black uppercase text-white">Royal</span>
                          {currentTheme === "royal" && <Check className="h-2 w-2 text-white" />}
                        </button>
                     </div>
                   </div>

                   <div className="space-y-3">
                     <Button className="w-full h-16 rounded-2xl font-black bg-white/10 text-white hover:bg-white/20 uppercase tracking-widest text-xs border border-white/20" onClick={handleCloudBackup} disabled={backupLoading}>
                       {backupLoading ? <RotateCcw className="h-6 w-6 animate-spin" /> : <RotateCcw className="h-6 w-6" />} CLOUD BACKUP ({filterMonth})
                     </Button>
                     <Button variant="outline" className="w-full h-16 rounded-2xl font-black uppercase tracking-widest text-xs border-white/20 bg-white/5 backdrop-blur-md text-white" onClick={() => setActiveTab("ai")}>
                       <Sparkles className="mr-3 h-5 w-5 text-[#C4A052]" /> AI LETTER DRAFTER
                     </Button>
                   </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Persistent Navigation */}
      <nav className="fixed bottom-0 left-0 w-full px-6 pb-10 z-50">
        <div className="max-w-md mx-auto">
          <div className="glass-nav rounded-[3rem] flex items-center justify-between px-3 py-4">
            <div className="flex items-center justify-around flex-1 gap-2">
              <button onClick={() => setActiveTab("home")} className={cn("flex flex-col items-center py-2 px-2 transition-all active:scale-125 hover:scale-110", activeTab === "home" ? "text-[#002366]" : "text-slate-300")}>
                <Home className={cn("h-6 w-6", activeTab === "home" ? "stroke-[3px]" : "stroke-[2.5px]")} />
                <span className="text-[9px] font-black uppercase tracking-tighter mt-1.5">Home</span>
              </button>
              <button onClick={() => setActiveTab("members")} className={cn("flex flex-col items-center py-2 px-2 transition-all active:scale-125 hover:scale-110", activeTab === "members" ? "text-[#002366]" : "text-slate-300")}>
                <Users className={cn("h-6 w-6", activeTab === "members" ? "stroke-[3px]" : "stroke-[2.5px]")} />
                <span className="text-[9px] font-black uppercase tracking-tighter mt-1.5">Members</span>
              </button>
              <button onClick={() => setActiveTab("history")} className={cn("flex flex-col items-center py-2 px-2 transition-all active:scale-125 hover:scale-110", activeTab === "history" ? "text-[#002366]" : "text-slate-300")}>
                <History className={cn("h-6 w-6", activeTab === "history" ? "stroke-[3px]" : "stroke-[2.5px]")} />
                <span className="text-[9px] font-black uppercase tracking-tighter mt-1.5">History</span>
              </button>
            </div>
            <div className="px-4 -mt-14">
              <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                <DialogTrigger asChild>
                  <button className="group relative active:scale-95 transition-all">
                    <div className="absolute inset-0 bg-[#002366]/20 rounded-full blur-2xl animate-pulse" />
                    <div className="w-16 h-16 rounded-full bg-[#002366] border-[6px] border-white shadow-2xl flex items-center justify-center text-white z-10 transition-all hover:scale-110">
                      <Plus className="h-8 w-8 stroke-[4px]" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] rounded-[3rem] p-10 border-none shadow-2xl glass-card">
                  <DialogHeader><DialogTitle className="text-center font-[900] uppercase text-[#002366] tracking-widest text-xl">New Deposit</DialogTitle></DialogHeader>
                  <TransactionManager members={members as MGMember[]} transactions={transactions} mode="form" onSuccess={() => setIsDepositOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center justify-around flex-1 gap-2">
              <button onClick={() => setActiveTab("chat")} className={cn("flex flex-col items-center py-2 px-2 transition-all active:scale-125 hover:scale-110", activeTab === "chat" ? "text-[#002366]" : "text-slate-300")}>
                <MessageSquare className={cn("h-6 w-6", activeTab === "chat" ? "stroke-[3px]" : "stroke-[2.5px]")} />
                <span className="text-[9px] font-black uppercase tracking-tighter mt-1.5">Chat</span>
              </button>
              <button onClick={() => setActiveTab("gallery")} className={cn("flex flex-col items-center py-2 px-2 transition-all active:scale-125 hover:scale-110", activeTab === "gallery" ? "text-[#002366]" : "text-slate-300")}>
                <HardDrive className={cn("h-6 w-6", activeTab === "gallery" ? "stroke-[3px]" : "stroke-[2.5px]")} />
                <span className="text-[9px] font-black uppercase tracking-tighter mt-1.5">Vault</span>
              </button>
              <button onClick={() => setActiveTab("setting")} className={cn("flex flex-col items-center py-2 px-2 transition-all active:scale-125 hover:scale-110", activeTab === "setting" ? "text-[#002366]" : "text-slate-300")}>
                <Settings className={cn("h-6 w-6", activeTab === "setting" ? "stroke-[3px]" : "stroke-[2.5px]")} />
                <span className="text-[9px] font-black uppercase tracking-tighter mt-1.5">System</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
