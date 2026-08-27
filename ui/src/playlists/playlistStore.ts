import type {
  SavedPlaylist,
  PlaylistRun,
} from "./types";

const PLAYLIST_STORAGE_KEY =
  "helpdesk_sim_saved_playlists";

const PLAYLIST_RUN_STORAGE_KEY =
  "helpdesk_sim_playlist_runs";

export function loadSavedPlaylists(): SavedPlaylist[] {
  const raw =
    localStorage.getItem(PLAYLIST_STORAGE_KEY);

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? (parsed as SavedPlaylist[])
      : [];
  } catch {
    return [];
  }
}

export function loadSavedPlaylistsForProfile(
  profileId: string
): SavedPlaylist[] {
  return loadSavedPlaylists().filter(
    (playlist) =>
      playlist.profileId === profileId
  );
}

export function saveSavedPlaylists(
  playlists: readonly SavedPlaylist[]
): void {
  localStorage.setItem(
    PLAYLIST_STORAGE_KEY,
    JSON.stringify(playlists)
  );
}

export function loadPlaylistRuns(): PlaylistRun[] {
  const raw =
    localStorage.getItem(
      PLAYLIST_RUN_STORAGE_KEY
    );

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    return Array.isArray(parsed)
      ? (parsed as PlaylistRun[])
      : [];
  } catch {
    return [];
  }
}

export function loadPlaylistRunsForProfile(
  profileId: string
): PlaylistRun[] {
  return loadPlaylistRuns().filter(
    (run) =>
      run.profileId === profileId
  );
}

export function savePlaylistRuns(
  runs: readonly PlaylistRun[]
): void {
  localStorage.setItem(
    PLAYLIST_RUN_STORAGE_KEY,
    JSON.stringify(runs)
  );
}

export function appendSavedPlaylist(
  playlist: SavedPlaylist
): SavedPlaylist[] {
  const playlists = loadSavedPlaylists();

  const nextPlaylists = [
    ...playlists,
    playlist,
  ];

  saveSavedPlaylists(nextPlaylists);

  return nextPlaylists;
}

export function replaceSavedPlaylist(
  playlist: SavedPlaylist
): SavedPlaylist[] {
  const playlists = loadSavedPlaylists();

  const nextPlaylists = playlists.map(
    (existing) =>
      existing.playlistId === playlist.playlistId
        ? playlist
        : existing
  );

  saveSavedPlaylists(nextPlaylists);

  return nextPlaylists;
}

export function addScenarioToSavedPlaylist(
  playlistId: string,
  scenarioId: string
): SavedPlaylist[] {
  const playlists = loadSavedPlaylists();

  const playlist = playlists.find(
    (existing) =>
      existing.playlistId === playlistId
  );

  if (!playlist) {
    return playlists;
  }

  if (playlist.scenarioIds.includes(scenarioId)) {
    return playlists;
  }

  const updatedPlaylist: SavedPlaylist = {
    ...playlist,
    scenarioIds: [
      ...playlist.scenarioIds,
      scenarioId,
    ],
  };

  return replaceSavedPlaylist(updatedPlaylist);
}

export function removeScenarioFromSavedPlaylist(
  playlistId: string,
  scenarioId: string
): SavedPlaylist[] {
  const playlists = loadSavedPlaylists();

  const playlist = playlists.find(
    (existing) =>
      existing.playlistId === playlistId
  );

  if (!playlist) {
    return playlists;
  }

  if (!playlist.scenarioIds.includes(scenarioId)) {
    return playlists;
  }

  const updatedPlaylist: SavedPlaylist = {
    ...playlist,
    scenarioIds: playlist.scenarioIds.filter(
      (existingScenarioId) =>
        existingScenarioId !== scenarioId
    ),
  };

  return replaceSavedPlaylist(updatedPlaylist);
}

export function moveScenarioInSavedPlaylist(
  playlistId: string,
  scenarioId: string,
  direction: "up" | "down"
): SavedPlaylist[] {
  const playlists = loadSavedPlaylists();

  const playlist = playlists.find(
    (existing) =>
      existing.playlistId === playlistId
  );

  if (!playlist) {
    return playlists;
  }

  const currentIndex =
    playlist.scenarioIds.indexOf(scenarioId);

  if (currentIndex === -1) {
    return playlists;
  }

  const targetIndex =
    direction === "up"
      ? currentIndex - 1
      : currentIndex + 1;

  if (
    targetIndex < 0 ||
    targetIndex >= playlist.scenarioIds.length
  ) {
    return playlists;
  }

  const nextScenarioIds = [
    ...playlist.scenarioIds,
  ];

  [
    nextScenarioIds[currentIndex],
    nextScenarioIds[targetIndex],
  ] = [
    nextScenarioIds[targetIndex],
    nextScenarioIds[currentIndex],
  ];

  const updatedPlaylist: SavedPlaylist = {
    ...playlist,
    scenarioIds: nextScenarioIds,
  };

  return replaceSavedPlaylist(updatedPlaylist);
}

export function deleteSavedPlaylist(
  playlistId: string
): SavedPlaylist[] {
  const playlists = loadSavedPlaylists();

  const nextPlaylists = playlists.filter(
    (playlist) =>
      playlist.playlistId !== playlistId
  );

  saveSavedPlaylists(nextPlaylists);

  return nextPlaylists;
}

export function appendPlaylistRun(
  run: PlaylistRun
): PlaylistRun[] {
  const runs = loadPlaylistRuns();

  const nextRuns = [
    ...runs,
    run,
  ];

  savePlaylistRuns(nextRuns);

  return nextRuns;
}

export function replacePlaylistRun(
  run: PlaylistRun
): PlaylistRun[] {
  const runs = loadPlaylistRuns();

  const nextRuns = runs.map(
    (existing) =>
      existing.playlistRunId === run.playlistRunId
        ? run
        : existing
  );

  savePlaylistRuns(nextRuns);

  return nextRuns;
}