"use client";

import { useState, useEffect, useRef } from "react";
import { User } from "firebase/auth";
import { database } from "@/lib/firebase";
import { ref, push, onValue, limitToLast, query, serverTimestamp } from "firebase/database";
import { Send, User as UserIcon, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

interface Message {
  id: string;
  uid: string;
  name: string;
  text: string;
  timestamp: number;
  photoURL?: string;
}

export default function ChatScreen({ user }: { user: User }) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatRef = query(ref(database, "foundation_chat"), limitToLast(50));
    const unsubscribe = onValue(chatRef, (snapshot) => {
      const list: Message[] = [];
      snapshot.forEach((child) => {
        list.push({ id: child.key!, ...child.val() });
      });
      setMessages(list);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    push(ref(database, "foundation_chat"), {
      uid: user.uid,
      name: user.displayName || "Anonymous Admin",
      text: newMessage,
      photoURL: user.photoURL,
      timestamp: serverTimestamp()
    });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-[65vh] bg-white rounded-[2.5rem] shadow-xl border border-slate-50 overflow-hidden animate-in fade-in duration-500">
      <div className="px-6 py-4 bg-primary text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-white/10 rounded-xl">
            <ShieldCheck className="h-5 w-5 text-accent" />
          </div>
          <div>
            <h3 className="text-xs font-black uppercase tracking-tight">Admin Connect</h3>
            <p className="text-[8px] font-bold text-accent uppercase tracking-widest">Official Channel</p>
          </div>
        </div>
        <div className="flex -space-x-2">
           <div className="w-8 h-8 rounded-full border-2 border-primary bg-slate-200" />
           <div className="w-8 h-8 rounded-full border-2 border-primary bg-slate-300" />
        </div>
      </div>

      <ScrollArea className="flex-1 p-6 bg-slate-50/50">
        <div className="space-y-4">
          {messages.map((msg) => {
            const isMe = msg.uid === user.uid;
            return (
              <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                <div className={`flex gap-2 max-w-[85%] ${isMe ? "flex-row-reverse" : "flex-row"}`}>
                  <div className="w-8 h-8 rounded-full bg-slate-200 overflow-hidden border border-white shadow-sm flex-shrink-0">
                    {msg.photoURL ? (
                      <Image src={msg.photoURL} alt={msg.name} width={32} height={32} />
                    ) : (
                      <UserIcon className="h-4 w-4 m-2 text-slate-400" />
                    )}
                  </div>
                  <div>
                    {!isMe && <p className="text-[8px] font-black text-slate-400 uppercase ml-1 mb-1">{msg.name}</p>}
                    <div className={`px-4 py-3 rounded-2xl text-xs font-medium shadow-sm ${
                      isMe ? "bg-primary text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          <div ref={scrollRef} />
        </div>
      </ScrollArea>

      <div className="p-4 bg-white border-t border-slate-100">
        <form onSubmit={handleSend} className="flex gap-2">
          <Input 
            placeholder="Type a secure message..." 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="h-12 rounded-xl bg-slate-50 border-none shadow-inner text-xs font-bold"
          />
          <Button type="submit" className="h-12 w-12 rounded-xl bg-primary shadow-lg shadow-primary/20">
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
}
