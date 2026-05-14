# PR-001 — Search Snippets by tag

## User Story

**As a** Context Curator (A1)
**I want** to be able to search Snippets also by tag, beyond title and content,
**so that** I can quickly find fragments I categorized with recurring labels without having to remember the exact word inside the text.

## Acceptance criteria

- [x] Search on `/contexts/{id}/search?q=...` also considers a match on the Snippet tags.
- [x] Tag match is case-insensitive, consistent with the match on `Title` and `Content`.
- [x] An empty or absent query keeps returning all Snippets (`BR-008`).
- [x] The rule is documented as `BR-007` in the functional analysis.

## Notes

Feature already present in the initial version: this PR is a teaching example showing the format.

## References

- Use case: [`UC-007`](../../../docs/functional-analysis/04-use-cases.md#uc-007--search-snippets-inside-a-context)
- Rule: [`BR-007`](../../../docs/functional-analysis/05-business-rules.md#br-007--search-match)
- Associated task: `TASK-001-example-implement-search`
