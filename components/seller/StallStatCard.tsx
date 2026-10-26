'use client';

import type { ReactNode } from 'react';

export interface StallStatCardProps {
  label: string;
  value: ReactNode;
  note?: ReactNode;
  tone?: 'default' | 'sage' | 'warning' | 'error';
  icon?: ReactNode;
}

const toneClasses = {
  default: 'bg-white text-stone-900',
  sage: 'bg-[var(--color-sage-soft)] text-[#1f4a38]',
  warning: 'bg-amber-50 text-amber-900',
  error: 'bg-red-50 text-red-900',
} as const;

export function StallStatCard({ label, value, note, tone = 'default', icon }: StallStatCardProps) {
  return (
    <div className={`${toneClasses[tone]} min-w-0 rounded-2xl p-5 shadow-sm`}>
      <div className="flex items-start justify-between gap-3">
        <p className="whitespace-nowrap text-[11px] font-medium uppercase tracking-[0.12em] text-stone-500">{label}</p>
        {icon ? <span className="shrink-0 text-stone-400">{icon}</span> : null}
      </div>
      <div className="mt-3 whitespace-nowrap text-2xl font-semibold tracking-tight tabular-nums sm:text-[28px]">{value}</div>
      {note ? <div className="mt-2 text-xs leading-5 text-stone-500">{note}</div> : null}
    </div>
  );
}
