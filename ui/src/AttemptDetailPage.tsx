import type { ScenarioAttemptRecord } from "./history/types";
import { getScenarioLabel } from "./core/scenarioRegistry";
import { getPreviewStepLabel } from "./core/scenarioTree";
import {
  COLORS,
  TEXT,
  SPACE,
  CARD,
  BUTTON,
} from "./uiSystem";

type AttemptDetailPageProps = {
  attempt: ScenarioAttemptRecord;
  onBackToHistory: () => void;
};

export default function AttemptDetailPage({
  attempt,
  onBackToHistory,
}: AttemptDetailPageProps) {
  const scenarioLabel =
    getScenarioLabel(attempt.scenarioId);

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

  const startedLabel =
    new Date(attempt.startedAt).toLocaleString();

  const endedLabel =
    new Date(attempt.endedAt).toLocaleString();

  const procedureHistory = attempt.runLog.filter(
  (event) =>
    event.plan !== "ReadOnly" &&
    event.plan !== "StartNewAttempt" &&
    event.plan !== "SelectScenario" &&
    event.plan !== "QuitAttemptToLobby" &&
    event.plan !== "ViewScorecard"
);

function getProcedureDisplayLabel(
  event: ScenarioAttemptRecord["runLog"][number]
): string {
  if (event.plan !== null) {
    return getPreviewStepLabel(
      event.plan
        .replace(/([a-z])([A-Z])/g, "$1_$2")
        .toLowerCase()
    );
  }

  return event.attemptedInput ?? event.command;
}

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
            Attempt Detail
          </h1>

          <p
            style={{
              margin: `${SPACE.xs} 0 0`,
              color: COLORS.muted,
              fontSize: TEXT.body,
              lineHeight: 1.6,
            }}
          >
            Review one recorded training attempt.
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
          ...CARD.base,
          padding: SPACE.lg,
          marginBottom: SPACE.md,
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
          ATTEMPT SUMMARY
        </div>

        <h2
          style={{
            margin: `0 0 ${SPACE.lg}`,
            color: COLORS.text,
            fontSize: TEXT.section,
          }}
        >
          {scenarioLabel}
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(4, minmax(0, 1fr))",
            gap: SPACE.md,
          }}
        >
          {[
            {
              label: "Mode",
              value:
                attempt.mode === "practice"
                  ? "Practice"
                  : "Assessment",
            },
            {
              label: "Result",
              value: resultLabel,
            },
            {
              label: "Score",
              value: scoreLabel,
            },
            {
              label: "Mistakes",
              value: attempt.mistakes.toString(),
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                padding: SPACE.md,
                border: `1px solid ${COLORS.border}`,
                background: COLORS.panelSoft,
              }}
            >
              <div
                style={{
                  color: COLORS.muted,
                  fontSize: TEXT.label,
                  marginBottom: SPACE.sm,
                }}
              >
                {item.label}
              </div>

              <div
                style={{
                  color: COLORS.text,
                  fontSize: TEXT.body,
                  fontWeight: 700,
                }}
              >
                {item.value}
              </div>
            </div>
          ))}
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
          ATTEMPT TIMELINE
        </div>

        <div
          style={{
            color: COLORS.body,
            fontSize: TEXT.detail,
            lineHeight: 1.8,
          }}
        >
          <div>
            <strong>Started:</strong>{" "}
            {startedLabel}
          </div>

          <div>
            <strong>Ended:</strong>{" "}
            {endedLabel}
          </div>

          <div>
            <strong>End reason:</strong>{" "}
            {attempt.endReason}
          </div>
        </div>
            </section>

      <section
        style={{
          ...CARD.base,
          padding: SPACE.lg,
          marginTop: SPACE.md,
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
          PROCEDURE HISTORY
        </div>

        {procedureHistory.length === 0 ? (
          <div
            style={{
              color: COLORS.muted,
              fontSize: TEXT.body,
            }}
          >
            No procedure activity recorded.
          </div>
        ) : (
          <div>
            {procedureHistory.map((event, index) => {
              const displayLabel =
                getProcedureDisplayLabel(event);

              const statusLabel =
                event.decision === "ALLOW"
                  ? "✓ CORRECT"
                  : event.mistakeType === "repeated"
                  ? "✕ REPEATED"
                  : event.mistakeType === "unknown"
                  ? "✕ UNKNOWN"
                  : "✕ WRONG";

              return (
                <div
                  key={`${event.timestamp}-${index}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "42px minmax(0, 1fr) 130px",
                    gap: SPACE.md,
                    alignItems: "center",
                    padding: `${SPACE.md} 0`,
                    borderBottom:
                      `1px solid ${COLORS.border}`,
                  }}
                >
                  <div
                    style={{
                      color: COLORS.muted,
                      fontSize: TEXT.detail,
                      fontWeight: 700,
                    }}
                  >
                    {index + 1}.
                  </div>

                  <div>
                    <div
                      style={{
                        color: COLORS.text,
                        fontSize: TEXT.body,
                        fontWeight: 700,
                      }}
                    >
                      {displayLabel}
                    </div>

                    <div
                      style={{
                        marginTop: SPACE.xs,
                        color: COLORS.muted,
                        fontSize: TEXT.label,
                      }}
                    >
                      {new Date(
                        event.timestamp
                      ).toLocaleTimeString()}
                    </div>
                  </div>

                  <div
                    style={{
                      color:
                        event.decision === "ALLOW"
                          ? COLORS.success
                          : "#f87171",
                      fontSize: TEXT.label,
                      fontWeight: 700,
                      textAlign: "right",
                    }}
                  >
                    {statusLabel}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}