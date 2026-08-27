import type { ScenarioAttemptRecord } from "./types";
import { appendUniqueAttemptRecord } from "./historyRecords";

const HISTORY_STORAGE_KEY = "helpdesk_sim_attempt_history";

export function loadAttemptHistory(): ScenarioAttemptRecord[] {
  const raw = localStorage.getItem(HISTORY_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed as ScenarioAttemptRecord[];
  } catch {
    return [];
  }
}

export function loadAttemptHistoryForProfile(
  profileId: string
): ScenarioAttemptRecord[] {
  return loadAttemptHistory().filter(
    (attempt) => attempt.profileId === profileId
  );
}

export function saveAttemptHistory(
  history: readonly ScenarioAttemptRecord[]
): void {
  localStorage.setItem(
    HISTORY_STORAGE_KEY,
    JSON.stringify(history)
  );
}

export function appendAttemptRecord(
  record: ScenarioAttemptRecord
): ScenarioAttemptRecord[] {
  const history = loadAttemptHistory();

  const nextHistory =
    appendUniqueAttemptRecord(
      history,
      record
    );

  if (nextHistory.length === history.length) {
    return history;
  }

  saveAttemptHistory(nextHistory);

  return nextHistory;
}