import type { LogEvent, ScoreSummary } from "./types";

const PASS_ACCURACY = 0.7;

function countMistakes(runLog: LogEvent[]): number {
  return runLog.filter(
    (event) => event.decision === "DENY"
  ).length;
}

export function evaluateRun(
  runLog: LogEvent[],
  requiredSteps: number
): ScoreSummary {
  const mistakes = countMistakes(runLog);

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
    completion:
      accuracy >= PASS_ACCURACY ? "PASS" : "FAIL",
  };
}

export function canStillPassRun(
  runLog: LogEvent[],
  requiredSteps: number
): boolean {
  const mistakes = countMistakes(runLog);

  const bestPossibleAccuracy =
    requiredSteps + mistakes > 0
      ? requiredSteps / (requiredSteps + mistakes)
      : 1;

  return bestPossibleAccuracy >= PASS_ACCURACY;
}