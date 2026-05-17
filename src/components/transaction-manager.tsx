
"use client";

import { useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, push, remove } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Plus, Trash2, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const CATEGORIES = ["প্রতি মাসের জমা", "যাকাত", "ফিতরা", "বাড়ির কাজ"];

interface TransactionManagerProps {
  members: any[];
  transactions: any[];
  mode?: "form" | "summary" | "full";
  onSuccess?: () => void;
}

export default function TransactionManager({ members, transactions, mode = "full", onSuccess }: TransactionManagerProps) {
  const [selectedMember, setSelectedMember] = useState("");
  const [category, setCategory] = useState("প্রতি মাসের জমা");
  const [amount, setAmount] = useState("5000");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [filterMonth, setFilterMonth] = useState("All");
  const { toast } = useToast();

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (filterMonth !== "All") {
      list = list.filter(t => {
        try {
          const tMonth = new Date(t.d).getMonth();
          return MONTHS[tMonth] === filterMonth;
        } catch (e) {
          return false;
        }
      });
    }
    return list.sort((a, b) => new Date(b.d).getTime() - new Date(a.d).getTime());
  }, [transactions, filterMonth]);

  const totalFiltered = filteredTransactions.reduce((acc, curr) => acc + (parseFloat(curr.a) || 0), 0);

  const handleAddDeposit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !amount) {
      toast({ title: "Validation Error", description: "Select a member and enter amount.", variant: "destructive" });
      return;
    }

    try {
      await push(ref(database, "transactions"), {
        n: selectedMember,
        c: category,
        a: amount,
        d: date
      });
      toast({ title: "Deposit Recorded", description: "Transaction saved successfully." });
      if (onSuccess) onSuccess();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save transaction", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!id) return;
    if (!confirm("Delete this transaction?")) return;
    
    try {
      const transRef = ref(database, `transactions/${id}`);
      await remove(transRef);
      toast({ title: "Deleted", description: "Transaction removed successfully." });
    } catch (error: any) {
      console.error("Delete error:", error);
      toast({ title: "Error", description: "Delete failed: " + error.message, variant: "destructive" });
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("MINAR GO EXPATRIATE DEVELOPMENT FOUNDATION", 105, 15, { align: "center" });
    doc.setFontSize(14);
    doc.text(`Collection Summary Report - ${filterMonth} Month(s)`, 105, 25, { align: "center" });
    
    const tableData = filteredTransactions.map(t => [t.n, t.d, t.c, `BDT ${t.a}`]);
    
    autoTable(doc, {
      startY: 35,
      head: [["Member Name", "Date", "Category", "Amount"]],
      body: tableData,
      foot: [["TOTAL", "", "", `BDT ${totalFiltered}`]],
      theme: "striped"
    });
    
    doc.save(`MinarGo_Report_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  if (mode === "form") {
    return (
      <form onSubmit={handleAddDeposit} className="space-y-4 py-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Select Member</label>
          <Select onValueChange={setSelectedMember} value={selectedMember}>
            <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50">
              <SelectValue placeholder="Member Name" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m, idx) => {
                const name = typeof m === 'object' ? (m.name || "Unknown") : m;
                return <SelectItem key={idx} value={name}>{name}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Purpose/Category</label>
          <Select onValueChange={setCategory} value={category}>
            <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50">
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map(c => (
                <SelectItem key={c} value={c} className="font-bengali">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Amount (৳)</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-xl border-slate-100 bg-slate-50 font-black text-primary" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl border-slate-100 bg-slate-50" />
          </div>
        </div>
        <Button type="submit" className="w-full bg-primary h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20 mt-4 active:scale-95 transition-all">
          CONFIRM DEPOSIT
        </Button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      {mode === "full" && (
        <Card className="shadow-lg border-none overflow-hidden rounded-3xl">
          <CardHeader className="bg-primary text-white p-6">
            <CardTitle className="flex items-center gap-2 text-lg uppercase font-black tracking-tight">
              <Plus className="h-5 w-5" /> New Deposit Entry
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleAddDeposit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Member</label>
                <Select onValueChange={setSelectedMember} value={selectedMember}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50">
                    <SelectValue placeholder="Select Member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((m, idx) => {
                      const name = typeof m === 'object' ? (m.name || "Unknown") : m;
                      return <SelectItem key={idx} value={name}>{name}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Category</label>
                <Select onValueChange={setCategory} value={category}>
                  <SelectTrigger className="h-12 rounded-xl border-slate-100 bg-slate-50">
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map(c => (
                      <SelectItem key={c} value={c} className="font-bengali">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Amount (৳)</label>
                <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-xl border-slate-100 bg-slate-50 font-black text-primary" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-slate-400">Date</label>
                <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl border-slate-100 bg-slate-50" />
              </div>
              <Button type="submit" className="md:col-span-2 bg-primary hover:bg-primary/90 h-14 rounded-2xl text-lg font-black active:scale-95 transition-all mt-2">
                SUBMIT RECORD
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="shadow-lg border-none bg-white rounded-3xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-6">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-xl text-primary">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-sm font-black text-primary uppercase">Summary</CardTitle>
              <CardDescription className="text-[8px] font-bold uppercase text-slate-400">Financial History</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Select onValueChange={setFilterMonth} value={filterMonth}>
              <SelectTrigger className="w-[100px] h-9 text-[10px] font-bold rounded-xl border-slate-100 bg-slate-50">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Months</SelectItem>
                {MONTHS.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="outline" className="h-9 w-9 rounded-xl border-slate-100" onClick={exportPDF}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50">
              <TableRow className="border-b border-slate-100">
                <TableHead className="text-[10px] font-black uppercase text-slate-400">Member</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400">Date</TableHead>
                <TableHead className="text-[10px] font-black uppercase text-slate-400">Amount</TableHead>
                <TableHead className="text-right"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-300 font-bold uppercase text-[10px]">No records found</TableCell>
                </TableRow>
              ) : (
                filteredTransactions.slice(0, mode === "summary" ? 5 : undefined).map(t => (
                  <TableRow key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <TableCell className="font-bold text-xs text-slate-700">{t.n}</TableCell>
                    <TableCell className="text-[9px] font-medium text-slate-400">{t.d}</TableCell>
                    <TableCell className="font-black text-xs text-primary">৳{t.a}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-slate-300 hover:text-destructive active:scale-90" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="bg-slate-50/50 p-6 font-black flex justify-between rounded-b-3xl">
          <span className="text-[10px] uppercase text-slate-400">Total Collected</span>
          <span className="text-primary text-lg">৳{totalFiltered.toLocaleString()}</span>
        </CardFooter>
      </Card>
    </div>
  );
}
