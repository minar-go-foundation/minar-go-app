
"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Upload, Download, HardDrive, Eye, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface MGDoc {
  id: string;
  title: string;
  type: string;
  data: string;
  date: string;
}

export default function DocStorage() {
  const [docs, setDocs] = useState<MGDoc[]>([]);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<MGDoc | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem("mg_docs");
    if (saved) {
      try {
        setDocs(JSON.parse(saved));
      } catch (e) {
        setDocs([]);
      }
    }
  }, []);

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !title) {
      toast({ title: "Error", description: "Enter title and select file", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max size is 5MB", variant: "destructive" });
      return;
    }

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      const newDoc: MGDoc = {
        id: Math.random().toString(36).substr(2, 9),
        title,
        type: file.type,
        data: base64,
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
      };
      
      const updatedDocs = [newDoc, ...docs];
      setDocs(updatedDocs);
      localStorage.setItem("mg_docs", JSON.stringify(updatedDocs));
      setTitle("");
      setLoading(false);
      toast({ title: "Document Saved", description: "Stored securely in local memory." });
    };
    reader.readAsDataURL(file);
  };

  const deleteDoc = (id: string) => {
    if (!confirm("Delete this document?")) return;
    const updated = docs.filter(d => d.id !== id);
    setDocs(updated);
    localStorage.setItem("mg_docs", JSON.stringify(updated));
    toast({ title: "Deleted", description: "Document removed." });
  };

  const downloadDoc = (doc: MGDoc) => {
    const link = document.createElement("a");
    link.href = doc.data;
    link.download = `${doc.title}.${doc.type.split('/')[1]}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isImage = (type: string) => type.startsWith('image/');

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-none bg-white rounded-3xl overflow-hidden">
        <CardHeader className="bg-primary/5 p-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary rounded-xl text-white">
              <HardDrive className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg font-black text-primary uppercase">Gallery & Storage</CardTitle>
              <CardDescription className="text-[10px] uppercase font-bold text-slate-400">Secure digital vault</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="flex flex-col gap-3">
            <Input 
              placeholder="Document / Image Title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              className="h-12 rounded-xl border-slate-100 bg-slate-50"
            />
            <div className="relative">
              <Button className="w-full bg-primary h-12 rounded-xl text-white font-bold" disabled={loading}>
                <Upload className="mr-2 h-4 w-4" /> {loading ? "PROCESSING..." : "UPLOAD TO VAULT"}
              </Button>
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleUpload} 
                accept=".pdf,.jpg,.jpeg,.png"
                disabled={loading}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto pr-1">
            {docs.length === 0 ? (
              <div className="col-span-2 text-center py-20 text-muted-foreground bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <FileText className="h-12 w-12 mx-auto opacity-10 mb-2" />
                <p className="text-xs font-bold uppercase tracking-wider text-slate-300">Vault is empty</p>
              </div>
            ) : (
              docs.map(doc => (
                <div key={doc.id} className="group relative flex flex-col bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all">
                  <div className="aspect-square relative bg-slate-100 overflow-hidden">
                    {isImage(doc.type) ? (
                      <img src={doc.data} alt={doc.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-primary/30">
                        <FileText className="h-12 w-12" />
                        <span className="text-[8px] font-bold uppercase mt-1">PDF DOCUMENT</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => setPreviewDoc(doc)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="secondary" className="h-8 w-8 rounded-full" onClick={() => downloadDoc(doc)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-8 w-8 rounded-full" onClick={() => deleteDoc(doc.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="p-3">
                    <h5 className="text-[10px] font-black text-slate-800 uppercase truncate">{doc.title}</h5>
                    <div className="flex items-center gap-1 mt-1 text-slate-400">
                      <Calendar className="h-3 w-3" />
                      <span className="text-[8px] font-bold">{doc.date}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Preview Dialog */}
      <Dialog open={!!previewDoc} onOpenChange={() => setPreviewDoc(null)}>
        <DialogContent className="max-w-[95vw] rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-4 bg-white border-b">
            <DialogTitle className="text-sm font-black uppercase text-primary">{previewDoc?.title}</DialogTitle>
          </DialogHeader>
          <div className="relative w-full aspect-auto min-h-[50vh] bg-slate-50 flex items-center justify-center p-4">
            {previewDoc && (
              isImage(previewDoc.type) ? (
                <img src={previewDoc.data} alt="Preview" className="max-w-full max-h-[70vh] rounded-xl shadow-lg" />
              ) : (
                <iframe src={previewDoc.data} className="w-full h-[60vh] border-none rounded-xl" />
              )
            )}
          </div>
          <div className="p-4 bg-white flex justify-between items-center border-t">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Saved on: {previewDoc?.date}</span>
            <Button size="sm" onClick={() => previewDoc && downloadDoc(previewDoc)} className="bg-primary rounded-xl font-bold">
              <Download className="mr-2 h-4 w-4" /> DOWNLOAD
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
