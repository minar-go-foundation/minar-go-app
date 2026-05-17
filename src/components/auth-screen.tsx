"use client";

import { useState, useEffect } from "react";
import { auth, database } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, ShieldCheck, User } from "lucide-react";
import Image from "next/image";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const storedLogo = localStorage.getItem("mg_logo");
    if (storedLogo) setLogo(storedLogo);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back!", description: "Logged in successfully." });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCredential.user, { displayName: name });
        
        await set(ref(database, `admin_users/${userCredential.user.uid}`), {
          name,
          email,
          createdAt: new Date().toISOString()
        });
        
        toast({ title: "Account created!", description: "You can now manage the foundation." });
      }
    } catch (error: any) {
      toast({ 
        title: "Authentication Error", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 bg-slate-50 font-body">
      {/* Top Background Design */}
      <div className="absolute top-0 left-0 w-full h-32 bg-white rounded-b-[3rem] shadow-sm -z-10" />

      {/* Header Branding */}
      <div className="mt-12 flex flex-col items-center text-center">
        <div className="relative w-24 h-24 mb-6 rounded-full border-[3px] border-accent p-1 bg-white shadow-lg flex items-center justify-center overflow-hidden">
          {logo ? (
            <Image src={logo} alt="Foundation Logo" fill className="object-cover" />
          ) : (
            <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-accent text-2xl font-black">
              MG
            </div>
          )}
        </div>
        <h1 className="text-xl font-extrabold text-primary tracking-tight leading-none uppercase">
          Minar Go Expatriate
        </h1>
        <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mt-1">
          Development Foundation
        </p>
      </div>

      {/* Auth Card */}
      <div className="w-full max-w-sm mt-8 flex-1">
        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <Label htmlFor="name" className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Admin Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  id="name" 
                  placeholder="Full Name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                  className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl placeholder:text-muted-foreground/60"
                />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-[10px] font-bold text-muted-foreground uppercase ml-1 tracking-wider">Email Access</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="email" 
                type="email" 
                placeholder="Email Address" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
                className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label htmlFor="password" className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Security Password</Label>
              {isLogin && (
                <button type="button" className="text-[9px] font-bold text-primary uppercase hover:underline">Forgot Password?</button>
              )}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
                className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl placeholder:text-muted-foreground/60"
              />
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-primary hover:bg-primary/95 text-white font-black h-14 rounded-2xl text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2" 
            disabled={loading}
          >
            {loading ? "PROCESSING..." : (
              <>
                {isLogin ? "SECURE LOGIN" : "CREATE ACCOUNT"}
                <ShieldCheck className="h-5 w-5" />
              </>
            )}
          </Button>

          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground font-medium">
              {isLogin ? "Don't have an account?" : "Already have an account?"}
              <button 
                type="button"
                onClick={() => setIsLogin(!isLogin)}
                className="ml-1 text-primary font-bold hover:underline"
              >
                {isLogin ? "Sign up" : "Sign in"}
              </button>
            </p>
          </div>
        </form>
      </div>

      {/* Footer Branding */}
      <div className="w-full max-w-sm text-center py-6 space-y-4">
        <div className="space-y-1">
          <p className="text-[8px] text-muted-foreground font-bold leading-tight">
            © 2024 MINAR GO EXPATRIATE DEVELOPMENT FOUNDATION.<br />
            ALL RIGHTS RESERVED.
          </p>
        </div>
        <div className="pt-4 border-t border-slate-200">
          <p className="text-[9px] text-slate-400 font-black uppercase tracking-[0.2em]">
            System Connection
          </p>
        </div>
      </div>
    </div>
  );
}
