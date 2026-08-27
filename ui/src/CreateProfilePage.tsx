import { useState } from "react";

import type {
  TrainingRole,
  UserProfile,
} from "./profile/types";

import {
  COLORS,
  TEXT,
  SPACE,
  CARD,
  BUTTON,
} from "./uiSystem";

type CreateProfilePageProps = {
  onBack: () => void;
  onCreate: (profile: UserProfile) => void;
};

function newProfileId(): string {
  return `profile_${Date.now()}_${Math.random()
    .toString(16)
    .slice(2)}`;
}

export default function CreateProfilePage({
  onBack,
  onCreate,
}: CreateProfilePageProps) {
  const [displayName, setDisplayName] = useState("");

  const [trainingRole, setTrainingRole] =
    useState<TrainingRole>("help_desk_trainee");

  const trimmedDisplayName = displayName.trim();

  const canCreate =
    trimmedDisplayName.length > 0;

  function submitProfile() {
    if (!canCreate) {
      return;
    }

    const profile: UserProfile = {
      profileId: newProfileId(),
      displayName: trimmedDisplayName,
      trainingRole,
      createdAt: new Date().toISOString(),
      status: "active",
    };

    onCreate(profile);
  }

  return (
    <main
      style={{
        width: "100%",
        maxWidth: "720px",
        margin: "0 auto",
      }}
    >
      <section
        style={{
          ...CARD.base,
          padding: SPACE.lg,
        }}
      >
        <button
          type="button"
          onClick={onBack}
          style={{
            ...BUTTON.secondary,
            marginBottom: SPACE.lg,
          }}
        >
          ← Back to Profile
        </button>

        <h1
          style={{
            margin: 0,
            color: COLORS.text,
            fontSize: TEXT.title,
          }}
        >
          Create Profile
        </h1>

        <p
          style={{
            margin: `${SPACE.sm} 0 ${SPACE.lg}`,
            color: COLORS.muted,
            fontSize: TEXT.body,
            lineHeight: 1.6,
          }}
        >
          Create your training identity to begin tracking history,
          progress, and playlists.
        </p>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: SPACE.lg,
          }}
        >
          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: SPACE.sm,
            }}
          >
            <span
              style={{
                color: COLORS.body,
                fontSize: TEXT.body,
                fontWeight: 700,
              }}
            >
              Display Name
            </span>

            <input
              value={displayName}
              onChange={(event) =>
                setDisplayName(event.target.value)
              }
              placeholder="Enter your name"
              style={{
                padding: "10px 12px",
                fontFamily: "monospace",
                fontSize: TEXT.body,
                color: COLORS.text,
                background: COLORS.panelSoft,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
              }}
            />
          </label>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: SPACE.sm,
            }}
          >
            <span
              style={{
                color: COLORS.body,
                fontSize: TEXT.body,
                fontWeight: 700,
              }}
            >
              Training Role
            </span>

            <select
              value={trainingRole}
              onChange={(event) =>
                setTrainingRole(
                  event.target.value as TrainingRole
                )
              }
              style={{
                padding: "10px 12px",
                fontFamily: "monospace",
                fontSize: TEXT.body,
                color: COLORS.text,
                background: COLORS.appBg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
              }}
            >
              <option value="help_desk_trainee">
                Help Desk Trainee
              </option>
            </select>
          </label>

          <button
            type="button"
            onClick={submitProfile}
            disabled={!canCreate}
            style={{
              ...BUTTON.primary,
              opacity: canCreate ? 1 : 0.5,
              cursor: canCreate
                ? "pointer"
                : "not-allowed",
            }}
          >
            Create Profile
          </button>
        </div>
      </section>
    </main>
  );
}