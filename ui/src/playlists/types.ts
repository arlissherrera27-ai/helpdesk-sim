import type { SimMode } from "../core/types";

export type SavedPlaylist = {
  playlistId: string;

  profileId: string;

  name: string;

  scenarioIds: string[];

  createdAt: string;

  updatedAt: string;
};

export type PlaylistRunStatus =
  | "running"
  | "completed"
  | "abandoned";

export type PlaylistRun = {
  playlistRunId: string;

  playlistId: string;

  profileId: string;

  playlistName: string;

  scenarioIds: string[];

  currentScenarioIndex: number;

  attemptIds: string[];

  mode: SimMode;

  status: PlaylistRunStatus;

  startedAt: string;

  endedAt: string | null;
};