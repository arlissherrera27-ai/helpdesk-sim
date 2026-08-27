// src/core/scenarioIntegrity/checkModeIntegrity.ts

import { handleInput } from "../engine";
import { initialState } from "../state";
import { SCENARIO_REGISTRY } from "../scenarioRegistry";

import type { SimState } from "../types";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

type UnknownScenario = {
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

export const checkModeIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Mode Integrity Inspector",
    area: "mode",

    run: (): readonly IntegrityFinding[] => {
      const findings: IntegrityFinding[] = [];

      const registry =
        SCENARIO_REGISTRY as unknown as Record<
          string,
          UnknownScenario
        >;

      const firstScenarioEntry =
        Object.entries(registry).find(
          ([, scenario]) =>
            isNonEmptyString(
              scenario.previewMetadata
                ?.selectCommand
            )
        );

      if (!firstScenarioEntry) {
        return findings;
      }

      const [
        scenarioId,
        scenario,
      ] = firstScenarioEntry;

      const selectCommand =
        scenario.previewMetadata
          ?.selectCommand;

      if (!isNonEmptyString(selectCommand)) {
        return findings;
      }

      // PRACTICE CONTRACT
      let practiceState = initialState();

      const practiceSelection =
        handleInput(
          practiceState,
          selectCommand
        );

      if (
        practiceSelection.decision.kind !==
        "DENY"
      ) {
        practiceState =
          practiceSelection.state;
      }

      const practiceStart =
        handleInput(
          practiceState,
          "start"
        );

      if (
        practiceStart.decision.kind !==
        "DENY"
      ) {
        practiceState =
          practiceStart.state;
      }

      const practiceHelp =
        handleInput(
          practiceState,
          "help"
        );

      if (
        practiceHelp.decision.kind ===
        "DENY"
      ) {
        findings.push({
          severity: "error",
          area: "mode",
          code:
            "MODE_PRACTICE_HELP_DENIED",
          scenarioId,
          source: "decide.ts",
          message:
            "Practice mode denied Procedure Help.",
        });
      }

      const practiceRestart =
        handleInput(
          practiceState,
          "restart"
        );

      if (
        practiceRestart.decision.kind ===
        "DENY"
      ) {
        findings.push({
          severity: "error",
          area: "mode",
          code:
            "MODE_PRACTICE_RESTART_DENIED",
          scenarioId,
          source: "decide.ts",
          message:
            "Practice mode denied restart.",
        });
      }

      const practiceQuit =
        handleInput(
          practiceState,
          "quit"
        );

      if (
        practiceQuit.decision.kind ===
        "DENY"
      ) {
        findings.push({
          severity: "error",
          area: "mode",
          code:
            "MODE_PRACTICE_QUIT_DENIED",
          scenarioId,
          source: "decide.ts",
          message:
            "Practice mode denied quit.",
        });
      }

      // ASSESSMENT CONTRACT
        let assessmentState: SimState = {
        ...initialState(),
        mode: "assessment",
        };

      const assessmentSelection =
        handleInput(
          assessmentState,
          selectCommand
        );

      if (
        assessmentSelection.decision.kind !==
        "DENY"
      ) {
        assessmentState =
          assessmentSelection.state;
      }

      const assessmentStart =
        handleInput(
          assessmentState,
          "start"
        );

      if (
        assessmentStart.decision.kind !==
        "DENY"
      ) {
        assessmentState =
          assessmentStart.state;
      }

      const assessmentHelp =
        handleInput(
          assessmentState,
          "help"
        );

      if (
        assessmentHelp.decision.kind !==
        "DENY"
      ) {
        findings.push({
          severity: "error",
          area: "mode",
          code:
            "MODE_ASSESSMENT_HELP_ALLOWED",
          scenarioId,
          source: "decide.ts",
          message:
            "Assessment mode allowed Procedure Help.",
        });
      }

      const assessmentRestart =
        handleInput(
          assessmentState,
          "restart"
        );

      if (
        assessmentRestart.decision.kind !==
        "DENY"
      ) {
        findings.push({
          severity: "error",
          area: "mode",
          code:
            "MODE_ASSESSMENT_RESTART_ALLOWED",
          scenarioId,
          source: "decide.ts",
          message:
            "Assessment mode allowed restart.",
        });
      }

      const assessmentQuit =
        handleInput(
          assessmentState,
          "quit"
        );

      if (
        assessmentQuit.decision.kind ===
        "DENY"
      ) {
        findings.push({
          severity: "error",
          area: "mode",
          code:
            "MODE_ASSESSMENT_QUIT_DENIED",
          scenarioId,
          source: "decide.ts",
          message:
            "Assessment mode denied quit.",
        });
      }

      return findings;
    },
  };