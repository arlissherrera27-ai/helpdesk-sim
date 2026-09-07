import { useEffect, useRef, useState } from "react";
import { handleInput } from "./core/engine";
import { initialState } from "./core/state";
import type { SimState } from "./core/types";
import type { AppView } from "./appTypes";
import ProfilePage from "./ProfilePage";
import CreateProfilePage from "./CreateProfilePage";
import HistoryPage from "./HistoryPage";
import AttemptDetailPage from "./AttemptDetailPage";
import PlaylistsPage from "./PlaylistsPage";
import PlaylistEditorPage from "./PlaylistEditorPage";
import PlaylistChooser from "./PlaylistChooser";
import PlaylistRunSummaryPage from "./PlaylistRunSummaryPage";
import PlaylistRunDetailPage from "./PlaylistRunDetailPage";
import { createScenarioAttemptRecord } from "./history/createScenarioAttemptRecord";
import {
  appendAttemptRecord,
  loadAttemptHistoryForProfile,
} from "./history/historyStore";
import {
  COLORS,
  TEXT,
  SPACE,
  RADIUS,
  CARD,
  BUTTON,
} from "./uiSystem";
import { isValidScenarioId } from "./core/scenarios";
import { getScenarioLabel } from "./core/scenarioRegistry";
import {
  scenarioTree,
  getPreviewStepLabel,
  getScenarioTypeDisplayLabel,
} from "./core/scenarioTree";
import { COMMAND_ALIASES } from "./core/parse";
import { getScenarioProcedureCommands } from "./core/scenarioRegistry";
import type { UserProfile } from "./profile/types";
import {
  loadActiveProfile,
  saveActiveProfile,
  clearActiveProfile,
} from "./profile/profileStore";

import {
  calculateProfileMetrics,
} from "./profile/calculateProfileMetrics";

import type {
  ScenarioAttemptRecord,
} from "./history/types";

import type {
  SavedPlaylist,
  PlaylistRun,
} from "./playlists/types";

import {
  appendSavedPlaylist,
  replaceSavedPlaylist,
  loadSavedPlaylistsForProfile,
  addScenarioToSavedPlaylist,
  removeScenarioFromSavedPlaylist,
  moveScenarioInSavedPlaylist,
  loadPlaylistRunsForProfile,
  appendPlaylistRun,
  replacePlaylistRun,
} from "./playlists/playlistStore";

import {
  createSavedPlaylist,
  updateSavedPlaylist,
  createPlaylistRun,
} from "./playlists/createPlaylistRecords";

import {
  abandonPlaylistRunRecord,
  advancePlaylistRunRecord,
  attachAttemptToPlaylistRun,
} from "./playlists/playlistRunLifecycle";

import {
  runScenarioValidation,
  type ScenarioValidationReport,
} from "./core/scenarioValidation";

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

  return {
    deniedAttempts,
    unknownCommands,
  };
}

