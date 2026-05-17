"use client";

import { useState } from "react";
import { draftDemandLetter } from "@/ai/flows/ai-demand-letter-drafting-flow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Sparkles, Download, Printer } from "lucide-react";
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
    companyName: "",
    mobile: "017XXXXXXXX",
    email: "info@minargo.com",
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
    
    // Header Strip
    doc.setFillColor(0, 35, 102);
    doc.rect(0, 0, 210, 30, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.text(isBengali ? "মিনার গো প্রবাসী উন্নয়ন ফাউন্ডেশন" : "MINAR GO EXPATRIATE DEVELOPMENT FOUNDATION", 105, 15, { align: "center" });
    doc.setFontSize(10);
    doc.text(isBengali ? "MINAR GO EXPATRIATE DEVELOPMENT FOUNDATION" : "Unity is Strength - Serving the Community", 105, 25, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Date: ${letterDetails.date}`, 15, 45);
    doc.text(`To,`, 15, 55);
    doc.text(`${letterDetails.companyName || "[Company Name]"}`, 15, 62);
    
    doc.setFont("helvetica", "bold");
    doc.text(`Subject: ${isBengali ? result?.subjectBengali : result?.subjectEnglish}`, 15, 75);
    
    doc.setFont("helvetica", "normal");
    const bodyText = isBengali ? result?.bodyBengali : result?.bodyEnglish;
    const splitBody = doc.splitTextToSize(bodyText || "", 180);
    doc.text(splitBody, 15, 85);
    
    const finalY = 85 + (splitBody.length * 7);
    
    doc.text("Sincerely,", 15, finalY + 20);
    doc.text("________________________", 15, finalY + 40);
    doc.text("Authorized Signature", 15, finalY + 47);
    doc.text("(Foundation)", 15, finalY + 54);

    doc.text("________________________", 140, finalY + 40);
    doc.text("Receiving Signature", 140, finalY + 47);
    doc.text("(Company)", 140, finalY + 54);

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text(`Mobile: ${letterDetails.mobile} | Email: ${letterDetails.email} | Website: www.minargo.com`, 105, 285, { align: "center" });
    doc.text("COPYRIGHT © MINAR GO FOUNDATION 2024", 105, 292, { align: "center" });

    doc.save(`MinarGo_Letter_${lang}_${format(new Date(), "yyyyMMdd")}.pdf`);
  };

  return (
    <Card className="shadow-lg border-none">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-accent h-5 w-5" /> AI Official Letter Generator
        </CardTitle>
        <CardDescription>Draft professional demand letters with AI assistance</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Recipient Company</label>
              <Input 
                placeholder="Company Name" 
                value={letterDetails.companyName}
                onChange={(e) => setLetterDetails({...letterDetails, companyName: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase text-muted-foreground">Purpose Keywords</label>
              <Textarea 
                placeholder="e.g., Salary demand for July, new visa request, etc." 
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="h-32"
              />
            </div>
            <Button 
              className="w-full bg-accent hover:bg-accent/90 text-primary-foreground font-bold h-12" 
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "AI is Drafting..." : "Generate AI Draft"}
            </Button>
          </div>

          <div className="space-y-4 bg-muted/20 p-4 rounded-lg min-h-[300px] border border-dashed border-primary/20">
            {result ? (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                <div className="p-3 bg-white rounded border">
                  <h4 className="font-bold text-xs text-primary uppercase mb-1">Subject (EN)</h4>
                  <p className="text-sm">{result.subjectEnglish}</p>
                </div>
                <div className="p-3 bg-white rounded border">
                  <h4 className="font-bold text-xs text-primary uppercase mb-1">Subject (BN)</h4>
                  <p className="text-sm font-bengali">{result.subjectBengali}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => downloadPDF('English')}>
                    <Download className="mr-2 h-4 w-4" /> English PDF
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => downloadPDF('Bengali')}>
                    <Download className="mr-2 h-4 w-4" /> Bengali PDF
                  </Button>
                </div>
                <p className="text-[10px] text-center text-muted-foreground">AI drafts should be reviewed before printing.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <FileText className="h-12 w-12 opacity-20 mb-2" />
                <p>Enter a purpose and generate a draft to see the preview here.</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
