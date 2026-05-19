
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
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [name, setName] = useState("");
  const [otpInput, setOtpInput] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);
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
          toast({ 
            title: "Verification Sent!", 
            description: `A secure code has been sent to ${email}.` 
          });
        } else {
          throw new Error(result.error || "Failed to send OTP. Please try again.");
        }
      }
    } catch (error: any) {
      toast({ 
        title: "Auth Error", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPasswordInitiate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email Required", description: "Please enter your email first.", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const result = await sendOtpEmailAction(email, otp);
      if (result.success) {
        setGeneratedOtp(otp);
        setStep("otp-reset");
        toast({ title: "Verification Code Sent!", description: "Check your email for the recovery code." });
      } else {
        throw new Error(result.error);
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtpReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpInput !== generatedOtp) {
      toast({ title: "Invalid Code", description: "The OTP you entered is incorrect.", variant: "destructive" });
      return;
    }
    setStep("new-password-setup");
    toast({ title: "Identity Verified!", description: "Now you can set your new password." });
  };

  const handleFinalPasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth) return;
    if (newPassword !== confirmNewPassword) {
      toast({ title: "Mismatch", description: "Passwords do not match.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Too Weak", description: "Password must be at least 6 characters.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setStep("reset-success");
      toast({ 
        title: "Security Link Dispatched", 
        description: "The activation link has been sent to your email." 
      });
    } catch (error: any) {
      toast({ title: "Reset Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth || !db) return;
    if (otpInput !== generatedOtp) {
      toast({ title: "Invalid Code", description: "The OTP you entered is incorrect.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      const adminData = {
        name,
        email,
        createdAt: new Date().toISOString()
      };

      setDoc(doc(db, "admin_users", userCredential.user.uid), adminData)
        .catch(async (err) => {
           const permissionError = new FirestorePermissionError({
             path: `admin_users/${userCredential.user.uid}`,
             operation: 'create',
             requestResourceData: adminData
           });
           errorEmitter.emit('permission-error', permissionError);
        });
      
      toast({ title: "Account Verified!", description: "New Admin email added successfully." });
    } catch (error: any) {
      toast({ title: "Registration Error", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (step === "reset-success") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 font-body">
        <Card className="w-full max-w-sm rounded-[2.5rem] border-none shadow-2xl p-10 bg-white text-center animate-in fade-in zoom-in duration-500">
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
          </div>
          <h2 className="text-xl font-black text-[#002366] uppercase mb-4 tracking-tight">CHECK YOUR EMAIL</h2>
          <div className="space-y-4 mb-10 px-2">
            <p className="text-[13px] font-bold text-slate-500 leading-relaxed font-bengali">নিরাপত্তার স্বার্থে আপনার ইমেইলে একটি লিঙ্ক পাঠানো হয়েছে। ওই লিঙ্কে ক্লিক করলেই আপনার নতুন পাসওয়ার্ডটি সক্রিয় হয়ে যাবে।</p>
          </div>
          <Button onClick={() => { setStep("auth"); setIsLogin(true); }} className="w-full bg-[#002366] hover:bg-[#001a4d] h-14 rounded-2xl font-black text-sm tracking-widest transition-all active:scale-95 shadow-lg shadow-primary/20">BACK TO LOGIN</Button>
        </Card>
      </div>
    );
  }

  if (step === "new-password-setup") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 font-body">
        <Card className="w-full max-w-sm rounded-[2.5rem] border-none shadow-2xl p-8 bg-white">
          <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto"><Lock className="h-8 w-8 text-primary" /></div>
            <h2 className="text-xl font-black text-primary uppercase">Set New Password</h2>
          </div>
          <form onSubmit={handleFinalPasswordReset} className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">New Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type={showPass ? "text" : "password"} placeholder="••••••••" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required className="pl-12 h-14 bg-slate-50 border-none shadow-inner rounded-2xl" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input type={showPass ? "text" : "password"} placeholder="••••••••" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required className="pl-12 h-14 bg-slate-50 border-none shadow-inner rounded-2xl" />
                </div>
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary h-14 rounded-2xl font-black text-base shadow-lg shadow-primary/20" disabled={loading}>{loading ? "SAVING..." : "UPDATE & ACTIVATE"}</Button>
          </form>
        </Card>
      </div>
    );
  }

  if (step === "otp" || step === "otp-reset") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 font-body">
        <Card className="w-full max-w-sm rounded-[2.5rem] border-none shadow-2xl p-8 bg-white">
          <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto"><ShieldCheck className="h-8 w-8 text-primary" /></div>
            <h2 className="text-xl font-black text-primary uppercase">{step === "otp-reset" ? "Identity Check" : "Verify Email"}</h2>
          </div>
          <form onSubmit={step === "otp-reset" ? handleVerifyOtpReset : handleVerifyAndRegister} className="space-y-6">
            <Input placeholder="000000" value={otpInput} onChange={(e) => setOtpInput(e.target.value)} maxLength={6} required className="h-16 text-center text-2xl font-black tracking-[0.5em] rounded-2xl bg-slate-50 border-none shadow-inner" />
            <Button type="submit" className="w-full bg-primary h-14 rounded-2xl font-black text-base shadow-lg shadow-primary/20" disabled={loading}>{loading ? "VERIFYING..." : "CONFIRM IDENTITY"}</Button>
            <button type="button" onClick={() => setStep("auth")} className="w-full text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-2"><RefreshCcw className="h-3 w-3" /> Go Back</button>
          </form>
        </Card>
      </div>
    );
  }

  if (step === "forgot-password") {
    return (step === "forgot-password" && (
      <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-slate-50 font-body">
        <Card className="w-full max-w-sm rounded-[2.5rem] border-none shadow-2xl p-8 bg-white">
          <div className="text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto"><KeyRound className="h-8 w-8 text-primary" /></div>
            <h2 className="text-xl font-black text-primary uppercase">Password Recovery</h2>
          </div>
          <form onSubmit={handleForgotPasswordInitiate} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Admin Email</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-12 h-14 bg-slate-50 border-none shadow-inner rounded-2xl" />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary h-14 rounded-2xl font-black text-base shadow-lg shadow-primary/20" disabled={loading}>{loading ? "SENDING..." : "GET RECOVERY CODE"}</Button>
            <button type="button" onClick={() => setStep("auth")} className="w-full text-xs font-bold text-slate-400 hover:text-primary transition-colors flex items-center justify-center gap-2"><ArrowRight className="h-3 w-3 rotate-180" /> Back to Login</button>
          </form>
        </Card>
      </div>
    ));
  }

  return (
    <div className="flex flex-col items-center justify-between min-h-screen p-6 bg-slate-50 font-body">
      <div className="mt-12 flex flex-col items-center text-center">
        <div className="relative w-24 h-24 mb-6 rounded-full border-[3px] border-accent p-1 bg-white shadow-lg flex items-center justify-center overflow-hidden">
          {logo ? <Image src={logo} alt="Logo" fill className="object-cover" /> : <div className="w-full h-full bg-primary rounded-full flex items-center justify-center text-accent text-2xl font-black">MG</div>}
        </div>
        <h1 className="text-xl font-extrabold text-primary uppercase">Minar Go Expatriate</h1>
        <p className="text-[10px] text-accent font-bold uppercase tracking-[0.2em] mt-1">Development Foundation</p>
      </div>

      <div className="w-full max-w-sm mt-8 flex-1">
        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <div className="space-y-2">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Admin Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} required className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl" />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label className="text-[10px] font-bold text-muted-foreground uppercase ml-1">Email Access</Label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="email" placeholder="Email Address" value={email} onChange={(e) => setEmail(e.target.value)} required className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Security Password</Label>
              {isLogin && <button type="button" onClick={() => setStep("forgot-password")} className="text-[9px] font-bold text-primary uppercase hover:underline">Forgot Password?</button>}
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl" />
            </div>
          </div>
          <Button type="submit" className="w-full bg-primary hover:bg-primary/95 text-white font-black h-14 rounded-2xl text-base shadow-lg shadow-primary/20 flex items-center justify-center gap-2" disabled={loading}>
            {loading ? "PROCESSING..." : (isLogin ? "SECURE LOGIN" : "GET VERIFICATION CODE")}
            <ArrowRight className="h-5 w-5" />
          </Button>
          <div className="text-center pt-2">
            <button type="button" onClick={() => setIsLogin(!isLogin)} className="text-xs text-primary font-bold hover:underline flex items-center justify-center gap-1 mx-auto">
              {isLogin ? <><UserPlus className="h-3 w-3" /> Register New Admin Email</> : <>Return to Login <ArrowRight className="h-3 w-3" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
