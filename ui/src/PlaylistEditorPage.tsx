import { useState } from "react";
import type { SavedPlaylist } from "./playlists/types";

import {
  COLORS,
  TEXT,
  SPACE,
  CARD,
  BUTTON,
} from "./uiSystem";

import { getScenarioLabel } from "./core/scenarioRegistry";

type PlaylistEditorPageProps = {
  playlist: SavedPlaylist | null;
  onSave: (name: string) => void;
  onAddScenario: () => void;
  onMoveScenario: (
    scenarioId: string,
    direction: "up" | "down"
  ) => void;
  onRemoveScenario: (scenarioId: string) => void;
  onBackToPlaylists: () => void;
};

export default function PlaylistEditorPage({
  playlist,
  onSave,
  onAddScenario,
  onMoveScenario,
  onRemoveScenario,
  onBackToPlaylists,
}: PlaylistEditorPageProps) {
  const [name, setName] = useState(
  playlist?.name ?? ""
);

  const trimmedName = name.trim();
  const canSave = trimmedName.length > 0;

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
            {playlist === null
  ? "Create Playlist"
  : "Edit Playlist"}
          </h1>

          <p
            style={{
              margin: `${SPACE.xs} 0 0`,
              color: COLORS.muted,
              fontSize: TEXT.body,
              lineHeight: 1.6,
            }}
          >
            Build a reusable sequence of help desk scenarios.
          </p>
        </div>

        <button
          type="button"
          onClick={onBackToPlaylists}
          style={BUTTON.secondary}
        >
          Back to Playlists
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
          PLAYLIST DETAILS
        </div>

        <div>
  <label
    htmlFor="playlist-name"
    style={{
      display: "block",
      marginBottom: SPACE.sm,
      color: COLORS.body,
      fontSize: TEXT.detail,
    }}
  >
    Playlist Name
  </label>

  <input
    id="playlist-name"
    type="text"
    value={name}
    onChange={(event) =>
      setName(event.target.value)
    }
    placeholder="Example: Help Desk Fundamentals"
    style={{
      width: "100%",
      boxSizing: "border-box",
      padding: "10px 12px",
      fontFamily: "monospace",
      fontSize: TEXT.body,
      color: COLORS.text,
      background: COLORS.panelSoft,
      border: `1px solid ${COLORS.border}`,
      borderRadius: "8px",
    }}
  />

  <div
    style={{
      display: "flex",
      justifyContent: "flex-end",
      marginTop: SPACE.md,
    }}
  >
    <button
      type="button"
      disabled={!canSave}
      onClick={() => {
        if (!canSave) {
          return;
        }

        onSave(trimmedName);
      }}
      style={{
        ...BUTTON.primary,
        opacity: canSave ? 1 : 0.5,
        cursor: canSave
          ? "pointer"
          : "default",
      }}
    >
      Save Playlist
    </button>
  </div>
</div>
      </section>

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
          SCENARIO SEQUENCE
        </div>

        {playlist === null ||
playlist.scenarioIds.length === 0 ? (
  <div
    style={{
      minHeight: "220px",
      display: "grid",
      placeItems: "center",
      color: COLORS.muted,
      fontSize: TEXT.body,
      textAlign: "center",
    }}
  >
    No scenarios added yet.
  </div>
) : (
  <div
    style={{
      display: "grid",
      gap: SPACE.sm,
    }}
  >
    {playlist.scenarioIds.map(
  (scenarioId, index) => {
    const isFirst = index === 0;
    const isLast =
      index === playlist.scenarioIds.length - 1;

    return (
      <div
        key={`${scenarioId}-${index}`}
        style={{
          ...CARD.base,
          padding: SPACE.md,
          display: "flex",
          alignItems: "center",
          gap: SPACE.md,
        }}
      >
        <div
          style={{
            width: "30px",
            height: "30px",
            display: "grid",
            placeItems: "center",
            flex: "0 0 auto",
            borderRadius: "999px",
            background: COLORS.panelSoft,
            color: COLORS.assessmentStrong,
            fontSize: TEXT.detail,
            fontWeight: 700,
          }}
        >
          {index + 1}
        </div>

        <div
          style={{
            flex: 1,
            color: COLORS.text,
            fontSize: TEXT.body,
            fontWeight: 700,
          }}
        >
          {getScenarioLabel(scenarioId)}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: SPACE.sm,
          }}
        >
          <button
            type="button"
            disabled={isFirst}
            onClick={() => {
              onMoveScenario(
                scenarioId,
                "up"
              );
            }}
            title="Move scenario up"
            style={{
              ...BUTTON.secondary,
              opacity: isFirst ? 0.4 : 1,
              cursor: isFirst
                ? "default"
                : "pointer",
            }}
          >
            ↑
          </button>

          <button
            type="button"
            disabled={isLast}
            onClick={() => {
              onMoveScenario(
                scenarioId,
                "down"
              );
            }}
            title="Move scenario down"
            style={{
              ...BUTTON.secondary,
              opacity: isLast ? 0.4 : 1,
              cursor: isLast
                ? "default"
                : "pointer",
            }}
          >
            ↓
          </button>

          <button
            type="button"
            onClick={() => {
              onRemoveScenario(scenarioId);
            }}
            style={{
              ...BUTTON.secondary,
            }}
          >
            Remove
          </button>
        </div>
      </div>
    );
  }
)}
  </div>
)}
<div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    marginTop: SPACE.md,
    paddingTop: SPACE.md,
    borderTop: `1px solid ${COLORS.border}`,
  }}
>
  <button
  type="button"
  onClick={onAddScenario}
  style={{
    ...BUTTON.secondary,
  }}
>
  + Add Scenario
</button>
</div>
      </section>

    </main>
  );
}