import React from 'react';

interface KpiCardProps {
  title: string;
  value: string | number;
  unit?: string;
  subtitle?: string;
  badge?: {
    label: string;
    variant: 'neutral' | 'success' | 'warning' | 'info';
  };
  highlight?: boolean;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  unit,
  subtitle,
  badge,
  highlight = false,
}) => {
  const badgeClasses = {
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-950/70 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/70 text-amber-400 border-amber-800/60',
    info: 'bg-cyan-950/70 text-cyan-400 border-cyan-800/60',
  };

  return (
    <div
      className={`rounded-xl border p-4 bg-slate-900/80 backdrop-blur transition-all ${
        highlight
          ? 'border-cyan-500/40 bg-gradient-to-b from-slate-900 to-cyan-950/20 shadow-lg shadow-cyan-950/20'
          : 'border-slate-800 hover:border-slate-700'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono font-medium text-slate-400 uppercase tracking-wider">
          {title}
        </span>
        {badge && (
          <span
            className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded border ${
              badgeClasses[badge.variant]
            }`}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className="text-2xl font-bold font-mono tracking-tight text-slate-100">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono font-medium text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 leading-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};

