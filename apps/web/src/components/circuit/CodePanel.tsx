'use client';

/**
 * CodePanel — Read-only display of generated Qiskit code.
 *
 * Shows the Python code that would reproduce the user's circuit.
 * This is a key learning feature: users see real code, not pseudocode.
 * Includes a copy-to-clipboard button.
 */

import React, { useState } from 'react';

interface CodePanelProps {
  code: string;
}

export default function CodePanel({ code }: CodePanelProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-panel">
      <div className="code-header">
        <h3>Generated Qiskit Code</h3>
        <button
          className="copy-button"
          onClick={handleCopy}
          title="Copy to clipboard"
        >
          {copied ? '✓ Copied' : '📋 Copy'}
        </button>
      </div>
      <pre className="code-content">
        <code>{code || '# Add gates to generate code'}</code>
      </pre>
    </div>
  );
}
