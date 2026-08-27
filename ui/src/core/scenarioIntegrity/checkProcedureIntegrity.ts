// src/core/scenarioIntegrity/checkProcedureIntegrity.ts

import { procedureCatalog } from "../procedureCatalog";
import { SCENARIO_REGISTRY } from "../scenarioRegistry";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

type UnknownProcedureStep = {
  command?: unknown;
  preview?: unknown;
};

type UnknownScenario = {
  procedure?: readonly UnknownProcedureStep[];
};

export const checkProcedureIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Procedure Integrity Inspector",
    area: "procedure",

    run: (): readonly IntegrityFinding[] => {
      const findings: IntegrityFinding[] = [];

      const registry =
        SCENARIO_REGISTRY as unknown as Record<
          string,
          UnknownScenario
        >;

      for (const [scenarioId, scenario] of Object.entries(
        registry
      )) {
        if (!Array.isArray(scenario.procedure)) {
          continue;
        }

        for (const step of scenario.procedure) {
          if (typeof step.command !== "string") {
            findings.push({
              severity: "error",
              area: "procedure",
              code: "PROCEDURE_ORPHANED",
              scenarioId,
              source:
                "scenarioRegistry.ts → procedureCatalog.ts",
              message:
                "Scenario procedure step does not contain a valid command.",
            });

            continue;
          }

          if (
            !Object.prototype.hasOwnProperty.call(
              procedureCatalog,
              step.command
            )
          ) {
            findings.push({
              severity: "error",
              area: "procedure",
              code: "PROCEDURE_ORPHANED",
              scenarioId,
              command: step.command,
              source:
                "scenarioRegistry.ts → procedureCatalog.ts",
              message:
                "Scenario procedure command does not exist in procedureCatalog.",
            });
          }
        }
      }

      return findings;
    },
  };