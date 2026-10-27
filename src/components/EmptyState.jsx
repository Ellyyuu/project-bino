import React from 'react';
import { Wifi, Eye } from 'lucide-react';
import DinoMascot from './DinoMascot';

export default function EmptyState() {
  return (
    <div className="h-[380px] flex flex-col items-center justify-center border-2 border-dashed border-[#541C42]/35 rounded-2xl bg-[#7A3A65]/20 backdrop-blur-md mx-8 px-6 text-center select-none shadow-[inset_0_2px_8px_rgba(122,58,101,0.2)]">
      {/* Visual Elements with Depth */}
      <div className="flex items-center justify-center gap-6 mb-5">
        <div className="p-3.5 rounded-2xl bg-[#7A3A65]/35 border border-[#541C42]/30 text-[#541C42] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.1)]">
          <Wifi size={28} />
        </div>

        <div className="relative drop-shadow-[0_8px_16px_rgba(122,58,101,0.3)]">
          <DinoMascot variant="idle" size={68} />
        </div>

        <div className="p-3.5 rounded-2xl bg-[#7A3A65]/35 border border-[#541C42]/30 text-[#541C42] shadow-[inset_0_1px_2px_rgba(0,0,0,0.2),0_2px_4px_rgba(0,0,0,0.1)]">
          <Eye size={28} />
        </div>
      </div>

      {/* Heading */}
      <h3 className="text-[22px] font-extrabold text-white mb-2 tracking-tight drop-shadow-sm">
        Waiting for attendees to join Google Meet...
      </h3>

      {/* Subtext */}
      <p className="text-[16px] text-[#4A173A] font-semibold max-w-[640px] leading-relaxed">
        Attendee names, Gmail addresses, real-time focus status, Wi-Fi health, and engagement logs will record and appear here automatically upon entry.
      </p>
    </div>
  );
}