export default function App() {
const [state, setState] = useState<SimState>(initialState());
const [appView, setAppView] = useState<AppView>("simulator");
const [selectedAttemptId, setSelectedAttemptId] =
  useState<string | null>(null);

const [
  selectedPlaylistRunId,
  setSelectedPlaylistRunId,
] = useState<string | null>(null);

const [selectedPlaylistId, setSelectedPlaylistId] =
  useState<string | null>(null);

const [activePlaylistRun, setActivePlaylistRun] =
  useState<PlaylistRun | null>(null);

const [activeProfile, setActiveProfile] =
  useState<UserProfile | null>(
    loadActiveProfile()
  );

  const [playlistRuns, setPlaylistRuns] =
  useState<PlaylistRun[]>(() => {
    if (activeProfile === null) {
      return [];
    }

    return loadPlaylistRunsForProfile(
      activeProfile.profileId
    );
  });

const [savedPlaylists, setSavedPlaylists] =
  useState<SavedPlaylist[]>(() => {
    if (activeProfile === null) {
      return [];
    }

    return loadSavedPlaylistsForProfile(
      activeProfile.profileId
    );
  });

const selectedPlaylist =
  selectedPlaylistId === null
    ? null
    : savedPlaylists.find(
        (playlist) =>
          playlist.playlistId === selectedPlaylistId
      ) ?? null;

const [profileHistory, setProfileHistory] =
  useState<ScenarioAttemptRecord[]>(() => {
    if (activeProfile === null) {
      return [];
    }

    return loadAttemptHistoryForProfile(
      activeProfile.profileId
    );
  });

const profileMetrics =
  calculateProfileMetrics(profileHistory);

  const selectedAttempt =
  selectedAttemptId === null
    ? null
    : profileHistory.find(
        (attempt) =>
          attempt.attemptId === selectedAttemptId
      ) ?? null;

      const selectedPlaylistRun =
  selectedPlaylistRunId === null
    ? null
    : playlistRuns.find(
        (run) =>
          run.playlistRunId ===
          selectedPlaylistRunId
      ) ?? null;

const [attemptStartedAt, setAttemptStartedAt] =
  useState<string | null>(null);
const [input, setInput] = useState("");
const [log, setLog] = useState<string[]>([]);

const [
  scenarioValidationReport,
  setScenarioValidationReport,
] = useState<ScenarioValidationReport | null>(null);

    const commandInputRef = useRef<HTMLInputElement>(null);
  const conversationRef = useRef<HTMLDivElement>(null);

const [showSelector, setShowSelector] = useState(false);
const [openScenarioTypeId, setOpenScenarioTypeId] = useState<string | null>(null);
const [openBranchId, setOpenBranchId] = useState<string | null>(null);

const [playlistScenarioId, setPlaylistScenarioId] =
  useState<string | null>(null);

const [playlistAddTargetId, setPlaylistAddTargetId] =
  useState<string | null>(null);

const playlistScenario =
  playlistScenarioId === null
    ? null
    : scenarioTree
        .flatMap((scenarioType) => scenarioType.branches)
        .flatMap((branch) => branch.scenarios)
        .find((scenario) => scenario.id === playlistScenarioId) ?? null;

const [procedureHelpPinned, setProcedureHelpPinned] = useState(false);

const [showMobileProcedureHelp, setShowMobileProcedureHelp] = useState(false);

const [showFeedback, setShowFeedback] = useState(false);
const [feedbackType, setFeedbackType] =
  useState<"suggestion" | "feedback">("suggestion");
const [feedbackMessage, setFeedbackMessage] = useState("");
const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

const scoringOutput = JSON.stringify(
  {
    executionState: state.executionState,
    scenario: state.scenario,
    mode: state.mode,
    attempt: state.attempt,
    score: getReportMeasurements(state).score,
    mistakes: getReportMeasurements(state).mistakeCount,
    runLog: state.runLog,
  },
  null,
  2
);

  useEffect(() => {
    if (
      state.executionState === "RUNNING" ||
      (
        state.executionState === "LOBBY" &&
        state.previewScenario !== null &&
        !showSelector
      )
    ) {
      commandInputRef.current?.focus();
    }
  }, [
    state.executionState,
    state.scenario,
    state.previewScenario,
    showSelector,
    log.length,
  ]);

    useEffect(() => {
    if (state.executionState !== "RUNNING") {
      return;
    }

    const conversation = conversationRef.current;

    if (!conversation) {
      return;
    }

    conversation.scrollTop = conversation.scrollHeight;
  }, [log.length, state.executionState]);

  const mode = state.mode;

  function persistPlaylistRun(
  run: PlaylistRun
): void {
  const updatedRuns =
    replacePlaylistRun(run);

  if (activeProfile === null) {
    setPlaylistRuns([]);
    return;
  }

  const ownedRuns =
    updatedRuns.filter(
      (item) =>
        item.profileId ===
        activeProfile.profileId
    );

  setPlaylistRuns(ownedRuns);
}

  function startPlaylistRun(
  playlist: SavedPlaylist
): void {
  if (
    activeProfile === null ||
    playlist.profileId !== activeProfile.profileId
  ) {
    return;
  }

  if (playlist.scenarioIds.length === 0) {
    return;
  }

  const playlistScenarios =
    playlist.scenarioIds.map((scenarioId) =>
      scenarioTree
        .flatMap(
          (scenarioType) =>
            scenarioType.branches
        )
        .flatMap(
          (branch) =>
            branch.scenarios
        )
        .find(
          (scenario) =>
            scenario.id === scenarioId
        )
    );

  if (
    playlistScenarios.some(
      (scenario) =>
        scenario === undefined ||
        !scenario.selectCommand
    )
  ) {
    return;
  }

  const playlistRun =
    createPlaylistRun({
      playlist,
      mode,
    });

  const updatedRuns =
  appendPlaylistRun(playlistRun);

const ownedRuns =
  updatedRuns.filter(
    (run) =>
      run.profileId ===
      activeProfile.profileId
  );

setPlaylistRuns(ownedRuns);
setActivePlaylistRun(playlistRun);

  const firstScenario =
    playlistScenarios[0];

  if (
    firstScenario === undefined ||
    !firstScenario.selectCommand
  ) {
    return;
  }

  const cleanState: SimState = {
  ...initialState(),
  mode: playlistRun.mode,
};

const out = handleInput(
  cleanState,
  firstScenario.selectCommand
);

setState(out.state);

setLog(
  buildLogBlock(
    buildScenarioPreview(
      firstScenario,
      playlistRun.mode
    )
  )
);

setAttemptStartedAt(null);
setScenarioValidationReport(null);
setProcedureHelpPinned(false);
setShowMobileProcedureHelp(false);

setShowSelector(false);
setOpenScenarioTypeId(null);
setOpenBranchId(null);

setAppView("simulator");
}

function advancePlaylistRun(
  run: PlaylistRun
): void {
  const advanceResult =
    advancePlaylistRunRecord(
      run,
      new Date().toISOString()
    );

  if (
    advanceResult.kind === "ignored"
  ) {
    return;
  }

  if (
    advanceResult.kind === "completed"
  ) {
    persistPlaylistRun(
      advanceResult.run
    );

    setActivePlaylistRun(
      advanceResult.run
    );

    setAttemptStartedAt(null);
    setAppView(
      "playlist_run_summary"
    );

    return;
  }

  const updatedRun =
    advanceResult.run;

  const nextScenarioId =
    advanceResult.nextScenarioId;

  const nextScenario =
    scenarioTree
      .flatMap(
        (scenarioType) =>
          scenarioType.branches
      )
      .flatMap(
        (branch) =>
          branch.scenarios
      )
      .find(
        (scenario) =>
          scenario.id ===
          nextScenarioId
      );

  if (
    nextScenario === undefined ||
    !nextScenario.selectCommand
  ) {
    return;
  }

  persistPlaylistRun(updatedRun);
  setActivePlaylistRun(updatedRun);

  const cleanState: SimState = {
    ...initialState(),
    mode: updatedRun.mode,
  };

  const selectedOut = handleInput(
    cleanState,
    nextScenario.selectCommand
  );

  const startedAt =
    new Date().toISOString();

  const startedOut = handleInput(
    selectedOut.state,
    "start"
  );

  setState(startedOut.state);

  setLog(
    buildLogBlock(
      startedOut.message || ""
    )
  );

  if (
    startedOut.state.attempt !== null
  ) {
    setAttemptStartedAt(startedAt);
  } else {
    setAttemptStartedAt(null);
  }

  setScenarioValidationReport(null);
  setProcedureHelpPinned(false);
  setShowMobileProcedureHelp(false);

  setShowSelector(false);
  setOpenScenarioTypeId(null);
  setOpenBranchId(null);

  setAppView("simulator");
}

function abandonPlaylistRun(
  attemptId?: string
): void {
  if (activePlaylistRun === null) {
    return;
  }

  const abandonedRun =
    abandonPlaylistRunRecord(
      activePlaylistRun,
      new Date().toISOString(),
      attemptId
    );

  if (
    abandonedRun === activePlaylistRun
  ) {
    return;
  }

  persistPlaylistRun(abandonedRun);
  setActivePlaylistRun(null);
}

  const activeScenarioId =
    state.scenario && isValidScenarioId(state.scenario)
      ? state.scenario
      : null;

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

const lower = trimmed.toLowerCase();
const isStart = lower === "start";
const isQuit = lower === "quit";
const isRestart = lower === "restart";

const isAcceptedProcedure =
  out.decision.kind === "ALLOW" &&
  out.decision.plan.kind !== "ReadOnly" &&
  out.decision.plan.kind !== "StartNewAttempt" &&
  out.decision.plan.kind !== "SelectScenario" &&
  out.decision.plan.kind !== "QuitAttemptToLobby" &&
  out.decision.plan.kind !== "ViewScorecard";

const expectedStepDuringHelp =
  procedureHelpPinned && state.mode === "practice"
    ? getCurrentExpectedProcedureLabel(state)
    : null;

if (isAcceptedProcedure) {
  setProcedureHelpPinned(false);
  setShowMobileProcedureHelp(false);
}

const finalStepDuringHelp =
  procedureHelpPinned &&
  state.mode === "practice" &&
  out.state.executionState === "SCORECARD" &&
  out.decision.kind === "ALLOW" &&
  out.decision.plan.kind !== "ReadOnly"
    ? getPreviewStepLabel(
        out.decision.plan.kind
          .replace(/([a-z])([A-Z])/g, "$1_$2")
          .toLowerCase()
      )
    : null;

const commandTime = new Date().toISOString();

let playlistRunToAdvance:
  PlaylistRun | null = null;

if (
  out.state.executionState === "SCORECARD" &&
  attemptStartedAt !== null
) {
  if (activeProfile !== null) {
    const attemptRecord = createScenarioAttemptRecord(
      out.state,
      {
        profileId: activeProfile.profileId,
        startedAt: attemptStartedAt,
        endedAt: commandTime,
        endReason: "completed",
      }
    );

    if (attemptRecord !== null) {
  const updatedHistory =
    appendAttemptRecord(attemptRecord);

  const ownedHistory =
    updatedHistory.filter(
      (attempt) =>
        attempt.profileId ===
        activeProfile.profileId
    );

  setProfileHistory(ownedHistory);

  if (
  activePlaylistRun !== null &&
  activePlaylistRun.status === "running"
) {
  const updatedPlaylistRun =
  attachAttemptToPlaylistRun(
    activePlaylistRun,
    attemptRecord.attemptId
  );

  persistPlaylistRun(updatedPlaylistRun);
setActivePlaylistRun(updatedPlaylistRun);

playlistRunToAdvance =
  updatedPlaylistRun;
}
}
  }

  setAttemptStartedAt(null);
} else if (
  isQuit &&
  out.decision.kind === "ALLOW" &&
  attemptStartedAt !== null
) {
  if (activeProfile !== null) {
    const attemptRecord = createScenarioAttemptRecord(
      state,
      {
        profileId: activeProfile.profileId,
        startedAt: attemptStartedAt,
        endedAt: commandTime,
        endReason: "quit",
      }
    );

    if (attemptRecord !== null) {
  const updatedHistory =
    appendAttemptRecord(attemptRecord);

  const ownedHistory =
    updatedHistory.filter(
      (attempt) =>
        attempt.profileId ===
        activeProfile.profileId
    );

  setProfileHistory(ownedHistory);

  if (
    activePlaylistRun !== null &&
    activePlaylistRun.status === "running"
  ) {
    abandonPlaylistRun(
      attemptRecord.attemptId
    );
  }
}
  }

  setAttemptStartedAt(null);
} else if (
  isRestart &&
  out.decision.kind === "ALLOW"
) {
  if (
    attemptStartedAt !== null &&
    activeProfile !== null
  ) {
    const attemptRecord = createScenarioAttemptRecord(
      state,
      {
        profileId: activeProfile.profileId,
        startedAt: attemptStartedAt,
        endedAt: commandTime,
        endReason: "restart",
      }
    );

    if (attemptRecord !== null) {
  const updatedHistory =
    appendAttemptRecord(attemptRecord);

  const ownedHistory =
    updatedHistory.filter(
      (attempt) =>
        attempt.profileId ===
        activeProfile.profileId
    );

  setProfileHistory(ownedHistory);

if (
  activePlaylistRun !== null &&
  activePlaylistRun.status === "running"
) {
  const updatedPlaylistRun =
    attachAttemptToPlaylistRun(
      activePlaylistRun,
      attemptRecord.attemptId
    );

  persistPlaylistRun(updatedPlaylistRun);
  setActivePlaylistRun(updatedPlaylistRun);
}
}
  }

  if (out.state.attempt !== null) {
    setAttemptStartedAt(commandTime);
  } else {
    setAttemptStartedAt(null);
  }
} else if (
  isStart &&
  out.decision.kind === "ALLOW" &&
  out.state.attempt !== null
) {
  setAttemptStartedAt(commandTime);
}

if (playlistRunToAdvance !== null) {
  setInput("");
  advancePlaylistRun(
    playlistRunToAdvance
  );
  return;
}

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
      const selectedScenario = scenarioTree
  .flatMap((scenarioType) => scenarioType.branches)
  .flatMap((branch) => branch.scenarios)
  .find((scenario) => scenario.selectCommand === lower);

if (isStart || isQuit || isRestart) {
  setScenarioValidationReport(null);
}

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

const isScorecard = out.state.executionState === "SCORECARD";

if (isScorecard) {

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

function runCurrentScenarioValidation() {
  if (!previewScenarioDetails) {
    return;
  }

  const scenarioId = previewScenarioDetails.id;
  const selectCommand = previewScenarioDetails.selectCommand;

  if (
    !isValidScenarioId(scenarioId) ||
    !selectCommand
  ) {
    return;
  }

  const report = runScenarioValidation(
    scenarioId,
    selectCommand
  );

  setScenarioValidationReport(report);
}

const showState3Preview =
  state.executionState === "LOBBY" &&
  !showSelector &&
  previewScenarioDetails !== undefined;

  const isMobile = window.innerWidth <= 768;

const STATE3_TEXT = {
  heading: isMobile ? "16px" : "20px",
  body: isMobile ? "12px" : "16px",
  meta: isMobile ? "11px" : "13px",
  lineHeight: isMobile ? 1.35 : 1.6,
};

const STATE3_DIVIDER = {
  borderColor: COLORS.border,
  margin: isMobile ? "16px 0" : "22px 0",
};

const STATE4_TEXT = {
  title: isMobile ? "18px" : TEXT.title,
  section: isMobile ? "16px" : TEXT.section,
  body: isMobile ? "13px" : TEXT.body,
  detail: isMobile ? "12px" : TEXT.detail,
  lineHeight: isMobile ? 1.45 : 1.6,
};

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
    minHeight: "72px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: "12px",
    padding: "12px 16px",
    boxSizing: "border-box",
    borderBottom: "1px solid #2a2a2a",
    background: "#0b0f14",
    flexWrap: "wrap",
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
    gap: "8px",
    flexWrap: "wrap",
    justifyContent: "flex-end",
  }}
