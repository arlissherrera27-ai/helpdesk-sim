import { createHmac } from "node:crypto";
import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

export const ADMIN_LOGIN_SOURCE_SCOPE = "admin-login-source" as const;
export const ADMIN_LOGIN_GLOBAL_SCOPE = "admin-login-global" as const;
export const ADMIN_LOGIN_GLOBAL_SOURCE = "global" as const;

export const ADMIN_LOGIN_SOURCE_LIMIT = 5;
export const ADMIN_LOGIN_GLOBAL_LIMIT = 25;
export const ADMIN_LOGIN_WINDOW_SECONDS = 10 * 60;
export const ADMIN_LOGIN_BLOCK_SECONDS = 15 * 60;
export const ADMIN_LOGIN_RECORD_TTL_SECONDS = 2 * 60 * 60;

export type AdminLoginSource = "source" | "global";
export type AdminLoginAdmissionStatus = "allowed" | "rate_limited" | "unavailable";

export type AdminLoginAdmissionResult =
  | {
      status: "allowed";
      sourceDigest: string;
      retryAfterMs: number;
    }
  | {
      status: "rate_limited";
      sourceDigest: string;
      retryAfterMs: number;
      scope: AdminLoginSource;
    }
  | {
      status: "unavailable";
      sourceDigest: string;
      code: "missing-secret" | "missing-database-url" | "database-error";
    };

type RequestLike = {
  headers: Headers | Record<string, string | string[] | undefined>;
};

type ThrottleRow = {
  scope: string;
  source_digest: string;
  request_count: number;
  failure_count: number;
  window_started_at: string | null;
  blocked_until: string | null;
  expires_at: string | null;
  updated_at: string | null;
};

function getAdminLoginThrottleSecret(): string | undefined {
  const secret =
    process.env.ADMIN_LOGIN_THROTTLE_SECRET ?? process.env.ADMIN_SESSION_SECRET;

  if (typeof secret !== "string" || secret.trim().length < 32) {
    return undefined;
  }

  return secret.trim();
}

function getTrainingAnalyticsDatabaseUrl(): string | undefined {
  const databaseUrl = process.env.TRAINING_ANALYTICS_DATABASE_URL;

  if (typeof databaseUrl !== "string" || databaseUrl.trim().length === 0) {
    return undefined;
  }

  return databaseUrl.trim();
}

function getRequestHeaders(headers: RequestLike["headers"]): Headers {
  if (headers instanceof Headers) {
    return headers;
  }

  return new Headers(headers as Record<string, string>);
}

export function deriveSourceDigest(
  request: RequestLike,
  secret: string
): string {
  const headers = getRequestHeaders(request.headers);
  const forwardedFor = headers.get("x-forwarded-for");
  const trustedSource =
    forwardedFor?.split(",")[0]?.trim() ||
    headers.get("cf-connecting-ip") ||
    "unknown-source";

  return createHmac("sha256", secret).update(trustedSource).digest("hex");
}

function isRowBlocked(row: ThrottleRow | null, now: Date): boolean {
  if (!row || !row.blocked_until) {
    return false;
  }

  return new Date(row.blocked_until).getTime() > now.getTime();
}

function getRetryAfterMs(row: ThrottleRow | null, now: Date): number {
  if (!row || !row.blocked_until) {
    return 0;
  }

  return Math.max(0, new Date(row.blocked_until).getTime() - now.getTime());
}

