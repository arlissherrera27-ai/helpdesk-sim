import { clearAdminSession } from "../../lib/adminSession";

export default async function handler(request: any, response: any) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      error: "Method not allowed",
    });
  }

  try {
    await clearAdminSession(request, response);
    response.setHeader("Cache-Control", "no-store");

    return response.status(200).json({
      success: true,
    });
  } catch {
    return response.status(500).json({
      error: "Logout failed",
    });
  }
}
