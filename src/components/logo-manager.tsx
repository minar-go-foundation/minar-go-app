"use client";

import { useRef } from "react";
import { Camera, RefreshCw } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

interface LogoManagerProps {
  currentLogo: string | null;
  onUpdate: (logo: string) => void;
}

export default function LogoManager({ currentLogo, onUpdate }: LogoManagerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleLogoClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({ title: "File too large", description: "Logo must be under 2MB", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        localStorage.setItem("mg_logo", base64);
        onUpdate(base64);
        toast({ title: "Logo updated", description: "Your foundation logo has been saved." });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div 
        className="relative w-24 h-24 rounded-[2rem] overflow-hidden border-4 border-white bg-slate-100 flex items-center justify-center cursor-pointer group shadow-2xl transition-transform active:scale-95"
        onClick={handleLogoClick}
      >
        {currentLogo ? (
          <Image src={currentLogo} alt="Logo" fill className="object-cover" />
        ) : (
          <div className="text-primary/20 flex flex-col items-center">
            <Camera className="w-8 h-8 mb-1" />
            <span className="text-[10px] font-black uppercase">Upload</span>
          </div>
        )}
        <div className="absolute inset-0 bg-primary/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
          <RefreshCw className="text-white w-6 h-6 animate-spin-slow" />
        </div>
      </div>
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*" 
      />
    </div>
  );
}
