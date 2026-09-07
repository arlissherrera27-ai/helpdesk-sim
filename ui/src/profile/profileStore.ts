import type { UserProfile } from "./types";

const ACTIVE_PROFILE_STORAGE_KEY =
  "helpdesk_sim_active_profile";

const SAVED_PROFILES_STORAGE_KEY =
  "helpdesk_sim_saved_profiles";

export function loadActiveProfile(): UserProfile | null {
  const raw = localStorage.getItem(
    ACTIVE_PROFILE_STORAGE_KEY
  );

  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw);

if (
  typeof parsed !== "object" ||
  parsed === null ||
  typeof parsed.profileId !== "string" ||
  typeof parsed.displayName !== "string" ||
  parsed.trainingRole !== "help_desk_trainee" ||
  typeof parsed.createdAt !== "string" ||
  parsed.status !== "active" ||
  (
    parsed.ageRange !== undefined &&
    ![
      "under_18",
      "18_24",
      "25_34",
      "35_44",
      "45_54",
      "55_64",
      "65_plus",
      "prefer_not_to_say",
    ].includes(parsed.ageRange)
  ) ||
  (
    parsed.itExperience !== undefined &&
    ![
      "brand_new",
      "learning",
      "some_hands_on",
      "working_in_it",
    ].includes(parsed.itExperience)
  ) ||
  (
    parsed.trainingGoal !== undefined &&
    ![
      "learn_fundamentals",
      "get_first_it_job",
      "improve_current_skills",
      "improve_troubleshooting",
      "exploring_it",
    ].includes(parsed.trainingGoal)
  )
) {
  return null;
}

    return parsed as UserProfile;
  } catch {
    return null;
  }
}

export function saveActiveProfile(
  profile: UserProfile
): void {
  localStorage.setItem(
    ACTIVE_PROFILE_STORAGE_KEY,
    JSON.stringify(profile)
  );

  saveProfile(profile);
}

export function clearActiveProfile(): void {
  const activeProfile = loadActiveProfile();

  if (activeProfile !== null) {
    saveProfile(activeProfile);
  }

  localStorage.removeItem(
    ACTIVE_PROFILE_STORAGE_KEY
  );
}

export function loadSavedProfiles(): UserProfile[] {
  const raw = localStorage.getItem(
    SAVED_PROFILES_STORAGE_KEY
  );

  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

return parsed.filter(
  (profile): profile is UserProfile =>
    typeof profile === "object" &&
    profile !== null &&
    typeof profile.profileId === "string" &&
    typeof profile.displayName === "string" &&
    profile.trainingRole === "help_desk_trainee" &&
    typeof profile.createdAt === "string" &&
    profile.status === "active" &&
    (
      profile.ageRange === undefined ||
      [
        "under_18",
        "18_24",
        "25_34",
        "35_44",
        "45_54",
        "55_64",
        "65_plus",
        "prefer_not_to_say",
      ].includes(profile.ageRange)
    ) &&
    (
      profile.itExperience === undefined ||
      [
        "brand_new",
        "learning",
        "some_hands_on",
        "working_in_it",
      ].includes(profile.itExperience)
    ) &&
    (
      profile.trainingGoal === undefined ||
      [
        "learn_fundamentals",
        "get_first_it_job",
        "improve_current_skills",
        "improve_troubleshooting",
        "exploring_it",
      ].includes(profile.trainingGoal)
    )
);;
  } catch {
    return [];
  }
}


function saveProfile(profile: UserProfile): void {
  const profiles = loadSavedProfiles();

  const existingIndex = profiles.findIndex(
    (savedProfile) =>
      savedProfile.profileId === profile.profileId
  );

  if (existingIndex >= 0) {
    profiles[existingIndex] = profile;
  } else {
    profiles.push(profile);
  }

  localStorage.setItem(
    SAVED_PROFILES_STORAGE_KEY,
    JSON.stringify(profiles)
  );
}