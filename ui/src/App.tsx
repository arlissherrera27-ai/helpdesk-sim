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
  const [log, setLog] = useState<string[]>([
    "Welcome to the Helpdesk Simulator.",
    "",
    "You will be given a customer issue.",
    "Your job is to resolve it using the correct troubleshooting steps.",
  ]);

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
        return [
          "Welcome to the Helpdesk Simulator.",
          "",
          "You will be given a customer issue.",
          "Your job is to resolve it using the correct troubleshooting steps.",
          "",
          ];
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

  return (
    <div
      style={{
      height: "100vh",
      display: "flex",
      flexDirection: "column",
      padding: "20px",
      fontFamily: "monospace",
      boxSizing: "border-box",
    }}
  >
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

    {state.executionState !== "RUNNING" && (
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
                  "Welcome to the Helpdesk Simulator.",
                  "",
                  "You will be given a customer issue.",
                  "Your job is to resolve it using the correct troubleshooting steps.",
                  "",
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