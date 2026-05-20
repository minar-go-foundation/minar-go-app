
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, doc, addDoc, deleteDoc, query, orderBy } from "firebase/firestore";
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
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
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
  mode?: "form" | "summary" | "full" | "history";
  onSuccess?: () => void;
  filterMonth?: string;
  onFilterMonthChange?: (month: string) => void;
}

export default function TransactionManager({ 
  members, 
  transactions: initialTransactions, 
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
  const db = useFirestore();

  const transactionsRef = useMemo(() => db ? collection(db, "transactions") : null, [db]);
  const transactionsQuery = useMemo(() => transactionsRef ? query(transactionsRef, orderBy("d", "desc")) : null, [transactionsRef]);
  const { data: transactions = [] } = useCollection(transactionsQuery);

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
    return list;
  }, [transactions, filterMonth]);

  const totalFiltered = filteredTransactions.reduce((acc, curr) => acc + (parseFloat(curr.a) || 0), 0);

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !amount || !db) {
      toast({ title: "Validation Error", description: "Select a member and enter amount.", variant: "destructive" });
      return;
    }

    const data = {
      n: selectedMember,
      c: category,
      a: amount,
      d: date
    };

    addDoc(collection(db, "transactions"), data)
      .then(() => {
        toast({ title: "Deposit Recorded", description: "Transaction saved successfully." });
        if (onSuccess) onSuccess();
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: "transactions",
          operation: "create",
          requestResourceData: data,
        });
        errorEmitter.emit("permission-error", permissionError);
      });
  };

  const confirmDelete = () => {
    if (!deleteId || !db) return;
    const docRef = doc(db, "transactions", deleteId);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Transaction Deleted", description: "The record has been removed." });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `transactions/${deleteId}`,
          operation: "delete",
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => setDeleteId(null));
  };

  const exportPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // Header Background (Navy Blue)
    doc.setFillColor(0, 35, 102); 
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("MINAR GO EXPATRIATE", pageWidth / 2, 22, { align: "center" });
    doc.setFontSize(16);
    doc.text("DEVELOPMENT FOUNDATION", pageWidth / 2, 35, { align: "center" });

    // Table Data
    const tableData = filteredTransactions.map(t => [
      t.n, 
      t.d, 
      CATEGORY_MAP[t.c] || t.c, 
      `BDT ${parseFloat(t.a).toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: 60,
      head: [["Member Name", "Date", "Category", "Amount"]],
      body: tableData,
      theme: "striped",
      headStyles: { fillColor: [0, 35, 102], textColor: [255, 255, 255], fontStyle: 'bold' },
      styles: { fontSize: 10, cellPadding: 5 },
      alternateRowStyles: { fillColor: [245, 245, 245] }
    });

    // Add Total Section after table specifically requested
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(12);
    doc.setTextColor(0, 35, 102);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Foundation Assets: BDT ${totalFiltered.toLocaleString()}`, pageWidth - 20, finalY, { align: "right" });

    // Copyright Footer at bottom
    const footerY = pageHeight - 15;
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.setFont("helvetica", "normal");
    const copyrightText = `© 2024 MINAR GO EXPATRIATE DEVELOPMENT FOUNDATION. ALL RIGHTS RESERVED.`;
    doc.text(copyrightText, pageWidth / 2, footerY, { align: "center" });

    doc.save(`MinarGo_Report_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  if (mode === "form") {
    return (
      <form onSubmit={handleAddDeposit} className="space-y-4 py-4">
        <div className="space-y-2">
          <label className="text-[10px] font-bold uppercase text-slate-400">Select Member</label>
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
          <label className="text-[10px] font-bold uppercase text-slate-400">Purpose/Category</label>
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
            <label className="text-[10px] font-bold uppercase text-slate-400">Amount (৳)</label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-xl bg-slate-50" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400">Date</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl bg-slate-50" />
          </div>
        </div>
        <Button type="submit" className="w-full bg-primary h-14 rounded-2xl text-lg font-black mt-4">CONFIRM DEPOSIT</Button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-none bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-8 bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-2xl text-primary shadow-sm">
              <Filter className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-[12px] font-black text-primary uppercase">Monthly Log History</CardTitle>
              <CardDescription className="text-[9px] font-bold uppercase text-slate-400">{filterMonth === 'All' ? 'All Records' : `Records for ${filterMonth}`}</CardDescription>
            </div>
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(val) => onFilterMonthChange?.(val)} value={filterMonth}>
              <SelectTrigger className="w-[120px] h-10 text-[10px] font-black rounded-xl border-slate-200">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Months</SelectItem>
                {MONTHS.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl" onClick={exportPDF}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto min-h-[300px]">
          <Table>
            <TableHeader className="bg-slate-50/80">
              <TableRow>
                <TableHead className="w-16 pl-8"></TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400">Member Name</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400">Date</TableHead>
                <TableHead className="text-[9px] font-black uppercase text-slate-400">Total Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-20 text-slate-300">No records found</TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map(t => (
                  <TableRow key={t.id} className="hover:bg-slate-50/30">
                    <TableCell className="pl-8">
                      <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-200 hover:text-destructive" onClick={() => setDeleteId(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                    <TableCell className="font-black text-[12px] text-slate-700">{t.n}</TableCell>
                    <TableCell className="text-[10px] font-bold text-slate-400">{t.d}</TableCell>
                    <TableCell className="font-black text-[13px] text-primary">৳{parseFloat(t.a).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        {mode !== "history" && (
          <CardFooter className="bg-primary p-8 font-black flex justify-between items-center rounded-b-[2.5rem]">
            <div>
               <p className="text-[9px] uppercase text-white/50 mb-1">Total Assets</p>
               <h4 className="text-white text-2xl font-black">৳{totalFiltered.toLocaleString()}</h4>
            </div>
          </CardFooter>
        )}
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[2.5rem] p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-primary uppercase">REMOVE RECORD?</AlertDialogTitle>
            <AlertDialogDescription className="font-bold text-slate-500">Are you sure you want to delete this record?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3">
            <AlertDialogCancel className="h-12 rounded-xl font-black">CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white h-12 rounded-xl font-black">DELETE NOW</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
