// src/core/scenarioIntegrity/checkDecisionCoverageIntegrity.ts

import { procedureDecisionRegistry } from "../procedureDecisionRegistry";
import { scenarioDecisionRegistry } from "../scenarioDecisionRegistry";
import { SCENARIO_REGISTRY } from "../scenarioRegistry";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

type UnknownProcedureStep = {
  command?: unknown;
};

type UnknownScenario = {
  procedure?: readonly UnknownProcedureStep[];
};

type UnknownProcedureDecisionDefinition = {
  scenarios?: Record<string, unknown>;
};

type UnknownScenarioDecisionRegistry =
  Record<
    string,
    Record<string, unknown> | undefined
  >;

function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

/*
 * These commands are intentionally governed directly
 * by framework logic in decide.ts rather than either
 * decision registry.
 */
const FRAMEWORK_DECISION_COMMANDS =
  new Set<string>([
    "verify_identity",
  ]);

export const checkDecisionCoverageIntegrity:
ArchitectureIntegrityCheck = {
  name: "Procedure Decision Coverage Inspector",
  area: "decision_coverage",

  run: (): readonly IntegrityFinding[] => {
    const findings: IntegrityFinding[] = [];

    const scenarioRegistry =
      SCENARIO_REGISTRY as unknown as Record<
        string,
        UnknownScenario
      >;

    const procedureRegistry =
      procedureDecisionRegistry as unknown as Record<
        string,
        UnknownProcedureDecisionDefinition
      >;

    const scenarioRulesRegistry =
      scenarioDecisionRegistry as unknown as
        UnknownScenarioDecisionRegistry;

    for (
      const [scenarioId, scenario]
      of Object.entries(scenarioRegistry)
    ) {
      if (!Array.isArray(scenario.procedure)) {
        continue;
      }

      for (const step of scenario.procedure) {
        if (!isNonEmptyString(step.command)) {
          continue;
        }

        const command = step.command;

        /*
         * Framework-owned commands intentionally do
         * not require registry entries.
         */
        if (
          FRAMEWORK_DECISION_COMMANDS.has(command)
        ) {
          continue;
        }

        /*
         * Coverage path 1:
         * command-first procedure decision registry.
         */
        const procedureDefinition =
          procedureRegistry[command];

        const procedureScenarioRule =
          procedureDefinition
            ?.scenarios
            ?.[scenarioId];

        const hasProcedureDecision =
          typeof procedureScenarioRule ===
          "function";

        /*
         * Coverage path 2:
         * scenario-first decision registry.
         */
        const scenarioDecisionRule =
          scenarioRulesRegistry
            [scenarioId]
            ?.[command];

        const hasScenarioDecision =
          typeof scenarioDecisionRule ===
          "function";

        /*
         * A procedure step is structurally covered
         * when at least one explicit decision layer
         * owns that exact scenario-command pair.
         */
        if (
          hasProcedureDecision ||
          hasScenarioDecision
        ) {
          continue;
        }

        findings.push({
          severity: "error",
          area: "decision_coverage",
          code:
            procedureDefinition
              ? "PROCEDURE_DECISION_RULE_MISSING"
              : "PROCEDURE_DECISION_DEFINITION_MISSING",
          scenarioId,
          command,
          source:
            "procedureDecisionRegistry.ts / scenarioDecisionRegistry.ts",
          message:
            `Procedure command "${command}" has no explicit decision coverage for scenario "${scenarioId}" in either decision registry.`,
        });
      }
    }

    return findings;
  },
};