>
  <button
  type="button"
  onClick={() => {
    setFeedbackSubmitted(false);
    setShowFeedback(true);
  }}
  style={{
    fontFamily: "monospace",
    fontSize: "12px",
    color: "#d7dde6",
    background: "transparent",
    border: "1px solid #2a2a2a",
    borderRadius: "999px",
    padding: "7px 10px",
    cursor: "pointer",
  }}
>
  Suggestion / Feedback
</button>

{state.executionState !== "RUNNING" &&
  ["Profile"].map((item) => (
          <button
            key={item}
            type="button"
            onClick={() => {
            if (item === "Profile") {
              setAppView("profile");
            }
          }}
              style={{
                fontFamily: "monospace",
                fontSize: "12px",
                color: "#d7dde6",
                background: "transparent",
                border: "1px solid #2a2a2a",
                borderRadius: "999px",
                padding: "7px 10px",
                cursor: "pointer",
              }}
            >
              {item}
            </button>
          ))}
            </nav>
</header>

{showFeedback && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 300,
      display: "grid",
      placeItems: "center",
      padding: "20px",
      background: "rgba(0, 0, 0, 0.68)",
    }}
  >
    <div
      style={{
        ...CARD.base,
        width: "100%",
        maxWidth: "520px",
        padding: SPACE.lg,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: SPACE.md,
          marginBottom: SPACE.md,
        }}
      >
        <h2
          style={{
            margin: 0,
            color: COLORS.text,
            fontSize: TEXT.section,
          }}
        >
          Suggestion / Feedback
        </h2>

        <button
          type="button"
          onClick={() => setShowFeedback(false)}
          style={BUTTON.secondary}
        >
          Close
        </button>
      </div>

      <div
  style={{
    display: "grid",
    gap: SPACE.md,
  }}
