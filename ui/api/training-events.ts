// MyHelpDeskSim V2 — Training Analytics Event Receiver
// Public tracking remains disabled until final release approval.

export default async function handler(
  request: any,
  response: any
) {
  if (request.method !== "POST") {
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  // Explicitly disabled unless enabled on the server.
  if (process.env.TRAINING_ANALYTICS_ENABLED !== "true") {
    return response.status(503).json({
      error: "Training analytics is disabled",
    });
  }

  // Never fall back to the production DATABASE_URL.
  const databaseUrl = process.env.TRAINING_ANALYTICS_DATABASE_URL;

  if (!databaseUrl) {
    return response.status(503).json({
      error: "Training analytics database is not configured",
    });
  }

  // Event validation and database writes will be added next.
  // Do not accept events until those safeguards are complete.
  return response.status(503).json({
    error: "Training analytics receiver is not ready",
  });
}
