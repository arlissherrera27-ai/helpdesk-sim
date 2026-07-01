import { useState } from "react";
import { handleInput } from "./core/engine";
import { initialState } from "./core/state";
import type { SimState } from "./core/types";
import { SCENARIO_LABELS } from "./core/scenarios";
import {
  scenarioTree,
  getPreviewStepLabel,
  getScenarioTypeDisplayLabel,
} from "./core/scenarioTree";
import { COMMAND_ALIASES } from "./core/parse";
import { getScenarioProcedureCommands } from "./core/scenarioRegistry";

// ==========================================
// UI STANDARDS
// ==========================================

const COLORS = {
  appBg: "#0b0f14",
  panel: "rgba(255,255,255,0.03)",
  panelSoft: "rgba(255,255,255,0.02)",
  border: "#2a2a2a",
  text: "#f5f7fb",
  body: "#d1d5db",
  muted: "#9aa4b2",
  success: "#22c55e",
  successDark: "#1f7a3a",
  practice: "#a78bfa",
  practiceStrong: "#6d4aff",
  assessment: "#93c5fd",
  assessmentStrong: "#60a5fa",
};

const TEXT = {
  label: "12px",
  detail: "13px",
  body: "14px",
  section: "20px",
  title: "24px",
  hero: "56px",
};

const SPACE = {
  xs: "4px",
  sm: "8px",
  md: "16px",
  lg: "22px",
  xl: "28px",
};

const RADIUS = {
  button: "8px",
  chip: "10px",
  card: "12px",
  pill: "999px",
};

const CARD = {
  base: {
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.card,
    background: COLORS.panel,
  },
};

const BUTTON = {
  secondary: {
    fontFamily: "monospace",
    padding: "10px 14px",
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.button,
    background: "transparent",
    color: COLORS.text,
    cursor: "pointer",
  },
  primary: {
    fontFamily: "monospace",
    padding: "10px 14px",
    border: `1px solid ${COLORS.practiceStrong}`,
    borderRadius: RADIUS.button,
    background: "rgba(109, 74, 255, 0.18)",
    color: COLORS.text,
    cursor: "pointer",
  },
};

const LAYOUT = {
  completedHero: "1fr 340px",
  completedSummaryCards: "1fr 1fr 1fr",
  runningMain: "1fr 320px",
};

function getVisibleCommands(state: SimState): string[] {
  if (state.executionState === "LOBBY") {
    if (state.scenario === null && state.previewScenario === null) {
      return ["select scenario", "status", "help"];
    }

    return ["start", "status", "help"];
  }

  if (state.executionState === "RUNNING") {
    return ["status", "restart", "quit"];
  }

  if (state.executionState === "COMPLETED") {
    return ["status", "restart", "quit"];
  }

  return [];
}

function buildLogBlock(message: string): string[] {
  const normalizedMessage = (message || "").replace(/\n{3,}/g, "\n\n").trim();

  return [normalizedMessage, ""];
}

function buildScenarioPreview(
  scenario: {
    label: string;
    skillFocus: string[];
    scenarioContext: string;
    successOutcome: string;
    previewSteps: string[];
  },
  mode: "practice" | "assessment"
): string {
  return [
    `Scenario selected: ${scenario.label} — Standard`,
    "",
    "Skill Focus:",
    ...scenario.skillFocus.map((skill) => `- ${skill}`),
    "",
    "Scenario Context:",
    scenario.scenarioContext,
    "",
    ...(mode === "practice"
      ? [
          "Expected procedure:",
          ...scenario.previewSteps.map(
            (step) => `- ${getPreviewStepLabel(step)}`
          ),
          "",
        ]
      : []),
    "Success Outcome:",
    scenario.successOutcome,
    "",
    "Next step: type 'start' to begin.",
  ].join("\n");
}

function getCurrentExpectedProcedureLabel(
  state: SimState,
): string | null {
  if (!state.scenario) {
    return null;
  }

  const procedureCommands = getScenarioProcedureCommands(state.scenario);

  const completedProcedureCount = state.runLog.filter(
    (event) =>
      event.decision === "ALLOW" &&
      event.plan !== "StartNewAttempt" &&
      event.plan !== "ReadOnly"
  ).length;

  const expectedCommand = procedureCommands[completedProcedureCount];

  return expectedCommand ? getPreviewStepLabel(expectedCommand) : null;
}

function getReportMeasurements(state: SimState) {
  const completedProcedures = state.runLog.filter(
    (event) =>
      event.decision === "ALLOW" &&
      event.plan !== "StartNewAttempt" &&
      event.plan !== "ReadOnly"
  );

  const mistakes = state.runLog.filter((event) => event.decision === "DENY");

  const score = Math.max(0, 10 - mistakes.length);

  return {
    score,
    completedProcedureCount: completedProcedures.length,
    mistakeCount: mistakes.length,
    assistanceCount: state.procedureHelpUsedDuring.length,
    assessmentIntegrity: state.assessmentIntegrity,
  };
}

function formatRunLogTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

function getRunLogDisplayCommand(event: SimState["runLog"][number]): string {
  return event.attemptedInput ?? event.command;
}

function getMistakeLabel(event: SimState["runLog"][number]): string {
  if (event.mistakeType === "unknown") {
    return "Unknown Command";
  }

  if (event.mistakeType === "repeated") {
    return "Repeated Procedure Attempt";
  }

  if (event.decision === "DENY") {
    return "Wrong Procedure Order";
  }

  return "Recorded Event";
}

function formatRunLogEvent(event: SimState["runLog"][number]): string {
  return `${formatRunLogTime(event.timestamp)} — ${getRunLogDisplayCommand(
    event
  )}`;
}

function getReportDetails(state: SimState) {
  const deniedAttempts = state.runLog.filter(
    (event) => event.decision === "DENY"
  );

  const unknownCommands = deniedAttempts.filter(
    (event) => event.mistakeType === "unknown"
  );

  const repeatedProcedureAttempts = deniedAttempts.filter(
    (event) => event.mistakeType === "repeated"
  );

  return {
    deniedAttempts,
    unknownCommands,
    repeatedProcedureAttempts,
  };
}

