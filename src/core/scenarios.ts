// src/core/scenarios.ts
// Domain source of truth for valid scenario IDs.

export const SCENARIO_IDS = ["password_reset"] as const;

export type ScenarioId = (typeof SCENARIO_IDS)[number];

export function isValidScenarioId(id: string): id is ScenarioId {
  return (SCENARIO_IDS as readonly string[]).includes(id);
}