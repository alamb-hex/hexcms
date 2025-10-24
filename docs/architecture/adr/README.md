# Architecture Decision Records (ADR)

This directory contains Architecture Decision Records (ADRs) for heXcms.

## What is an ADR?

An Architecture Decision Record (ADR) is a document that captures an important architectural decision made along with its context and consequences.

## Format

Each ADR follows this template:

```markdown
# [Number]. [Title]

**Status:** [Proposed | Accepted | Deprecated | Superseded]
**Date:** YYYY-MM-DD
**Deciders:** [List of people involved]

## Context

What is the issue we're facing? What factors are at play?

## Decision

What is the change we're proposing or have agreed to implement?

## Consequences

### Positive
- What becomes easier?

### Negative
- What becomes harder?

### Risks
- What could go wrong?

## Alternatives Considered

What other options did we evaluate?

## References

Links to relevant documentation, discussions, or resources.
```

## Index

- [ADR-001: Use Next.js 14 as Framework](./001-use-nextjs-14.md)
- [ADR-002: Use PostgreSQL Over MongoDB](./002-use-postgresql-over-mongodb.md)
- [ADR-003: Git-Based Content Management](./003-git-based-content.md)
- [ADR-004: Deploy to Vercel Platform](./004-deploy-to-vercel.md)
- [ADR-005: Database Sync Strategy](./005-database-sync-strategy.md)

## Creating a New ADR

1. **Copy the template**: Use `adr-template.md` as a starting point
2. **Number sequentially**: Use the next available number
3. **Use descriptive titles**: `NNN-kebab-case-title.md`
4. **Fill in all sections**: Provide context, decision, and consequences
5. **Update this index**: Add your ADR to the list above
6. **Commit with clear message**: `git commit -m "Add ADR-NNN: [Title]"`

## When to Create an ADR

Create an ADR when making decisions about:

- Technology choices (frameworks, databases, languages)
- Architectural patterns (monolith vs microservices, API design)
- Development practices (testing strategy, deployment process)
- External dependencies (third-party services, APIs)
- Data models and schemas
- Security and authentication approaches

## ADR Lifecycle

1. **Proposed** - Under discussion
2. **Accepted** - Decision made and being implemented
3. **Deprecated** - No longer relevant but kept for history
4. **Superseded** - Replaced by a newer ADR (link to the new one)

## References

- [Architecture Decision Records](https://adr.github.io/)
- [Documenting Architecture Decisions](https://cognitect.com/blog/2011/11/15/documenting-architecture-decisions)
