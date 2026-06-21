import type { SimState } from "./types";

// Initial truth: no scenario selected, no attempt running
export function initialState(): SimState {
  return {
    scenario: null,
    previewScenario: null,
    scenarioFacts: null,
    attempt: null,
    executionState: "LOBBY",
    error: null,
    result: null,
    runLog: [],
    mode: "practice",
    assessmentIntegrity: "maintained",
    procedureHelpOpenedCount: 0,
    procedureHelpUsedDuring: [],
  };
}

// Minimal unique-ish id for now (good enough for first slice proof)
export function newAttemptId(): string {
  return `att_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}
