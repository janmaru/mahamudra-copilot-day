# 4 · Use cases

> Each use case is identified by `UC-NNN`. Cited business rules (`BR-NNN`) are defined in chapter 5.

## UC-001 — Create a Context

**Primary actor.** A1 Curator.

**Pre-conditions.** None.

**Main scenario.**

1. The curator sends the name and description of the new Context.
2. The system generates a unique identifier.
3. The system sets `CreatedAt` and `UpdatedAt` to the current moment.
4. The system returns the newly created Context with its empty list of snippets.

**Post-conditions.** The Context exists and is listed by UC-002.

**Applicable rules.** `BR-001`, `BR-002`.

---

## UC-002 — List Contexts

**Primary actor.** A1, A2, A3.

**Pre-conditions.** None.

**Main scenario.**

1. The actor requests the list.
2. The system returns **all** Contexts (no pagination, no filter).

**Post-conditions.** No state change.

---

## UC-003 — Retrieve a Context

**Primary actor.** A1, A2, A3.

**Pre-conditions.** The actor knows the `Id` of the Context.

**Main scenario.**

1. The actor requests the Context by `Id`.
2. The system returns the Context complete with its Snippets.

**Alternative scenario: Context does not exist.**

- 1a. The system signals that the requested Context does not exist and returns no data.

---

## UC-004 — Update a Context

**Primary actor.** A1.

**Pre-conditions.** The Context exists.

**Main scenario.**

1. The curator sends new values for name and description.
2. The system replaces both fields (`PUT` semantics is replace, not patch).
3. The system refreshes `UpdatedAt`.
4. The system returns the updated Context.

**Alternative scenario.** Context does not exist → see UC-003 alternative scenario.

**Applicable rules.** `BR-002`, `BR-003`.

---

## UC-005 — Delete a Context

**Primary actor.** A1.

**Pre-conditions.** The Context exists.

**Main scenario.**

1. The curator requests deletion of the Context by `Id`.
2. The system removes the Context and all its Snippets.

**Post-conditions.** The Context is no longer listed; UC-003 on the same `Id` returns *does not exist*.

**Applicable rules.** `BR-004`.

---

## UC-006 — Add a Snippet to a Context

**Primary actor.** A1.

**Pre-conditions.** The Context exists.

**Main scenario.**

1. The curator provides title, content, and (optionally) tags.
2. The system generates a unique identifier for the Snippet.
3. The system sets the Snippet `CreatedAt` to the current moment.
4. The system adds the Snippet to the Context.
5. The system refreshes `UpdatedAt` of the Context.

**Alternative scenario.** Context does not exist → operation rejected.

**Applicable rules.** `BR-005`, `BR-006`.

---

## UC-007 — Search Snippets inside a Context

**Primary actor.** A1, A2, A3.

**Pre-conditions.** The Context exists.

**Main scenario.**

1. The actor provides the Context `Id` and a search string.
2. The system returns all Snippets of the Context that satisfy the match rule (`BR-007`).

**Alternative scenario: empty or missing query.**

- 1a. The system returns **all** Snippets of the Context (equivalent to an enumeration).

**Alternative scenario: Context does not exist.**

- 1b. The system signals that the Context does not exist.

**Applicable rules.** `BR-007`, `BR-008`.
