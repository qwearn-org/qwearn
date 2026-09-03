# content/challenges — Challenge Definitions

This directory holds challenge definitions for the Qwearn Challenges module.

## Structure

Each challenge lives in its own numbered directory:

```
content/challenges/
├── 01-bell-state/
│   ├── meta.json    # Display metadata (title, description, difficulty, hints)
│   └── spec.json    # Evaluation spec (evaluator type, target state, constraints)
├── 02-superposition/
│   ├── meta.json
│   └── spec.json
├── 03-ghz-state/
│   ├── meta.json
│   └── spec.json
├── 04-circuit-optimization/
│   ├── meta.json
│   └── spec.json
└── README.md
```

## Adding a New Challenge

1. Create a new numbered directory: `05-your-challenge/`
2. Add `meta.json` with display info (see existing examples)
3. Add `spec.json` with the evaluator configuration
4. Register the challenge in `apps/web/src/lib/challenges.ts`

## Evaluator Types

| Type | Purpose | Required Spec Fields |
|------|---------|---------------------|
| `statevector` | Match exact quantum state | `target_statevector` |
| `probability` | Match measurement probabilities | `target_probabilities` |
| `equivalence` | Match another circuit's output | `target_circuit` |

## Security Note

⚠️ The challenge evaluator takes **structured circuit specs** (JSON), not arbitrary code.
User input is never executed as code. All circuits are validated by Pydantic before execution.
