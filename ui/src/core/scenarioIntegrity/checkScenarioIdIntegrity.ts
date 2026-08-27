// src/core/scenarioIntegrity/checkScenarioIdIntegrity.ts

import { SCENARIO_IDS } from "../scenarios";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

function findDuplicateScenarioIds(): string[] {
  const seen = new Set<string>();
  const duplicates = new Set<string>();

  for (const scenarioId of SCENARIO_IDS) {
    if (seen.has(scenarioId)) {
      duplicates.add(scenarioId);
    }

    seen.add(scenarioId);
  }

  return [...duplicates];
}

export const checkScenarioIdIntegrity: ArchitectureIntegrityCheck = {
  name: "Scenario ID Integrity",
  area: "scenario_id",

  run: (): readonly IntegrityFinding[] => {
    const findings: IntegrityFinding[] = [];

    for (const scenarioId of findDuplicateScenarioIds()) {
      findings.push({
        severity: "error",
        area: "scenario_id",
        code: "SCENARIO_ID_DUPLICATE",
        scenarioId,
        source: "scenarios.ts",
        message:
          "Scenario ID appears more than once in SCENARIO_IDS.",
      });
    }

    return findings;
  },
};

