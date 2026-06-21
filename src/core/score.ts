import { LogEvent, ScoreSummary } from "./types";

export function evaluateRun(runLog: LogEvent[]): ScoreSummary {
  let mistakes = 0; // ← ADD

  for (const event of runLog) {
    if (event.decision === "DENY") {
      mistakes++; // ← ADD
    }
  }

  return {
    totalScore: Math.max(0, 10 - mistakes), // ← ADD
    mistakes,
    completion: "PASS", // ← ADD (simple for MVP)
  };
}