
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
  HardDrive
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
            className: "bg-green-600 text-white border-none rounded-2xl shadow-2xl",
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
        body: JSON.stringify({ spreadsheetId: SPREADSHEET_ID, rows: finalRows })
      });
      toast({ title: `ব্যাকআপ সফল হয়েছে! (${filterMonth})` });
    } catch (error) {
      toast({ title: "ব্যাকআপ ব্যর্থ", variant: "destructive" });
    } finally { setBackupLoading(false); }
  };

  const currentBn = useMemo(() => {
    if (!currentTime) return null;
    const dayName = BENGALI_DAYS[currentTime.getDay()];
    const day = toBengaliNumber(currentTime.getDate());
    const month = BENGALI_MONTHS[currentTime.getMonth()];
    const year = toBengaliNumber(currentTime.getFullYear());
    return { dayName, day, month, year };
  }, [currentTime]);

  if (!isHydrated || !currentTime) return (
    <div className="flex items-center justify-center min-h-screen bg-[#002366]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );

  return (
    <div className={cn(
      "min-h-screen flex flex-col font-body pb-32 transition-all duration-500",
      activeTab === "home" ? "bg-gradient-to-br from-[#00d2ff] via-[#3a7bd5] to-[#002366]" : "bg-[#F8FAFF]"
    )}>
      {activeTab !== "home" && (
        <header className="px-6 py-4 flex items-center justify-between bg-white shadow-sm sticky top-0 z-40 animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl border border-primary/10 flex items-center justify-center overflow-hidden shadow-sm cursor-pointer" onClick={() => setActiveTab("setting")}>
              {logo ? <Image src={logo} alt="Logo" fill className="object-cover" /> : <div className="w-full h-full bg-primary flex items-center justify-center text-white font-black">MG</div>}
            </div>
            <div className="flex flex-col">
              <h1 className="text-[11px] font-[900] text-primary uppercase tracking-tight leading-none mb-1">
                MINAR GO FOUNDATION
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Bell className="h-3 w-3 text-secondary animate-bounce" />
                  <span className="text-[10px] font-bold text-secondary uppercase">Live System</span>
                </div>
                <div className="h-3 w-[1px] bg-slate-200" />
                <div className="flex items-center gap-1">
                  <Clock className="h-3 w-3 text-primary" />
                  <span className="text-[10px] font-black text-primary">
                    {format(currentTime, "hh:mm:ss a")}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 bg-red-50 hover:bg-red-100 rounded-xl" 
              onClick={() => { if (auth) signOut(auth); }}
            >
              <Lock className="h-5 w-5 text-red-500" />
            </Button>
            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center overflow-hidden">
               {user.photoURL ? <Image src={user.photoURL} alt="Profile" width={40} height={40} className="object-cover" /> : <UserIcon className="h-5 w-5 text-slate-400" />}
            </div>
          </div>
        </header>
      )}

      <main className={cn("flex-1 container max-w-lg mx-auto", activeTab === "home" ? "p-0" : "px-6 py-6")}>
        {activeTab === "home" && (
          <div className="relative min-h-screen flex flex-col items-center pt-8 pb-24 px-6 animate-in fade-in duration-1000">
            <div className="w-full flex items-center justify-between mb-8">
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10">
                <CloudSun className="h-4 w-4 text-secondary" />
                <span className="text-[10px] font-black text-white uppercase">{weather.city} | {weather.temp}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-2xl px-4 py-2 border border-white/10">
                <Clock className="h-4 w-4 text-white" />
                <span className="text-[10px] font-black text-white uppercase">{format(currentTime, "hh:mm a")}</span>
              </div>
              <button 
                onClick={() => { if (auth) signOut(auth); }}
                className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-xl border border-red-500/20 transition-all"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>

            <div className="flex flex-col items-center text-center space-y-6 w-full">
              <div className="relative w-36 h-36 rounded-full border-[5px] border-[#C4A052] bg-white shadow-2xl flex items-center justify-center overflow-hidden group">
                {logo ? (
                  <Image src={logo} alt="Logo" fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full bg-primary flex items-center justify-center text-white text-4xl font-black">MG</div>
                )}
              </div>

              <div className="space-y-1">
                <h1 className="text-3xl font-[900] text-[#C4A052] uppercase tracking-tighter leading-none">
                  MINAR GO EXPATRIATE
                </h1>
                <p className="text-base font-medium text-white tracking-widest uppercase">
                  Development Foundation
                </p>
              </div>

              <div className="flex items-center gap-4 py-2 px-6 bg-white/5 rounded-full border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">System Online</span>
                </div>
                <div className="w-[1px] h-3 bg-white/10" />
                <div className="flex items-center gap-2">
                  <Navigation className="h-3 w-3 text-secondary" />
                  <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Global Link</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 w-full pt-4">
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-6 text-center space-y-3 hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-center gap-2 text-white/80 font-bold text-xs">
                    <Calendar className="h-3 w-3 text-secondary" /> হজ্জ (সম্ভাব্য)
                  </div>
                  <div className="text-lg font-black text-white">
                    {hajjData.date}
                  </div>
                </div>
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-[2rem] p-6 text-center space-y-3 hover:bg-white/10 transition-all">
                  <div className="flex items-center justify-center gap-2 text-white/80 font-bold text-xs">
                    <Sparkles className="h-3 w-3 text-secondary" /> রমজান (সম্ভাব্য)
                  </div>
                  <div className="text-lg font-black text-white">
                    {ramadanData.date}
                  </div>
                </div>
              </div>

              <div className="w-full bg-white/5 backdrop-blur-sm border border-white/10 rounded-[1.5rem] py-4 px-6 text-center shadow-xl">
                 <h2 className="text-lg font-bold text-white tracking-tight font-bengali">
                   আজ: <span className="text-secondary">{currentBn?.dayName}</span> | তারিখ: <span className="text-[#C4A052]">{currentBn?.day} {currentBn?.month}, {currentBn?.year}</span>
                 </h2>
              </div>
              
              <div className="w-full bg-primary/20 backdrop-blur-md border border-white/10 rounded-[2rem] p-6 text-center group cursor-pointer hover:bg-primary/30 transition-all" onClick={() => setActiveTab("history")}>
                <p className="text-[9px] uppercase font-black text-secondary tracking-[0.3em] mb-2">Total Foundation Assets</p>
                <h3 className="text-3xl font-black text-white tracking-tighter">৳{dashboardTotal.toLocaleString()}</h3>
                <div className="mt-2 flex items-center justify-center gap-2 text-[8px] font-black text-white/40 uppercase tracking-widest">
                  <ShieldCheck className="h-3 w-3" /> Secure Ledger Verified
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
          <div className="space-y-6">
            <Card className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-white">
              <div className="flex flex-col items-center gap-8">
                <LogoManager currentLogo={logo} onUpdate={setLogo} />
                <div className="w-full space-y-4">
                   <Button className="w-full h-16 rounded-2xl font-black bg-[#E8F5E9] text-[#2E7D32]" onClick={handleCloudBackup} disabled={backupLoading}>
                     {backupLoading ? <RotateCcw className="h-6 w-6 animate-spin" /> : <RotateCcw className="h-6 w-6" />} GOOGLE CLOUD BACKUP ({filterMonth})
                   </Button>
                   <Button variant="outline" className="w-full h-16 rounded-2xl font-black" onClick={() => setActiveTab("ai")}>
                     <Sparkles className="mr-3 h-6 w-6 text-primary" /> AI LETTER DRAFTER
                   </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full px-4 pb-8 z-50">
        <div className="max-w-md mx-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-2xl border border-white/50 flex items-center justify-between px-2 py-3">
            <div className="flex items-center justify-around flex-1 gap-1">
              <button onClick={() => setActiveTab("home")} className={cn("flex flex-col items-center py-2 px-1 transition-all active:scale-125 hover:scale-110", activeTab === "home" ? "text-primary scale-110" : "text-slate-300")}>
                <Home className={cn("h-6 w-6", activeTab === "home" ? "stroke-[3px]" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Home</span>
              </button>
              <button onClick={() => setActiveTab("members")} className={cn("flex flex-col items-center py-2 px-1 transition-all active:scale-125 hover:scale-110", activeTab === "members" ? "text-primary scale-110" : "text-slate-300")}>
                <Users className={cn("h-6 w-6", activeTab === "members" ? "stroke-[3px]" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Members</span>
              </button>
              <button onClick={() => setActiveTab("history")} className={cn("flex flex-col items-center py-2 px-1 transition-all active:scale-125 hover:scale-110", activeTab === "history" ? "text-primary scale-110" : "text-slate-300")}>
                <History className={cn("h-6 w-6", activeTab === "history" ? "stroke-[3px]" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">History</span>
              </button>
            </div>
            <div className="px-3 -mt-12">
              <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                <DialogTrigger asChild>
                  <button className="group relative active:scale-95 transition-all">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-pulse" />
                    <div className="w-16 h-16 rounded-full bg-primary border-[6px] border-white shadow-2xl flex items-center justify-center text-white z-10 transition-all hover:scale-110">
                      <Plus className="h-8 w-8 stroke-[4px]" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] rounded-[3rem] p-8">
                  <DialogHeader><DialogTitle className="text-center font-black uppercase text-primary">New Deposit</DialogTitle></DialogHeader>
                  <TransactionManager members={members as MGMember[]} transactions={transactions} mode="form" onSuccess={() => setIsDepositOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center justify-around flex-1 gap-1">
              <button onClick={() => setActiveTab("chat")} className={cn("flex flex-col items-center py-2 px-1 transition-all active:scale-125 hover:scale-110", activeTab === "chat" ? "text-primary scale-110" : "text-slate-300")}>
                <MessageSquare className={cn("h-6 w-6", activeTab === "chat" ? "stroke-[3px]" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Chat</span>
              </button>
              <button onClick={() => setActiveTab("gallery")} className={cn("flex flex-col items-center py-2 px-1 transition-all active:scale-125 hover:scale-110", activeTab === "gallery" ? "text-primary scale-110" : "text-slate-300")}>
                <HardDrive className={cn("h-6 w-6", activeTab === "gallery" ? "stroke-[3px]" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Vault</span>
              </button>
              <button onClick={() => setActiveTab("setting")} className={cn("flex flex-col items-center py-2 px-1 transition-all active:scale-125 hover:scale-110", activeTab === "setting" ? "text-primary scale-110" : "text-slate-300")}>
                <Settings className={cn("h-6 w-6", activeTab === "setting" ? "stroke-[3px]" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">System</span>
              </button>
            </div>
          </div>
        </div>
      </nav>
    </div>
  );
}
