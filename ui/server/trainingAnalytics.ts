// MyHelpDeskSim V2 — Training Analytics Database Helper
// Server-side only. Never import into browser components.
//
// One event per request.
// Event insertion and lifetime counter updates are atomic.
// Duplicate events do not increment counters again.
// Public tracking remains disabled until release approval.

import { neon } from "@neondatabase/serverless";

type BaseEvent = {
  event_id: string;
};

type TrainingAttemptEvent = BaseEvent & {
  attempt_id: string;
  event_type: "start" | "completion" | "retry" | "quit";
  scenario_id: string;
  mode_at_start: "practice" | "assessment" | "investigation";
  outcome?: "PASS" | "FAIL";
};

export type TrainingEvent =
  | TrainingAttemptEvent
  | (BaseEvent & { event_type: "profile_created" })
  | (BaseEvent & { event_type: "playlist_created" })
  | (BaseEvent & { event_type: "playlist_run_started" })
  | (BaseEvent & {
      event_type: "playlist_scenario_included";
      scenario_id: string;
    });

export async function saveTrainingEvents(
  databaseUrl: string,
  events: TrainingEvent[]
): Promise<number> {
  // Process exactly one event at a time.
  if (events.length !== 1) {
    throw new Error("Exactly one training event is required");
  }

  const sql = neon(databaseUrl);
  const payload = JSON.stringify(events);

  // PostgreSQL executes the event insertion and counter changes
  // within one atomic statement.
  //
  // Only newly inserted events produce counter updates.
  // Duplicate events produce no additional totals.

  const result = await sql`
    WITH incoming AS (
      SELECT *
      FROM jsonb_to_recordset(${payload}::jsonb) AS event (
        event_id UUID,
        attempt_id TEXT,
        event_type TEXT,
        scenario_id TEXT,
        mode_at_start TEXT,
        outcome TEXT
      )
    ),

    inserted AS (
      INSERT INTO training_events (
        event_id,
        attempt_id,
        event_type,
        scenario_id,
        mode_at_start,
        outcome
      )
      SELECT
        event_id,
        attempt_id,
        event_type,
        scenario_id,
        mode_at_start,
        outcome
      FROM incoming
      ON CONFLICT DO NOTHING
      RETURNING *
    ),

    scenario_counts AS (
      SELECT
        scenario_id,
        mode_at_start AS mode,

        COUNT(*) FILTER (
          WHERE event_type = 'start'
        ) AS starts,

        COUNT(*) FILTER (
          WHERE event_type = 'completion'
        ) AS completions,

        COUNT(*) FILTER (
          WHERE event_type = 'completion'
            AND outcome = 'PASS'
        ) AS passes,

        COUNT(*) FILTER (
          WHERE event_type = 'completion'
            AND outcome = 'FAIL'
        ) AS fails,

        COUNT(*) FILTER (
          WHERE event_type = 'retry'
        ) AS retries,

        COUNT(*) FILTER (
          WHERE event_type = 'quit'
        ) AS quits

      FROM inserted
      WHERE event_type IN ('start', 'completion', 'retry', 'quit')
      GROUP BY
        scenario_id,
        mode_at_start
    ),

    scenario_updates AS (
      INSERT INTO scenario_lifetime_totals (
        scenario_id,
        mode,
        starts,
        completions,
        passes,
        fails,
        retries,
        quits
      )
      SELECT
        scenario_id,
        mode,
        starts,
        completions,
        passes,
        fails,
        retries,
        quits
      FROM scenario_counts

      ON CONFLICT (scenario_id, mode)
      DO UPDATE SET
        starts =
          scenario_lifetime_totals.starts
          + EXCLUDED.starts,

        completions =
          scenario_lifetime_totals.completions
          + EXCLUDED.completions,

        passes =
          scenario_lifetime_totals.passes
          + EXCLUDED.passes,

        fails =
          scenario_lifetime_totals.fails
          + EXCLUDED.fails,

        retries =
          scenario_lifetime_totals.retries
          + EXCLUDED.retries,

        quits =
          scenario_lifetime_totals.quits
          + EXCLUDED.quits

      RETURNING scenario_id
    ),

    global_updates AS (
      INSERT INTO global_lifetime_totals (
        id,
        profile_creations,
        playlist_creations,
        playlist_runs_started
      )
      SELECT
        1,
        COUNT(*) FILTER (
          WHERE event_type = 'profile_created'
        ),
        COUNT(*) FILTER (
          WHERE event_type = 'playlist_created'
        ),
        COUNT(*) FILTER (
          WHERE event_type = 'playlist_run_started'
        )
      FROM inserted
      HAVING COUNT(*) FILTER (
        WHERE event_type IN (
          'profile_created',
          'playlist_created',
          'playlist_run_started'
        )
      ) > 0

      ON CONFLICT (id)
      DO UPDATE SET
        profile_creations =
          global_lifetime_totals.profile_creations
          + EXCLUDED.profile_creations,

        playlist_creations =
          global_lifetime_totals.playlist_creations
          + EXCLUDED.playlist_creations,

        playlist_runs_started =
          global_lifetime_totals.playlist_runs_started
          + EXCLUDED.playlist_runs_started

      RETURNING id
    ),

    playlist_scenario_counts AS (
      SELECT
        scenario_id,
        COUNT(*) AS inclusions
      FROM inserted
      WHERE event_type = 'playlist_scenario_included'
      GROUP BY scenario_id
    ),

    playlist_scenario_updates AS (
      INSERT INTO playlist_scenario_totals (
        scenario_id,
        inclusions
      )
      SELECT
        scenario_id,
        inclusions
      FROM playlist_scenario_counts

      ON CONFLICT (scenario_id)
      DO UPDATE SET
        inclusions =
          playlist_scenario_totals.inclusions
          + EXCLUDED.inclusions

      RETURNING scenario_id
    )

    SELECT
      (SELECT COUNT(*) FROM inserted) AS inserted_count,
      (SELECT COUNT(*) FROM scenario_updates) AS scenario_rows,
      (SELECT COUNT(*) FROM global_updates) AS global_rows,
      (SELECT COUNT(*) FROM playlist_scenario_updates) AS playlist_scenario_rows
  `;

  return Number(result[0]?.inserted_count ?? 0);
}
