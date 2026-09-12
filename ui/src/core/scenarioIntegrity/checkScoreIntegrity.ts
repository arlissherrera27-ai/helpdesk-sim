// src/core/scenarioIntegrity/checkScoreIntegrity.ts

import { evaluateRun } from "../score";

import type { LogEvent } from "../types";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

function createLogEvent(
  decision: "ALLOW" | "DENY"
): LogEvent {
  return {
    timestamp:
      "2026-01-01T00:00:00.000Z",
    attemptedInput:
      decision === "DENY"
        ? "wrong command"
        : "valid command",
    command:
      decision === "DENY"
        ? "unknown"
        : "status",
    decision,
    plan:
      decision === "DENY"
        ? null
        : "ReadOnly",
    outcome:
      decision === "DENY"
        ? "denied"
        : "success",
        ...(decision === "DENY"
    ? { mistakeType: "unknown" as const }
    : {}),
  };
}

export const checkScoreIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Score Integrity Inspector",
    area: "score",

    run: (): readonly IntegrityFinding[] => {
      const findings: IntegrityFinding[] = [];

      // 1. Perfect run = 10/10, zero mistakes.
const perfect =
  evaluateRun([], 3);

if (
  perfect.totalScore !== 10 ||
  perfect.mistakes !== 0 ||
  perfect.completion !== "PASS"
) {
  findings.push({
    severity: "error",
    area: "score",
    code:
      "SCORE_PERFECT_RUN_INVALID",
    source: "score.ts",
    message:
      "Perfect run did not produce 10/10, zero mistakes, and PASS.",
  });
}

// 2. One DENY on a 3-step scenario = 75% = 7.5/10.
const oneMistake =
  evaluateRun(
    [
      createLogEvent("DENY"),
    ],
    3
  );

if (
  oneMistake.mistakes !== 1 ||
  oneMistake.totalScore !== 7.5 ||
  oneMistake.completion !== "PASS"
) {
  findings.push({
    severity: "error",
    area: "score",
    code:
      "SCORE_SINGLE_DENY_INVALID",
    source: "score.ts",
    message:
      "One DENY on a 3-step scenario did not produce 7.5/10 and PASS.",
  });
}

// 3. ALLOW events do not count as mistakes.
const mixedRun =
  evaluateRun(
    [
      createLogEvent("ALLOW"),
      createLogEvent("DENY"),
      createLogEvent("ALLOW"),
    ],
    3
  );

if (
  mixedRun.mistakes !== 1 ||
  mixedRun.totalScore !== 7.5
) {
  findings.push({
    severity: "error",
    area: "score",
    code:
      "SCORE_ALLOW_COUNTED_AS_MISTAKE",
    source: "score.ts",
    message:
      "ALLOW events affected mistake count or percentage score.",
  });
}

// 4. Longer scenarios must use the same percentage formula.
const longScenario =
  evaluateRun(
    Array.from(
      { length: 5 },
      () =>
        createLogEvent("DENY")
    ),
    10
  );

if (
  longScenario.mistakes !== 5 ||
  longScenario.totalScore !== 6.7 ||
  longScenario.completion !== "FAIL"
) {
  findings.push({
    severity: "error",
    area: "score",
    code:
      "SCORE_FLOOR_INVALID",
    source: "score.ts",
    message:
      "Percentage scoring was not applied correctly to a longer scenario.",
  });
}

// 5. Below 70% must produce FAIL.
const failed =
  evaluateRun(
    Array.from(
      { length: 2 },
      () =>
        createLogEvent("DENY")
    ),
    3
  );

if (
  failed.totalScore !== 6 ||
  failed.mistakes !== 2 ||
  failed.completion !== "FAIL"
) {
  findings.push({
    severity: "error",
    area: "score",
    code:
      "SCORE_COMPLETION_NOT_PRESERVED",
    source: "score.ts",
    message:
      "A percentage score below 70% did not produce FAIL.",
  });
}

      return findings;
    },
  };