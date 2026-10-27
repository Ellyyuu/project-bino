import React, { useState } from 'react';
import DinoMascot from './DinoMascot';
import EmptyState from './EmptyState';
import { Wifi, Eye, X, Clock, Activity, AlertTriangle, Moon, WifiOff } from 'lucide-react';

export default function RosterTable({ students = [], onPingStudent }) {
  const [activeHistoryStudent, setActiveHistoryStudent] = useState(null);

  // Helper for wifi color
  const getWifiColorClass = (wifiHealth) => {
    switch (wifiHealth?.toLowerCase()) {
      case 'stable':
        return 'text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.7)]';
      case 'fair':
        return 'text-amber-300 drop-shadow-[0_0_8px_rgba(252,211,77,0.7)]';
      case 'poor':
        return 'text-rose-400 drop-shadow-[0_0_8px_rgba(248,113,113,0.7)]';
      default:
        return 'text-white/80';
    }
  };

  // Helper for high-visibility status pill styling with tactile depth
  const getStatusPill = (status) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[13px] font-extrabold uppercase tracking-wider bg-emerald-500/25 border-2 border-emerald-400 text-emerald-200 shadow-[0_0_12px_rgba(52,211,153,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#34D399] animate-pulse"></span>
            ACTIVE
          </span>
        );
      case 'idle':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[13px] font-extrabold uppercase tracking-wider bg-amber-500/30 border-2 border-amber-300 text-amber-100 shadow-[0_0_12px_rgba(251,191,36,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_6px_#FCD34D]"></span>
            IDLE
          </span>
        );
      case 'unfocused':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[13px] font-extrabold uppercase tracking-wider bg-rose-500/30 border-2 border-rose-400 text-rose-100 shadow-[0_0_12px_rgba(244,63,94,0.35),inset_0_1px_0_rgba(255,255,255,0.2)]">
            <span className="w-2 h-2 rounded-full bg-rose-400 shadow-[0_0_6px_#F43F5E]"></span>
            UNFOCUSED
          </span>
        );
      case 'disconnected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[13px] font-extrabold uppercase tracking-wider bg-slate-800/80 border-2 border-slate-300 text-slate-100 shadow-[0_0_10px_rgba(203,213,225,0.3),inset_0_1px_0_rgba(255,255,255,0.15)]">
            <span className="w-2 h-2 rounded-full bg-slate-400"></span>
            DISCONNECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-[13px] font-extrabold uppercase tracking-wider bg-[#7A3A65] text-white border-2 border-white/30">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="w-full flex-1 flex flex-col mt-4 select-none px-8 overflow-x-auto">
      <div className="min-w-[1180px] flex flex-col">
        {/* Table Headers */}
        <div className="flex items-center text-left text-[18px] font-bold text-[#541C42] border-b-2 border-[#541C42]/25 pb-3 px-6 tracking-wide uppercase">
          <div className="w-[300px]">STUDENT NAME & GMAIL</div>
          <div className="w-[240px]">LIVE STATUS & DINO</div>
          <div className="w-[150px]">DURATION</div>
          <div className="w-[130px] text-center">WIFI HEALTH</div>
          <div className="w-[210px]">ENGAGEMENT</div>
          <div className="w-[170px]">ACTIONS</div>
          <div className="w-[90px] text-center">HISTORY</div>
        </div>

        {/* Initial State vs Populated Rows */}
        {students.length === 0 ? (
          <div className="py-6">
            <EmptyState />
          </div>
        ) : (
          <div className="space-y-3 pt-3 overflow-y-auto max-h-[470px] pr-1">
            {students.map((student) => (
              <div
                key={student.id}
                className="flex items-center text-left py-3.5 px-6 rounded-2xl bg-[#7A3A65]/40 hover:bg-[#7A3A65]/65 backdrop-blur-md border border-white/20 hover:border-white/35 shadow-[0_4px_16px_rgba(122,58,101,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] transition-all duration-200 group"
              >
                {/* Col 1: Student Name stacked over Gmail */}
                <div className="w-[300px] flex flex-col justify-center">
                  <span className="text-[20px] font-bold text-white leading-tight truncate drop-shadow-sm">
                    {student.name}
                  </span>
                  <span className="text-[14px] font-bold text-[#541C42] group-hover:text-white leading-normal truncate transition-colors">
                    {student.email}
                  </span>
                </div>

                {/* Col 2: Dynamic Dino Mascot + Status pill tag with depth */}
                <div className="w-[240px] flex items-center gap-3">
                  <div className="drop-shadow-md transition-transform duration-200 group-hover:scale-110">
                    <DinoMascot variant={student.status} size={38} />
                  </div>
                  {getStatusPill(student.status)}
                </div>

                {/* Col 3: Duration string with digital font look */}
                <div className="w-[150px] text-[19px] font-semibold text-white font-mono tracking-wider drop-shadow-sm">
                  {student.duration || '00:00:00'}
                </div>

                {/* Col 4: Standalone Lucide Wifi icon in elevated container */}
                <div className="w-[130px] flex justify-center items-center">
                  <div
                    className="p-2 rounded-xl bg-[#3B5570]/80 border border-white/20 shadow-[inset_0_1px_3px_rgba(0,0,0,0.4),0_2px_6px_rgba(0,0,0,0.25)] flex items-center justify-center transition-transform group-hover:scale-105"
                    title={`Wi-Fi Health: ${student.wifiHealth || 'Stable'}`}
                  >
                    <Wifi
                      size={24}
                      className={getWifiColorClass(student.wifiHealth)}
                    />
                  </div>
                </div>

                {/* Col 5: Horizontal engagement track bar (width 120px) + percentage with depth */}
                <div className="w-[210px] flex items-center gap-3">
                  <div className="w-[120px] h-[10px] bg-[#3B5570]/90 rounded-full overflow-hidden border border-white/20 shadow-[inset_0_2px_4px_rgba(0,0,0,0.5)]">
                    <div
                      className="h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(136,164,167,0.5)]"
                      style={{
                        width: `${student.engagement || 0}%`,
                        background:
                          (student.engagement || 0) >= 75
                            ? 'linear-gradient(90deg, #49676C, #88A4A7)'
                            : (student.engagement || 0) >= 45
                            ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                            : 'linear-gradient(90deg, #DC2626, #F87171)',
                      }}
                    />
                  </div>
                  <span className="text-[16px] font-extrabold text-white drop-shadow-sm min-w-[42px]">
                    {student.engagement || 0}%
                  </span>
                </div>

                {/* Col 6: Button "Ping Student" with 3D tactile button depth */}
                <div className="w-[170px] flex items-center">
                  <button
                    onClick={() => onPingStudent && onPingStudent(student)}
                    className="h-[38px] px-4 bg-gradient-to-b from-[#8E4877] to-[#662E53] hover:from-[#9D5285] hover:to-[#763560] active:translate-y-0.5 border border-white/25 hover:border-white/40 text-[18px] font-bold text-white rounded-xl shadow-[0_4px_10px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] active:shadow-inner flex items-center justify-center transition-all cursor-pointer"
                  >
                    Ping Student
                  </button>
                </div>

                {/* Col 7: Standalone clickable Lucide Eye icon with depth tile */}
                <div className="w-[90px] flex justify-center items-center">
                  <button
                    onClick={() => setActiveHistoryStudent(student)}
                    className="p-2.5 rounded-xl bg-[#3B5570]/70 hover:bg-[#3B5570] border border-white/20 hover:border-white/40 text-white shadow-[0_2px_6px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.15)] active:translate-y-0.5 transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-[#88A4A7]"
                    title="View Student Focus History"
                  >
                    <Eye size={20} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating History Log Popover */}
      {activeHistoryStudent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md select-none p-4"
          onClick={() => setActiveHistoryStudent(null)}
        >
          <div
            className="w-[420px] bg-[#7A3A65] border-2 border-white/25 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.6)] p-6 text-white animate-in fade-in zoom-in-95 duration-150 relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between border-b border-white/20 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="drop-shadow-md">
                  <DinoMascot variant={activeHistoryStudent.status} size={38} />
                </div>
                <div>
                  <h4 className="text-[19px] font-extrabold text-white leading-tight">
                    {activeHistoryStudent.name}
                  </h4>
                  <p className="text-[13px] text-[#88A4A7] font-medium">
                    {activeHistoryStudent.email}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveHistoryStudent(null)}
                className="p-1.5 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* History Title */}
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-[#88A4A7]" />
              <span className="text-[13px] font-bold tracking-wider text-white/90 uppercase">
                Chronological Status Log
              </span>
            </div>

            {/* Timeline */}
            <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
              {activeHistoryStudent.history && activeHistoryStudent.history.length > 0 ? (
                activeHistoryStudent.history.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-xl bg-[#3B5570]/40 border border-white/15 shadow-sm"
                  >
                    <div className="text-[13px] font-bold text-white min-w-[70px]">
                      {item.time}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[12px] font-extrabold uppercase text-emerald-300">
                          {item.status}
                        </span>
                      </div>
                      {item.label && (
                        <p className="text-[12px] text-white/80 mt-0.5 leading-snug">
                          {item.label}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-[14px] text-white/70 text-center py-4">
                  No status changes logged yet.
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/20 flex items-center justify-between text-[13px] text-white/80">
              <span>Current: <strong className="text-white capitalize">{activeHistoryStudent.status}</strong></span>
              <span>Duration: <strong className="text-white font-mono">{activeHistoryStudent.duration || '00:00:00'}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
