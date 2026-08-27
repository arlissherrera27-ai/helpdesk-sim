import type { SimState } from "../core/types";

export type ScenarioAttemptStatus =
  | "completed"
  | "abandoned";

export type ScenarioAttemptEndReason =
  | "completed"
  | "quit"
  | "restart";

export type ScenarioAttemptRecord = {
  attemptId: string;

  profileId: string;

  scenarioId: NonNullable<SimState["scenario"]>;

  mode: SimState["mode"];

  assessmentIntegrity: SimState["assessmentIntegrity"];

  status: ScenarioAttemptStatus;

  completion: "PASS" | "FAIL" | null;

  score: number | null;

  mistakes: number;

  startedAt: string;

  endedAt: string;

  endReason: ScenarioAttemptEndReason;

  runLog: SimState["runLog"];

  playlistRunId: string | null;
};