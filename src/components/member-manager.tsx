
"use client";

import { useState } from "react";
import { database } from "@/lib/firebase";
import { ref, push, remove, get } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, Plus, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function MemberManager({ members }: { members: any[] }) {
  const [newMember, setNewMember] = useState("");
  const { toast } = useToast();

  const handleAddMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMember.trim()) return;
    
    try {
      await push(ref(database, "member_list"), newMember.trim());
      setNewMember("");
      toast({ title: "Member added", description: `${newMember} has been joined.` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to add member", variant: "destructive" });
    }
  };

  const handleDeleteMember = async (member: any) => {
    const name = typeof member === 'string' ? member : member?.name;
    if (!name || !confirm(`Are you sure you want to remove ${name}?`)) return;

    try {
      const membersRef = ref(database, "member_list");
      const snapshot = await get(membersRef);
      if (snapshot.exists()) {
        const data = snapshot.val();
        // Find key by value string or object name
        const keyToDelete = Object.keys(data).find(key => {
          const val = data[key];
          return val === name || (typeof val === 'object' && val?.name === name);
        });
        
        if (keyToDelete) {
          await remove(ref(database, `member_list/${keyToDelete}`));
          toast({ title: "Member removed", description: `${name} was deleted successfully.` });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to remove member", variant: "destructive" });
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
          {members.map((member, idx) => {
            const name = typeof member === 'string' ? member : (member?.name || "Unknown");
            return (
              <div 
                key={idx} 
                className="group flex items-center justify-between p-3 bg-muted/30 rounded-lg border border-transparent hover:border-primary/20 hover:bg-muted/50 transition-all"
              >
                <span className="text-sm font-medium truncate pr-2">{name}</span>
                <button 
                  onClick={() => handleDeleteMember(member)}
                  className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
