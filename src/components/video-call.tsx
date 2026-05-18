
'use client';

import { useEffect, useRef, useState } from 'react';
import { User } from 'firebase/auth';
import { ShieldCheck, Video, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function VideoCall({ user }: { user: User }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initCall = async () => {
      if (!containerRef.current) return;

      try {
        const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

        const appID = 1192208819;
        const serverSecret = "63038b3400305f63d76378e906c27189";
        const roomID = "minargo_hq_room"; 
        
        const kitToken = ZegoUIKitPrebuilt.generateKitTokenForTest(
          appID,
          serverSecret,
          roomID,
          user.uid,
          user.displayName || "Foundation Admin"
        );

        const zp = ZegoUIKitPrebuilt.create(kitToken);
        
        zp.joinRoom({
          container: containerRef.current,
          scenario: {
            mode: ZegoUIKitPrebuilt.OneONoneCall,
          },
          showScreenSharingButton: true,
          showMyCameraToggleButton: true,
          showAudioVideoSettingsButton: true,
          turnOnCameraWhenJoining: true,
          turnOnMicrophoneWhenJoining: true,
          prejoinViewConfig: {
              title: "Foundation Video Gateway",
          },
          branding: {
              logoURL: "/logo.png",
          }
        });
        setLoading(false);
      } catch (error) {
        console.error("Zego Error:", error);
      }
    };

    initCall();
  }, [user]);

  return (
    <div className="flex flex-col h-[70vh] bg-white rounded-[2.5rem] shadow-2xl border border-slate-50 overflow-hidden animate-in fade-in duration-700">
      <div className="px-8 py-5 bg-primary text-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-md border border-white/20">
            <Video className="h-6 w-6 text-accent" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">Secure Video Link</h3>
            <p className="text-[9px] font-bold text-accent uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              End-to-End Encrypted
            </p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => window.location.reload()}>
           <RefreshCcw className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex-1 bg-slate-900 relative">
        <div ref={containerRef} className="w-full h-full" />
        
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none bg-slate-900/50 z-10">
              <ShieldCheck className="h-24 w-24 text-white/20 mb-4 animate-pulse" />
              <p className="text-white/40 text-[10px] font-black uppercase tracking-widest">Establishing Gateway...</p>
          </div>
        )}
      </div>
    </div>
  );
}
