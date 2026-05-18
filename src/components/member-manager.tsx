"use client";

import { useState } from "react";
import { database } from "@/lib/firebase";
import { ref, push, remove, set } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Users, AlertCircle } from "lucide-react";
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
      console.error("Add Member Error:", error);
      toast({ 
        title: "Error", 
        description: error.message || "মেম্বার যুক্ত করা সম্ভব হয়নি।", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteMember) return;
    
    try {
      await remove(ref(database, `members/${deleteMember.id}`));
      toast({ title: "Member removed", description: `${deleteMember.name} deleted successfully.` });
    } catch (error: any) {
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" });
    } finally {
      setDeleteMember(null);
    }
  };

  return (
    <Card className="shadow-lg border-none bg-white rounded-3xl overflow-hidden">
      <CardHeader className="bg-primary/5 p-6 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary rounded-xl text-white">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-black uppercase text-primary">Member Directory</CardTitle>
            <p className="text-[10px] font-bold text-slate-400 uppercase">Management Access</p>
          </div>
        </div>
        <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full">
          TOTAL: {members.length}
        </span>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleAddMember} className="flex gap-2">
          <Input 
            placeholder="Enter new member name..." 
            value={newMember} 
            onChange={(e) => setNewMember(e.target.value)}
            disabled={loading}
            className="flex-1 h-14 rounded-2xl bg-slate-50 border-none shadow-sm font-bold px-6"
          />
          <Button type="submit" className="bg-primary hover:bg-primary/95 h-14 w-14 rounded-2xl shadow-lg active:scale-95 transition-all" disabled={loading}>
            {loading ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-b-transparent" /> : <Plus className="h-6 w-6 stroke-[3px]" />}
          </Button>
        </form>

        <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-2 scrollbar-thin">
          {members.length === 0 ? (
            <div className="text-center py-24 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200">
              <Users className="h-14 w-14 mx-auto text-slate-200 mb-3" />
              <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">No members found</p>
              <p className="text-[10px] text-slate-400 mt-1 uppercase">Database sync in progress...</p>
            </div>
          ) : (
            members.sort((a,b) => a.name.localeCompare(b.name)).map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-primary/5 flex items-center justify-center text-primary font-black text-sm border border-primary/10">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-black text-slate-700 tracking-tight">{member.name}</span>
                </div>
                <button 
                  onClick={() => setDeleteMember(member)}
                  className="text-slate-200 hover:text-destructive hover:bg-red-50 p-2 rounded-xl transition-all"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <AlertDialog open={!!deleteMember} onOpenChange={() => setDeleteMember(null)}>
        <AlertDialogContent className="rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive h-5 w-5" /> Remove Member?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteMember?.name}</strong> from the foundation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-2xl font-black text-xs">CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white rounded-2xl font-black text-xs">
              REMOVE NOW
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}