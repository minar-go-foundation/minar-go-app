"use client";

import { useState } from "react";
import { draftDemandLetter } from "@/ai/flows/ai-demand-letter-drafting-flow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Sparkles, Download, Phone, Mail, Globe, ShieldCheck } from "lucide-react";
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
      setResult(draft);
      toast({ title: "Draft Generated", description: "Your AI letter draft is ready." });
    } catch (error) {
      toast({ title: "AI Error", description: "Failed to generate draft.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = (lang: 'English' | 'Bengali') => {
    const doc = new jsPDF();
    const isBengali = lang === 'Bengali';
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // 1. Top Border Line
    doc.setDrawColor(0, 35, 102);
    doc.setLineWidth(1.5);
    doc.line(15, 10, pageWidth - 15, 10);

    // 2. Header Blue Box
    doc.setFillColor(0, 35, 102);
    doc.roundedRect(15, 15, pageWidth - 30, 25, 3, 3, 'F');
    
    // Header Text (English only for PDF compatibility unless custom font loaded)
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("MINAR GO EXPATRIATE", pageWidth / 2, 28, { align: "center" });
    doc.setFontSize(12);
    doc.setTextColor(255, 215, 0); // Gold-ish
    doc.text("DEVELOPMENT FOUNDATION", pageWidth / 2, 35, { align: "center" });

    // 3. Date (Right Aligned)
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Date: ${format(new Date(letterDetails.date), "dd MMMM, yyyy")}`, pageWidth - 15, 55, { align: "right" });

    // 4. Recipient
    doc.setFont("helvetica", "bold");
    doc.text("To:", 15, 65);
    doc.setFont("helvetica", "normal");
    doc.text(letterDetails.companyName || "Sundow Properties LTD", 15, 72);

    // 5. Subject
    doc.setFont("helvetica", "bold");
    const subject = isBengali ? result?.subjectBengali : result?.subjectEnglish;
    doc.text(`Subject: ${subject}`, 15, 85);

    // 6. Body Text
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const bodyText = isBengali ? result?.bodyBengali : result?.bodyEnglish;
    const splitBody = doc.splitTextToSize(bodyText || "", 180);
    doc.text(splitBody, 15, 100);

    // 7. Signature Area
    const finalY = 100 + (splitBody.length * 6) + 20;
    doc.setFont("helvetica", "normal");
    doc.text("Sincerely,", 15, finalY);

    // Left Signature Line
    doc.line(15, finalY + 25, 85, finalY + 25);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("Minar Go Expatriate Development Foundation", 15, finalY + 30);

    // Right Signature Line
    doc.line(pageWidth - 85, finalY + 25, pageWidth - 15, finalY + 25);
    doc.text(letterDetails.companyName, pageWidth - 85, finalY + 30);

    // 8. Footer Section
    const footerY = pageHeight - 40;
    
    // Contact Info Line
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`${letterDetails.mobile} | ${letterDetails.email} | ${letterDetails.website}`, pageWidth / 2, footerY, { align: "center" });

    // Thank you bar (Light Green)
    doc.setFillColor(232, 245, 233);
    doc.roundedRect(15, footerY + 5, pageWidth - 30, 8, 4, 4, 'F');
    doc.setTextColor(0, 100, 0);
    doc.setFont("helvetica", "normal");
    doc.text("Thank you for your cooperation.", pageWidth / 2, footerY + 10.5, { align: "center" });

    // Copyright
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(`© Minar Go Expatriate Development Foundation`, pageWidth / 2, footerY + 20, { align: "center" });

    doc.save(`MinarGo_Official_Letter_${lang}.pdf`);
  };

  return (
    <Card className="shadow-lg border-none bg-white rounded-3xl overflow-hidden">
      <CardHeader className="bg-primary/5 p-6 border-b border-primary/10">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary rounded-xl text-white">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <CardTitle className="text-lg font-black text-primary uppercase">Official Letter Assistant</CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase text-slate-400">Draft professional demand letters</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Recipient Company</label>
              <Input 
                placeholder="Sundow Properties LTD" 
                value={letterDetails.companyName}
                onChange={(e) => setLetterDetails({...letterDetails, companyName: e.target.value})}
                className="h-12 rounded-xl bg-slate-50 border-slate-100"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-widest">Letter Purpose</label>
              <Textarea 
                placeholder="e.g., Request for group account opening with special conditions..." 
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="h-32 rounded-xl bg-slate-50 border-slate-100 resize-none"
              />
            </div>
            <Button 
              className="w-full bg-primary hover:bg-primary/95 text-white font-black h-14 rounded-2xl text-base shadow-lg shadow-primary/20 active:scale-95 transition-all" 
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "AI IS DRAFTING..." : "GENERATE AI DRAFT"}
            </Button>
          </div>

          <div className="space-y-4 bg-slate-50 p-6 rounded-3xl border border-dashed border-slate-200 min-h-[300px] flex flex-col">
            {result ? (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 flex-1">
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <h4 className="text-[10px] font-black text-primary uppercase mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> Subject Preview (EN)
                  </h4>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">{result.subjectEnglish}</p>
                </div>
                
                <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
                  <h4 className="text-[10px] font-black text-primary uppercase mb-2 flex items-center gap-2">
                    <ShieldCheck className="h-3 w-3" /> Subject Preview (BN)
                  </h4>
                  <p className="text-xs font-bold font-bengali text-slate-700 leading-relaxed">{result.subjectBengali}</p>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <Button variant="outline" className="h-12 rounded-2xl border-slate-200 font-bold text-xs" onClick={() => downloadPDF('English')}>
                    <Download className="mr-2 h-4 w-4" /> ENGLISH PDF
                  </Button>
                  <Button variant="outline" className="h-12 rounded-2xl border-slate-200 font-bold text-xs" onClick={() => downloadPDF('Bengali')}>
                    <Download className="mr-2 h-4 w-4" /> BENGALI PDF
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center py-10">
                <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-sm mb-4">
                  <FileText className="h-8 w-8 text-slate-200" />
                </div>
                <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">No Draft Yet</h5>
                <p className="text-[9px] text-slate-400 mt-1 max-w-[200px]">Enter details and generate to see your official letter preview.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
