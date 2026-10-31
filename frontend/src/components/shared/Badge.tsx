import React from 'react';

interface BadgeProps {
  label: string;
  variant?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
}

export const Badge: React.FC<BadgeProps> = ({ label, variant = 'neutral' }) => {
  const styles = {
    neutral: 'bg-[#F5F5F0] text-[#68736C] border-[#E2E5DE]',
    success: 'bg-[#EAF1EB] text-[#285C46] border-[#285C46]/25',
    warning: 'bg-[#FAF4EB] text-[#C58B38] border-[#C58B38]/25',
    danger: 'bg-[#FDF2F2] text-[#B95D55] border-[#B95D55]/25',
    info: 'bg-[#F0F5F2] text-[#285C46] border-[#658A70]/25',
  };

  return (
    <span
      className={`inline-flex items-center text-[10px] font-mono font-semibold px-2 py-0.5 rounded border ${styles[variant]}`}
    >
      {label}
    </span>
  );
};
