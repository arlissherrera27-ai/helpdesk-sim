// MyHelpDeskSim V2 — Training Analytics Event Receiver
// Collection remains disabled until testing and release approval.

import { isValidScenarioId } from "../src/core/scenarios";

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

const MAX_BATCH_SIZE = 10;
const MAX_BODY_LENGTH = 10000;

function isRecord(value: unknown): value is Record<string, unknown> {
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
  return Object.keys(value).every((key) => allowed.includes(key));
}

function isUuid(value: unknown): value is string {
  return typeof value === "string" && UUID_PATTERN.test(value);
}

function isValidEvent(value: unknown): boolean {
  if (!isRecord(value)) return false;

  if (!hasOnlyKeys(value, [
    "event_id",
    "attempt_id",
    "event_type",
    "scenario_id",
    "mode_at_start",
    "outcome",
  ])) {
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
    !MODES.includes(value.mode_at_start as (typeof MODES)[number])
  ) {
    return false;
  }

  if (value.event_type === "completion") {
    return value.outcome === "PASS" || value.outcome === "FAIL";
  }

  return value.outcome == null;
}

function validatePayload(body: unknown): boolean {
  if (!isRecord(body)) return false;
  if (!hasOnlyKeys(body, ["events"])) return false;

  if (!Array.isArray(body.events)) return false;

  if (
    body.events.length === 0 ||
    body.events.length > MAX_BATCH_SIZE
  ) {
    return false;
  }

  const ids = new Set<string>();

  for (const event of body.events) {
    if (!isValidEvent(event)) return false;

    const id = event.event_id as string;

    if (ids.has(id)) return false;
    ids.add(id);
  }

  return true;
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

  // Collection remains off unless explicitly enabled on the server.
  if (process.env.TRAINING_ANALYTICS_ENABLED !== "true") {
    return response.status(503).json({
      error: "Training analytics is disabled",
    });
  }

  // Never fall back to the production feedback database.
  const databaseUrl = process.env.TRAINING_ANALYTICS_DATABASE_URL;

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

    if (raw.length > MAX_BODY_LENGTH) {
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

  // Database insertion and atomic counters are not implemented yet.
  // No events are accepted or stored at this stage.
  return response.status(503).json({
    error: "Training analytics receiver is not ready",
  });
}
