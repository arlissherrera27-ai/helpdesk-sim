-- MyHelpDeskSim V2
-- Patch 6 Batch 1: Playlist analytics schema.
-- Preserve existing event rows and lifetime totals.

ALTER TABLE training_events
    DROP CONSTRAINT IF EXISTS training_events_event_type_check,
    DROP CONSTRAINT IF EXISTS valid_training_event;

ALTER TABLE training_events
    ADD CONSTRAINT training_events_event_type_check
        CHECK (event_type IN (
            'start',
            'completion',
            'retry',
            'quit',
            'profile_created',
            'playlist_created',
            'playlist_scenario_included',
            'playlist_run_started'
        )),
    ADD CONSTRAINT valid_training_event CHECK (
        (
            event_type IN (
                'profile_created',
                'playlist_created',
                'playlist_run_started'
            )
            AND attempt_id IS NULL
            AND scenario_id IS NULL
            AND mode_at_start IS NULL
            AND outcome IS NULL
        )
        OR
        (
            event_type = 'playlist_scenario_included'
            AND attempt_id IS NULL
            AND scenario_id IS NOT NULL
            AND mode_at_start IS NULL
            AND outcome IS NULL
        )
        OR
        (
            event_type IN ('start', 'completion', 'retry', 'quit')
            AND attempt_id IS NOT NULL
            AND scenario_id IS NOT NULL
            AND mode_at_start IS NOT NULL
            AND (
                (event_type = 'completion' AND outcome IS NOT NULL)
                OR
                (event_type <> 'completion' AND outcome IS NULL)
            )
        )
    );

ALTER TABLE global_lifetime_totals
    ADD COLUMN IF NOT EXISTS playlist_creations BIGINT NOT NULL DEFAULT 0
        CHECK (playlist_creations >= 0),
    ADD COLUMN IF NOT EXISTS playlist_runs_started BIGINT NOT NULL DEFAULT 0
        CHECK (playlist_runs_started >= 0);

CREATE TABLE IF NOT EXISTS playlist_scenario_totals (
    scenario_id TEXT PRIMARY KEY,
    inclusions BIGINT NOT NULL DEFAULT 0 CHECK (inclusions >= 0)
);