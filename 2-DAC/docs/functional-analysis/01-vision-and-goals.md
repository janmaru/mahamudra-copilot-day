# 1 · Vision and goals

## Vision

Provide a **centralized registry of Knowledge Contexts** consumable by agents, developers, and automated tools. Each Context is a named collection of knowledge fragments (snippets) that can be used as an auxiliary source of truth for a specific task — onboarding a person, configuring an agent, gathering examples for a demo, and so on.

## Problem solved

Operational knowledge of a team lives scattered across chats, personal documents, screenshots, PR comments. When an agent or a new colleague needs *that* specific fragment, they hunt for it manually. The Context Manager:

- aggregates related fragments into a single thematic Context;
- makes them searchable in a predictable way;
- offers an API an agent can consume autonomously;
- keeps the public contract stable and documented as an executable spec.

## Goals (in priority order)

1. **Contract determinism.** Endpoint signatures, status codes, and JSON shapes are part of the public contract. A change to the contract is a functional change that requires updating the analysis.
2. **Low operational friction.** Starting the application must take a single command. No database, no mandatory external configuration.
3. **Readability.** Code and documentation must be understandable in a single reading session.

## Out of scope (explicit)

To avoid implicit expectations, the following capabilities are **not** part of the product in this phase:

- User authentication and authorization.
- Multi-tenancy: all Contexts belong to the same logical space.
- Snippet versioning or change history.
- Full-text search with ranking, advanced tokenization, stemming.
- Durable persistence (database, on-disk files).
- Notifications or subscriptions to changes.
- Quotas, rate limits, advanced observability.

Anything not in this list *or* in subsequent chapters is an addition — not an omission.

## Demo success metric

The demo is considered effective when, starting only from the documents in `docs/`, an agent can:

- generate a correct test client for the endpoints;
- predict the response shape for a request not documented explicitly;
- recognize and flag a request that violates a `BR-NNN`.
