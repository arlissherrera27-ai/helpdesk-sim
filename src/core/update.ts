import { LogEvent, SimState, StatePatch } from "./types";
import { newAttemptId } from "./state";

// State Updater: the ONLY place state is mutated (via producing a new state object).
export function applyPatch(
  state: SimState,
  patch: StatePatch,
  logEvent?: LogEvent,
): SimState {
  const next: SimState = {
    ...state,
    // apply simple patch fields explicitly (and only those)
    ...(patch.executionState !== undefined ? { executionState: patch.executionState } : {}),
    ...(patch.error !== undefined ? { error: patch.error } : {}),
    ...(patch.result !== undefined ? { result: patch.result } : {}),
    ...(patch.attempt !== undefined ? { attempt: patch.attempt } : {}),
    ...(patch.scenario !== undefined ? { scenario: patch.scenario } : {}),
    ...(patch.scenarioFacts !== undefined ? { scenarioFacts: patch.scenarioFacts } : {}),
    runLog: logEvent ? [...state.runLog, logEvent] : state.runLog,
  };

  if (patch.newAttempt) {
    next.attempt = {
      id: newAttemptId(),
      number: patch.newAttempt.number,
    };
  }

  return next;
}