// src/core/scenarioIntegrity/types.ts

export type IntegritySeverity =
  | "error"
  | "warning"
  | "info";

export type IntegrityArea =
  | "command"
  | "execution_plan"
  | "execute_handler"
  | "scenario_id"
  | "scenario_registry"
  | "preview"
  | "scenario_facts"
  | "completion"
  | "alias"
  | "reachability"
  | "procedure"
  | "scenario_completeness";

export type IntegrityFindingCode =
  | "COMMAND_PLAN_MISSING"
  | "EXECUTION_PLAN_HANDLER_MISSING"

  | "SCENARIO_ID_DUPLICATE"
  | "SCENARIO_ID_MISSING_FROM_REGISTRY"
  | "REGISTRY_SCENARIO_ID_INVALID"

  | "SCENARIO_LABEL_MISSING"
  | "SCENARIO_PROMPT_MISSING"
  | "SCENARIO_PROCEDURE_MISSING"
  | "SCENARIO_DEFAULTS_MISSING"
  | "SCENARIO_CATEGORY_MISSING"
  | "SCENARIO_TYPE_MISSING"

  | "SCENARIO_COMPLETION_METADATA_MISSING"
  | "COMPLETION_FACT_MISSING"
  | "COMPLETION_COMMAND_MISSING"

  | "SCENARIO_PREVIEW_METADATA_MISSING"
  | "SCENARIO_PREVIEW_DESCRIPTION_MISSING"
  | "SCENARIO_PREVIEW_SKILL_FOCUS_MISSING"
  | "SCENARIO_PREVIEW_CONTEXT_MISSING"
  | "SCENARIO_PREVIEW_SUCCESS_OUTCOME_MISSING"
  | "SCENARIO_PREVIEW_SELECT_COMMAND_MISSING"
  | "PREVIEW_SCENARIO_MISSING"

  | "SCENARIO_PROOF_LINES_MISSING"
  | "SCENARIO_SUCCESS_LINES_MISSING"
  | "SCENARIO_FACTS_MISSING"
  | "SCENARIO_FACT_KIND_MISMATCH"

  | "SCENARIO_FINAL_STEP_MISMATCH"
  | "SCENARIO_PROCEDURE_PREVIEW_MISSING"

  | "COMMAND_UNREACHABLE"
  | "COMMAND_ALIAS_DUPLICATE"
  | "PROCEDURE_ORPHANED";

export type IntegrityFinding = {
  severity: IntegritySeverity;
  area: IntegrityArea;
  code: IntegrityFindingCode;

  message: string;
  source: string;

  scenarioId?: string;
  command?: string;
  executionPlan?: string;
  alias?: string;
  fact?: string;
};

export type IntegrityAreaSummary = {
  area: IntegrityArea;
  checkedCount: number;
  errorCount: number;
  warningCount: number;
  passed: boolean;
};

export type ArchitectureHealthReport = {
  reportName: "Architecture Integrity";

  checkedCount: number;
  errorCount: number;
  warningCount: number;
  infoCount: number;

  passed: boolean;

  summaries: readonly IntegrityAreaSummary[];
  findings: readonly IntegrityFinding[];
};

export type ArchitectureIntegrityCheck = {
  name: string;
  area: IntegrityArea;

  run: () => readonly IntegrityFinding[];
};