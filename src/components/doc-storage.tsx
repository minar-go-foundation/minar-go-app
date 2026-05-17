"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Trash2, FileText, Upload, ExternalLink, HardDrive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

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
        date: new Date().toLocaleDateString()
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

  const viewDoc = (doc: MGDoc) => {
    const newWindow = window.open();
    if (newWindow) {
      newWindow.document.write(`<iframe src="${doc.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
    }
  };

  return (
    <Card className="shadow-lg border-none h-full">
      <CardHeader className="bg-primary/5">
        <CardTitle className="flex items-center gap-2">
          <HardDrive className="text-primary h-5 w-5" /> Document Storage
        </CardTitle>
        <CardDescription>Save licenses, IDs, and official forms locally</CardDescription>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="flex gap-2">
          <Input 
            placeholder="Document Title" 
            value={title} 
            onChange={(e) => setTitle(e.target.value)}
          />
          <div className="relative">
            <Button className="bg-primary" disabled={loading}>
              <Upload className="mr-2 h-4 w-4" /> {loading ? "..." : "Upload"}
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

        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {docs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground bg-muted/10 rounded-xl border-2 border-dashed">
              <FileText className="h-10 w-10 mx-auto opacity-20 mb-2" />
              <p>No documents stored</p>
            </div>
          ) : (
            docs.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <FileText className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold">{doc.title}</h5>
                    <p className="text-[10px] text-muted-foreground uppercase">{doc.date} • {doc.type.split('/')[1]}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => viewDoc(doc)}>
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteDoc(doc.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
