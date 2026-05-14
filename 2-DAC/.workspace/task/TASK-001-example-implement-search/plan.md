# TASK-001 — Plan

## Implementation steps

1. **Extend `IContextStore`** with a `Search(Guid contextId, string query)` method returning `IReadOnlyCollection<Snippet>`.
2. **Implement the match in `InMemoryContextStore`**:
   - if the Context does not exist → empty array (the endpoint handles the 404 upstream);
   - if `query` is empty or whitespace → return all Snippets of the Context;
   - otherwise, case-insensitive `Contains` filter on `Title`, `Content`, and on at least one `Tag`.
3. **Add the endpoint** `GET /contexts/{contextId:guid}/search` in `SnippetEndpoints.cs`:
   - 404 if the Context does not exist;
   - 200 with array (possibly empty) otherwise.
4. **Update `BR-007`** in `05-business-rules.md` to reflect the three-field match.
5. **Verify via curl** the behavior on the three branches (match, no match, empty query).

## Verification checklist

- [ ] Build passes: `dotnet build`.
- [ ] App starts without errors: `dotnet run`.
- [ ] `POST /contexts` → returns an id.
- [ ] `POST /contexts/{id}/snippets` with tags `["setup", "git"]` → 201.
- [ ] `GET /contexts/{id}/search?q=git` → contains the snippet just created.
- [ ] `GET /contexts/{id}/search?q=GIT` → same result (case-insensitive).
- [ ] `GET /contexts/{id}/search` (no `q`) → returns the full list.
- [ ] `GET /contexts/{non-existent-guid}/search?q=x` → 404.

## Estimate

Implementation: ~30 min. Manual verification + doc update: ~20 min. Total ~1h.

## Not in scope

- Automated tests (no test project in this demo).
- Result ranking.
- Pagination.
- Cross-Context search.
