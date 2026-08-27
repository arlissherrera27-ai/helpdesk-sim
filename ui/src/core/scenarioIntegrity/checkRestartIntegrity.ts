// src/core/scenarioIntegrity/checkRestartIntegrity.ts

import { handleInput } from "../engine";
import { initialState } from "../state";
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
  defaults?: unknown;
  previewMetadata?: {
    selectCommand?: unknown;
  };
};

function isNonEmptyString(
  value: unknown
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0
  );
}

function stableSerialize(
  value: unknown
): string {
  return JSON.stringify(value);
}

export const checkRestartIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Restart Reset Inspector",
    area: "restart",

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
          scenario.procedure.length < 2 ||
          !isNonEmptyString(
            scenario.previewMetadata?.selectCommand
          )
        ) {
          continue;
        }

        let state = initialState();

        const selectionOutput =
          handleInput(
            state,
            scenario.previewMetadata.selectCommand
          );

        if (
          selectionOutput.decision.kind === "DENY"
        ) {
          continue;
        }

        state = selectionOutput.state;

        const startOutput =
          handleInput(
            state,
            "start"
          );

        if (
          startOutput.decision.kind === "DENY"
        ) {
          continue;
        }

        state = startOutput.state;

        const firstStep =
          scenario.procedure[0];

        if (
          !isNonEmptyString(
            firstStep.command
          )
        ) {
          continue;
        }

        const firstStepOutput =
          handleInput(
            state,
            firstStep.command
          );

        if (
          firstStepOutput.decision.kind === "DENY"
        ) {
          continue;
        }

        state = firstStepOutput.state;

        const previousScenario =
          state.scenario;

        const previousAttemptNumber =
          state.attempt?.number ?? null;

        const progressedFacts =
          stableSerialize(
            state.scenarioFacts
          );

        const restartOutput =
          handleInput(
            state,
            "restart"
          );

        if (
          restartOutput.decision.kind === "DENY"
        ) {
          findings.push({
            severity: "error",
            area: "restart",
            code: "RESTART_DENIED",
            scenarioId,
            source: "engine.ts",
            message:
              "Restart was denied after valid scenario progress.",
          });

          continue;
        }

        const restartedState =
          restartOutput.state;

        if (
          restartedState.executionState !==
          "RUNNING"
        ) {
          findings.push({
            severity: "error",
            area: "restart",
            code:
              "RESTART_EXECUTION_STATE_INVALID",
            scenarioId,
            source: "engine.ts",
            message:
              "Restart did not create a fresh RUNNING attempt.",
          });
        }

        if (
          restartedState.scenario !==
          previousScenario
        ) {
          findings.push({
            severity: "error",
            area: "restart",
            code:
              "RESTART_SCENARIO_CHANGED",
            scenarioId,
            source: "engine.ts",
            message:
              "Restart changed the active scenario instead of restarting the same scenario.",
          });
        }

        if (
          restartedState.attempt === null ||
          previousAttemptNumber === null ||
          restartedState.attempt.number !==
            previousAttemptNumber + 1
        ) {
          findings.push({
            severity: "error",
            area: "restart",
            code:
              "RESTART_ATTEMPT_NOT_REPLACED",
            scenarioId,
            source: "engine.ts",
            message:
              "Restart did not create the next attempt number.",
          });
        }

        if (
          restartedState.result !== null
        ) {
          findings.push({
            severity: "error",
            area: "restart",
            code:
              "RESTART_RESULT_NOT_CLEARED",
            scenarioId,
            source: "engine.ts",
            message:
              "Restart left result data from the previous attempt.",
          });
        }

        const restartedFacts =
          stableSerialize(
            restartedState.scenarioFacts
          );

        const expectedFacts =
          stableSerialize(
            scenario.defaults
          );

        if (
          restartedFacts !== expectedFacts
        ) {
          findings.push({
            severity: "error",
            area: "restart",
            code:
              "RESTART_SCENARIO_FACTS_NOT_RESET",
            scenarioId,
            source: "engine.ts",
            message:
              "Restart did not restore scenario facts to the declared defaults.",
          });
        }

        if (
          progressedFacts ===
          restartedFacts
        ) {
          findings.push({
            severity: "error",
            area: "restart",
            code:
              "RESTART_PROGRESS_PRESERVED",
            scenarioId,
            command:
              firstStep.command,
            source: "engine.ts",
            message:
              "Restart preserved progress from the previous attempt.",
          });
        }

        if (
          restartedState.procedureHelpOpenedCount !==
            0 ||
          restartedState.procedureHelpUsedDuring
            .length !== 0
        ) {
          findings.push({
            severity: "error",
            area: "restart",
            code:
              "RESTART_HELP_STATE_NOT_RESET",
            scenarioId,
            source: "engine.ts",
            message:
              "Restart did not reset Procedure Help tracking for the fresh attempt.",
          });
        }
      }

      return findings;
    },
  };