export default function App() {
  const [state, setState] = useState<SimState>(initialState());
  const [input, setInput] = useState("");
  const [log, setLog] = useState<string[]>([]);

const [showSelector, setShowSelector] = useState(false);
const [openScenarioTypeId, setOpenScenarioTypeId] = useState<string | null>(null);
const [openBranchId, setOpenBranchId] = useState<string | null>(null);
const [procedureHelpPinned, setProcedureHelpPinned] = useState(false);

const [scoringInput, setScoringInput] = useState("");
const [scoringOutput, setScoringOutput] = useState("");
  const mode = state.mode;

  const visibleCommands = getVisibleCommands(state); 


  const scenarioProcedureCommands = getScenarioProcedureCommands(state.scenario);
  const currentExpectedProcedureLabel = getCurrentExpectedProcedureLabel(state);

  const currentExpectedCommand =
    currentExpectedProcedureLabel
      ? scenarioProcedureCommands.find(
          (command) => getPreviewStepLabel(command) === currentExpectedProcedureLabel
        )
      : null;

  const parserAliasHelp = currentExpectedCommand
    ? [
        {
          command: currentExpectedCommand,
          label: getPreviewStepLabel(currentExpectedCommand),
          aliases: Object.entries(COMMAND_ALIASES)
            .filter(([, mappedCommand]) => mappedCommand === currentExpectedCommand)
            .map(([alias]) => alias),
        },
      ].filter((item) => item.aliases.length > 0)
    : [];

  const showProcedureHelp =
    mode === "practice" &&
    !showSelector &&
    !log.includes("Select a scenario to begin") &&
    state.scenario !== null &&
    state.executionState !== "COMPLETED";

  const procedureHelpOpen = procedureHelpPinned;

    const reportMeasurements = getReportMeasurements(state);
  const reportDetails = getReportDetails(state);

  function runCommand() {
    const trimmed = input.trim();
    if (!trimmed) return;

const out = handleInput(state, trimmed);

const isAcceptedProcedure =
  out.decision.kind === "ALLOW" &&
  out.decision.plan.kind !== "ReadOnly" &&
  out.decision.plan.kind !== "StartNewAttempt" &&
  out.decision.plan.kind !== "SelectScenario" &&
  out.decision.plan.kind !== "QuitAttemptToLobby";

const expectedStepDuringHelp =
  procedureHelpPinned && state.mode === "practice"
    ? getCurrentExpectedProcedureLabel(state)
    : null;

if (isAcceptedProcedure) {
  setProcedureHelpPinned(false);
}

const finalStepDuringHelp =
  procedureHelpPinned &&
  state.mode === "practice" &&
  out.state.executionState === "COMPLETED" &&
  out.decision.kind === "ALLOW" &&
  out.decision.plan.kind !== "ReadOnly"
    ? getPreviewStepLabel(
        out.decision.plan.kind
          .replace(/([a-z])([A-Z])/g, "$1_$2")
          .toLowerCase()
      )
    : null;

setState({
  ...out.state,
  procedureHelpUsedDuring: [
    ...new Set([
      ...out.state.procedureHelpUsedDuring,
      ...(expectedStepDuringHelp ? [expectedStepDuringHelp] : []),
      ...(finalStepDuringHelp ? [finalStepDuringHelp] : []),
    ]),
  ],
});

    setLog((prev) => {
      const lower = trimmed.toLowerCase();

const selectedScenario = scenarioTree
  .flatMap((scenarioType) => scenarioType.branches)
  .flatMap((branch) => branch.scenarios)
  .find((scenario) => scenario.selectCommand === lower);

const isStart = lower === "start";
const isQuit = lower === "quit";
const isRestart = lower === "restart";

if (selectedScenario && out.decision.kind === "ALLOW") {
  return buildLogBlock(buildScenarioPreview(selectedScenario, mode));
}

      if (isStart) {
        return [...buildLogBlock(out.message || "")]; 
      }

      if (isQuit) {
  return [];
}

      if (isRestart) {
        return [...buildLogBlock(out.message || "")];
      }

const isCompleted = out.state.executionState === "COMPLETED";

if (isCompleted) {
  const completedProcedure =
    mode === "practice" &&
    out.decision.kind === "ALLOW" &&
    out.decision.plan.kind !== "ReadOnly"
      ? `Last completed procedure:\n${getPreviewStepLabel(
          out.decision.plan.kind
            .replace(/([a-z])([A-Z])/g, "$1_$2")
            .toLowerCase()
        )}\n\n`
      : "";

  return [...prev, ...buildLogBlock(completedProcedure + (out.message || ""))];
}

      const recognizedProcedure =
        mode === "practice" &&
        out.decision.kind === "ALLOW" &&
        out.decision.plan.kind !== "ReadOnly"
          ? `Last completed procedure:\n${getPreviewStepLabel(
          out.decision.plan.kind
            .replace(/([a-z])([A-Z])/g, "$1_$2")
            .toLowerCase()
        )}\n\n`
          : "";

      return [...prev, ...buildLogBlock(recognizedProcedure + (out.message || ""))];
    });

    setInput("");
  }

const previewScenarioDetails = scenarioTree
  .flatMap((scenarioType) => scenarioType.branches)
  .flatMap((branch) => branch.scenarios)
  .find(
    (scenario) =>
      scenario.id === state.previewScenario || scenario.id === state.scenario
  );

const showState3Preview =
  state.executionState === "LOBBY" &&
  !showSelector &&
  previewScenarioDetails !== undefined;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        padding: "96px 20px 20px",
        fontFamily: "monospace",
        boxSizing: "border-box",
      }}
    >
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          height: "72px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 24px",
          boxSizing: "border-box",
          borderBottom: "1px solid #2a2a2a",
          background: "#0b0f14",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "12px",
              display: "grid",
              placeItems: "center",
              background: "#1f6feb",
              color: "#fff",
              fontWeight: 700,
              fontSize: "16px",
            }}
          >
            CS
          </div>

          <div>
            <div
              style={{
                color: "#f5f7fb",
                fontSize: "18px",
                fontWeight: 700,
                lineHeight: 1.1,
              }}
            >
              Customer Service Simulator
            </div>

            <div
              style={{
                marginTop: "4px",
                color: "#9aa4b2",
                fontSize: "12px",
              }}
            >
              Practice. Learn. Resolve.
            </div>
          </div>
        </div>

        <nav
          aria-label="Header utilities"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          {["History", "Profile", "Settings"].map((item) => (
            <button
              key={item}
              type="button"
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#d7dde6",
                background: "transparent",
                border: "1px solid #2a2a2a",
                borderRadius: "999px",
                padding: "7px 11px",
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}
        </nav>
      </header>

      {/* ===== STATE BANNER (Box 2) ===== */}
      {state.executionState === "LOBBY" && (
      <section
        style={{
          minHeight: "132px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "24px",
          marginBottom: "16px",
          padding: "24px 32px",
          boxSizing: "border-box",
          border: "1px solid #1f7a3a",
          borderRadius: "12px",
          background: "rgba(22, 101, 52, 0.08)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "22px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "999px",
              display: "grid",
              placeItems: "center",
              border: "2px solid #1f7a3a",
              color: "#1f7a3a",
              fontSize: "24px",
              fontWeight: 700,
              flex: "0 0 auto",
            }}
          >
            i
          </div>

          <div>
            <h1
              style={{
                margin: 0,
                color: "#e8f5ee",
                fontSize: "24px",
                lineHeight: 1.2,
              }}
            >
              Welcome.
            </h1>

            <p
              style={{
                margin: "12px 0 0",
                color: "#cdd8d2",
                fontSize: "15px",
                lineHeight: 1.6,
              }}
            >
              Practice realistic IT support scenarios.
              <br />
              Learn structured troubleshooting by solving customer issues step by step.
            </p>
          </div>
        </div>

        <div
          aria-hidden="true"
          style={{
            width: "92px",
            height: "72px",
            display: "grid",
            placeItems: "center",
            color: "#1f7a3a",
            fontSize: "34px",
            flex: "0 0 auto",
          }}
        >
          ☎
        </div>
      </section>
)}

            {state.executionState === "LOBBY" &&
        state.scenario === null &&
        state.previewScenario === null &&
        !showSelector && (
          <section
            style={{
              marginBottom: "16px",
              padding: "28px 32px",
              border: "1px solid #6d4aff",
              borderRadius: "12px",
              background: "rgba(109, 74, 255, 0.06)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "18px",
                marginBottom: "26px",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  display: "grid",
                  placeItems: "center",
                  color: "#8b5cf6",
                  border: "1px solid #6d4aff",
                  fontSize: "22px",
                }}
              >
                ▦
              </div>

              <div>
                <h2
                  style={{
                    margin: 0,
                    color: "#f5f7fb",
                    fontSize: "24px",
                    lineHeight: 1.2,
                  }}
                >
                  Choose Your Training
                </h2>

                <p
                  style={{
                    margin: "8px 0 0",
                    color: "#c5cad3",
                    fontSize: "14px",
                  }}
                >
                  Select how you want to learn and grow.
                </p>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "22px",
                marginBottom: "28px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setState((current) => ({
                    ...current,
                    mode: "practice",
                    assessmentIntegrity: "maintained",
                  }));
                }}
                style={{
                  minHeight: "116px",
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  padding: "22px",
                  textAlign: "left",
                  fontFamily: "monospace",
                  borderRadius: "12px",
                  border:
                    mode === "practice"
                      ? "1px solid #8b5cf6"
                      : "1px solid #2a2a2a",
                  background:
                    mode === "practice"
                      ? "rgba(139, 92, 246, 0.14)"
                      : "rgba(255, 255, 255, 0.03)",
                  color: "#f5f7fb",
                  cursor: "pointer",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "999px",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(139, 92, 246, 0.16)",
                    color: "#a78bfa",
                    fontSize: "24px",
                    flex: "0 0 auto",
                  }}
                >
                  ◇
                </span>

                <span>
                  <strong
                    style={{
                      display: "block",
                      color: "#a78bfa",
                      fontSize: "18px",
                      marginBottom: "8px",
                    }}
                  >
                    Practice Mode
                  </strong>
                  <span
                    style={{
                      color: COLORS.body,
                      fontSize: TEXT.detail,
                      lineHeight: 1.5,
                    }}
                  >
                    You can see how it works—procedures, commands, and guided steps.
                  </span>
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setState((current) => ({
                    ...current,
                    mode: "assessment",
                    assessmentIntegrity: "maintained",
                  }));
                }}
                style={{
                  minHeight: "116px",
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  padding: "22px",
                  textAlign: "left",
                  fontFamily: "monospace",
                  borderRadius: "12px",
                  border:
                    mode === "assessment"
                      ? "1px solid #60a5fa"
                      : "1px solid #2a2a2a",
                  background:
                    mode === "assessment"
                      ? "rgba(96, 165, 250, 0.14)"
                      : "rgba(255, 255, 255, 0.03)",
                  color: "#f5f7fb",
                  cursor: "pointer",
                }}
              >
                <span
                  aria-hidden="true"
                  style={{
                    width: "52px",
                    height: "52px",
                    borderRadius: "999px",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(96, 165, 250, 0.14)",
                    color: "#93c5fd",
                    fontSize: "24px",
                    flex: "0 0 auto",
                  }}
                >
                  ⚖
                </span>

                <span>
                  <strong
                    style={{
                      display: "block",
                      color: "#93c5fd",
                      fontSize: "18px",
                      marginBottom: "8px",
                    }}
                  >
                    Assessment Mode
                  </strong>
                  <span
                    style={{
                      color: COLORS.body,
                      fontSize: TEXT.detail,
                      lineHeight: 1.5,
                    }}
                  >
                    When you’re ready, take the training wheels off. No assistance.
                  </span>
                </span>
              </button>
            </div>

            <div
              style={{
                borderTop: "1px solid #2a2a2a",
                paddingTop: "24px",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "18px",
                  marginBottom: "18px",
                }}
              >
                <div
                  aria-hidden="true"
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "999px",
                    display: "grid",
                    placeItems: "center",
                    background: "rgba(139, 92, 246, 0.12)",
                    color: "#a78bfa",
                    fontSize: "22px",
                  }}
                >
                  □
                </div>

                <div>
                  <h3
                    style={{
                      margin: 0,
                      color: "#f5f7fb",
                      fontSize: "20px",
                    }}
                  >
                    Choose a Scenario
                  </h3>

                  <p
                    style={{
                      margin: "6px 0 0",
                      color: "#c5cad3",
                      fontSize: "14px",
                    }}
                  >
                    Pick a customer issue to work on.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowSelector(true);
                  setOpenScenarioTypeId("standard");

