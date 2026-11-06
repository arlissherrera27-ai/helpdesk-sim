import { scryptSync, timingSafeEqual } from "node:crypto";

import {
  createAuthenticatedAdminSession,
} from "../../lib/adminSession";
import {
  clearAdminLoginFailureState,
  recordAdminLoginFailure,
  reserveAdminLoginAttempt,
} from "../../server/adminLoginThrottle";

const ADMIN_LOGIN_PASSWORD_HASH_ENV = "ADMIN_LOGIN_PASSWORD_HASH";
const MAX_BODY_BYTES = 2048;
const MAX_PASSWORD_LENGTH = 256;

type LoginRequestBody = {
  password?: unknown;
};

type ParsedPasswordHash = {
  N: number;
  r: number;
  p: number;
  salt: Buffer;
  expected: Buffer;
};

function parsePasswordHash(hash: string): ParsedPasswordHash | null {
  if (!hash.startsWith("scrypt$")) {
    return null;
  }

  const parts = hash.split("$");

  if (parts.length !== 6) {
    return null;
  }

  const [algorithm, nValue, rValue, pValue, saltHex, expectedHex] = parts;

  if (algorithm !== "scrypt") {
    return null;
  }

  const N = Number(nValue);
  const r = Number(rValue);
  const p = Number(pValue);

  if (
    !Number.isInteger(N) ||
    !Number.isInteger(r) ||
    !Number.isInteger(p) ||
    N <= 1 ||
    r <= 0 ||
    p <= 0
  ) {
    return null;
  }

  if (!/^[0-9a-fA-F]+$/.test(saltHex) || !/^[0-9a-fA-F]+$/.test(expectedHex)) {
    return null;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(expectedHex, "hex");

  if (salt.length === 0 || expected.length === 0) {
    return null;
  }

  return { N, r, p, salt, expected };
}

function verifyPassword(password: string, configuredHash: string): boolean {
  const parsed = parsePasswordHash(configuredHash);

  if (!parsed) {
    return false;
  }

  try {
    const derived = scryptSync(password, parsed.salt, parsed.expected.length, {
      N: parsed.N,
      r: parsed.r,
      p: parsed.p,
    });

    if (derived.length !== parsed.expected.length) {
      return false;
    }

    return timingSafeEqual(derived, parsed.expected);
  } catch {
    return false;
  }
}

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  const loginAdmission = await reserveAdminLoginAttempt(request);

  if (loginAdmission.status === "rate_limited") {
    const retryAfterSeconds = Math.max(1, Math.ceil(loginAdmission.retryAfterMs / 1000));
    response.setHeader("Retry-After", String(retryAfterSeconds));
    return response.status(429).json({
      error: "Too many attempts",
    });
  }

  if (loginAdmission.status === "unavailable") {
    return response.status(503).json({
      error: "Authentication is unavailable",
    });
  }

  let body: unknown;

  try {
    const rawBody =
      typeof request.body === "string"
        ? request.body
        : JSON.stringify(request.body ?? null);

    if (typeof rawBody !== "string" || rawBody.length === 0 || rawBody.length > MAX_BODY_BYTES) {
      return response.status(400).json({
        error: "Invalid request",
      });
    }

    body = JSON.parse(rawBody);
  } catch {
    return response.status(400).json({
      error: "Invalid request",
    });
  }

  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return response.status(400).json({
      error: "Invalid request",
    });
  }

  const { password } = body as LoginRequestBody;

  if (typeof password !== "string" || password.length === 0 || password.length > MAX_PASSWORD_LENGTH) {
    return response.status(400).json({
      error: "Invalid request",
    });
  }

  const configuredHash = process.env[ADMIN_LOGIN_PASSWORD_HASH_ENV];

  if (typeof configuredHash !== "string" || configuredHash.trim().length === 0) {
    return response.status(503).json({
      error: "Authentication is unavailable",
    });
  }

  const isValidPassword = verifyPassword(password, configuredHash);

  if (!isValidPassword) {
    await recordAdminLoginFailure(request);
    return response.status(401).json({
      error: "Invalid credentials",
    });
  }

  try {
    await clearAdminLoginFailureState(request);
    await createAuthenticatedAdminSession(request, response);
    response.setHeader("Cache-Control", "no-store");

    return response.status(200).json({
      success: true,
    });
  } catch {
    return response.status(500).json({
      error: "Authentication failed",
    });
  }
}
