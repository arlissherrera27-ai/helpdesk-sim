import { useState } from "react";
import "./FeedbackViewer.css";

type FeedbackPreview = {
  type: "suggestion" | "feedback";
  message_preview: string;
  scenario: string | null;
  mode: string | null;
  created_at: string;
};

export default function FeedbackViewer() {
  const [password, setPassword] = useState("");
  const [feedback, setFeedback] = useState<FeedbackPreview[]>([]);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function unlockViewer() {
    if (!password.trim()) {
      setError("Enter your viewer password.");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/feedback", {
        method: "GET",
        headers: {
          "x-admin-password": password,
        },
      });

      if (response.status === 401) {
        setError("Incorrect password.");
        return;
      }

      if (!response.ok) {
        throw new Error("Could not load feedback");
      }

      const data = await response.json();

      setFeedback(data.feedback ?? []);
      setIsUnlocked(true);
      setPassword("");
    } catch (error) {
      console.error("Feedback viewer failed:", error);
      setError("Feedback couldn't be loaded.");
    } finally {
      setIsLoading(false);
    }
  }

    if (!isUnlocked) {
    return (
      <main className="feedback-viewer">
        <div className="feedback-viewer__content">
          <header className="feedback-viewer__header">
            <h1>Feedback Preview</h1>
            <p>Private viewer</p>
          </header>

          <section className="feedback-viewer__locked">
            <p>Enter your viewer password to see recent submissions.</p>

            <div className="feedback-viewer__form">
              <input
                className="feedback-viewer__input"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    void unlockViewer();
                  }
                }}
                placeholder="Viewer password"
                autoComplete="current-password"
              />

              <button
                className="feedback-viewer__button"
                type="button"
                onClick={() => void unlockViewer()}
                disabled={isLoading}
              >
                {isLoading ? "Unlocking..." : "Unlock"}
              </button>
            </div>

            {error && (
              <p className="feedback-viewer__error">{error}</p>
            )}
          </section>
        </div>
      </main>
    );
  }

    return (
    <main className="feedback-viewer">
      <div className="feedback-viewer__content">
        <header className="feedback-viewer__header">
          <h1>Feedback Preview</h1>
          <p>Latest 10 submissions</p>
        </header>

        {feedback.length === 0 ? (
          <div className="feedback-viewer__state">
            <p>No submissions yet.</p>
          </div>
        ) : (
          <section className="feedback-viewer__list">
            {feedback.map((item, index) => (
              <article
                className="feedback-preview"
                key={`${item.created_at}-${index}`}
              >
                <div className="feedback-preview__meta">
                  <strong className="feedback-preview__type">
                    {item.type.toUpperCase()}
                  </strong>

                  <span>
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                <p className="feedback-preview__message">
                  {item.message_preview}
                  {item.message_preview.length >= 80 ? "…" : ""}
                </p>

                <div className="feedback-preview__context">
                  <span>{item.scenario || "General"}</span>
                  <span>•</span>
                  <span>{item.mode || "Unknown mode"}</span>
                </div>
              </article>
            ))}
          </section>
        )}
      </div>
    </main>
  );
}