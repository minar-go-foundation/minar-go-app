
"use client";

import { useState, useEffect } from "react";
import { 
  FileText, 
  Download, 
  Type, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles, 
  Phone, 
  Mail, 
  Globe,
  Pencil
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function LiveLetterEditor() {
  const { toast } = useToast();
  const [resetKey, setResetKey] = useState(0);

  const handlePrint = () => {
    toast({ 
      title: "প্রিন্ট অপশন ওপেন হচ্ছে...", 
      description: "PDF সেভ করার জন্য 'Save as PDF' অপশনটি সিলেক্ট করুন।" 
    });
    
    // Give time for the toast to be seen before opening the system print dialog
    setTimeout(() => {
      window.print();
    }, 500);
  };

  return (
    <div key={resetKey} className="min-h-screen bg-slate-50 py-10 px-4 font-body selection:bg-primary selection:text-white">
      {/* Top Controls - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 no-print sticky top-4 z-50 bg-white/95 backdrop-blur-md p-4 rounded-[2rem] shadow-2xl border border-white/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
            <Type className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-primary">Live Document Editor</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">যেকোনো লেখার ওপর ক্লিক করে এডিট করুন (বাংলা সাপোর্ট)</p>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="flex-1 sm:flex-none rounded-xl font-bold text-[10px] uppercase border-slate-200 h-11 px-4">
                <RefreshCw className="mr-2 h-3.5 w-3.5" /> Reset Template
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent className="rounded-[2.5rem] border-none shadow-2xl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-black text-primary uppercase text-xl">Reset Document?</AlertDialogTitle>
                <AlertDialogDescription className="font-bold text-slate-500">
                  আপনি কি নিশ্চিত? এটি আপনার করা সব পরিবর্তন মুছে ফেলে মূল টেমপ্লেটটি ফিরিয়ে আনবে।
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2">
                <AlertDialogCancel className="rounded-xl font-bold h-12">CANCEL</AlertDialogCancel>
                <AlertDialogAction onClick={() => setResetKey(k => k + 1)} className="rounded-xl font-bold h-12 bg-primary">
                  YES, RESET NOW
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          
          <Button onClick={handlePrint} className="flex-1 sm:flex-none rounded-xl font-black text-xs uppercase bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-transform px-6 h-11">
            <Download className="mr-2 h-4 w-4" /> Save as PDF
          </Button>
        </div>
      </div>

      {/* A4 Document Container */}
      <Card 
        className="mx-auto bg-white shadow-2xl overflow-hidden border-none w-full max-w-[210mm] min-h-[297mm] flex flex-col document-container animate-in fade-in zoom-in-95 duration-700"
      >
        {/* Navy Blue Header Banner */}
        <div className="bg-[#0a2e6b] text-white p-12 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full -ml-24 -mb-24 blur-3xl" />
          
          <div className="relative flex flex-col items-center text-center group cursor-text">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-2xl border-2 border-white/20">
              <ShieldCheck className="h-10 w-10 text-[#0a2e6b]" />
            </div>
            <div className="relative">
              <h1 
                contentEditable 
                suppressContentEditableWarning
                className="text-4xl font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-accent/50 rounded-xl px-4 py-2 transition-all font-headline border-2 border-transparent hover:border-white/20"
              >
                Minar Go Expatriate
              </h1>
              <Pencil className="absolute -right-6 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 no-print" />
            </div>
            <p 
              contentEditable 
              suppressContentEditableWarning
              className="text-base font-bold text-accent uppercase tracking-[0.3em] mt-2 outline-none focus:ring-2 focus:ring-accent/50 rounded-lg px-4 transition-all font-headline border-2 border-transparent hover:border-white/10"
            >
              Development Foundation
            </p>
            <div className="mt-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-white/60">
              <span>ESTD: 2024</span>
              <span className="w-1.5 h-1.5 bg-accent rounded-full" />
              <span>Govt Reg: MG-10293</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-20 flex-1 flex flex-col text-slate-800 leading-relaxed font-body">
          {/* Date & Ref */}
          <div className="flex justify-between items-start mb-16">
            <div className="text-sm font-bold text-slate-400 group">
              <span className="uppercase tracking-widest block mb-2">Reference No.</span>
              <p contentEditable suppressContentEditableWarning className="text-slate-700 outline-none border-b border-transparent hover:border-slate-200 px-1 font-mono">MG/DF/2024/001</p>
            </div>
            <div className="text-right group">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-2">Issue Date</span>
              <p contentEditable suppressContentEditableWarning className="text-sm font-black text-primary outline-none border-b border-transparent hover:border-slate-200 px-1">
                {format(new Date(), "MMMM dd, yyyy")}
              </p>
            </div>
          </div>

          {/* Recipient */}
          <div className="mb-12">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Recipient Information:</p>
            <div className="space-y-1.5 group">
              <p contentEditable suppressContentEditableWarning className="text-lg font-black text-slate-900 outline-none uppercase font-headline border-l-2 border-transparent hover:border-slate-200 pl-3">The Managing Director</p>
              <p contentEditable suppressContentEditableWarning className="text-base font-bold text-slate-600 outline-none font-bengali border-l-2 border-transparent hover:border-slate-200 pl-3">Sundow Properties LTD</p>
              <p contentEditable suppressContentEditableWarning className="text-sm font-medium text-slate-400 outline-none font-bengali border-l-2 border-transparent hover:border-slate-200 pl-3 italic">Official Correspondent Address, Dhaka, Bangladesh.</p>
            </div>
          </div>

          {/* Subject */}
          <div className="mb-10 p-8 bg-slate-50 border-l-[6px] border-primary rounded-[1.5rem] relative group">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Subject Line</span>
            </div>
            <h3 contentEditable suppressContentEditableWarning className="text-xl font-black text-slate-900 outline-none leading-snug font-bengali">
              Letter of Demand Regarding Development Agreement & Strategic Partnership
            </h3>
          </div>

          {/* Body Content */}
          <div className="space-y-8 text-[15px] group">
            <p contentEditable suppressContentEditableWarning className="outline-none font-bengali border-2 border-transparent hover:border-slate-100 p-2 rounded-xl">
              Dear Sir/Madam, <br/><br/>
              With reference to the above subject, we, the "Minar Go Expatriate Development Foundation," would like to state that we are committed to enhancing the socio-economic welfare of our members and expatriate community worldwide.
            </p>
            
            <div contentEditable suppressContentEditableWarning className="space-y-6 outline-none font-bengali whitespace-pre-wrap border-2 border-transparent hover:border-slate-100 p-2 rounded-xl">
              <p>১. That we have carefully reviewed the proposed terms of the development project and our foundation intends to proceed with the membership enrollment process.</p>
              <p>২. That the financial installments and deposit timelines must be strictly adhered to as per the mutual understanding documented in the primary agreement.</p>
              <p>৩. That we request a formal site inspection and a detailed progress report within the next 15 working days from this correspondence.</p>
            </div>

            <p contentEditable suppressContentEditableWarning className="outline-none italic text-slate-500 font-bengali border-2 border-transparent hover:border-slate-100 p-2 rounded-xl">
              We look forward to your valuable cooperation and a prompt positive response regarding this matter.
            </p>
          </div>

          {/* Signatures */}
          <div className="mt-auto pt-24 flex justify-between items-end">
            <div className="text-center group">
              <div className="w-56 h-px bg-slate-200 mb-6" />
              <p contentEditable suppressContentEditableWarning className="text-sm font-black text-primary uppercase tracking-[0.15em] outline-none font-headline">Foundation Authority</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase font-headline mt-1">Minar Go Foundation</p>
            </div>
            <div className="text-center group">
              <div className="w-56 h-px bg-slate-200 mb-6" />
              <p contentEditable suppressContentEditableWarning className="text-sm font-black text-slate-700 uppercase tracking-[0.15em] outline-none font-headline">Received By</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase font-headline mt-1">Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Footer Bar */}
        <div className="p-12 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-center gap-x-14 gap-y-5 no-print-bg">
          <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest group">
            <div className="p-2 bg-white rounded-lg shadow-sm"><Phone className="h-4 w-4 text-primary" /></div>
            <span contentEditable suppressContentEditableWarning className="outline-none">+8801725277089</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest group">
            <div className="p-2 bg-white rounded-lg shadow-sm"><Mail className="h-4 w-4 text-primary" /></div>
            <span contentEditable suppressContentEditableWarning className="outline-none">pranuae.farooq@gmail.com</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-black text-slate-500 uppercase tracking-widest group">
            <div className="p-2 bg-white rounded-lg shadow-sm"><Globe className="h-4 w-4 text-primary" /></div>
            <span contentEditable suppressContentEditableWarning className="outline-none">www.minargo.world</span>
          </div>
        </div>
      </Card>

      <style jsx global>{`
        @media print {
          body {
            background: white !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .document-container {
            box-shadow: none !important;
            border: none !important;
            width: 210mm !important;
            height: 297mm !important;
            margin: 0 !important;
            padding: 0 !important;
            border-radius: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            overflow: hidden !important;
          }
          .no-print-bg {
            background-color: #f8fafc !important;
            -webkit-print-color-adjust: exact;
          }
          @page {
            size: A4;
            margin: 0;
          }
        }
      `}</style>
    </div>
  );
}
