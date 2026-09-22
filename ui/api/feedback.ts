import { neon } from "@neondatabase/serverless";

export default async function handler(
  request: any,
  response: any
) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  const { type, message, scenario, mode } = request.body ?? {};

  if (type !== "suggestion" && type !== "feedback") {
    return response.status(400).json({
      error: "Invalid feedback type",
    });
  }

  const cleanMessage =
    typeof message === "string" ? message.trim() : "";

  if (!cleanMessage) {
    return response.status(400).json({
      error: "Message is required",
    });
  }

  if (cleanMessage.length > 5000) {
    return response.status(400).json({
      error: "Message is too long",
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

    await sql`
      INSERT INTO feedback (
        type,
        message,
        scenario,
        mode
      )
      VALUES (
        ${type},
        ${cleanMessage},
        ${typeof scenario === "string" ? scenario : null},
        ${typeof mode === "string" ? mode : null}
      )
    `;

    return response.status(201).json({
      success: true,
    });
  } catch (error) {
    console.error("Feedback submission failed:", error);

    return response.status(500).json({
      error: "Could not submit feedback",
    });
  }
}