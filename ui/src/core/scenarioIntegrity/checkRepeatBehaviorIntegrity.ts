// src/core/scenarioIntegrity/checkRepeatBehaviorIntegrity.ts

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

function stableSerialize(value: unknown): string {
  return JSON.stringify(value);
}

export const checkRepeatBehaviorIntegrity:
ArchitectureIntegrityCheck = {
  name: "Repeat Behavior Inspector",
  area: "repeat_behavior",

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
        scenario.procedure.length === 0 ||
        !isNonEmptyString(
          scenario.previewMetadata?.selectCommand
        )
      ) {
        continue;
      }

      let state = initialState();

      const selectionOutput = handleInput(
        state,
        scenario.previewMetadata.selectCommand
      );

      if (selectionOutput.decision.kind === "DENY") {
        continue;
      }

      state = selectionOutput.state;

      const startOutput = handleInput(
        state,
        "start"
      );

      if (startOutput.decision.kind === "DENY") {
        continue;
      }

      state = startOutput.state;

      for (
        let index = 0;
        index < scenario.procedure.length;
        index += 1
      ) {
        const step = scenario.procedure[index];

        if (!isNonEmptyString(step.command)) {
          continue;
        }

        // Execute the legitimate procedure occurrence first.
        const legitimateOutput = handleInput(
          state,
          step.command
        );

        if (legitimateOutput.decision.kind === "DENY") {
          break;
        }

        state = legitimateOutput.state;

        // If the legitimate command completed the scenario,
        // there is no RUNNING state left in which to test
        // an immediate duplicate.
        if (state.result?.completion === "PASS") {
          break;
        }

        const beforeFacts =
          stableSerialize(state.scenarioFacts);

        const beforeResult =
          stableSerialize(state.result);

        // Immediately attack the completed step with
        // the exact same command.
        const repeatOutput = handleInput(
          state,
          step.command
        );

        if (repeatOutput.decision.kind !== "DENY") {
          findings.push({
            severity: "error",
            area: "repeat_behavior",
            code: "REPEAT_COMMAND_ALLOWED",
            scenarioId,
            command: step.command,
            source: "engine.ts",
            message:
              `Immediate repeat of completed procedure command "${step.command}" was allowed at procedure position ${index + 1}.`,
          });
        }

        const afterFacts =
          stableSerialize(
            repeatOutput.state.scenarioFacts
          );

        const afterResult =
          stableSerialize(
            repeatOutput.state.result
          );

        if (beforeFacts !== afterFacts) {
          findings.push({
            severity: "error",
            area: "repeat_behavior",
            code:
              "REPEAT_SCENARIO_STATE_MUTATED",
            scenarioId,
            command: step.command,
            source: "engine.ts",
            message:
              `Immediate repeat of completed procedure command "${step.command}" changed scenario facts.`,
          });
        }

        if (beforeResult !== afterResult) {
          findings.push({
            severity: "error",
            area: "repeat_behavior",
            code: "REPEAT_RESULT_MUTATED",
            scenarioId,
            command: step.command,
            source: "engine.ts",
            message:
              `Immediate repeat of completed procedure command "${step.command}" changed scenario result state.`,
          });
        }

        if (
          repeatOutput.state.result?.completion &&
          repeatOutput.state.result?.completion !==
            state.result?.completion
        ) {
          findings.push({
            severity: "error",
            area: "repeat_behavior",
            code: "REPEAT_CAUSED_COMPLETION",
            scenarioId,
            command: step.command,
            source: "engine.ts",
            message:
              `Immediate repeat of completed procedure command "${step.command}" changed scenario completion.`,
          });
        }

        // Continue from the legitimate state,
        // NOT from the denied repeat attempt.
      }
    }

    return findings;
  },
};