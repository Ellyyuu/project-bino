import React from 'react';
import { Search } from 'lucide-react';

export default function ControlsBar({
  searchQuery = '',
  onSearchChange,
  activeFilter = 'all',
  onFilterChange,
  counts = { all: 0, active: 0, idle: 0, unfocused: 0, disconnected: 0 },
}) {
  const filterPills = [
    { key: 'all', label: `All (${counts.all})` },
    { key: 'active', label: `Active (${counts.active})` },
    { key: 'idle', label: `Idle (${counts.idle})` },
    { key: 'unfocused', label: `Unfocused (${counts.unfocused})` },
    { key: 'disconnected', label: `Disconnected (${counts.disconnected})` },
  ];

  return (
    <div className="flex items-center justify-between px-8 mt-4 select-none">
      {/* Left: Search box with depth on pink background */}
      <div className="relative flex items-center">
        <Search
          size={20}
          className="absolute left-3.5 text-[#541C42] pointer-events-none"
        />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search student name or Gmail..."
          className="w-[360px] h-[44px] bg-[#7A3A65]/30 border border-[#541C42]/40 text-[18px] text-[#421232] placeholder-[#541C42]/75 font-semibold rounded-xl pl-10 pr-3 focus:outline-none focus:ring-2 focus:ring-[#541C42] focus:bg-white/35 transition-all shadow-[inset_0_1px_3px_rgba(0,0,0,0.15)] font-sans"
        />
      </div>

      {/* Right: Category filter pills */}
      <div className="flex items-center gap-2">
        {filterPills.map((pill) => {
          const isActive = activeFilter === pill.key;
          return (
            <button
              key={pill.key}
              onClick={() => onFilterChange(pill.key)}
              className={`h-[44px] px-4 rounded-xl text-[19px] font-bold transition-all duration-150 flex items-center justify-center ${
                isActive
                  ? 'bg-[#7A3A65] border border-[#541C42] text-white shadow-[0_4px_12px_rgba(122,58,101,0.3),inset_0_1px_0_rgba(255,255,255,0.2)] ring-1 ring-white/20'
                  : 'bg-transparent border border-transparent text-[#541C42] hover:text-[#360E2A] hover:bg-[#541C42]/10'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
