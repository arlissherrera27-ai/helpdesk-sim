import type {
  SavedPlaylist,
  PlaylistRun,
} from "./types";

function createId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;
}

export function createSavedPlaylist(input: {
  profileId: string;
  name: string;
  scenarioIds: string[];
}): SavedPlaylist {
  const now = new Date().toISOString();

  return {
    playlistId: createId("playlist"),
    profileId: input.profileId,
    name: input.name,
    scenarioIds: [...input.scenarioIds],
    createdAt: now,
    updatedAt: now,
  };
}

export function updateSavedPlaylist(
  playlist: SavedPlaylist,
  input: {
    name: string;
    scenarioIds: string[];
  }
): SavedPlaylist {
  return {
    ...playlist,
    name: input.name,
    scenarioIds: [...input.scenarioIds],
    updatedAt: new Date().toISOString(),
  };
}

export function createPlaylistRun(input: {
  playlist: SavedPlaylist;
  mode: PlaylistRun["mode"];
}): PlaylistRun {
  return {
    playlistRunId: createId("playlist_run"),
    playlistId: input.playlist.playlistId,
    profileId: input.playlist.profileId,
    playlistName: input.playlist.name,
    scenarioIds: [...input.playlist.scenarioIds],
    currentScenarioIndex: 0,
    attemptIds: [],
    mode: input.mode,
    status: "running",
    startedAt: new Date().toISOString(),
    endedAt: null,
  };
}