
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, doc, addDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Trash2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { MGMember, MGTransaction } from "@/lib/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const CATEGORIES = ["Monthly Deposit", "Zakat", "Fitra", "Construction"];

interface TransactionManagerProps {
  members: MGMember[];
  transactions: MGTransaction[];
  mode?: "full" | "form" | "history";
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
  const [category, setCategory] = useState("Monthly Deposit");
  const [amount, setAmount] = useState("5000");
  const [date, setDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const db = useFirestore();

  const filteredTransactions = useMemo(() => {
    if (filterMonth === "All") return transactions;
    return transactions.filter(t => MONTHS[new Date(t.d).getMonth()] === filterMonth);
  }, [transactions, filterMonth]);

  const totalFiltered = filteredTransactions.reduce((acc, curr) => acc + (parseFloat(curr.a) || 0), 0);

  const handleAddDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !amount || !db) return;
    const data = { n: selectedMember, c: category, a: amount, d: date };
    addDoc(collection(db, "transactions"), data).then(() => { 
      toast({ title: "Deposit Saved" }); 
      if (onSuccess) onSuccess(); 
    });
  };

  const confirmDelete = () => {
    if (!deleteId || !db) return;
    deleteDoc(doc(db, "transactions", deleteId)).then(() => { 
      toast({ title: "Deleted" }); 
      setDeleteId(null); 
    });
  };

  const exportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFillColor(0, 35, 102); doc.rect(0, 0, 210, 40, 'F');
      doc.setTextColor(255, 255, 255); doc.setFontSize(22); doc.text("MINAR GO FOUNDATION", 105, 25, { align: "center" });
      autoTable(doc, {
        startY: 50, head: [["Member", "Date", "Category", "Amount"]],
        body: filteredTransactions.map(t => [t.n, t.d, t.c, `৳${t.a}`]),
        headStyles: { fillColor: [0, 35, 102] }
      });
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `Report_${filterMonth}.pdf`;
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast({ title: "PDF Ready" });
    } catch (e) { toast({ title: "Export Error" }); }
  };

  if (mode === "form") {
    return (
      <form onSubmit={handleAddDeposit} className="space-y-4">
        <Select onValueChange={setSelectedMember} value={selectedMember}>
          <SelectTrigger className="h-12 rounded-xl">
            <SelectValue placeholder="Select Member" />
          </SelectTrigger>
          <SelectContent>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select onValueChange={setCategory} value={category}>
          <SelectTrigger className="h-12 rounded-xl">
            <SelectValue placeholder="Select Category" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="h-12 rounded-xl" placeholder="Amount" />
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-12 rounded-xl" />
        <Button type="submit" className="w-full bg-primary h-14 rounded-2xl font-black">CONFIRM DEPOSIT</Button>
      </form>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-none glass-card rounded-[2.5rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between p-8 bg-white/10">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-white rounded-2xl text-primary"><Filter className="h-5 w-5" /></div>
            <CardTitle className="text-[12px] font-black text-primary uppercase">History: {filterMonth}</CardTitle>
          </div>
          <div className="flex gap-2">
            <Select onValueChange={(val) => onFilterMonthChange?.(val)} value={filterMonth}>
              <SelectTrigger className="w-[100px] h-10 rounded-xl">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Time</SelectItem>
                {MONTHS.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="outline" className="h-10 w-10 rounded-xl" onClick={exportPDF}><Download className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto min-h-[300px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.map(t => (
                <TableRow key={t.id}>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => setDeleteId(t.id)}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  <TableCell className="font-black text-xs">{t.n}</TableCell>
                  <TableCell className="text-[10px]">{t.d}</TableCell>
                  <TableCell className="font-black text-primary">৳{t.a}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
        {mode !== "history" && (
          <CardFooter className="bg-primary p-8 rounded-b-[2.5rem] flex justify-between items-center">
            <p className="text-[9px] uppercase text-white/50">Total Assets</p>
            <h4 className="text-white text-2xl font-black">৳{totalFiltered.toLocaleString()}</h4>
          </CardFooter>
        )}
      </Card>
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent className="rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record?</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive">DELETE</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
