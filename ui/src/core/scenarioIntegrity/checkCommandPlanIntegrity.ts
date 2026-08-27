// src/core/scenarioIntegrity/checkCommandPlanIntegrity.ts

import { procedureCatalog } from "../procedureCatalog";
import { SCENARIO_REGISTRY } from "../scenarioRegistry";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

function hasProcedurePlan(command: string): boolean {
  return Object.prototype.hasOwnProperty.call(
    procedureCatalog,
    command
  );
}

export const checkCommandPlanIntegrity: ArchitectureIntegrityCheck = {
  name: "Command Plan Integrity",
  area: "command",

  run: (): readonly IntegrityFinding[] => {
    const findings: IntegrityFinding[] = [];

    for (const [scenarioId, scenario] of Object.entries(
      SCENARIO_REGISTRY
    )) {
      for (const step of scenario.procedure) {
        if (hasProcedurePlan(step.command)) {
          continue;
        }

        findings.push({
          severity: "error",
          area: "command",
          code: "COMMAND_PLAN_MISSING",

          scenarioId,
          command: step.command,

          source:
            "scenarioRegistry.ts → procedureCatalog.ts",

          message:
            "Scenario procedure command has no registered execution plan.",
        });
      }
    }

    return findings;
  },
};