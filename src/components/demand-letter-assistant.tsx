"use client";

import { useState } from "react";
import { draftDemandLetter } from "@/ai/flows/ai-demand-letter-drafting-flow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Sparkles, Download, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { jsPDF } from "jspdf";

export default function DemandLetterAssistant() {
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    subjectEnglish: string;
    subjectBengali: string;
    bodyEnglish: string;
    bodyBengali: string;
  } | null>(null);
  
  const [letterDetails, setLetterDetails] = useState({
    companyName: "Sundow Properties LTD",
    mobile: "+8801725277089",
    email: "pranuae.farooq@gmail.com",
    website: "https://1minargo7.atoms.world",
    date: format(new Date(), "yyyy-MM-dd")
  });

  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!purpose.trim()) return;
    setLoading(true);
    try {
      const draft = await draftDemandLetter({ purposeDescription: purpose });
      if (draft) {
        setResult(draft);
        toast({ title: "Draft Generated", description: "Your AI letter draft is ready." });
      } else {
        throw new Error("Empty response from AI");
      }
    } catch (error) {
      console.error(error);
      toast({ 
        title: "AI Error", 
        description: "Failed to generate draft.", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (lang: 'English' | 'Bengali') => {
    const doc = new jsPDF();
    const isBengali = lang === 'Bengali';
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    doc.setDrawColor(0, 35, 102);
    doc.setLineWidth(1.5);
    doc.line(15, 10, pageWidth - 15, 10);

    doc.setFillColor(0, 35, 102);
    doc.roundedRect(15, 15, pageWidth - 30, 25, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("MINAR GO EXPATRIATE", pageWidth / 2, 28, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(255, 215, 0);
    doc.text("DEVELOPMENT FOUNDATION", pageWidth / 2, 35, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Date: ${format(new Date(letterDetails.date), "dd MMMM, yyyy")}`, pageWidth - 15, 55, { align: "right" });

    doc.setFont("helvetica", "bold");
    doc.text("To:", 15, 65);
    doc.setFont("helvetica", "normal");
    doc.text(letterDetails.companyName || "Sundow Properties LTD", 15, 72);

    doc.setFont("helvetica", "bold");
    const subject = isBengali ? result?.subjectBengali : result?.subjectEnglish;
    doc.text(`Subject: ${subject}`, 15, 85);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const bodyText = isBengali ? result?.bodyBengali : result?.bodyEnglish;
    const splitBody = doc.splitTextToSize(bodyText || "", 180);
    doc.text(splitBody, 15, 100);

    const finalY = 100 + (splitBody.length * 6) + 20;
    doc.setFont("helvetica", "normal");
    doc.text("Sincerely,", 15, finalY);

    doc.line(15, finalY + 25, 85, finalY + 25);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Minar Go Expatriate Development Foundation", 15, finalY + 30);

    doc.line(pageWidth - 85, finalY + 25, pageWidth - 15, finalY + 25);
    doc.text(letterDetails.companyName, pageWidth - 85, finalY + 30);

    const footerY = pageHeight - 40;
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${letterDetails.mobile} | ${letterDetails.email} | ${letterDetails.website}`, pageWidth / 2, footerY, { align: "center" });

    doc.setFillColor(232, 245, 233);
    doc.roundedRect(15, footerY + 5, pageWidth - 30, 8, 4, 4, 'F');
    doc.setTextColor(0, 100, 0);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your cooperation.", pageWidth / 2, footerY + 10.5, { align: "center" });

    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`© Minar Go Expatriate Development Foundation`, pageWidth / 2, footerY + 20, { align: "center" });

    doc.save(`MinarGo_Official_Letter_${lang}.pdf`);
  };

  return (
    <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
      <CardHeader className="bg-slate-50/50 p-8 border-b border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <Sparkles className="h-6 w-6" />
          </div>
          <div>
            <CardTitle className="text-xl font-black text-primary uppercase tracking-tight">Official Letter Assistant</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400 tracking-widest mt-1">Draft professional demand letters</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-8 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Recipient Company</label>
              <Input 
                placeholder="Sundow Properties LTD" 
                value={letterDetails.companyName}
                onChange={(e) => setLetterDetails({...letterDetails, companyName: e.target.value})}
                className="h-14 rounded-2xl bg-slate-50 border-none shadow-sm placeholder:text-slate-300 px-6"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black uppercase text-slate-400 tracking-[0.2em] ml-1">Letter Purpose</label>
              <Textarea 
                placeholder="ডিমান্ড লেটার এর যে স্ক্রিনশট আমি দিয়েছি একদম হুবহু ঐরকম করে দিবেন..." 
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="h-44 rounded-[2rem] bg-slate-50 border-none shadow-sm resize-none p-6 placeholder:text-slate-300"
              />
            </div>
            <Button 
              className="w-full bg-[#002366] hover:bg-[#001a4d] text-white font-black h-16 rounded-2xl text-lg shadow-xl shadow-blue-900/20 active:scale-[0.98] transition-all uppercase tracking-wider" 
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "Drafting..." : "Generate AI Draft"}
            </Button>
          </div>

          <div className="relative group">
            <div className="absolute inset-0 bg-blue-50/30 rounded-[2.5rem] border-2 border-dashed border-slate-200" />
            <div className="relative h-full min-h-[400px] flex flex-col p-8">
              {result ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h4 className="text-[10px] font-black text-primary uppercase mb-3 flex items-center gap-2 tracking-widest">
                      <ShieldCheck className="h-4 w-4 text-accent" /> Subject Preview (EN)
                    </h4>
                    <p className="text-sm font-bold text-slate-700 leading-relaxed">{result.subjectEnglish}</p>
                  </div>
                  
                  <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <h4 className="text-[10px] font-black text-primary uppercase mb-3 flex items-center gap-2 tracking-widest">
                      <ShieldCheck className="h-4 w-4 text-accent" /> Subject Preview (BN)
                    </h4>
                    <p className="text-sm font-bold font-bengali text-slate-700 leading-relaxed">{result.subjectBengali}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    <Button variant="outline" className="h-14 rounded-2xl border-slate-200 font-black text-xs hover:bg-slate-50" onClick={() => downloadPDF('English')}>
                      <Download className="mr-2 h-4 w-4" /> ENGLISH PDF
                    </Button>
                    <Button variant="outline" className="h-14 rounded-2xl border-slate-200 font-black text-xs hover:bg-slate-50" onClick={() => downloadPDF('Bengali')}>
                      <Download className="mr-2 h-4 w-4" /> BENGALI PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center flex-1 text-center py-10">
                  <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-md mb-6">
                    <FileText className="h-10 w-10 text-slate-200" />
                  </div>
                  <h5 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">No Draft Yet</h5>
                  <p className="text-[10px] text-slate-400 mt-2 max-w-[220px] font-medium leading-relaxed">
                    Enter details and generate to see your official letter preview.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
