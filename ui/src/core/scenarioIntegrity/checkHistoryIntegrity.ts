// src/core/scenarioIntegrity/checkHistoryIntegrity.ts

import { initialState } from "../state";
import { createScenarioAttemptRecord } from "../../history/createScenarioAttemptRecord";
import { appendUniqueAttemptRecord } from "../../history/historyRecords";

import type { SimState } from "../types";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

function createCompletedState(): SimState {
  return {
    ...initialState(),
    scenario: "password_reset",
    executionState: "SCORECARD",
    attempt: {
      id: "attempt_completed",
      number: 1,
    },
    result: {
      completion: "PASS",
      totalScore: 9,
      mistakes: 1,
    },
    runLog: [
      {
        timestamp:
          "2026-01-01T00:10:00.000Z",
        attemptedInput:
          "wrong command",
        command:
          "unknown",
        decision:
          "DENY",
        plan:
          null,
          outcome:
            "denied",
        mistakeType:
          "unknown",
      },
    ],
  };
}

export const checkHistoryIntegrity:
  ArchitectureIntegrityCheck = {
    name: "History Integrity Inspector",
    area: "history",

    run: (): readonly IntegrityFinding[] => {
      const findings: IntegrityFinding[] = [];

      const startedAt =
        "2026-01-01T00:00:00.000Z";

      const endedAt =
        "2026-01-01T01:00:00.000Z";

      // 1. Completed attempt preserves its result.
      const completedState =
        createCompletedState();

      const completedRecord =
        createScenarioAttemptRecord(
          completedState,
          {
            profileId: "profile_1",
            startedAt,
            endedAt,
            endReason: "completed",
            playlistRunId:
              "playlist_run_1",
          }
        );

      if (completedRecord === null) {
        findings.push({
          severity: "error",
          area: "history",
          code:
            "HISTORY_COMPLETED_RECORD_MISSING",
          source:
            "createScenarioAttemptRecord.ts",
          message:
            "Completed attempt did not produce a History record.",
        });
      } else {
        if (
          completedRecord.status !==
            "completed" ||
          completedRecord.completion !==
            "PASS" ||
          completedRecord.score !== 9 ||
          completedRecord.mistakes !== 1
        ) {
          findings.push({
            severity: "error",
            area: "history",
            code:
              "HISTORY_COMPLETED_RESULT_INVALID",
            source:
              "createScenarioAttemptRecord.ts",
            message:
              "Completed History record did not preserve completion, score, or mistakes.",
          });
        }

        if (
          completedRecord.attemptId !==
            "attempt_completed" ||
          completedRecord.profileId !==
            "profile_1" ||
          completedRecord.scenarioId !==
            "password_reset" ||
          completedRecord.mode !==
            completedState.mode ||
          completedRecord.startedAt !==
            startedAt ||
          completedRecord.endedAt !==
            endedAt ||
          completedRecord.endReason !==
            "completed" ||
          completedRecord.playlistRunId !==
            "playlist_run_1"
        ) {
          findings.push({
            severity: "error",
            area: "history",
            code:
              "HISTORY_COMPLETED_METADATA_INVALID",
            source:
              "createScenarioAttemptRecord.ts",
            message:
              "Completed History record did not preserve attempt metadata.",
          });
        }
      }

      // 2. Quit becomes abandoned with no final score/result.
      const quitState =
        createCompletedState();

      const quitRecord =
        createScenarioAttemptRecord(
          quitState,
          {
            profileId: "profile_1",
            startedAt,
            endedAt,
            endReason: "quit",
          }
        );

      if (
        quitRecord === null ||
        quitRecord.status !==
          "abandoned" ||
        quitRecord.completion !== null ||
        quitRecord.score !== null ||
        quitRecord.endReason !== "quit"
      ) {
        findings.push({
          severity: "error",
          area: "history",
          code:
            "HISTORY_QUIT_RECORD_INVALID",
          source:
            "createScenarioAttemptRecord.ts",
          message:
            "Quit attempt was not recorded as abandoned with no final score or completion.",
        });
      }

      // 3. Restart also becomes abandoned.
      const restartRecord =
        createScenarioAttemptRecord(
          createCompletedState(),
          {
            profileId: "profile_1",
            startedAt,
            endedAt,
            endReason: "restart",
          }
        );

      if (
        restartRecord === null ||
        restartRecord.status !==
          "abandoned" ||
        restartRecord.completion !== null ||
        restartRecord.score !== null ||
        restartRecord.endReason !==
          "restart"
      ) {
        findings.push({
          severity: "error",
          area: "history",
          code:
            "HISTORY_RESTART_RECORD_INVALID",
          source:
            "createScenarioAttemptRecord.ts",
          message:
            "Restarted attempt was not recorded as abandoned with no final score or completion.",
        });
      }

      // 4. Abandoned attempts still preserve mistake count.
      if (
        quitRecord !== null &&
        quitRecord.mistakes !== 1
      ) {
        findings.push({
          severity: "error",
          area: "history",
          code:
            "HISTORY_ABANDONED_MISTAKES_INVALID",
          source:
            "createScenarioAttemptRecord.ts",
          message:
            "Abandoned History record did not preserve DENY-based mistake count.",
        });
      }

      // 5. No attempt means no History record.
      const noAttemptState: SimState = {
        ...createCompletedState(),
        attempt: null,
      };

      const noAttemptRecord =
        createScenarioAttemptRecord(
          noAttemptState,
          {
            profileId: "profile_1",
            startedAt,
            endedAt,
            endReason: "quit",
          }
        );

      if (noAttemptRecord !== null) {
        findings.push({
          severity: "error",
          area: "history",
          code:
            "HISTORY_RECORD_CREATED_WITHOUT_ATTEMPT",
          source:
            "createScenarioAttemptRecord.ts",
          message:
            "History record was created without an active attempt.",
        });
      }

      // 6. No scenario means no History record.
      const noScenarioState: SimState = {
        ...createCompletedState(),
        scenario: null,
      };

      const noScenarioRecord =
        createScenarioAttemptRecord(
          noScenarioState,
          {
            profileId: "profile_1",
            startedAt,
            endedAt,
            endReason: "quit",
          }
        );

      if (noScenarioRecord !== null) {
        findings.push({
          severity: "error",
          area: "history",
          code:
            "HISTORY_RECORD_CREATED_WITHOUT_SCENARIO",
          source:
            "createScenarioAttemptRecord.ts",
          message:
            "History record was created without an active scenario.",
        });
      }

      // 7. Attempt IDs must remain unique in History.
      if (completedRecord !== null) {
        const firstAppend =
          appendUniqueAttemptRecord(
            [],
            completedRecord
          );

        const duplicateAppend =
          appendUniqueAttemptRecord(
            firstAppend,
            completedRecord
          );

        if (
          firstAppend.length !== 1 ||
          duplicateAppend.length !== 1
        ) {
          findings.push({
            severity: "error",
            area: "history",
            code:
              "HISTORY_DUPLICATE_ATTEMPT_ALLOWED",
            source:
              "historyRecords.ts",
            message:
              "History allowed the same attempt ID to be appended more than once.",
          });
        }
      }

      return findings;
    },
  };