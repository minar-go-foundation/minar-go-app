"use client";

import { useState, useEffect } from "react";
import { auth, database } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { ref, set } from "firebase/database";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
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
        
        // Store in realtime db
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
    <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-background">
      <div className="mb-8 flex flex-col items-center">
        {logo ? (
          <div className="relative w-24 h-24 mb-4 rounded-xl overflow-hidden shadow-lg border-2 border-accent">
            <Image src={logo} alt="Foundation Logo" fill className="object-cover" />
          </div>
        ) : (
          <div className="w-24 h-24 mb-4 rounded-xl bg-primary flex items-center justify-center text-accent text-3xl font-extrabold shadow-lg">
            MG
          </div>
        )}
        <h1 className="text-3xl font-extrabold text-primary tracking-tight">MINAR GO</h1>
        <p className="text-muted-foreground font-medium">Expatriate Development Foundation</p>
      </div>

      <Card className="w-full max-w-md shadow-2xl border-none">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">{isLogin ? "Admin Login" : "Create Admin Account"}</CardTitle>
          <CardDescription>
            {isLogin ? "Access the foundation management dashboard" : "Register as an administrator"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input 
                  id="name" 
                  placeholder="Enter your name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  required 
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="admin@minargo.com" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-12 text-lg active:scale-95 transition-transform" 
              disabled={loading}
            >
              {loading ? "Processing..." : isLogin ? "Sign In" : "Sign Up"}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "New here? Create an account" : "Already have an account? Sign in"}
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
