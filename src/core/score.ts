import { LogEvent, ScoreSummary } from "./types";

export function evaluateRun(runLog: LogEvent[]): ScoreSummary {
  let mistakes = 0;

  for (const event of runLog) {
    if (event.decision === "DENY") {
      mistakes++;
    }
  }

  const totalScore = Math.max(0, 10 - mistakes);

  return {
    totalScore,
    mistakes,
    completion:
      totalScore >= 7
        ? "PASS"
        : "FAIL",
  };
}