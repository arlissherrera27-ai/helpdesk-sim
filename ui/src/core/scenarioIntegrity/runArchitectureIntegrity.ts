// src/core/scenarioIntegrity/runArchitectureIntegrity.ts

import { buildArchitectureHealthReport } from "./buildArchitectureHealthReport";
import { checkCommandPlanIntegrity } from "./checkCommandPlanIntegrity";
import { checkScenarioIdIntegrity } from "./checkScenarioIdIntegrity";
import { checkCommandAliasIntegrity } from "./checkCommandAliasIntegrity";
import { checkCommandReachabilityIntegrity } from "./checkCommandReachabilityIntegrity";
import { checkScenarioFactsIntegrity } from "./checkScenarioFactsIntegrity";
import { checkProcedureIntegrity } from "./checkProcedureIntegrity";
import { checkExecutionPlanIntegrity } from "./checkExecutionPlanIntegrity";
import { checkExecuteHandlerIntegrity } from "./checkExecuteHandlerIntegrity";
import { checkScenarioCompletenessIntegrity } from "./checkScenarioCompletenessIntegrity";
import { checkGoldenPathIntegrity } from "./checkGoldenPathIntegrity";
import { checkWrongOrderIntegrity } from "./checkWrongOrderIntegrity";
import { checkDecisionCoverageIntegrity } from "./checkDecisionCoverageIntegrity";
import {
  checkCompletionIntegrity,
  checkScenarioPreviewIntegrity,
  checkScenarioRegistryIntegrity,
} from "./checkScenarioRegistryIntegrity";
import { checkStateMutationIntegrity } from "./checkStateMutationIntegrity";
import { checkRepeatBehaviorIntegrity } from "./checkRepeatBehaviorIntegrity";
import { checkRestartIntegrity } from "./checkRestartIntegrity";
import { checkScenarioIsolationIntegrity } from "./checkScenarioIsolationIntegrity";
import { checkModeIntegrity } from "./checkModeIntegrity";
import { checkPlaylistIntegrity } from "./checkPlaylistIntegrity";
import { checkHistoryIntegrity } from "./checkHistoryIntegrity";
import { checkScoreIntegrity } from "./checkScoreIntegrity";
import { formatArchitectureHealthReport } from "./formatArchitectureHealthReport";

import type {
  ArchitectureHealthReport,
  ArchitectureIntegrityCheck,
} from "./types";

const ARCHITECTURE_INTEGRITY_CHECKS:
  readonly ArchitectureIntegrityCheck[] = [
    checkCommandPlanIntegrity,
    checkExecutionPlanIntegrity,
    checkExecuteHandlerIntegrity,
    checkScenarioIdIntegrity,
    checkScenarioRegistryIntegrity,
    checkScenarioPreviewIntegrity,
    checkCompletionIntegrity,
    checkScenarioFactsIntegrity,
    checkCommandAliasIntegrity,
    checkCommandReachabilityIntegrity,
    checkProcedureIntegrity,
    checkScenarioCompletenessIntegrity,
    checkGoldenPathIntegrity,
    checkWrongOrderIntegrity,
    checkStateMutationIntegrity,
    checkRepeatBehaviorIntegrity,
    checkRestartIntegrity,
    checkScenarioIsolationIntegrity,
    checkModeIntegrity,
    checkPlaylistIntegrity,
    checkHistoryIntegrity,
    checkScoreIntegrity,
    checkDecisionCoverageIntegrity,
];

export function runArchitectureIntegrity():
  ArchitectureHealthReport {
  return buildArchitectureHealthReport(
    ARCHITECTURE_INTEGRITY_CHECKS
  );
}

export function getFormattedArchitectureIntegrityReport():
  string {
  const report = runArchitectureIntegrity();

  return formatArchitectureHealthReport(report);
}

export function assertArchitectureIntegrity(): void {
  const report = runArchitectureIntegrity();

  if (report.passed) {
    return;
  }

  throw new Error(
    `\n${formatArchitectureHealthReport(report)}`
  );
}