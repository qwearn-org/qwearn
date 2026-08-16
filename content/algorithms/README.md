# Quantum Algorithms Content

This directory contains structured content for the **Algorithms Module** (Phase 3).

## Directory Structure

```
content/algorithms/
├── 01-superdense-coding/    # Beginner — entanglement as resource
├── 02-teleportation/        # Beginner — quantum state transfer
├── 03-deutsch/              # Intermediate — first quantum speedup
├── 04-deutsch-jozsa/        # Intermediate — exponential query speedup
├── 05-bernstein-vazirani/   # Intermediate — hidden string problem
├── 06-grovers-search/       # Intermediate — amplitude amplification
└── README.md                # This file
```

Each algorithm directory contains three JSON files:

| File | Purpose |
|------|---------|
| `meta.json` | Algorithm metadata (id, title, difficulty, complexity, applications) |
| `content.json` | Content blocks rendered by `LessonRenderer` |
| `quiz.json` | Multiple-choice questions with explanations |

## Algorithm Meta Schema

```json
{
  "id": "superdense-coding",
  "title": "Superdense Coding",
  "subtitle": "Send 2 classical bits using 1 qubit",
  "order": 1,
  "difficulty": "beginner | intermediate | advanced",
  "prerequisites": ["h-gate", "cnot-gate"],
  "estimatedMinutes": 12,
  "objectives": ["..."],
  "complexity": {
    "classical": "2 bits needed",
    "quantum": "1 qubit + 1 shared ebit"
  },
  "applications": ["Quantum communication", "..."]
}
```

Key differences from lesson `meta.json`:
- **`difficulty`** instead of `gate` — algorithms have difficulty levels, not a single gate focus
- **`complexity`** — classical vs quantum resource comparison
- **`applications`** — real-world use cases

## New Content Block Types

### `step_circuit` — Step-Through Circuit Demo

The signature feature of the algorithms module. Renders an interactive player
that executes the circuit gate-by-gate, showing quantum state evolution at each step.

```json
{
  "type": "step_circuit",
  "numQubits": 2,
  "caption": "Watch the Bell state form gate by gate",
  "gates": [
    { "id": "s1", "gate": "H", "qubits": [0], "column": 0 },
    { "id": "s2", "gate": "CX", "qubits": [0, 1], "column": 1 }
  ],
  "stepDescriptions": [
    "Initial state: both qubits in |0⟩",
    "After H on q0: q0 is in superposition",
    "After CNOT: qubits are entangled — Bell state"
  ]
}
```

- `stepDescriptions` has length = gates.length + 1 (initial state + one per gate)
- The frontend calls `POST /api/circuits/step` to get intermediate statevectors
- Supports play/pause, step forward/backward, speed control

### `complexity` — Classical vs Quantum Comparison

```json
{
  "type": "complexity",
  "classical": "O(N)",
  "quantum": "O(√N)",
  "speedup": "Quadratic"
}
```

## Adding a New Algorithm

1. Create a directory: `content/algorithms/07-your-algorithm/`
2. Add `meta.json`, `content.json`, `quiz.json` following the schemas above
3. Add static imports in `apps/web/src/lib/algorithms.ts`
4. The algorithm will automatically appear in the index and sidebar

## Content Guidelines

- **Physics accuracy first** — use Nielsen & Chuang conventions
- **Step descriptions should be educational** — explain *why* each gate matters, not just what it does
- **Include at least one `step_circuit` block** — this is the module's differentiator
- **Quiz questions should test conceptual understanding**, not memorization
