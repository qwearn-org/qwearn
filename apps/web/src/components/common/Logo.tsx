'use client';

import React from 'react';
import Image from 'next/image';

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function Logo({ size = 28, showText = true, className = '' }: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 font-bold tracking-tight text-white select-none ${className}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
      <div style={{ width: size, height: size, position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Image
          src="/logo.svg"
          alt="Qwearn Logo"
          width={size}
          height={size}
          priority
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
        />
      </div>
      {showText && (
        <span className="bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent font-extrabold" style={{ fontSize: `${Math.max(16, size * 0.75)}px`, fontWeight: 800 }}>
          Qwearn
        </span>
      )}
    </div>
  );
}
