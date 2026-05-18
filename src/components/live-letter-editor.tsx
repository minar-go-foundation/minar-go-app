
"use client";

import { useState, useRef } from "react";
import { 
  FileText, 
  Download, 
  Printer, 
  Phone, 
  Mail, 
  Globe, 
  ShieldCheck, 
  Sparkles,
  RefreshCw,
  Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

export default function LiveLetterEditor() {
  const { toast } = useToast();
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    // Short delay to ensure state update is reflected in DOM
    setTimeout(() => {
      window.print();
      setIsPrinting(false);
      toast({ 
        title: "Print Dialog Opened", 
        description: "Choose 'Save as PDF' to export your document." 
      });
    }, 50);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all changes and return to the original template?")) {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-body selection:bg-primary selection:text-white">
      {/* Top Controls - Hidden during print */}
      <div className="max-w-4xl mx-auto mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 no-print sticky top-4 z-50 bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-white/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg">
            <Type className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-tight text-primary">Live Document Editor</h2>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Click any text to edit directly (Supports বাংলা)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleReset} className="rounded-xl font-bold text-[10px] uppercase border-slate-200 h-11 px-4">
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Reset
          </Button>
          <Button onClick={handlePrint} className="rounded-xl font-black text-xs uppercase bg-primary shadow-lg shadow-primary/20 hover:scale-105 transition-transform px-6 h-11">
            <Download className="mr-2 h-4 w-4" /> Save as PDF
          </Button>
        </div>
      </div>

      {/* A4 Document Container */}
      <Card 
        className={`mx-auto bg-white shadow-2xl overflow-hidden transition-all duration-500 border-none
          ${isPrinting ? 'shadow-none' : ''}
          w-full max-w-[210mm] min-h-[297mm] flex flex-col document-container`}
      >
        {/* Navy Blue Header Banner */}
        <div className="bg-[#0a2e6b] text-white p-10 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-accent/20 rounded-full -ml-24 -mb-24 blur-3xl" />
          
          <div className="relative flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-2xl border-2 border-white/20">
              <ShieldCheck className="h-10 w-10 text-[#0a2e6b]" />
            </div>
            <h1 
              contentEditable 
              suppressContentEditableWarning
              className="text-3xl font-black uppercase tracking-tight outline-none focus:ring-2 focus:ring-accent/50 rounded px-2 transition-all font-headline"
            >
              Minar Go Expatriate
            </h1>
            <p 
              contentEditable 
              suppressContentEditableWarning
              className="text-sm font-bold text-accent uppercase tracking-[0.3em] mt-1 outline-none focus:ring-2 focus:ring-accent/50 rounded px-2 transition-all font-headline"
            >
              Development Foundation
            </p>
            <div className="mt-4 flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-white/60">
              <span>ESTD: 2024</span>
              <span className="w-1.5 h-1.5 bg-accent rounded-full" />
              <span>Govt Reg: MG-10293</span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-16 flex-1 flex flex-col text-slate-800 leading-relaxed font-body">
          {/* Date & Ref */}
          <div className="flex justify-between items-start mb-12">
            <div className="text-sm font-bold text-slate-400">
              <span className="uppercase tracking-widest block mb-1">Reference</span>
              <p contentEditable suppressContentEditableWarning className="text-slate-700 outline-none">MG/DF/2024/001</p>
            </div>
            <div className="text-right">
              <span className="text-sm font-bold text-slate-400 uppercase tracking-widest block mb-1">Date</span>
              <p contentEditable suppressContentEditableWarning className="text-sm font-black text-primary outline-none">
                {format(new Date(), "MMMM dd, yyyy")}
              </p>
            </div>
          </div>

          {/* Recipient */}
          <div className="mb-10">
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-3">To,</p>
            <div className="space-y-1">
              <p contentEditable suppressContentEditableWarning className="text-base font-black text-slate-900 outline-none uppercase font-headline">The Managing Director</p>
              <p contentEditable suppressContentEditableWarning className="text-sm font-bold text-slate-600 outline-none font-bengali">Sundow Properties LTD</p>
              <p contentEditable suppressContentEditableWarning className="text-sm font-medium text-slate-400 outline-none font-bengali">Official Correspondent Address, Dhaka, Bangladesh.</p>
            </div>
          </div>

          {/* Subject */}
          <div className="mb-8 p-6 bg-slate-50 border-l-4 border-primary rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">Subject Line</span>
            </div>
            <h3 contentEditable suppressContentEditableWarning className="text-lg font-black text-slate-900 outline-none leading-tight font-bengali">
              Letter of Demand Regarding Development Agreement & Strategic Partnership
            </h3>
          </div>

          {/* Body */}
          <div className="space-y-6 text-sm">
            <p contentEditable suppressContentEditableWarning className="outline-none font-bengali">
              Dear Sir/Madam, <br/><br/>
              With reference to the above subject, we, the "Minar Go Expatriate Development Foundation," would like to state that we are committed to enhancing the socio-economic welfare of our members and expatriate community.
            </p>
            
            <div contentEditable suppressContentEditableWarning className="space-y-4 outline-none font-bengali whitespace-pre-wrap">
              <p>1. That we have carefully reviewed the proposed terms of the development project and our foundation intends to proceed with the membership enrollment process.</p>
              <p>2. That the financial installments and deposit timelines must be strictly adhered to as per the mutual understanding documented in the primary agreement.</p>
              <p>3. That we request a formal site inspection and a detailed progress report within the next 15 working days.</p>
            </div>

            <p contentEditable suppressContentEditableWarning className="outline-none italic text-slate-500 font-bengali">
              We look forward to your valuable cooperation and a prompt positive response regarding this matter.
            </p>
          </div>

          {/* Signatures - Pushed to bottom of flex container */}
          <div className="mt-auto pt-20 flex justify-between items-end">
            <div className="text-center">
              <div className="w-48 h-px bg-slate-200 mb-4" />
              <p contentEditable suppressContentEditableWarning className="text-xs font-black text-primary uppercase tracking-widest outline-none font-headline">Foundation Authority</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase font-headline">Minar Go Foundation</p>
            </div>
            <div className="text-center">
              <div className="w-48 h-px bg-slate-200 mb-4" />
              <p contentEditable suppressContentEditableWarning className="text-xs font-black text-slate-700 uppercase tracking-widest outline-none font-headline">Received By</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase font-headline">Authorized Signature</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-10 bg-slate-50 border-t border-slate-100 flex flex-wrap justify-center gap-x-12 gap-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Phone className="h-3.5 w-3.5 text-primary" />
            <span contentEditable suppressContentEditableWarning className="outline-none">+8801725277089</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Mail className="h-3.5 w-3.5 text-primary" />
            <span contentEditable suppressContentEditableWarning className="outline-none">pranuae.farooq@gmail.com</span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">
            <Globe className="h-3.5 w-3.5 text-primary" />
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
