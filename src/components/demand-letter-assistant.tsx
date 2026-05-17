"use client";

import { useState } from "react";
import { draftDemandLetter } from "@/ai/flows/ai-demand-letter-drafting-flow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Sparkles, Download, ShieldCheck, Mail, Phone, Globe } from "lucide-react";
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
        description: "Failed to generate draft. Please check your connection.", 
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
    
    // Page Border
    doc.setDrawColor(0, 35, 102);
    doc.setLineWidth(0.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

    // Dark Blue Header Box
    doc.setFillColor(0, 35, 102);
    doc.roundedRect(15, 15, pageWidth - 30, 35, 3, 3, 'F');
    
    // Header Text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text("MINAR GO EXPATRIATE", pageWidth / 2, 32, { align: "center" });
    
    doc.setFontSize(10);
    doc.setTextColor(255, 215, 0); // Gold color
    doc.text("DEVELOPMENT FOUNDATION", pageWidth / 2, 40, { align: "center" });
    doc.setFontSize(8);
    doc.text("ESTD: 2024 | GOVT. REG NO: MG-10293", pageWidth / 2, 45, { align: "center" });

    // Date
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    const dateStr = `Date: ${format(new Date(), "dd MMMM, yyyy")}`;
    doc.text(dateStr, pageWidth - 20, 60, { align: "right" });

    // Recipient Info
    doc.setFontSize(11);
    doc.text("To,", 20, 70);
    doc.setFont("helvetica", "bold");
    doc.text(letterDetails.companyName || "Managing Director", 20, 76);
    doc.setFont("helvetica", "normal");
    doc.text("Official Correspondent Address", 20, 81);

    // Subject
    doc.setFont("helvetica", "bold");
    const subject = isBengali ? result?.subjectBengali : result?.subjectEnglish;
    doc.text(`Subject: ${subject}`, 20, 95);

    // Body with light yellow background (premium look)
    const bodyText = isBengali ? result?.bodyBengali : result?.bodyEnglish;
    const splitBody = doc.splitTextToSize(bodyText || "", 170);
    const bodyHeight = (splitBody.length * 7) + 20;
    
    doc.setFillColor(255, 253, 235); // Very light gold/yellow
    doc.roundedRect(15, 105, pageWidth - 30, bodyHeight, 2, 2, 'F');
    
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(splitBody, 20, 118);

    // Signatures
    const finalY = 118 + bodyHeight + 20;
    doc.setFont("helvetica", "normal");
    doc.text("With Regards,", 20, finalY);

    // Signature Area
    doc.setDrawColor(200, 200, 200);
    doc.line(20, finalY + 30, 80, finalY + 30);
    doc.line(pageWidth - 80, finalY + 30, pageWidth - 20, finalY + 30);

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.text("Foundation Authority", 20, finalY + 35);
    doc.text("Received By", pageWidth - 20, finalY + 35, { align: "right" });

    // Footer
    const footerY = pageHeight - 40;
    
    // Contact Info Bar
    doc.setFillColor(245, 245, 245);
    doc.rect(15, footerY, pageWidth - 30, 15, 'F');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    const contactText = `Tel: ${letterDetails.mobile}  |  Email: ${letterDetails.email}  |  Web: ${letterDetails.website}`;
    doc.text(contactText, pageWidth / 2, footerY + 9, { align: "center" });

    // Green Thank You Bar
    doc.setFillColor(232, 245, 233);
    doc.roundedRect(15, footerY + 18, pageWidth - 30, 8, 4, 4, 'F');
    doc.setTextColor(46, 125, 50);
    doc.setFont("helvetica", "bold");
    doc.text("Thank you for your valuable cooperation and support.", pageWidth / 2, footerY + 23.5, { align: "center" });

    doc.save(`MinarGo_Official_Agreement_${lang}.pdf`);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary p-8 text-white relative">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="flex items-center gap-4 relative">
            <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/30">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <div>
              <CardTitle className="text-2xl font-black uppercase tracking-tight">Official Agreement Assistant</CardTitle>
              <CardDescription className="text-white/60 text-[10px] font-bold uppercase tracking-widest mt-1">AI-Powered Professional Letter Drafting</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Company / Recipient</label>
                <div className="relative">
                  <Input 
                    placeholder="e.g. Sundow Properties LTD" 
                    value={letterDetails.companyName}
                    onChange={(e) => setLetterDetails({...letterDetails, companyName: e.target.value})}
                    className="h-14 rounded-2xl bg-slate-50 border-none shadow-sm px-6 font-bold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest ml-1">Draft Purpose & Context</label>
                <Textarea 
                  placeholder="Describe the letter's purpose in detail..." 
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="h-44 rounded-3xl bg-slate-50 border-none shadow-sm resize-none p-6"
                />
              </div>
              <Button 
                className="w-full bg-primary hover:bg-primary/95 text-white font-black h-16 rounded-2xl text-lg shadow-xl shadow-primary/20 active:scale-[0.98] transition-all uppercase" 
                onClick={handleGenerate}
                disabled={loading}
              >
                {loading ? "PROCESSING AI DRAFT..." : "GENERATE AI DRAFT"}
              </Button>
            </div>

            <div className="bg-slate-50/50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-8 flex flex-col justify-center min-h-[400px]">
              {result ? (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-4">
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <p className="text-[9px] font-black text-primary uppercase mb-2 tracking-widest">Subject Preview</p>
                      <p className="text-sm font-bold text-slate-700">{result.subjectEnglish}</p>
                    </div>
                    <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                      <p className="text-[9px] font-black text-primary uppercase mb-2 tracking-widest">Body Preview (Snippet)</p>
                      <p className="text-xs text-slate-500 line-clamp-4 leading-relaxed">{result.bodyEnglish}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button variant="outline" className="h-14 rounded-2xl border-slate-200 font-black text-xs hover:bg-white hover:shadow-md" onClick={() => downloadPDF('English')}>
                      <Download className="mr-2 h-4 w-4" /> ENGLISH PDF
                    </Button>
                    <Button variant="outline" className="h-14 rounded-2xl border-slate-200 font-black text-xs hover:bg-white hover:shadow-md" onClick={() => downloadPDF('Bengali')}>
                      <Download className="mr-2 h-4 w-4" /> BENGALI PDF
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                    <FileText className="h-8 w-8 text-slate-200" />
                  </div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Draft Generated</p>
                  <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto">Input details on the left and click generate to see the professional preview.</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
