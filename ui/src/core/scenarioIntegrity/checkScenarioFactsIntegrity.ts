// src/core/scenarioIntegrity/checkScenarioFactsIntegrity.ts

import { SCENARIO_IDS } from "../scenarios";
import { SCENARIO_REGISTRY } from "../scenarioRegistry";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

type UnknownScenario = Record<string, unknown>;
type UnknownFacts = Record<string, unknown>;

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export const checkScenarioFactsIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Scenario Facts Inspector",
    area: "scenario_facts",

    run: (): readonly IntegrityFinding[] => {
      const findings: IntegrityFinding[] = [];

      const registry =
        SCENARIO_REGISTRY as unknown as Record<
          string,
          UnknownScenario
        >;

      for (const scenarioId of SCENARIO_IDS) {
        const scenario = registry[scenarioId];

        if (!scenario) {
          continue;
        }

        if (!isRecord(scenario.defaults)) {
          findings.push({
            severity: "error",
            area: "scenario_facts",
            code: "SCENARIO_FACTS_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario default facts are missing.",
          });

          continue;
        }

        const defaults =
          scenario.defaults as UnknownFacts;

        if (defaults.kind !== scenarioId) {
          findings.push({
            severity: "error",
            area: "scenario_facts",
            code: "SCENARIO_FACT_KIND_MISMATCH",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              `Scenario defaults kind "${String(
                defaults.kind
              )}" does not match scenario ID "${scenarioId}".`,
          });
        }
      }

      return findings;
    },
};