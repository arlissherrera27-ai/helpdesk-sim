

import { timingSafeEqual } from "node:crypto";

import {
  cleanupExpiredAdminLoginLimits,
} from "../../server/adminLoginThrottle.js";
import {
  cleanupExpiredTrainingEvents,
} from "../../server/trainingAnalytics.js";


function hasValidSecret(
  authorization: unknown,
  configuredSecret: string
): boolean {
  if (typeof authorization !== "string") {
    return false;
  }

  const expected = Buffer.from(
    `Bearer ${configuredSecret}`,
    "utf8"
  );
  const received = Buffer.from(authorization, "utf8");

  return (
    received.length === expected.length &&
    timingSafeEqual(received, expected)
  );
}

export default async function handler(
  request: any,
  response: any
) {
  response.setHeader("Cache-Control", "no-store");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  const secret = process.env.CRON_SECRET;

  if (typeof secret !== "string" || secret.length < 32) {
    return response.status(503).json({
      error: "Maintenance is unavailable",
    });
  }

  if (
    !hasValidSecret(
      request.headers?.authorization,
      secret
    )
  ) {
    return response.status(401).json({
      error: "Unauthorized",
    });
  }

  const databaseUrl =
    process.env.TRAINING_ANALYTICS_DATABASE_URL;

  if (
    typeof databaseUrl !== "string" ||
    databaseUrl.trim().length === 0
  ) {
    return response.status(503).json({
      error: "Maintenance is unavailable",
    });
  }

  try {

    const deletedEvents =
      await cleanupExpiredTrainingEvents(databaseUrl);

    const deletedSecurityRecords =
      await cleanupExpiredAdminLoginLimits();

    console.info("Analytics maintenance cleanup completed", {
      deletedEvents,
      deletedSecurityRecords,
    });

    return response.status(200).json({
      success: true,
      deletedEvents,
      deletedSecurityRecords,
    });

  } catch (error) {
    console.error("Analytics retention cleanup failed", error);

    return response.status(500).json({
      error: "Maintenance cleanup failed",
    });
  }
}
