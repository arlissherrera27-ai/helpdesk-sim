import { useState } from "react";
import { useResponsive } from "./useResponsive";

import type {
  TrainingRole,
  UserProfile,
  AgeRange,
  ITExperience,
  TrainingGoal,
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
  const { isMobile } = useResponsive();
  const [displayName, setDisplayName] = useState("");

const [trainingRole, setTrainingRole] =
  useState<TrainingRole>("help_desk_trainee");

const [ageRange, setAgeRange] =
  useState<AgeRange | "">("");

const [itExperience, setITExperience] =
  useState<ITExperience | "">("");

const [trainingGoal, setTrainingGoal] =
  useState<TrainingGoal | "">("");

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

  ...(ageRange !== "" && {
    ageRange,
  }),

  ...(itExperience !== "" && {
    itExperience,
  }),

  ...(trainingGoal !== "" && {
    trainingGoal,
  }),
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
          padding: isMobile ? SPACE.md : SPACE.lg,
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
                fontSize: isMobile ? "16px" : TEXT.body,
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
    Age Range
  </span>

  <select
    value={ageRange}
    onChange={(event) =>
      setAgeRange(event.target.value as AgeRange | "")
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
    <option value="">Prefer not to answer</option>
    <option value="under_18">Under 18</option>
    <option value="18_24">18–24</option>
    <option value="25_34">25–34</option>
    <option value="35_44">35–44</option>
    <option value="45_54">45–54</option>
    <option value="55_64">55–64</option>
    <option value="65_plus">65+</option>
    <option value="prefer_not_to_say">
      Prefer not to say
    </option>
  </select>
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
    IT Experience
  </span>

  <select
    value={itExperience}
    onChange={(event) =>
      setITExperience(
        event.target.value as ITExperience | ""
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
    <option value="">Optional</option>
    <option value="brand_new">Brand new to IT</option>
    <option value="learning">
      Learning / self-taught
    </option>
    <option value="some_hands_on">
      Some hands-on experience
    </option>
    <option value="working_in_it">
      Currently working in IT
    </option>
  </select>
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
    Training Goal
  </span>

  <select
    value={trainingGoal}
    onChange={(event) =>
      setTrainingGoal(
        event.target.value as TrainingGoal | ""
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
    <option value="">Optional</option>
    <option value="learn_fundamentals">
      Learn IT fundamentals
    </option>
    <option value="get_first_it_job">
      Prepare for a first IT job
    </option>
    <option value="improve_current_skills">
      Improve current IT skills
    </option>
    <option value="improve_troubleshooting">
      Improve troubleshooting
    </option>
    <option value="exploring_it">
      Explore IT as a career
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