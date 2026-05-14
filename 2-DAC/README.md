# 2 · DAC — Context Manager API

> A concrete demo of **Document-as-Code** applied to a .NET 10 Minimal API.

This folder is the *materialization* of section 4 of the root README: code, documentation, and prompts live in the same repository and are versioned together. The documentation here **is the spec** of the API, not a description after the fact.

---

## Table of Contents

1. [What the application does](#what-the-application-does)
2. [Folder layout](#folder-layout)
3. [How to run it](#how-to-run-it)
4. [Documentation](#documentation)
5. [Process workspace](#process-workspace)

---

## What the application does

`ContextManager.Api` is a Minimal API that manages **Knowledge Contexts** — named collections of *snippets* (text fragments with tags) that an agent can consult as an auxiliary source of truth.

The domain is deliberately minimal:

- a **Context** has a name, a description, and a list of snippets;
- a **Snippet** has a title, content, and tags;
- search inside a context is a case-insensitive scan across title, content, and tags.

Persistence is **in-memory** (`ConcurrentDictionary`): zero setup, state is lost on restart. The right level for a teaching demo.

### Main endpoints

| Method | Path | Purpose |
|--------|------|---------|
| `POST` | `/contexts` | Create a new Knowledge Context |
| `GET` | `/contexts` | List all contexts |
| `GET` | `/contexts/{id}` | Retrieve a context |
| `PUT` | `/contexts/{id}` | Update name / description |
| `DELETE` | `/contexts/{id}` | Delete a context |
| `POST` | `/contexts/{id}/snippets` | Add a snippet |
| `GET` | `/contexts/{id}/search?q=...` | Search inside the context |

OpenAPI is exposed at `/openapi/v1.json` (native `Microsoft.AspNetCore.OpenApi` provider).

---

## Folder layout

```
2 - DAC/
├── README.md                          ← this file
├── src/
│   └── ContextManager.Api/            ← .NET 10 Minimal API project
│       ├── Program.cs                 ← composition root
│       ├── ContextManager.Api.csproj
│       ├── Models/                    ← record DTOs + entities
│       ├── Storage/                   ← IContextStore + in-memory implementation
│       └── Endpoints/                 ← endpoint mapping per group
├── docs/
│   ├── technical-analysis.md          ← HOW: architecture, contracts, decisions
│   └── functional-analysis/           ← WHAT: domain rules, by chapter
│       ├── 00-index.md
│       ├── 01-vision-and-goals.md
│       ├── 02-glossary.md
│       ├── 03-actors.md
│       ├── 04-use-cases.md
│       └── 05-business-rules.md
└── .workspace/                        ← IGNORED by git: PR and Task process material
    ├── pr/        PR-NNN-<slug>/{user_story.md, review.md}
    └── task/      TASK-NNN-<slug>/{analysis.md, plan.md, review.md}
```

---

## How to run it

Prerequisite: **.NET SDK 10**.

```bash
cd "2 - DAC/src/ContextManager.Api"
dotnet run
```

The app listens on `http://localhost:5080`. OpenAPI JSON at `http://localhost:5080/openapi/v1.json`.

Quick example:

```bash
# Create a context
curl -X POST http://localhost:5080/contexts \
  -H "Content-Type: application/json" \
  -d '{"name":"Onboarding","description":"Context for onboarding new developers"}'

# Add a snippet (replace {id} with the one returned above)
curl -X POST http://localhost:5080/contexts/{id}/snippets \
  -H "Content-Type: application/json" \
  -d '{"title":"Setup repo","content":"git clone ...","tags":["setup","git"]}'

# Search
curl "http://localhost:5080/contexts/{id}/search?q=git"
```

---

## Documentation

The documentation is the **source of truth** for expected behavior. If the code diverges, the bug is in the code — not in the documents.

- **[Technical analysis](./docs/technical-analysis.md)** — *how* the API is built: layering, contracts, data model, design decisions and rationale.
- **[Functional analysis](./docs/functional-analysis/00-index.md)** — *what* the API must do in domain terms: vision, glossary, actors, use cases, business rules. Split into chapters so it can be loaded incrementally by an agent.

---

## Process workspace

The `.workspace/` folder is **excluded from the repository** (root `.gitignore`). It holds the working material that accompanies every PR and every Task — useful to an agent orchestrating the development lifecycle, but not part of the public artifact.

Convention:

- `.workspace/pr/PR-NNN-<slug>/`
  - `user_story.md` — the story the PR realizes, in *As a / I want / So that* form.
  - `review.md` — review notes (human and/or `reviewer-*` agent).
- `.workspace/task/TASK-NNN-<slug>/`
  - `analysis.md` — preliminary analysis of the problem (output of an `analyst-*` agent).
  - `plan.md` — step-by-step implementation plan.
  - `review.md` — post-implementation review outcome.

See [`.workspace/README.md`](./.workspace/README.md) for details and templates.
