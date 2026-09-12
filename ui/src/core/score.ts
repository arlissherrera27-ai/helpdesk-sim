import type { LogEvent, ScoreSummary } from "./types";

export function evaluateRun(
  runLog: LogEvent[],
  requiredSteps: number
): ScoreSummary {
  let mistakes = 0;

  for (const event of runLog) {
    if (event.decision === "DENY") {
      mistakes++;
    }
  }

  const attempts = requiredSteps + mistakes;

  const accuracy =
    attempts > 0
      ? requiredSteps / attempts
      : 1;

  const totalScore =
    Math.round(accuracy * 100) / 10;

  return {
    totalScore,
    mistakes,
    completion: accuracy >= 0.7 ? "PASS" : "FAIL",
  };
}