async function reserveAttemptInTransaction(
  sql: NeonQueryFunction<false, false>,
  sourceDigest: string
): Promise<AdminLoginAdmissionResult> {
  const now = new Date();

  const rows = (await sql`
    INSERT INTO analytics_request_limits (
      scope,
      source_digest,
      request_count,
      failure_count,
      window_started_at,
      blocked_until,
      expires_at,
      updated_at
    )
    VALUES (
      ${ADMIN_LOGIN_SOURCE_SCOPE},
      ${sourceDigest},
      1,
      0,
      NOW(),
      NULL,
      NOW() + (${ADMIN_LOGIN_RECORD_TTL_SECONDS}::integer * INTERVAL '1 second'),
      NOW()
    )
    ON CONFLICT (scope, source_digest)
    DO UPDATE SET
      window_started_at = CASE
        WHEN (analytics_request_limits.window_started_at IS NULL)
          OR (analytics_request_limits.window_started_at < NOW() - (${ADMIN_LOGIN_WINDOW_SECONDS}::integer * INTERVAL '1 second'))
          THEN NOW()
        ELSE analytics_request_limits.window_started_at
      END,
      request_count = CASE
        WHEN analytics_request_limits.blocked_until IS NOT NULL
          AND analytics_request_limits.blocked_until > NOW()
          THEN analytics_request_limits.request_count
        WHEN (analytics_request_limits.window_started_at IS NULL)
          OR (analytics_request_limits.window_started_at < NOW() - (${ADMIN_LOGIN_WINDOW_SECONDS}::integer * INTERVAL '1 second'))
          THEN 1
        ELSE analytics_request_limits.request_count + 1
      END,
      blocked_until = CASE
        WHEN analytics_request_limits.blocked_until IS NOT NULL
          AND analytics_request_limits.blocked_until > NOW()
          THEN analytics_request_limits.blocked_until
        WHEN analytics_request_limits.window_started_at IS NOT NULL
          AND analytics_request_limits.window_started_at >= NOW() - (${ADMIN_LOGIN_WINDOW_SECONDS}::integer * INTERVAL '1 second')
          AND (analytics_request_limits.request_count + 1 > ${ADMIN_LOGIN_SOURCE_LIMIT})
          THEN NOW() + (${ADMIN_LOGIN_BLOCK_SECONDS}::integer * INTERVAL '1 second')
        ELSE NULL
      END,
      expires_at = CASE
        WHEN analytics_request_limits.expires_at IS NULL
          OR analytics_request_limits.expires_at < NOW() + (${ADMIN_LOGIN_RECORD_TTL_SECONDS}::integer * INTERVAL '1 second')
          THEN NOW() + (${ADMIN_LOGIN_RECORD_TTL_SECONDS}::integer * INTERVAL '1 second')
        ELSE analytics_request_limits.expires_at
      END,
      updated_at = NOW()
    RETURNING *;
  `) as ThrottleRow[];

  const sourceRow = rows[0];

  if (!sourceRow) {
    return {
      status: "unavailable",
      sourceDigest,
      code: "database-error",
    };
  }

  if (isRowBlocked(sourceRow, now)) {
    return {
      status: "rate_limited",
      sourceDigest,
      retryAfterMs: getRetryAfterMs(sourceRow, now),
      scope: "source",
    };
  }

  const sourceRequestCount = Number(sourceRow.request_count ?? 0);

  if (sourceRequestCount > ADMIN_LOGIN_SOURCE_LIMIT) {
    return {
      status: "rate_limited",
      sourceDigest,
      retryAfterMs: 0,
      scope: "source",
    };
  }

  return {
    status: "allowed",
    sourceDigest,
    retryAfterMs: 0,
  };
}

export async function reserveAdminLoginAttempt(
  request: RequestLike
): Promise<AdminLoginAdmissionResult> {
  const secret = getAdminLoginThrottleSecret();
  const databaseUrl = getTrainingAnalyticsDatabaseUrl();

  if (!secret) {
    return {
      status: "unavailable",
      sourceDigest: "missing-secret",
      code: "missing-secret",
    };
  }

  if (!databaseUrl) {
    return {
      status: "unavailable",
      sourceDigest: "missing-secret",
      code: "missing-database-url",
    };
  }

  const sourceDigest = deriveSourceDigest(request, secret);
  const sql: NeonQueryFunction<false, false> = neon(databaseUrl);

  try {
    return await reserveAttemptInTransaction(sql, sourceDigest);
  } catch (error) {
    console.error("admin login throttle failed:", error);

    return {
      status: "unavailable",
      sourceDigest,
      code: "database-error",
    };
  }
}

