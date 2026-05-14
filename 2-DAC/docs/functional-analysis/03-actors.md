# 3 · Actors

> Who interacts with the system, how, and with what responsibility. The distinction is functional (what they do), not technical (how they authenticate — here, nobody authenticates, see ch. 1).

## A1 — Context Curator

**Who.** A human, a developer or knowledge manager, who creates and maintains Contexts.

**Does.**

- Creates new Contexts with meaningful names and descriptions.
- Adds Snippets to Contexts.
- Updates name / description of a Context.
- Deletes Contexts no longer useful.

**Responsibility.** Content *quality*: descriptive names, well-formed snippets, consistent tags. The system does not validate quality — it is a pact between humans.

## A2 — Consumer (human)

**Who.** A human seeking information within a Context.

**Does.**

- Lists available Contexts.
- Opens a single Context to view its Snippets.
- Runs searches inside a Context.

**Responsibility.** None toward the system. Reads.

## A3 — Automated agent

**Who.** Software (typically an LLM with tool use or an agent orchestrator) consuming the API to enrich its working context.

**Does.**

- The same things as A2, programmatically.
- *Can* be authorized to do the same things as A1 (in automation scenarios), but in this version there is no privilege distinction: whoever can call the API can do everything.

**Responsibility.** Honor the documented contracts. If the contract changes, the agent breaks: this is an intended consequence of DaC.

## A4 — External integrator system

**Who.** Any other service that imports / exports Contexts. Hypothetical examples: a job importing FAQs from a CMS, an exporter toward another knowledge-management tool.

**Does.** In this version no formalized integration **exists**: A4 is just an HTTP consumer like A2/A3.

**Responsibility.** Same as A3.

## Summary table

| Actor | Create | Update | Delete | Read | Search |
|-------|:------:|:------:|:------:|:----:|:------:|
| A1 Curator | yes | yes | yes | yes | yes |
| A2 Consumer | no | no | no | yes | yes |
| A3 Agent | yes\* | yes\* | yes\* | yes | yes |
| A4 External system | as A3 | as A3 | as A3 | as A3 | as A3 |

\* *Technically enabled; in practice constrained by policies external to the system.*
