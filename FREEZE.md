\# ARCHITECT FREEZE — ReadOnly Help/Status Lane



Date: 2026-02-12

Phase sealed: Step 3B–3C (Decision/Plan + Engine gating)

Scope: ReadOnly commands (help, status) — no UI, no mutation



\## What was implemented (sealed)

\- `help` and `status` are parsed into real Commands (not unknown).

\- `decide.ts` authorizes them as ReadOnly plans:

&nbsp; - ALLOW → { kind: "ReadOnly", view: "HELP" }

&nbsp; - ALLOW → { kind: "ReadOnly", view: "STATUS" }

\- `engine.ts` enforces lane separation:

&nbsp; - ReadOnly plans exit early (return message; no execute; no update).

&nbsp; - Mutation plans proceed (execute → update).

\- `index.ts` is a thin harness:

&nbsp; - Always calls `handleInput`

&nbsp; - Never runs parse/decide/execute/update directly



\## Locked invariants (do not violate)

1\) `index.ts` MUST NOT bypass `handleInput` (no direct calls to parse/decide/execute/update).

2\) ReadOnly plans MUST NOT reach `execute.ts` or `update.ts`.

3\) State mutation MUST only occur via `applyPatch` on mutation lane.

4\) `decide.ts` does legitimacy only; no execution or mutation.

5\) `engine.ts` is the only routing/gating point between intent and action.



\## Regression oracle (must stay passing)

Run `npm start`, then:

\- `help` prints `VIEW: HELP` and STATE stays unchanged (LOBBY)

\- `status` prints `VIEW: STATUS` and STATE stays unchanged (LOBBY)

\- No crashes

\- Existing mutation commands still work (e.g., `start` changes state appropriately)



\## Explicitly NOT done (out of scope)

\- No UI rendering

\- No help/status content text

\- No scenario rules changes

\- No changes to mutation behavior beyond ReadOnly gating



\## Re-open trigger (allowed next step)

Step 3D — ReadOnly presentation mapping:

\- Add a PURE renderer/mapping for ReadOnly views (HELP/STATUS) that returns message text

\- Still no state mutation

\- Still no UI layer changes beyond printing message



