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
    <aside className="w-64 border-r border-[#E2E5DE] bg-[#ECEFE8] flex flex-col justify-between shrink-0 shadow-[1px_0_2px_rgba(0,0,0,0.01)]">
      <div className="p-4 space-y-6">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-[#89928A] font-semibold px-3 mb-2.5">
            Workstation Views
          </div>
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-start space-x-3 px-3 py-2.5 rounded-lg text-left transition-all relative ${
                    isActive
                      ? 'bg-[#EAF1EB] text-[#285C46] font-medium shadow-xs'
                      : 'text-[#68736C] hover:text-[#29332E] hover:bg-[#E2E5DE]/50'
                  }`}
                >
                  {/* Subtle left accent bar on active */}
                  {isActive && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-[#285C46] rounded-r" />
                  )}
                  <Icon className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? 'text-[#285C46]' : 'text-[#68736C]'}`} />
                  <div>
                    <div className="text-xs font-semibold leading-none">{item.label}</div>
                    <div className="text-[11px] text-[#89928A] mt-1 leading-tight">{item.desc}</div>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Primary Data Sources Card */}
        <div className="rounded-lg bg-white border border-[#E2E5DE] p-3 space-y-2 shadow-xs">
          <div className="text-[10px] font-mono text-[#89928A] uppercase font-semibold">
            Primary Data Sources
          </div>
          <div className="text-xs space-y-1.5 text-[#68736C] font-mono">
            <div className="flex items-center justify-between">
              <span>Actual:</span>
              <span className="text-[#29332E] font-semibold">FUELHH (WIND)</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Forecast:</span>
              <span className="text-[#29332E] font-semibold">WINDFOR</span>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-[#E7E9E3]">
              <span>Coverage:</span>
              <span className="text-[#285C46] font-semibold">100% Complete</span>
            </div>
          </div>
        </div>
      </div>

      {/* CSV Downloads in Footer */}
      <div className="p-4 border-t border-[#E2E5DE] bg-[#ECEFE8] space-y-2">
        <div className="text-[11px] font-mono text-[#89928A] uppercase font-semibold px-1">
          Data Exports
        </div>
        <a
          href={api.getExportEvaluationUrl(cutoffTime, matchingMode)}
          download
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md bg-white hover:bg-[#F5F5F0] text-xs font-medium text-[#29332E] border border-[#E2E5DE] hover:border-[#658A70] transition shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-[#285C46]" />
          <span>Evaluation Set (CSV)</span>
        </a>
        <a
          href={api.getExportDailyAccuracyUrl(cutoffTime, matchingMode)}
          download
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-md bg-white hover:bg-[#F5F5F0] text-xs font-medium text-[#29332E] border border-[#E2E5DE] hover:border-[#658A70] transition shadow-xs"
        >
          <Download className="w-3.5 h-3.5 text-[#285C46]" />
          <span>Daily Accuracy (CSV)</span>
        </a>
      </div>
    </aside>
  );
};
