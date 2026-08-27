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
        evaluateRun([]);

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

      // 2. Each DENY counts as exactly one mistake.
      const oneMistake =
        evaluateRun([
          createLogEvent("DENY"),
        ]);

      if (
        oneMistake.mistakes !== 1 ||
        oneMistake.totalScore !== 9
      ) {
        findings.push({
          severity: "error",
          area: "score",
          code:
            "SCORE_SINGLE_DENY_INVALID",
          source: "score.ts",
          message:
            "Single DENY did not produce exactly one mistake and a 9/10 score.",
        });
      }

      // 3. ALLOW events do not count as mistakes.
      const mixedRun =
        evaluateRun([
          createLogEvent("ALLOW"),
          createLogEvent("DENY"),
          createLogEvent("ALLOW"),
        ]);

      if (
        mixedRun.mistakes !== 1 ||
        mixedRun.totalScore !== 9
      ) {
        findings.push({
          severity: "error",
          area: "score",
          code:
            "SCORE_ALLOW_COUNTED_AS_MISTAKE",
          source: "score.ts",
          message:
            "ALLOW events affected mistake count or score.",
        });
      }

      // 4. Score cannot fall below zero.
      const manyMistakes =
        evaluateRun(
          Array.from(
            { length: 15 },
            () =>
              createLogEvent("DENY")
          )
        );

      if (
        manyMistakes.mistakes !== 15 ||
        manyMistakes.totalScore !== 0
      ) {
        findings.push({
          severity: "error",
          area: "score",
          code:
            "SCORE_FLOOR_INVALID",
          source: "score.ts",
          message:
            "Score did not clamp at zero after more than ten mistakes.",
        });
      }

      // 5. Explicit FAIL must be preserved.
      const failed =
        evaluateRun(
          [],
          "FAIL"
        );

      if (
        failed.completion !== "FAIL"
      ) {
        findings.push({
          severity: "error",
          area: "score",
          code:
            "SCORE_COMPLETION_NOT_PRESERVED",
          source: "score.ts",
          message:
            "Scoring changed the supplied completion result.",
        });
      }

      return findings;
    },
  };