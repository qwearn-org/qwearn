# apps/web — Next.js Frontend

The Qwearn frontend application, built with Next.js 14+ (App Router), React, TypeScript, and Tailwind CSS.

## Scope

This package is responsible for:
- **Circuit Playground UI** — Drag-and-drop circuit builder using React Flow
- **Learn Module** — Interactive lesson pages with MDX content, KaTeX math, and embedded circuit animations
- **Algorithm Explorer** — Step-through algorithm visualizations
- **Challenge Interface** — Circuit-building challenges with automatic evaluation
- **User Auth & Progress** — Auth.js integration, progress dashboards

## Architecture

```mermaid
graph TD
    A[App Router Pages] --> B[React Components]
    B --> C[@qwearn/ui Shared Components]
    B --> D[React Flow Circuit Canvas]
    A --> E[Auth.js / NextAuth]
    A --> F[API Client → FastAPI Backend]
```

## Local Development

```bash
# From repo root
pnpm install
pnpm dev    # Starts on http://localhost:3000

# Or directly
cd apps/web
pnpm dev
```

## Key Directories

```
src/
├── app/              # Next.js App Router pages and layouts
├── components/       # React components (to be created in Phase 1)
├── lib/              # Utility functions, API client
└── styles/           # Global styles and Tailwind config
```

## Environment Variables

| Variable | Description | Default |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | FastAPI backend URL | `http://localhost:8000` |

## Tech Decisions

- **App Router** over Pages Router — for server components, streaming, and better data fetching patterns
- **Tailwind CSS** — design tokens will live in `packages/ui` and be consumed here
- **React Flow** — custom node types for each quantum gate (Phase 1)
- **Auth.js** — see [ADR-0002](../../docs/adr/ADR-0002-auth-provider.md)
