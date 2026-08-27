// src/core/scenarioIntegrity/buildArchitectureHealthReport.ts

import type {
  ArchitectureHealthReport,
  ArchitectureIntegrityCheck,
  IntegrityArea,
  IntegrityAreaSummary,
  IntegrityFinding,
} from "./types";

const INTEGRITY_AREAS: readonly IntegrityArea[] = [
  "command",
  "execution_plan",
  "execute_handler",
  "scenario_id",
  "scenario_registry",
  "preview",
  "scenario_facts",
  "completion",
  "alias",
  "reachability",
  "procedure",
  "scenario_completeness",
  "golden_path",
  "wrong_order",
  "state_mutation",
  "repeat_behavior",
  "restart",
  "scenario_isolation",
  "mode",
  "playlist",
  "history",
  "score",
  "decision_coverage",
];

function countFindingsBySeverity(
  findings: readonly IntegrityFinding[],
  severity: IntegrityFinding["severity"]
): number {
  return findings.filter((finding) => finding.severity === severity).length;
}

function buildAreaSummary(
  area: IntegrityArea,
  checks: readonly ArchitectureIntegrityCheck[],
  findings: readonly IntegrityFinding[]
): IntegrityAreaSummary {
  const areaChecks = checks.filter((check) => check.area === area);
  const areaFindings = findings.filter((finding) => finding.area === area);

  const errorCount = countFindingsBySeverity(areaFindings, "error");
  const warningCount = countFindingsBySeverity(areaFindings, "warning");

  return {
    area,
    checkedCount: areaChecks.length,
    errorCount,
    warningCount,
    passed: errorCount === 0,
  };
}

export function buildArchitectureHealthReport(
  checks: readonly ArchitectureIntegrityCheck[]
): ArchitectureHealthReport {
  const findings: IntegrityFinding[] = [];

  for (const check of checks) {
    findings.push(...check.run());
  }

  const errorCount = countFindingsBySeverity(findings, "error");
  const warningCount = countFindingsBySeverity(findings, "warning");
  const infoCount = countFindingsBySeverity(findings, "info");

  const summaries = INTEGRITY_AREAS.map((area) =>
    buildAreaSummary(area, checks, findings)
  );

  return {
    reportName: "Architecture Integrity",
    checkedCount: checks.length,
    errorCount,
    warningCount,
    infoCount,
    passed: errorCount === 0,
    summaries,
    findings,
  };
}