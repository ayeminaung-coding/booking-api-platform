# AI Usage Log

AI assistant was used during this lab test. Below is a record of important prompts, what was used from the responses, and what I verified myself.

| # | Prompt (summary) | What I used | What I verified myself |
|---|---|---|---|
| 1 | Asked the assistant to review `exam_brief_en.md` and `rubric_en.md` | Summary of task, contract, grading areas | Re-read both files to confirm contract details (status codes, error format, overlap rule, submission list) |
| 2 | Asked the assistant to begin implementing the booking API and explain the implementation afterward | Project scaffold modeled on assignment_2 (Hono + D1 + wrangler), `src/index.ts` draft | Read every route; ran `npm run typecheck`; started server and curl-tested each endpoint |
| 3 | Asked for instructions to test the API endpoints | `curl` command examples | Executed each curl myself and checked status codes/JSON |
| 4 | Asked whether the API was connected to Cloudflare D1 storage | Clarification that `wrangler dev` + `--local` uses local SQLite-backed D1, not remote | Checked `wrangler.toml` and ran migration locally |
| 5 | Asked the assistant to write the project documentation | Draft structure for `README.md`, `TEST_EVIDENCE.md`, `AI_LOG.md` | Reviewed all generated text against the actual code and contract |
| 6 | Provided `curl_test_guide.md` and `quality_gate.md` | The required QUALITY_GATE_REVIEW format and test ideas | Ran the edge-case probes myself, applied the code fix, and wrote review rows from observed results |

## Key decisions I made / can explain

- Overlap condition: `existing.start_at < new.end_at AND new.start_at < existing.end_at` on the same equipment; the booking itself is excluded on PATCH.
- PATCH validates the merged result (existing fields + provided fields), so an update can't create an invalid or overlapping booking.
- Dates are normalized via `new Date(...).toISOString()` before validation/storage so mixed ISO formats compare correctly.
- 400 vs 404 vs 409: 400 for bad/missing input, 404 for unknown booking id, 409 for time conflicts.
- All queries use parameter binding (`.bind(...)`), never string concatenation with request data.
