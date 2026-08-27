// src/core/scenarioIntegrity/checkWrongOrderIntegrity.ts

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

export const checkWrongOrderIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Wrong Order Execution Inspector",
    area: "wrong_order",

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

        const procedureCommands =
          scenario.procedure
            .map((step) => step.command)
            .filter(isNonEmptyString);

        if (procedureCommands.length < 2) {
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

        const legitimatelyExecuted =
          new Set<string>();

        for (
          let currentIndex = 0;
          currentIndex < procedureCommands.length;
          currentIndex += 1
        ) {
          const correctCommand =
            procedureCommands[currentIndex];

          /*
           * Attack only later commands that:
           *
           * 1. are not the legitimate command for this stage, and
           * 2. have never been legitimately executed before.
           *
           * This prevents repeated diagnostic / verification
           * commands from being misclassified as new skip-ahead
           * commands.
           */
          const laterCommands = Array.from(
            new Set(
              procedureCommands.slice(currentIndex + 1)
            )
          ).filter(
            (command) =>
              command !== correctCommand &&
              !legitimatelyExecuted.has(command)
          );

          for (const wrongCommand of laterCommands) {
            const beforeFacts =
              stableSerialize(state.scenarioFacts);

            const beforeResult =
              stableSerialize(state.result);

            const beforeExecutionState =
              stableSerialize(state.executionState);

            const wrongOutput = handleInput(
              state,
              wrongCommand
            );

            if (wrongOutput.decision.kind !== "DENY") {
              findings.push({
                severity: "error",
                area: "wrong_order",
                code: "WRONG_ORDER_COMMAND_ALLOWED",
                scenarioId,
                command: wrongCommand,
                source: "engine.ts",
                message:
                  `Scenario allowed unreached procedure command "${wrongCommand}" before required command "${correctCommand}" at procedure position ${currentIndex + 1}.`,
              });
            }

            const afterFacts =
              stableSerialize(
                wrongOutput.state.scenarioFacts
              );

            const afterResult =
              stableSerialize(
                wrongOutput.state.result
              );

            const afterExecutionState =
              stableSerialize(
                wrongOutput.state.executionState
              );

            if (
              beforeFacts !== afterFacts ||
              beforeResult !== afterResult ||
              beforeExecutionState !==
                afterExecutionState
            ) {
              findings.push({
                severity: "error",
                area: "wrong_order",
                code: "WRONG_ORDER_STATE_MUTATED",
                scenarioId,
                command: wrongCommand,
                source: "engine.ts",
                message:
                  `Wrong-order command "${wrongCommand}" changed scenario state before required command "${correctCommand}".`,
              });
            }

            if (
              wrongOutput.state.result?.completion ===
              "PASS"
            ) {
              findings.push({
                severity: "error",
                area: "wrong_order",
                code: "WRONG_ORDER_EARLY_PASS",
                scenarioId,
                command: wrongCommand,
                source: "engine.ts",
                message:
                  `Wrong-order command "${wrongCommand}" caused the scenario to PASS before required command "${correctCommand}".`,
              });
            }
          }

          /*
           * Advance through the real golden path.
           */
          const correctOutput = handleInput(
            state,
            correctCommand
          );

          if (correctOutput.decision.kind === "DENY") {
            /*
             * Golden Path owns this failure class.
             * Avoid duplicate reporting here.
             */
            break;
          }

          state = correctOutput.state;

          legitimatelyExecuted.add(correctCommand);

          if (state.result?.completion === "PASS") {
            break;
          }
        }
      }

      return findings;
    },
  };