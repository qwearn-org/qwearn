# ADR-0001: License Choice

**Status:** Accepted  
**Date:** 2026-07-17  
**Decision Makers:** Aman Raza  

## Context

Qwearn is an open-source quantum computing learning platform. We need to choose a license that:

1. Maximizes community adoption and contribution
2. Allows educational institutions and individuals to use freely
3. Permits commercial use (e.g., hosting, embedding)
4. Is well-understood by the open-source community

The two candidates are **MIT** and **Apache-2.0**.

## Decision

**MIT License.**

## Rationale

- **Simplicity:** MIT is the most widely understood OSS license. Contributors and users don't need legal review to know what it means.
- **Maximum permissiveness:** No patent clause overhead. For a learning platform, patent protection is not a concern — we are not inventing novel algorithms, we are teaching existing ones.
- **Adoption:** Lower barrier to fork, embed, and redistribute. Educational projects (courses, workshops) can include Qwearn freely.
- **Upgrade path:** MIT → Apache-2.0 is a clean migration if we later need patent grants.
- **Ecosystem fit:** Qiskit itself is Apache-2.0, but that's their license, not ours. Our wrapper/educational layer has no patent surface.

## Consequences

- Contributors grant an implicit copyright license but no explicit patent grant.
- If Qwearn later includes patentable innovations (unlikely for an educational platform), we would need to re-evaluate.
