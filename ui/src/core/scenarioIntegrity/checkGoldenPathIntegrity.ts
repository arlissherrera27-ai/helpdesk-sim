// src/core/scenarioIntegrity/checkGoldenPathIntegrity.ts

import { handleInput } from "../engine";
import { SCENARIO_REGISTRY } from "../scenarioRegistry";
import { initialState } from "../state";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

type UnknownProcedureStep = {
  command?: unknown;
};

type UnknownScenario = {
  procedure?: readonly UnknownProcedureStep[];
  previewMetadata?: {
    selectCommand?: unknown;
  };
};

function isNonEmptyString(
  value: unknown
): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export const checkGoldenPathIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Golden Path Execution Inspector",
    area: "golden_path",

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
        if (
          !Array.isArray(scenario.procedure) ||
          !isNonEmptyString(
            scenario.previewMetadata?.selectCommand
          )
        ) {
          continue;
        }

        let state = initialState();

        // 1. Select the scenario through the real engine.
        const selectionOutput = handleInput(
          state,
          scenario.previewMetadata.selectCommand
        );

        if (selectionOutput.decision.kind === "DENY") {
          findings.push({
            severity: "error",
            area: "golden_path",
            code: "GOLDEN_PATH_SELECTION_DENIED",
            scenarioId,
            source: "engine.ts",
            message:
              "Golden-path runner could not select the scenario through the engine.",
          });

          continue;
        }

        state = selectionOutput.state;

        // 2. Start the scenario through the real engine.
        const startOutput = handleInput(
          state,
          "start"
        );

        if (startOutput.decision.kind === "DENY") {
          findings.push({
            severity: "error",
            area: "golden_path",
            code: "GOLDEN_PATH_START_DENIED",
            scenarioId,
            source: "engine.ts",
            message:
              "Golden-path runner selected the scenario but the engine denied start.",
          });

          continue;
        }

        state = startOutput.state;

        let scenarioFailed = false;

        // 3. Execute every declared procedure step.
        for (
          let index = 0;
          index < scenario.procedure.length;
          index += 1
        ) {
          const step = scenario.procedure[index];

          if (!isNonEmptyString(step.command)) {
            continue;
          }

          const output = handleInput(
            state,
            step.command
          );

          if (output.decision.kind === "DENY") {
            findings.push({
              severity: "error",
              area: "golden_path",
              code: "GOLDEN_PATH_STEP_DENIED",
              scenarioId,
              command: step.command,
              source: "engine.ts",
              message:
                `Golden-path command "${step.command}" was denied at procedure step ${index + 1}.`,
            });

            scenarioFailed = true;
            break;
          }

          state = output.state;

          const isFinalStep =
            index === scenario.procedure.length - 1;

          if (
            !isFinalStep &&
            state.result?.completion === "PASS"
          ) {
            findings.push({
              severity: "error",
              area: "golden_path",
              code: "GOLDEN_PATH_EARLY_PASS",
              scenarioId,
              command: step.command,
              source: "engine.ts",
              message:
                `Scenario reached PASS early at procedure step ${index + 1} using command "${step.command}".`,
            });

            scenarioFailed = true;
            break;
          }
        }

        // 4. The complete declared procedure must end in PASS.
        if (
          !scenarioFailed &&
          state.result?.completion !== "PASS"
        ) {
          findings.push({
            severity: "error",
            area: "golden_path",
            code: "GOLDEN_PATH_COMPLETION_MISSING",
            scenarioId,
            source: "engine.ts",
            message:
              "Golden-path procedure finished without producing PASS.",
          });
        }
      }

      return findings;
    },
  };