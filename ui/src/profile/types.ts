export type TrainingRole =
  | "help_desk_trainee";

export type AgeRange =
  | "under_18"
  | "18_24"
  | "25_34"
  | "35_44"
  | "45_54"
  | "55_64"
  | "65_plus"
  | "prefer_not_to_say";

export type ITExperience =
  | "brand_new"
  | "learning"
  | "some_hands_on"
  | "working_in_it";

export type TrainingGoal =
  | "learn_fundamentals"
  | "get_first_it_job"
  | "improve_current_skills"
  | "improve_troubleshooting"
  | "exploring_it";

export type UserProfile = {
  profileId: string;
  displayName: string;
  trainingRole: TrainingRole;
  createdAt: string;
  status: "active";

  ageRange?: AgeRange;
  itExperience?: ITExperience;
  trainingGoal?: TrainingGoal;
};