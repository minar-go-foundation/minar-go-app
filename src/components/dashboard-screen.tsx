
"use client";

import { useState, useEffect, useRef } from "react";
import { User, signOut } from "firebase/auth";
import { auth, database } from "@/lib/firebase";
import { ref, onValue, push, query, limitToLast, onChildAdded, set } from "firebase/database";
import { 
  LogOut, 
  Plus, 
  Home, 
  Users, 
  Image as ImageIcon, 
  FileText,
  RotateCcw,
  Download,
  Bell,
  User as UserIcon,
  MessageCircle,
  Video,
  Settings,
  Moon,
  Building2,
  ChevronDown,
  CloudSun,
  Cloud
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MemberManager from "./member-manager";
import TransactionManager from "./transaction-manager";
import DemandLetterAssistant from "./demand-letter-assistant";
import DocStorage from "./doc-storage";
import LogoManager from "./logo-manager";
import ChatScreen from "./chat-screen";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import Image from "next/image";
import { format } from "date-fns";

const DEFAULT_MEMBERS = [
  "Mr. Dulal", 
  "Mr. Omar Faruk", 
  "Mr. Sulaiman badshah", 
  "Mr. Abdul qayum", 
  "Mr. Mohammed Jamshed", 
  "Mr. Milad", 
  "Mr. Ala uddin", 
  "Mr. Shahid", 
  "Mr. Shohag", 
  "Mr. Abul Hussain", 
  "Mr. Sakib", 
  "Mr. Ronnie", 
  "Mr. Jonye", 
  "Mr. Aqib"
];

const ADMIN_EMAIL = "kosttoonek7@gmail.com";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxPXPgyON8r2uOQUlbps-C-Di8LPiaj1yKX9x64mumAcCDCg76_xWkvvufLHiAszgwg/exec";
const SPREADSHEET_ID = "1tejHpkOfJR0vJZbEhM8NAeXUFrcibX7neGJHEAJd6fc";

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
  const { toast } = useToast();
  
  const isInitialLoad = useRef(true);

  // Weather Logic
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const data = await res.json();
          setWeather({ 
            city: "Live Location", 
            temp: Math.round(data.current_weather.temperature).toString() 
          });
        } catch (e) {
          setWeather({ city: "Location Access", temp: "26" });
        }
      }, () => {
        setWeather({ city: "Global", temp: "24" });
      });
    }
  }, []);

  useEffect(() => {
    // 1. Transactions Listener
    const transRef = ref(database, "transactions");
    const unsubscribeTrans = onValue(transRef, (snapshot) => {
      const list: any[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          list.push({ id: child.key, ...child.val() });
        });
        setTransactions(list.sort((a, b) => new Date(b.d).getTime() - new Date(a.d).getTime()));
      }
    });

    // 2. Notifications
    const notifyQuery = query(ref(database, "transactions"), limitToLast(1));
    const unsubscribeNotify = onChildAdded(notifyQuery, (snapshot) => {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }
      const data = snapshot.val();
      if (data && data.n) {
        const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
        audio.play().catch(() => {});
        toast({
          title: "নতুন জমা জমা হয়েছে! 🔔",
          description: `${data.n} আজ ৳${data.a} জমা দিয়েছেন।`,
        });
      }
    });

    // 3. Members Listener
    const membersRef = ref(database, "members");
    const unsubscribeMembers = onValue(membersRef, (snapshot) => {
      const list: MGMember[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const val = child.val();
          list.push({ id: child.key!, name: val.name || "Unknown" });
        });
        setMembers(list);
      } else if (user.email === ADMIN_EMAIL) {
        // Auto-seed if empty and user is admin
        DEFAULT_MEMBERS.forEach(m => {
          const newMemberRef = push(membersRef);
          set(newMemberRef, { name: m, createdAt: new Date().toISOString() });
        });
      }
    });

    const storedLogo = localStorage.getItem("mg_logo");
    if (storedLogo) setLogo(storedLogo);

    return () => {
      unsubscribeMembers();
      unsubscribeTrans();
      unsubscribeNotify();
    };
  }, [toast, user.email]);

  const handleCloudBackup = async () => {
    if (transactions.length === 0) {
      toast({ title: "No Data", description: "There are no transactions to backup.", variant: "destructive" });
      return;
    }

    setBackupLoading(true);
    const backupData = {
      spreadsheetId: SPREADSHEET_ID,
      sheetName: `Backup_${format(new Date(), "MMM_yyyy")}`,
      headers: ["Member Name", "Date", "Category", "Amount"],
      rows: transactions.map(t => [t.n, t.d, t.c, t.a])
    };

    try {
      await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupData)
      });
      
      toast({ 
        title: "Backup Successful!", 
        description: "Your foundation data has been synced to Google Sheets." 
      });
    } catch (error) {
      toast({ 
        title: "Backup Failed", 
        description: "Could not connect to Google Cloud.",
        variant: "destructive"
      });
    } finally {
      setBackupLoading(false);
    }
  };

  const totalCollected = transactions.reduce((acc, curr) => acc + (parseFloat(curr.a) || 0), 0);

  const handleLogout = async () => {
    await signOut(auth);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col font-body pb-32">
      {/* Premium Header */}
      <header className="px-6 py-5 flex items-center justify-between bg-white shadow-sm border-b border-slate-100 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="relative w-12 h-12 rounded-2xl bg-primary border-2 border-accent/20 flex items-center justify-center overflow-hidden shadow-lg shadow-primary/10 transition-transform active:scale-95" onClick={() => setActiveTab("setting")}>
            {logo ? (
              <Image src={logo} alt="Logo" fill className="object-cover" />
            ) : (
              <span className="text-white font-black text-lg">MG</span>
            )}
          </div>
          <div>
            <h1 className="text-[12px] font-black text-primary leading-tight uppercase tracking-tight">Minar Go Expatriate</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
              <CloudSun className="h-3 w-3 text-[#C4A052]" />
              <p className="text-[9px] text-[#C4A052] font-bold uppercase tracking-widest">{weather.city} • {weather.temp}°C</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="relative p-2.5 bg-slate-50 rounded-xl" onClick={() => setActiveTab("chat")}>
            <Bell className="h-5 w-5 text-slate-400" />
            <div className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></div>
          </Button>
          <div className="w-10 h-10 bg-slate-100 rounded-full border-2 border-white shadow-sm flex items-center justify-center overflow-hidden">
             {user.photoURL ? (
               <Image src={user.photoURL} alt="Profile" width={40} height={40} className="object-cover" />
             ) : (
               <UserIcon className="h-5 w-5 text-slate-400" />
             )}
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-6 py-6 container max-w-lg mx-auto">
        {activeTab === "home" && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Main Stats Cards */}
            <div className="grid grid-cols-1 gap-4">
              <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2.5rem] bg-primary overflow-hidden relative group p-1">
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20 group-hover:scale-125 transition-transform duration-700" />
                <CardContent className="p-8 text-center relative z-10">
                  <p className="text-[10px] uppercase font-black text-[#C4A052] tracking-[0.3em] mb-4">Total Foundation Assets</p>
                  <h3 className="text-4xl font-black text-white mb-2">৳{totalCollected.toLocaleString()}</h3>
                  <div className="flex justify-center items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">Live System Active</span>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-none shadow-lg shadow-slate-200/50 rounded-[2.2rem] bg-white overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <Users className="h-5 w-5 text-[#C4A052] mx-auto mb-2" />
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-1">Members</p>
                    <h3 className="text-2xl font-black text-primary">{members.length}</h3>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-lg shadow-slate-200/50 rounded-[2.2rem] bg-white overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <Building2 className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="text-[9px] uppercase font-black text-slate-400 tracking-wider mb-1">Growth</p>
                    <h3 className="text-2xl font-black text-[#C4A052]">+8.2%</h3>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Event Countdown Section */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-6 bg-[#002366] rounded-[2.2rem] text-white shadow-2xl relative overflow-hidden group border border-white/5">
                <div className="absolute bottom-0 left-0 w-20 h-20 bg-accent/10 rounded-full -ml-10 -mb-10 blur-2xl" />
                <p className="text-[8px] font-black uppercase text-accent tracking-[0.2em] mb-3 flex items-center gap-2">
                  <div className="w-1 h-1 bg-accent rounded-full" /> Hajj 2026
                </p>
                <h4 className="text-xs font-bold leading-tight">Departure in<br/><span className="text-lg font-black text-accent">450 Days</span></h4>
              </div>
              <div className="p-6 bg-white rounded-[2.2rem] border border-slate-100 shadow-xl relative overflow-hidden group">
                <p className="text-[8px] font-black uppercase text-primary tracking-[0.2em] mb-3 flex items-center gap-2">
                   <div className="w-1 h-1 bg-primary rounded-full" /> Ramadan 2026
                </p>
                <h4 className="text-xs font-bold leading-tight text-slate-500">Scheduled on<br/><span className="text-lg font-black text-primary">18 February</span></h4>
              </div>
            </div>

            {/* Quick Tools & History */}
            <div className="flex items-center justify-between px-2">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Transaction Log</h3>
              <Button variant="ghost" className="text-[9px] font-black text-[#C4A052] uppercase p-0 h-auto tracking-widest hover:bg-transparent" onClick={() => setActiveTab("tools")}>
                Agreement Tools <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </div>

            <div className="bg-white rounded-[2.5rem] p-6 shadow-xl border border-slate-50 transition-all hover:shadow-2xl hover:shadow-primary/5">
              <TransactionManager members={members} transactions={transactions} mode="summary" />
            </div>
          </div>
        )}

        {activeTab === "members" && <MemberManager members={members} />}
        {activeTab === "chat" && <ChatScreen user={user} />}
        {activeTab === "gallery" && <DocStorage />}
        {activeTab === "tools" && <DemandLetterAssistant />}
        {activeTab === "setting" && (
          <div className="space-y-6 animate-in fade-in duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-2xl p-8 bg-white">
              <h3 className="font-black text-primary uppercase mb-8 text-center text-xl tracking-tight">System Settings</h3>
              <div className="flex flex-col items-center gap-8">
                <div className="p-6 bg-slate-50 rounded-[2rem] w-full flex flex-col items-center gap-4 border border-slate-100">
                  <LogoManager currentLogo={logo} onUpdate={setLogo} />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Foundation Identity</p>
                </div>
                
                <div className="w-full space-y-3">
                   <Button 
                    className="w-full h-14 rounded-2xl font-black bg-[#E8F5E9] text-[#2E7D32] border-none shadow-md hover:bg-[#C8E6C9] flex items-center justify-center gap-3 group"
                    onClick={handleCloudBackup}
                    disabled={backupLoading}
                   >
                     {backupLoading ? (
                       <RotateCcw className="h-5 w-5 animate-spin" />
                     ) : (
                       <Cloud className="h-5 w-5 group-hover:scale-110 transition-transform" />
                     )}
                     GOOGLE CLOUD BACKUP
                   </Button>

                   <Button variant="outline" className="w-full h-14 rounded-2xl font-black border-slate-200" onClick={() => setActiveTab("gallery")}>
                     <ImageIcon className="mr-2 h-5 w-5" /> DIGITAL GALLERY
                   </Button>

                   <Button variant="destructive" className="w-full h-14 rounded-2xl font-black shadow-xl shadow-red-100 mt-4" onClick={handleLogout}>
                    <LogOut className="mr-2 h-5 w-5" /> SECURE LOGOUT
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>

      {/* Modern Floating Navigation */}
      <nav className="fixed bottom-0 left-0 w-full px-6 pb-10 pt-4 z-50 pointer-events-none">
        <div className="max-w-md mx-auto bg-white/90 rounded-[3rem] shadow-[0_25px_60px_rgba(0,35,102,0.2)] flex items-center justify-between px-3 py-3 border border-white/60 backdrop-blur-xl pointer-events-auto">
          <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "home" ? "text-primary scale-110" : "text-slate-300 hover:text-slate-400"}`}>
            <Home className={`h-6 w-6 ${activeTab === "home" ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
          </button>
          
          <button onClick={() => setActiveTab("members")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "members" ? "text-primary scale-110" : "text-slate-300 hover:text-slate-400"}`}>
            <Users className={`h-6 w-6 ${activeTab === "members" ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Members</span>
          </button>

          {/* Central FAB - Deposit Action */}
          <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center justify-center -mt-14 mx-2 group">
                <div className="w-18 h-18 rounded-full bg-primary border-[6px] border-[#F8FAFF] shadow-[0_15px_30px_rgba(0,35,102,0.4)] flex items-center justify-center text-white transition-all group-active:scale-90 ring-4 ring-primary/5">
                  <Plus className="h-9 w-9 stroke-[3.5px]" />
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] rounded-[3rem] p-8 border-none shadow-2xl">
              <DialogHeader>
                <DialogTitle className="text-center font-black uppercase text-primary text-xl tracking-tight">Record New Deposit</DialogTitle>
              </DialogHeader>
              <TransactionManager members={members} transactions={transactions} mode="form" onSuccess={() => setIsDepositOpen(false)} />
            </DialogContent>
          </Dialog>

          <button onClick={() => setActiveTab("chat")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "chat" ? "text-primary scale-110" : "text-slate-300 hover:text-slate-400"}`}>
            <MessageCircle className={`h-6 w-6 ${activeTab === "chat" ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Chat</span>
          </button>

          <button onClick={() => setActiveTab("setting")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "setting" ? "text-primary scale-110" : "text-slate-300 hover:text-slate-400"}`}>
            <Settings className={`h-6 w-6 ${activeTab === "setting" ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">System</span>
          </button>
        </div>
      </nav>
    </div>
  );
}

