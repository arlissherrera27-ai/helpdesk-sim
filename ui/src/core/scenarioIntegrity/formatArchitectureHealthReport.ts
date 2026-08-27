// src/core/scenarioIntegrity/formatArchitectureHealthReport.ts

import type {
  ArchitectureHealthReport,
  IntegrityArea,
  IntegrityFinding,
} from "./types";

const AREA_LABELS: Readonly<Record<IntegrityArea, string>> = {
  command: "Commands",
  execution_plan: "Execution Plans",
  execute_handler: "Execute Handlers",
  scenario_id: "Scenario IDs",
  scenario_registry: "Scenario Registry",
  preview: "Scenario Previews",
  scenario_facts: "Scenario Facts",
  completion: "Completion Wiring",
  alias: "Command Aliases",
  reachability: "Command Reachability",
  procedure: "Procedures",
  scenario_completeness: "Scenario Completeness",
  golden_path: "Golden Path",
  wrong_order: "Wrong Order",
  state_mutation: "State Mutation",
  repeat_behavior: "Repeat Behavior",
  restart: "Restart Reset",
  scenario_isolation: "Scenario Isolation",
  mode: "Mode Integrity",
  playlist: "Playlist Integrity",
  history: "History Integrity",
  score: "Score Integrity",
  decision_coverage: "Decision Coverage",
};

function formatFinding(finding: IntegrityFinding): string {
  const details: string[] = [];

  if (finding.scenarioId) {
    details.push(`Scenario: ${finding.scenarioId}`);
  }

  if (finding.command) {
    details.push(`Command: ${finding.command}`);
  }

  if (finding.executionPlan) {
    details.push(`Execution Plan: ${finding.executionPlan}`);
  }

  if (finding.alias) {
    details.push(`Alias: ${finding.alias}`);
  }

  if (finding.fact) {
    details.push(`Fact: ${finding.fact}`);
  }

  details.push(`Source: ${finding.source}`);
  details.push(`Message: ${finding.message}`);

  return [
    `[${finding.severity.toUpperCase()}] ${finding.code}`,
    ...details.map((detail) => `  ${detail}`),
  ].join("\n");
}

export function formatArchitectureHealthReport(
  report: ArchitectureHealthReport
): string {
  const lines: string[] = [
    "========================================",
    "ARCHITECTURE INTEGRITY REPORT",
    "========================================",
    "",
    `Checks Run: ${report.checkedCount}`,
    `Errors: ${report.errorCount}`,
    `Warnings: ${report.warningCount}`,
    `Info: ${report.infoCount}`,
    "",
    `Overall: ${report.passed ? "PASS" : "FAIL"}`,
    "",
    "AREAS",
    "----------------------------------------",
  ];

  for (const summary of report.summaries) {
    const label = AREA_LABELS[summary.area];
    const status =
      summary.checkedCount === 0
        ? "NOT CHECKED"
        : summary.passed
          ? "PASS"
          : "FAIL";

    lines.push(
      `${label}: ${status} | Checks: ${summary.checkedCount} | Errors: ${summary.errorCount} | Warnings: ${summary.warningCount}`
    );
  }

  if (report.findings.length > 0) {
    lines.push(
      "",
      "FINDINGS",
      "----------------------------------------"
    );

    for (const finding of report.findings) {
      lines.push(formatFinding(finding), "");
    }
  } else {
    lines.push(
      "",
      "FINDINGS",
      "----------------------------------------",
      "No architecture findings."
    );
  }

  return lines.join("\n").trimEnd();
}