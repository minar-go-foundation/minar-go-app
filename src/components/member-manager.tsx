
"use client";

import { useState, useMemo } from "react";
import { useFirestore, useCollection } from "@/firebase";
import { collection, doc, addDoc, deleteDoc, query, orderBy } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Users, AlertCircle, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { MGMember } from "@/lib/types";
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

export default function MemberManager() {
  const [newMember, setNewMember] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [deleteMember, setDeleteMember] = useState<MGMember | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();
  const db = useFirestore();

  const membersRef = useMemo(() => db ? collection(db, "members") : null, [db]);
  const membersQuery = useMemo(() => {
    if (!membersRef) return null;
    return query(membersRef, orderBy("name", "asc"));
  }, [membersRef]);

  const { data: members = [], loading } = useCollection<MGMember>(membersQuery as any);

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.trim() || !db) return;
    
    setIsAdding(true);
    const data = {
      name: newMember.trim(),
      createdAt: new Date().toISOString()
    };

    addDoc(collection(db, "members"), data)
      .then(() => {
        setNewMember("");
        toast({ title: "Member Added", description: `${newMember} is now in the list.` });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: "members",
          operation: "create",
          requestResourceData: data,
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => setIsAdding(false));
  };

  const confirmDelete = () => {
    if (!deleteMember || !db) return;
    const docRef = doc(db, "members", deleteMember.id);
    deleteDoc(docRef)
      .then(() => {
        toast({ title: "Member Removed" });
      })
      .catch(async (err) => {
        const permissionError = new FirestorePermissionError({
          path: `members/${deleteMember.id}`,
          operation: "delete",
        });
        errorEmitter.emit("permission-error", permissionError);
      })
      .finally(() => setDeleteMember(null));
  };

  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      m.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [members, searchQuery]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <Card className="shadow-2xl border-none glass-card rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 flex flex-row items-center gap-5 bg-transparent border-b border-white/20">
          <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-xl shadow-primary/20">
            <Users className="h-8 w-8" />
          </div>
          <div>
            <CardTitle className="text-2xl font-[900] uppercase text-primary tracking-tight">Member Directory</CardTitle>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Members: {members.length}</p>
          </div>
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          <form onSubmit={handleAddMember} className="flex gap-4">
            <Input 
              placeholder="Enter name..." 
              value={newMember} 
              onChange={(e) => setNewMember(e.target.value)}
              disabled={isAdding}
              className="flex-1 h-14 rounded-2xl bg-white/50 border-none shadow-inner font-bold px-6 text-primary"
            />
            <Button type="submit" className="bg-primary hover:bg-primary/95 h-14 w-14 rounded-2xl shadow-xl" disabled={isAdding}>
              {isAdding ? <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-b-transparent" /> : <Plus className="h-7 w-7 stroke-[3px]" />}
            </Button>
          </form>

          <div className="relative">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300" />
            <Input 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-14 h-14 rounded-2xl bg-white/50 border border-white/50 shadow-sm text-sm font-bold"
            />
          </div>

          <div className="space-y-4 max-h-[45vh] overflow-y-auto pr-3 scrollbar-hide">
            {loading ? (
              <div className="text-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredMembers.length === 0 ? (
              <div className="text-center py-24 bg-white/30 rounded-[3rem] border-2 border-dashed border-white/50">
                <Users className="h-16 w-16 mx-auto text-slate-200 mb-4 opacity-50" />
                <p className="text-xs font-black text-slate-300 uppercase tracking-widest">No members found</p>
              </div>
            ) : (
              filteredMembers.map((member) => (
                <div 
                  key={member.id} 
                  className="flex items-center justify-between p-6 bg-white/40 border border-white/50 rounded-[2rem] shadow-sm hover:shadow-md transition-all group"
                >
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-white/60 flex items-center justify-center text-primary font-black text-xl border border-white/50 group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-base font-black text-slate-700 tracking-tight">{member.name}</span>
                  </div>
                  <button 
                    onClick={() => setDeleteMember(member)}
                    className="text-slate-200 hover:text-destructive p-3.5 rounded-2xl transition-all"
                  >
                    <Trash2 className="h-6 w-6" />
                  </button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteMember} onOpenChange={() => setDeleteMember(null)}>
        <AlertDialogContent className="rounded-[3rem] p-10 border-none shadow-2xl glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-4 text-2xl font-[900] text-primary uppercase">
              <div className="p-3 bg-red-50 rounded-2xl"><AlertCircle className="text-destructive h-8 w-8" /></div>
              Confirm Removal
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base font-bold text-slate-500 mt-2">
              Are you sure you want to remove <strong>{deleteMember?.name}</strong> from the database?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-10 gap-4">
            <AlertDialogCancel className="h-14 rounded-2xl font-black text-sm border-2 border-slate-100 uppercase tracking-widest">CANCEL</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-white h-14 rounded-2xl font-black text-sm uppercase tracking-widest">
              REMOVE NOW
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