>
  <p
    style={{
      margin: 0,
      color: COLORS.body,
      fontSize: TEXT.body,
      lineHeight: 1.6,
    }}
  >
    Have an idea or something we could improve? Let us know.
  </p>

  <label
    style={{
      display: "grid",
      gap: SPACE.xs,
      color: COLORS.body,
      fontSize: TEXT.detail,
    }}
  >
    Type

    <select
  value={feedbackType}
  onChange={(event) =>
    setFeedbackType(
      event.target.value as "suggestion" | "feedback"
    )
  }
  style={{
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 12px",
    color: COLORS.text,
    background: COLORS.panelSoft,
    border: `1px solid ${COLORS.border}`,
    borderRadius: RADIUS.button,
  }}
>
      <option value="suggestion">
        Suggestion
      </option>
      <option value="feedback">
        Feedback
      </option>
    </select>
  </label>

  <label
    style={{
      display: "grid",
      gap: SPACE.xs,
      color: COLORS.body,
      fontSize: TEXT.detail,
    }}
  >
    Message

    <textarea
  rows={6}
  value={feedbackMessage}
  onChange={(event) =>
    setFeedbackMessage(event.target.value)
  }
  placeholder="Tell us what you think..."
      style={{
        width: "100%",
        boxSizing: "border-box",
        resize: "vertical",
        padding: "10px 12px",
        fontFamily: "inherit",
        color: COLORS.text,
        background: COLORS.panelSoft,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.button,
      }}
    />
  </label>

  {feedbackSubmitted ? (
  <div
    style={{
      padding: SPACE.md,
      textAlign: "center",
      color: COLORS.text,
      border: `1px solid ${COLORS.border}`,
      borderRadius: RADIUS.button,
    }}
  >
    Thanks for your feedback.
  </div>
) : (
  <button
    type="button"
    disabled={!feedbackMessage.trim()}
    onClick={() => {
      if (!feedbackMessage.trim()) {
        return;
      }

      setFeedbackSubmitted(true);
      setFeedbackMessage("");
    }}
    style={{
      ...BUTTON.primary,
      width: "100%",
      opacity: feedbackMessage.trim() ? 1 : 0.5,
      cursor: feedbackMessage.trim()
        ? "pointer"
        : "not-allowed",
    }}
  >
    Submit Feedback
  </button>
)}
</div>
    </div>
  </div>
)}

{appView === "profile" && (
  <ProfilePage
    activeProfile={activeProfile}
    metrics={profileMetrics}
    history={profileHistory}
    playlists={savedPlaylists}
    onCreateProfile={() => setAppView("create_profile")}
    onOpenHistory={() => setAppView("history")}
    onOpenPlaylists={() => setAppView("playlists")}
    onBackToSimulator={() => setAppView("simulator")}
    onSignIn={(profile) => {
  saveActiveProfile(profile);
  setActiveProfile(profile);

  setProfileHistory(
    loadAttemptHistoryForProfile(profile.profileId)
  );

  setSavedPlaylists(
    loadSavedPlaylistsForProfile(profile.profileId)
  );

  setPlaylistRuns(
    loadPlaylistRunsForProfile(profile.profileId)
  );

  setActivePlaylistRun(null);
  setAppView("profile");
}}
    onSignOut={() => {
      clearActiveProfile();

      setActiveProfile(null);
      setProfileHistory([]);
      setSavedPlaylists([]);
      setPlaylistRuns([]);
      setActivePlaylistRun(null);

      setAppView("profile");
    }}
  />
)}

{appView === "playlists" && (
  <PlaylistsPage
    playlists={savedPlaylists}
    onRunPlaylist={(playlistId) => {
      const playlist =
        savedPlaylists.find(
          (item) =>
            item.playlistId === playlistId
        );

      if (!playlist) {
        return;
      }

      startPlaylistRun(playlist);
    }}
    onCreatePlaylist={() => {
  setSelectedPlaylistId(null);
  setPlaylistScenarioId(null);
  setAppView("playlist_editor");
}}
    onOpenPlaylist={(playlistId) => {
      setSelectedPlaylistId(playlistId);
      setAppView("playlist_editor");
    }}
    onBackToProfile={() =>
      setAppView("profile")
    }
  />
)}

{appView === "playlist_editor" && (
  <PlaylistEditorPage
  playlist={selectedPlaylist}
  onRemoveScenario={(scenarioId) => {
  if (
    activeProfile === null ||
    selectedPlaylist === null
  ) {
    return;
  }

  const updatedPlaylists =
    removeScenarioFromSavedPlaylist(
      selectedPlaylist.playlistId,
      scenarioId
    );

  const ownedPlaylists =
    updatedPlaylists.filter(
      (playlist) =>
        playlist.profileId ===
        activeProfile.profileId
    );

  setSavedPlaylists(ownedPlaylists);
}}
    onMoveScenario={(scenarioId, direction) => {
      if (
        activeProfile === null ||
        selectedPlaylist === null
      ) {
        return;
      }

      const updatedPlaylists =
        moveScenarioInSavedPlaylist(
          selectedPlaylist.playlistId,
          scenarioId,
          direction
        );

      const ownedPlaylists =
        updatedPlaylists.filter(
          (playlist) =>
            playlist.profileId ===
            activeProfile.profileId
        );

      setSavedPlaylists(ownedPlaylists);
    }}

    onAddScenario={() => {
  if (selectedPlaylist === null) {
    return;
  }

  const defaultScenarioType =
    scenarioTree.find(
      (scenarioType) =>
        scenarioType.enabled
    );

  setPlaylistAddTargetId(
    selectedPlaylist.playlistId
  );

  setAppView("simulator");
  setShowSelector(true);

  setOpenScenarioTypeId(
    defaultScenarioType?.typeId ?? null
  );

  setOpenBranchId(
    defaultScenarioType?.branches[0]?.tierId ??
      null
  );

  setLog([
    "Choose a scenario to add to the playlist",
  ]);
}}

    onSave={(name) => {
  if (activeProfile === null) {
    return;
  }

  if (selectedPlaylist !== null) {
    const updatedPlaylist =
      updateSavedPlaylist(
        selectedPlaylist,
        {
          name,
          scenarioIds:
            selectedPlaylist.scenarioIds,
        }
      );

    const updatedPlaylists =
      replaceSavedPlaylist(
        updatedPlaylist
      );

    const ownedPlaylists =
      updatedPlaylists.filter(
        (item) =>
          item.profileId ===
          activeProfile.profileId
      );

    setSavedPlaylists(ownedPlaylists);
    setSelectedPlaylistId(null);
    setPlaylistScenarioId(null);
    setAppView("playlists");
    return;
  }

  const playlist =
    createSavedPlaylist({
      profileId:
        activeProfile.profileId,
      name,
      scenarioIds:
        playlistScenarioId === null
          ? []
          : [playlistScenarioId],
    });

  const updatedPlaylists =
    appendSavedPlaylist(playlist);

  const ownedPlaylists =
    updatedPlaylists.filter(
      (item) =>
        item.profileId ===
        activeProfile.profileId
    );

    setSavedPlaylists(ownedPlaylists);
  setPlaylistScenarioId(null);
  setAppView("playlists");
}}

onBackToPlaylists={() => {
  setSelectedPlaylistId(null);
  setPlaylistScenarioId(null);
  setPlaylistAddTargetId(null);
  setAppView("playlists");
}}
/>
)}

