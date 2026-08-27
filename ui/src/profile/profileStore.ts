import type { UserProfile } from "./types";

const PROFILE_STORAGE_KEY = "helpdesk_sim_active_profile";

export function loadActiveProfile(): UserProfile | null {
  const raw = localStorage.getItem(PROFILE_STORAGE_KEY);

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
      parsed.status !== "active"
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
    PROFILE_STORAGE_KEY,
    JSON.stringify(profile)
  );
}

export function clearActiveProfile(): void {
  localStorage.removeItem(PROFILE_STORAGE_KEY);
}