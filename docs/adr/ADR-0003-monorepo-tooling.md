# ADR-0003: Monorepo Tooling — Turborepo + pnpm Workspaces

**Status:** Accepted  
**Date:** 2026-07-17  
**Decision Makers:** Aman Raza  

## Context

Qwearn is a monorepo with 4 packages:
- `apps/web` — Next.js frontend
- `apps/api` — FastAPI backend (Python, managed outside pnpm)
- `packages/ui` — Shared React component library
- `packages/quantum-core` — Python quantum execution engine (managed outside pnpm)

We need tooling to orchestrate builds, linting, and testing across JS/TS packages.

Three options were evaluated:

| Criteria | Nx | Turborepo | Plain pnpm workspaces |
|---|---|---|---|
| Task caching | ✅ Advanced | ✅ Simple | ❌ |
| Remote cache (CI) | ✅ | ✅ | ❌ |
| Configuration complexity | High (plugins, generators) | Low (single turbo.json) | None |
| Learning curve | Steep | Minimal | None |
| Ejection difficulty | Hard | Easy | N/A |

## Decision

**Turborepo** with **pnpm workspaces** as the underlying package manager.

## Rationale

- **Right-sized:** For a 4-package monorepo, Nx's plugin system and dependency graph analysis are overkill. Turborepo's single `turbo.json` is sufficient.
- **Zero lock-in:** Turborepo uses `package.json` scripts as the source of truth. If we ever want to eject, we just remove `turbo.json` and run pnpm commands directly.
- **CI performance:** Local and remote task caching means unchanged packages skip build/lint/test, significantly speeding up CI.
- **Vercel alignment:** Turborepo is maintained by Vercel (same team as Next.js), ensuring seamless integration.

## Consequences

- Python packages (`apps/api`, `packages/quantum-core`) are not managed by pnpm/Turborepo. Their build/test/lint is orchestrated separately (via Makefile or CI scripts).
- If the monorepo grows significantly (10+ packages), Nx might become worth the complexity. Re-evaluate at that point.

## Configuration

```
pnpm-workspace.yaml — defines workspace packages
turbo.json — defines task pipeline (build → lint → typecheck → test)
```

The `dev` task is marked `persistent: true` (long-running dev servers).
Build tasks have `dependsOn: ["^build"]` for correct dependency ordering.
