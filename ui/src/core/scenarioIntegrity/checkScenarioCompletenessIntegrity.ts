// src/core/scenarioIntegrity/checkScenarioCompletenessIntegrity.ts

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
  completion?: {
    command?: unknown;
    fact?: unknown;
  };
  defaults?: unknown;
};

function isNonEmptyString(
  value: unknown
): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

const APPROVED_FINAL_VERIFICATION_COMMANDS = new Set<string>([
  "test_sign_in",
  "confirm_unlock",
  "confirm_connection",
  "test_mfa_login",
  "send_test_email",
  "test_email_login",
  "test_email_sync",
  "test_shared_mailbox_access",
  "test_connection",
  "test_internet_connection",
  "confirm_storage_available",
  "test_network_drive_access",
  "test_file_open",
  "test_folder_access",
  "test_performance",
  "test_browser_performance",
  "print_test_page",
  "test_input_device",
  "test_microphone",
  "test_webcam",
  "test_dual_display",
  "test_audio",
  "test_application_launch",
  "test_software_install",
  "test_permission_access",
  "test_shared_drive_access",
]);

export const checkScenarioCompletenessIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Scenario Completeness Inspector",
    area: "scenario_completeness",

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
        if (scenario.procedure.length < 3) {
  findings.push({
    severity: "error",
    area: "scenario_completeness",
    code: "SCENARIO_PROCEDURE_TOO_SHORT",
    scenarioId,
    source: "scenarioRegistry.ts",
    message:
      "Scenario procedure must contain at least three troubleshooting steps.",
  });
}

        for (const step of scenario.procedure) {
          if (!isNonEmptyString(step.preview)) {
            findings.push({
              severity: "error",
              area: "scenario_completeness",
              code: "SCENARIO_PROCEDURE_PREVIEW_MISSING",
              scenarioId,
              command:
                typeof step.command === "string"
                  ? step.command
                  : undefined,
              source: "scenarioRegistry.ts",
              message:
                "Scenario procedure step is missing user-facing preview text.",
            });
          }
        }

        for (
  let index = 1;
  index < scenario.procedure.length;
  index += 1
) {
  const previousStep =
    scenario.procedure[index - 1];
  const currentStep =
    scenario.procedure[index];

  if (
    isNonEmptyString(previousStep.command) &&
    isNonEmptyString(currentStep.command) &&
    previousStep.command === currentStep.command
  ) {
    findings.push({
      severity: "error",
      area: "scenario_completeness",
      code: "SCENARIO_ADJACENT_PROCEDURE_DUPLICATE",
      scenarioId,
      command: currentStep.command,
      source: "scenarioRegistry.ts",
      message:
        `Scenario procedure contains adjacent duplicate command "${currentStep.command}".`,
    });
  }
}

const completionCommand =
  scenario.completion?.command;

const finalStep =
  scenario.procedure[
    scenario.procedure.length - 1
  ];

const completionFact =
  scenario.completion?.fact;

  if (
  isNonEmptyString(completionFact) &&
  scenario.defaults &&
  typeof scenario.defaults === "object"
) {
  const defaults =
    scenario.defaults as Record<string, unknown>;

  if (defaults[completionFact] !== false) {
    findings.push({
      severity: "error",
      area: "scenario_completeness",
      code: "SCENARIO_COMPLETION_FACT_NOT_FALSE",
      scenarioId,
      fact: completionFact,
      source: "scenarioRegistry.ts",
      message:
        `Scenario completion fact "${completionFact}" must begin as false in defaults.`,
    });
  }
}

     if (
  isNonEmptyString(completionCommand) &&
  finalStep &&
  isNonEmptyString(finalStep.command) &&
  finalStep.command !== completionCommand
) {
  findings.push({
    severity: "error",
    area: "scenario_completeness",
    code: "SCENARIO_FINAL_STEP_MISMATCH",
    scenarioId,
    command: completionCommand,
    source: "scenarioRegistry.ts",
    message:
      `Scenario completion command "${completionCommand}" does not match final procedure step "${finalStep.command}".`,
  });
}     

        if (
  isNonEmptyString(completionCommand) &&
  !APPROVED_FINAL_VERIFICATION_COMMANDS.has(
    completionCommand
  )
) {
  findings.push({
    severity: "error",
    area: "scenario_completeness",
    code: "SCENARIO_FINAL_VERIFICATION_MISSING",
    scenarioId,
    command: completionCommand,
    source: "scenarioRegistry.ts",
    message:
      `Scenario completion command "${completionCommand}" is not an approved final verification action.`,
  });
}
      }

      return findings;
    },
  };