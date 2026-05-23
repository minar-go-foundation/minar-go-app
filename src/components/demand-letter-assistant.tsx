
"use client";

import { useState } from "react";
import { draftDemandLetter } from "@/ai/flows/ai-demand-letter-drafting-flow";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Sparkles, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { jsPDF } from "jspdf";
import { saveBlobToDevice } from "@/lib/saveFile";

export default function DemandLetterAssistant() {
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [letterDetails, setLetterDetails] = useState({ 
    companyName: "Sundow Properties LTD", 
    mobile: "+8801725277089", 
    email: "pranuae.farooq@gmail.com", 
    website: "https://minargo.world", 
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
        toast({ title: "Draft Generated" }); 
      }
    } catch (error) { 
      toast({ title: "AI Error", variant: "destructive" }); 
    } finally { 
      setLoading(false); 
    }
  };

  const downloadPDF = async (lang: 'English' | 'Bengali') => {
    try {
      const doc = new jsPDF();
      const isBengali = lang === 'Bengali';
      const pageWidth = doc.internal.pageSize.width;
      const pageHeight = doc.internal.pageSize.height;
      
      doc.setDrawColor(0, 35, 102); 
      doc.setLineWidth(0.5); 
      doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
      
      doc.setFillColor(0, 35, 102); 
      doc.roundedRect(15, 15, pageWidth - 30, 35, 3, 3, 'F');
      
      doc.setTextColor(255, 255, 255); 
      doc.setFontSize(22); 
      doc.text("MINAR GO EXPATRIATE", pageWidth / 2, 32, { align: "center" });
      
      doc.setFontSize(10); 
      doc.setTextColor(255, 215, 0); 
      doc.text("DEVELOPMENT FOUNDATION", pageWidth / 2, 40, { align: "center" });
      
      doc.setTextColor(0, 0, 0); 
      doc.setFontSize(10); 
      doc.text(`Date: ${letterDetails.date}`, pageWidth - 20, 60, { align: "right" });
      doc.text("To,", 20, 70); 
      doc.text(letterDetails.companyName, 20, 76);
      
      doc.setFont("helvetica", "bold"); 
      doc.text(`Subject: ${isBengali ? result?.subjectBengali : result?.subjectEnglish}`, 20, 95);
      
      const splitBody = doc.splitTextToSize(isBengali ? result?.bodyBengali : result?.bodyEnglish || "", 170);
      doc.setFont("helvetica", "normal"); 
      doc.text(splitBody, 20, 110);
      
      doc.text("With Regards, Minar Go Authority", 20, pageHeight - 50);
      
      const pdfData = doc.output('blob');
      const saved = await saveBlobToDevice(pdfData, `MinarGo_Letter_${lang}_${Date.now()}.pdf`);
      if (saved) {
        toast({ title: "Document Saved", description: "Check your Downloads folder." });
      } else {
        toast({ title: "Export Error", variant: "destructive" });
      }
    } catch (e) { 
      toast({ title: "Export Error", variant: "destructive" }); 
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-2xl border-none bg-white rounded-[2.5rem] overflow-hidden">
        <CardHeader className="bg-primary p-8 text-white">
          <CardTitle className="text-2xl font-black uppercase">Official Letter Assistant</CardTitle>
          <CardDescription className="text-white/60 text-[10px] font-bold uppercase">AI-Powered Drafting</CardDescription>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <Input 
            placeholder="Recipient Company" 
            value={letterDetails.companyName} 
            onChange={(e) => setLetterDetails({...letterDetails, companyName: e.target.value})} 
            className="h-14 rounded-2xl bg-slate-50 border-none font-bold px-4" 
          />
          <Textarea 
            placeholder="Describe the purpose..." 
            value={purpose} 
            onChange={(e) => setPurpose(e.target.value)} 
            className="h-44 rounded-3xl bg-slate-50 border-none p-6 text-sm" 
          />
          <Button 
            className="w-full bg-primary h-16 rounded-2xl text-lg font-black uppercase" 
            onClick={handleGenerate} 
            disabled={loading}
          >
            {loading ? "PROCESSING..." : "GENERATE AI DRAFT"}
          </Button>
          {result && (
            <div className="grid grid-cols-2 gap-4 pt-4">
              <Button variant="outline" className="h-14 rounded-2xl font-black text-xs" onClick={() => downloadPDF('English')}>
                <Download className="mr-2 h-4 w-4" /> ENGLISH PDF
              </Button>
              <Button variant="outline" className="h-14 rounded-2xl font-black text-xs" onClick={() => downloadPDF('Bengali')}>
                <Download className="mr-2 h-4 w-4" /> BENGALI PDF
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
