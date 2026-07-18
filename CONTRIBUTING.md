# Contributing to Qwearn

Thank you for your interest in contributing to Qwearn! This document explains how to get set up, our conventions, and the PR process.

---

## Table of Contents

1. [Development Setup](#development-setup)
2. [Project Structure](#project-structure)
3. [Code Style & Conventions](#code-style--conventions)
4. [Testing](#testing)
5. [Adding Content](#adding-content)
6. [Pull Request Process](#pull-request-process)
7. [Architecture Decision Records](#architecture-decision-records)

---

## Development Setup

### Prerequisites

| Tool | Version | Why |
|---|---|---|
| Node.js | 18+ | Next.js frontend |
| pnpm | 9+ | Package manager (monorepo workspaces) |
| Python | 3.11+ | FastAPI backend + quantum-core |
| Docker | 20+ | Local services (MongoDB, full stack) |
| docker-compose | 1.29+ | Multi-service orchestration |

### Option 1: Docker (Full Stack)

The simplest way to get everything running:

```bash
git clone https://github.com/your-username/qwearn.git
cd qwearn
docker-compose up --build
```

This starts:
- **Frontend:** http://localhost:3000 (Next.js)
- **Backend:** http://localhost:8000 (FastAPI)
- **API Docs:** http://localhost:8000/docs (OpenAPI/Swagger)
- **MongoDB:** mongodb://localhost:27017

Source code is volume-mounted, so changes hot-reload automatically.

### Option 2: Local Development

For a faster feedback loop on individual services:

#### Frontend (Next.js)

```bash
# From repo root
pnpm install          # Install all workspace dependencies
pnpm dev              # Starts Next.js dev server via Turborepo
```

#### Backend (FastAPI)

```bash
cd apps/api
python3 -m venv .venv
source .venv/bin/activate      # On Windows: .venv\Scripts\activate
pip install -e ".[dev]"        # Install with dev dependencies
pip install -e ../../packages/quantum-core  # Install quantum-core locally

# Start MongoDB (pick one)
docker run -d -p 27017:27017 --name qwearn-mongo mongo:7
# OR use a local MongoDB installation

# Start the API server
uvicorn app.main:app --reload --port 8000
```

#### Quantum Core (development)

```bash
cd packages/quantum-core
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
pytest  # Run tests
```

### Environment Variables

Create a `.env` file in the repo root (it's gitignored):

```bash
# Backend
MONGODB_URL=mongodb://localhost:27017
MONGODB_DB=qwearn
CORS_ORIGINS=http://localhost:3000

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Project Structure

```
qwearn/
├── apps/web/          → Next.js frontend (TypeScript, Tailwind, App Router)
├── apps/api/          → FastAPI backend (Python 3.11+, Beanie ODM)
├── packages/quantum-core/ → Quantum execution engine (QuantumBackend interface)
├── packages/ui/       → Shared React components (gate icons, circuit primitives)
├── content/           → Lesson, algorithm, and challenge content (Markdown + JSON)
├── docs/              → Architecture docs, ADRs, API reference
└── infra/             → Docker, K8s, CI configs
```

Each folder has its own `README.md`. Start with the one closest to what you want to work on.

---

## Code Style & Conventions

### TypeScript (Frontend)

- **Strict mode** — no `any` without a justification comment
- **ESLint** — run `pnpm lint` to check
- **Prettier** — run `pnpm format` to auto-format
- **Imports** — use the `@web/*` alias for local imports in `apps/web`

### Python (Backend + quantum-core)

- **Ruff** — linter and formatter (config in `pyproject.toml`)
- **mypy** — strict type checking
- **Pydantic v2** — all API models and DB documents
- **Async** — use `async/await` for all database and I/O operations

### Quantum Content Conventions

- Gate names follow **Nielsen & Chuang** textbook notation
- Qubit indices are **0-based**
- Statevectors use **least-significant-bit = qubit 0** (Qiskit convention)
- When in doubt about quantum math, cite your source in a comment

### Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat(circuit): add Phase gate to circuit builder
fix(api): handle empty circuit spec in /execute
docs(adr): add ADR-0006 for challenge evaluator security
test(quantum-core): add Bell state statevector verification
```

---

## Testing

### Frontend

```bash
pnpm test              # Run all frontend tests via Turborepo
```

### Backend

```bash
cd apps/api
pytest                 # All API tests
pytest -x              # Stop on first failure
pytest -k test_health  # Run specific test
```

### Quantum Core

```bash
cd packages/quantum-core
pytest                 # All quantum-core tests
```

### CI

Every PR runs: lint → typecheck → test → build. All four must pass before merge.

---

## Adding Content

### New Lesson

Lessons live in `content/lessons/`. Each lesson is a directory with:
- `meta.json` — metadata (title, order, prerequisites, gate covered)
- `content.mdx` — explanation text with KaTeX math
- `quiz.json` — quiz questions

See `content/lessons/README.md` for the full schema and a worked example.

### New Algorithm

Same pattern as lessons, in `content/algorithms/`. See `content/algorithms/README.md`.

### New Challenge

Challenges live in `content/challenges/`. See `content/challenges/README.md` for how to define a challenge spec and evaluator.

---

## Pull Request Process

1. **Fork** the repo and create a feature branch from `main`
2. **Make your changes** following the conventions above
3. **Write/update tests** — PRs without tests for new logic will be asked to add them
4. **Update docs** — if you changed behavior, update the relevant README or ADR
5. **Run CI locally**: `pnpm lint && pnpm typecheck && pnpm test && pnpm build`
6. **Open a PR** using the PR template — fill in all sections

### PR Checklist (from template)

- [ ] Tests pass locally
- [ ] Linting passes
- [ ] Documentation updated (if applicable)
- [ ] No `any` types without justification
- [ ] Quantum math verified against textbook reference (if applicable)

---

## Architecture Decision Records

Non-trivial decisions are recorded in `docs/adr/`. If your PR introduces a design decision that future contributors need to understand, write an ADR:

```
docs/adr/ADR-NNNN-short-title.md
```

Use the existing ADRs as a template. The key sections are: **Context**, **Decision**, **Rationale**, and **Consequences**.

---

## Questions?

Open an issue with the "question" label, or start a discussion in GitHub Discussions.
