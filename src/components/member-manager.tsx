
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
      toast({ title: "Member added", description: `${newMember} has been joined.` });
    } catch (error: any) {
      console.error("Add Member Error:", error);
      toast({ 
        title: "Error", 
        description: error.message.includes("PERMISSION_DENIED") 
          ? "Permission Denied: Check database rules." 
          : "Failed to add member.", 
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
          <Users className="text-primary h-5 w-5" />
          <CardTitle className="text-lg font-bold uppercase">Member Management</CardTitle>
        </div>
        <span className="text-[10px] font-black bg-primary/10 text-primary px-3 py-1 rounded-full">
          TOTAL: {members.length}
        </span>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <form onSubmit={handleAddMember} className="flex gap-2">
          <Input 
            placeholder="Enter new member name" 
            value={newMember} 
            onChange={(e) => setNewMember(e.target.value)}
            disabled={loading}
            className="flex-1 h-12 rounded-xl bg-slate-50 border-none shadow-sm"
          />
          <Button type="submit" className="bg-primary h-12 w-12 rounded-xl shadow-lg" disabled={loading}>
            {loading ? <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-b-transparent" /> : <Plus className="h-5 w-5" />}
          </Button>
        </form>

        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
          {members.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-100">
              <Users className="h-10 w-10 mx-auto text-slate-200 mb-2" />
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No members found</p>
            </div>
          ) : (
            members.map((member) => (
              <div 
                key={member.id} 
                className="flex items-center justify-between p-4 bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                    {member.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-bold text-slate-700">{member.name}</span>
                </div>
                <button 
                  onClick={() => setDeleteMember(member)}
                  className="text-slate-300 hover:text-destructive transition-colors p-2"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </CardContent>

      <AlertDialog open={!!deleteMember} onOpenChange={() => setDeleteMember(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="text-destructive h-5 w-5" /> Remove Member?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove <strong>{deleteMember?.name}</strong> from the foundation?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white rounded-xl font-bold">
              REMOVE NOW
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
