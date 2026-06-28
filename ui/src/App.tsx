import { useState, useRef, useEffect } from "react";
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

export default function App() {
  const [state, setState] = useState<SimState>(initialState());
  const [input, setInput] = useState("");
  const [log, setLog] = useState<string[]>([]);

  const [showSelector, setShowSelector] = useState(false);
  const [openScenarioTypeId, setOpenScenarioTypeId] = useState<string | null>(null);
  const [openBranchId, setOpenBranchId] = useState<string | null>(null);
  const [procedureHelpPinned, setProcedureHelpPinned] = useState(false);
  const mode = state.mode;

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const visibleCommands = getVisibleCommands(state); 
  const shownCommands =
    (state.executionState === "LOBBY" && state.scenario === null) ||
    log.includes("Select a scenario to begin")
      ? []
      : visibleCommands;

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
  
  const showTopScenarioButton =
    state.executionState !== "RUNNING"

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  },  [log]);

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

let inputPlaceholder = "Select a scenario to begin";

if (showSelector) {
  inputPlaceholder = "Choose a scenario above";
} else if (state.executionState === "RUNNING") {
  const hasCompletedProcedure = state.runLog.some(
    (event) =>
      event.decision === "ALLOW" &&
      event.plan !== "StartNewAttempt" &&
      event.plan !== "ReadOnly"
  );

  inputPlaceholder = hasCompletedProcedure
    ? "What’s your next step?"
    : "Enter first troubleshooting step...";
} else if (state.executionState === "COMPLETED") {
  inputPlaceholder = "Type here...";
} else if (state.scenario !== null || state.previewScenario !== null) {
  inputPlaceholder = "Type here...";
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
{state.executionState === "COMPLETED" && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "2fr 0.7fr 1fr",
      gap: "16px",
      marginBottom: "16px",
    }}
  >
    <section style={{ padding: "18px", border: "1px solid #2a2a2a", borderRadius: "12px", background: "rgba(255,255,255,0.03)" }}>
      <div style={{ color: "#9aa4b2", fontSize: "12px", fontWeight: 700 }}>Score</div>
      <div style={{ marginTop: "8px", color: "#f5f7fb", fontSize: "24px", fontWeight: 700 }}>
        {"—"}
      </div>
    </section>

    <section style={{ padding: "18px", border: "1px solid #2a2a2a", borderRadius: "12px", background: "rgba(255,255,255,0.03)" }}>
      <div style={{ color: "#9aa4b2", fontSize: "12px", fontWeight: 700 }}>Evidence</div>
      <div style={{ marginTop: "8px", color: "#d1d5db", fontSize: "13px" }}>
        Complete
      </div>
    </section>

    <section style={{ padding: "18px", border: "1px solid #2a2a2a", borderRadius: "12px", background: "rgba(255,255,255,0.03)" }}>
      <div style={{ color: "#9aa4b2", fontSize: "12px", fontWeight: 700 }}>Assistance</div>
      <div style={{ marginTop: "8px", color: "#d1d5db", fontSize: "13px" }}>
        {state.procedureHelpUsedDuring.length > 0
          ? `${state.procedureHelpUsedDuring.length} help use(s)`
          : "None"}
      </div>
    </section>
  </div>
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
                      color: "#d1d5db",
                      fontSize: "13px",
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
                      color: "#d1d5db",
                      fontSize: "13px",
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
                        marginBottom: "10px",
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
                      color: "#d1d5db",
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
                </section>
      )}
{state.executionState === "RUNNING" && (
  <div
    style={{
      display: "grid",
      gridTemplateColumns: "1fr 320px",
      gap: "16px",
      alignItems: "start",
      marginBottom: "16px",
    }}
  >
    <section
      style={{
        padding: "22px",
        border: "1px solid #2a2a2a",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.03)",
    }}
  >
    <h2 style={{ margin: "0 0 14px", color: "#f5f7fb" }}>
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
      <strong style={{ color: "#60a5fa" }}>Customer Issue:</strong>{" "}
      {previewScenarioDetails?.scenarioContext ?? "Customer issue is active."}
    </p>

        <p style={{ margin: 0, color: "#d1d5db", lineHeight: 1.6 }}>
      <strong style={{ color: "#60a5fa" }}>Scenario Goal:</strong>{" "}
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
                </section>

        <section
  style={{
    position: "relative",
    zIndex: 10,
    padding: "18px 22px",
    border: "1px solid #2a2a2a",
    borderRadius: "12px",
    background: "rgba(255, 255, 255, 0.03)",
  }}
>
      
      <div
        style={{
          marginBottom: "8px",
          color: "#f5f7fb",
          fontWeight: 700,
        }}
      >
        Available commands:
      </div>

            {visibleCommands.map((command) => (
        <div
          key={command}
          style={{
            color: "#d1d5db",
            marginBottom: "4px",
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
            marginTop: "12px",
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
          {procedureHelpOpen ? "Hide Procedure Help" : "Show Procedure Help"}
        </button>
      )}
            {procedureHelpOpen && (
        <div
          style={{
          position: "absolute",
          top: "100%",
          right: 0,
          width: "320px",
          marginTop: "8px",
          padding: "10px",
          border: "1px solid #2a2a2a",
          borderRadius: "8px",
          background: "#111",
          color: "#e5e5e5",
          maxHeight: "320px",
          overflowY: "auto",
          boxShadow: "0 16px 35px rgba(0, 0, 0, 0.45)",
        }}
        >
          <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
            Parser accepts these expressions:
          </div>

          {parserAliasHelp.map((item) => (
            <div key={item.command} style={{ marginTop: "8px" }}>
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
    </section>

  </div>
)}

{state.executionState === "RUNNING" && (
  <section
    style={{
      marginBottom: "16px",
      padding: "22px",
      border: "1px solid #2a2a2a",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.03)",
    }}
  >
    <h3 style={{ margin: "0 0 16px", color: "#f5f7fb" }}>
      Conversation
    </h3>

    <div style={{ whiteSpace: "pre-wrap", color: "#d1d5db", lineHeight: 1.6 }}>
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
  </section>
)}

{state.executionState === "RUNNING" && (
  <section
    style={{
      marginBottom: "16px",
      padding: "22px",
      border: "1px solid #1f7a3a",
      borderRadius: "12px",
      background: "rgba(22, 101, 52, 0.08)",
    }}
  >
    <h3 style={{ margin: "0 0 8px", color: "#f5f7fb" }}>
      Current Decision
    </h3>

    <div
      style={{
        marginBottom: "14px",
        color: "#e5e7eb",
        fontSize: "20px",
        fontWeight: 700,
      }}
    >
      {state.runLog.length === 0
        ? "What is your first troubleshooting step?"
        : "What’s your next step?"}
    </div>

    <div style={{ display: "flex", gap: "8px" }}>
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
          border: "1px solid #1f7a3a",
          borderRadius: "8px",
          background: "rgba(22, 163, 74, 0.35)",
          color: "#fff",
          cursor: "pointer",
        }}
      >
        Enter
      </button>
    </div>

    <div
      style={{
        marginTop: "10px",
        color: "#9aa4b2",
        fontSize: "12px",
      }}
    >
      Type a procedure you believe is the best next step.
    </div>
    </section>
)}
{state.executionState === "COMPLETED" && (
  <section
    style={{
      marginBottom: "16px",
      padding: "22px",
      border: "1px solid #2a2a2a",
      borderRadius: "12px",
      background: "rgba(255, 255, 255, 0.03)",
    }}
  >
    <div
      style={{
        color: "#9aa4b2",
        fontSize: "13px",
        fontWeight: 700,
        marginBottom: "8px",
      }}
    >
      Assessment Result
    </div>

    <h2 style={{ margin: "0 0 10px", color: "#f5f7fb", fontSize: "26px" }}>
      PASS
    </h2>

    <div style={{ color: "#d1d5db", fontSize: "13px", lineHeight: 1.6 }}>
      {state.scenario
        ? SCENARIO_LABELS[state.scenario as keyof typeof SCENARIO_LABELS]
        : "Completed Scenario"}{" "}
      —{" "}
      {state.scenario
        ? getScenarioTypeDisplayLabel(
            state.scenario as keyof typeof SCENARIO_LABELS
          )
        : "Standard"}
    </div>

    <div style={{ color: "#9aa4b2", fontSize: "13px", marginTop: "6px" }}>
      Mode: {mode === "practice" ? "Practice" : "Assessment"}
    </div>
  </section>
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
    
      {state.scenario &&
      state.executionState !== "LOBBY" &&
      !showSelector &&
      !log.includes("Select a scenario to begin") && (
      <div
        style={{
          marginBottom: "10px",
          padding: "8px 10px",
          borderBottom: "1px solid #2a2a2a",
          fontSize: "13px",
          color: "#bdbdbd",
        }}
      >
        Active Scenario:{" "}
        <strong>
          {SCENARIO_LABELS[state.scenario as keyof typeof SCENARIO_LABELS]}
        </strong>{" "}
        — {getScenarioTypeDisplayLabel(
          state.scenario as keyof typeof SCENARIO_LABELS
        )}
        <div style={{ marginTop: "4px", display: "flex", gap: "10px", alignItems: "center" }}>
          <span>Mode: {mode === "practice" ? "Practice" : "Assessment"}</span>

          {state.executionState === "RUNNING" && mode === "assessment" && (
            <button
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
                fontFamily: "monospace",
                fontSize: "11px",
                background: "transparent",
                color: "#bdbdbd",
                border: "1px solid #2a2a2a",
                cursor: "pointer",
              }}
            >
              Switch to Practice
            </button>
          )}
        </div>
      </div>
    )}

{state.executionState !== "RUNNING" &&
 !(
   state.executionState === "LOBBY" &&
   (state.scenario === null || showState3Preview)
 ) && (
  <>
      {showTopScenarioButton && (
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginBottom: "8px",
            }}
          >
            <button
            onClick={() => {
              setProcedureHelpPinned(false);

              if (showSelector) {
                setShowSelector(false);
                setOpenScenarioTypeId(null);
                setOpenBranchId(null);
                return;
              }

              if (state.executionState === "LOBBY" && state.scenario !== null) {
                setShowSelector(true);
                setOpenScenarioTypeId(null);
                setOpenBranchId(null);  

                setLog([
  "Select a scenario to begin",
]);

                return;
              }

              setShowSelector(true);
            }}
              style={{ fontFamily: "monospace" }}
            >
              Select Scenario
            </button>

            <span style={{ fontSize: "12px", color: "#bdbdbd" }}>
              Mode: {mode === "practice" ? "Practice" : "Assessment"}
            </span>

            <button
              onClick={() => {
              const nextMode = state.mode === "practice" ? "assessment" : "practice";

              setState((current) => ({
              ...current,
              mode: nextMode,
              assessmentIntegrity: "maintained",
            }));

            if (
              state.executionState === "LOBBY" &&
              state.previewScenario !== null
            ) {
              const selectedScenario = scenarioTree
                .flatMap((scenarioType) => scenarioType.branches)
                .flatMap((branch) => branch.scenarios)
                .find((scenario) => scenario.id === state.previewScenario);

                if (selectedScenario && !log.includes("Select a scenario to begin")) {
                  setLog(buildLogBlock(buildScenarioPreview(selectedScenario, nextMode)));
                }
              }

                setProcedureHelpPinned(false);
              }}
              style={{
                fontFamily: "monospace",
                fontSize: "11px",
                background: "transparent",
                color: "#bdbdbd",
                border: "1px solid #2a2a2a",
                cursor: "pointer",
              }}
            >
              Switch to {mode === "practice" ? "Assessment" : "Practice"}
            </button>
          </div>

          {showSelector &&
            scenarioTree.map((scenarioType) => (
              <div key={scenarioType.typeId} style={{ marginTop: "8px" }}>
                <button
                  onClick={() => {
                    if (!scenarioType.enabled) return;

                    setOpenScenarioTypeId((prev) =>
                      prev === scenarioType.typeId ? null : scenarioType.typeId
                    );

                    setOpenBranchId(null);
                  }}
                  style={{
                    fontFamily: "monospace",
                    display: "block",
                    opacity: scenarioType.enabled ? 1 : 0.5,
                    cursor: scenarioType.enabled ? "pointer" : "default",
                  }}
                >
                  {scenarioType.typeLabel}
                </button>

                <div
                  style={{
                    fontSize: "12px",
                    opacity: 0.75,
                    marginLeft: "8px",
                  }}
                >
                  {scenarioType.description}
                  {!scenarioType.enabled ? " Coming later." : ""}
                </div>

                {openScenarioTypeId === scenarioType.typeId &&
                  scenarioType.branches.map((branch) => (
                    <div
                      key={branch.tierId}
                      style={{
                        marginTop: "8px",
                        marginLeft: "16px",
                      }}
                    >
                      <button
                        onClick={() => {
                          setOpenBranchId((prev) =>
                            prev === branch.tierId ? null : branch.tierId
                          );

                        }}
                        style={{
                          fontFamily: "monospace",
                          display: "block",
                        }}
                      >
                        {branch.tierLabel}
                      </button>

{openBranchId === branch.tierId &&
  branch.scenarios.map((scenario) => (
    <div
      key={scenario.id}
      style={{
        marginLeft: "16px",
        marginTop: "8px",
      }}
    >
<button
  onClick={() => {
    const command = scenario.selectCommand;

    if (!command) return;

    const out = handleInput(state, command);

    setState(out.state);

    const previewMessage = buildScenarioPreview(
      scenario,
      mode
    );

    setLog(buildLogBlock(previewMessage));

    setShowSelector(false);
    setOpenScenarioTypeId(null);
    setOpenBranchId(null);
  }}
  style={{
    fontFamily: "monospace",
    display: "block",
    textAlign: "left",
    padding: "8px",
    maxWidth: "360px",
    cursor: "pointer",
  }}
>
  <div>{scenario.label}</div>

  <div style={{ fontSize: "12px", opacity: 0.75 }}>
    {scenario.level} • {scenario.estimatedTime}
  </div>

  <div style={{ fontSize: "12px", opacity: 0.75 }}>
    {scenario.description}
  </div>
</button>
    </div>
  ))}
                    </div>
                  ))}
              </div>
            ))}
        </div>
      )}
  </>
)}
  </div>

  {shownCommands.length > 0 && (
  <div
    style={{
      minWidth: "160px",
      padding: "4px 6px",
      fontFamily: "monospace",
      fontSize: "11px",
      color: "#888",
      background: "transparent",
    }}
  >
    <div
      style={{
        marginBottom: "4px",
        fontSize: "10px",
        letterSpacing: "0.3px",
        color: "#666",
      }}
    >
      Available commands:
    </div>

    {shownCommands.map((command) => (
      <div
        key={command}
        style={{
          marginBottom: "1px",
          opacity: 0.8,
        }}
      >
        - {command}
      </div>
    ))}

    {showProcedureHelp && (
      <div
        style={{
          position: "relative",
          marginTop: "10px",
          paddingTop: "8px",
          borderTop: "1px solid #2a2a2a",
        }}
      >
        <button
          type="button"
          onClick={() => {
          setProcedureHelpPinned((current) => {
            const nextPinned = !current;

            if (nextPinned) {
              setState((currentState) => {
                const currentExpectedStep =
                  getCurrentExpectedProcedureLabel(currentState);

                return {
                  ...currentState,
                  procedureHelpOpenedCount:
                    currentState.procedureHelpOpenedCount + 1,

                  procedureHelpUsedDuring:
                    currentExpectedStep &&
                    !currentState.procedureHelpUsedDuring.includes(currentExpectedStep)
                      ? [
                          ...currentState.procedureHelpUsedDuring,
                          currentExpectedStep,
                        ]
                      : currentState.procedureHelpUsedDuring,
                };
              });
            }

            return nextPinned;
          });
        }}
          style={{
            fontFamily: "monospace",
            fontSize: "11px",
            color: "#bdbdbd",
            background: "transparent",
            border: "none",
            padding: 0,
            cursor: "pointer",
            textAlign: "left",
          }}
        >
          {procedureHelpOpen ? "Hide Procedure Help" : "Show Procedure Help"}
        </button>

        {procedureHelpOpen && (
          <div
            style={{
              position: "absolute",
              right: 0,
              top: "24px",
              zIndex: 20,
              width: "320px",
              maxHeight: "360px",
              overflowY: "auto",
              padding: "10px",
              border: "1px solid #2a2a2a",
              background: "#111",
              color: "#e5e5e5",
              boxShadow: "0 10px 25px rgba(0, 0, 0, 0.35)",
            }}
          >
            <div style={{ marginBottom: "8px", fontWeight: "bold" }}>
              Parser accepts these expressions:
            </div>

            {parserAliasHelp.map((item) => (
              <div key={item.command} style={{ marginTop: "8px" }}>
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
      </div>
    )}
  </div>
)}
</div>
    
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        whiteSpace: "pre-wrap",
        marginBottom: "0px",
      }}
    >
            {!showSelector &&
        !showState3Preview &&
        log.map((line, index) =>
        line === "" ? (
         <div key={index} style={{ height: "10px" }} />
        ) : (
          <div
            key={index}
            style={{
              marginBottom: line.startsWith(">") ? "6px" : "2px",
              fontWeight: "normal",
            }}
          >
            {line}
          </div>
        )
      )}

      <div ref={bottomRef} />
    </div>

    <div
      style={{
        borderTop: "1px solid #2a2a2a",
        paddingTop: "0px",
        background: "transparent",
      }}
    >
      <div style={{ display: "flex", gap: "8px" }}>
  <input
    value={input}
    onChange={(e) => setInput(e.target.value)}
    onKeyDown={(e) => {
      if (e.key === "Enter") {
        runCommand();
      }
    }}
    placeholder={inputPlaceholder}
    style={{
      flex: 1, // fills remaining space
      boxSizing: "border-box",
      fontFamily: "monospace",
      background: "transparent",
      color: "#fff",
      border: "1px solid #2a2a2a",
    }}
  />

  <button
    onClick={runCommand}
    style={{
      fontFamily: "monospace",
      padding: "4px 10px",
      border: "1px solid #2a2a2a",
      background: "transparent",
      color: "#fff",
      cursor: "pointer",
    }}
  >
    Enter
  </button>
</div>
    </div>
  </div>
);
}