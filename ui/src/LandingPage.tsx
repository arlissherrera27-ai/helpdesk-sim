
import { COLORS, TEXT, SPACE, BUTTON } from "./uiSystem";

const trainingModes = [
  {
    name: "Practice Mode",
    color: COLORS.practice,
    description: "Learn troubleshooting procedures with guidance while working through realistic IT support tickets.",
  },
  {
    name: "Assessment Mode",
    color: COLORS.assessment,
    description: "Test your troubleshooting knowledge and review your performance.",
  },
  {
    name: "Investigation Mode",
    color: COLORS.primary,
    description: "Investigate incoming tickets without knowing the underlying issue in advance. Currently available for 2 scenarios.",
  },
];

const exampleTickets = [
  "Password Reset & Account Lockout",
  "Wi-Fi & Network Connectivity",
  "Email & Outlook Troubleshooting",
  "Printer & Peripheral Issues",
  "Windows & Desktop Support",
  "Browser & Application Problems",
];

export default function LandingPage() {
  return (
    <main
      style={{
        width: "100%",
        minHeight: "100vh",
        boxSizing: "border-box",
        padding: "24px 20px 64px",
        background: COLORS.appBg,
        color: COLORS.text,
        fontFamily: "monospace",
        textAlign: "left",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: SPACE.md,
          paddingBottom: SPACE.lg,
          borderBottom: `1px solid ${COLORS.border}`,
        }}
      >
        <strong style={{ fontSize: TEXT.section }}>
          MyHelpDeskSim
        </strong>

        <a href="/simulator" style={{ ...BUTTON.secondary, textDecoration: "none" }}>
          Enter Simulator →
        </a>
      </header>

      <section style={{ padding: "72px 0 56px", maxWidth: "850px" }}>
        <div style={{ color: COLORS.primary, fontSize: TEXT.label, marginBottom: SPACE.md }}>
          INTERACTIVE IT SUPPORT TRAINING
        </div>

        <h1
          style={{
            color: COLORS.text,
            fontSize: "clamp(32px, 5vw, 56px)",
            lineHeight: 1.12,
            margin: `0 0 ${SPACE.lg}`,
            fontFamily: "monospace",
            fontWeight: 700,
          }}
        >
          Learn Help Desk Troubleshooting by Doing It.
        </h1>

        <p style={{ color: COLORS.body, fontSize: "16px", lineHeight: 1.8, marginBottom: SPACE.xl }}>
          Practice realistic Level 1 IT support tickets in an interactive
          troubleshooting simulator. Choose procedures, examine technical
          evidence, resolve issues, and build confidence.
        </p>

        <a
          href="/simulator"
          style={{
            ...BUTTON.primary,
            display: "inline-block",
            padding: "14px 24px",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Start Training →
        </a>

      </section>


      <section style={{ marginBottom: SPACE.xxl }}>
        <h2 style={{ color: COLORS.text, fontFamily: "monospace" }}>
          How It Works
        </h2>

        <p
          style={{
            color: COLORS.muted,
            lineHeight: 1.7,
            marginBottom: SPACE.lg,
          }}
        >
          Practice Mode teaches you how to approach real Level 1 IT
          support tickets using structured troubleshooting procedures.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: SPACE.md,
          }}
        >
          {[
            ["01", "Choose a Ticket", "Start with a realistic help desk issue."],
            ["02", "Learn the Procedure", "Follow the troubleshooting steps and understand why they matter."],
            ["03", "Perform the Actions", "Select procedures, examine evidence, and determine your next step."],
            ["04", "Verify the Resolution", "Confirm the result and review your performance."],
          ].map(([number, title, description]) => (
            <div
              key={number}
              style={{
                padding: SPACE.lg,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                background: COLORS.panel,
              }}
            >
              <div
                style={{
                  color: COLORS.practice,
                  fontSize: TEXT.detail,
                  marginBottom: SPACE.md,
                }}
              >
                {number}
              </div>

              <strong style={{ color: COLORS.text }}>{title}</strong>

              <p
                style={{
                  color: COLORS.body,
                  fontSize: TEXT.detail,
                  lineHeight: 1.7,
                  marginTop: SPACE.md,
                }}
              >
                {description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: SPACE.xxl }}>
        <h2 style={{ color: COLORS.text, fontFamily: "monospace" }}>
          Three Ways to Train

        </h2>
        <p style={{ color: COLORS.muted, marginBottom: SPACE.lg }}>
          Choose the training experience that fits your goals.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: SPACE.md,
          }}
        >
          {trainingModes.map((mode) => (
            <div
              key={mode.name}
              style={{
                padding: SPACE.xl,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "12px",
                background: COLORS.panel,
              }}
            >
              <strong style={{ color: mode.color }}>{mode.name}</strong>
              <p
                style={{
                  color: COLORS.body,
                  fontSize: TEXT.body,
                  lineHeight: 1.7,
                  marginTop: SPACE.md,
                }}
              >
                {mode.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: SPACE.xxl }}>
        <h2 style={{ color: COLORS.text, fontFamily: "monospace" }}>
          Real-World IT Support Scenarios
        </h2>
        <p style={{ color: COLORS.muted, marginBottom: SPACE.lg }}>
          Practice troubleshooting common Level 1 help desk issues.
        </p>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: SPACE.md,
          }}
        >
          {exampleTickets.map((ticket) => (
            <div
              key={ticket}
              style={{
                padding: SPACE.md,
                border: `1px solid ${COLORS.border}`,
                borderRadius: "8px",
                background: COLORS.panelSoft,
                color: COLORS.body,
                fontSize: TEXT.detail,
              }}
            >
              <span style={{ color: COLORS.practice }}>✓ </span>
              {ticket}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginBottom: SPACE.xxl }}>
        <h2 style={{ color: COLORS.text, fontFamily: "monospace" }}>
          Custom Playlists
        </h2>
        <p
          style={{
            color: COLORS.muted,
            lineHeight: 1.7,
          }}
        >
          Combine scenarios into a custom playlist and practice tickets back-to-back in your chosen order. Create a local profile to save playlists and return to them in the same browser. Profiles and playlists do not currently sync across devices.
        </p>
      </section>

      <section
        style={{
          padding: `${SPACE.xxl} ${SPACE.md}`,
          textAlign: "center",
          borderTop: `1px solid ${COLORS.border}`,
        }}
      >
        <h2 style={{ color: COLORS.text, fontFamily: "monospace" }}>
          Ready to Work Your First Ticket?
        </h2>
        <p
          style={{
            color: COLORS.body,
            marginBottom: SPACE.xl,
            lineHeight: 1.7,
          }}
        >
          Enter the simulator, select a training mode, start troubleshooting, or create a playlist for back-to-back practice.
        </p>
        <a
          href="/simulator"
          style={{
            ...BUTTON.primary,
            display: "inline-block",
            padding: "14px 24px",
            textDecoration: "none",
            fontWeight: 700,
          }}
        >
          Enter Simulator →
        </a>
      </section>
    </main>
  );
}
