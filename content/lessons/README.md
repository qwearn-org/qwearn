# content/lessons — Lesson Content

Interactive lesson content for the Qwearn Learn module. Each lesson is a directory containing structured JSON files that define the content, metadata, and assessment.

## Lesson Directory Structure

```
content/lessons/
├── 01-x-gate/
│   ├── meta.json          # Lesson metadata (title, prerequisites, etc.)
│   ├── content.json       # Ordered list of content blocks
│   └── quiz.json          # Assessment questions
├── 02-z-gate/
├── 03-h-gate/
├── 04-y-gate/
├── 05-phase-gate/
├── 06-cnot-gate/
└── 07-toffoli-gate/
```

## Content Schema

### meta.json

| Field | Type | Description |
|---|---|---|
| `id` | string | URL-friendly lesson identifier (e.g., `"x-gate"`) |
| `title` | string | Full lesson title |
| `subtitle` | string | Short descriptor shown on cards |
| `order` | number | Sort order for lesson index |
| `gate` | string | Gate name (matches `GateSpec` gate field) |
| `prerequisites` | string[] | IDs of lessons that should be completed first |
| `estimatedMinutes` | number | Expected completion time |
| `objectives` | string[] | Learning objectives shown at lesson start |

### content.json

An object with a single `blocks` array. Each block has a `type` field that determines rendering:

| Block Type | Fields | Description |
|---|---|---|
| `text` | `body: string` | Paragraph text. Supports `**bold**`, `*italic*`, `` `code` `` |
| `heading` | `text: string, level: 2\|3` | Section heading (h2 or h3) |
| `math` | `latex: string, display: boolean` | KaTeX math. `display: true` for centered block math |
| `callout` | `variant: "info"\|"warning"\|"tip", body: string` | Highlighted info box |
| `matrix` | `label: string, rows: string[][]` | Gate matrix with bracket notation (cells can be LaTeX) |
| `circuit` | See below | Embedded circuit demo |
| `bloch` | `description: string, state: "zero"\|"one"\|"plus"\|"minus"\|"custom"` | Static Bloch sphere |
| `divider` | *(none)* | Horizontal rule separator |

#### Circuit Block

```json
{
  "type": "circuit",
  "numQubits": 2,
  "caption": "H→CNOT creates a Bell state",
  "readonly": true,
  "autoRun": true,
  "preset": [
    { "id": "demo-1", "gate": "H", "qubits": [0], "column": 0 },
    { "id": "demo-2", "gate": "CX", "qubits": [0, 1], "column": 1 }
  ]
}
```

- `readonly: true` — User cannot modify the circuit (for scripted demos)
- `autoRun: true` — Circuit executes on mount (shows results immediately)
- `preset` — Array of `PlacedGate` objects (same format as CircuitGrid)

### quiz.json

```json
{
  "questions": [
    {
      "id": "unique-id",
      "type": "multiple_choice",
      "question": "What does X|0⟩ equal?",
      "options": ["|0⟩", "|1⟩", "|+⟩", "|-⟩"],
      "correctIndex": 1,
      "explanation": "The X gate flips |0⟩ to |1⟩."
    }
  ]
}
```

## Adding a New Lesson

1. Create a new directory under `content/lessons/` (e.g., `08-swap-gate/`)
2. Create `meta.json`, `content.json`, and `quiz.json` following the schemas above
3. Add imports to `apps/web/src/lib/lessons.ts`:
   ```ts
   import meta08 from '../../../../content/lessons/08-swap-gate/meta.json';
   import content08 from '../../../../content/lessons/08-swap-gate/content.json';
   import quiz08 from '../../../../content/lessons/08-swap-gate/quiz.json';
   ```
4. Add the lesson to the `ALL_LESSONS` array in the same file
5. Run `pnpm build` in `apps/web` to verify the lesson compiles

## Available Gates for Circuit Blocks

| Gate | Qubits | Description |
|---|---|---|
| `X` | 1 | Pauli-X (bit flip) |
| `Y` | 1 | Pauli-Y |
| `Z` | 1 | Pauli-Z (phase flip) |
| `H` | 1 | Hadamard (superposition) |
| `S` | 1 | S gate (P(π/2)) |
| `T` | 1 | T gate (P(π/4)) |
| `Phase` | 1 | Phase gate P(θ) |
| `CX` | 2 | CNOT (control, target) |
| `CZ` | 2 | Controlled-Z |
| `CCX` | 3 | Toffoli (control, control, target) |
| `SWAP` | 2 | Swap gate |

## TypeScript Types

See `apps/web/src/lib/lesson-types.ts` for the full TypeScript interface definitions.
