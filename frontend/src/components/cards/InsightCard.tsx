import React from 'react';
import type { AnalyticalInsight } from '../../types';
import { AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface InsightCardProps {
  insight: AnalyticalInsight;
}

export const InsightCard: React.FC<InsightCardProps> = ({ insight }) => {
  const isWarning = insight.severity === 'warning';
  const isSuccess = insight.severity === 'success';

  return (
    <div
      className={`rounded-lg border p-4 transition shadow-[0_1px_2px_rgba(0,0,0,0.02)] ${
        isWarning
          ? 'bg-[#FAF4EB]/60 border-[#C58B38]/30'
          : isSuccess
          ? 'bg-[#EAF1EB]/60 border-[#285C46]/30'
          : 'bg-white border-[#E2E5DE]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          {isWarning ? (
            <AlertTriangle className="w-4 h-4 text-[#C58B38] shrink-0" />
          ) : isSuccess ? (
            <CheckCircle className="w-4 h-4 text-[#285C46] shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-[#658A70] shrink-0" />
          )}
          <span className="text-[11px] font-mono uppercase font-semibold text-[#68736C]">
            {insight.category}
          </span>
        </div>
        {insight.value && (
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-[#F5F5F0] border border-[#E2E5DE] text-[#29332E]">
            {insight.value}
          </span>
        )}
      </div>
      <h4 className="text-sm font-semibold text-[#29332E] mb-1">{insight.title}</h4>
      <p className="text-xs text-[#68736C] leading-relaxed">{insight.description}</p>
    </div>
  );
};
