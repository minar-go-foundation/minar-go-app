
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
  CloudUpload,
  CloudSun,
  MapPin
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

type Tab = "profile" | "members" | "gallery" | "tools";

export interface MGMember {
  id: string;
  name: string;
}

export default function DashboardScreen({ user }: { user: User }) {
  const [activeTab, setActiveTab] = useState<Tab>("profile");
  const [members, setMembers] = useState<MGMember[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [logo, setLogo] = useState<string | null>(null);
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [weather, setWeather] = useState<{ temp: number; city: string } | null>(null);
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

    // 3. Members Listener - Robust Sync
    const membersRef = ref(database, "members");
    const unsubscribeMembers = onValue(membersRef, (snapshot) => {
      const list: MGMember[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((child) => {
          const val = child.val();
          list.push({
            id: child.key!,
            name: (typeof val === 'object' ? val.name : val) || "Unknown Member"
          });
        });
        setMembers(list);
      } else if (user.email === ADMIN_EMAIL) {
        // Seed if admin and database is empty
        DEFAULT_MEMBERS.forEach(m => {
          const newMemberRef = push(membersRef);
          set(newMemberRef, { 
            name: m, 
            createdAt: new Date().toISOString() 
          });
        });
      }
    });

    const storedLogo = localStorage.getItem("mg_logo");
    if (storedLogo) setLogo(storedLogo);

    // Weather detection
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          // Fetch Weather
          const wRes = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`);
          const wData = await wRes.json();
          
          // Fetch City Name
          const geoRes = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
          const geoData = await geoRes.json();
          const cityName = geoData.city || geoData.locality || "Detected Location";
          
          setWeather({ 
            temp: Math.round(wData.current_weather.temperature), 
            city: cityName 
          });
        } catch (e) {
          console.error("Weather fetch failed:", e);
        }
      }, (err) => {
        console.warn("Geolocation access denied:", err);
      });
    }

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

  const backupToSheets = async () => {
    if (transactions.length === 0) {
      toast({ title: "No Data", description: "ব্যাকআপের জন্য কোন ডাটা নেই!", variant: "destructive" });
      return;
    }
    const GOOGLE_SHEETS_URL = "https://script.google.com/macros/s/AKfycbx0V8EesGLJjp9xXVFi6Q_GQdjNzzH9TsmvXFtoD1Qk76x8Rl7kE7tyFRVmbVFWoRYXeA/exec";
    let rows = transactions.map(r => [r.n, r.d, r.a]);
    let total = transactions.reduce((s, r) => s + (parseFloat(r.a) || 0), 0);
    rows.push(["TOTAL COLLECTION", "", total.toString()]);
    let payload = { sheetName: "MinarGo_Backup", headers: ["Member Name", "Date", "Amount (Tk)"], rows: rows };
    try {
        toast({ title: "Backing up...", description: "গুগল শিটে ডাটা পাঠানো হচ্ছে।" });
        await fetch(GOOGLE_SHEETS_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(payload) });
        toast({ title: "Backup Successful", description: "✅ গুগল শিট ব্যাকআপ সম্পন্ন!" });
    } catch(e) { 
        toast({ title: "Backup Failed", description: "❌ ব্যাকআপ ব্যর্থ হয়েছে", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-body">
      <header className="bg-white border-b sticky top-0 z-40 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <LogoManager currentLogo={logo} onUpdate={setLogo} />
          <div>
            <h1 className="text-xs font-black text-primary leading-tight uppercase tracking-tight">Minar Go</h1>
            <p className="text-[8px] text-accent font-bold uppercase tracking-widest leading-none mt-0.5">Expatriate Foundation</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {weather && (
            <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-full border border-slate-200">
              <CloudSun className="h-4 w-4 text-orange-500" />
              <div className="flex flex-col">
                <span className="text-[9px] font-black text-primary leading-none uppercase">{weather.city}</span>
                <span className="text-[10px] font-bold text-slate-600 leading-tight">{weather.temp}°C</span>
              </div>
            </div>
          )}
          <Button variant="ghost" size="icon" className="text-blue-600 hover:bg-blue-50" onClick={backupToSheets}>
            <CloudUpload className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-destructive hover:bg-red-50" onClick={handleLogout}>
            <LogOut className="h-5 w-5" />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto pb-32">
        <div className="container mx-auto px-4 mt-6 max-w-lg space-y-6">
          
          {activeTab === "profile" && (
            <div className="space-y-6">
              <Card className="bg-primary text-white border-none shadow-xl overflow-hidden relative">
                <CardContent className="p-6 relative">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                      {logo ? (
                        <img src={logo} className="w-full h-full object-cover rounded-2xl" alt="Logo" />
                      ) : (
                        <Home className="h-7 w-7" />
                      )}
                    </div>
                    <div>
                      <h2 className="font-black text-lg">Admin Dashboard</h2>
                      <p className="text-[10px] text-accent uppercase font-bold tracking-widest">Live Monitoring</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white/10 p-4 rounded-2xl">
                      <p className="text-[10px] uppercase font-bold text-white/60">Total Fund</p>
                      <h3 className="text-xl font-black">৳{totalCollected.toLocaleString()}</h3>
                    </div>
                    <div className="bg-white/10 p-4 rounded-2xl">
                      <p className="text-[10px] uppercase font-bold text-white/60">Members</p>
                      <h3 className="text-xl font-black">{members.length}</h3>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-none shadow-md bg-white rounded-3xl overflow-hidden">
                <CardContent className="p-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-2xl text-blue-600">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h4 className="text-sm font-black uppercase text-slate-800">Location Sync</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Live Weather Monitoring</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary uppercase">{weather?.city || "Detecting..."}</p>
                    <p className="text-[10px] font-bold text-slate-400">{weather ? `${weather.temp}°C` : "Allow Permission"}</p>
                  </div>
                </CardContent>
              </Card>

              <TransactionManager members={members} transactions={transactions} mode="summary" />
            </div>
          )}

          {activeTab === "members" && <MemberManager members={members} />}
          {activeTab === "gallery" && <DocStorage />}
          {activeTab === "tools" && <DemandLetterAssistant />}
        </div>
      </main>

      <nav className="fixed bottom-0 left-0 w-full px-6 pb-8 pt-4 z-50">
        <div className="max-w-md mx-auto bg-white rounded-[2.5rem] shadow-2xl flex items-center justify-between px-2 py-2 border">
          <button onClick={() => setActiveTab("profile")} className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-[2rem] transition-all ${activeTab === "profile" ? "bg-slate-50 text-primary" : "text-slate-400"}`}>
            <Home className="h-5 w-5" />
            <span className="text-[9px] font-black uppercase">Profile</span>
          </button>
          <button onClick={() => setActiveTab("members")} className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-[2rem] transition-all ${activeTab === "members" ? "bg-slate-50 text-primary" : "text-slate-400"}`}>
            <Users className="h-5 w-5" />
            <span className="text-[9px] font-black uppercase">Members</span>
          </button>
          <Dialog open={isDepositOpen} onOpenChange={setIsDepositOpen}>
            <DialogTrigger asChild>
              <button className="flex flex-col items-center justify-center -mt-12">
                <div className="w-16 h-16 rounded-full bg-accent border-4 border-white shadow-xl flex items-center justify-center text-white">
                  <Plus className="h-8 w-8 stroke-[3px]" />
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] rounded-[2rem] p-6">
              <DialogHeader><DialogTitle>New Deposit</DialogTitle></DialogHeader>
              <TransactionManager members={members} transactions={transactions} mode="form" onSuccess={() => setIsDepositOpen(false)} />
            </DialogContent>
          </Dialog>
          <button onClick={() => setActiveTab("gallery")} className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-[2rem] transition-all ${activeTab === "gallery" ? "bg-slate-50 text-primary" : "text-slate-400"}`}>
            <ImageIcon className="h-5 w-5" />
            <span className="text-[9px] font-black uppercase">Gallery</span>
          </button>
          <button onClick={() => setActiveTab("tools")} className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 rounded-[2rem] transition-all ${activeTab === "tools" ? "bg-slate-50 text-primary" : "text-slate-400"}`}>
            <FileText className="h-5 w-5" />
            <span className="text-[9px] font-black uppercase">Tools</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
