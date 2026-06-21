export type PasswordResetScenarioKind =
  | "password_reset"
  | "password_reset_recovery_email_never_arrives"
  | "password_reset_recovery_email_outdated";

export function isPasswordResetScenarioKind(
  kind: string
): kind is PasswordResetScenarioKind {
  return (
    kind === "password_reset" ||
    kind === "password_reset_recovery_email_never_arrives" ||
    kind === "password_reset_recovery_email_outdated"
  );
}