export async function recordAdminLoginFailure(
  request: RequestLike
): Promise<void> {
  const secret = getAdminLoginThrottleSecret();
  const databaseUrl = getTrainingAnalyticsDatabaseUrl();

  if (!secret || !databaseUrl) {
    return;
  }

  const sourceDigest = deriveSourceDigest(request, secret);
  const sql = neon(databaseUrl);

  try {
    await sql`
      INSERT INTO analytics_request_limits (
        scope,
        source_digest,
        request_count,
        failure_count,
        window_started_at,
        blocked_until,
        expires_at,
        updated_at
      )
      VALUES (
        ${ADMIN_LOGIN_SOURCE_SCOPE},
        ${sourceDigest},
        0,
        1,
        NOW(),
        CASE
          WHEN 1 >= ${ADMIN_LOGIN_SOURCE_LIMIT} THEN NOW() + (${ADMIN_LOGIN_BLOCK_SECONDS}::integer * INTERVAL '1 second')
          ELSE NULL
        END,
        NOW() + (${ADMIN_LOGIN_RECORD_TTL_SECONDS}::integer * INTERVAL '1 second'),
        NOW()
      )
      ON CONFLICT (scope, source_digest)
      DO UPDATE SET
        failure_count = analytics_request_limits.failure_count + 1,
        window_started_at = CASE
          WHEN analytics_request_limits.window_started_at IS NULL
            OR analytics_request_limits.window_started_at < NOW() - (${ADMIN_LOGIN_WINDOW_SECONDS}::integer * INTERVAL '1 second')
            THEN NOW()
          ELSE analytics_request_limits.window_started_at
        END,
        blocked_until = CASE
          WHEN analytics_request_limits.blocked_until IS NOT NULL
            AND analytics_request_limits.blocked_until > NOW()
            THEN analytics_request_limits.blocked_until
          WHEN (analytics_request_limits.failure_count + 1) >= ${ADMIN_LOGIN_SOURCE_LIMIT}
            THEN NOW() + (${ADMIN_LOGIN_BLOCK_SECONDS}::integer * INTERVAL '1 second')
          ELSE NULL
        END,
        expires_at = NOW() + (${ADMIN_LOGIN_RECORD_TTL_SECONDS}::integer * INTERVAL '1 second'),
        updated_at = NOW();
    `;
  } catch {
    // Fail closed. Throttle updates are security-critical and should not disable the login flow.
  }
}

export async function clearAdminLoginFailureState(
  request: RequestLike
): Promise<void> {
  const secret = getAdminLoginThrottleSecret();
  const databaseUrl = getTrainingAnalyticsDatabaseUrl();

  if (!secret || !databaseUrl) {
    return;
  }

  const sourceDigest = deriveSourceDigest(request, secret);
  const sql = neon(databaseUrl);

  try {
    await sql`
      UPDATE analytics_request_limits
      SET
        failure_count = 0,
        blocked_until = CASE
          WHEN blocked_until IS NOT NULL AND blocked_until > NOW()
            THEN blocked_until
          ELSE NULL
        END,
        updated_at = NOW()
      WHERE scope = ${ADMIN_LOGIN_SOURCE_SCOPE}
        AND source_digest = ${sourceDigest};
    `;
  } catch {
    // If per-source cleanup fails, the source remains throttled until the window expires.
  }
}

export async function cleanupExpiredAdminLoginLimits(): Promise<void> {
  const databaseUrl = getTrainingAnalyticsDatabaseUrl();

  if (!databaseUrl) {
    return;
  }

  const sql = neon(databaseUrl);

  try {
    await sql`
      DELETE FROM analytics_request_limits
      WHERE expires_at < NOW();
    `;
  } catch {
    // Fail closed: stale cleanup errors are not a security bypass.
  }
}
