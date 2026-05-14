# Functional analysis — Index

> **Purpose.** Describe *what* the system does in domain terms: vision, glossary, actors, use cases, business rules. It is the functional counterpart to the [technical analysis](../technical-analysis.md), which describes instead *how* it is built.

The analysis is split into numbered chapters to enable **incremental** loading into an agent's context: a prompt can include only the relevant chapter, shortening the prefix and improving cache hit rate.

## Chapters

1. [Vision and goals](./01-vision-and-goals.md) — why the system exists, what problems it solves, what is explicitly out of scope.
2. [Glossary](./02-glossary.md) — domain terms with a single definition. No synonyms, no ambiguity.
3. [Actors](./03-actors.md) — who interacts with the system (humans, agents, other systems) and with what responsibilities.
4. [Use cases](./04-use-cases.md) — end-to-end operational flows with pre-conditions, main and alternative scenarios.
5. [Business rules](./05-business-rules.md) — invariable constraints, domain invariants, policy decisions.

## Conventions

- Each domain term is defined **once and only once** in the glossary; all other chapters refer back to it.
- Business rules are identified by a `BR-NNN` code so they can be cited from code, tests, and technical documentation.
- Use cases are identified by `UC-NNN`.
- When a rule or use case constrains a specific endpoint, the technical analysis back-links to it.
