-- MyHelpDeskSim V2
-- Patch 1: Training Analytics Database Schema
-- Detailed events expire after 60 days.
-- Lifetime counters are preserved permanently.
-- No personal profiles, typed commands, or visitor identities.

-- 1. Training events

CREATE TABLE IF NOT EXISTS training_events (
    event_id UUID PRIMARY KEY,
    attempt_id TEXT,
    event_type TEXT NOT NULL
        CHECK (event_type IN (
            'start',
            'completion',
            'retry',
            'quit',
            'profile_created'
        )),
    scenario_id TEXT,
    mode_at_start TEXT
        CHECK (mode_at_start IN (
            'practice',
            'assessment',
            'investigation'
        )),
    outcome TEXT
        CHECK (outcome IN ('PASS', 'FAIL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_training_event CHECK (
        (
            event_type = 'profile_created'
            AND attempt_id IS NULL
            AND scenario_id IS NULL
            AND mode_at_start IS NULL
            AND outcome IS NULL
        )
        OR
        (
            event_type <> 'profile_created'
            AND attempt_id IS NOT NULL
            AND scenario_id IS NOT NULL
            AND mode_at_start IS NOT NULL
            AND (
                (event_type = 'completion' AND outcome IS NOT NULL)
                OR
                (event_type <> 'completion' AND outcome IS NULL)
            )
        )
    )
);

CREATE UNIQUE INDEX IF NOT EXISTS training_events_attempt_type_idx
ON training_events (attempt_id, event_type)
WHERE attempt_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS training_events_created_at_idx
ON training_events (created_at);


-- 2. Permanent totals for individual scenarios and modes

CREATE TABLE IF NOT EXISTS scenario_lifetime_totals (
    scenario_id TEXT NOT NULL,
    mode TEXT NOT NULL
        CHECK (mode IN (
            'practice',
            'assessment',
            'investigation'
        )),
    starts BIGINT NOT NULL DEFAULT 0 CHECK (starts >= 0),
    completions BIGINT NOT NULL DEFAULT 0 CHECK (completions >= 0),
    passes BIGINT NOT NULL DEFAULT 0 CHECK (passes >= 0),
    fails BIGINT NOT NULL DEFAULT 0 CHECK (fails >= 0),
    retries BIGINT NOT NULL DEFAULT 0 CHECK (retries >= 0),
    quits BIGINT NOT NULL DEFAULT 0 CHECK (quits >= 0),

    PRIMARY KEY (scenario_id, mode)
);


-- 3. Permanent overall totals

CREATE TABLE IF NOT EXISTS global_lifetime_totals (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
    profile_creations BIGINT NOT NULL DEFAULT 0
        CHECK (profile_creations >= 0)
);


-- 4. Temporary request security limits

CREATE TABLE IF NOT EXISTS analytics_request_limits (
    scope TEXT NOT NULL,
    source_digest TEXT NOT NULL,
    request_count INTEGER NOT NULL DEFAULT 0
        CHECK (request_count >= 0),
    failure_count INTEGER NOT NULL DEFAULT 0
        CHECK (failure_count >= 0),
    window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blocked_until TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (scope, source_digest)
);

CREATE INDEX IF NOT EXISTS analytics_request_limits_expires_idx
ON analytics_request_limits (expires_at);
