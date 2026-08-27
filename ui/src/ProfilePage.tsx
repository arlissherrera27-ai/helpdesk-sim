import type { UserProfile } from "./profile/types";
import type { ProfileMetrics } from "./profile/calculateProfileMetrics";
import type { ScenarioAttemptRecord } from "./history/types";
import type { SavedPlaylist } from "./playlists/types";
import { getScenarioLabel } from "./core/scenarioRegistry";
import {
  COLORS,
  TEXT,
  SPACE,
  RADIUS,
  CARD,
  BUTTON,
} from "./uiSystem";

type ProfilePageProps = {
  activeProfile: UserProfile | null;
  metrics: ProfileMetrics;
  history: readonly ScenarioAttemptRecord[];
  playlists: readonly SavedPlaylist[];
  onCreateProfile: () => void;
  onOpenHistory: () => void;
  onOpenPlaylists: () => void;
  onBackToSimulator: () => void;
};

export default function ProfilePage({
  activeProfile,
  metrics,
  history,
  playlists,
  onCreateProfile,
  onOpenHistory,
  onOpenPlaylists,
  onBackToSimulator,
}: ProfilePageProps) {
 const profileInitials =
  activeProfile?.displayName
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() ?? "—";

const profileCreatedLabel =
  activeProfile !== null
    ? new Date(activeProfile.createdAt).toLocaleDateString()
    : "—";

const recentHistory = [...history]
  .sort(
    (a, b) =>
      new Date(b.endedAt).getTime() -
      new Date(a.endedAt).getTime()
  )
  .slice(0, 5);

  const recentPlaylists = [...playlists]
  .sort(
    (a, b) =>
      new Date(b.updatedAt).getTime() -
      new Date(a.updatedAt).getTime()
  )
  .slice(0, 3);

return (
    <main
      style={{
        display: "grid",
        gridTemplateColumns: "220px minmax(0, 1fr)",
        gap: SPACE.lg,
        alignItems: "stretch",
        width: "100%",
      }}
    >
      {/* LEFT NAVIGATION RAIL */}
      <aside
        style={{
          borderRight: `1px solid ${COLORS.border}`,
          padding: `${SPACE.lg} ${SPACE.md}`,
          minHeight: "calc(100vh - 116px)",
        }}
      >
        <div
          style={{
            marginBottom: SPACE.lg,
            color: COLORS.text,
            fontSize: TEXT.section,
            fontWeight: 700,
          }}
        >
          Profile
        </div>

        <nav
          style={{
            display: "flex",
            flexDirection: "column",
            gap: SPACE.sm,
          }}
        >
          <button
            type="button"
            style={{
              ...BUTTON.primary,
              width: "100%",
              textAlign: "left",
            }}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={onOpenHistory}
            style={{
              ...BUTTON.secondary,
              width: "100%",
              textAlign: "left",
            }}
          >
            History
          </button>

          <button
            type="button"
            onClick={onOpenPlaylists}
            style={{
              ...BUTTON.secondary,
              width: "100%",
              textAlign: "left",
            }}
          >
            Playlists
          </button>

          <button
            type="button"
            onClick={onBackToSimulator}
            style={{
              ...BUTTON.secondary,
              width: "100%",
              textAlign: "left",
            }}
          >
            Home
          </button>
        </nav>
      </aside>

      {/* PROFILE DASHBOARD */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: SPACE.md,
          minWidth: 0,
          padding: `${SPACE.lg} ${SPACE.lg} ${SPACE.lg} 0`,
        }}
      >
        {/* PROFILE HEADER */}
<header
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: SPACE.md,
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
      Profile
    </h1>

    <p
      style={{
        margin: `${SPACE.xs} 0 0`,
        color: COLORS.muted,
        fontSize: TEXT.body,
        lineHeight: 1.6,
      }}
    >
      Your training identity, progress, and history.
    </p>
  </div>

  {activeProfile === null && (
    <button
      type="button"
      onClick={onCreateProfile}
      style={BUTTON.primary}
    >
      Create Profile
    </button>
  )}
</header>

        {/* TOP DASHBOARD ROW */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "300px minmax(0, 1fr)",
            gap: SPACE.md,
            alignItems: "stretch",
          }}
        >
          {/* IDENTITY */}
          <section
            style={{
              ...CARD.base,
              padding: SPACE.md,
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
              IDENTITY
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: SPACE.md,
                paddingTop: SPACE.sm,
                borderTop: `1px solid ${COLORS.border}`,
              }}
            >
              <div
                style={{
                  width: "58px",
                  height: "58px",
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: RADIUS.pill,
                  border: `1px solid ${COLORS.assessmentStrong}`,
                  background: "rgba(96, 165, 250, 0.14)",
                  color: COLORS.text,
                  fontSize: TEXT.section,
                  fontWeight: 700,
                }}
              >
  {profileInitials}
