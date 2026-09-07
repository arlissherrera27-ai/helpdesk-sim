import type { ScenarioAttemptRecord } from "./history/types";
import type { PlaylistRun } from "./playlists/types";
import { getScenarioLabel } from "./core/scenarioRegistry";
import {
  COLORS,
  TEXT,
  SPACE,
  RADIUS,
  CARD,
  BUTTON,
} from "./uiSystem";

type HistoryPageProps = {
  history: readonly ScenarioAttemptRecord[];
  playlistRuns: readonly PlaylistRun[];
  onOpenAttempt: (attemptId: string) => void;
  onOpenPlaylistRun: (playlistRunId: string) => void;
  onBackToProfile: () => void;
};

export default function HistoryPage({
  history,
  playlistRuns,
  onOpenAttempt,
  onOpenPlaylistRun,
  onBackToProfile,
}: HistoryPageProps) {
    const playlistAttemptIds = new Set(
  playlistRuns.flatMap(
    (run) => run.attemptIds
  )
);

const standaloneHistory = history.filter(
  (attempt) =>
    !playlistAttemptIds.has(
      attempt.attemptId
    )
);

const sortedStandaloneHistory =
  [...standaloneHistory].sort(
    (a, b) =>
      new Date(b.endedAt).getTime() -
      new Date(a.endedAt).getTime()
  );

const sortedPlaylistRuns =
  [...playlistRuns]
    .filter(
      (run) =>
        run.status !== "running"
    )
    .sort(
      (a, b) => {
        const aTime =
          a.endedAt === null
            ? 0
            : new Date(
                a.endedAt
              ).getTime();

        const bTime =
          b.endedAt === null
            ? 0
            : new Date(
                b.endedAt
              ).getTime();

        return bTime - aTime;
      }
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
          <h1
            style={{
              margin: 0,
              color: COLORS.text,
              fontSize: TEXT.title,
            }}
          >
            History
          </h1>

          <p
            style={{
              margin: `${SPACE.xs} 0 0`,
              color: COLORS.muted,
              fontSize: TEXT.body,
              lineHeight: 1.6,
            }}
          >
            Review your recorded training attempts and results.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToProfile}
          style={BUTTON.secondary}
        >
          Back to Profile
        </button>
      </header>

      <section
        style={{
          ...CARD.base,
          padding: SPACE.md,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: SPACE.md,
            paddingBottom: SPACE.md,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          <div
            style={{
              color: COLORS.assessmentStrong,
              fontSize: TEXT.label,
              fontWeight: 700,
            }}
          >
            ATTEMPT HISTORY
          </div>

          <div
            style={{
              color: COLORS.muted,
              fontSize: TEXT.label,
            }}
          >
            {sortedStandaloneHistory.length +
  sortedPlaylistRuns.length}{" "}
{sortedStandaloneHistory.length +
  sortedPlaylistRuns.length ===
1
  ? "record"
  : "records"}
          </div>
        </div>

        {sortedStandaloneHistory.length === 0 &&
sortedPlaylistRuns.length === 0 ? (
  <div
    style={{
      minHeight: "320px",
      display: "grid",
      placeItems: "center",
      padding: SPACE.lg,
      color: COLORS.muted,
      fontSize: TEXT.body,
      textAlign: "center",
      borderRadius: RADIUS.button,
    }}
  >
    No recorded attempts yet.
  </div>
) : (
  <div>
    {sortedPlaylistRuns.map((run) => {
      const runAttempts = run.attemptIds
        .map((attemptId) =>
          history.find(
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
                total +
                (attempt.score ?? 0),
              0
            ) / scoredAttempts.length;

      const scoreLabel =
        averageScore === null
          ? "—"
          : `${averageScore.toFixed(1)}/10`;

      const resultLabel =
        run.status === "completed"
          ? "Completed"
          : "Abandoned";

      const endedLabel =
        run.endedAt === null
          ? "—"
          : new Date(
              run.endedAt
            ).toLocaleString();

      return (
        <button
          key={run.playlistRunId}
          type="button"
          onClick={() =>
            onOpenPlaylistRun(
              run.playlistRunId
            )
          }
          style={{
            display: "grid",
            gridTemplateColumns:
              "minmax(0, 2fr) 120px 150px 90px 170px",
            gap: SPACE.md,
            alignItems: "center",
            padding: `${SPACE.md} 0`,
            borderBottom: `1px solid ${COLORS.border}`,
            width: "100%",
            textAlign: "left",
            fontFamily: "monospace",
            background: "transparent",
            borderTop: "none",
            borderLeft: "none",
            borderRight: "none",
            cursor: "pointer",
          }}
        >
          <div>
            <div
              style={{
                color: COLORS.text,
                fontSize: TEXT.body,
                fontWeight: 700,
                marginBottom: SPACE.xs,
              }}
            >
              {run.playlistName}
            </div>

            <div
              style={{
                color: COLORS.assessmentStrong,
                fontSize: TEXT.label,
              }}
            >
              Playlist Run •{" "}
              {run.scenarioIds.length}{" "}
              {run.scenarioIds.length === 1
                ? "scenario"
                : "scenarios"}
            </div>
          </div>

          <div
            style={{
              color: COLORS.body,
              fontSize: TEXT.detail,
            }}
          >
            {run.mode === "practice"
              ? "Practice"
              : "Assessment"}
          </div>

          <div
            style={{
              color: COLORS.body,
              fontSize: TEXT.detail,
            }}
          >
            {resultLabel}
          </div>

          <div
            style={{
              color: COLORS.text,
              fontSize: TEXT.detail,
              fontWeight: 700,
            }}
          >
            {scoreLabel}
          </div>

          <div
            style={{
              color: COLORS.muted,
              fontSize: TEXT.label,
              textAlign: "right",
            }}
          >
            {endedLabel}
          </div>
        </button>
      );
    })}

    {sortedStandaloneHistory.map(
      (attempt) => {
        const scenarioLabel =
          getScenarioLabel(
            attempt.scenarioId
          );

        const resultLabel =
  attempt.status === "completed"
    ? attempt.completion === "FAIL"
      ? "Failed Attempt"
      : attempt.mistakes === 0
        ? "Perfect Run"
        : "Successful Run"
    : attempt.endReason === "restart"
      ? "Restart"
      : "Quit";

        const scoreLabel =
          attempt.score === null
            ? "—"
            : `${attempt.score}/10`;

        const endedLabel =
          new Date(
            attempt.endedAt
          ).toLocaleString();

        return (
          <button
            key={attempt.attemptId}
            type="button"
            onClick={() =>
              onOpenAttempt(
                attempt.attemptId
              )
            }
            style={{
              display: "grid",
              gridTemplateColumns:
                "minmax(0, 2fr) 120px 150px 90px 170px",
              gap: SPACE.md,
              alignItems: "center",
              padding: `${SPACE.md} 0`,
              borderBottom: `1px solid ${COLORS.border}`,
              width: "100%",
              textAlign: "left",
              fontFamily: "monospace",
              background: "transparent",
              borderTop: "none",
              borderLeft: "none",
              borderRight: "none",
              cursor: "pointer",
            }}
          >
            <div>
              <div
                style={{
                  color: COLORS.text,
                  fontSize: TEXT.body,
                  fontWeight: 700,
                  marginBottom: SPACE.xs,
                }}
              >
                {scenarioLabel}
              </div>

              <div
                style={{
                  color: COLORS.muted,
                  fontSize: TEXT.label,
                }}
              >
                {attempt.mistakes}{" "}
                {attempt.mistakes === 1
                  ? "mistake"
                  : "mistakes"}
              </div>
            </div>

            <div
              style={{
                color: COLORS.body,
                fontSize: TEXT.detail,
              }}
            >
              {attempt.mode === "practice"
                ? "Practice"
                : "Assessment"}
            </div>

            <div
              style={{
                color: COLORS.body,
                fontSize: TEXT.detail,
              }}
            >
              {resultLabel}
            </div>

            <div
              style={{
                color: COLORS.text,
                fontSize: TEXT.detail,
                fontWeight: 700,
              }}
            >
              {scoreLabel}
            </div>

            <div
              style={{
                color: COLORS.muted,
                fontSize: TEXT.label,
                textAlign: "right",
              }}
            >
              {endedLabel}
            </div>
          </button>
        );
      }
    )}
  </div>
)}
      </section>
    </main>
  );
}