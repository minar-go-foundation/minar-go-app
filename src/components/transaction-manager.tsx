
"use client";

import { useState, useMemo } from "react";
import { database } from "@/lib/firebase";
import { ref, push, remove } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
}

export default function TransactionManager({ members, transactions }: TransactionManagerProps) {
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
    } catch (error) {
      toast({ title: "Error", description: "Failed to save transaction", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this transaction?")) return;
    try {
      await remove(ref(database, `transactions/${id}`));
      toast({ title: "Deleted", description: "Transaction removed." });
    } catch (error) {
      toast({ title: "Error", description: "Delete failed", variant: "destructive" });
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

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-none overflow-hidden">
        <CardHeader className="bg-primary text-white">
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" /> New Deposit Entry
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <form onSubmit={handleAddDeposit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Member</label>
              <Select onValueChange={setSelectedMember} value={selectedMember}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Member" />
                </SelectTrigger>
                <SelectContent>
                  {members.map((m, idx) => {
                    const name = typeof m === 'string' ? m : (m?.name || "Unknown Member");
                    return (
                      <SelectItem key={idx} value={name}>{name}</SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Category</label>
              <Select onValueChange={setCategory} value={category}>
                <SelectTrigger>
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
              <label className="text-xs font-bold uppercase text-muted-foreground">Amount (৳)</label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Date</label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <Button type="submit" className="md:col-span-2 bg-primary hover:bg-primary/90 h-11 text-lg active:scale-95">
              Submit Record
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="shadow-lg border-none">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="text-primary h-5 w-5" /> Summary
          </CardTitle>
          <div className="flex gap-2">
            <Select onValueChange={setFilterMonth} value={filterMonth}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="All Months" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Months</SelectItem>
                {MONTHS.map(m => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="icon" variant="outline" onClick={exportPDF}>
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No transactions found</TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map(t => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.n}</TableCell>
                    <TableCell className="text-xs">{t.d}</TableCell>
                    <TableCell className="font-bold">৳{t.a}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleDelete(t.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
        <CardFooter className="bg-muted/30 p-4 font-bold flex justify-between">
          <span>Total Filtered</span>
          <span className="text-primary text-lg">৳{totalFiltered.toLocaleString()}</span>
        </CardFooter>
      </Card>
    </div>
  );
}