</div>

              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    color: COLORS.text,
                    fontSize: TEXT.body,
                    fontWeight: 700,
                    marginBottom: SPACE.xs,
                  }}
                >
                  {activeProfile?.displayName ?? "User Profile"}
                </div>

                <div
                  style={{
                    color: COLORS.assessment,
                    fontSize: TEXT.detail,
                    marginBottom: SPACE.sm,
                  }}
                >
                  Help Desk Trainee
                </div>

                <div
                  style={{
                    color: COLORS.muted,
                    fontSize: TEXT.label,
                    lineHeight: 1.6,
                  }}
                >
                  Profile started: {profileCreatedLabel}
                </div>

                <div
                  style={{
                    color: COLORS.success,
                    fontSize: TEXT.label,
                    marginTop: SPACE.xs,
                  }}
                >
                  Training Status: Active
                </div>
              </div>
            </div>
          </section>

          {/* TRAINING OVERVIEW */}
          <section
            style={{
              ...CARD.base,
              padding: SPACE.md,
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
              TRAINING OVERVIEW
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                gap: SPACE.sm,
              }}
            >
              {[
  {
    label: "Total Attempts",
    value: metrics.totalAttempts.toString(),
  },
  {
    label: "Scenarios Completed",
    value: metrics.scenariosCompleted.toString(),
  },
  {
    label: "Pass Rate",
    value:
      metrics.passRate === null
        ? "—"
        : `${Math.round(metrics.passRate)}%`,
  },
  {
    label: "Average Score",
    value:
      metrics.averageScore === null
        ? "—"
        : `${metrics.averageScore.toFixed(1)}/10`,
  },
  {
    label: "Best Score",
    value:
      metrics.bestScore === null
        ? "—"
        : `${metrics.bestScore}/10`,
  },
  {
    label: "Total Mistakes",
    value: metrics.totalMistakes.toString(),
  },
  {
    label: "Practice Attempts",
    value: metrics.practiceAttempts.toString(),
  },
  {
    label: "Assessment Attempts",
    value: metrics.assessmentAttempts.toString(),
  },
].map((item) => (
  <div
    key={item.label}
    style={{
      padding: SPACE.md,
      border: `1px solid ${COLORS.border}`,
      borderRadius: RADIUS.button,
      background: COLORS.panelSoft,
      minHeight: "64px",
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
        fontSize: TEXT.section,
        fontWeight: 700,
      }}
    >
      {item.value}
    </div>
  </div>
))}
            </div>
          </section>
        </div>

        {/* LOWER DASHBOARD */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(340px, 0.85fr)",
            gap: SPACE.md,
            alignItems: "stretch",
          }}
        >
          {/* RECENT HISTORY */}
          <section
            style={{
              ...CARD.base,
              padding: SPACE.md,
              minHeight: "360px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: SPACE.md,
                marginBottom: SPACE.md,
              }}
            >
              <div
                style={{
                  color: COLORS.assessmentStrong,
                  fontSize: TEXT.label,
                  fontWeight: 700,
                }}
              >
                RECENT SCENARIO HISTORY
              </div>

              <button
                type="button"
                onClick={onOpenHistory}
                style={BUTTON.secondary}
              >
                View All History
              </button>
            </div>

            {recentHistory.length === 0 ? (
  <div
    style={{
      padding: `${SPACE.lg} 0`,
      color: COLORS.muted,
      fontSize: TEXT.body,
      textAlign: "center",
    }}
  >
    Recent attempts will appear here.
  </div>
) : (
  <div>
    {recentHistory.map((attempt) => {
      const scenarioLabel =
        getScenarioLabel(attempt.scenarioId);

      const resultLabel =
        attempt.status === "completed"
          ? attempt.completion ?? "Completed"
          : attempt.endReason === "restart"
          ? "Abandoned • Restart"
          : "Abandoned • Quit";

      const scoreLabel =
        attempt.score === null
          ? null
          : `${attempt.score}/10`;

      const endedLabel =
        new Date(attempt.endedAt).toLocaleString();

      return (
        <div
          key={attempt.attemptId}
          style={{
            padding: `${SPACE.md} 0`,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
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
              color: COLORS.body,
              fontSize: TEXT.detail,
              lineHeight: 1.6,
            }}
          >
            {attempt.mode === "practice"
              ? "Practice"
              : "Assessment"}
            {" • "}
            {resultLabel}

            {scoreLabel !== null && (
              <>
                {" • "}
                {scoreLabel}
              </>
            )}

            {" • "}
            {attempt.mistakes}{" "}
            {attempt.mistakes === 1
              ? "mistake"
              : "mistakes"}
          </div>

          <div
            style={{
              marginTop: SPACE.xs,
              color: COLORS.muted,
              fontSize: TEXT.label,
            }}
          >
            {endedLabel}
          </div>
        </div>
      );
    })}
  </div>
)}
          </section>

          {/* RIGHT DASHBOARD COLUMN */}
          <div
            style={{
              display: "grid",
              gridTemplateRows: "auto 1fr",
              gap: SPACE.md,
              minWidth: 0,
            }}
          >
            {/* PLAYLISTS */}
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
                  marginBottom: SPACE.md,
                }}
              >
                <div
                  style={{
                    color: COLORS.assessmentStrong,
                    fontSize: TEXT.label,
                    fontWeight: 700,
                  }}
                >
                  YOUR PLAYLISTS
                </div>

                <button
                  type="button"
                  onClick={onOpenPlaylists}
                  style={BUTTON.secondary}
                >
                  View All Playlists
                </button>
              </div>

              {recentPlaylists.length === 0 ? (
  <div
    style={{
      padding: SPACE.md,
      color: COLORS.muted,
      fontSize: TEXT.body,
      textAlign: "center",
    }}
  >
    No saved playlists yet.
  </div>
) : (
  <div
    style={{
      display: "grid",
      gap: SPACE.sm,
    }}
  >
    {recentPlaylists.map((playlist) => (
      <div
        key={playlist.playlistId}
        style={{
          padding: SPACE.md,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.button,
          background: COLORS.panelSoft,
        }}
      >
        <div
          style={{
            color: COLORS.text,
            fontSize: TEXT.body,
            fontWeight: 700,
            marginBottom: SPACE.xs,
          }}
        >
          {playlist.name}
        </div>

        <div
          style={{
            color: COLORS.muted,
            fontSize: TEXT.detail,
          }}
        >
          {playlist.scenarioIds.length}{" "}
          {playlist.scenarioIds.length === 1
            ? "scenario"
            : "scenarios"}
        </div>
      </div>
    ))}
  </div>
)}
            </section>

            {/* TRAINING PROGRESS */}
            <section
              style={{
                ...CARD.base,
                padding: SPACE.md,
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
                TRAINING PROGRESS
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: SPACE.md,
                }}
              >
                <div
                  style={{
                    paddingRight: SPACE.md,
                    borderRight: `1px solid ${COLORS.border}`,
                  }}
                >
                  <h3
                    style={{
                      margin: `0 0 ${SPACE.sm}`,
                      color: COLORS.body,
                      fontSize: TEXT.detail,
                    }}
                  >
                    Completion by Category
                  </h3>

                  <div
                    style={{
                      color: COLORS.muted,
                      fontSize: TEXT.detail,
                      lineHeight: 1.6,
                    }}
                  >
                    Category progress will appear here.
                  </div>
                </div>

                <div>
                  <h3
                    style={{
                      margin: `0 0 ${SPACE.sm}`,
                      color: COLORS.body,
                      fontSize: TEXT.detail,
                    }}
                  >
                    Strengths &amp; Focus Areas
                  </h3>

                  <div
                    style={{
                      color: COLORS.muted,
                      fontSize: TEXT.detail,
                      lineHeight: 1.6,
                    }}
                  >
                    Training insights will appear here.
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}