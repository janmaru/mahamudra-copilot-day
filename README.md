# Coding the Context

### Mastering Copilot through Document-as-Code and Probability Management

> GitHub Copilot Dev Days — Plugins · Companion repository

---

## Abstract

In the world of Agents, **context is a finite resource from which to derive truth**. To use GitHub Copilot and its ecosystem of Agents and Sub-Agents effectively, we must stop relying on implicit conventions and treat documentation as the single source of truth.

This session explores the shift from documentation *understandable by humans* to documentation *executable by agents* through the **Document-as-Code** strategy. We cover:

- **Context as Logic** — every token is a statistical constraint that shapes agent behavior.
- **Agent Orchestration** — how Copilot's Sub-Agents navigate a codebase and why an explicit *routing table* is necessary.
- **Beyond Conventions** — custom instructions and structured documents to reduce entropy in multi-agent workflows.
- **The DaC Advantage** — README files and specs as *source of truth* to prevent hallucinations and inefficient implementations.

Goal: configure Copilot so the correct solution to your problem is not a hypothesis but **the only logical outcome**.

---

## Table of Contents

1. [The Agent as a Black Box](#1-the-agent-as-a-black-box)
2. [Context as Logic — The Pricing Bubble](#2-context-as-logic--the-pricing-bubble)
3. [Sub-Agent Orchestration — The Routing Table](#3-sub-agent-orchestration--the-routing-table)
4. [Document-as-Code — README as Source of Truth](#4-document-as-code--readme-as-source-of-truth)
5. [The AI Cost Bubble — More Usage, Bigger Bill](#5-the-ai-cost-bubble--more-usage-bigger-bill)
6. [Folder Map](#folder-map)

---

## 1. The Agent as a Black Box

An agent is a function. **Prompt in → completion out.** Nothing else is observable from the outside. The "magic" is entirely determined by the tokens you put in.

<svg viewBox="0 0 720 280" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Agent as a black box">
  <defs>
    <marker id="arrow1" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1f2937"/>
    </marker>
  </defs>
  <rect x="20" y="100" width="180" height="80" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
  <text x="110" y="135" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Prompt</text>
  <text x="110" y="158" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#4b5563">input tokens</text>
  <rect x="270" y="80" width="180" height="120" rx="12" fill="#1f2937"/>
  <text x="360" y="135" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#f9fafb">Agent</text>
  <text x="360" y="162" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#9ca3af">black box</text>
  <rect x="520" y="100" width="180" height="80" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
  <text x="610" y="135" text-anchor="middle" font-family="sans-serif" font-size="16" font-weight="bold" fill="#1f2937">Completion</text>
  <text x="610" y="158" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#4b5563">output tokens</text>
  <path d="M 200 140 L 265 140" stroke="#1f2937" stroke-width="2" fill="none" marker-end="url(#arrow1)"/>
  <path d="M 455 140 L 515 140" stroke="#1f2937" stroke-width="2" fill="none" marker-end="url(#arrow1)"/>
  <text x="360" y="240" text-anchor="middle" font-family="sans-serif" font-size="12" font-style="italic" fill="#4b5563">Every token is a statistical constraint that shapes the output.</text>
</svg>

**Implication.** If the output is wrong, the cause is *always* in the prompt — not in the model. The prompt is the only lever you have.

Two companion experiments in this repo make the input/output sides measurable:

- [`0-Data-Input/`](./0-Data-Input/) — the **cost of feeding** an LLM the same dataset in 8 formats (CSV, MD, TXT, XML, HTML, PDF, XLSX, JPG). Spoiler: a 37 KB JPEG sent as raw bytes costs **~540×** the same data in CSV.
- [`1-Data-Output/`](./1-Data-Output/) — the **cost of receiving** a trivial class generated in 5 languages (C#, Java, Rust, F#, Haskell). Java costs **4.25×** F# for the same logical content.

---

## 2. Context as Logic — The Pricing Bubble

Every token in a prompt is a statistical constraint. **More context → fewer degrees of freedom → more deterministic output.** Adding documentation is not "padding": it is *narrowing the probability distribution* the model samples from.

The economic question is: doesn't this become prohibitively expensive? **No** — because of **prompt caching**. Stable prefixes (system prompt, repository instructions, long-lived context) are charged at a fraction of the normal input price.

<svg viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Pricing bubble — cached vs fresh tokens">
  <text x="360" y="30" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1f2937">Prompt anatomy</text>
  <rect x="40" y="70" width="500" height="80" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
  <text x="290" y="105" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1f2937">Cached prefix</text>
  <text x="290" y="128" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#4b5563">system prompt · repo instructions · stable docs · tool definitions</text>
  <rect x="550" y="70" width="130" height="80" rx="8" fill="#fee2e2" stroke="#dc2626" stroke-width="2"/>
  <text x="615" y="105" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1f2937">Fresh</text>
  <text x="615" y="128" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#4b5563">user turn</text>
  <rect x="40" y="165" width="500" height="28" rx="14" fill="#16a34a"/>
  <text x="290" y="184" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="white">~10% of input price · cache read (Anthropic, 5-min TTL)</text>
  <rect x="550" y="165" width="130" height="28" rx="14" fill="#dc2626"/>
  <text x="615" y="184" text-anchor="middle" font-family="sans-serif" font-size="12" font-weight="bold" fill="white">100%</text>
  <text x="360" y="240" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1f2937">Effective cost ≪ raw token count</text>
  <text x="360" y="262" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#4b5563">A 100k-token prompt where 95k are cached costs roughly:</text>
  <text x="360" y="284" text-anchor="middle" font-family="monospace" font-size="13" fill="#1f2937">95k × 0.10 + 5k × 1.00 = 14.5k effective tokens</text>
</svg>

### Two pricing regimes

| Provider | Mechanism | Effective discount on cached input |
|----------|-----------|-----------------------------------:|
| **Anthropic API** (Claude) | Explicit `cache_control` markers in the request; 5-minute TTL; cache write costs ~125% of input, cache read ~10% | up to **~10×** cheaper for cached prefix |
| **GitHub Copilot** | Implicit at the provider layer (OpenAI / Azure OpenAI); repository-level instructions (`.github/copilot-instructions.md`) and long-lived chat sessions amortize automatically | per-seat subscription hides the per-token cost, but the same caching physics apply |

### What this means in practice

- **Invest in the prefix.** A long, stable, well-structured `copilot-instructions.md` or system prompt is *cheaper than it looks* because every subsequent turn reads it at cache prices.
- **Volatile content goes at the end.** Anything that changes per request (user query, fresh tool outputs) lives in the "fresh" tail.
- **Cache misses are the real enemy.** Reordering the prompt, swapping the model, or letting the TTL expire wipes the prefix and forces a re-write at full price.

> The bubble: the prompt looks expensive, but **most of it doesn't cost what it weighs**.

---

## 3. Sub-Agent Orchestration — The Routing Table

A multi-agent setup without explicit routing is a multi-agent setup that drifts on implicit conventions. The main agent must know *which* sub-agent to delegate to, *when*, and *with what context*.

<svg viewBox="0 0 760 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Sub-agent routing table">
  <rect x="320" y="40" width="160" height="60" rx="10" fill="#1f2937"/>
  <text x="400" y="78" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="#f9fafb">Main agent</text>
  <rect x="270" y="130" width="260" height="60" rx="10" fill="#ede9fe" stroke="#7c3aed" stroke-width="2"/>
  <text x="400" y="155" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1f2937">Routing table</text>
  <text x="400" y="175" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#4b5563">task pattern → sub-agent</text>
  <rect x="40" y="240" width="130" height="60" rx="8" fill="#fef3c7" stroke="#ca8a04" stroke-width="2"/>
  <text x="105" y="265" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1f2937">analyst-*</text>
  <text x="105" y="285" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#4b5563">deep inspection</text>
  <rect x="190" y="240" width="130" height="60" rx="8" fill="#fef3c7" stroke="#ca8a04" stroke-width="2"/>
  <text x="255" y="265" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1f2937">reviewer-*</text>
  <text x="255" y="285" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#4b5563">code review</text>
  <rect x="340" y="240" width="130" height="60" rx="8" fill="#fef3c7" stroke="#ca8a04" stroke-width="2"/>
  <text x="405" y="265" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1f2937">azdo-assistant</text>
  <text x="405" y="285" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#4b5563">PR / WI write ops</text>
  <rect x="490" y="240" width="130" height="60" rx="8" fill="#fef3c7" stroke="#ca8a04" stroke-width="2"/>
  <text x="555" y="265" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1f2937">writer-tech-docs</text>
  <text x="555" y="285" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#4b5563">Markdown + diagrams</text>
  <rect x="640" y="240" width="100" height="60" rx="8" fill="#fef3c7" stroke="#ca8a04" stroke-width="2"/>
  <text x="690" y="265" text-anchor="middle" font-family="sans-serif" font-size="13" font-weight="bold" fill="#1f2937">Explore</text>
  <text x="690" y="285" text-anchor="middle" font-family="sans-serif" font-size="11" fill="#4b5563">code search</text>
  <line x1="400" y1="100" x2="400" y2="130" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="400" y1="190" x2="105" y2="240" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="400" y1="190" x2="255" y2="240" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="400" y1="190" x2="405" y2="240" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="400" y1="190" x2="555" y2="240" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4 3"/>
  <line x1="400" y1="190" x2="690" y2="240" stroke="#6b7280" stroke-width="1.5" stroke-dasharray="4 3"/>
  <text x="400" y="340" text-anchor="middle" font-family="sans-serif" font-size="12" font-style="italic" fill="#4b5563">Without an explicit routing table, sub-agents drift on implicit conventions → entropy.</text>
</svg>

### Why a routing table

- Sub-agents have **narrow, declared scopes** (a reviewer reviews; an analyst investigates; an `azdo-assistant` handles PR/WI write ops with UTF-8 safety).
- The main agent's job is to **classify the incoming task** and dispatch — not to try and do everything itself.
- Without that classification step, the model falls back on *guessing* which abilities to use. Guessing is what we call *hallucination* in user-facing terms.

A routing table is just the system prompt section that says: *"if the task matches pattern X, delegate to sub-agent Y."* Plain English. Versioned with the code.

---

## 4. Document-as-Code — README as Source of Truth

Code, documentation, and prompts are three views of the same artifact. **Versioned together. Executed together. Single source of truth.**

<svg viewBox="0 0 600 380" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Document-as-Code triangle">
  <defs>
    <marker id="arrow2" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto">
      <path d="M 0 0 L 10 5 L 0 10 z" fill="#1f2937"/>
    </marker>
  </defs>
  <rect x="220" y="40" width="160" height="60" rx="8" fill="#dbeafe" stroke="#2563eb" stroke-width="2"/>
  <text x="300" y="70" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="#1f2937">Documentation</text>
  <text x="300" y="90" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#4b5563">README · specs · ADR</text>
  <rect x="60" y="240" width="160" height="60" rx="8" fill="#dcfce7" stroke="#16a34a" stroke-width="2"/>
  <text x="140" y="270" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="#1f2937">Code</text>
  <text x="140" y="290" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#4b5563">implementation · tests</text>
  <rect x="380" y="240" width="160" height="60" rx="8" fill="#fef3c7" stroke="#ca8a04" stroke-width="2"/>
  <text x="460" y="270" text-anchor="middle" font-family="sans-serif" font-size="15" font-weight="bold" fill="#1f2937">Prompt</text>
  <text x="460" y="290" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#4b5563">agent instructions</text>
  <path d="M 240 100 Q 150 170 160 240" stroke="#1f2937" stroke-width="2" fill="none" marker-end="url(#arrow2)"/>
  <path d="M 220 270 Q 300 305 380 270" stroke="#1f2937" stroke-width="2" fill="none" marker-end="url(#arrow2)"/>
  <path d="M 440 240 Q 450 170 360 100" stroke="#1f2937" stroke-width="2" fill="none" marker-end="url(#arrow2)"/>
  <text x="300" y="170" text-anchor="middle" font-family="sans-serif" font-size="13" font-style="italic" fill="#4b5563">single source</text>
  <text x="300" y="188" text-anchor="middle" font-family="sans-serif" font-size="13" font-style="italic" fill="#4b5563">of truth</text>
  <text x="300" y="350" text-anchor="middle" font-family="sans-serif" font-size="12" font-style="italic" fill="#4b5563">Versioned together. Executed together. No implicit conventions.</text>
</svg>

### What changes when docs become code

| Traditional docs | Document-as-Code |
|------------------|------------------|
| Live on Confluence / Notion / a wiki | Live in the repo next to the code |
| Updated by humans, occasionally | Updated in the same PR that changes behavior |
| Read by humans | Read by humans **and** agents |
| Diverge from code over time | Drift is a CI failure |
| Convention-driven | Spec-driven — the doc is the spec |

### Why it eliminates hallucinations

An agent hallucinates when it has to *guess* what the project expects. A spec-grade README removes the guess: the answer is in the prompt cache, at a fraction of the cost, on every turn.

The READMEs in [`0-Data-Input/`](./0-Data-Input/) and [`1-Data-Output/`](./1-Data-Output/) are themselves the demonstration: each one *is* the executable spec for its own benchmark, complete with reproducible commands.

---

## 5. The AI Cost Bubble — More Usage, Bigger Bill

Section 2 told the optimistic half of the story: caching makes a fat prefix *cheaper than it looks*. This section tells the other half: **the agent economy bills by the token, and tokens grow faster than the work you asked for.**

Three forces compound:

1. **Autonomy multiplies tokens.** A single user turn no longer maps to a single model call. An autonomous loop reads files, calls tools, observes results, reflects, retries. Every step ships the *whole* conversation back to the model. A 10-step agent loop on a 30 k-token context bills roughly **300 k input tokens**, not 30 k.
2. **Reasoning multiplies output.** Extended-thinking and reasoning modes generate hidden chain-of-thought tokens that you pay for at output rates — typically the most expensive line on the invoice. A "simple" question with deep thinking enabled can cost 5–20× the same question without it.
3. **Context windows invite waste.** A 200 k or 1 M token window does not lower the price per token; it just removes the ceiling on how much you can burn per call. Cache misses on a 500 k-token prompt are catastrophic, not annoying.

<svg viewBox="0 0 720 320" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="AI cost bubble — usage vs bill">
  <text x="360" y="28" text-anchor="middle" font-family="sans-serif" font-size="14" font-weight="bold" fill="#1f2937">Usage grows linearly. Spend does not.</text>
  <line x1="80" y1="260" x2="660" y2="260" stroke="#1f2937" stroke-width="1.5"/>
  <line x1="80" y1="60" x2="80" y2="260" stroke="#1f2937" stroke-width="1.5"/>
  <text x="370" y="290" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#4b5563">user turns / day</text>
  <text x="40" y="160" text-anchor="middle" font-family="sans-serif" font-size="12" fill="#4b5563" transform="rotate(-90 40 160)">monthly spend</text>
  <path d="M 80 250 L 660 200" stroke="#16a34a" stroke-width="2.5" fill="none" stroke-dasharray="6 4"/>
  <text x="600" y="190" font-family="sans-serif" font-size="11" fill="#16a34a">naive expectation (linear)</text>
  <path d="M 80 250 Q 320 245 460 200 T 660 70" stroke="#dc2626" stroke-width="3" fill="none"/>
  <text x="540" y="105" font-family="sans-serif" font-size="11" font-weight="bold" fill="#dc2626">actual bill</text>
  <text x="540" y="120" font-family="sans-serif" font-size="11" fill="#dc2626">(loops × thinking × context)</text>
  <circle cx="460" cy="200" r="4" fill="#dc2626"/>
  <text x="465" y="225" font-family="sans-serif" font-size="10" fill="#4b5563">agents enabled</text>
  <circle cx="580" cy="130" r="4" fill="#dc2626"/>
  <text x="495" y="150" font-family="sans-serif" font-size="10" fill="#4b5563">reasoning on by default</text>
</svg>

### Where the money actually goes

| Cost driver | What it looks like on the invoice | Mitigation |
|---|---|---|
| **Agent loop length** | input tokens scale with `steps × context_size` | bound the loop, summarize on long horizons, dispatch to sub-agents with narrow context |
| **Reasoning / thinking tokens** | output spend dominates the bill | enable thinking only when the task warrants it; cap budget |
| **Cache misses** | full-price re-write of the prefix on every turn | freeze the prefix; never reorder it; keep TTL alive |
| **Per-seat blindness (Copilot)** | flat fee hides which seats and which features actually burn capacity | track turn count, premium-request count, and which models are being routed |
| **Tool output bloat** | a single `grep` or file read injects 10–50 k tokens into the next turn | filter, paginate, or summarize tool results before they re-enter the loop |

### The bubble

The same physics that make a cached prefix *almost free* (§2) make an uncached agent loop *almost unbounded*. The lever is the same — token count — pulled in opposite directions:

> Caching rewards a **stable, reused** context. Autonomy punishes an **expanding, re-read** context. Pay attention to which regime you are in, on every turn.

Practical heuristics:

- **Measure before optimizing.** Log input/output tokens per turn and per agent. Without numbers, every refactor is a guess.
- **Treat tokens like SQL queries.** A bad query in a loop is the same failure mode as a bloated tool result in an agent loop.
- **Bound autonomy with budgets, not vibes.** Max steps, max tokens, max thinking — explicit, versioned, in the prompt.

The folders below ([§6 Folder Map](#folder-map)) make the *input* and *output* sides of this bubble measurable on toy datasets, so the same instinct can be applied at production scale.

---

## Folder Map

| Folder | What it demonstrates |
|--------|----------------------|
| [`0-Data-Input/`](./0-Data-Input/) | **Input side of the black box.** Token cost of the same dataset in 8 formats. CSV wins at 80 tokens; raw-byte JPEG explodes to 43,217. Bytes ≠ tokens. |
| [`1-Data-Output/`](./1-Data-Output/) | **Output side of the black box.** Token cost of the *same trivial class* generated in 5 languages. F# at 28 tokens; Java at 119. Idiomatic choice has a measurable price. |
| [`2-DAC/`](./2-DAC/) | **Document-as-Code in practice.** A .NET 10 Minimal API (`ContextManager.Api`) shipped with a technical analysis + a functional analysis split into chapters, and an ignored `.workspace/` that hosts user stories, analyses, and plans for Tasks and PRs. The README *is* the spec of the API. |
| [`3-going-local/`](./3-going-local/) | **DaC on a Node/TS stack.** Context7 MCP server + local web UI sharing one application layer. Ships its own pricing-bubble section showing how a local Context7 endpoint becomes a lever to control what enters (or stays out of) the cached prefix. |
| [`4-ai-company/`](./4-ai-company/) | **README as a citable knowledge artifact.** Research note on AI adoption vs. policy gap in Italian companies (Salesforce/LineaEDP, key4biz, AI Act, Law 132/2025). Shows that a Markdown file in the repo can carry sourced claims — the same shape an agent can consume as grounded context. |
