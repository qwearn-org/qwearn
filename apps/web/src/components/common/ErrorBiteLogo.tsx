'use client';

import React from 'react';

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
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: '100%', display: 'block' }}
      >
        <path
          d="M 50 50 L 78.28 21.72 A 40 40 0 1 0 78.28 78.28 Z"
          fill="#FACC15"
          stroke="#EAB308"
          strokeWidth="1.5"
        />
      </svg>
    </span>
  );
}