const standardType = scenarioTree.find(
  (type) => type.typeId === "standard"
);

setOpenBranchId(standardType?.branches[0]?.tierId ?? null);
                  setProcedureHelpPinned(false);
                  setLog(["Select a scenario to begin"]);
                }}
                style={{
                  width: "100%",
                  minHeight: "72px",
                  display: "grid",
                  placeItems: "center",
                  fontFamily: "monospace",
                  fontSize: "15px",
                  fontWeight: 700,
                  color: "#a78bfa",
                  border: "1px dashed #8b5cf6",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.02)",
                  cursor: "pointer",
                }}
              >
                Pick a scenario to begin
              </button>
            </div>
          </section>
        )}
              {showSelector && (
        <section
          style={{
            marginBottom: "16px",
            padding: "28px 32px",
            border: "1px solid #6d4aff",
            borderRadius: "12px",
            background: "rgba(109, 74, 255, 0.04)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              marginBottom: "24px",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setShowSelector(false);
                const defaultScenarioType = scenarioTree.find(
  (scenarioType) => scenarioType.enabled
);

setOpenScenarioTypeId(defaultScenarioType?.typeId ?? null);
setOpenBranchId(defaultScenarioType?.branches[0]?.tierId ?? null);
                setLog([]);
              }}
              style={{
                fontFamily: "monospace",
                fontSize: "13px",
                color: "#a78bfa",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                padding: 0,
              }}
            >
              ← Back to Training Choice
            </button>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                border: "1px solid #2a2a2a",
                borderRadius: "999px",
                overflow: "hidden",
                background: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setState((current) => ({
                    ...current,
                    mode: "practice",
                    assessmentIntegrity: "maintained",
                  }));
                }}
                style={{
                  minWidth: "170px",
                  padding: "10px 16px",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  color: mode === "practice" ? "#ffffff" : "#aab2c0",
                  background:
                    mode === "practice"
                      ? "rgba(109, 74, 255, 0.95)"
                      : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ◇ Practice Mode
              </button>

              <button
                type="button"
                onClick={() => {
                  setState((current) => ({
                    ...current,
                    mode: "assessment",
                    assessmentIntegrity: "maintained",
                  }));
                }}
                style={{
                  minWidth: "190px",
                  padding: "10px 16px",
                  fontFamily: "monospace",
                  fontSize: "13px",
                  color: mode === "assessment" ? "#ffffff" : "#aab2c0",
                  background:
                    mode === "assessment"
                      ? "rgba(96, 165, 250, 0.9)"
                      : "transparent",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                ⚖ Assessment Mode
              </button>
            </div>
          </div>

          <div style={{ marginBottom: "18px" }}>
            <div
              style={{
                marginBottom: "12px",
                color: "#f5f7fb",
                fontSize: "16px",
                fontWeight: 700,
              }}
            >
              Scenario Type
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              {scenarioTree.map((scenarioType) => (
                <button
                  key={scenarioType.typeId}
                  type="button"
                  onClick={() => {
                    if (!scenarioType.enabled) return;

                    setOpenScenarioTypeId(scenarioType.typeId);
setOpenBranchId(scenarioType.branches[0]?.tierId ?? null);
                  }}
                  style={{
                    minWidth: "150px",
                    padding: "10px 18px",
                    fontFamily: "monospace",
                    fontSize: "13px",
                    fontWeight: 700,
                    color:
                      openScenarioTypeId === scenarioType.typeId
                        ? "#ffffff"
                        : "#d1d5db",
                    background:
                      openScenarioTypeId === scenarioType.typeId
                        ? "rgba(109, 74, 255, 0.95)"
                        : "rgba(255, 255, 255, 0.03)",
                    border: "1px solid #2a2a2a",
                    borderRadius: "8px",
                    opacity: scenarioType.enabled ? 1 : 0.45,
                    cursor: scenarioType.enabled ? "pointer" : "default",
                  }}
                >
                  {scenarioType.typeLabel}
                </button>
              ))}
            </div>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "280px 1fr",
              gap: "24px",
              alignItems: "start",
            }}
          >
            <div
              style={{
                minHeight: "320px",
                padding: "16px",
                border: "1px solid #2a2a2a",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <div
                style={{
                  marginBottom: "14px",
                  color: "#f5f7fb",
                  fontSize: "15px",
                  fontWeight: 700,
                }}
              >
                Categories
              </div>

              {openScenarioTypeId === null ? (
                <div
                  style={{
                    color: "#9aa4b2",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  Select a scenario type above.
                </div>
              ) : (
                scenarioTree
                  .find((scenarioType) => scenarioType.typeId === openScenarioTypeId)
                  ?.branches.map((branch) => (
                    <button
                      key={branch.tierId}
                      type="button"
                      onClick={() => {
                        setOpenBranchId((prev) =>
                          prev === branch.tierId ? null : branch.tierId
                        );
                      }}
                      style={{
                        width: "100%",
                        display: "block",
                        textAlign: "left",
                        marginBottom: "8px",
                        padding: "12px 14px",
                        fontFamily: "monospace",
                        fontSize: "13px",
                        color:
                          openBranchId === branch.tierId ? "#ffffff" : "#d1d5db",
                        background:
                          openBranchId === branch.tierId
                            ? "rgba(109, 74, 255, 0.18)"
                            : "transparent",
                        border:
                          openBranchId === branch.tierId
                            ? "1px solid #6d4aff"
                            : "1px solid transparent",
                        borderRadius: "8px",
                        cursor: "pointer",
                      }}
                    >
                      {branch.tierLabel}
                    </button>
                  ))
              )}
            </div>

            <div
              style={{
                minHeight: "320px",
                padding: "16px",
                border: "1px solid #2a2a2a",
                borderRadius: "10px",
                background: "rgba(255, 255, 255, 0.02)",
              }}
            >
              {openBranchId === null ? (
                <div
                  style={{
                    color: "#9aa4b2",
                    fontSize: "13px",
                    lineHeight: 1.6,
                  }}
                >
                  Select a category to see scenarios.
                </div>
              ) : (
                scenarioTree
  .find((scenarioType) => scenarioType.typeId === openScenarioTypeId)
  ?.branches.find((branch) => branch.tierId === openBranchId)
  ?.scenarios.map((scenario) => (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => {
                        const command = scenario.selectCommand;

                        if (!command) return;

                        const out = handleInput(state, command);

                        setState(out.state);
                        setLog(buildLogBlock(buildScenarioPreview(scenario, mode)));
                        setShowSelector(false);
                        setOpenScenarioTypeId(null);
                        setOpenBranchId(null);
                      }}
                      style={{
                        width: "100%",
                        display: "block",
                        textAlign: "left",
                        marginBottom: SPACE.sm,
                        padding: "14px 16px",
                        fontFamily: "monospace",
                        color: "#f5f7fb",
                        background: "rgba(255, 255, 255, 0.03)",
                        border: "1px solid #2a2a2a",
                        borderRadius: "10px",
                        cursor: "pointer",
                      }}
                    >
                      <div
                        style={{
                          fontSize: "15px",
                          fontWeight: 700,
                          marginBottom: "6px",
                        }}
                      >
                        {scenario.label}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#9aa4b2",
                          marginBottom: "6px",
                        }}
                      >
                        {scenario.level} • {scenario.estimatedTime}
                      </div>

                      <div
                        style={{
                          fontSize: "12px",
                          color: "#c5cad3",
                          lineHeight: 1.5,
                        }}
                      >
                        {scenario.description}
                      </div>
                    </button>
                  ))
              )}
            </div>
          </div>
        </section>
      )}
           {showState3Preview && previewScenarioDetails && (
        <section
          style={{
            marginBottom: "16px",
            padding: "28px 32px",
            border: "1px solid #6d4aff",
            borderRadius: "12px",
            background: "rgba(109, 74, 255, 0.04)",
          }}
        >
          <button
            type="button"
            onClick={() => {
  const defaultScenarioType = scenarioTree.find(
    (scenarioType) => scenarioType.enabled
  );

  setShowSelector(true);
  setOpenScenarioTypeId(defaultScenarioType?.typeId ?? null);
  setOpenBranchId(defaultScenarioType?.branches[0]?.tierId ?? null);
  setLog(["Select a scenario to begin"]);
}}
            style={{
              marginBottom: "22px",
              fontFamily: "monospace",
              color: "#a78bfa",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            ← Back to Scenario Library
          </button>

          <div
            style={{
              marginBottom: "18px",
              padding: "22px",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              background: "rgba(255, 255, 255, 0.03)",
            }}
          >
            <div style={{ color: "#a78bfa", fontSize: "13px", fontWeight: 700 }}>
              Scenario selected:
            </div>

            <h2 style={{ margin: "10px 0 0", color: "#f5f7fb", fontSize: "26px" }}>
              {previewScenarioDetails.label} — Standard
            </h2>
            {mode === "assessment" && (
  <button
    type="button"
    onClick={() => {
      setState((current) => ({
        ...current,
        mode: "practice",
        assessmentIntegrity: "maintained",
      }));
    }}
    style={{
      marginTop: "16px",
      fontFamily: "monospace",
      fontSize: "13px",
      color: "#a78bfa",
      background: "transparent",
      border: "1px solid #6d4aff",
      borderRadius: "8px",
      padding: "9px 12px",
      cursor: "pointer",
    }}
  >
    Switch to Practice
  </button>
)}
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px",
              marginBottom: "18px",
            }}
          >
            <div
              style={{
                padding: "22px",
                border: "1px solid #2a2a2a",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#f5f7fb" }}>Skill Focus:</h3>

              {previewScenarioDetails.skillFocus.map((skill) => (
                <div key={skill} style={{ marginBottom: "8px", color: "#d1d5db" }}>
                  ✓ {skill}
                </div>
              ))}

              <hr style={{ borderColor: "#2a2a2a", margin: "22px 0" }} />

              <h3 style={{ color: "#f5f7fb" }}>Scenario Context:</h3>
              <p style={{ color: "#d1d5db", lineHeight: 1.6 }}>
                {previewScenarioDetails.scenarioContext}
              </p>

              <hr style={{ borderColor: "#2a2a2a", margin: "22px 0" }} />

              <h3 style={{ color: "#f5f7fb" }}>Success Outcome:</h3>
              <p style={{ color: "#d1d5db", lineHeight: 1.6 }}>
                {previewScenarioDetails.successOutcome}
              </p>
            </div>

            <div
              style={{
                padding: "22px",
                border: "1px solid #2a2a2a",
                borderRadius: "12px",
                background: "rgba(255, 255, 255, 0.03)",
              }}
            >
              <h3 style={{ marginTop: 0, color: "#f5f7fb" }}>
                Expected procedure:
              </h3>

              {mode === "practice" ? (
                previewScenarioDetails.previewSteps.map((step, index) => (
                  <div
                    key={step}
                    style={{
                      display: "flex",
                      gap: "14px",
                      padding: "14px 0",
                      borderBottom: "1px solid #2a2a2a",
                      color: COLORS.body,
                    }}
                  >
                    <strong style={{ color: "#a78bfa" }}>{index + 1}</strong>
                    <span>{getPreviewStepLabel(step)}</span>
                  </div>
                ))
              ) : (
                <p style={{ color: "#9aa4b2", lineHeight: 1.6 }}>
                  Procedure preview is hidden in Assessment Mode.
                </p>
              )}
            </div>
          </div>

          <div
            style={{
              padding: "18px 22px",
              border: "1px solid #2a2a2a",
              borderRadius: "12px",
              color: "#f5f7fb",
              background: "rgba(109, 74, 255, 0.08)",
            }}
          >
        
            Next step: type <strong>'start'</strong> to begin.
          </div>
          <div
  style={{
    marginTop: "12px",
    display: "flex",
    gap: "8px",
  }}
>
  <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        runCommand();
      }
    }}
    placeholder="Type 'start' to begin"
    style={{
      flex: 1,
      boxSizing: "border-box",
      fontFamily: "monospace",
      background: "transparent",
      color: "#fff",
      border: "1px solid #2a2a2a",
      borderRadius: "8px",
      padding: "10px 12px",
    }}
  />

  <button
    onClick={runCommand}
    style={{
      fontFamily: "monospace",
      padding: "10px 16px",
      border: "1px solid #6d4aff",
      borderRadius: "8px",
      background: "rgba(109, 74, 255, 0.18)",
      color: "#fff",
      cursor: "pointer",
    }}
  >
    Enter
  </button>
</div>
                </section>
      )}
{state.executionState === "RUNNING" && (
  <div
    style={{
      display: "block",
      marginBottom: SPACE.md,
    }}
  >
    <section
  style={{
    ...CARD.base,
    padding: SPACE.lg,
  }}
>
  <h2
  style={{
    margin: `0 0 ${SPACE.md}`,
    color: COLORS.text,
    fontSize: TEXT.title,
  }}
>
      {state.scenario
        ? SCENARIO_LABELS[state.scenario as keyof typeof SCENARIO_LABELS]
        : "Active Scenario"}{" "}
      — {state.scenario
        ? getScenarioTypeDisplayLabel(
            state.scenario as keyof typeof SCENARIO_LABELS
          )
        : "Standard"}
    </h2>

    <p style={{ margin: "0 0 10px", color: "#d1d5db", lineHeight: 1.6 }}>
      <strong style={{ color: COLORS.assessmentStrong }}>Customer Issue:</strong>{" "}
      {previewScenarioDetails?.scenarioContext ?? "Customer issue is active."}
    </p>

        <p style={{ margin: 0, color: "#d1d5db", lineHeight: 1.6 }}>
      <strong style={{ color: COLORS.assessmentStrong }}>Scenario Goal:</strong>{" "}
      {previewScenarioDetails?.successOutcome ?? "Resolve the customer issue."}
    </p>

    {mode === "assessment" && (
      <button
        type="button"
        onClick={() => {
          setState((current) => ({
            ...current,
            mode: "practice",

            ...(current.mode === "assessment" &&
            current.executionState === "RUNNING"
              ? { assessmentIntegrity: "converted_to_practice" }
              : {}),
          }));

          setProcedureHelpPinned(false);
        }}
style={{
  ...BUTTON.secondary,
  width: "100%",
  marginTop: SPACE.md,
  border: `1px solid ${COLORS.practiceStrong}`,
  color: COLORS.practice,
  textAlign: "center",
}}
      >
        Switch to Practice
      </button>
    )}
                </section>

  </div>
)}

