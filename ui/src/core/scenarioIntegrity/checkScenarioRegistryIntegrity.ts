// src/core/scenarioIntegrity/checkScenarioRegistryIntegrity.ts

import { SCENARIO_IDS } from "../scenarios";
import { SCENARIO_REGISTRY } from "../scenarioRegistry";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

type UnknownScenario = Record<string, unknown>;

function isNonEmptyString(
  value: unknown
): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isNonEmptyArray(value: unknown): boolean {
  return Array.isArray(value) && value.length > 0;
}

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export const checkScenarioRegistryIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Scenario Registry Inspector",
    area: "scenario_registry",

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
          findings.push({
            severity: "error",
            area: "scenario_registry",
            code: "SCENARIO_ID_MISSING_FROM_REGISTRY",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Declared Scenario ID has no registry entry.",
          });

          continue;
        }

        if (!isNonEmptyString(scenario.label)) {
          findings.push({
            severity: "error",
            area: "scenario_registry",
            code: "SCENARIO_LABEL_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario label is missing or empty.",
          });
        }

        if (!isNonEmptyString(scenario.startPrompt)) {
          findings.push({
            severity: "error",
            area: "scenario_registry",
            code: "SCENARIO_PROMPT_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario start prompt is missing or empty.",
          });
        }

        if (!isNonEmptyString(scenario.scenarioType)) {
          findings.push({
            severity: "error",
            area: "scenario_registry",
            code: "SCENARIO_TYPE_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario type is missing or empty.",
          });
        }

        if (!isNonEmptyString(scenario.category)) {
          findings.push({
            severity: "error",
            area: "scenario_registry",
            code: "SCENARIO_CATEGORY_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario category is missing or empty.",
          });
        }

        if (!isNonEmptyArray(scenario.procedure)) {
          findings.push({
            severity: "error",
            area: "scenario_registry",
            code: "SCENARIO_PROCEDURE_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario procedure is missing or empty.",
          });
        }

        if (!isNonEmptyArray(scenario.proofLines)) {
          findings.push({
            severity: "error",
            area: "scenario_registry",
            code: "SCENARIO_PROOF_LINES_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario proof lines are missing or empty.",
          });
        }

        if (!isNonEmptyArray(scenario.successLines)) {
          findings.push({
            severity: "error",
            area: "scenario_registry",
            code: "SCENARIO_SUCCESS_LINES_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario success lines are missing or empty.",
          });
        }

        if (
          typeof scenario.defaults !== "object" ||
          scenario.defaults === null
        ) {
          findings.push({
            severity: "error",
            area: "scenario_registry",
            code: "SCENARIO_DEFAULTS_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario default facts are missing.",
          });
        }

        if (!isRecord(scenario.previewMetadata)) {
  findings.push({
    severity: "error",
    area: "preview",
    code: "SCENARIO_PREVIEW_METADATA_MISSING",
    scenarioId,
    source: "scenarioRegistry.ts",
    message:
      "Scenario preview metadata is missing.",
  });

  continue;
}

const preview = scenario.previewMetadata;

if (!isNonEmptyString(preview.description)) {
  findings.push({
    severity: "error",
    area: "preview",
    code: "SCENARIO_PREVIEW_DESCRIPTION_MISSING",
    scenarioId,
    source: "scenarioRegistry.ts",
    message:
      "Scenario preview description is missing or empty.",
  });
}

if (!isNonEmptyArray(preview.skillFocus)) {
  findings.push({
    severity: "error",
    area: "preview",
    code: "SCENARIO_PREVIEW_SKILL_FOCUS_MISSING",
    scenarioId,
    source: "scenarioRegistry.ts",
    message:
      "Scenario preview skill focus is missing or empty.",
  });
}

if (!isNonEmptyString(preview.scenarioContext)) {
  findings.push({
    severity: "error",
    area: "preview",
    code: "SCENARIO_PREVIEW_CONTEXT_MISSING",
    scenarioId,
    source: "scenarioRegistry.ts",
    message:
      "Scenario preview context is missing or empty.",
  });
}

