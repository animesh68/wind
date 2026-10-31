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
    <header className="h-16 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-6 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center space-x-3">
        <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
          <Wind className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-bold text-base tracking-wide text-slate-100 uppercase">
              Wind Intelligence
            </h1>
            <span className="text-xs px-2 py-0.5 rounded bg-cyan-950/70 border border-cyan-800/60 text-cyan-300 font-mono font-medium">
              v1.0 PILOT
            </span>
          </div>
          <p className="text-xs text-slate-400">
            UK National Day-Ahead Wind Forecast & Error Quantification Terminal
          </p>
        </div>
      </div>

      <div className="flex items-center space-x-4">
        {/* Jan 2026 context */}
        <div className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-slate-400">Target Window:</span>
          <span className="text-cyan-400 font-semibold">Jan 01 - Jan 31, 2026</span>
        </div>

        {/* API Health Pill */}
        <div className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-950 border border-slate-800 text-xs font-mono">
          <span className={`w-2 h-2 rounded-full ${apiHealthy ? 'bg-emerald-400' : 'bg-rose-400'}`}></span>
          <span className="text-slate-400">Elexon BMRS:</span>
          <span className={apiHealthy ? 'text-emerald-400' : 'text-rose-400'}>
            {apiHealthy ? 'ONLINE' : 'CHECKING'}
          </span>
        </div>

        {/* Matching Mode */}
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-md px-2 py-1">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">Resolution:</span>
          <select
            value={matchingMode}
            onChange={(e) => setMatchingMode(e.target.value)}
            className="bg-transparent text-xs text-slate-200 font-mono font-medium focus:outline-none cursor-pointer"
          >
            <option value="mapped" className="bg-slate-900 text-slate-100">Mapped (1,488 SPs)</option>
            <option value="exact" className="bg-slate-900 text-slate-100">Exact Timestamps (744 Hours)</option>
          </select>
        </div>

        {/* Cutoff Selector */}
        <div className="flex items-center space-x-2 bg-slate-950 border border-slate-800 rounded-md px-2.5 py-1">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-xs text-slate-400 font-mono hidden sm:inline">D-1 Cutoff:</span>
          <select
            value={cutoffTime}
            onChange={(e) => setCutoffTime(e.target.value)}
            className="bg-transparent text-xs text-cyan-300 font-mono font-bold focus:outline-none cursor-pointer"
          >
            <option value="09:00" className="bg-slate-900 text-slate-100">09:00 (Early)</option>
            <option value="10:00" className="bg-slate-900 text-slate-100">10:00 (Pre-Auction)</option>
            <option value="11:00" className="bg-slate-900 text-slate-100">11:00 (Default DA)</option>
            <option value="12:00" className="bg-slate-900 text-slate-100">12:00 (Gate Closure)</option>
            <option value="14:00" className="bg-slate-900 text-slate-100">14:00 (Post-Auction)</option>
            <option value="17:00" className="bg-slate-900 text-slate-100">17:00 (Late)</option>
          </select>
        </div>
      </div>
    </header>
  );
};
