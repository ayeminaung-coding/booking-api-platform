# Quality Gate Review

Reviewed the API against `quality_gate.md` after the minute-30 snapshot (commit `6d68299`).

| Quality Gate area | Finding | Action taken | Evidence |
|---|---|---|---|
| Accuracy | `PATCH /api/bookings/:id` with a non-object JSON body (e.g. `[]`) returned `200` and silently "succeeded" with no change. | Added a JSON-object check to POST and PATCH bodies; non-object bodies now return `400 {"error":"Body must be a JSON object"}`. | `curl -X PATCH ... -d '[]'` → `400 {"error":"Body must be a JSON object"}`; `curl -X POST ... -d '["not","an","object"]'` → same 400. Typecheck passes; other tests unchanged. |
| Reliability | Update-time overlap with a *different* booking was not covered by the cURL guide; also unclear whether a booking ending exactly when another starts conflicts. | Tested both cases manually: PATCH moving a booking onto another one returns `409`; adjacent bookings (`end == start`) are allowed and now documented in README. | `PATCH {"startAt":"...09:30"}` on a booking adjacent to one 09:00–10:00 → `409`. POST of a booking starting exactly at another's endAt → `201`. |
| Reasoning / You Own It | README did not state the edge-time policy, so a marker could think `endAt == startAt` should conflict. | Documented in README: overlap uses strict inequality; adjacent bookings allowed. Added rationale for 400 vs 404 vs 409 in the contract section. | README "Design decisions / assumptions" section; verified by the adjacent-booking test above. |

## Re-test after fixes

- `npm run typecheck` — passes.
- Full curl pass (list, create, get, patch, delete, 400 invalid range, 400 unknown equipment, 404, 409 overlap) — all still correct; see `TEST_EVIDENCE.md`.

## Submission Decision

READY — all required deliverables are complete, tests pass, and each design decision above can be explained.
