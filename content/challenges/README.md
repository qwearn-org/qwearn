# content/challenges — Challenge Definitions

This directory holds challenge definitions and evaluator specifications.

## Status

🚧 **Phase 4** — Challenge content will be authored here when the Challenge module is built.

## Planned Launch Challenges

1. **Bell State** — Build a circuit that produces the Bell state |Φ+⟩
2. **Teleportation** — Implement quantum teleportation protocol
3. **Custom Oracle Design** — Build an oracle for a given function
4. **Circuit Optimization** — Minimize gate count while preserving equivalence

## Security Note

⚠️ The challenge evaluator takes **structured circuit specs** (JSON), not arbitrary code. User input is never executed as code. See the relevant ADR (Phase 4) for the full security design.

See `IMPLEMENTATION_PLAN.md` Phase 4 for details.
