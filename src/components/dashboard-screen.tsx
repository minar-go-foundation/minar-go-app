
"use client";

import { useState, useEffect, useMemo } from "react";
import { User, signOut } from "firebase/auth";
import { useAuth, useFirestore, useCollection } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
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
  Clock,
  ShieldCheck,
  Video,
  MessageSquare,
  Lock,
  History
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
import { cn } from "@/lib/utils";

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycby-FD96Fos4HsBOHEhs3mG50CyZe4tPWmYsyiam5KL7w7BekgvgrsM8vFYP2GK-FOCG/exec";
const SPREADSHEET_ID = "1tejHpkOfJR0vJZbEhM8NAeXUFrcibX7neGJHEAJd6fc";

type Tab = "home" | "members" | "history" | "chat" | "gallery" | "setting" | "call";

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
  const [logo, setLogo] = useState<string | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [weather, setWeather] = useState({ city: "Detecting...", temp: "--" });
  const [backupLoading, setBackupLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [filterMonth, setFilterMonth] = useState<string>(MONTHS[new Date().getMonth()]);
  const [hajjData, setHajjData] = useState({ days: 0, str: "" });
  const [ramadanData, setRamadanData] = useState({ days: 0, str: "" });
  const [isHydrated, setIsHydrated] = useState(false);

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
    setIsHydrated(true);
    const now = new Date();
    setCurrentTime(now);
    
    const nextHajj = GET_NEXT_DATE(new Date("2026-05-25"));
    const nextRamadan = GET_NEXT_DATE(new Date("2026-02-18"));
    
    setHajjData({ days: differenceInDays(nextHajj, now), str: format(nextHajj, "dd MMMM yyyy") });
    setRamadanData({ days: differenceInDays(nextRamadan, now), str: format(nextRamadan, "dd MMMM yyyy") });

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

  if (!isHydrated || !currentTime) return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col font-body pb-32">
      <header className="px-6 py-4 flex items-center justify-between bg-white shadow-sm sticky top-0 z-40">
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
                <CloudSun className="h-3 w-3 text-secondary" />
                <span className="text-[10px] font-bold text-secondary">{weather.temp}°C</span>
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
            onClick={() => {
              if (auth) signOut(auth);
              toast({title: "Security Lockout", description: "You have been securely logged out."});
            }}
          >
            <Lock className="h-5 w-5 text-red-500" />
          </Button>
          <div className="w-10 h-10 bg-slate-100 rounded-xl border border-slate-100 flex items-center justify-center overflow-hidden">
             {user.photoURL ? <Image src={user.photoURL} alt="Profile" width={40} height={40} className="object-cover" /> : <UserIcon className="h-5 w-5 text-slate-400" />}
          </div>
        </div>
      </header>

      <main className="flex-1 px-6 py-6 container max-w-lg mx-auto">
        {activeTab === "home" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="px-6 py-3 bg-white border border-slate-100 rounded-2xl shadow-sm flex items-center justify-between">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Today's Date</p>
              <h2 className="text-sm font-black text-primary tracking-tight">
                {format(currentTime, "EEEE, MMMM dd")}
              </h2>
            </div>

            <Card className="border-none shadow-xl rounded-[2.5rem] bg-primary overflow-hidden relative p-1">
              <CardContent className="p-8 text-center relative z-10">
                <p className="text-[10px] uppercase font-black text-accent tracking-[0.3em] mb-4">
                  {filterMonth === "All" ? "Total Assets" : `${filterMonth} Assets`}
                </p>
                <h3 className="text-4xl font-black text-white mb-2">৳{dashboardTotal.toLocaleString()}</h3>
                <div className="flex justify-center items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Secure Cloud System</span>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-primary rounded-[2.2rem] text-white shadow-2xl relative overflow-hidden border border-white/5">
                <div className="text-[8px] font-black uppercase text-accent tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="w-1 h-1 bg-accent rounded-full" /> Hajj Countdown
                </div>
                <h4 className="text-xs font-bold leading-tight">
                  {hajjData.str}<br/>
                  <span className="text-lg font-black text-accent">
                    {hajjData.days} Days
                  </span>
                </h4>
              </div>
              <div className="p-6 bg-white rounded-[2.2rem] border border-slate-100 shadow-xl relative overflow-hidden">
                <div className="text-[8px] font-black uppercase text-primary tracking-[0.2em] mb-3 flex items-center gap-2">
                   <div className="w-1 h-1 bg-primary rounded-full" /> Ramadan Countdown
                </div>
                <h4 className="text-xs font-bold leading-tight text-slate-500">
                  {ramadanData.str}<br/>
                  <span className="text-lg font-black text-primary">
                    {ramadanData.days} Days
                  </span>
                </h4>
              </div>
            </div>

            <Card className="bg-white rounded-[2.5rem] p-8 border border-slate-50 shadow-sm flex flex-col items-center justify-center text-center gap-4">
               <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center">
                 <ShieldCheck className="h-8 w-8 text-primary opacity-20" />
               </div>
               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
                 Hacker-Proof Infrastructure<br/>
                 <span className="text-[10px] opacity-60">Your data is secured with Cloud Firestore.</span>
               </p>
            </Card>
          </div>
        )}

        {activeTab === "members" && <MemberManager />}
        {activeTab === "history" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <TransactionManager 
              members={members as MGMember[]} 
              transactions={transactions} 
              mode="history" 
              filterMonth={filterMonth} 
              onFilterMonthChange={setFilterMonth} 
            />
          </div>
        )}
        {activeTab === "chat" && <ChatScreen user={user} />}
        {activeTab === "call" && <VideoCall user={user} />}
        {activeTab === "gallery" && <DocStorage />}
        {activeTab === "setting" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-white overflow-hidden relative">
              <div className="flex flex-col items-center gap-8 relative z-10">
                <div className="p-6 bg-slate-50 rounded-[2rem] w-full flex flex-col items-center gap-4 border border-slate-100">
                  <LogoManager currentLogo={logo} onUpdate={setLogo} />
                  <div className="text-center">
                    <h3 className="font-black text-primary uppercase text-lg tracking-tight">Admin System</h3>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Foundation Settings</p>
                  </div>
                </div>

                <div className="w-full space-y-3">
                   <Button className="w-full h-14 rounded-2xl font-black bg-[#E8F5E9] text-[#2E7D32] border-none shadow-md" onClick={handleCloudBackup} disabled={backupLoading}>
                     {backupLoading ? <RotateCcw className="h-5 w-5 animate-spin" /> : <RotateCcw className="h-5 w-5" />} GOOGLE CLOUD BACKUP
                   </Button>
                   <Button variant="outline" className="w-full h-14 rounded-2xl font-black border-slate-200" onClick={() => setActiveTab("gallery")}>
                     <ImageIcon className="mr-2 h-5 w-5" /> DIGITAL VAULT
                   </Button>
                   <Button variant="destructive" className="w-full h-14 rounded-2xl font-black shadow-xl mt-4" onClick={() => { if(auth) signOut(auth); }}>
                    <LogOut className="mr-2 h-5 w-5" /> SECURE LOGOUT
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      <nav className="fixed bottom-0 left-0 w-full px-4 pb-8 z-50 pointer-events-none">
        <div className="max-w-md mx-auto relative pointer-events-auto">
          <div className="bg-white/95 backdrop-blur-md rounded-[2.5rem] shadow-[0_15px_50px_-12px_rgba(0,35,102,0.25)] border border-slate-100 flex items-center justify-between px-2 py-3">
            
            <div className="flex items-center justify-around flex-1 gap-1">
              <button 
                onClick={() => setActiveTab("home")} 
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 active:scale-110 active:rotate-2 group",
                  activeTab === "home" ? "text-primary scale-110" : "text-slate-300"
                )}
              >
                <Home className={cn("h-6 w-6 transition-all group-active:animate-bounce", activeTab === "home" ? "stroke-[3px] -translate-y-1" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Home</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("members")} 
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 active:scale-110 active:-rotate-2 group",
                  activeTab === "members" ? "text-primary scale-110" : "text-slate-300"
                )}
              >
                <Users className={cn("h-6 w-6 transition-all group-active:animate-bounce", activeTab === "members" ? "stroke-[3px] -translate-y-1" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Members</span>
              </button>

              <button 
                onClick={() => setActiveTab("history")} 
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 active:scale-110 active:rotate-2 group",
                  activeTab === "history" ? "text-primary scale-110" : "text-slate-300"
                )}
              >
                <History className={cn("h-6 w-6 transition-all group-active:animate-bounce", activeTab === "history" ? "stroke-[3px] -translate-y-1" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">History</span>
              </button>
            </div>

            <div className="px-3 -mt-10 relative">
              <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
                <DialogTrigger asChild>
                  <button className="group relative focus:outline-none">
                    <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl group-hover:blur-3xl transition-all animate-pulse" />
                    <div className="w-16 h-16 rounded-full bg-primary border-[6px] border-white shadow-xl flex items-center justify-center text-white relative z-10 transition-all active:scale-90 active:rotate-90 hover:scale-110 hover:-translate-y-2">
                      <Plus className="h-8 w-8 stroke-[4px]" />
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-[95vw] rounded-[3rem] p-8 border-none shadow-2xl">
                  <DialogHeader><DialogTitle className="text-center font-black uppercase text-primary text-xl tracking-tight">New Deposit</DialogTitle></DialogHeader>
                  <TransactionManager members={members as MGMember[]} transactions={transactions} mode="form" onSuccess={() => setIsDepositOpen(false)} />
                </DialogContent>
              </Dialog>
            </div>

            <div className="flex items-center justify-around flex-1 gap-1">
              <button 
                onClick={() => setActiveTab("chat")} 
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 active:scale-110 active:-rotate-2 group",
                  activeTab === "chat" ? "text-primary scale-110" : "text-slate-300"
                )}
              >
                <MessageSquare className={cn("h-6 w-6 transition-all group-active:animate-bounce", activeTab === "chat" ? "stroke-[3px] -translate-y-1" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Chat</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("call")} 
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 active:scale-110 active:rotate-2 group",
                  activeTab === "call" ? "text-primary scale-110" : "text-slate-300"
                )}
              >
                <Video className={cn("h-6 w-6 transition-all group-active:animate-bounce", activeTab === "call" ? "stroke-[3px] -translate-y-1" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">Call</span>
              </button>
              
              <button 
                onClick={() => setActiveTab("setting")} 
                className={cn(
                  "flex flex-col items-center justify-center py-2 px-1 transition-all duration-300 active:scale-110 active:-rotate-2 group",
                  activeTab === "setting" ? "text-primary scale-110" : "text-slate-300"
                )}
              >
                <Settings className={cn("h-6 w-6 transition-all group-active:animate-bounce", activeTab === "setting" ? "stroke-[3px] -translate-y-1" : "stroke-[2px]")} />
                <span className="text-[8px] font-black uppercase tracking-tighter mt-1">System</span>
              </button>
            </div>

          </div>
        </div>
      </nav>
    </div>
  );
}
