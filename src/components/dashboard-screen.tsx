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
  ChevronDown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import MemberManager from "./member-manager";
import TransactionManager from "./transaction-manager";
import DemandLetterAssistant from "./demand-letter-assistant";
import DocStorage from "./doc-storage";
import LogoManager from "./logo-manager";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  const { toast } = useToast();
  
  const isInitialLoad = useRef(true);

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
      } else {
        setTransactions([]);
      }
    });

    // 2. Notifications for Transactions
    const notifyQuery = query(ref(database, "transactions"), limitToLast(1));
    const unsubscribeNotify = onChildAdded(notifyQuery, (snapshot) => {
      if (isInitialLoad.current) {
        isInitialLoad.current = false;
        return;
      }
      const data = snapshot.val();
      if (data && data.n) {
        try {
          const audio = new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3");
          audio.play().catch(() => {});
        } catch (e) {}
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
          list.push({
            id: child.key!,
            name: (typeof val === 'object' ? val.name : val) || "Unknown"
          });
        });
        setMembers(list);
      } else {
        setMembers([]);
        // Auto-seed if empty
        if (user.email === ADMIN_EMAIL) {
          DEFAULT_MEMBERS.forEach(m => {
            const newMemberRef = push(membersRef);
            set(newMemberRef, { name: m, createdAt: new Date().toISOString() });
          });
        }
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

  const totalCollected = transactions.reduce((acc, curr) => acc + (parseFloat(curr.a) || 0), 0);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Logged out", description: "Goodbye!" });
  };

  return (
    <div className="min-h-screen bg-[#F8FAFF] flex flex-col font-body">
      {/* Header matching the image */}
      <header className="px-6 py-4 flex items-center justify-between bg-white shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center text-white font-black text-sm">
            MG
          </div>
          <div>
            <h1 className="text-[10px] font-black text-primary leading-tight uppercase tracking-tight">Minar Go Expatriate</h1>
            <p className="text-[9px] text-[#C4A052] font-bold uppercase tracking-widest leading-none mt-0.5">Foundation HQ</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Bell className="h-6 w-6 text-slate-400" />
            <div className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
            <UserIcon className="h-5 w-5 text-slate-400" />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-36">
        <div className="container mx-auto px-6 mt-6 max-w-lg space-y-6">
          
          {activeTab === "home" && (
            <div className="space-y-6">
              {/* Main Stats Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4">Total Collection</p>
                    <h3 className="text-3xl font-black text-primary">৳{totalCollected.toLocaleString()}</h3>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-xl shadow-slate-200/50 rounded-[2rem] overflow-hidden">
                  <CardContent className="p-6 text-center">
                    <p className="text-[10px] uppercase font-black text-slate-400 tracking-widest mb-4">Total Members</p>
                    <h3 className="text-3xl font-black text-[#C4A052]">{members.length}</h3>
                  </CardContent>
                </Card>
              </div>

              {/* Event Cards */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="bg-primary text-white border-none shadow-xl rounded-[2.5rem] overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#C4A052]"></div>
                  <CardContent className="p-6 text-center flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center mb-1">
                      <Building2 className="h-7 w-7 text-[#C4A052]" />
                    </div>
                    <p className="text-[9px] uppercase font-black tracking-widest text-[#C4A052]">Hajj 2026</p>
                    <h4 className="text-xs font-bold">27 May, 2026</h4>
                  </CardContent>
                </Card>
                <Card className="bg-white text-primary border-none shadow-xl rounded-[2.5rem] overflow-hidden relative">
                  <div className="absolute top-0 left-0 w-1 h-full bg-primary"></div>
                  <CardContent className="p-6 text-center flex flex-col items-center gap-2">
                    <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center mb-1">
                      <Moon className="h-7 w-7 text-[#C4A052]" />
                    </div>
                    <p className="text-[9px] uppercase font-black tracking-widest text-primary">Ramadan</p>
                    <h4 className="text-xs font-bold text-slate-500">18 Feb, 2026</h4>
                  </CardContent>
                </Card>
              </div>

              {/* Log History Header */}
              <div className="flex items-center justify-between px-2 pt-2">
                <div className="flex items-center gap-2">
                  <RotateCcw className="h-5 w-5 text-[#C4A052]" />
                  <h3 className="text-sm font-black text-primary uppercase tracking-tight">Log History</h3>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                    <RotateCcw className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="p-2.5 bg-white rounded-xl shadow-sm border border-slate-100">
                    <Download className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-white rounded-xl shadow-sm border border-slate-100 px-3 py-1.5 flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-slate-400">all</span>
                    <ChevronDown className="h-3 w-3 text-slate-400" />
                  </div>
                </div>
              </div>

              {/* Log History Content */}
              <div className="min-h-[250px] flex flex-col items-center justify-center bg-white/50 rounded-[3rem] border-2 border-dashed border-slate-200">
                {transactions.length === 0 ? (
                  <div className="text-center space-y-3 opacity-30">
                    <RotateCcw className="h-16 w-16 mx-auto" />
                    <p className="text-xs font-black uppercase tracking-[0.2em]">No Deposits Logged</p>
                  </div>
                ) : (
                  <TransactionManager members={members} transactions={transactions} mode="summary" />
                )}
              </div>
            </div>
          )}

          {activeTab === "members" && <MemberManager members={members} />}
          {activeTab === "gallery" && <DocStorage />}
          {activeTab === "tools" && <DemandLetterAssistant />}
          {activeTab === "setting" && (
            <div className="space-y-6">
              <Card className="rounded-[2.5rem] border-none shadow-xl p-8 bg-white">
                <h3 className="font-black text-primary uppercase mb-6 text-center">Admin Settings</h3>
                <div className="flex flex-col items-center gap-4">
                  <LogoManager currentLogo={logo} onUpdate={setLogo} />
                  <p className="text-xs font-bold text-slate-400 uppercase">Change Foundation Logo</p>
                  <Button variant="destructive" className="w-full h-14 rounded-2xl font-black mt-8" onClick={handleLogout}>
                    <LogOut className="mr-2" /> SECURE LOGOUT
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>

      {/* Floating Bottom Nav matching the image */}
      <nav className="fixed bottom-0 left-0 w-full px-6 pb-10 pt-4 z-50">
        <div className="max-w-md mx-auto bg-white rounded-[2.8rem] shadow-2xl flex items-center justify-between px-3 py-3 border border-slate-100/50">
          <button onClick={() => setActiveTab("home")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "home" ? "text-primary" : "text-slate-300"}`}>
            <Home className={`h-6 w-6 ${activeTab === "home" ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Home</span>
          </button>
          
          <button onClick={() => setActiveTab("members")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "members" ? "text-primary" : "text-slate-300"}`}>
            <Users className={`h-6 w-6 ${activeTab === "members" ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Members</span>
          </button>

          <button onClick={() => setActiveTab("chat")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "chat" ? "text-primary" : "text-slate-300"}`}>
            <MessageCircle className="h-6 w-6 stroke-[1.5px]" />
            <span className="text-[8px] font-black uppercase tracking-widest">Chat</span>
          </button>

          <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center justify-center -mt-10 mx-2 group">
                <div className="w-16 h-16 rounded-full bg-primary border-[6px] border-white shadow-2xl flex items-center justify-center text-white transition-transform active:scale-90 shadow-primary/30">
                  <Video className="h-7 w-7 stroke-[2.5px]" />
                </div>
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] rounded-[3rem] p-8">
              <DialogHeader><DialogTitle className="text-center font-black uppercase text-primary">Record New Deposit</DialogTitle></DialogHeader>
              <TransactionManager members={members} transactions={transactions} mode="form" onSuccess={() => setIsDepositOpen(false)} />
            </DialogContent>
          </Dialog>

          <button onClick={() => setActiveTab("gallery")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "gallery" ? "text-primary" : "text-slate-300"}`}>
            <ImageIcon className={`h-6 w-6 ${activeTab === "gallery" ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Gallery</span>
          </button>

          <button onClick={() => setActiveTab("setting")} className={`flex flex-col items-center justify-center gap-1.5 flex-1 py-2 transition-all ${activeTab === "setting" ? "text-primary" : "text-slate-300"}`}>
            <Settings className={`h-6 w-6 ${activeTab === "setting" ? "stroke-[2.5px]" : "stroke-[1.5px]"}`} />
            <span className="text-[8px] font-black uppercase tracking-widest">Setting</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
