// src/core/scenarioIntegrity/checkScenarioIsolationIntegrity.ts

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

export const checkScenarioIsolationIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Scenario Isolation Inspector",
    area: "scenario_isolation",

    run: (): readonly IntegrityFinding[] => {
      const findings: IntegrityFinding[] = [];

      const registry =
        SCENARIO_REGISTRY as unknown as Record<
          string,
          UnknownScenario
        >;

      const entries =
        Object.entries(registry);

      if (entries.length < 2) {
        return findings;
      }

      for (
        let index = 0;
        index < entries.length;
        index += 1
      ) {
        const [
          sourceScenarioId,
          sourceScenario,
        ] = entries[index];

        const [
          targetScenarioId,
          targetScenario,
        ] =
          entries[
            (index + 1) %
              entries.length
          ];

        if (
          !Array.isArray(
            sourceScenario.procedure
          ) ||
          sourceScenario.procedure.length === 0 ||
          !isNonEmptyString(
            sourceScenario.previewMetadata
              ?.selectCommand
          ) ||
          !isNonEmptyString(
            targetScenario.previewMetadata
              ?.selectCommand
          )
        ) {
          continue;
        }

        let state = initialState();

        const sourceSelection =
          handleInput(
            state,
            sourceScenario.previewMetadata
              .selectCommand
          );

        if (
          sourceSelection.decision.kind ===
          "DENY"
        ) {
          continue;
        }

        state = sourceSelection.state;

        const sourceStart =
          handleInput(
            state,
            "start"
          );

        if (
          sourceStart.decision.kind ===
          "DENY"
        ) {
          continue;
        }

        state = sourceStart.state;

        // Complete the source scenario through
        // its real declared golden path.
        let sourceCompleted = true;

        for (
          const step of
            sourceScenario.procedure
        ) {
          if (
            !isNonEmptyString(
              step.command
            )
          ) {
            continue;
          }

          const output =
            handleInput(
              state,
              step.command
            );

          if (
            output.decision.kind ===
            "DENY"
          ) {
            sourceCompleted = false;
            break;
          }

          state = output.state;
        }

        if (
          !sourceCompleted ||
          state.result?.completion !==
            "PASS"
        ) {
          continue;
        }

        const scorecardOutput =
          handleInput(
            state,
            "view scorecard"
          );

        if (
          scorecardOutput.decision.kind ===
          "DENY"
        ) {
          findings.push({
            severity: "error",
            area: "scenario_isolation",
            code:
              "SCENARIO_ISOLATION_COMPLETION_TRANSITION_DENIED",
            scenarioId:
              sourceScenarioId,
            source: "engine.ts",
            message:
              `Scenario "${sourceScenarioId}" reached PASS but could not transition to COMPLETED before selecting the next scenario.`,
          });

          continue;
        }

        state = scorecardOutput.state;

        const targetSelection =
          handleInput(
            state,
            targetScenario.previewMetadata
              .selectCommand
          );

        if (
          targetSelection.decision.kind ===
          "DENY"
        ) {
          findings.push({
            severity: "error",
            area: "scenario_isolation",
            code:
              "SCENARIO_ISOLATION_SELECTION_DENIED",
            scenarioId:
              targetScenarioId,
            source: "engine.ts",
            message:
              `Could not select scenario "${targetScenarioId}" after completing "${sourceScenarioId}".`,
          });

          continue;
        }

        const selectedState =
          targetSelection.state;

        if (
          selectedState.scenario !== null ||
          selectedState.scenarioFacts !== null ||
          selectedState.attempt !== null ||
          selectedState.result !== null
        ) {
          findings.push({
            severity: "error",
            area: "scenario_isolation",
            code:
              "SCENARIO_ISOLATION_SELECTION_STATE_LEAK",
            scenarioId:
              targetScenarioId,
            source: "engine.ts",
            message:
              `Selecting "${targetScenarioId}" preserved active state from "${sourceScenarioId}".`,
          });
        }

        const targetStart =
          handleInput(
            selectedState,
            "start"
          );

        if (
          targetStart.decision.kind ===
          "DENY"
        ) {
          findings.push({
            severity: "error",
            area: "scenario_isolation",
            code:
              "SCENARIO_ISOLATION_START_DENIED",
            scenarioId:
              targetScenarioId,
            source: "engine.ts",
            message:
              `Scenario "${targetScenarioId}" could not start after transitioning from "${sourceScenarioId}".`,
          });

          continue;
        }

        const targetState =
          targetStart.state;

        if (
          targetState.scenario !==
          targetScenarioId
        ) {
          findings.push({
            severity: "error",
            area: "scenario_isolation",
            code:
              "SCENARIO_ISOLATION_WRONG_SCENARIO",
            scenarioId:
              targetScenarioId,
            source: "engine.ts",
            message:
              `Transition from "${sourceScenarioId}" did not activate "${targetScenarioId}".`,
          });
        }

        const actualTargetFacts =
          stableSerialize(
            targetState.scenarioFacts
          );

        const expectedTargetFacts =
          stableSerialize(
            targetScenario.defaults
          );

        if (
          actualTargetFacts !==
          expectedTargetFacts
        ) {
          findings.push({
            severity: "error",
            area: "scenario_isolation",
            code:
              "SCENARIO_ISOLATION_FACTS_LEAK",
            scenarioId:
              targetScenarioId,
            source: "engine.ts",
            message:
              `Scenario "${targetScenarioId}" did not begin with its declared default facts after "${sourceScenarioId}".`,
          });
        }

        if (
          targetState.result !== null
        ) {
          findings.push({
            severity: "error",
            area: "scenario_isolation",
            code:
              "SCENARIO_ISOLATION_RESULT_LEAK",
            scenarioId:
              targetScenarioId,
            source: "engine.ts",
            message:
              `Scenario "${targetScenarioId}" inherited result state from "${sourceScenarioId}".`,
          });
        }

        if (
          targetState.attempt === null ||
          targetState.attempt.number !== 1
        ) {
          findings.push({
            severity: "error",
            area: "scenario_isolation",
            code:
              "SCENARIO_ISOLATION_ATTEMPT_INVALID",
            scenarioId:
              targetScenarioId,
            source: "engine.ts",
            message:
              `Scenario "${targetScenarioId}" did not begin with the expected fresh attempt.`,
          });
        }

        if (
          targetState.procedureHelpOpenedCount !==
            0 ||
          targetState.procedureHelpUsedDuring
            .length !== 0
        ) {
          findings.push({
            severity: "error",
            area: "scenario_isolation",
            code:
              "SCENARIO_ISOLATION_HELP_STATE_LEAK",
            scenarioId:
              targetScenarioId,
            source: "engine.ts",
            message:
              `Scenario "${targetScenarioId}" inherited Procedure Help state from "${sourceScenarioId}".`,
          });
        }
      }

      return findings;
    },
  };