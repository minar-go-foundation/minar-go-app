"use client";

import { useState, useEffect } from "react";
import { User, signOut } from "firebase/auth";
import { auth, database } from "@/lib/firebase";
import { ref, onValue, set, push, remove } from "firebase/database";
import { 
  LogOut, 
  Plus, 
  Trash2, 
  FileText, 
  Phone, 
  Download, 
  Upload, 
  Camera,
  Search,
  Users,
  CreditCard,
  Target,
  PieChart,
  CloudUpload
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import MemberManager from "./member-manager";
import TransactionManager from "./transaction-manager";
import DemandLetterAssistant from "./demand-letter-assistant";
import DocStorage from "./doc-storage";
import LogoManager from "./logo-manager";

const DEFAULT_MEMBERS = [
  "Mr. Dulal", "Mr. Omar Faruk", "Mr. Sulaiman badshah", "Mr. Abdul qayum", 
  "Mr. Mohammed Jamshed", "Mr. Milad", "Mr. Ala uddin", "Mr. Shahid", 
  "Mr. Shohag", "Mr. Abul Hussain", "Mr. Sakib", "Mr. Ronnie", 
  "Mr. Jonye", "Mr. Aqib", "Mr. Shahid (Member)"
];

export default function DashboardScreen({ user }: { user: User }) {
  const [members, setMembers] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [logo, setLogo] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Sync members
    const membersRef = ref(database, "member_list");
    onValue(membersRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMembers(Object.values(data));
      } else {
        // Init with default members if empty
        DEFAULT_MEMBERS.forEach(m => push(membersRef, m));
      }
    });

    // Sync transactions
    const transRef = ref(database, "transactions");
    onValue(transRef, (snapshot) => {
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

    // Load logo
    const storedLogo = localStorage.getItem("mg_logo");
    if (storedLogo) setLogo(storedLogo);
  }, []);

  const totalCollected = transactions.reduce((acc, curr) => acc + (parseFloat(curr.a) || 0), 0);

  const handleLogout = async () => {
    await signOut(auth);
    toast({ title: "Logged out", description: "Goodbye!" });
  };

  const backupToSheets = () => {
    window.open("https://script.google.com/macros/s/AKfycbx0V8EesGLJjp9xXVFi6Q_GQdjNzzH9TsmvXFtoD1Qk76x8Rl7kE7tyFRVmbVFWoRYXeA/exec", "_blank");
  };

  return (
    <div className="min-h-screen pb-12 bg-background">
      {/* Sticky Header */}
      <header className="sticky top-0 z-50 w-full bg-primary text-white shadow-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoManager currentLogo={logo} onUpdate={setLogo} />
            <div>
              <h1 className="text-sm font-bold leading-tight">MINAR GO EXPATRIATE</h1>
              <p className="text-[10px] text-accent font-semibold uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="bg-transparent border-white/20 text-white hover:bg-white/10 hidden sm:flex" onClick={backupToSheets}>
              <CloudUpload className="mr-2 h-4 w-4" /> Backup
            </Button>
            <Button variant="ghost" size="sm" className="text-accent hover:text-white hover:bg-white/10" onClick={handleLogout}>
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 mt-6 max-w-5xl space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white shadow-sm border-l-4 border-l-primary">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <CreditCard className="mb-2 text-primary" />
              <p className="text-xs text-muted-foreground uppercase font-bold">Total Collection</p>
              <h3 className="text-xl font-extrabold text-primary">৳{totalCollected.toLocaleString()}</h3>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-l-4 border-l-green-600">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <PieChart className="mb-2 text-green-600" />
              <p className="text-xs text-muted-foreground uppercase font-bold">Distribution</p>
              <h3 className="text-xl font-extrabold text-green-700">100% Complete</h3>
            </CardContent>
          </Card>
          <Card className="bg-white shadow-sm border-l-4 border-l-accent">
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Target className="mb-2 text-accent" />
              <p className="text-xs text-muted-foreground uppercase font-bold">Zakat / Fitra</p>
              <h3 className="text-xl font-extrabold text-accent">Allocating Soon</h3>
            </CardContent>
          </Card>
          <Card 
            className="bg-white shadow-sm border-l-4 border-l-blue-400 cursor-pointer active:scale-95 transition-transform"
            onClick={() => window.open("https://zegocloud.com", "_blank")}
          >
            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
              <Phone className="mb-2 text-blue-500" />
              <p className="text-xs text-muted-foreground uppercase font-bold">Foundation Call</p>
              <h3 className="text-sm font-bold text-blue-600">Start Group Meeting</h3>
            </CardContent>
          </Card>
        </div>

        {/* Action Grids */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TransactionManager members={members} />
          <MemberManager members={members} />
        </div>

        <DemandLetterAssistant />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DocStorage />
        </div>
      </div>
    </div>
  );
}
