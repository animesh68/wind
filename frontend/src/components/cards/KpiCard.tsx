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
    neutral: 'bg-[#F5F5F0] text-[#68736C] border-[#E2E5DE]',
    success: 'bg-[#EAF1EB] text-[#285C46] border-[#285C46]/25',
    warning: 'bg-[#FAF4EB] text-[#C58B38] border-[#C58B38]/25',
    info: 'bg-[#F0F5F2] text-[#285C46] border-[#658A70]/25',
  };

  return (
    <div
      className={`rounded-xl border p-4 bg-white transition-all shadow-[0_1px_3px_rgba(0,0,0,0.02)] ${
        highlight
          ? 'border-[#658A70]/60 ring-1 ring-[#658A70]/20'
          : 'border-[#E2E5DE] hover:border-[#658A70]/40'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-mono font-medium text-[#68736C] uppercase tracking-wider">
          {title}
        </span>
        {badge && (
          <span
            className={`text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${
              badgeClasses[badge.variant]
            }`}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex items-baseline space-x-1.5">
        <span className="text-2xl font-bold font-mono tracking-tight text-[#29332E] tabular-nums">
          {value}
        </span>
        {unit && (
          <span className="text-xs font-mono font-medium text-[#89928A]">
            {unit}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-[#68736C] leading-normal">
          {subtitle}
        </p>
      )}
    </div>
  );
};
