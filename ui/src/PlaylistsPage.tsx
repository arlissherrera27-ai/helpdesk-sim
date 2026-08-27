import type { SavedPlaylist } from "./playlists/types";

import {
  COLORS,
  TEXT,
  SPACE,
  CARD,
  BUTTON,
} from "./uiSystem";

type PlaylistsPageProps = {
  playlists: readonly SavedPlaylist[];
  onCreatePlaylist: () => void;
  onOpenPlaylist: (playlistId: string) => void;
  onRunPlaylist: (playlistId: string) => void;
  onBackToProfile: () => void;
};

export default function PlaylistsPage({
  playlists,
  onCreatePlaylist,
  onOpenPlaylist,
  onRunPlaylist,
  onBackToProfile,
}: PlaylistsPageProps) {
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
            Playlists
          </h1>

          <p
            style={{
              margin: `${SPACE.xs} 0 0`,
              color: COLORS.muted,
              fontSize: TEXT.body,
              lineHeight: 1.6,
            }}
          >
            Build reusable training sequences from your scenarios.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: SPACE.sm,
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={onBackToProfile}
            style={BUTTON.secondary}
          >
            Back to Profile
          </button>

          <button
            type="button"
            onClick={onCreatePlaylist}
            style={BUTTON.primary}
          >
            Create Playlist
          </button>
        </div>
      </header>

      <section
        style={{
          ...CARD.base,
          padding: SPACE.md,
          minHeight: "360px",
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
          YOUR PLAYLISTS
        </div>

        {playlists.length === 0 ? (
  <div
    style={{
      minHeight: "280px",
      display: "grid",
      placeItems: "center",
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
    {playlists.map((playlist) => {
      const updatedLabel =
        new Date(playlist.updatedAt).toLocaleDateString();

      return (
        <div
          key={playlist.playlistId}
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
            }}
          >
            <div style={{ minWidth: 0 }}>
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
                  lineHeight: 1.6,
                }}
              >
                {playlist.scenarioIds.length}{" "}
                {playlist.scenarioIds.length === 1
                  ? "scenario"
                  : "scenarios"}
                {" • "}
                Updated {updatedLabel}
              </div>
            </div>

            <div
  style={{
    display: "flex",
    gap: SPACE.sm,
    flexWrap: "wrap",
  }}
>
  <button
    type="button"
    disabled={playlist.scenarioIds.length === 0}
    onClick={() => {
      if (playlist.scenarioIds.length === 0) {
        return;
      }

      onRunPlaylist(playlist.playlistId);
    }}
    style={{
      ...BUTTON.primary,
      opacity:
        playlist.scenarioIds.length === 0
          ? 0.5
          : 1,
      cursor:
        playlist.scenarioIds.length === 0
          ? "default"
          : "pointer",
    }}
  >
    Run Playlist
  </button>

  <button
    type="button"
    onClick={() =>
      onOpenPlaylist(playlist.playlistId)
    }
    style={BUTTON.secondary}
  >
    Open
  </button>
</div>
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