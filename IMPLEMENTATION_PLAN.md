# Qwearn — Implementation Plan

**Status:** Draft v1
**Owner:** Aman Raza
**Purpose:** Source-of-truth planning document for building Qwearn, an open-source, interactive quantum computing learning platform. This file is meant to be read by both humans and AI coding agents (Claude Code / Antigravity) before any code is written.

---

## 1. Vision

Qwearn is not a Qiskit wrapper. It is a guided, interactive platform where a learner goes from "what is a qubit" to "I built and understood Grover's algorithm" through explanation + math + animation + live code + quiz + practice, in that order, every time. The differentiator is the **Circuit Playground**: a drag-and-drop circuit builder that generates real Qiskit code and runs it on a real simulator, so nothing in the learning experience is fake or pre-baked.

The project is open source from day one. Documentation is treated as a first-class deliverable, not an afterthought — every module, API route, and non-trivial function should be explained thoroughly enough that a contributor with no prior context can understand *why*, not just *what*.

---

## 2. Guiding Principles (for whoever/whatever builds this)

1. **Correctness of physics/math first.** Quantum content must be technically accurate. When unsure, prefer the standard textbook treatment (Nielsen & Chuang conventions) and cite it in docs.
2. **Documentation-as-you-go.** Every module ships with its own `README.md` explaining architecture decisions, not just usage. No "add docs later."
3. **Vertical slices over horizontal layers.** Build one gate lesson end-to-end (backend + frontend + docs + tests) before building all 7 gate lessons' backends. This proves the pattern works before scaling it.
4. **Plugin-shaped from the start**, even though only Qiskit ships initially. The quantum execution layer must sit behind an internal interface (`QuantumBackend`) so Cirq/PennyLane can be added later without touching the API layer.
5. **No dead-end features.** Every module in this plan must be at minimum a working vertical slice by the end of its phase — no permanently-stubbed UI.

---

## 3. Monorepo Structure

```
qwearn/
├── apps/
│   ├── web/                 # Next.js frontend
│   └── api/                 # FastAPI backend
├── packages/
│   ├── quantum-core/        # Python: Qiskit abstraction layer, lesson content engine
│   └── ui/                  # Shared React component library (gate icons, circuit primitives)
├── content/
│   ├── lessons/             # Structured lesson content (Markdown + JSON metadata)
│   ├── algorithms/          # Algorithm module content
│   └── challenges/          # Challenge definitions + evaluator specs
├── docs/
│   ├── architecture/
│   ├── contributing/
│   ├── api-reference/
│   └── adr/                 # Architecture Decision Records
├── infra/
│   ├── docker/
│   ├── k8s/
│   └── github-actions/
├── scripts/
├── .github/
├── README.md
├── CONTRIBUTING.md
├── CODE_OF_CONDUCT.md
├── LICENSE (MIT or Apache-2.0 — decide in Phase 0)
└── docker-compose.yml
```

---

## 4. Tech Stack (confirmed)

| Layer | Choice | Notes |
|---|---|---|
| Frontend framework | Next.js 14+ (App Router), React, TypeScript | Strict TS, no `any` without justification comment |
| Styling | Tailwind CSS | Design tokens in `packages/ui` |
| Circuit visual builder | React Flow | Custom node types per gate |
| 3D Bloch sphere | Three.js (via `@react-three/fiber`) | Phase 2+, not blocking MVP |
| Backend | FastAPI (Python 3.11+) | Async endpoints, Pydantic v2 models |
| Quantum layer | Qiskit + Qiskit Aer | Wrapped behind `QuantumBackend` interface |
| Database | MongoDB | User progress, challenge submissions, auth-linked profiles |
| Auth | Clerk (default) or Auth.js — **decide in Phase 0** | Needed for progress tracking, challenge history |
| Containerization | Docker, docker-compose (local), Kubernetes (prod) | |
| CI/CD | GitHub Actions | Lint, typecheck, test, build, (later) deploy |
| Hosting | VPS initially → K8s cluster later | |

---

## 5. Data Model (high-level, MongoDB collections)

