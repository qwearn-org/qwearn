# ADR-0002: Auth Provider — Auth.js (NextAuth v5)

**Status:** Accepted  
**Date:** 2026-07-17  
**Decision Makers:** Aman Raza  

## Context

Qwearn needs authentication for:
- Saving circuit designs to user profiles
- Tracking learning progress per user
- Challenge submission history

Two options were evaluated:

| Criteria | Clerk | Auth.js (NextAuth v5) |
|---|---|---|
| Self-hosted | ❌ SaaS only | ✅ Fully self-hosted |
| Cost | Paid above free tier | Free |
| OSS contributor friction | High (needs API key) | Low (just run the app) |
| Next.js App Router support | ✅ | ✅ |
| MongoDB session storage | Via adapter | Native adapter |
| Vendor lock-in | High | None |

## Decision

**Auth.js (NextAuth v5)** with the MongoDB adapter.

## Rationale

- **Open-source alignment:** A contributor cloning the repo can run the full app without signing up for any third-party service. This is critical for an OSS project.
- **Data co-location:** Auth sessions live in the same MongoDB instance as user progress and circuit saves. No external auth database to manage.
- **Provider flexibility:** Auth.js supports GitHub, Google, email/password, and dozens of other providers. We'll ship with GitHub + Google initially.
- **No cost ceiling:** Clerk's free tier has limits; Auth.js has no usage limits.

## Consequences

- More initial setup work (configure providers, session handling, CSRF protection).
- We own the auth infrastructure, including security updates.
- Session management, token rotation, and CSRF are our responsibility (Auth.js handles most of this, but we must configure it correctly).

## Implementation Notes

- Auth.js will be configured in `apps/web/` using the App Router integration.
- The MongoDB adapter stores sessions, users, and accounts in the same database.
- The FastAPI backend will validate JWT tokens issued by Auth.js for API authentication.
