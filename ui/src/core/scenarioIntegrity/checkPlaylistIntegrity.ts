// src/core/scenarioIntegrity/checkPlaylistIntegrity.ts

import {
  abandonPlaylistRunRecord,
  advancePlaylistRunRecord,
  attachAttemptToPlaylistRun,
} from "../../playlists/playlistRunLifecycle";

import type { PlaylistRun } from "../../playlists/types";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

function createTestRun(
  overrides: Partial<PlaylistRun> = {}
): PlaylistRun {
  return {
    playlistRunId: "test_playlist_run",
    playlistId: "test_playlist",
    profileId: "test_profile",
    playlistName: "Integrity Test Playlist",
    scenarioIds: [
      "scenario_one",
      "scenario_two",
      "scenario_three",
    ],
    currentScenarioIndex: 0,
    attemptIds: [],
    mode: "practice",
    status: "running",
    startedAt: "2026-01-01T00:00:00.000Z",
    endedAt: null,
    ...overrides,
  };
}

export const checkPlaylistIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Playlist Integrity Inspector",
    area: "playlist",

    run: (): readonly IntegrityFinding[] => {
      const findings: IntegrityFinding[] = [];

      const endedAt =
        "2026-01-01T01:00:00.000Z";

      // 1. Running playlist advances exactly one position.
      const runningRun =
        createTestRun({
          currentScenarioIndex: 0,
        });

      const advanceResult =
        advancePlaylistRunRecord(
          runningRun,
          endedAt
        );

      if (
        advanceResult.kind !== "advance"
      ) {
        findings.push({
          severity: "error",
          area: "playlist",
          code:
            "PLAYLIST_ADVANCE_NOT_PRODUCED",
          source:
            "playlistRunLifecycle.ts",
          message:
            "Running playlist did not produce an advance result.",
        });
      } else {
        if (
          advanceResult.run
            .currentScenarioIndex !== 1
        ) {
          findings.push({
            severity: "error",
            area: "playlist",
            code:
              "PLAYLIST_INDEX_ADVANCE_INVALID",
            source:
              "playlistRunLifecycle.ts",
            message:
              "Playlist did not advance exactly one scenario position.",
          });
        }

        if (
          advanceResult.nextScenarioId !==
          runningRun.scenarioIds[1]
        ) {
          findings.push({
            severity: "error",
            area: "playlist",
            code:
              "PLAYLIST_NEXT_SCENARIO_INVALID",
            source:
              "playlistRunLifecycle.ts",
            message:
              "Playlist advance returned the wrong next scenario.",
          });
        }
      }

      // 2. Final scenario completes the playlist.
      const finalScenarioRun =
        createTestRun({
          currentScenarioIndex: 2,
        });

      const completionResult =
        advancePlaylistRunRecord(
          finalScenarioRun,
          endedAt
        );

      if (
        completionResult.kind !==
        "completed"
      ) {
        findings.push({
          severity: "error",
          area: "playlist",
          code:
            "PLAYLIST_FINAL_SCENARIO_NOT_COMPLETED",
          source:
            "playlistRunLifecycle.ts",
          message:
            "Advancing from the final playlist scenario did not complete the run.",
        });
      } else {
        if (
          completionResult.run.status !==
          "completed"
        ) {
          findings.push({
            severity: "error",
            area: "playlist",
            code:
              "PLAYLIST_COMPLETED_STATUS_INVALID",
            source:
              "playlistRunLifecycle.ts",
            message:
              "Completed playlist run did not receive completed status.",
          });
        }

        if (
          completionResult.run.endedAt !==
          endedAt
        ) {
          findings.push({
            severity: "error",
            area: "playlist",
            code:
              "PLAYLIST_COMPLETION_END_TIME_MISSING",
            source:
              "playlistRunLifecycle.ts",
            message:
              "Completed playlist run did not preserve the supplied end time.",
          });
        }
      }

      // 3. Finished runs cannot advance again.
      for (const status of [
        "completed",
        "abandoned",
      ] as const) {
        const finishedRun =
          createTestRun({
            status,
          });

        const finishedResult =
          advancePlaylistRunRecord(
            finishedRun,
            endedAt
          );

        if (
          finishedResult.kind !==
          "ignored"
        ) {
          findings.push({
            severity: "error",
            area: "playlist",
            code:
              "PLAYLIST_FINISHED_RUN_ADVANCED",
            source:
              "playlistRunLifecycle.ts",
            message:
              `Playlist with status "${status}" was allowed to advance.`,
          });
        }
      }

      // 4. Attempt IDs attach once only.
      const attemptRun =
        createTestRun();

      const withAttempt =
        attachAttemptToPlaylistRun(
          attemptRun,
          "attempt_1"
        );

      if (
        withAttempt.attemptIds.length !==
          1 ||
        withAttempt.attemptIds[0] !==
          "attempt_1"
      ) {
        findings.push({
          severity: "error",
          area: "playlist",
          code:
            "PLAYLIST_ATTEMPT_ATTACHMENT_INVALID",
          source:
            "playlistRunLifecycle.ts",
          message:
            "Playlist attempt ID was not attached correctly.",
        });
      }

      const duplicateAttempt =
        attachAttemptToPlaylistRun(
          withAttempt,
          "attempt_1"
        );

      if (
        duplicateAttempt.attemptIds
          .length !== 1
      ) {
        findings.push({
          severity: "error",
          area: "playlist",
          code:
            "PLAYLIST_ATTEMPT_DUPLICATED",
          source:
            "playlistRunLifecycle.ts",
          message:
            "Playlist accepted a duplicate attempt ID.",
        });
      }

      // 5. Attaching attempts must not change playlist order/index.
      if (
        duplicateAttempt
          .currentScenarioIndex !==
          attemptRun.currentScenarioIndex ||
        JSON.stringify(
          duplicateAttempt.scenarioIds
        ) !==
          JSON.stringify(
            attemptRun.scenarioIds
          )
      ) {
        findings.push({
          severity: "error",
          area: "playlist",
          code:
            "PLAYLIST_ATTEMPT_MUTATED_SEQUENCE",
          source:
            "playlistRunLifecycle.ts",
          message:
            "Attaching an attempt changed playlist sequence or current position.",
        });
      }

      // 6. Abandoning a running playlist marks it abandoned.
      const abandonRun =
        createTestRun();

      const abandoned =
        abandonPlaylistRunRecord(
          abandonRun,
          endedAt,
          "attempt_quit"
        );

      if (
        abandoned.status !==
        "abandoned"
      ) {
        findings.push({
          severity: "error",
          area: "playlist",
          code:
            "PLAYLIST_ABANDON_STATUS_INVALID",
          source:
            "playlistRunLifecycle.ts",
          message:
            "Abandoning a running playlist did not mark it abandoned.",
        });
      }

      if (
        abandoned.endedAt !== endedAt
      ) {
        findings.push({
          severity: "error",
          area: "playlist",
          code:
            "PLAYLIST_ABANDON_END_TIME_MISSING",
          source:
            "playlistRunLifecycle.ts",
          message:
            "Abandoned playlist did not preserve the supplied end time.",
        });
      }

      if (
        !abandoned.attemptIds.includes(
          "attempt_quit"
        )
      ) {
        findings.push({
          severity: "error",
          area: "playlist",
          code:
            "PLAYLIST_ABANDON_ATTEMPT_MISSING",
          source:
            "playlistRunLifecycle.ts",
          message:
            "Abandoned playlist did not preserve the final attempt ID.",
        });
      }

      // 7. Already-finished runs cannot be abandoned again.
      const completedRun =
        createTestRun({
          status: "completed",
          endedAt,
        });

      const abandonedCompletedRun =
        abandonPlaylistRunRecord(
          completedRun,
          "2026-01-01T02:00:00.000Z",
          "attempt_extra"
        );

      if (
        abandonedCompletedRun !==
        completedRun
      ) {
        findings.push({
          severity: "error",
          area: "playlist",
          code:
            "PLAYLIST_FINISHED_RUN_ABANDONED",
          source:
            "playlistRunLifecycle.ts",
          message:
            "A finished playlist run was allowed to change through abandon.",
        });
      }

      return findings;
    },
  };