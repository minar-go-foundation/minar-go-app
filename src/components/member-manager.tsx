"use client";

import { useState } from "react";
import { database } from "@/lib/firebase";
import { ref, push, remove, set } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Users, AlertCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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

export default function MemberManager({ members }: { members: MGMember[] }) {
  const [newMember, setNewMember] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteMember, setDeleteMember] = useState<MGMember | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.trim()) return;
    
    setLoading(true);
    try {
      const membersRef = ref(database, "members");
      const newMemberRef = push(membersRef);
      await set(newMemberRef, {
        name: newMember.trim(),
        createdAt: new Date().toISOString()
      });
      setNewMember("");
      toast({ title: "সফলভাবে যুক্ত হয়েছে", description: `${newMember} এখন মেম্বার লিস্টে আছে।` });
    } catch (error: any) {
      toast({ title: "Error", description: "পারমিশন ডিনাইড!", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteMember) return;
    try {
      await remove(ref(database, `members/${deleteMember.id}`));
      toast({ title: "Member removed", description: "Deleted successfully." });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to remove member.", variant: "destructive" });
    } finally {
      setDeleteMember(null);
    }
  };

  const filteredMembers = members.filter(m => 
    m.name.toLowerCase().includes(searchQuery.toLowerCase())
  ).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary/5 p-8 flex flex-row items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-primary rounded-2xl text-white shadow-lg shadow-primary/20">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl font-black uppercase text-primary tracking-tight">Member Directory</CardTitle>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Database: {members.length}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <form onSubmit={handleAddMember} className="flex gap-3">
            <Input 
              placeholder="Enter new member name..." 
              value={newMember} 
              onChange={(e) => setNewMember(e.target.value)}
              disabled={loading}
              className="flex-1 h-14 rounded-2xl bg-slate-50 border-none shadow-inner font-bold px-6 text-primary"
            />
            <Button type="submit" className="bg-primary hover:bg-primary/95 h-14 w-14 rounded-2xl shadow-xl active:scale-90 transition-all" disabled={loading}>
              {loading ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-b-transparent" /> : <Plus className="h-6 w-6 stroke-[3px]" />}
            </Button>
          </form>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input 
              placeholder="Search members..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-xl bg-white border-slate-100 text-xs font-bold"
            />
          </div>

          <div className="space-y-3 max-h-[45vh] overflow-y-auto pr-2 scrollbar-hide">
            {filteredMembers.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                <Users className="h-16 w-16 mx-auto text-slate-200 mb-4" />
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No members matching search</p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-5 bg-white border border-slate-50 rounded-[1.8rem] shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-primary font-black text-lg border border-slate-100">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-sm font-black text-slate-700 tracking-tight">{member.name}</span>
                  </div>
                  <button 
                    onClick={() => setDeleteMember(member)}
                    className="text-slate-200 hover:text-destructive hover:bg-red-50 p-3 rounded-2xl transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteMember} onOpenChange={() => setDeleteMember(null)}>
        <AlertDialogContent className="rounded-[3rem] p-10">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-3 text-2xl font-black text-primary">
              <AlertCircle className="text-destructive h-8 w-8" /> REMOVE MEMBER?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base font-medium">
              Are you sure you want to remove <strong>{deleteMember?.name}</strong> from the foundation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-8 gap-4">
            <AlertDialogCancel className="h-14 rounded-2xl font-black text-sm border-2">CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white h-14 rounded-2xl font-black text-sm">
              REMOVE NOW
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
