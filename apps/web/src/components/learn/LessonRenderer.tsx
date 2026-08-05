'use client';

/**
 * LessonRenderer — Maps content blocks to React components.
 *
 * This is the core component that takes the lesson's content.json
 * blocks array and renders each block using the appropriate component.
 */

import React from 'react';
import type { ContentBlock } from '@web/lib/lesson-types';
import MathBlock from './MathBlock';
import MatrixDisplay from './MatrixDisplay';
import CircuitDemo from './CircuitDemo';
import BlochDemo from './BlochDemo';

interface LessonRendererProps {
  blocks: ContentBlock[];
}

/** Format text with basic markdown-lite: **bold**, *italic*, `code` */
function formatText(text: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  // Split on **bold**, *italic*, and `code` patterns
  const regex = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    // Add text before the match
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    if (match[2]) {
      parts.push(<strong key={match.index}>{match[2]}</strong>);
    } else if (match[3]) {
      parts.push(<em key={match.index}>{match[3]}</em>);
    } else if (match[4]) {
      parts.push(<code key={match.index} className="inline-code">{match[4]}</code>);
    }
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts.length > 0 ? parts : [text];
}

export default function LessonRenderer({ blocks }: LessonRendererProps) {
  return (
    <div className="lesson-content">
      {blocks.map((block, i) => {
        switch (block.type) {
          case 'text':
            return <p key={i} className="lesson-text">{formatText(block.body)}</p>;

          case 'heading':
            return block.level === 2
              ? <h2 key={i} className="lesson-h2">{block.text}</h2>
              : <h3 key={i} className="lesson-h3">{block.text}</h3>;

          case 'math':
            return <MathBlock key={i} latex={block.latex} display={block.display} />;

          case 'callout':
            return (
              <div key={i} className={`lesson-callout lesson-callout-${block.variant}`}>
                <span className="callout-icon">
                  {block.variant === 'info' ? 'ℹ️' : block.variant === 'warning' ? '⚠️' : '💡'}
                </span>
                <div className="callout-body">{formatText(block.body)}</div>
              </div>
            );

          case 'matrix':
            return <MatrixDisplay key={i} label={block.label} rows={block.rows} />;

          case 'circuit':
            return (
              <CircuitDemo
                key={i}
                numQubits={block.numQubits}
                preset={block.preset}
                caption={block.caption}
                readonly={block.readonly}
                autoRun={block.autoRun}
              />
            );

          case 'bloch':
            return (
              <BlochDemo
                key={i}
                description={block.description}
                state={block.state}
                customCoords={block.customCoords}
              />
            );

          case 'divider':
            return <hr key={i} className="lesson-divider" />;

          default:
            return null;
        }
      })}
    </div>
  );
}
