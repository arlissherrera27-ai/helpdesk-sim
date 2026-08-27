export type TrainingRole =
  | "help_desk_trainee";

export type UserProfile = {
  profileId: string;

  displayName: string;

  trainingRole: TrainingRole;

  createdAt: string;

  status: "active";
};