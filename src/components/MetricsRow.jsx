import React from 'react';
import { UserCheck, Activity, AlertTriangle, Radio } from 'lucide-react';

export default function MetricsRow({
  presentCount = 0,
  totalEnrolled = 0,
  activeCount = 0,
  flaggedCount = 0,
  dropsCount = 0,
}) {
  const cards = [
    {
      id: 'attendance',
      value: `${presentCount}/${totalEnrolled} Present`,
      label: 'Total Attendance',
      icon: <UserCheck size={26} className="text-white/80" />,
    },
    {
      id: 'active',
      value: `${activeCount} Active`,
      label: 'Active Students',
      icon: <Activity size={26} className="text-emerald-300" />,
    },
    {
      id: 'flagged',
      value: `${flaggedCount} Flagged`,
      label: 'Idle / Unfocused',
      icon: <AlertTriangle size={26} className="text-amber-300" />,
    },
    {
      id: 'drops',
      value: `${dropsCount} Drops Logged`,
      label: 'Disconnections',
      icon: <Radio size={26} className="text-slate-300" />,
    },
  ];

  return (
    <div className="grid grid-cols-4 gap-4 px-8 mt-4 select-none">
      {cards.map((card) => (
        <div
          key={card.id}
          className="bg-[#7A3A65]/80 backdrop-blur-md border border-white/20 rounded-2xl p-5 shadow-[0_8px_20px_rgba(0,0,0,0.25),inset_0_1px_0_rgba(255,255,255,0.2)] hover:shadow-xl hover:border-white/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between"
        >
          <div className="flex items-start justify-between">
            <div className="text-[30px] font-extrabold text-white tracking-tight leading-none drop-shadow-sm">
              {card.value}
            </div>
            <div className="p-2.5 rounded-xl bg-[#3B5570]/70 border border-white/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
              {card.icon}
            </div>
          </div>
          <div className="text-[16px] text-white/80 font-semibold mt-3">
            {card.label}
          </div>
        </div>
      ))}
    </div>
  );
}
