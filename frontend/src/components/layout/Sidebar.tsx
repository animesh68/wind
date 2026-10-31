import React from 'react';
import {
  LayoutDashboard,
  Search,
  LineChart,
  GitBranch,
  ShieldCheck,
  Download
} from 'lucide-react';
import { api } from '../../services/api';

export type TabType = 'overview' | 'forecast-explorer' | 'accuracy-analytics' | 'forecast-evolution' | 'data-quality';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  cutoffTime: string;
  matchingMode: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  cutoffTime,
  matchingMode,
}) => {
  const navItems = [
    { id: 'overview' as TabType, label: 'Market Overview', icon: LayoutDashboard, desc: 'National Wind Outlook & Performance' },
    { id: 'forecast-explorer' as TabType, label: 'Forecast Explorer', icon: Search, desc: 'SP Intraday Forecasts & Versions' },
    { id: 'accuracy-analytics' as TabType, label: 'Accuracy Analytics', icon: LineChart, desc: 'MAE, RMSE, WAPE & Error Metrics' },
    { id: 'forecast-evolution' as TabType, label: 'Forecast Evolution', icon: GitBranch, desc: 'Revision History & Lead Time' },
    { id: 'data-quality' as TabType, label: 'Data Quality & Audit', icon: ShieldCheck, desc: 'Elexon Ingestion & Schema Health' },
  ];

  return (
    <aside className="w-64 border-r border-slate-800 bg-slate-900/60 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold px-3 mb-2">
            Workstation Views
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-start space-x-3 px-3 py-2.5 rounded-lg text-left transition-all ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <div>
                    <div className="text-sm font-medium leading-none">{item.label}</div>
                    <div className="text-[11px] text-slate-500 mt-1 leading-tight">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Data Provenance Box */}
        <div className="rounded-lg bg-slate-950/80 border border-slate-800 p-3 space-y-2">
          <div className="text-[10px] font-mono text-slate-500 uppercase font-semibold">
            Primary Data Sources
          </div>
          <div className="text-xs space-y-1.5 text-slate-400 font-mono">
            <div className="flex items-center justify-between">
              <span>Actual:</span>
              <span className="text-slate-300 font-semibold">FUELHH (WIND)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Forecast:</span>
              <span className="text-slate-300 font-semibold">WINDFOR</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Coverage:</span>
              <span className="text-emerald-400 font-semibold">100% Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Downloads in Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 space-y-2">
        <div className="text-[11px] font-mono text-slate-500 uppercase font-semibold">
          Data Exports
        </div>
        <a
          href={api.getExportEvaluationUrl(cutoffTime, matchingMode)}
          download
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Evaluation Set (CSV)</span>
        </a>
        <a
          href={api.getExportDailyAccuracyUrl(cutoffTime, matchingMode)}
          download
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition"
        >
          <Download className="w-3.5 h-3.5 text-cyan-400" />
          <span>Daily Accuracy (CSV)</span>
        </a>
      </div>
    </aside>
  );
};