{appView === "playlist_run_summary" &&
  activePlaylistRun !== null && (
    <PlaylistRunSummaryPage
      run={activePlaylistRun}
      attempts={profileHistory}
      onBackToPlaylists={() => {
        setActivePlaylistRun(null);
        setAppView("playlists");
      }}
    />
)}

{appView === "history" && (
  <HistoryPage
    history={profileHistory}
    playlistRuns={playlistRuns}
    onOpenAttempt={(attemptId) => {
      setSelectedAttemptId(attemptId);
      setAppView("attempt_detail");
    }}
    onOpenPlaylistRun={(playlistRunId) => {
      setSelectedPlaylistRunId(
        playlistRunId
      );
      setAppView(
        "playlist_run_detail"
      );
    }}
    onBackToProfile={() =>
      setAppView("profile")
    }
  />
)}

{appView === "playlist_run_detail" &&
  selectedPlaylistRun !== null && (
    <PlaylistRunDetailPage
      run={selectedPlaylistRun}
      attempts={profileHistory}
      onOpenAttempt={(attemptId) => {
        setSelectedAttemptId(attemptId);
        setAppView("attempt_detail");
      }}
      onBackToHistory={() => {
        setSelectedPlaylistRunId(null);
        setAppView("history");
      }}
    />
)}

{appView === "attempt_detail" &&
  selectedAttempt !== null && (
    <AttemptDetailPage
      attempt={selectedAttempt}
      onBackToHistory={() =>
        setAppView("history")
      }
    />
)}

