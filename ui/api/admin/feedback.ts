import { neon } from "@neondatabase/serverless";

export default async function handler(
  request: any,
  response: any
) {
  if (request.method !== "GET") {
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  const adminPassword = process.env.ADMIN_FEEDBACK_PASSWORD;

  if (!adminPassword) {
    return response.status(500).json({
      error: "Viewer configuration is missing",
    });
  }

  const providedPassword = request.headers["x-admin-password"];

  if (providedPassword !== adminPassword) {
    return response.status(401).json({
      error: "Unauthorized",
    });
  }

  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return response.status(500).json({
      error: "Database configuration is missing",
    });
  }

  try {
    const sql = neon(databaseUrl);

    const rows = await sql`
      SELECT
        type,
        LEFT(message, 80) AS message_preview,
        scenario,
        mode,
        created_at
      FROM feedback
      ORDER BY created_at DESC
      LIMIT 10
    `;

    return response.status(200).json({
      feedback: rows,
    });
  } catch (error) {
    console.error("Feedback preview failed:", error);

    return response.status(500).json({
      error: "Could not load feedback",
    });
  }
}