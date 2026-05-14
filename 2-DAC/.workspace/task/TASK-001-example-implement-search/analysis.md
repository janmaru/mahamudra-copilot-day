# TASK-001 — Analysis: implementing search inside a Context

## Goal

Implement a `GET /contexts/{id}/search?q=...` endpoint returning the Snippets of the Context whose content matches the query.

## Context

- The domain is described in [`02-glossary.md`](../../../docs/functional-analysis/02-glossary.md).
- The use case is [`UC-007`](../../../docs/functional-analysis/04-use-cases.md#uc-007--search-snippets-inside-a-context).
- The relevant business rules are `BR-007`, `BR-008`, `BR-009`.

## Decision space

| Aspect | Options | Decision |
|--------|---------|----------|
| Match algorithm | Substring `Contains` / Prefix / Full-text with stemming | `Contains` case-insensitive — sufficient for the expected volume, trivial to document |
| Fields to match | Only `Title` / `Title + Content` / `Title + Content + Tags` | All three — consistent with how users think about "search" |
| Empty query handling | 400 error / Empty list / All snippets | All snippets — useful as *enumerate-all*, consistent with `BR-008` |
| Cross-Context search | Yes / No | No — violates isolation `BR-009`, out of scope |
| Pagination | Yes / No | No in this iteration — small volumes |
| State persistence | EF/SQLite / In-memory | In-memory already chosen at architecture level |

## Risks

- **Performance.** O(n) scan over the collection. Acceptable up to a few thousand Snippets per Context; beyond that, consider indexes.
- **Accents / Unicode.** `string.Contains(StringComparison.OrdinalIgnoreCase)` does not normalize diacritics. Made explicit in `BR-007`.
- **Tags with spaces.** Not a risk: `Contains` on tags works even with tags containing spaces.

## Constraints

- No additional NuGet packages.
- No changes to the contract of other endpoints.
- Isolated change to `IContextStore` + new endpoint only.

## Expected output

A `plan.md` with implementation steps and verification points.
