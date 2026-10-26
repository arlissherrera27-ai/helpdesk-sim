// MyHelpDeskSim V2 — Training Analytics Event Receiver
// Server-side only.
// Public collection remains disabled until release approval.

import { isValidScenarioId } from "../src/core/scenarios.js";
import {
  saveTrainingEvents,
  type TrainingEvent,
} from "../server/trainingAnalytics.js";

const EVENT_TYPES = [
  "start",
  "completion",
  "retry",
  "quit",
  "profile_created",
] as const;

const MODES = [
  "practice",
  "assessment",
  "investigation",
] as const;

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MAX_BODY_LENGTH = 10000;

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function hasOnlyKeys(
  value: Record<string, unknown>,
  allowed: readonly string[]
): boolean {
  return Object.keys(value).every((key) =>
    allowed.includes(key)
  );
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    UUID_PATTERN.test(value)
  );
}

function isValidEvent(
  value: unknown
): value is TrainingEvent {
  if (!isRecord(value)) return false;

  if (
    !hasOnlyKeys(value, [
      "event_id",
      "attempt_id",
      "event_type",
      "scenario_id",
      "mode_at_start",
      "outcome",
    ])
  ) {
    return false;
  }

  if (!isUuid(value.event_id)) return false;

  if (
    !EVENT_TYPES.includes(
      value.event_type as (typeof EVENT_TYPES)[number]
    )
  ) {
    return false;
  }

  if (value.event_type === "profile_created") {
    return (
      value.attempt_id == null &&
      value.scenario_id == null &&
      value.mode_at_start == null &&
      value.outcome == null
    );
  }

  if (!isUuid(value.attempt_id)) return false;

  if (
    typeof value.scenario_id !== "string" ||
    !isValidScenarioId(value.scenario_id)
  ) {
    return false;
  }

  if (
    !MODES.includes(
      value.mode_at_start as (typeof MODES)[number]
    )
  ) {
    return false;
  }

  if (value.event_type === "completion") {
    return (
      value.outcome === "PASS" ||
      value.outcome === "FAIL"
    );
  }

  return value.outcome == null;
}

function validatePayload(
  body: unknown
): body is { events: [TrainingEvent] } {
  if (!isRecord(body)) return false;

  if (!hasOnlyKeys(body, ["events"])) {
    return false;
  }

  if (!Array.isArray(body.events)) {
    return false;
  }

  // Exactly one event per request.
  if (body.events.length !== 1) {
    return false;
  }

  return isValidEvent(body.events[0]);
}

export default async function handler(
  request: any,
  response: any
) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  // Disabled by default.
  if (
    process.env.TRAINING_ANALYTICS_ENABLED !== "true"
  ) {
    return response.status(503).json({
      error: "Training analytics is disabled",
    });
  }

  // Never use the production feedback DATABASE_URL.
  const databaseUrl =
    process.env.TRAINING_ANALYTICS_DATABASE_URL;

  if (!databaseUrl) {
    return response.status(503).json({
      error: "Training analytics database is not configured",
    });
  }

  let body: unknown;

  try {
    const raw =
      typeof request.body === "string"
        ? request.body
        : JSON.stringify(request.body ?? null);

    if (
      typeof raw !== "string" ||
      raw.length > MAX_BODY_LENGTH
    ) {
      return response.status(413).json({
        error: "Request too large",
      });
    }

    body = JSON.parse(raw);
  } catch {
    return response.status(400).json({
      error: "Invalid JSON",
    });
  }

  if (!validatePayload(body)) {
    return response.status(400).json({
      error: "Invalid training event",
    });
  }

  try {
    const insertedCount = await saveTrainingEvents(
      databaseUrl,
      body.events
    );

    return response.status(200).json({
      success: true,
      recorded: insertedCount === 1,
    });
  } catch (error) {
    console.error(
      "Training analytics event failed:",
      error
    );

    return response.status(500).json({
      error: "Could not record training event",
    });
  }
}
