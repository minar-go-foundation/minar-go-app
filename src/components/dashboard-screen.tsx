
"use client";

import { useState, useEffect } from "react";
import { User, signOut } from "firebase/auth";
import { auth, database } from "@/lib/firebase";
import { ref, onValue, push } from "firebase/database";
import { 
  LogOut, 
  Plus, 
  Home, 
  Users, 
  Image as ImageIcon, 
  FileText,
  CloudUpload,
  CreditCard,
  PieChart,
  Target,
  Phone,
  Database
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

const DEFAULT_MEMBERS = [
  "Mr. Dulal", "Mr. Omar Faruk", "Mr. Sulaiman badshah", "Mr. Abdul qayum", 
  "Mr. Mohammed Jamshed", "Mr. Milad", "Mr. Ala uddin", "Mr. Shahid", 
  "Mr. Shohag", "Mr. Abul Hussain", "Mr. Sakib", "Mr. Ronnie", 
  "Mr. Jonye", "Mr. Aqib", "Mr. Shahid (Member)"
];

type Tab = "profile" | "members" | "gallery" | "tools";

export default function DashboardScreen({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [members, setMembers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [logo, setLogo] = useState<string | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const membersRef = ref(database, "member_list");
    const unsubscribeMembers = onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.values(data).map(m => 
          typeof m === 'object' ? (m as any).name : m
        );
        setMembers(list);
      } else {
        DEFAULT_MEMBERS.forEach(m => push(membersRef, m));
      }
    });

    const transRef = ref(database, "transactions");
    const unsubscribeTrans = onValue(transRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const list = Object.entries(data).map(([key, value]: [string, any]) => ({
          id: key,
          ...value
        }));
        setTransactions(list.sort((a, b) => new Date(b.d).getTime() - new Date(a.d).getTime()));
      } else {
        setTransactions([]);
      }
    });

    const storedLogo = localStorage.getItem("mg_logo");
    if (storedLogo) setLogo(storedLogo);

    return () => {
      unsubscribeMembers();
      unsubscribeTrans();
    };
  }, []);

  const totalCollected = transactions.reduce((acc, curr) => acc + (parseFloat(curr.a) || 0), 0);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Logged out", description: "Goodbye!" });
  };

  const backupToSheets = async () => {
    if (transactions.length === 0) {
      toast({ title: "No Data", description: "ব্যাকআপের জন্য কোন ডাটা নেই!", variant: "destructive" });
      return;
    }

    const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbx0V8EesGLJjp9xXVFi6Q_GQdjNzzH9TsmvXFtoD1Qk76x8Rl7kE7tyFRVmbVFWoRYXeA/exec";
    
    let rows = transactions.map(r => [r.n, r.d, r.a]);
    let total = transactions.reduce((s, r) => s + (parseFloat(r.a) || 0), 0);
    rows.push(["TOTAL COLLECTION", "", total.toString()]);
    rows.push(["Backup Date", new Date().toLocaleString(), ""]);
    
    let payload = { 
        sheetName: "MinarGo_Data", 
        headers: ["Member Name", "Date", "Amount (TK)"], 
        rows: rows 
    };
    
    try {
        toast({ title: "Backing up...", description: "গুগল শিটে ডাটা পাঠানো হচ্ছে।" });
        await fetch(GOOGLE_SHEETS_URL, { 
            method: "POST", 
            mode: "no-cors", 
            body: JSON.stringify(payload) 
        });
        toast({ title: "Backup Successful", description: "✅ গুগল শিট ব্যাকআপ সম্পন্ন!" });
    } catch(e) { 
        toast({ title: "Backup Failed", description: "❌ ব্যাকআপ ব্যর্থ হয়েছে", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <LogoManager currentLogo={logo} onUpdate={setLogo} />
          <div>
            <h1 className="text-xs font-black text-primary leading-tight uppercase tracking-tight">Minar Go</h1>
            <p className="text-[8px] text-accent font-bold uppercase tracking-widest">Expatriate Foundation</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="text-primary" onClick={backupToSheets}>
            <CloudUpload className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-32">
        <div className="container mx-auto px-4 mt-6 max-w-lg space-y-6">
          
          {activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Profile Card */}
              <Card className="bg-primary text-white border-none shadow-xl overflow-hidden relative">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                <CardContent className="p-6 relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md border border-white/30">
                      {logo ? (
                        <img src={logo} className="w-full h-full object-cover rounded-2xl" alt="Logo" />
                      ) : (
                        <Home className="h-7 w-7" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-black text-lg">Admin Dashboard</h2>
                      <p className="text-white/70 text-xs font-medium">{user.email}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Total Fund</p>
                      <h3 className="text-xl font-black">৳{totalCollected.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
                      <p className="text-[10px] uppercase font-bold text-white/60 mb-1">Status</p>
                      <h3 className="text-lg font-black text-accent">ACTIVE</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions Stats */}
              <div className="grid grid-cols-2 gap-4">
                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer" onClick={backupToSheets}>
                  <CardContent className="p-5 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center mb-3">
                      <Database className="text-blue-600 h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cloud Backup</p>
                    <h4 className="text-sm font-black text-slate-800">GOOGLE SHEETS</h4>
                  </CardContent>
                </Card>
                <Card className="border-none shadow-sm bg-white hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="p-5 flex flex-col items-center text-center">
                    <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center mb-3">
                      <Target className="text-orange-600 h-5 w-5" />
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Next Target</p>
                    <h4 className="text-sm font-black text-slate-800">Eid Zakat</h4>
                  </CardContent>
                </Card>
              </div>

              <Button 
                variant="outline" 
                className="w-full h-14 rounded-2xl border-2 border-slate-200 bg-white text-blue-600 font-black flex items-center justify-center gap-3 shadow-sm active:scale-95 transition-all"
                onClick={() => window.open("https://zegocloud.com", "_blank")}
              >
                <Phone className="h-5 w-5" />
                FOUNDATION GROUP CALL
              </Button>

              <TransactionManager members={members} transactions={transactions} mode="summary" />
            </div>
          )}

          {activeTab === "members" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <MemberManager members={members} />
            </div>
          )}

          {activeTab === "gallery" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <DocStorage />
            </div>
          )}

          {activeTab === "tools" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-500">
              <DemandLetterAssistant />
            </div>
          )}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 w-full px-6 pb-8 pt-4 bg-transparent pointer-events-none z-50">
        <div className="max-w-md mx-auto bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,35,102,0.15)] flex items-center justify-between px-2 py-2 border border-slate-100 pointer-events-auto">
          
          <button 
            onClick={() => setActiveTab("profile")}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-[2rem] transition-all ${activeTab === "profile" ? "bg-slate-50 text-primary" : "text-slate-400"}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === "profile" ? "bg-white shadow-sm" : ""}`}>
              <Home className={`h-5 w-5 ${activeTab === "profile" ? "fill-primary/10" : ""}`} />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Profile</span>
          </button>

          <button 
            onClick={() => setActiveTab("members")}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-[2rem] transition-all ${activeTab === "members" ? "bg-slate-50 text-primary" : "text-slate-400"}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === "members" ? "bg-white shadow-sm" : ""}`}>
              <Users className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Members</span>
          </button>

          {/* Floating Action Button Style */}
          <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center justify-center -mt-12 group">
                <div className="w-16 h-16 rounded-full bg-accent border-4 border-white shadow-xl shadow-accent/40 flex items-center justify-center text-white transition-transform active:scale-90 group-hover:scale-105">
                  <Plus className="h-8 w-8 stroke-[3px]" />
                </div>
                <div className="mt-1 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full shadow-sm">
                  <span className="text-[8px] font-black text-primary uppercase tracking-widest">Deposit</span>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[90vw] rounded-3xl">
              <DialogHeader>
                <DialogTitle>New Deposit Entry</DialogTitle>
              </DialogHeader>
              <TransactionManager 
                members={members} 
                transactions={transactions} 
                mode="form" 
                onSuccess={() => setIsDepositOpen(false)}
              />
            </DialogContent>
          </Dialog>

          <button 
            onClick={() => setActiveTab("gallery")}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-[2rem] transition-all ${activeTab === "gallery" ? "bg-slate-50 text-primary" : "text-slate-400"}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === "gallery" ? "bg-white shadow-sm" : ""}`}>
              <ImageIcon className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Gallery</span>
          </button>

          <button 
            onClick={() => setActiveTab("tools")}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-[2rem] transition-all ${activeTab === "tools" ? "bg-slate-50 text-primary" : "text-slate-400"}`}
          >
            <div className={`p-2 rounded-xl transition-colors ${activeTab === "tools" ? "bg-white shadow-sm" : ""}`}>
              <FileText className="h-5 w-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-tighter">Tools</span>
          </button>

        </div>
      </nav>
    </div>
  );
}
