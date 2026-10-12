import type { SimState } from "../core/types";

import type {
  ScenarioAttemptEndReason,
  ScenarioAttemptRecord,
} from "./types";

type CreateScenarioAttemptRecordOptions = {
  profileId: string;
  startedAt: string;
  endedAt: string;
  endReason: ScenarioAttemptEndReason;
  playlistRunId?: string | null;
};

export function createScenarioAttemptRecord(
  state: SimState,
  options: CreateScenarioAttemptRecordOptions
): ScenarioAttemptRecord | null {
  if (!state.attempt || !state.scenario) {
    return null;
  }

  const completed =
    (options.endReason === "completed" ||
      options.endReason === "takeover") &&
    state.result !== null;

return {
  attemptId: state.attempt.id,

  profileId: options.profileId,

  scenarioId: state.scenario,

  mode: state.mode,

  investigationTicket: state.investigationTicket
    ? { ...state.investigationTicket }
    : null,

  assessmentIntegrity: state.assessmentIntegrity,

    status: completed
      ? "completed"
      : "abandoned",

    completion: completed
      ? state.result!.completion
      : null,

    score: completed
      ? state.result!.totalScore
      : null,

    mistakes: completed
      ? state.result!.mistakes
      : state.runLog.filter(
          (event) => event.decision === "DENY"
        ).length,

    startedAt: options.startedAt,

    endedAt: options.endedAt,

    endReason: options.endReason,

    runLog: [...state.runLog],

    playlistRunId:
      options.playlistRunId ?? null,
  };
}