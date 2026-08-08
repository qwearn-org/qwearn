'use client';

import React from 'react';
import Image from 'next/image';

interface ErrorBiteLogoProps {
  size?: number;
  className?: string;
}

export default function ErrorBiteLogo({ size = 18, className = '' }: ErrorBiteLogoProps) {
  return (
    <span
      className={`inline-flex items-center justify-center shrink-0 align-middle ${className}`}
      style={{ width: size, height: size, display: 'inline-flex', verticalAlign: 'middle' }}
    >
      <Image
        src="/errorbite-logo.png"
        alt="ErrorBite Logo"
        width={size}
        height={size}
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
    </span>
  );
}
