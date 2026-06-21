\# SEALED — Core Invariants (Helpdesk Sim)



\## Sealed today

\- Parser labels intent only (text -> Command). No legitimacy, no mutation.

\- Decide is the authority gate (ALLOW plan / DENY reason). No mutation.

\- Execute converts an authorized plan into a StatePatch. No mutation.

\- Update (applyPatch) is the only place state changes.



\## Control-plane rules

\- Unknown commands are denied and must not mutate state.

\- START is only allowed from LOBBY and creates a new attempt; sets RUNNING.

\- RESTART is denied in LOBBY (nothing to restart).

\- QUIT is denied in LOBBY; when allowed it returns to LOBBY and clears attempt.



\## Return trigger (when reopening is allowed)

\- If a new feature cannot be expressed as:

&nbsp; parse -> decide -> execute -> update

&nbsp; without breaking “Update-only mutation”.

\- If we need an output channel beyond StatePatch (e.g., help/status text).



Clean stop #1: SEALED.md exists and contains only truths you can cold-test.



2\) Regression Oracle Mode (3 minutes)



Goal: Turn ChatGPT into a “does this threaten invariants?” checker.



Do (prompt you keep using):



“Here are my sealed invariants (paste SEALED.md). I want to add X. Which invariants does it threaten and where would the leak show up?”



i want to add help/status which invariants does it threaten and where would a leak show up




Adding help/status threatens exactly these invariants. I’ll tell you (1) what gets threatened, (2) what the “leak” looks like in the product, and (3) the earliest place you’ll notice it.



Invariants help/status can threaten

1\) Truth Boundary



Invariant: UI reports state; it does not create truth or interpretation.

Threat: “Status” turns into “meaning.”

Leak shows up as: copy that interprets (“you’re close”, “this is almost right”, “try again”) instead of reports (“Attempt=FAILED, reason=…”)

Earliest symptom: you start writing status strings that contain advice words: “should, try, next, close, likely.”



2\) Non-Coaching Certification



Invariant: The sim certifies behavior; it doesn’t teach behavior during the attempt.

Threat: help becomes a tutor.

Leak shows up as: users can pass by following prompts instead of understanding.

Earliest symptom: users who didn’t understand can still advance reliably.



3\) Error Dominance (sticky failure)



Invariant: failure persists; success can’t overwrite it within the same attempt.

Threat: “help” acts like a soft reset or a workaround.

Leak shows up as: help causes the user to do a tiny change and “recover” without resetting attempt boundaries.

Earliest symptom: you feel tempted to add “Try again” / “Here’s what to check” inside the same attempt after failure.



4\) Attempt vs Execution Separation



Invariant: attempts are judged; executions are just events.

Threat: status begins to react to micro-events and nudges behavior mid-flight.

Leak shows up as: the UI starts coaching during execution (“that command didn’t work; try sudo”) instead of evaluating the attempt result after.

Earliest symptom: you add real-time hints tied to individual command outputs.



5\) Single Source of Truth



Invariant: one authority decides progress and outcome.

Threat: UI help/status creates a second “judge” (implicit scoring) via messaging.

Leak shows up as: mismatch between engine decision and UI messaging (“Engine says FAIL but UI says ‘almost’ / suggests next step”).

Earliest symptom: you need special UI logic like if (error) showHelpfulCopy().



6\) No Side-Channels



Invariant: the user must infer from allowed signals only (logs/state), not from hidden evaluator knowledge.

Threat: status reveals internal evaluation (“you missed one required check”).

Leak shows up as: “oracle hints” that expose what the validator is looking for.

Earliest symptom: help text references exact missing items.



7\) Progress Gating Integrity



Invariant: advancement is earned by meeting objective conditions.

Threat: help creates “completion by compliance” (do steps in order, pass) rather than competence.

Leak shows up as: users optimize for the checklist instead of the outcome.

Earliest symptom: your help starts listing “Step 1, Step 2, Step 3…” during an attempt.



Where leaks show up first (practical)



In this order:



Copywriting leak: the text itself starts becoming advice.



UI logic leak: you add conditional hint logic based on engine state.



Behavioral leak: users pass without understanding; they can’t generalize.



Architectural leak: you need exceptions (“unless user is stuck then…”), then invariants rot.



The simplest “Leak Detector” you can apply to every help/status string



If the string answers any of these, it’s a leak:



“What should I do next?”



“What does the engine want?”



“How do I fix it?”



“Am I close?”



Allowed strings answer only:



“What is true right now?”



“What rule is the system enforcing?”



“What is locked/unlocked?”





--------------------------------------------------------------



Concrete templates you can copy

help output template (safe)



Commands:



ls — list files



cat <file> — print file



systemctl status <svc> — show service state



journalctl -u <svc> — show logs



ping <host> — connectivity test



dig <name> — DNS lookup



Notes:



“Commands may fail depending on permissions/tools installed.”



(No “use this when…”)



status output template (safe)



Scenario: Password Reset Ticket #14



Phase: verify\_identity



Attempt: 2



Progress: not eligible to resolve



Locks: resolution\_locked (reason: missing\_verification)



Policy: no password disclosure



Notice: it doesn’t tell them how to verify identity—just that verification is required.



The hard line you never cross



Help/status must not become “adaptive hints.”



If you ever catch yourself adding:



“Try…”



“Next…”



“You should…”



“Common mistake is…”

inside help or status



That’s your leak.

---------------------------------------------------------------------------------------

















