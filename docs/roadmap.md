# Qwearn Roadmap

Features explicitly scoped out of v1, documented here so they aren't silently dropped.

## Future Work

### Real Quantum Hardware Execution
**Status:** Out of scope for v1 (simulator only)  
**Rationale:** IBM Quantum hardware queues add latency and complexity that don't serve the learning use case. The Aer simulator provides instant, deterministic results — better for an interactive learning platform.  
**When to revisit:** After Phase 8 hardening, if there's user demand for "run on real hardware" as a premium/optional feature.

### Live Research Feed
**Status:** Out of scope for v1  
**Rationale:** Live-scraping arXiv/IBM Research requires infrastructure (scraper jobs, content moderation, rate limiting) that is disproportionate to the learning value. Phase 6 ships curated content instead.  
**When to revisit:** After Phase 6, based on user feedback on the curated approach.

### Multi-SDK Support (Cirq, PennyLane)
**Status:** Phase 9 (planned, not v1)  
**Rationale:** The `QuantumBackend` interface is designed to support this, but shipping with Qiskit-only reduces scope and QA surface. Cirq will be the second backend to prove the abstraction.  
**Tracking:** [ADR-0005](docs/adr/ADR-0005-quantum-backend-interface.md)

### Mobile App
**Status:** Out of scope entirely  
**Rationale:** Responsive web covers mobile browsers. A native app adds build/deploy complexity without clear learning benefit.  
**When to revisit:** Only if the circuit builder UX is significantly better on a touch-native platform.

### Collaborative Features
**Status:** Not planned  
**Why:** Multi-user real-time circuit editing is a significant infrastructure investment (WebSockets, OT/CRDT) with unclear learning value. If revisited, consider it as a distinct product feature, not a bolt-on.