{appView === "create_profile" && (
  <CreateProfilePage
    onBack={() => setAppView("profile")}
    onCreate={(profile) => {
      saveActiveProfile(profile);
      setActiveProfile(profile);
      setAppView("profile");
    }}
  />
)}

      {appView === "simulator" && (
        <>
        {playlistScenario !== null && (
  <div
    style={{
      position: "fixed",
      inset: 0,
      zIndex: 200,
      display: "grid",
      placeItems: "center",
      padding: "20px",
      background: "rgba(0, 0, 0, 0.68)",
    }}
  >
    <PlaylistChooser
  scenarioId={playlistScenario.id}
  scenarioLabel={playlistScenario.label}
  playlists={savedPlaylists}
      onChoosePlaylist={(playlistId) => {
        if (activeProfile === null) {
          return;
        }

        const updatedPlaylists =
          addScenarioToSavedPlaylist(
            playlistId,
            playlistScenario.id
          );

        const ownedPlaylists =
          updatedPlaylists.filter(
            (playlist) =>
              playlist.profileId ===
              activeProfile.profileId
          );

        setSavedPlaylists(ownedPlaylists);
        setPlaylistScenarioId(null);
      }}
      onCreateNewPlaylist={() => {
  setSelectedPlaylistId(null);
  setAppView("playlist_editor");
}}
      onClose={() => {
        setPlaylistScenarioId(null);
      }}
    />
  </div>
)}
      {/* ===== STATE BANNER (Box 2) ===== */}
      {state.executionState === "LOBBY" &&
      state.scenario === null &&
      state.previewScenario === null &&
      !showSelector && (
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
              Welcome
            </h1>

            <p
              style={{
                margin: "12px 0 0",
                color: "#cdd8d2",
                fontSize: "15px",
                lineHeight: 1.6,
              }}
            >
                Choose your training mode to begin.
                <br />
                Practice or Assessment—your choice.            </p>
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
                  display: "block",
                  padding: "18px",
                  textAlign: "center",
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
<div>
  <strong
    style={{
      display: "block",
      color: "#a78bfa",
      fontSize: "17px",
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
</div>
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
                    display: "block",
                    padding: "18px",
                    textAlign: "center",
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
<div>
  <strong
    style={{
      display: "block",
      color: "#93c5fd",
      fontSize: "17px",
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
</div>
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
setShowMobileProcedureHelp(false);
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
    padding: window.innerWidth <= 768 ? "18px 12px" : "28px 32px",
    background: "transparent",
  }}
>
<div
  style={{
    display: "flex",
    flexDirection: "column",
    alignItems:
      window.innerWidth <= 768 ? "center" : "flex-start",
    textAlign:
      window.innerWidth <= 768 ? "center" : "left",
    gap: "14px",
    marginBottom: "24px",
    width: window.innerWidth <= 768 ? "calc(100vw - 40px)" : "auto",
    marginLeft: window.innerWidth <= 768 ? "-32px" : 0,
    position: "relative",
    zIndex: 1,
    background: COLORS.appBg,
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
    alignSelf: "center",
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

<div
  style={{
    marginBottom: "18px",
    textAlign:
      window.innerWidth <= 768 ? "center" : "left",
  }}
>
  <h2
    style={{
      margin: "0 0 6px",
      color: "#f5f7fb",
      fontSize: "24px",
      lineHeight: 1.2,
    }}
  >
    Select a Scenario
  </h2>

  <p
    style={{
      margin: "0 0 18px",
      color: "#9aa4b2",
      fontSize: "14px",
      lineHeight: 1.6,
    }}
  >
    Browse the training library and choose a scenario.
  </p>

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
    gridTemplateColumns:
      window.innerWidth <= 768 ? "220px 1fr" : "280px 1fr",
    gap: window.innerWidth <= 768 ? "12px" : "24px",
    alignItems: "start",
  }}
>
            <div
style={{
  minHeight: "320px",
  padding: window.innerWidth <= 768 ? "0" : "16px",
  border:
    window.innerWidth <= 768 ? "none" : "1px solid #2a2a2a",
  borderRadius: window.innerWidth <= 768 ? 0 : "10px",
  background:
    window.innerWidth <= 768
      ? "transparent"
      : "rgba(255, 255, 255, 0.03)",
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
  padding: window.innerWidth <= 768 ? "0" : "16px",
  border:
    window.innerWidth <= 768 ? "none" : "1px solid #2a2a2a",
  borderRadius: window.innerWidth <= 768 ? 0 : "10px",
  background:
    window.innerWidth <= 768
      ? "transparent"
      : "rgba(255, 255, 255, 0.02)",
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
  <div
    key={scenario.id}
    style={{
      display: "flex",
      alignItems: "stretch",
      gap: "8px",
      marginBottom: SPACE.sm,
    }}
  >
    <button
      type="button"
      onClick={() => {
  if (
    playlistAddTargetId !== null &&
    activeProfile !== null
  ) {
    const updatedPlaylists =
      addScenarioToSavedPlaylist(
        playlistAddTargetId,
        scenario.id
      );

    const ownedPlaylists =
      updatedPlaylists.filter(
        (playlist) =>
          playlist.profileId ===
          activeProfile.profileId
      );

    setSavedPlaylists(ownedPlaylists);

    setPlaylistAddTargetId(null);
    setShowSelector(false);
    setOpenScenarioTypeId(null);
    setOpenBranchId(null);
    setLog([]);

    setAppView("playlist_editor");
    return;
  }

  const command = scenario.selectCommand;

  if (!command) return;

  const out = handleInput(state, command);

  setState(out.state);
  setLog(
    buildLogBlock(
      buildScenarioPreview(scenario, mode)
    )
  );
  setScenarioValidationReport(null);
  setShowSelector(false);
  setOpenScenarioTypeId(null);
  setOpenBranchId(null);
}}
      style={{
        flex: 1,
        display: "block",
        textAlign: "left",
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

    {activeProfile !== null &&
  playlistAddTargetId === null && (
      <button
        type="button"
        title="Save to playlist"
        aria-label={`Save ${scenario.label} to playlist`}
        onClick={() => {
          setPlaylistScenarioId(scenario.id);
        }}
        style={{
          width: "44px",
          flex: "0 0 44px",
          display: "grid",
          placeItems: "center",
          fontFamily: "monospace",
          fontSize: "22px",
          fontWeight: 700,
          color: "#a78bfa",
          background: "rgba(109, 74, 255, 0.08)",
          border: "1px solid #2a2a2a",
          borderRadius: "10px",
          cursor: "pointer",
        }}
      >
        +
      </button>
    )}
  </div>
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
    border: isMobile ? "none" : "1px solid #6d4aff",
    borderRadius: isMobile ? 0 : "12px",
    background: isMobile ? "transparent" : "rgba(109, 74, 255, 0.04)",
  }}
>

    <div style={{ marginBottom: "22px" }}>
      <h2
        style={{
          margin: "0 0 6px",
          color: "#f5f7fb",
          fontSize: "24px",
          lineHeight: 1.2,
        }}
      >
        Scenario Preview
      </h2>

      <p
        style={{
          margin: 0,
          color: "#9aa4b2",
          fontSize: "14px",
          lineHeight: 1.6,
        }}
      >
        Review the scenario before starting your simulation.
      </p>
    </div>

    <button
      type="button"
      onClick={() => {
  const defaultScenarioType = scenarioTree.find(
    (scenarioType) => scenarioType.enabled
  );

  setScenarioValidationReport(null);
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
  gridTemplateColumns: isMobile ? "40% 60%" : "1fr 1fr",
  gap: isMobile ? "8px" : "18px",
  marginBottom: "18px",
  width: isMobile ? "calc(100vw - 24px)" : "auto",
  marginLeft: isMobile ? "-24px" : 0,
}}
>
<div
style={{
  padding: isMobile ? "10px" : "22px",
  border: "1px solid #2a2a2a",
  borderRadius: "12px",
  background: "rgba(255, 255, 255, 0.03)",
}}
>
<h3
  style={{
    marginTop: 0,
    color: COLORS.text,
    fontSize: STATE3_TEXT.heading,
    lineHeight: 1.2,
  }}
>
  Skill Focus:
</h3>

              {previewScenarioDetails.skillFocus.map((skill) => (
<div
  key={skill}
  style={{
    marginBottom: "8px",
    color: COLORS.body,
    fontSize: STATE3_TEXT.body,
    lineHeight: STATE3_TEXT.lineHeight,
    whiteSpace: "pre-line",
    overflowWrap: "break-word",
  }}
>
  ✓ {skill}
</div>
              ))}

              <hr style={STATE3_DIVIDER} />

<h3
  style={{
    marginTop: 0,
    color: COLORS.text,
    fontSize: STATE3_TEXT.heading,
    lineHeight: 1.2,
  }}
>
  Scenario Context:
</h3>
<p
  style={{
    color: COLORS.body,
    fontSize: STATE3_TEXT.body,
    lineHeight: STATE3_TEXT.lineHeight,
  }}
>
  {previewScenarioDetails.scenarioContext}
</p>

              <hr style={STATE3_DIVIDER} />

<h3
  style={{
    marginTop: 0,
    color: COLORS.text,
    fontSize: STATE3_TEXT.heading,
    lineHeight: 1.2,
  }}
>
  Success Outcome:
</h3>
<p
  style={{
    color: COLORS.body,
    fontSize: STATE3_TEXT.body,
    lineHeight: STATE3_TEXT.lineHeight,
  }}
>
  {previewScenarioDetails.successOutcome}
</p>
            </div>

<div
style={{
  padding: isMobile ? "10px" : "22px",
  border: "1px solid #2a2a2a",
  borderRadius: "12px",
  background: "rgba(255, 255, 255, 0.03)",
}}
>
<h3
  style={{
    marginTop: 0,
    color: COLORS.text,
    fontSize: STATE3_TEXT.heading,
    lineHeight: 1.2,
  }}
>
  Expected procedure:
</h3>

              {mode === "practice" ? (
                previewScenarioDetails.previewSteps.map((step, index) => (
                  <div
                    key={step}
style={{
  display: "flex",
  gap: window.innerWidth <= 768 ? "8px" : "14px",
  padding: window.innerWidth <= 768 ? "10px 0" : "14px 0",
  borderBottom: "1px solid #2a2a2a",
  color: COLORS.body,
  fontSize: STATE3_TEXT.body,
  lineHeight: STATE3_TEXT.lineHeight,
}}
                  >
                    <strong style={{ color: "#a78bfa" }}>{index + 1}</strong>
                    <span>{getPreviewStepLabel(step)}</span>
                  </div>
                ))
              ) : (
<p
  style={{
    color: COLORS.muted,
    fontSize: STATE3_TEXT.body,
    lineHeight: STATE3_TEXT.lineHeight,
  }}
>
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
    flexDirection: isMobile ? "column" : "row",
    gap: "8px",
  }}
>
  <input
    ref={commandInputRef}
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
    type="button"
    onClick={runCurrentScenarioValidation}
    style={{
      fontFamily: "monospace",
      padding: "10px 16px",
      border: `1px solid ${COLORS.successDark}`,
      borderRadius: "8px",
      background: "rgba(22, 163, 74, 0.18)",
      color: COLORS.text,
      cursor: "pointer",
    }}
  >
    Run Combined Test
  </button>
</div>
{scenarioValidationReport && (
  <section
    style={{
      marginTop: "14px",
      padding: "16px",
      border:
        scenarioValidationReport.status === "PASS"
          ? `1px solid ${COLORS.successDark}`
          : "1px solid #b91c1c",
      borderRadius: RADIUS.card,
      background:
        scenarioValidationReport.status === "PASS"
          ? "rgba(22, 163, 74, 0.08)"
          : "rgba(185, 28, 28, 0.08)",
    }}
  >
    <h3
      style={{
        margin: `0 0 ${SPACE.md}`,
        color:
          scenarioValidationReport.status === "PASS"
            ? COLORS.success
            : "#f87171",
        fontSize: STATE3_TEXT.heading,
      }}
    >
      Combined Test: {scenarioValidationReport.status}
    </h3>

    {scenarioValidationReport.status === "PASS" ? (
      <div
        style={{
          color: COLORS.body,
          fontSize: STATE3_TEXT.body,
          lineHeight: STATE3_TEXT.lineHeight,
        }}
      >
        <div>
          <strong>Steps matched:</strong>{" "}
          {scenarioValidationReport.matchedSteps}/
          {scenarioValidationReport.totalSteps}
        </div>

        <div style={{ marginTop: SPACE.sm }}>
          <strong>Expected ALLOW:</strong>{" "}
          {scenarioValidationReport.expectedAllows}
        </div>

        <div style={{ marginTop: SPACE.sm }}>
          <strong>Expected DENY:</strong>{" "}
          {scenarioValidationReport.expectedDenies}
        </div>

        <div style={{ marginTop: SPACE.sm }}>
          <strong>Final completion:</strong>{" "}
          {scenarioValidationReport.finalCompletion ?? "None"}
        </div>

        <div style={{ marginTop: SPACE.sm }}>
          <strong>Final score:</strong>{" "}
          {scenarioValidationReport.finalScore === null
            ? "None"
            : `${scenarioValidationReport.finalScore}/10`}
        </div>
      </div>
    ) : (
      <div
        style={{
          color: COLORS.body,
          fontSize: STATE3_TEXT.body,
          lineHeight: STATE3_TEXT.lineHeight,
        }}
      >
        <div>
          <strong>Failed step:</strong>{" "}
          {scenarioValidationReport.failure?.stepNumber ?? "Unknown"}
        </div>

        <div style={{ marginTop: SPACE.sm }}>
          <strong>Phase:</strong>{" "}
          {scenarioValidationReport.failure?.phase ?? "Unknown"}
        </div>

        <div style={{ marginTop: SPACE.sm }}>
          <strong>Input:</strong>{" "}
          {scenarioValidationReport.failure?.input ?? "Unknown"}
        </div>

        <div style={{ marginTop: SPACE.sm }}>
          <strong>Expected:</strong>{" "}
          {scenarioValidationReport.failure?.expected ?? "Unknown"}
        </div>

        <div style={{ marginTop: SPACE.sm }}>
          <strong>Actual:</strong>{" "}
          {scenarioValidationReport.failure?.actual ?? "Unknown"}
        </div>
      </div>
    )}
  </section>
)}
                </section>
      )}
      {state.executionState === "RUNNING" &&
  isMobile &&
  showMobileProcedureHelp && (
    <section
      style={{
        ...CARD.base,
        marginBottom: SPACE.md,
        padding: SPACE.md,
      }}
    >
      <button
        type="button"
        onClick={() => {
          setShowMobileProcedureHelp(false);
        }}
        style={{
          ...BUTTON.secondary,
          width: "100%",
          marginBottom: SPACE.md,
          border: `1px solid ${COLORS.practiceStrong}`,
          color: COLORS.practice,
        }}
      >
        ← Back to Scenario
      </button>

      <h3
        style={{
          margin: `0 0 ${SPACE.md}`,
          color: COLORS.text,
          fontSize: STATE4_TEXT.section,
          lineHeight: 1.25,
        }}
      >
        Procedure Help
      </h3>

      <div
        style={{
          padding: SPACE.md,
          border: `1px solid ${COLORS.border}`,
          borderRadius: RADIUS.button,
          background: COLORS.panelSoft,
          color: COLORS.body,
          fontSize: STATE4_TEXT.detail,
          lineHeight: STATE4_TEXT.lineHeight,
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
    </section>
  )}
{state.executionState === "RUNNING" &&
  !(isMobile && showMobileProcedureHelp) && (
<div
  style={{
    display: "block",
    marginBottom: isMobile ? SPACE.sm : SPACE.md,
  }}
>
<section
  style={{
    ...CARD.base,
    padding: isMobile ? SPACE.md : SPACE.lg,
  }}
>
<h2
  style={{
    margin: `0 0 ${SPACE.md}`,
    color: COLORS.text,
    fontSize: STATE4_TEXT.title,
    lineHeight: 1.25,
  }}
>
{activeScenarioId
  ? getScenarioLabel(activeScenarioId)
  : "Active Scenario"}{" "}
— {activeScenarioId
  ? getScenarioTypeDisplayLabel(activeScenarioId)
  : "Standard"}
</h2>

    <p
  style={{
    margin: "0 0 10px",
    color: COLORS.body,
    fontSize: STATE4_TEXT.body,
    lineHeight: STATE4_TEXT.lineHeight,
  }}
>
      <strong style={{ color: COLORS.assessmentStrong }}>Customer Issue:</strong>{" "}
      {previewScenarioDetails?.scenarioContext ?? "Customer issue is active."}
    </p>

        <p
  style={{
    margin: 0,
    color: COLORS.body,
    fontSize: STATE4_TEXT.body,
    lineHeight: STATE4_TEXT.lineHeight,
  }}
>
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
          setShowMobileProcedureHelp(false);
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

{state.executionState === "RUNNING" &&
  !(isMobile && showMobileProcedureHelp) && (
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
    fontSize: STATE4_TEXT.section,
    lineHeight: 1.25,
  }}
>
  Conversation
</h3>

<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : "1fr 280px",
    gap: isMobile ? SPACE.md : SPACE.lg,
    alignItems: "start",
  }}
>
<div
  ref={conversationRef}
  style={{
    maxHeight: isMobile ? "none" : "320px",
    overflowY: isMobile ? "visible" : "auto",
    paddingRight: isMobile ? 0 : SPACE.sm,
  }}
>
<div
  style={{
    whiteSpace: "pre-wrap",
    color: COLORS.body,
    fontSize: STATE4_TEXT.detail,
    lineHeight: STATE4_TEXT.lineHeight,
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
    borderLeft: isMobile ? "none" : `1px solid ${COLORS.border}`,
    borderTop: isMobile ? `1px solid ${COLORS.border}` : "none",
    paddingLeft: isMobile ? 0 : SPACE.lg,
    paddingTop: isMobile ? SPACE.md : 0,
  }}
>
<div
  style={{
    marginBottom: SPACE.sm,
    color: COLORS.text,
    fontSize: STATE4_TEXT.section,
    lineHeight: 1.25,
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
      fontSize: STATE4_TEXT.detail,
      lineHeight: STATE4_TEXT.lineHeight,
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
  if (isMobile) {
    setProcedureHelpPinned(true);
    setShowMobileProcedureHelp(true);
    return;
  }

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

        {procedureHelpOpen && !isMobile && (
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

{state.executionState === "RUNNING" &&
  !(isMobile && showMobileProcedureHelp) && (
<section
  style={{
    marginBottom: SPACE.md,
    padding: isMobile ? SPACE.md : SPACE.lg,
    border: `1px solid ${COLORS.successDark}`,
    borderRadius: RADIUS.card,
    background: "rgba(22, 101, 52, 0.08)",
  }}
>
<h3
  style={{
    margin: `0 0 ${SPACE.sm}`,
    color: COLORS.text,
    fontSize: STATE4_TEXT.section,
    lineHeight: 1.25,
  }}
>
  Current Decision
</h3>

<div
  style={{
    marginBottom: SPACE.md,
    color: COLORS.text,
    fontSize: STATE4_TEXT.section,
    lineHeight: 1.25,
    fontWeight: 700,
  }}
>
      {state.runLog.length === 0
        ? "What is your first troubleshooting step?"
        : "What’s your next step?"}
    </div>

    <div
  style={{
    display: "flex",
    flexDirection: isMobile ? "column" : "row",
    gap: SPACE.sm,
  }}
>
      <input
        ref={commandInputRef}
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
  width: isMobile ? "100%" : "auto",
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
    fontSize: STATE4_TEXT.detail,
    lineHeight: STATE4_TEXT.lineHeight,
  }}
>
  Type a procedure you believe is the best next step.
</div>
    </section>
)}
{state.executionState === "SCORECARD" && (
  <section
    style={{
      ...CARD.base,
      marginBottom: SPACE.md,
      padding: isMobile ? SPACE.md : SPACE.lg,
    }}
  >
    <h2
      style={{
        margin: `0 0 ${SPACE.md}`,
        color: COLORS.success,
        fontSize: STATE4_TEXT.title,
        lineHeight: 1.25,
      }}
    >
      Scenario Passed
    </h2>

    <div
      ref={conversationRef}
      style={{
        maxHeight: isMobile ? "none" : "420px",
        overflowY: isMobile ? "visible" : "auto",
        marginBottom: SPACE.lg,
        padding: SPACE.md,
        border: `1px solid ${COLORS.border}`,
        borderRadius: RADIUS.button,
        background: COLORS.panelSoft,
      }}
    >
      <div
        style={{
          whiteSpace: "pre-wrap",
          color: COLORS.body,
          fontSize: STATE4_TEXT.detail,
          lineHeight: STATE4_TEXT.lineHeight,
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

    <button
      type="button"
      onClick={() => {
        const out = handleInput(state, "view_scorecard");

        setState(out.state);
        setProcedureHelpPinned(false);
        setShowMobileProcedureHelp(false);
      }}
      style={{
        ...BUTTON.primary,
        width: isMobile ? "100%" : "auto",
      }}
    >
      Go to Scorecard
    </button>
  </section>
)}
{state.executionState === "COMPLETED" && (
<section
  style={{
    ...CARD.base,
    marginBottom: SPACE.lg,
    padding: isMobile ? SPACE.lg : SPACE.xl,
  }}
>
<div
  style={{
    display: "grid",
    gridTemplateColumns: isMobile ? "1fr" : LAYOUT.completedHero,
    gap: isMobile ? SPACE.lg : SPACE.xl,
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
{activeScenarioId
  ? getScenarioLabel(activeScenarioId)
  : "Completed Scenario"}
{" — "}
{activeScenarioId
  ? getScenarioTypeDisplayLabel(activeScenarioId)
  : "Standard"}
</div>
      </div>

<div
  style={{
    borderLeft: isMobile ? "none" : `1px solid ${COLORS.border}`,
    borderTop: isMobile ? `1px solid ${COLORS.border}` : "none",
    paddingLeft: isMobile ? 0 : SPACE.xl,
    paddingTop: isMobile ? SPACE.lg : 0,
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
    gridTemplateColumns: isMobile ? "1fr" : LAYOUT.completedSummaryCards,
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
    padding: isMobile ? SPACE.md : SPACE.lg,
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

  </div>
</section>

<section
  style={{
    ...CARD.base,
    marginBottom: SPACE.md,
    padding: isMobile ? SPACE.md : SPACE.lg,
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
    flexDirection: "row",
    gap: "12px",
    padding: isMobile ? SPACE.md : "18px",
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
          setShowMobileProcedureHelp(false);
        }}
          style={BUTTON.secondary}
      >
        Retry Scenario
      </button>

      <button
  type="button"
  onClick={() => {
    if (
      activePlaylistRun !== null &&
      activePlaylistRun.status === "running"
    ) {
      abandonPlaylistRun();
    }

    const out = handleInput(state, "quit");

    setState(out.state);
    setLog([]);
    setShowSelector(false);
    setOpenScenarioTypeId(null);
    setOpenBranchId(null);
    setProcedureHelpPinned(false);
    setShowMobileProcedureHelp(false);
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
    {scoringOutput}
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

        </>
      )}

  </div>
);
}