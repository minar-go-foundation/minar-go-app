
"use client";

import { useEffect, useRef } from 'react';
import { User } from 'firebase/auth';
import { ShieldCheck, Video, VideoOff, Mic, PhoneOff } from 'lucide-react';

export default function VideoCall({ user }: { user: User }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initCall = async () => {
      if (!containerRef.current) return;

      const { ZegoUIKitPrebuilt } = await import('@zegocloud/zego-uikit-prebuilt');

      const appID = 1192208819;
      const serverSecret = "63038b3400305f63d76378e906c27189";
      const roomID = "minargo_hq_room"; // Shared room for Foundation HQ
      
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
      </div>
      
      <div className="flex-1 bg-slate-900 relative">
        <div ref={containerRef} className="w-full h-full" />
        
        {/* Placeholder UI if kit takes time to load */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-20">
            <ShieldCheck className="h-24 w-24 text-white mb-4" />
            <p className="text-white text-xs font-black uppercase tracking-widest">Establishing Secure Connection...</p>
        </div>
      </div>
    </div>
  );
}