- `users` — auth-linked profile, progress summary
- `lesson_progress` — per-user, per-lesson completion + quiz scores
- `circuit_saves` — user-saved playground circuits (gates, code, results snapshot)
- `challenge_submissions` — submitted circuit + evaluator result + timestamp
- `content_cache` — optional cache of research hub aggregation results (refreshed on schedule)

Exact schemas to be finalized in Phase 1 as an ADR (`docs/adr/0002-data-model.md`).

---

## 6. Module Breakdown & Build Order

Build order is intentionally **not** the same as the module numbering in the product spec — it's ordered to de-risk the hardest architectural problem (the Circuit Playground execution pipeline) early, since every other module depends on it.

### Phase 0 — Foundations (no user-facing features)
- Repo scaffolding per section 3
- Next.js app boots, FastAPI app boots, docker-compose brings both up + Mongo
- CI pipeline: lint + typecheck + basic build on every PR
- `QuantumBackend` interface defined in `quantum-core` (abstract class, Qiskit implementation only for now)
- ADRs: license choice, auth choice, monorepo tool choice (Turborepo/Nx vs plain workspaces)
- `CONTRIBUTING.md` with local dev setup instructions that a stranger can follow start to finish

### Phase 1 — Circuit Playground (Module 2) — build this first
Why first: this is the riskiest, most novel piece, and Modules 1 and 3 both embed mini versions of it.
- Backend: `/api/circuits/execute` — accepts a circuit spec (list of gates + qubit indices), builds a Qiskit `QuantumCircuit`, runs on Aer simulator, returns statevector, probabilities, and generated Qiskit source code as a string
- Backend: `/api/circuits/bloch` — returns Bloch sphere coordinates per qubit for a given statevector
- Frontend: React Flow canvas with a gate palette (X, Y, Z, H, Phase, CNOT, Toffoli to start)
- Frontend: live-updating generated Qiskit code panel (read-only, syntax highlighted)
- Frontend: results panel — probability bar chart, statevector display, Bloch sphere (2D fallback first, Three.js upgrade in Phase 5)
- Persistence: save/load circuits to `circuit_saves` (requires basic auth wired up)
- Docs: `docs/architecture/circuit-execution-pipeline.md` explaining the spec → Qiskit → results flow in full detail, with sequence diagram

