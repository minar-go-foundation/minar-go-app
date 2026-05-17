"use client";

import { useRef } from "react";
import { Camera } from "lucide-react";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

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
    <div 
      className="relative w-10 h-10 rounded-lg overflow-hidden border border-white/30 bg-white/10 flex items-center justify-center cursor-pointer group active:scale-95 transition-transform"
      onClick={handleLogoClick}
    >
      {currentLogo ? (
        <Image src={currentLogo} alt="Logo" fill className="object-cover" />
      ) : (
        <span className="text-accent font-black text-sm">MG</span>
      )}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
        <Camera className="text-white w-4 h-4" />
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
