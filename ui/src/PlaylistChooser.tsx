import {
  COLORS,
  TEXT,
  SPACE,
  CARD,
  BUTTON,
} from "./uiSystem";

import type { SavedPlaylist } from "./playlists/types";

type PlaylistChooserProps = {
  scenarioId: string;
  scenarioLabel: string;
  playlists: SavedPlaylist[];
  onChoosePlaylist: (playlistId: string) => void;
  onCreateNewPlaylist: () => void;
  onClose: () => void;
};

export default function PlaylistChooser({
  scenarioId,
  scenarioLabel,
  playlists,
  onChoosePlaylist,
  onCreateNewPlaylist,
  onClose,
}: PlaylistChooserProps) {
  return (
    <div
      style={{
        ...CARD.base,
        width: "100%",
        maxWidth: "360px",
        padding: SPACE.md,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: SPACE.md,
          marginBottom: SPACE.md,
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
            CHOOSE A PLAYLIST
          </div>

          <div
            style={{
              color: COLORS.text,
              fontSize: TEXT.body,
              fontWeight: 700,
            }}
          >
            {scenarioLabel}
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            ...BUTTON.secondary,
            padding: "6px 10px",
          }}
        >
          ×
        </button>
      </div>

      {playlists.length === 0 ? (
        <div
          style={{
            padding: `${SPACE.lg} 0`,
            color: COLORS.muted,
            fontSize: TEXT.body,
            textAlign: "center",
            borderTop: `1px solid ${COLORS.border}`,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          No saved playlists yet.
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gap: SPACE.sm,
            padding: `${SPACE.md} 0`,
            borderTop: `1px solid ${COLORS.border}`,
            borderBottom: `1px solid ${COLORS.border}`,
          }}
        >
          {playlists.map((playlist) => {
  const alreadyAdded =
    playlist.scenarioIds.includes(scenarioId);

  return (
    <button
      key={playlist.playlistId}
      type="button"
      disabled={alreadyAdded}
      onClick={() => {
        if (alreadyAdded) {
          return;
        }

        onChoosePlaylist(playlist.playlistId);
      }}
      style={{
        ...CARD.base,
        width: "100%",
        padding: SPACE.md,
        textAlign: "left",
        fontFamily: "monospace",
        cursor: alreadyAdded ? "default" : "pointer",
        opacity: alreadyAdded ? 0.6 : 1,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          gap: SPACE.sm,
          color: COLORS.text,
          fontSize: TEXT.body,
          fontWeight: 700,
        }}
      >
        <span>{playlist.name}</span>

        {alreadyAdded && (
          <span
            style={{
              color: COLORS.muted,
              fontSize: TEXT.detail,
              fontWeight: 400,
            }}
          >
            Already added
          </span>
        )}
      </div>

      <div
        style={{
          marginTop: SPACE.xs,
          color: COLORS.muted,
          fontSize: TEXT.detail,
        }}
      >
        {playlist.scenarioIds.length}{" "}
        {playlist.scenarioIds.length === 1
          ? "scenario"
          : "scenarios"}
      </div>
    </button>
  );
})}
        </div>
      )}

      <button
        type="button"
        onClick={onCreateNewPlaylist}
        style={{
          ...BUTTON.primary,
          width: "100%",
          marginTop: SPACE.md,
        }}
      >
        + Create New Playlist
      </button>
    </div>
  );
}