// src/playlists/playlistRunLifecycle.ts

import type {
  PlaylistRun,
} from "./types";

export type PlaylistAdvanceResult =
  | {
      kind: "ignored";
      run: PlaylistRun;
    }
  | {
      kind: "advance";
      run: PlaylistRun;
      nextScenarioId: string;
    }
  | {
      kind: "completed";
      run: PlaylistRun;
    };

export function attachAttemptToPlaylistRun(
  run: PlaylistRun,
  attemptId: string
): PlaylistRun {
  if (
    run.attemptIds.includes(attemptId)
  ) {
    return run;
  }

  return {
    ...run,
    attemptIds: [
      ...run.attemptIds,
      attemptId,
    ],
  };
}

export function advancePlaylistRunRecord(
  run: PlaylistRun,
  endedAt: string
): PlaylistAdvanceResult {
  if (run.status !== "running") {
    return {
      kind: "ignored",
      run,
    };
  }

  const nextScenarioIndex =
    run.currentScenarioIndex + 1;

  if (
    nextScenarioIndex >=
    run.scenarioIds.length
  ) {
    return {
      kind: "completed",
      run: {
        ...run,
        status: "completed",
        endedAt,
      },
    };
  }

  const nextScenarioId =
    run.scenarioIds[
      nextScenarioIndex
    ];

  return {
    kind: "advance",
    run: {
      ...run,
      currentScenarioIndex:
        nextScenarioIndex,
    },
    nextScenarioId,
  };
}

export function abandonPlaylistRunRecord(
  run: PlaylistRun,
  endedAt: string,
  attemptId?: string
): PlaylistRun {
  if (run.status !== "running") {
    return run;
  }

  const runWithAttempt =
    attemptId === undefined
      ? run
      : attachAttemptToPlaylistRun(
          run,
          attemptId
        );

  return {
    ...runWithAttempt,
    status: "abandoned",
    endedAt,
  };
}