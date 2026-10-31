import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral' }) => {
  const styles = {
    neutral: 'bg-slate-800 text-slate-300 border-slate-700',
    success: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80',
    warning: 'bg-amber-950/80 text-amber-400 border-amber-800/80',
    danger: 'bg-rose-950/80 text-rose-400 border-rose-800/80',
    info: 'bg-cyan-950/80 text-cyan-400 border-cyan-800/80',
  };

  return (
    <span
      className={`inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${styles[variant]}`}
    >
      {label}
    </span>
  );
};
