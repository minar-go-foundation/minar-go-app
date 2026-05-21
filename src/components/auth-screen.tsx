
"use client";

import { useState, useEffect } from "react";
import { useAuth, useFirestore } from "@/firebase";
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Mail, Lock, ShieldCheck, User, ArrowRight, RefreshCcw, KeyRound, Eye, EyeOff, CheckCircle2, UserPlus } from "lucide-react";
import Image from "next/image";
import { sendOtpEmailAction } from "@/app/actions/send-email";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<"auth" | "otp" | "forgot-password" | "otp-reset" | "new-password-setup" | "reset-success">("auth");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [logo, setLogo] = useState<string | null>(null);
  const { toast } = useToast();
  
  const auth = useAuth();
  const db = useFirestore();

  useEffect(() => {
    const storedLogo = localStorage.getItem("mg_logo");
    if (storedLogo) setLogo(storedLogo);
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    setLoading(true);

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back!", description: "Logged in successfully." });
      } else {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const result = await sendOtpEmailAction(email, otp);
        
        if (result.success) {
          setGeneratedOtp(otp);
          setStep("otp");
          toast({ title: "Verification Sent!", description: `Code sent to ${email}.` });
        } else {
          throw new Error(result.error || "Failed to send OTP.");
        }
      }
    } catch (error: any) {
      toast({ title: "Auth Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    if (otpInput !== generatedOtp) {
      toast({ title: "Invalid Code", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      const adminData = { name, email, createdAt: new Date().toISOString() };
      setDoc(doc(db, "admin_users", userCredential.user.uid), adminData)
        .catch(async (err) => {
           const permissionError = new FirestorePermissionError({
             path: `admin_users/${userCredential.user.uid}`,
             operation: 'create',
             requestResourceData: adminData
           });
           errorEmitter.emit('permission-error', permissionError);
        });
      
      toast({ title: "Account Verified!", description: "Admin registered successfully." });
    } catch (error: any) {
      toast({ title: "Registration Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !email) {
      toast({ title: "Email required", description: "Please enter your email address.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      toast({ 
        title: "Reset Link Sent!", 
        description: `A password reset link has been sent to ${email}. Please check your inbox.` 
      });
      setStep("auth");
    } catch (error: any) {
      toast({ title: "Reset Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (step === "otp") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 font-body">
        <Card className="w-full max-w-sm rounded-[2.5rem] border-none shadow-2xl p-8 bg-white text-[#002366]">
          <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto"><ShieldCheck className="h-8 w-8 text-primary" /></div>
            <h2 className="text-xl font-black text-primary uppercase">Verify Email</h2>
          </div>
          <form onSubmit={handleVerifyAndRegister} className="space-y-6">
            <Input placeholder="000000" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} maxLength={6} required className="h-16 text-center text-2xl font-black tracking-[0.5em] rounded-2xl bg-slate-50 border-none shadow-inner text-[#002366]" />
            <Button type="submit" className="w-full bg-primary h-14 rounded-2xl font-black text-base shadow-lg shadow-primary/20" disabled={loading}>{loading ? "VERIFYING..." : "CONFIRM IDENTITY"}</Button>
            <button type="button" onClick={() => setStep("auth")} className="w-full text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-2"><RefreshCcw className="h-3 w-3" /> Go Back</button>
          </form>
        </Card>
      </div>
    );
  }

  if (step === "forgot-password") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#F8F9FB] font-body">
        <Card className="w-full max-w-sm rounded-[2.5rem] border-none shadow-2xl p-10 bg-white text-center animate-in zoom-in duration-300">
           <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
             <KeyRound className="h-10 w-10 text-[#002366]" />
           </div>
           <h2 className="text-2xl font-black text-[#002366] uppercase mb-4 tracking-tight">Password Recovery</h2>
           <p className="text-[13px] font-bold text-slate-500 mb-10 font-bengali">আপনার ইমেইলটি প্রবেশ করুন।</p>
           
           <form onSubmit={handleResetPassword} className="space-y-6">
             <Input 
               type="email" 
               placeholder="Email Address" 
               value={email} 
               onChange={(e) => setEmail(e.target.value)} 
               required
               className="h-16 bg-slate-50 border-none rounded-2xl mb-6 shadow-inner font-bold text-center text-[#002366]" 
             />
             <Button 
               type="submit" 
               disabled={loading}
               className="w-full bg-[#002366] hover:bg-[#001a4d] h-16 rounded-2xl font-black text-white shadow-xl shadow-primary/20 uppercase tracking-widest"
             >
               {loading ? "SENDING..." : "SEND LINK"}
             </Button>
             <button 
               type="button"
               onClick={() => setStep("auth")} 
               className="text-[11px] font-black text-slate-400 uppercase tracking-widest transition-colors"
             >
               Back to Login
             </button>
           </form>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-[#F8F9FB] font-body">
      <div className="w-full max-w-md flex flex-col items-center text-center mb-12 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="relative w-32 h-32 mb-8 rounded-full border-4 border-white shadow-xl bg-white flex items-center justify-center overflow-hidden">
          {logo ? <Image src={logo} alt="Logo" fill className="object-cover" /> : <div className="w-full h-full bg-[#002366] flex items-center justify-center text-white text-3xl font-black">MG</div>}
        </div>
        <h1 className="text-3xl font-[900] text-[#002366] uppercase tracking-tight mb-2">Minar Go Expatriate</h1>
        <p className="text-sm font-bold text-[#C4A052] uppercase tracking-[0.25em]">Development Foundation</p>
      </div>

      <Card className="w-full max-w-sm rounded-[2rem] border-none shadow-xl p-8 bg-white animate-in zoom-in duration-500">
        <form onSubmit={handleAuth} className="space-y-8">
          {!isLogin && (
            <div className="space-y-2">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Admin Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
                <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="pl-12 h-14 bg-slate-50 border-none shadow-sm rounded-2xl font-bold text-[#002366]" />
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email Access</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-12 h-14 bg-slate-50 border-none shadow-sm rounded-2xl font-bold text-[#002366]" />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Security Password</Label>
              {isLogin && <button type="button" onClick={() => setStep("forgot-password")} className="text-[10px] font-black text-[#002366] uppercase hover:underline">Forgot Password?</button>}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-300" />
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-12 h-14 bg-slate-50 border-none shadow-sm rounded-2xl font-bold text-[#002366]" />
            </div>
          </div>

          <Button type="submit" className="w-full bg-[#002366] hover:bg-[#001a4d] text-white font-black h-16 rounded-2xl text-lg shadow-xl shadow-primary/20 flex items-center justify-center gap-2 group" disabled={loading}>
            {loading ? "PROCESSING..." : (isLogin ? "SECURE LOGIN" : "GET VERIFICATION CODE")}
            <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
          </Button>

          <div className="text-center pt-2">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-xs text-slate-500 font-bold hover:text-primary transition-colors">
              {isLogin ? <>Don't have an account? <span className="text-[#002366] font-black">Sign up</span></> : <>Already have an account? <span className="text-[#002366] font-black">Login</span></>}
            </button>
          </div>
        </form>
      </Card>

      <div className="mt-16 text-center space-y-6">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-relaxed">
          © 2024 MINAR GO EXPATRIATE DEVELOPMENT FOUNDATION.<br/>
          ALL RIGHTS RESERVED.
        </p>
        <div className="flex flex-col items-center">
          <div className="h-[1px] w-32 bg-slate-200 mb-4" />
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">System Connection</p>
        </div>
      </div>
    </div>
  );
}
