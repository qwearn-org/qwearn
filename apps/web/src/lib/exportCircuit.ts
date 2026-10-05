export interface ExportGate {
  gate: string;
  qubits: number[];
  column: number;
}

const GATE_COLORS:Record<string, string>= {
  H:'#6366f1', X: '#ef4444', Y:'#f97316', Z: '#eab308',
  Phase: '#14b8a6', S: '#06b6d4', T:'#0ea5e9',
  CX:'#8b5cf6', CZ:'#a855f7',CCX: '#d946ef', SWAP: '#64748b',
};

const GATE_SYMBOLS: Record<string, string> = {
  H:'H', X: 'X', Y: 'Y', Z: 'Z', Phase: 'P', S: 'S', T: 'T',
  CX: '⊕', CZ: 'CZ', CCX: '⊕', SWAP: '⨉',
};

const LABEL_W=48;
const CELL = 56;
const GATE =40;
const ROW_H= 56;
export const DEFAULT_CIRCUIT_NAME = 'qwearn-circuit';

const PAD= 24;
const HEADER_H = 36;
const FOOTER_H = 28;
const BG= '#0a0a0f';
const WIRE = '#475569';
const FONT= 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function buildCircuitSvg(
  numQubits: number,
  gates: ExportGate[],
  title = '',
): { svg: string; width: number; height: number } {
  const cols = Math.max(1, ...gates.map((g) => g.column + 1));
  const width = Math.max(PAD * 2 + LABEL_W + cols * CELL + 64, 260);
  const bodyTop = PAD + HEADER_H;
  const height = bodyTop + numQubits * ROW_H + FOOTER_H + PAD;
  const wireY = (q: number) => bodyTop + q * ROW_H + ROW_H / 2;
  const colX = (c: number) => PAD + LABEL_W + c * CELL + CELL / 2;

  const parts: string[]= [];
  parts.push(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" font-family="${FONT}">`,
    `<rect width="100%" height="100%" fill="${BG}"/>`,
  );

  const maxChars = Math.floor((width - PAD * 2) / 9);
  const shown = (title.trim() || DEFAULT_CIRCUIT_NAME);
  const headerText = shown.length > maxChars ? shown.slice(0, maxChars - 1) + '…' : shown;
  parts.push(
    `<text x="${PAD}" y="${PAD + 18}" fill="#e2e8f0" font-size="16" font-weight="600">${esc(headerText)}</text>`,
  );

  for (let q = 0; q < numQubits; q++) {
    const y = wireY(q);
    parts.push(
      `<text x="${PAD + LABEL_W / 2}" y="${y + 5}" fill="#818cf8" font-size="14" font-weight="600" text-anchor="middle">q${q}</text>`,
      `<line x1="${PAD + LABEL_W}" y1="${y}" x2="${width - PAD - 32}" y2="${y}" stroke="${WIRE}" stroke-width="2"/>`,
      `<text x="${width - PAD}" y="${y + 4}" fill="#64748b" font-size="12" text-anchor="end">|0⟩</text>`,
    );
  }

  for (const g of gates) {
    const color = GATE_COLORS[g.gate] ?? '#64748b';
    const x = colX(g.column);
    const ys = g.qubits.map(wireY);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    const multi = g.qubits.length > 1;

    if (multi) {
      parts.push(
        `<line x1="${x}" y1="${top}" x2="${x}" y2="${bottom}" stroke="${color}" stroke-width="2"/>`,
      );
    }

    g.qubits.forEach((q, i) => {
      const y = wireY(q);
      if (i === 0) {
        const label = GATE_SYMBOLS[g.gate] ?? g.gate;
        const size = label.length > 2 ? 13 : 15;
        parts.push(
          `<rect x="${x - GATE / 2}" y="${y - GATE / 2}" width="${GATE}" height="${GATE}" rx="6" fill="${color}" fill-opacity="0.22" stroke="${color}" stroke-width="1.5"/>`,
          `<text x="${x}" y="${y + 5}" fill="${color}" font-size="${size}" font-weight="700" text-anchor="middle">${esc(label)}</text>`,
        );
      } else if (g.gate === 'CX' || g.gate === 'CCX') {
        parts.push(`<circle cx="${x}" cy="${y}" r="5" fill="${color}"/>`);
      } else {
        parts.push(
          `<circle cx="${x}" cy="${y}" r="5" fill="${BG}" stroke="${color}" stroke-width="2"/>`,
        );
      }
    });
  }

  const footY = height - PAD;
  const stats = `${numQubits} qubit${numQubits === 1 ? '' : 's'} · ${gates.length} gate${gates.length === 1 ? '' : 's'}`;
  parts.push(
    `<text x="${PAD}" y="${footY}" fill="#6366f1" font-size="12" font-weight="700" opacity="0.8">qwearn</text>`,
    `<text x="${width - PAD}" y="${footY}" fill="#64748b" font-size="12" text-anchor="end">${esc(stats)}</text>`,
  );

  parts.push('</svg>');
  return { svg: parts.join(''), width, height };
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function safeFilename(name: string, fallback = DEFAULT_CIRCUIT_NAME): string {
  const cleaned = name.trim().replace(/[^\w\- ]+/g, '').replace(/\s+/g, '-');
  return cleaned || fallback;
}

export function downloadCircuitSvg(
  numQubits: number,
  gates: ExportGate[],
  name: string,
) {
  const { svg } = buildCircuitSvg(numQubits, gates, name);
  triggerDownload(
    new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
    `${safeFilename(name)}.svg`,
  );
}

export async function downloadCircuitPng(
  numQubits: number,
  gates: ExportGate[],
  name: string,
  scale = 3,
) {
  const { svg, width, height } = buildCircuitSvg(numQubits, gates, name);
  const svgUrl = URL.createObjectURL(
    new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }),
  );
  try{
    const img = new Image();
    img.decoding = 'async';
    await new Promise<void>((resolve, reject) => {
      img.onload= () => resolve();
      img.onerror= () => reject(new Error('Failed to render circuit image'));
      img.src= svgUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx=canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not supported');
    ctx.scale(scale, scale);
    ctx.drawImage(img, 0, 0, width, height);
    const blob=await new Promise<Blob | null>((res) => canvas.toBlob(res, 'image/png'));
    if (!blob) throw new Error('PNG encoding failed');
    triggerDownload(blob, `${safeFilename(name)}.png`);
  } finally{
    URL.revokeObjectURL(svgUrl);
  }
}
