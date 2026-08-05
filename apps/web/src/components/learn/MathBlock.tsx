'use client';

/**
 * MathBlock — Renders LaTeX math using KaTeX.
 * Supports both inline and display (block) mode.
 */

import React, { useRef, useEffect } from 'react';
import katex from 'katex';
import 'katex/dist/katex.min.css';

interface MathBlockProps {
  latex: string;
  display?: boolean;
}

export default function MathBlock({ latex, display = false }: MathBlockProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (ref.current) {
      try {
        katex.render(latex, ref.current, {
          displayMode: display,
          throwOnError: false,
          trust: true,
        });
      } catch {
        if (ref.current) {
          ref.current.textContent = latex;
        }
      }
    }
  }, [latex, display]);

  return display ? (
    <div className="math-display">
      <span ref={ref} />
    </div>
  ) : (
    <span ref={ref} className="math-inline" />
  );
}
