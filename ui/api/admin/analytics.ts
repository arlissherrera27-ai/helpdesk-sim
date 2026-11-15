import { neon } from "@neondatabase/serverless";

import {
  getAdminSession,
  hasValidAdminSession,
} from "../../lib/adminSession.js";

const ANALYTICS_DATABASE_ENV = "TRAINING_ANALYTICS_DATABASE_URL";

export default async function handler(request: any, response: any) {
  response.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private");
  response.setHeader("Pragma", "no-cache");
  response.setHeader("Expires", "0");

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    const session = await getAdminSession(request, response);

    if (!hasValidAdminSession(session)) {
      return response.status(401).json({
        error: "Unauthorized",
      });
    }
  } catch {
    return response.status(401).json({
      error: "Unauthorized",
    });
  }

  const databaseUrl = process.env[ANALYTICS_DATABASE_ENV];

  if (typeof databaseUrl !== "string" || databaseUrl.trim().length === 0) {
    return response.status(503).json({
      error: "Analytics is unavailable",
    });
  }

  try {
    const sql = neon(databaseUrl);

    const [summaryRows, scenarioRows, modeRows, globalRows] = await Promise.all([
      sql`SELECT
        SUM(starts) AS scenario_starts,
        SUM(completions) AS scenario_completions,
        SUM(passes) AS pass_count,
        SUM(fails) AS fail_count,
        SUM(retries) AS retry_count,
        SUM(quits) AS quit_count
      FROM scenario_lifetime_totals;`,
      sql`SELECT
        scenario_id,
        mode,
        starts,
        completions,
        passes,
        fails,
        retries,
        quits
      FROM scenario_lifetime_totals
      ORDER BY starts DESC, scenario_id ASC, mode ASC;`,
      sql`SELECT
        mode,
        SUM(starts) AS starts,
        SUM(completions) AS completions,
        SUM(passes) AS passes,
        SUM(fails) AS fails,
        SUM(retries) AS retries,
        SUM(quits) AS quits
      FROM scenario_lifetime_totals
      GROUP BY mode
            ORDER BY mode ASC;`,
      sql`SELECT
        profile_creations
      FROM global_lifetime_totals
      WHERE id = 1;`,
    ]);

    const summary = summaryRows[0] ?? {};
    const profileCreations = Number(globalRows[0]?.profile_creations ?? 0);

        const byScenario = scenarioRows.map((row) => ({
      scenarioId: row.scenario_id,
      mode: row.mode,
      starts: Number(row.starts ?? 0),
      completions: Number(row.completions ?? 0),
      passes: Number(row.passes ?? 0),
      fails: Number(row.fails ?? 0),
      retries: Number(row.retries ?? 0),
      quits: Number(row.quits ?? 0),
    }));

        const byMode = modeRows.map((row) => ({
      mode: row.mode,
      starts: Number(row.starts ?? 0),
      completions: Number(row.completions ?? 0),
      passes: Number(row.passes ?? 0),
      fails: Number(row.fails ?? 0),
      retries: Number(row.retries ?? 0),
      quits: Number(row.quits ?? 0),
    }));

    return response.status(200).json({
      generatedAt: new Date().toISOString(),
      summary: {
        profileCreations,
        scenarioStarts: Number(summary.scenario_starts ?? 0),
        scenarioCompletions: Number(summary.scenario_completions ?? 0),
        passCount: Number(summary.pass_count ?? 0),
        failCount: Number(summary.fail_count ?? 0),
        retryCount: Number(summary.retry_count ?? 0),
        quitCount: Number(summary.quit_count ?? 0),
      },
      byScenario,
      byMode,
    });
  } catch {
    return response.status(500).json({
      error: "Analytics is unavailable",
    });
  }
}
