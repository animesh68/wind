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
      className={`rounded-lg border p-4 transition ${
        isWarning
          ? 'bg-amber-950/20 border-amber-800/40'
          : isSuccess
          ? 'bg-emerald-950/20 border-emerald-800/40'
          : 'bg-slate-900/60 border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center space-x-2">
          {isWarning ? (
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          ) : isSuccess ? (
            <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          )}
          <span className="text-[11px] font-mono uppercase font-semibold text-slate-400">
            {insight.category}
          </span>
        </div>
        {insight.value && (
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-200">
            {insight.value}
          </span>
        )}
      </div>
      <h4 className="text-sm font-semibold text-slate-200 mb-1">{insight.title}</h4>
      <p className="text-xs text-slate-400 leading-relaxed">{insight.description}</p>
    </div>
  );
};