### Phase 2 — Learn Module (Module 1)
- Content schema for a lesson: explanation (MDX), math (KaTeX), circuit animation (reuses Playground's rendering primitives in read-only/scripted mode), live code (embeds a scoped-down Playground instance pre-loaded with the gate), quiz (structured JSON, multiple choice + numeric), practice exercises (mini-challenges, reuses Challenge evaluator from Phase 4)
- Build the 7 gate lessons (X, Y, Z, H, Phase, CNOT, Toffoli) as content, using the schema
- Progress tracking wired to `lesson_progress`
- Docs: `content/lessons/README.md` explaining the content schema so contributors can add new lessons without touching app code

### Phase 3 — Quantum Algorithms (Module 3)
- Same content pattern as lessons, extended with: complexity analysis section, real-world applications section, and a step-through animation mode (circuit executes gate-by-gate with state shown at each step, not just final result)
- Build in this order (increasing complexity): Superdense Coding, Quantum Teleportation, Deutsch, Deutsch-Jozsa, Bernstein-Vazirani, Simon's, Grover's Search, QFT, QPE, Shor's (conceptual/simplified — explicitly scoped as educational, not a real factoring engine)
- Docs: each algorithm gets a `docs/` entry cross-linked from the in-app page, so the same explanation exists as static docs for people who never open the app

### Phase 4 — Challenges (Module 5)
- Challenge spec format: goal state or goal behavior (e.g., "output statevector must match Bell state within tolerance ε"), starter circuit (optional), evaluator function
- Automatic evaluator: runs submitted circuit through `QuantumBackend`, compares result against challenge spec (statevector fidelity check, measurement distribution check, or oracle-behavior check depending on challenge type)
- Build 4 launch challenges: Bell state, teleportation, custom oracle design, circuit optimization (gate-count minimization with equivalence check)
- Docs: `content/challenges/README.md` explaining how to author a new challenge + evaluator, with a worked example

### Phase 5 — Quantum Machine Learning (Module 4)
- Content pattern from Phase 2/3, extended with side-by-side classical-vs-quantum comparison UI (two panels, shared dataset, different model)
- Backend: variational quantum circuit training endpoint (small-scale, e.g. Iris dataset or synthetic 2D classification — must run fast enough for a browser demo, so cap qubit count and epochs)
- Examples to build: quantum classifier, quantum kernel method, VQC, hybrid classical-quantum NN
- This phase is the most compute-heavy; explicitly document expected runtime and hardware assumptions

### Phase 6 — Research Hub (Module 6)
- Curated content initially (hand-picked papers, IBM Quantum examples, roadmaps) stored in `content_cache` / static JSON — no scraping infra in v1
- Simple filterable/searchable UI
- Explicitly out of scope for v1: live-updating "recent developments" feed (flag as a `docs/roadmap.md` future item, don't half-build it)

### Phase 7 — 3D Bloch Sphere Upgrade
- Swap the 2D fallback Bloch visualization for Three.js in Playground, Learn, and Algorithms modules
- Isolated phase because it's a pure visual upgrade with no data model changes

### Phase 8 — Hardening
- Full auth flows (sign up, sign in, profile, progress dashboard)
- Accessibility pass (keyboard nav for circuit builder is the hard part — plan for it explicitly, don't bolt it on)
- Load testing on `/api/circuits/execute` (simulator calls are the likely bottleneck)
- Security review of challenge evaluator (must sandbox anything that touches user-submitted circuit specs — no arbitrary code execution path, ever, since specs are structured data, not code)

### Phase 9 — Plugin System for Additional SDKs
- Formalize `QuantumBackend` into a real plugin interface (entry points or config-driven registration)
- Add Cirq as the second backend to prove the abstraction holds
- Docs: `docs/architecture/adding-a-backend.md`

---

## 7. Documentation Strategy

Given the "overwhelmingly explained" requirement, documentation is split into four tiers so it stays navigable instead of becoming a wall of text:

1. **README.md (root)** — 2-minute pitch, screenshots/gifs, quickstart, link to everything else.
2. **`docs/architecture/`** — one file per major subsystem (circuit execution pipeline, content engine, auth, data model). Each explains *why* the design is the way it is, not just what it does. Include sequence/architecture diagrams (Mermaid, so they render on GitHub).
3. **`docs/api-reference/`** — auto-generated where possible (FastAPI's OpenAPI schema → static docs page), hand-written prose around it for non-obvious endpoints.
4. **In-repo module READMEs** — every folder under `apps/`, `packages/`, and `content/` gets a README explaining its own scope, so a contributor never has to read the whole repo to touch one part.

Also required: `docs/adr/` — every non-trivial decision (monorepo tool, auth provider, DB choice justification, why Aer simulator vs real hardware for v1, etc.) gets a short ADR. This is what makes the "why" legible to future contributors and is often the first thing skipped — don't skip it.

---

## 8. Open Source Readiness Checklist

- [ ] LICENSE chosen and applied (recommend MIT for max adoption, or Apache-2.0 if patent grant matters — decide in Phase 0 ADR)
- [ ] CONTRIBUTING.md with local setup that works on a clean machine
- [ ] CODE_OF_CONDUCT.md
- [ ] Issue templates (bug report, feature request, new lesson/algorithm content proposal)
- [ ] PR template with a docs-updated checkbox
- [ ] GitHub Actions: lint, typecheck, test, build on every PR
- [ ] `good-first-issue` labeled starter tasks (e.g., "add the S-gate lesson using the existing schema")

---

## 9. Explicit Non-Goals for v1

- No real quantum hardware execution (simulator only) — flagged as future work, not silently dropped
- No live-scraped research feed
- No multi-SDK support at launch (Qiskit only; architecture supports adding more later)
- No mobile app (responsive web only)

---

## 10. Open Decisions (must be resolved in Phase 0, not deferred)

1. License: MIT vs Apache-2.0
2. Auth provider: Clerk vs Auth.js
3. Monorepo tooling: Turborepo vs Nx vs plain npm/pnpm workspaces
4. Whether MongoDB is accessed via Motor (async driver) directly or through an ODM (Beanie) — affects how much boilerplate Phase 1 needs