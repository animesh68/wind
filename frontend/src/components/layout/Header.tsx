import React from 'react';
import { Wind, Clock, Sliders } from 'lucide-react';

interface HeaderProps {
  cutoffTime: string;
  setCutoffTime: (val: string) => void;
  matchingMode: string;
  setMatchingMode: (val: string) => void;
  apiHealthy: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  cutoffTime,
  setCutoffTime,
  matchingMode,
  setMatchingMode,
  apiHealthy,
}) => {
  return (
    <header className="h-16 border-b border-[#E2E5DE] bg-white px-4 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 rounded-lg bg-[#EAF1EB] border border-[#285C46]/20 flex items-center justify-center text-[#285C46]">
          <Wind className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-sm tracking-tight text-[#29332E] uppercase font-heading">
              Wind Intelligence
            </h1>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#EAF1EB] border border-[#285C46]/20 text-[#285C46] font-mono font-medium">
              v1.0 Pilot
            </span>
          </div>
          <p className="text-xs text-[#68736C] hidden sm:block">
            UK National Day-Ahead Wind Forecast & Error Analytics
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-2 sm:space-x-3">
        {/* Jan 2026 Target Window */}
        <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#F5F5F0] border border-[#E2E5DE] text-xs font-mono">
          <span className="text-[#68736C]">Window:</span>
          <span className="text-[#29332E] font-semibold">Jan 01 – Jan 31, 2026</span>
        </div>

        {/* Elexon BMRS Connection Status */}
        <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-[#F5F5F0] border border-[#E2E5DE] text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${apiHealthy ? 'bg-[#285C46]' : 'bg-[#B95D55]'}`}></span>
          <span className="text-[#68736C] hidden sm:inline">Elexon BMRS:</span>
          <span className={`font-medium ${apiHealthy ? 'text-[#285C46]' : 'text-[#B95D55]'}`}>
            {apiHealthy ? 'Online' : 'Checking'}
          </span>
        </div>

        {/* Resolution Selector */}
        <div className="flex items-center space-x-1.5 bg-white border border-[#E2E5DE] hover:border-[#658A70] rounded-md px-2 py-1 transition-colors">
          <Sliders className="w-3.5 h-3.5 text-[#68736C]" />
          <span className="text-xs text-[#68736C] font-mono hidden md:inline">Resolution:</span>
          <select
            value={matchingMode}
            onChange={(e) => setMatchingMode(e.target.value)}
            className="bg-transparent text-xs text-[#29332E] font-mono font-medium focus:outline-none cursor-pointer"
          >
            <option value="mapped">Mapped (1,488 SPs)</option>
            <option value="exact">Exact (744 Hours)</option>
          </select>
        </div>

        {/* D-1 Cutoff Selector */}
        <div className="flex items-center space-x-1.5 bg-white border border-[#E2E5DE] hover:border-[#658A70] rounded-md px-2.5 py-1 transition-colors">
          <Clock className="w-3.5 h-3.5 text-[#285C46]" />
          <span className="text-xs text-[#68736C] font-mono hidden md:inline">D-1 Cutoff:</span>
          <select
            value={cutoffTime}
            onChange={(e) => setCutoffTime(e.target.value)}
            className="bg-transparent text-xs text-[#285C46] font-mono font-bold focus:outline-none cursor-pointer"
          >
            <option value="09:00">09:00 (Early)</option>
            <option value="10:00">10:00 (Pre-Auction)</option>
            <option value="11:00">11:00 (Default DA)</option>
            <option value="12:00">12:00 (Gate Closure)</option>
            <option value="14:00">14:00 (Post-Auction)</option>
            <option value="17:00">17:00 (Late)</option>
          </select>
        </div>
      </div>
    </header>
  );
};
