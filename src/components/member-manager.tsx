
"use client";

import { useState } from "react";
import { database } from "@/lib/firebase";
import { ref, push, remove } from "firebase/database";
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
  const { toast } = useToast();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.trim()) return;
    
    try {
      await push(ref(database, "members"), {
        name: newMember.trim(),
        createdAt: new Date().toISOString()
      });
      setNewMember("");
      toast({ title: "Member added", description: `${newMember} has been joined.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add member. Please check permissions.", variant: "destructive" });
    }
  };

  const confirmDelete = async () => {
    if (!deleteMember) return;
    
    try {
      await remove(ref(database, `members/${deleteMember.id}`));
      toast({ title: "Member removed", description: `${deleteMember.name} was deleted successfully.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" });
    } finally {
      setDeleteMember(null);
    }
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="bg-primary/5 rounded-t-xl flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="text-primary h-5 w-5" />
          <CardTitle className="text-lg font-bold">Member Management</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <form onSubmit={handleAddMember} className="flex gap-2">
          <Input 
            placeholder="Enter new member name" 
            value={newMember} 
            onChange={(e) => setNewMember(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <div className="grid grid-cols-2 md:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
          {members.length === 0 ? (
            <div className="col-span-2 text-center py-10 text-muted-foreground text-xs uppercase font-bold tracking-widest">
              No members found
            </div>
          ) : (
            members.map((member) => (
              <div 
                key={member.id} 
                className="group flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all"
              >
                <span className="text-sm font-medium truncate pr-2">{member.name}</span>
                <button 
                  onClick={() => setDeleteMember(member)}
                  className="text-destructive hover:scale-110 transition-transform flex items-center justify-center h-8 w-8"
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
              Are you sure you want to remove this member from the foundation list?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white rounded-xl font-bold hover:bg-destructive/90">
              REMOVE NOW
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
