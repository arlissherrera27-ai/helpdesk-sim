import {
  getIronSession,
  nodeCookies,
  type IronSession,
  type SessionOptions,
} from "iron-session";

export type AdminSessionData = {
  authenticated: boolean;
  admin: boolean;
  issuedAt: number;
  expiresAt: number;
};

const ADMIN_SESSION_COOKIE_NAME = "helpdesk_admin_session";
const ADMIN_SESSION_TTL_SECONDS = 60 * 60;

function getAdminSessionSecret(): string {
  const secret = process.env.ADMIN_SESSION_SECRET;

  if (typeof secret !== "string" || secret.trim().length < 32) {
    throw new Error(
      "ADMIN_SESSION_SECRET is required and must be at least 32 characters long."
    );
  }

  return secret;
}

function getAdminSessionOptions(): SessionOptions {
  return {
    password: getAdminSessionSecret(),
    cookieName: ADMIN_SESSION_COOKIE_NAME,
    ttl: ADMIN_SESSION_TTL_SECONDS,
    cookieOptions: {
      httpOnly: true,
      secure: true,
      sameSite: "strict",
      path: "/",
    },
  };
}

export async function getAdminSession(
  request: any,
  response: any
): Promise<IronSession<AdminSessionData>> {
  return getIronSession<AdminSessionData>(
    nodeCookies(request, response),
    getAdminSessionOptions()
  );
}

export async function createAuthenticatedAdminSession(
  request: any,
  response: any
): Promise<IronSession<AdminSessionData>> {
  const session = await getAdminSession(request, response);
  const timestamp = Date.now();

  Object.assign(session, {
    authenticated: true,
    admin: true,
    issuedAt: timestamp,
    expiresAt: timestamp + ADMIN_SESSION_TTL_SECONDS * 1000,
  });

  await session.save();

  return session;
}

export async function clearAdminSession(
  request: any,
  response: any
): Promise<void> {
  const session = await getAdminSession(request, response);
  session.destroy();
}

export function hasValidAdminSession(
  session: Partial<AdminSessionData> | undefined
): boolean {
  if (!session) {
    return false;
  }

  if (session.authenticated !== true || session.admin !== true) {
    return false;
  }

  const expiresAt = session.expiresAt;

  if (typeof expiresAt !== "number" || !Number.isFinite(expiresAt)) {
    return false;
  }

  return expiresAt > Date.now();
}
