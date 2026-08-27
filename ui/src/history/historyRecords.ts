import type {
  ScenarioAttemptRecord,
} from "./types";

export function appendUniqueAttemptRecord(
  history: readonly ScenarioAttemptRecord[],
  record: ScenarioAttemptRecord
): ScenarioAttemptRecord[] {
  const alreadyExists =
    history.some(
      (attempt) =>
        attempt.attemptId ===
        record.attemptId
    );

  if (alreadyExists) {
    return [...history];
  }

  return [
    ...history,
    record,
  ];
}