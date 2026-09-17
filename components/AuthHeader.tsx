'use client';

import React from 'react';
import Link from 'next/navigation';
import { APP_ROUTES } from '@/constants/routes';

interface AuthHeaderProps {
  showBackToLanding?: boolean;
  onBack?: () => void;
  title?: string;
  subtitle?: string;
}

export function AuthHeader({
  showBackToLanding = false,
  onBack,
  title,
  subtitle,
}: AuthHeaderProps) {
  return (
    <header className="w-full flex flex-col items-center py-6 px-4">
      <div className="w-full max-w-md flex items-center justify-between mb-4">
        <a
          href={APP_ROUTES.landing}
          className="inline-flex items-center gap-2 text-decoration-none group"
        >
          <div className="w-8 h-8 rounded-lg bg-[#2D6A4F] text-white flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 0 1 10 10c0 5.523-4.477 10-10 10S2 17.523 2 12A10 10 0 0 1 12 2z" />
              <path d="M12 6v12" />
              <path d="M8 10l4-4 4 4" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-lg leading-none text-slate-800 tracking-tight">
              agrimarket
            </span>
            <span className="text-[11px] text-slate-500 font-medium tracking-wide">
              philippines
            </span>
          </div>
        </a>

        {showBackToLanding && onBack && (
          <button
            type="button"
            onClick={onBack}
            className="text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer py-1 px-2.5 rounded-md hover:bg-slate-100"
          >
            ← Back
          </button>
        )}
      </div>

      {title && (
        <div className="w-full max-w-md text-left mt-2">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            {title}
          </h1>
          {subtitle && (
            <p className="text-sm text-slate-500 mt-1 leading-relaxed">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </header>
  );
}