{state.executionState === "RUNNING" && (
  <section
    style={{
      ...CARD.base,
      marginBottom: SPACE.md,
      padding: SPACE.lg,
    }}
  >
    <h3
      style={{
        margin: `0 0 ${SPACE.md}`,
        color: COLORS.text,
        fontSize: TEXT.section,
      }}
    >
      Conversation
    </h3>

    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 280px",
        gap: SPACE.lg,
        alignItems: "start",
      }}
    >
      <div
        style={{
          maxHeight: "320px",
          overflowY: "auto",
          paddingRight: SPACE.sm,
        }}
      >
        <div
          style={{
            whiteSpace: "pre-wrap",
            color: COLORS.body,
            fontSize: TEXT.detail,
            lineHeight: 1.6,
          }}
        >
          {log.map((line, index) =>
            line === "" ? (
              <div key={index} style={{ height: "10px" }} />
            ) : (
              <div key={index} style={{ marginBottom: "4px" }}>
                {line}
              </div>
            )
          )}
        </div>
      </div>

      <aside
        style={{
          borderLeft: `1px solid ${COLORS.border}`,
          paddingLeft: SPACE.lg,
        }}
      >
        <div
          style={{
            marginBottom: SPACE.sm,
            color: COLORS.text,
            fontSize: TEXT.section,
            fontWeight: 700,
          }}
        >
          Available commands:
        </div>

        {visibleCommands.map((command) => (
          <div
            key={command}
            style={{
              color: COLORS.body,
              fontSize: TEXT.detail,
              marginBottom: SPACE.xs,
            }}
          >
            - {command}
          </div>
        ))}

        {showProcedureHelp && (
          <button
            type="button"
            onClick={() => {
              setProcedureHelpPinned((current) => !current);
            }}
            style={{
              ...BUTTON.secondary,
              width: "100%",
              marginTop: SPACE.md,
              border: `1px solid ${COLORS.practiceStrong}`,
              color: COLORS.practice,
            }}
          >
            {procedureHelpOpen ? "Hide Procedure Help" : "Show Procedure Help"}
          </button>
        )}

        {procedureHelpOpen && (
          <div
            style={{
              marginTop: SPACE.md,
              padding: SPACE.md,
              border: `1px solid ${COLORS.border}`,
              borderRadius: RADIUS.button,
              background: COLORS.panelSoft,
              color: COLORS.body,
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            <div style={{ marginBottom: SPACE.sm, fontWeight: "bold" }}>
              Parser accepts these expressions:
            </div>

            {parserAliasHelp.map((item) => (
              <div key={item.command} style={{ marginTop: SPACE.sm }}>
                <div style={{ fontWeight: "bold" }}>{item.label}</div>

                {item.aliases.map((alias) => (
                  <div key={alias} style={{ marginLeft: "10px" }}>
                    - {alias}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  </section>
)}

{state.executionState === "RUNNING" && (
  <section
    style={{
      marginBottom: SPACE.md,
      padding: SPACE.lg,
      border: `1px solid ${COLORS.successDark}`,
      borderRadius: RADIUS.card,
      background: "rgba(22, 101, 52, 0.08)",
    }}
  >
<h3
  style={{
    margin: `0 0 ${SPACE.sm}`,
    color: COLORS.text,
    fontSize: TEXT.section,
  }}
>
  Current Decision
</h3>

<div
  style={{
    marginBottom: SPACE.md,
    color: COLORS.text,
    fontSize: TEXT.section,
    fontWeight: 700,
  }}
>
      {state.runLog.length === 0
        ? "What is your first troubleshooting step?"
        : "What’s your next step?"}
    </div>

    <div style={{ display: "flex", gap: SPACE.sm }}>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            runCommand();
          }
        }}
        placeholder="Enter your procedure..."
        style={{
          flex: 1,
          boxSizing: "border-box",
          fontFamily: "monospace",
          background: "transparent",
          color: COLORS.text,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.button,
          padding: "10px 12px",
        }}
      />

      <button
        onClick={runCommand}
        style={{
          ...BUTTON.secondary,
          border: `1px solid ${COLORS.successDark}`,
          background: "rgba(22, 163, 74, 0.35)",
        }}
      >
        Enter
      </button>
    </div>

<div
  style={{
    marginTop: SPACE.sm,
    color: COLORS.muted,
    fontSize: TEXT.label,
  }}
>
      Type a procedure you believe is the best next step.
    </div>
    </section>
)}
{state.executionState === "COMPLETED" && (
  <section
    style={{
  ...CARD.base,
  marginBottom: SPACE.lg,
  padding: SPACE.xl,
}}
  >
    <div
      style={{
        display: "grid",
        gridTemplateColumns: LAYOUT.completedHero,
        gap: SPACE.xl,
        alignItems: "center",
      }}
    >
      <div>
        <div
          style={{
            color: COLORS.success,
            fontSize: TEXT.hero,
            fontWeight: 700,
            lineHeight: 1,
            marginBottom: SPACE.sm,
          }}
        >
          PASS
        </div>

        <div
          style={{
            color: COLORS.body,
            marginBottom: SPACE.md,
          }}
        >
          You completed the scenario successfully.
        </div>

        <div
          style={{
            display: "inline-block",
            padding: "10px 16px",
            border: `1px solid ${COLORS.border}`,
            borderRadius: RADIUS.chip,
            color: COLORS.text,
          }}
        >
          Scenario:&nbsp;
          {state.scenario
            ? SCENARIO_LABELS[state.scenario as keyof typeof SCENARIO_LABELS]
            : "Completed Scenario"}
          {" — "}
          {state.scenario
            ? getScenarioTypeDisplayLabel(
                state.scenario as keyof typeof SCENARIO_LABELS
              )
            : "Standard"}
        </div>
      </div>

      <div
        style={{
          borderLeft: `1px solid ${COLORS.border}`,
          paddingLeft: SPACE.xl,
        }}
      >
        <h3
          style={{
            marginTop: 0,
            color: COLORS.text,
          }}
        >
          Assessment Result
        </h3>

        <div style={{ marginTop: SPACE.lg, color: COLORS.body }}>
          <strong>Mode:</strong>{" "}
          {mode === "practice" ? "Practice" : "Assessment"}
        </div>

        <div
          style={{
            marginTop: SPACE.md,
            color: COLORS.body,
          }}
        >
<strong>Assessment Status:</strong>{" "}
{mode === "practice"
  ? "Remained in Practice"
  : reportMeasurements.assessmentIntegrity === "maintained"
    ? "Maintained"
    : "Converted to Practice"}
        </div>
      </div>
    </div>
  </section>
)}
{state.executionState === "COMPLETED" && (
  <div>
    <div
  style={{
    display: "grid",
    gridTemplateColumns: LAYOUT.completedSummaryCards,
    gap: SPACE.md,
    marginBottom: SPACE.md,
  }}
>
      <section
        style={{
  ...CARD.base,
  padding: SPACE.md,
}}
      >
        <div
  style={{
    color: COLORS.muted,
    fontSize: TEXT.label,
    fontWeight: 700,
  }}
>
          Score
        </div>

        <div
          style={{
            marginTop: "10px",
            color: "#f5f7fb",
            fontSize: TEXT.title,
            fontWeight: 700,
          }}
        >
          {reportMeasurements.score}/10
        </div>
      </section>

      <section
        style={{
  ...CARD.base,
  padding: SPACE.md,
}}
      >
        <div
  style={{
    color: COLORS.muted,
    fontSize: TEXT.label,
    fontWeight: 700,
  }}
>
          Evidence
        </div>

        <div
  style={{
    marginTop: "10px",
    color: COLORS.body,
    fontSize: TEXT.detail,
  }}
>
          See below for details.
        </div>
      </section>

      <section
        style={{
  ...CARD.base,
  padding: SPACE.md,
}}
      >
        <div
  style={{
    color: COLORS.muted,
    fontSize: TEXT.label,
    fontWeight: 700,
  }}
>
          Assistance
        </div>

<div
  style={{
    marginTop: "10px",
    color: COLORS.body,
    fontSize: TEXT.detail,
  }}
>
  {reportMeasurements.assistanceCount > 0
    ? `Procedure Help Opened: ${reportMeasurements.assistanceCount} time(s)`
    : "Procedure Help Opened: 0 times"}
</div>
      </section>
    </div>

<section
  style={{
    ...CARD.base,
    marginBottom: SPACE.md,
    padding: SPACE.lg,
  }}
>
  <h3
    style={{
      marginTop: 0,
      color: COLORS.text,
      fontSize: TEXT.section,
    }}
  >
    Mistake Summary
  </h3>

  <div
    style={{
      color: COLORS.body,
      fontSize: TEXT.detail,
      lineHeight: 1.7,
    }}
  >
    <div>
      <strong>Denied Attempts:</strong> {reportDetails.deniedAttempts.length}
    </div>

    {reportDetails.deniedAttempts.length > 0 ? (
      reportDetails.deniedAttempts.map((event) => (
        <div key={`${event.timestamp}-${event.command}`}>
          - {formatRunLogEvent(event)}
  {" "}
  ({getMistakeLabel(event)})
        </div>
      ))
    ) : (
      <div>None recorded.</div>
    )}

    <div style={{ marginTop: SPACE.md }}>
      <strong>Unknown Commands:</strong> {reportDetails.unknownCommands.length}
    </div>

    {reportDetails.unknownCommands.length > 0 ? (
      reportDetails.unknownCommands.map((event) => (
        <div key={`${event.timestamp}-${event.command}`}>
          - {formatRunLogEvent(event)}
  {" "}
  ({getMistakeLabel(event)})
        </div>
      ))
    ) : (
      <div>None recorded.</div>
    )}

    <div style={{ marginTop: SPACE.md }}>
      <strong>Repeated Procedure Attempts:</strong>{" "}
      {reportDetails.repeatedProcedureAttempts.length}
    </div>

    {reportDetails.repeatedProcedureAttempts.length > 0 ? (
      reportDetails.repeatedProcedureAttempts.map((event) => (
        <div key={`${event.timestamp}-${event.command}`}>
          - {formatRunLogEvent(event)}
  {" "}
  ({getMistakeLabel(event)})
        </div>
      ))
    ) : (
      <div>None recorded.</div>
    )}
  </div>
</section>

<section
  style={{
    ...CARD.base,
    marginBottom: SPACE.md,
    padding: SPACE.lg,
  }}
>
  <h3
    style={{
      marginTop: 0,
      color: COLORS.text,
      fontSize: TEXT.section,
    }}
  >
    Summary
  </h3>

  <div
    style={{
      color: COLORS.body,
      fontSize: TEXT.detail,
      lineHeight: 1.7,
    }}
  >
    <div>
      <strong>Procedure Help Used During</strong>
    </div>

    {state.procedureHelpUsedDuring.length > 0 ? (
      state.procedureHelpUsedDuring.map((procedure) => (
        <div key={procedure}>
          - {procedure}
        </div>
      ))
    ) : (
      <div>None recorded.</div>
    )}
  </div>
</section>

    <section
      style={{
        display: "flex",
        gap: "12px",
        padding: "18px",
        border: "1px solid #2a2a2a",
        borderRadius: "12px",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <button
        type="button"
        onClick={() => {
          const scenarioCommand = previewScenarioDetails?.selectCommand;

          if (!scenarioCommand) return;

          const out = handleInput(state, "restart");

          setState(out.state);
          setLog(buildLogBlock(out.message || ""));
          setProcedureHelpPinned(false);
        }}
          style={BUTTON.secondary}
      >
        Retry Scenario
      </button>

      <button
        type="button"
        onClick={() => {
          setShowSelector(true);
          setLog(["Select a scenario to begin"]);
          setProcedureHelpPinned(false);
        }}
        style={BUTTON.primary}
      >
        Choose Another Scenario
      </button>

      <button
        type="button"
        onClick={() => {
          const out = handleInput(state, "quit");

          setState(out.state);
          setLog([]);
          setShowSelector(false);
          setOpenScenarioTypeId(null);
          setOpenBranchId(null);
          setProcedureHelpPinned(false);
        }}
          style={BUTTON.secondary}
      >
        Return Home
      </button>
    </section>
    <section
  style={{
    ...CARD.base,
    marginTop: SPACE.md,
    padding: SPACE.md,
  }}
>
  <div
    style={{
      marginBottom: SPACE.sm,
      color: COLORS.text,
      fontSize: TEXT.detail,
      fontWeight: 700,
    }}
  >
    Debug Console
  </div>

  <div
    style={{
      display: "flex",
      alignItems: "center",
      gap: SPACE.sm,
    }}
  >
    <input
      value={scoringInput}
      onChange={(e) => setScoringInput(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          const command = scoringInput.trim().toLowerCase();

          if (command === "debug") {
            setScoringOutput(
              JSON.stringify(
                {
                  executionState: state.executionState,
                  scenario: state.scenario,
                  mode: state.mode,
                  score: reportMeasurements.score,
                  mistakes: reportMeasurements.mistakeCount,
                  runLog: state.runLog,
                },
                null,
                2
              )
            );

            setScoringInput("");
          }
        }
      }}
      placeholder="type debug"
      style={{
        width: "180px",
        padding: "6px 10px",
        fontFamily: "monospace",
        fontSize: TEXT.label,
        background: "transparent",
        color: COLORS.body,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.button,
      }}
    />

    <button
      type="button"
      onClick={() => {
        const command = scoringInput.trim().toLowerCase();

        if (command === "debug") {
          setScoringOutput(
            JSON.stringify(
              {
                executionState: state.executionState,
                scenario: state.scenario,
                mode: state.mode,
                score: reportMeasurements.score,
                mistakes: reportMeasurements.mistakeCount,
                runLog: state.runLog,
              },
              null,
              2
            )
          );

          setScoringInput("");
        }
      }}
      style={{
        ...BUTTON.secondary,
        padding: "6px 10px",
        fontSize: TEXT.label,
      }}
    >
      Enter
    </button>
  </div>

  <pre
    style={{
      marginTop: SPACE.md,
      minHeight: "160px",
      maxHeight: "360px",
      overflow: "auto",
      padding: SPACE.md,
      color: COLORS.body,
      fontSize: TEXT.label,
      fontFamily: "monospace",
      whiteSpace: "pre-wrap",
      border: `1px solid ${COLORS.border}`,
      borderRadius: RADIUS.button,
      background: COLORS.panelSoft,
    }}
  >
    {scoringOutput || "Debug output will appear here."}
  </pre>
</section>
  </div>
)}
    <div
  style={{
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "12px",
  }}
>
  <div style={{ flex: 1 }}>
    
  </div>

</div>

  </div>
);
}