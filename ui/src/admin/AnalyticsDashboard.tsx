
import { useState } from "react";
import "./AnalyticsDashboard.css";

type Totals = {
  starts: number;
  completions: number;
  passes: number;
  fails: number;
  retries: number;
  quits: number;
};

type AnalyticsData = {
  generatedAt: string;
  summary: {
    profileCreations: number;
    scenarioStarts: number;
    scenarioCompletions: number;
    passCount: number;
    failCount: number;
    retryCount: number;
    quitCount: number;
  };
  byScenario: Array<
    Totals & { scenarioId: string; mode: string }
  >;
  byMode: Array<Totals & { mode: string }>;
};

function formatCount(value: number): string {
  return value.toLocaleString();
}

export default function AnalyticsDashboard() {
  const [password, setPassword] = useState("");
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadAnalytics(): Promise<AnalyticsData> {
    const response = await fetch("/api/admin/analytics", {
      method: "GET",
      credentials: "same-origin",
      cache: "no-store",
    });

    if (response.status === 401) {
      setData(null);
      throw new Error("SESSION_EXPIRED");
    }

    if (!response.ok) {
      throw new Error("ANALYTICS_UNAVAILABLE");
    }

    return (await response.json()) as AnalyticsData;
  }

  async function signIn() {
    if (!password.trim() || isLoading) {
      if (!password.trim()) {
        setError("Enter your administrator password.");
      }
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (response.status === 401) {
        setError("Incorrect administrator password.");
        return;
      }

      if (response.status === 429) {
        setError("Too many attempts. Try again later.");
        return;
      }

      if (!response.ok) {
        throw new Error("LOGIN_UNAVAILABLE");
      }

      setPassword("");
      const result = await loadAnalytics();
      setData(result);
    } catch (cause) {
      setError(
        cause instanceof Error &&
        cause.message === "SESSION_EXPIRED"
          ? "Your session is unavailable. Sign in again."
          : "Unable to load analytics. Try again later."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function refreshAnalytics() {
    setIsLoading(true);
    setError("");

    try {
      setData(await loadAnalytics());
    } catch (cause) {
      setError(
        cause instanceof Error &&
        cause.message === "SESSION_EXPIRED"
          ? "Your session expired. Sign in again."
          : "Unable to refresh analytics."
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function signOut() {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/logout", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("LOGOUT_FAILED");
      }

      setData(null);
      setPassword("");
    } catch {
      setError("Unable to sign out. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  const metrics = data
    ? [
        ["Scenario starts", data.summary.scenarioStarts],
        ["Completions", data.summary.scenarioCompletions],
        ["Passes", data.summary.passCount],
        ["Fails", data.summary.failCount],
        ["Retries", data.summary.retryCount],
        ["Quits", data.summary.quitCount],
        ["Profiles created", data.summary.profileCreations],
      ] as const
    : [];

  return (
    <main className="analytics-dashboard">
      <div className="analytics-dashboard__content">
        <header className="analytics-dashboard__header">
          <div>
            <h1>MyHelpDeskSim Analytics</h1>
            <p>Private administrator dashboard</p>
          </div>

          {data && (
            <div className="analytics-dashboard__actions">
              <button
                type="button"
                onClick={() => void refreshAnalytics()}
                disabled={isLoading}
              >
                {isLoading ? "Loading..." : "Refresh"}
              </button>
              <button
                type="button"
                onClick={() => void signOut()}
                disabled={isLoading}
              >
                Sign out
              </button>
            </div>
          )}
        </header>

        {error && (
          <p className="analytics-dashboard__error" role="alert">
            {error}
          </p>
        )}

        {!data ? (
          <section className="analytics-dashboard__panel">
            <h2>Administrator sign in</h2>
            <p>Sign in to view private training analytics.</p>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                void signIn();
              }}
              className="analytics-dashboard__login"
            >
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Administrator password"
                autoComplete="current-password"
                aria-label="Administrator password"
                disabled={isLoading}
              />
              <button type="submit" disabled={isLoading}>
                {isLoading ? "Signing in..." : "Sign in"}
              </button>
            </form>
          </section>
        ) : (
          <>
            <p className="analytics-dashboard__timestamp">
              Lifetime totals · Retrieved{" "}
              {new Date(data.generatedAt).toLocaleString()}
            </p>

            <section aria-label="Overall analytics">
              <h2>Overall activity</h2>
              <div className="analytics-dashboard__metrics">
                {metrics.map(([label, count]) => (
                  <article
                    className="analytics-dashboard__metric"
                    key={label}
                  >
                    <span>{label}</span>
                    <strong>{formatCount(count)}</strong>
                  </article>
                ))}
              </div>
            </section>

            <section className="analytics-dashboard__panel">
              <h2>Mode usage</h2>
              {data.byMode.length === 0 ? (
                <p>No mode activity recorded yet.</p>
              ) : (
                <div className="analytics-dashboard__table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Mode</th>
                        <th>Starts</th>
                        <th>Completions</th>
                        <th>Pass</th>
                        <th>Fail</th>
                        <th>Retries</th>
                        <th>Quits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byMode.map((row) => (
                        <tr key={row.mode}>
                          <td>{row.mode}</td>
                          <td>{formatCount(row.starts)}</td>
                          <td>{formatCount(row.completions)}</td>
                          <td>{formatCount(row.passes)}</td>
                          <td>{formatCount(row.fails)}</td>
                          <td>{formatCount(row.retries)}</td>
                          <td>{formatCount(row.quits)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="analytics-dashboard__panel">
              <h2>Scenario performance</h2>
              <p>Ordered by total scenario starts.</p>

              {data.byScenario.length === 0 ? (
                <p>No scenario activity recorded yet.</p>
              ) : (
                <div className="analytics-dashboard__table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Scenario</th>
                        <th>Mode</th>
                        <th>Starts</th>
                        <th>Completions</th>
                        <th>Pass</th>
                        <th>Fail</th>
                        <th>Retries</th>
                        <th>Quits</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.byScenario.map((row) => (
                        <tr key={`${row.scenarioId}-${row.mode}`}>
                          <td>{row.scenarioId}</td>
                          <td>{row.mode}</td>
                          <td>{formatCount(row.starts)}</td>
                          <td>{formatCount(row.completions)}</td>
                          <td>{formatCount(row.passes)}</td>
                          <td>{formatCount(row.fails)}</td>
                          <td>{formatCount(row.retries)}</td>
                          <td>{formatCount(row.quits)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
