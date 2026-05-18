
"use client";

import { useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, push, remove } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Plus, Trash2, Calendar, AlertCircle, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MGMember } from "./dashboard-screen";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

const MONTHS = [
  "January", "February", "March", "April", "May", "June", 
  "July", "August", "September", "October", "November", "December"
];

const CATEGORIES = ["প্রতি মাসের জমা", "যাকাত", "ফিতরা", "বাড়ির কাজ"];

const CATEGORY_MAP: Record<string, string> = {
  "প্রতি মাসের জমা": "Monthly Deposit",
  "যাকাত": "Zakat",
  "ফিতরা": "Fitra",
  "বাড়ির কাজ": "House Work"
};

interface TransactionManagerProps {
  members: MGMember[];
  transactions: any[];
  mode?: "form" | "summary" | "full";
  onSuccess?: () => void;
  filterMonth?: string;
  onFilterMonthChange?: (month: string) => void;
}

export default function TransactionManager({ 
  members, 
  transactions, 
  mode = "full", 
  onSuccess,
  filterMonth = "All",
  onFilterMonthChange
}: TransactionManagerProps) {
  const [selectedMember, setSelectedMember] = useState("");
  const [category, setCategory] = useState("প্রতি মাসের জমা");
  const [amount, setAmount] = useState("5000");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();

  const filteredTransactions = useMemo(() => {
    let list = [...transactions];
    if (filterMonth !== "All") {
      list = list.filter(t => {
        try {
          const tDate = new Date(t.d);
          return MONTHS[tDate.getMonth()] === filterMonth;
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

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      const transRef = ref(database, `transactions/${deleteId}`);
      await remove(transRef);
      toast({ 
        title: "Transaction Deleted", 
        description: "The record has been removed from the system." 
      });
    } catch (error: any) {
      toast({ 
        title: "Delete Failed", 
        description: error.message || "An unexpected error occurred.", 
        variant: "destructive" 
      });
    } finally {
      setDeleteId(null);
    }
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setFillColor(0, 35, 102); 
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("MINAR GO EXPATRIATE", pageWidth / 2, 18, { align: "center" });
    doc.setFontSize(16);
    doc.text("DEVELOPMENT FOUNDATION", pageWidth / 2, 28, { align: "center" });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(220, 220, 220);
    doc.text(`Collection Summary Report - ${filterMonth === 'All' ? 'Yearly' : filterMonth} Period`, pageWidth / 2, 38, { align: "center" });
    
    const tableData = filteredTransactions.map(t => [
      t.n, 
      t.d, 
      CATEGORY_MAP[t.c] || t.c, 
      `BDT ${parseFloat(t.a).toLocaleString()}`
    ]);
    
    autoTable(doc, {
      startY: 55,
      head: [["Member Name", "Date", "Category", "Amount"]],
      body: tableData,
      foot: [["TOTAL COLLECTION", "", "", `BDT ${totalFiltered.toLocaleString()}`]],
      theme: "striped",
      headStyles: { 
        fillColor: [0, 35, 102], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        fontSize: 11,
        cellPadding: 4
      },
      footStyles: { 
        fillColor: [0, 35, 102], 
        textColor: [255, 255, 255], 
        fontStyle: 'bold',
        fontSize: 12,
        cellPadding: 4
      },
      styles: { 
        fontSize: 10, 
        cellPadding: 4,
        overflow: 'linebreak',
        font: 'helvetica'
      },
      columnStyles: {
        3: { halign: 'right', fontStyle: 'bold' }
      },
      margin: { left: 15, right: 15, bottom: 30 }
    });
    
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(15, pageHeight - 25, pageWidth - 15, pageHeight - 25);
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.setFont("helvetica", "bold");
      doc.text("MINAR GO EXPATRIATE DEVELOPMENT FOUNDATION", pageWidth / 2, pageHeight - 18, { align: "center" });
      doc.setFontSize(8);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(100, 100, 100);
      doc.text("COPYRIGHT © 2024 ALL RIGHTS RESERVED | OFFICIAL COLLECTION REPORT", pageWidth / 2, pageHeight - 12, { align: "center" });
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 15, pageHeight - 12, { align: "right" });
    }
    
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
              {members.map((m) => (
                <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
              ))}
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
                    {members.map((m) => (
                      <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                    ))}
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

      <Card className="shadow-lg border-none bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-8 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-2xl text-primary shadow-sm border border-slate-100">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-[12px] font-black text-primary uppercase tracking-tight">Monthly Log History</CardTitle>
              <CardDescription className="text-[9px] font-bold uppercase text-slate-400 tracking-widest">{filterMonth === 'All' ? 'All Records' : `Records for ${filterMonth}`}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(val) => onFilterMonthChange?.(val)} value={filterMonth}>
              <SelectTrigger className="w-[120px] h-10 text-[10px] font-black rounded-xl border-slate-200 bg-white shadow-sm uppercase">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All" className="text-[10px] font-bold uppercase">All Months</SelectItem>
                {MONTHS.map(m => (
                  <SelectItem key={m} value={m} className="text-[10px] font-bold uppercase">{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl border-slate-200 bg-white shadow-sm" onClick={exportPDF}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto min-h-[300px]">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow className="border-b border-slate-100">
                <TableHead className="text-[9px] font-black uppercase text-slate-400 pl-8">Member Name</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400">Date</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400">Total Amount</TableHead>
                <TableHead className="text-right pr-8"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20">
                    <div className="flex flex-col items-center gap-2 opacity-20">
                      <Calendar className="h-12 w-12" />
                      <p className="text-[10px] font-black uppercase tracking-widest">No records for {filterMonth}</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.slice(0, mode === "summary" ? 8 : undefined).map(t => (
                  <TableRow key={t.id} className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors group">
                    <TableCell className="font-black text-[12px] text-slate-700 pl-8">{t.n}</TableCell>
                    <TableCell className="text-[10px] font-bold text-slate-400">{t.d}</TableCell>
                    <TableCell className="font-black text-[13px] text-primary">৳{parseFloat(t.a).toLocaleString()}</TableCell>
                    <TableCell className="text-right pr-8">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-10 w-10 text-slate-200 hover:text-destructive hover:bg-destructive/5 rounded-full transition-all" 
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(t.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="bg-primary p-8 font-black flex justify-between items-center rounded-b-[2.5rem] shadow-[0_-10px_30px_rgba(0,35,102,0.1)]">
          <div>
             <p className="text-[9px] uppercase text-white/50 tracking-[0.2em] mb-1">Total {filterMonth === 'All' ? 'Foundation' : filterMonth} Assets</p>
             <h4 className="text-white text-2xl font-black">৳{totalFiltered.toLocaleString()}</h4>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">Filtered Summary</span>
          </div>
        </CardFooter>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-10 border-none">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-xl font-black text-primary">
              <AlertCircle className="text-destructive h-6 w-6" /> REMOVE RECORD?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm font-bold text-slate-500">
              Are you sure you want to delete this transaction record? This action will permanently remove it from the cloud database.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border-2">CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white h-12 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-100">
              DELETE NOW
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
