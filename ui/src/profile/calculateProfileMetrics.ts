import type { ScenarioAttemptRecord } from "../history/types";

export type ProfileMetrics = {
  totalAttempts: number;
  scenariosCompleted: number;

  passRate: number | null;
  averageScore: number | null;
  bestScore: number | null;

  failedAttempts: number;

  practiceAttempts: number;
  assessmentAttempts: number;
};

export function calculateProfileMetrics(
  attempts: readonly ScenarioAttemptRecord[]
): ProfileMetrics {
  const completedAttempts = attempts.filter(
    (attempt) =>
      attempt.status === "completed" &&
      attempt.score !== null
  );

  const passedAttempts = completedAttempts.filter(
    (attempt) => attempt.completion === "PASS"
  );

  const completedScenarioIds = new Set(
    passedAttempts.map(
      (attempt) => attempt.scenarioId
    )
  );

  const totalScore = completedAttempts.reduce(
    (sum, attempt) => sum + (attempt.score ?? 0),
    0
  );

  const failedAttempts = completedAttempts.filter(
    (attempt) => attempt.completion === "FAIL"
  ).length;

  const practiceAttempts = attempts.filter(
    (attempt) => attempt.mode === "practice"
  ).length;

  const assessmentAttempts = attempts.filter(
    (attempt) => attempt.mode === "assessment"
  ).length;

  const passRate =
    completedAttempts.length > 0
      ? (passedAttempts.length /
          completedAttempts.length) *
        100
      : null;

  const averageScore =
    completedAttempts.length > 0
      ? totalScore / completedAttempts.length
      : null;

  const bestScore =
    completedAttempts.length > 0
      ? Math.max(
          ...completedAttempts.map(
            (attempt) => attempt.score ?? 0
          )
        )
      : null;

  return {
    totalAttempts: attempts.length,

    scenariosCompleted:
      completedScenarioIds.size,

    passRate,

    averageScore,

    bestScore,

    failedAttempts,

    practiceAttempts,

    assessmentAttempts,
  };
}