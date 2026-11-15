
export type TrainingMode =
  | "practice"
  | "assessment"
  | "investigation";

export type TrainingOutcome = "PASS" | "FAIL";

type EventType =
  | "start"
  | "completion"
  | "retry"
  | "quit";

type ProductEvent =
  | {
      event_id: string;
      event_type: "profile_created" | "playlist_created" | "playlist_run_started";
    }
  | {
      event_id: string;
      event_type: "playlist_scenario_included";
      scenario_id: string;
    };

type TerminalEvent = "completion" | "quit";

type TrainingEvent = {
  event_id: string;
  attempt_id: string;
  event_type: EventType;
  scenario_id: string;
  mode_at_start: TrainingMode;
  outcome?: TrainingOutcome;
};

type AttemptTracking = {
  analyticsAttemptId: string;
  scenarioId: string;
  modeAtStart: TrainingMode;
  terminalEvent: TerminalEvent | null;
  events: Partial<Record<EventType, TrainingEvent>>;
};

const attempts = new Map<string, AttemptTracking>();

const ENDPOINT = "/api/training-events";
const RETRY_DELAY_MS = 500;
const MAX_ATTEMPTS = 2;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function deliverEvent(
  event: TrainingEvent | ProductEvent
): Promise<void> {
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          events: [event],
        }),
      });

      // Disabled analytics and invalid requests must not retry.
      if (
        response.ok ||
        response.status === 503 ||
        (response.status >= 400 && response.status < 500)
      ) {
        return;
      }
    } catch {
      // Network errors may be temporary.
    }

    if (attempt < MAX_ATTEMPTS) {
      await delay(RETRY_DELAY_MS);
    }
  }
}

function recordEvent(
  attempt: AttemptTracking,
  eventType: EventType,
  outcome?: TrainingOutcome
): void {
  if (attempt.events[eventType]) return;

  // Only one terminal event is permitted per attempt.
  if (
    (eventType === "completion" || eventType === "quit") &&
    attempt.terminalEvent !== null
  ) {
    return;
  }

  if (eventType === "completion" && !outcome) {
    return;
  }

  const event: TrainingEvent = {
    event_id: crypto.randomUUID(),
    attempt_id: attempt.analyticsAttemptId,
    event_type: eventType,
    scenario_id: attempt.scenarioId,
    mode_at_start: attempt.modeAtStart,
  };

  if (eventType === "completion") {
    event.outcome = outcome;
  }

  // Store the event before sending so its UUID stays stable.
  attempt.events[eventType] = event;

  if (eventType === "completion" || eventType === "quit") {
    attempt.terminalEvent = eventType;
  }

  // Analytics failures must not block simulator actions.
  void deliverEvent(event);
}

export function trackAttemptStart(
  simulatorAttemptId: string,
  scenarioId: string,
  modeAtStart: TrainingMode
): void {
  if (attempts.has(simulatorAttemptId)) return;

  const attempt: AttemptTracking = {
    analyticsAttemptId: crypto.randomUUID(),
    scenarioId,
    modeAtStart,
    terminalEvent: null,
    events: {},
  };

  attempts.set(simulatorAttemptId, attempt);
  recordEvent(attempt, "start");
}

export function trackAttemptCompletion(
  simulatorAttemptId: string,
  outcome: TrainingOutcome
): void {
  const attempt = attempts.get(simulatorAttemptId);
  if (!attempt) return;

  recordEvent(attempt, "completion", outcome);
}

export function trackAttemptQuit(
  simulatorAttemptId: string
): void {
  const attempt = attempts.get(simulatorAttemptId);
  if (!attempt) return;

  recordEvent(attempt, "quit");
}

export function trackAttemptRetry(
  simulatorAttemptId: string
): void {
  const attempt = attempts.get(simulatorAttemptId);
  if (!attempt) return;

  recordEvent(attempt, "retry");
}

function trackProductEvent(
  event: ProductEvent
): void {
  // Analytics must never block simulator actions.
  void deliverEvent(event);
}

export function trackProfileCreated(): void {
  trackProductEvent({
    event_id: crypto.randomUUID(),
    event_type: "profile_created",
  });
}

export function trackPlaylistCreated(): void {
  trackProductEvent({
    event_id: crypto.randomUUID(),
    event_type: "playlist_created",
  });
}

export function trackPlaylistRunStarted(): void {
  trackProductEvent({
    event_id: crypto.randomUUID(),
    event_type: "playlist_run_started",
  });
}

const PLAYLIST_INCLUSION_LEDGER_KEY =
  "myhelpdesksim_playlist_inclusion_ledger_v1";

export function trackPlaylistScenarioIncluded(
  playlistId: string,
  scenarioId: string
): void {
  const pair = JSON.stringify([playlistId, scenarioId]);

  try {
    const stored = localStorage.getItem(
      PLAYLIST_INCLUSION_LEDGER_KEY
    );

    const parsed: unknown = stored === null
      ? []
      : JSON.parse(stored);

    const seen = new Set(
      Array.isArray(parsed)
        ? parsed.filter(
            (value): value is string =>
              typeof value === "string"
          )
        : []
    );

    if (seen.has(pair)) return;

    seen.add(pair);

    localStorage.setItem(
      PLAYLIST_INCLUSION_LEDGER_KEY,
      JSON.stringify([...seen])
    );
  } catch {
    // Storage failure must not interrupt playlist actions.
    return;
  }

  trackProductEvent({
    event_id: crypto.randomUUID(),
    event_type: "playlist_scenario_included",
    scenario_id: scenarioId,
  });
}