if (!isNonEmptyString(preview.successOutcome)) {
  findings.push({
    severity: "error",
    area: "preview",
    code: "SCENARIO_PREVIEW_SUCCESS_OUTCOME_MISSING",
    scenarioId,
    source: "scenarioRegistry.ts",
    message:
      "Scenario preview success outcome is missing or empty.",
  });
}

        if (!isNonEmptyString(preview.selectCommand)) {
          findings.push({
            severity: "error",
            area: "preview",
            code: "SCENARIO_PREVIEW_SELECT_COMMAND_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario preview select command is missing or empty.",
          });
        }
      }

      return findings.filter(
        (finding) => finding.area === "scenario_registry"
      );
    },
};

export const checkScenarioPreviewIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Scenario Preview Inspector",
    area: "preview",

    run: (): readonly IntegrityFinding[] => {
      const findings: IntegrityFinding[] = [];

      const registry =
        SCENARIO_REGISTRY as unknown as Record<
          string,
          UnknownScenario
        >;

      for (const scenarioId of SCENARIO_IDS) {
        const scenario = registry[scenarioId];

        if (!scenario || !isRecord(scenario.previewMetadata)) {
          findings.push({
            severity: "error",
            area: "preview",
            code: "SCENARIO_PREVIEW_METADATA_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario preview metadata is missing.",
          });

          continue;
        }

        const preview = scenario.previewMetadata;

        if (!isNonEmptyString(preview.description)) {
          findings.push({
            severity: "error",
            area: "preview",
            code: "SCENARIO_PREVIEW_DESCRIPTION_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario preview description is missing or empty.",
          });
        }

        if (!isNonEmptyArray(preview.skillFocus)) {
          findings.push({
            severity: "error",
            area: "preview",
            code: "SCENARIO_PREVIEW_SKILL_FOCUS_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario preview skill focus is missing or empty.",
          });
        }

        if (!isNonEmptyString(preview.scenarioContext)) {
          findings.push({
            severity: "error",
            area: "preview",
            code: "SCENARIO_PREVIEW_CONTEXT_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario preview context is missing or empty.",
          });
        }

        if (!isNonEmptyString(preview.successOutcome)) {
          findings.push({
            severity: "error",
            area: "preview",
            code: "SCENARIO_PREVIEW_SUCCESS_OUTCOME_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario preview success outcome is missing or empty.",
          });
        }

        if (!isNonEmptyString(preview.selectCommand)) {
          findings.push({
            severity: "error",
            area: "preview",
            code: "SCENARIO_PREVIEW_SELECT_COMMAND_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario preview select command is missing or empty.",
          });
        }
      }

      return findings;
    },
};

export const checkCompletionIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Completion Wiring Inspector",
    area: "completion",

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

        if (!isRecord(scenario.completion)) {
          findings.push({
            severity: "error",
            area: "completion",
            code: "SCENARIO_COMPLETION_METADATA_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario completion metadata is missing.",
          });

          continue;
        }

        const completion = scenario.completion;

        if (!isNonEmptyString(completion.command)) {
          findings.push({
            severity: "error",
            area: "completion",
            code: "COMPLETION_COMMAND_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario completion command is missing or empty.",
          });
        }

        if (!isNonEmptyString(completion.fact)) {
          findings.push({
            severity: "error",
            area: "completion",
            code: "COMPLETION_FACT_MISSING",
            scenarioId,
            source: "scenarioRegistry.ts",
            message:
              "Scenario completion fact is missing or empty.",
          });
        }

        if (
          isNonEmptyString(completion.command) &&
          Array.isArray(scenario.procedure)
        ) {
          const procedureCommands = scenario.procedure
            .filter(isRecord)
            .map((step) => step.command)
            .filter(isNonEmptyString);

          if (!procedureCommands.includes(completion.command)) {
            findings.push({
              severity: "error",
              area: "completion",
              code: "COMPLETION_COMMAND_MISSING",
              scenarioId,
              command: completion.command,
              source: "scenarioRegistry.ts",
              message:
                "Scenario completion command does not appear in the procedure.",
            });
          }
        }

        if (
          isNonEmptyString(completion.fact) &&
          isRecord(scenario.defaults)
        ) {
          if (
            !Object.prototype.hasOwnProperty.call(
              scenario.defaults,
              completion.fact
            )
          ) {
            findings.push({
              severity: "error",
              area: "completion",
              code: "COMPLETION_FACT_MISSING",
              scenarioId,
              fact: completion.fact,
              source: "scenarioRegistry.ts",
              message:
                "Scenario completion fact does not exist in default facts.",
            });
          }
        }
      }

      return findings;
    },
};