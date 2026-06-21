import type { LogEvent, ScoreSummary } from "./types";

export function evaluateRun(
  runLog: LogEvent[],
  completion: "PASS" | "FAIL" = "PASS"
): ScoreSummary {
  let mistakes = 0;

  for (const event of runLog) {
    if (event.decision === "DENY") {
      mistakes++;
    }
  }

  return {
    totalScore: Math.max(0, 10 - mistakes),
    mistakes,
    completion,
  };
}