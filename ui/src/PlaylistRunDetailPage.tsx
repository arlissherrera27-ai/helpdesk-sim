import type { PlaylistRun } from "./playlists/types";
import type { ScenarioAttemptRecord } from "./history/types";

import { getScenarioLabel } from "./core/scenarioRegistry";

import {
  COLORS,
  TEXT,
  SPACE,
  CARD,
  BUTTON,
} from "./uiSystem";

type PlaylistRunDetailPageProps = {
  run: PlaylistRun;
  attempts: readonly ScenarioAttemptRecord[];
  onOpenAttempt: (attemptId: string) => void;
  onBackToHistory: () => void;
};

export default function PlaylistRunDetailPage({
  run,
  attempts,
  onOpenAttempt,
  onBackToHistory,
}: PlaylistRunDetailPageProps) {
  const runAttempts = run.attemptIds
    .map((attemptId) =>
      attempts.find(
        (attempt) =>
          attempt.attemptId === attemptId
      )
    )
    .filter(
      (
        attempt
      ): attempt is ScenarioAttemptRecord =>
        attempt !== undefined
    );

  const scoredAttempts =
    runAttempts.filter(
      (attempt) =>
        attempt.score !== null
    );

  const averageScore =
    scoredAttempts.length === 0
      ? null
      : scoredAttempts.reduce(
          (total, attempt) =>
            total + (attempt.score ?? 0),
          0
        ) / scoredAttempts.length;

  const totalMistakes =
    runAttempts.reduce(
      (total, attempt) =>
        total + attempt.mistakes,
      0
    );

  return (
    <main
      style={{
        width: "100%",
        maxWidth: "1180px",
        margin: "0 auto",
      }}
    >
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: SPACE.md,
          marginBottom: SPACE.lg,
        }}
      >
        <div>
          <div
            style={{
              color: COLORS.assessmentStrong,
              fontSize: TEXT.label,
              fontWeight: 700,
              marginBottom: SPACE.xs,
            }}
          >
            PLAYLIST RUN
          </div>

          <h1
            style={{
              margin: 0,
              color: COLORS.text,
              fontSize: TEXT.title,
            }}
          >
            {run.playlistName}
          </h1>

          <p
            style={{
              margin: `${SPACE.xs} 0 0`,
              color: COLORS.muted,
              fontSize: TEXT.body,
            }}
          >
            {run.scenarioIds.length}{" "}
            {run.scenarioIds.length === 1
              ? "scenario"
              : "scenarios"}
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToHistory}
          style={BUTTON.secondary}
        >
          Back to History
        </button>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(3, minmax(0, 1fr))",
          gap: SPACE.md,
          marginBottom: SPACE.md,
        }}
      >
        <div
          style={{
            ...CARD.base,
            padding: SPACE.md,
          }}
        >
          <div
            style={{
              color: COLORS.muted,
              fontSize: TEXT.label,
              marginBottom: SPACE.sm,
            }}
          >
            Result
          </div>

          <div
            style={{
              color: COLORS.text,
              fontSize: TEXT.section,
              fontWeight: 700,
            }}
          >
            {run.status === "completed"
              ? "Completed"
              : "Abandoned"}
          </div>
        </div>

        <div
          style={{
            ...CARD.base,
            padding: SPACE.md,
          }}
        >
          <div
            style={{
              color: COLORS.muted,
              fontSize: TEXT.label,
              marginBottom: SPACE.sm,
            }}
          >
            Average Score
          </div>

          <div
            style={{
              color: COLORS.text,
              fontSize: TEXT.section,
              fontWeight: 700,
            }}
          >
            {averageScore === null
              ? "—"
              : `${averageScore.toFixed(1)}/10`}
          </div>
        </div>

        <div
          style={{
            ...CARD.base,
            padding: SPACE.md,
          }}
        >
          <div
            style={{
              color: COLORS.muted,
              fontSize: TEXT.label,
              marginBottom: SPACE.sm,
            }}
          >
            Total Mistakes
          </div>

          <div
            style={{
              color: COLORS.text,
              fontSize: TEXT.section,
              fontWeight: 700,
            }}
          >
            {totalMistakes}
          </div>
        </div>
      </section>

      <section
        style={{
          ...CARD.base,
          padding: SPACE.lg,
        }}
      >
        <div
          style={{
            color: COLORS.assessmentStrong,
            fontSize: TEXT.label,
            fontWeight: 700,
            marginBottom: SPACE.md,
          }}
        >
          SCENARIO RESULTS
        </div>

        <div
          style={{
            display: "grid",
            gap: SPACE.sm,
          }}
        >
          {run.scenarioIds.map(
            (scenarioId, index) => {
              const scenarioAttempts =
                runAttempts.filter(
                  (attempt) =>
                    attempt.scenarioId ===
                    scenarioId
                );

              const attempt =
                [...scenarioAttempts]
                  .reverse()
                  .find(
                    (item) =>
                      item.status ===
                      "completed"
                  ) ??
                scenarioAttempts[
                  scenarioAttempts.length - 1
                ];

              return (
                <button
                  key={`${scenarioId}-${index}`}
                  type="button"
                  disabled={attempt === undefined}
                  onClick={() => {
                    if (attempt === undefined) {
                      return;
                    }

                    onOpenAttempt(
                      attempt.attemptId
                    );
                  }}
                  style={{
                    ...CARD.base,
                    padding: SPACE.md,
                    display: "flex",
                    justifyContent:
                      "space-between",
                    alignItems: "center",
                    gap: SPACE.md,
                    width: "100%",
                    textAlign: "left",
                    fontFamily: "monospace",
                    cursor:
                      attempt === undefined
                        ? "default"
                        : "pointer",
                    opacity:
                      attempt === undefined
                        ? 0.6
                        : 1,
                  }}
                >
                  <div>
                    <div
                      style={{
                        color: COLORS.text,
                        fontSize: TEXT.body,
                        fontWeight: 700,
                      }}
                    >
                      {index + 1}.{" "}
                      {getScenarioLabel(
                        scenarioId
                      )}
                    </div>

                    <div
                      style={{
                        marginTop: SPACE.xs,
                        color: COLORS.muted,
                        fontSize: TEXT.detail,
                      }}
                    >
                      {attempt === undefined
                        ? "No attempt recorded"
                        : `${attempt.mistakes} ${
                            attempt.mistakes === 1
                              ? "mistake"
                              : "mistakes"
                          }`}
                    </div>
                  </div>

                  <div
  style={{
    color:
  attempt?.completion === "FAIL"
    ? COLORS.assessmentStrong
    : COLORS.success,
    fontSize: TEXT.body,
    fontWeight: 700,
  }}
>
  {attempt?.score === null ||
  attempt === undefined
    ? "—"
    : `${attempt.score}/10`}
</div>
                </button>
              );
            }
          )}
        </div>
      </section>
    </main>
  );
}