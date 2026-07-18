# packages/ui — Shared React Component Library

Shared React components used across the Qwearn frontend. This package provides reusable UI primitives that maintain visual consistency.

## Scope

This package will contain:
- **Gate icons** — SVG components for each quantum gate (X, Y, Z, H, etc.)
- **Circuit primitives** — Wire renderers, qubit labels, measurement icons
- **Design tokens** — Shared color palette, spacing, typography (consumed via Tailwind)

## Status

🚧 **Phase 0 stub** — This package is scaffolded but empty. Components will be added in Phase 1 (Circuit Playground) as the circuit builder UI is developed.

## Usage (Phase 1+)

```tsx
import { GateIcon, CircuitWire } from '@qwearn/ui';

<GateIcon gate="H" size={32} />
<CircuitWire qubitIndex={0} />
```

## Development

```bash
# From repo root
pnpm install
cd packages/ui
pnpm typecheck
pnpm build
```
