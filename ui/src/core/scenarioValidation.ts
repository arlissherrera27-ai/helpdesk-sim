// scenarioValidation.ts
// Automatically validates a scenario from its registered procedure path.
//
// The validator:
// - creates an isolated simulator state
// - selects and starts the requested scenario
// - runs every registered procedure in order
// - immediately repeats every non-final procedure and expects DENY
// - proves expected DENYs do not mutate scenario facts
// - expects the final procedure to complete the scenario and reach SCORECARD
//
// No UI.
// No scenario-specific test backfilling.
// No direct scenario fact mutation.

import { handleInput } from "./engine";
import { initialState } from "./state";
import type { Decision, SimState } from "./types";
import type { ScenarioId } from "./scenarios";
import {
  getScenarioInvestigationRelatedCommands,
  getScenarioProcedureCommands,
} from "./scenarioRegistry";

type ExpectedDecision = Decision["kind"];

export type ScenarioValidationTranscriptEntry = {
  stepNumber: number;
  input: string;
  phase:
    | "setup"
    | "correct"
    | "wrong-order"
    | "related"
    | "security"
    | "repeat"
    | "deny"
    | "completion"
    | "takeover";
  decision: ExpectedDecision;
  message: string;
};

export type ScenarioValidationStepResult = {
  stepNumber: number;
  input: string;
  phase: "correct" | "repeat" | "wrong-order";
  expectedDecision: ExpectedDecision;
  actualDecision: ExpectedDecision;
  matched: boolean;
  statePreserved: boolean | null;
};

export type ScenarioValidationFailure = {
  stepNumber: number;
  input: string;
  phase:
    | "setup"
    | "correct"
    | "repeat"
    | "wrong-order"
    | "related"
    | "security"
    | "deny"
    | "takeover"
    | "completion";
  expected: string;
  actual: string;
};

export type ScenarioValidationReport = {
  status: "PASS" | "FAIL";
  scenarioId: ScenarioId;
  totalSteps: number;
  matchedSteps: number;
  expectedAllows: number;
  expectedDenies: number;
  finalCompletion: "PASS" | "FAIL" | null;
  finalScore: number | null;
  failure: ScenarioValidationFailure | null;
  steps: ScenarioValidationStepResult[];
  transcript: ScenarioValidationTranscriptEntry[];
};

export type InvestigationValidationReport = {
  status: "PASS" | "FAIL";
  scenarioId: ScenarioId;

  procedureCommandCount: number;
  procedureCommandsPassed: number;

  relatedCommandCount: number;
  relatedCommandsPassed: number;
  relatedPreservedProgress: boolean;
  relatedAddedMistake: boolean;

  repeatChecks: number;
  repeatChecksPassed: number;

  passPathReached: boolean;
  passCompletion: "PASS" | "FAIL" | null;
  passScore: number | null;
  passMistakes: number | null;

  denyCount: number;
  takeoverReached: boolean;
  failPathReached: boolean;
  failCompletion: "PASS" | "FAIL" | null;
  failScore: number | null;
  failMistakes: number | null;

  ticketCreated: boolean;
  failure: ScenarioValidationFailure | null;
  transcript: ScenarioValidationTranscriptEntry[];
};

function getScenarioFactsSnapshot(state: SimState): string {
  return JSON.stringify(state.scenarioFacts);
}

function getFinalCompletion(
  state: SimState
): "PASS" | "FAIL" | null {
  return state.result?.completion ?? null;
}

function buildFailureReport(
  scenarioId: ScenarioId,
  steps: ScenarioValidationStepResult[],
  failure: ScenarioValidationFailure,
  state: SimState,
  transcript: ScenarioValidationTranscriptEntry[]
): ScenarioValidationReport {
  return {
    status: "FAIL",
    scenarioId,
    totalSteps: steps.length,
    matchedSteps: steps.filter((step) => step.matched).length,
    expectedAllows: steps.filter(
      (step) => step.expectedDecision === "ALLOW"
    ).length,
    expectedDenies: steps.filter(
      (step) => step.expectedDecision === "DENY"
    ).length,
    finalCompletion: getFinalCompletion(state),
    finalScore: state.result?.totalScore ?? null,
    failure,
    steps,
    transcript,
  };
}

export function runScenarioValidation(
  scenarioId: ScenarioId,
  selectCommand: string
): ScenarioValidationReport {
  const procedureCommands =
    getScenarioProcedureCommands(scenarioId);

  let testState: SimState = {
    ...initialState(),
    mode: "practice",
    assessmentIntegrity: "maintained",
  };

  const steps: ScenarioValidationStepResult[] = [];

  const transcript: ScenarioValidationTranscriptEntry[] = [];

  // SETUP 1:
  // Use the same scenario-selection command used by the real UI.
  const selected = handleInput(testState, selectCommand);

  transcript.push({
  stepNumber: 0,
  input: selectCommand,
  phase: "setup",
  decision: selected.decision.kind,
  message: selected.message || "",
});

  if (
  selected.decision.kind !== "ALLOW" ||
  selected.state.previewScenario !== scenarioId
) {
  return buildFailureReport(
    scenarioId,
    steps,
    {
      stepNumber: 0,
      input: selectCommand,
      phase: "setup",
      expected:
        `ALLOW and previewScenario ${scenarioId}`,
      actual:
        `${selected.decision.kind} and previewScenario ` +
        `${selected.state.previewScenario ?? "null"}`,
    },
selected.state,
transcript
);
}

  testState = selected.state;

  // SETUP 2:
  // Start the selected scenario through the real engine.
  const started = handleInput(testState, "start");

  transcript.push({
  stepNumber: 0,
  input: "start",
  phase: "setup",
  decision: started.decision.kind,
  message: started.message || "",
});

  if (
  started.decision.kind !== "ALLOW" ||
  started.state.executionState !== "RUNNING" ||
  started.state.scenario !== scenarioId
) {
  return buildFailureReport(
    scenarioId,
    steps,
    {
      stepNumber: 0,
      input: "start",
      phase: "setup",
      expected:
        `ALLOW, RUNNING, and scenario ${scenarioId}`,
      actual:
        `${started.decision.kind}, ` +
        `${started.state.executionState}, and scenario ` +
        `${started.state.scenario ?? "null"}`,
    },
started.state,
transcript
);
}

  testState = started.state;

  for (
    let procedureIndex = 0;
    procedureIndex < procedureCommands.length;
    procedureIndex += 1
  ) {
    const command = procedureCommands[procedureIndex];

    // CORRECT STEP:
    // Every registered procedure must ALLOW in registered order.
    const correctOutput = handleInput(testState, command);

    transcript.push({
  stepNumber: steps.length + 1,
  input: command,
  phase: "correct",
  decision: correctOutput.decision.kind,
  message: correctOutput.message || "",
});

    const correctStep: ScenarioValidationStepResult = {
      stepNumber: steps.length + 1,
      input: command,
      phase: "correct",
      expectedDecision: "ALLOW",
      actualDecision: correctOutput.decision.kind,
      matched: correctOutput.decision.kind === "ALLOW",
      statePreserved: null,
    };

    steps.push(correctStep);

    if (!correctStep.matched) {
      return buildFailureReport(
        scenarioId,
        steps,
        {
          stepNumber: correctStep.stepNumber,
          input: command,
          phase: "correct",
          expected: "ALLOW",
          actual: correctOutput.decision.kind,
        },
correctOutput.state,
transcript
);
    }

    testState = correctOutput.state;
  }

  // Preserve the clean Golden Path result.
const goldenState = testState;

// NEGATIVE TESTS:
// Each repeated command runs in a fresh Practice attempt.
for (
  let repeatIndex = 0;
  repeatIndex < procedureCommands.length - 1;
  repeatIndex += 1
) {
  let repeatState: SimState = {
    ...initialState(),
    mode: "practice",
    assessmentIntegrity: "maintained",
  };

  const selected = handleInput(repeatState, selectCommand);

  if (
    selected.decision.kind !== "ALLOW" ||
    selected.state.previewScenario !== scenarioId
  ) {
    return buildFailureReport(
      scenarioId,
      steps,
      {
        stepNumber: steps.length + 1,
        input: selectCommand,
        phase: "setup",
        expected: `ALLOW and previewScenario ${scenarioId}`,
        actual: `${selected.decision.kind} and previewScenario ${
          selected.state.previewScenario ?? "null"
        }`,
      },
      selected.state,
      transcript
    );
  }

  repeatState = selected.state;

  const started = handleInput(repeatState, "start");

  if (
    started.decision.kind !== "ALLOW" ||
    started.state.executionState !== "RUNNING" ||
    started.state.scenario !== scenarioId
  ) {
    return buildFailureReport(
      scenarioId,
      steps,
      {
        stepNumber: steps.length + 1,
        input: "start",
        phase: "setup",
        expected: `ALLOW, RUNNING, and scenario ${scenarioId}`,
        actual: `${started.decision.kind}, ${
          started.state.executionState
        }, scenario ${started.state.scenario ?? "null"}`,
      },
      started.state,
      transcript
    );
  }

  repeatState = started.state;

  // Reproduce the valid procedures up to the target.
  for (let i = 0; i <= repeatIndex; i += 1) {
    const command = procedureCommands[i];
    const output = handleInput(repeatState, command);

    if (output.decision.kind !== "ALLOW") {
      return buildFailureReport(
        scenarioId,
        steps,
        {
          stepNumber: steps.length + 1,
          input: command,
          phase: "correct",
          expected: "ALLOW during isolated repeat setup",
          actual: output.decision.kind,
        },
        output.state,
        transcript
      );
    }

    repeatState = output.state;
  }

  const command = procedureCommands[repeatIndex];
  const factsBefore = getScenarioFactsSnapshot(repeatState);
  const output = handleInput(repeatState, command);
  const factsAfter = getScenarioFactsSnapshot(output.state);

  const statePreserved = factsBefore === factsAfter;
  const matched =
    output.decision.kind === "DENY" && statePreserved;

  const stepNumber = steps.length + 1;

  transcript.push({
    stepNumber,
    input: command,
    phase: "repeat",
    decision: output.decision.kind,
    message: output.message || "",
  });

  steps.push({
    stepNumber,
    input: command,
    phase: "repeat",
    expectedDecision: "DENY",
    actualDecision: output.decision.kind,
    matched,
    statePreserved,
  });

  if (!matched) {
    return buildFailureReport(
      scenarioId,
      steps,
      {
        stepNumber,
        input: command,
        phase: "repeat",
        expected: "DENY with unchanged scenario facts",
        actual: `${output.decision.kind} with ${
          statePreserved ? "unchanged" : "changed"
        } scenario facts`,
      },
      output.state,
      transcript
    );
  }
}

// Keep final scoring tied to the clean Golden Path.
testState = goldenState;

// WRONG-ORDER TESTS:
// Attempt every procedure except the first before any
// required procedures have been completed.
// Each test uses a fresh Practice attempt.

for (
  let wrongOrderIndex = 1;
  wrongOrderIndex < procedureCommands.length;
  wrongOrderIndex += 1
) {
  let wrongOrderState: SimState = {
    ...initialState(),
    mode: "practice",
    assessmentIntegrity: "maintained",
  };

  const selected = handleInput(
    wrongOrderState,
    selectCommand
  );

  if (
    selected.decision.kind !== "ALLOW" ||
    selected.state.previewScenario !== scenarioId
  ) {
    return buildFailureReport(
      scenarioId,
      steps,
      {
        stepNumber: steps.length + 1,
        input: selectCommand,
        phase: "setup",
        expected: `ALLOW and previewScenario ${scenarioId}`,
        actual: `${selected.decision.kind} and previewScenario ${
          selected.state.previewScenario ?? "null"
        }`,
      },
      selected.state,
      transcript
    );
  }

  wrongOrderState = selected.state;

  const started = handleInput(wrongOrderState, "start");

  if (
    started.decision.kind !== "ALLOW" ||
    started.state.executionState !== "RUNNING" ||
    started.state.scenario !== scenarioId
  ) {
    return buildFailureReport(
      scenarioId,
      steps,
      {
        stepNumber: steps.length + 1,
        input: "start",
        phase: "setup",
        expected: `ALLOW, RUNNING, and scenario ${scenarioId}`,
        actual: `${started.decision.kind}, ${
          started.state.executionState
        }, scenario ${started.state.scenario ?? "null"}`,
      },
      started.state,
      transcript
    );
  }

  wrongOrderState = started.state;

  const command = procedureCommands[wrongOrderIndex];

  const factsBefore =
    getScenarioFactsSnapshot(wrongOrderState);

  const output = handleInput(wrongOrderState, command);

  const factsAfter =
    getScenarioFactsSnapshot(output.state);

  const statePreserved = factsBefore === factsAfter;

  const matched =
    output.decision.kind === "DENY" &&
    statePreserved;

  const stepNumber = steps.length + 1;

  transcript.push({
    stepNumber,
    input: command,
    phase: "wrong-order",
    decision: output.decision.kind,
    message: output.message || "",
  });

  steps.push({
    stepNumber,
    input: command,
    phase: "wrong-order",
    expectedDecision: "DENY",
    actualDecision: output.decision.kind,
    matched,
    statePreserved,
  });

  if (!matched) {
    return buildFailureReport(
      scenarioId,
      steps,
      {
        stepNumber,
        input: command,
        phase: "wrong-order",
        expected: "DENY with unchanged scenario facts",
        actual:
          `${output.decision.kind} with ` +
          `${
            statePreserved ? "unchanged" : "changed"
          } scenario facts`,
      },
      output.state,
      transcript
    );
  }
}

// MID-TICKET WRONG-ORDER TESTS:
// Complete the required procedures up to a checkpoint,
// then skip the next required procedure.
// Every test uses a fresh Practice attempt.

for (
  let completedCount = 1;
  completedCount < procedureCommands.length - 1;
  completedCount += 1
) {
  let skipState: SimState = {
    ...initialState(),
    mode: "practice",
    assessmentIntegrity: "maintained",
  };

  const selected = handleInput(skipState, selectCommand);

  if (
    selected.decision.kind !== "ALLOW" ||
    selected.state.previewScenario !== scenarioId
  ) {
    return buildFailureReport(
      scenarioId,
      steps,
      {
        stepNumber: steps.length + 1,
        input: selectCommand,
        phase: "setup",
        expected: `ALLOW and previewScenario ${scenarioId}`,
        actual: `${selected.decision.kind} and previewScenario ${
          selected.state.previewScenario ?? "null"
        }`,
      },
      selected.state,
      transcript
    );
  }

  skipState = selected.state;

  const started = handleInput(skipState, "start");

  if (
    started.decision.kind !== "ALLOW" ||
    started.state.executionState !== "RUNNING" ||
    started.state.scenario !== scenarioId
  ) {
    return buildFailureReport(
      scenarioId,
      steps,
      {
        stepNumber: steps.length + 1,
        input: "start",
        phase: "setup",
        expected: `ALLOW, RUNNING, and scenario ${scenarioId}`,
        actual: `${started.decision.kind}, ${
          started.state.executionState
        }, scenario ${started.state.scenario ?? "null"}`,
      },
      started.state,
      transcript
    );
  }

  skipState = started.state;

  // Complete the valid procedures up to this checkpoint.
  for (let i = 0; i < completedCount; i += 1) {
    const setupCommand = procedureCommands[i];
    const setupOutput = handleInput(skipState, setupCommand);

    if (setupOutput.decision.kind !== "ALLOW") {
      return buildFailureReport(
        scenarioId,
        steps,
        {
          stepNumber: steps.length + 1,
          input: setupCommand,
          phase: "correct",
          expected: "ALLOW during mid-ticket setup",
          actual: setupOutput.decision.kind,
        },
        setupOutput.state,
        transcript
      );
    }

    skipState = setupOutput.state;
  }

  // Skip the next required procedure.
  const command = procedureCommands[completedCount + 1];

  const factsBefore = getScenarioFactsSnapshot(skipState);
  const output = handleInput(skipState, command);
  const factsAfter = getScenarioFactsSnapshot(output.state);

  const statePreserved = factsBefore === factsAfter;

  const matched =
    output.decision.kind === "DENY" && statePreserved;

  const stepNumber = steps.length + 1;

  transcript.push({
    stepNumber,
    input: command,
    phase: "wrong-order",
    decision: output.decision.kind,
    message: output.message || "",
  });

  steps.push({
    stepNumber,
    input: command,
    phase: "wrong-order",
    expectedDecision: "DENY",
    actualDecision: output.decision.kind,
    matched,
    statePreserved,
  });

  if (!matched) {
    return buildFailureReport(
      scenarioId,
      steps,
      {
        stepNumber,
        input: command,
        phase: "wrong-order",
        expected: "DENY with unchanged scenario facts",
        actual: `${output.decision.kind} with ${
          statePreserved ? "unchanged" : "changed"
        } scenario facts`,
      },
      output.state,
      transcript
    );
  }
}

  const finalCompletion = getFinalCompletion(testState);
  const finalScore = testState.result?.totalScore ?? null;

  if (
  testState.executionState !== "SCORECARD" ||
  finalCompletion !== "PASS" ||
  finalScore !== 10
) {
  return buildFailureReport(
    scenarioId,
    steps,
    {
      stepNumber: steps.length,
      input:
        procedureCommands[procedureCommands.length - 1] ??
        "(no final procedure)",
      phase: "completion",
      expected: "SCORECARD with PASS and score 10/10",
      actual:
        `${testState.executionState} with ` +
        `${finalCompletion ?? "null"} completion and ` +
        `${finalScore ?? "null"}/10 score`,
    },
    testState,
    transcript
  );
}

  return {
    status: "PASS",
    scenarioId,
    totalSteps: steps.length,
    matchedSteps: steps.length,
    expectedAllows: steps.filter(
      (step) => step.expectedDecision === "ALLOW"
    ).length,
    expectedDenies: steps.filter(
      (step) => step.expectedDecision === "DENY"
    ).length,
    finalCompletion,
    finalScore,
    failure: null,
    steps,
    transcript,
    };  
    }

export function runInvestigationValidation(
  scenarioId: ScenarioId,
  selectCommand: string,
  _relatedCommand: string
): InvestigationValidationReport {
  const relatedCommands =
    getScenarioInvestigationRelatedCommands(scenarioId);

  const procedureCommands =
    getScenarioProcedureCommands(scenarioId);

  let testState: SimState = {
    ...initialState(),
    mode: "investigation",
    assessmentIntegrity: "maintained",
  };

  const transcript: ScenarioValidationTranscriptEntry[] = [];

  let relatedCommandsPassed = 0;
  let repeatChecks = 0;
  let repeatChecksPassed = 0;

  const fail = (
    failure: ScenarioValidationFailure
  ): InvestigationValidationReport => ({
    status: "FAIL",
    scenarioId,

    procedureCommandCount: procedureCommands.length,
    procedureCommandsPassed: 0,

    relatedCommandCount: relatedCommands.length,
    relatedCommandsPassed,
    relatedPreservedProgress: false,
    relatedAddedMistake: false,

    repeatChecks,
    repeatChecksPassed,

    passPathReached: false,
    passCompletion: null,
    passScore: null,
    passMistakes: null,

    denyCount: testState.runLog.filter(
      (event) => event.decision === "DENY"
    ).length,
    takeoverReached:
      testState.executionState === "SCORECARD" &&
      testState.result?.completion === "FAIL",

    failPathReached:
      testState.executionState === "SCORECARD" &&
      testState.result?.completion === "FAIL",
    failCompletion: getFinalCompletion(testState),
    failScore: testState.result?.totalScore ?? null,
    failMistakes: testState.result?.mistakes ?? null,

    ticketCreated: testState.investigationTicket !== null,
    failure,
    transcript,
  });

  // SETUP 1:
  // Select the real scenario through the engine.
  const selected = handleInput(testState, selectCommand);

  transcript.push({
    stepNumber: 0,
    input: selectCommand,
    phase: "setup",
    decision: selected.decision.kind,
    message: selected.message || "",
  });

  if (
    selected.decision.kind !== "ALLOW" ||
    selected.state.previewScenario !== scenarioId
  ) {
    testState = selected.state;

    return fail({
      stepNumber: 0,
      input: selectCommand,
      phase: "setup",
      expected: `ALLOW and previewScenario ${scenarioId}`,
      actual:
        `${selected.decision.kind} and previewScenario ` +
        `${selected.state.previewScenario ?? "null"}`,
    });
  }

  testState = selected.state;

  // SETUP 2:
  // Start Investigation through the real engine.
  const started = handleInput(testState, "start");

  transcript.push({
    stepNumber: 0,
    input: "start",
    phase: "setup",
    decision: started.decision.kind,
    message: started.message || "",
  });

  if (
    started.decision.kind !== "ALLOW" ||
    started.state.executionState !== "RUNNING" ||
    started.state.scenario !== scenarioId ||
    started.state.investigationTicket === null
  ) {
    testState = started.state;

    return fail({
      stepNumber: 0,
      input: "start",
      phase: "setup",
      expected:
        `ALLOW, RUNNING, scenario ${scenarioId}, and Investigation ticket`,
      actual:
        `${started.decision.kind}, ` +
        `${started.state.executionState}, scenario ` +
        `${started.state.scenario ?? "null"}, ticket ` +
        `${started.state.investigationTicket ? "present" : "missing"}`,
    });
  }

  testState = started.state;

   // RELATED TRIP WIRE:
  // Every registered RELATED command must:
  // - return RELATED
  // - preserve required procedure progress
  // - add no mistake

  let relatedPreservedProgress = true;
  let relatedAddedMistake = false;

  for (const currentRelatedCommand of relatedCommands) {
    // This command is intentionally identity-gated.
    // Validate its security behavior in a separate test,
    // rather than expecting RELATED before authorization.
    if (
      scenarioId === "email_client_corrupted_profile" &&
      currentRelatedCommand === "check_email_login_status"
    ) {
      continue;
    }

    const progressBeforeRelated =
      getScenarioFactsSnapshot(testState);

    const deniesBeforeRelated = testState.runLog.filter(
      (event) => event.decision === "DENY"
    ).length;

    const relatedOutput =
      handleInput(testState, currentRelatedCommand);

    transcript.push({
      stepNumber: transcript.length + 1,
      input: currentRelatedCommand,
      phase: "related",
      decision: relatedOutput.decision.kind,
      message: relatedOutput.message || "",
    });

    const progressAfterRelated =
      getScenarioFactsSnapshot(relatedOutput.state);

    const deniesAfterRelated =
      relatedOutput.state.runLog.filter(
        (event) => event.decision === "DENY"
      ).length;

    const preservedProgress =
      progressAfterRelated === progressBeforeRelated;

    const addedMistake =
      deniesAfterRelated !== deniesBeforeRelated;

    relatedPreservedProgress =
      relatedPreservedProgress && preservedProgress;

    relatedAddedMistake =
      relatedAddedMistake || addedMistake;

    if (
      relatedOutput.decision.kind !== "RELATED" ||
      !preservedProgress ||
      addedMistake
    ) {
      testState = relatedOutput.state;

      return {
        ...fail({
          stepNumber: transcript.length,
          input: currentRelatedCommand,
          phase: "related",
          expected:
            "RELATED with unchanged procedure progress and no added mistake",
          actual:
            `${relatedOutput.decision.kind}, progress ` +
            `${preservedProgress ? "preserved" : "changed"}, ` +
            `mistake ${addedMistake ? "added" : "not added"}`,
        }),
        relatedCommandCount: relatedCommands.length,
        relatedCommandsPassed,
        relatedPreservedProgress,
        relatedAddedMistake,
      };
    }

    relatedCommandsPassed += 1;
    testState = relatedOutput.state;
  }

    // PASS PATH:
  // Use a fresh Investigation attempt so RELATED checks and later
  // deliberate DENYs cannot contaminate the successful procedure run.

  let passState: SimState = {
    ...initialState(),
    mode: "investigation",
    assessmentIntegrity: "maintained",
  };

  let procedureCommandsPassed = 0;

  const passSelected =
    handleInput(passState, selectCommand);

  if (
    passSelected.decision.kind !== "ALLOW" ||
    passSelected.state.previewScenario !== scenarioId
  ) {
    return {
      ...fail({
        stepNumber: transcript.length + 1,
        input: selectCommand,
        phase: "setup",
        expected:
          `ALLOW and previewScenario ${scenarioId} on PASS attempt`,
        actual:
          `${passSelected.decision.kind} and previewScenario ` +
          `${passSelected.state.previewScenario ?? "null"}`,
      }),
      procedureCommandCount: procedureCommands.length,
      procedureCommandsPassed,
      relatedCommandCount: relatedCommands.length,
      relatedCommandsPassed,
      relatedPreservedProgress,
      relatedAddedMistake,
    };
  }

  passState = passSelected.state;

  const passStarted =
    handleInput(passState, "start");

  if (
    passStarted.decision.kind !== "ALLOW" ||
    passStarted.state.executionState !== "RUNNING" ||
    passStarted.state.scenario !== scenarioId ||
    passStarted.state.investigationTicket === null
  ) {
    return {
      ...fail({
        stepNumber: transcript.length + 1,
        input: "start",
        phase: "setup",
        expected:
          `ALLOW, RUNNING, scenario ${scenarioId}, and Investigation ticket on PASS attempt`,
        actual:
          `${passStarted.decision.kind}, ` +
          `${passStarted.state.executionState}, scenario ` +
          `${passStarted.state.scenario ?? "null"}, ticket ` +
          `${passStarted.state.investigationTicket ? "present" : "missing"}`,
      }),
      procedureCommandCount: procedureCommands.length,
      procedureCommandsPassed,
      relatedCommandCount: relatedCommands.length,
      relatedCommandsPassed,
      relatedPreservedProgress,
      relatedAddedMistake,
    };
  }

  passState = passStarted.state;

  for (const command of procedureCommands) {
    const correctOutput =
      handleInput(passState, command);

    transcript.push({
      stepNumber: transcript.length + 1,
      input: command,
      phase: "correct",
      decision: correctOutput.decision.kind,
      message: correctOutput.message || "",
    });

    if (correctOutput.decision.kind !== "ALLOW") {
      passState = correctOutput.state;

      return {
        ...fail({
          stepNumber: transcript.length,
          input: command,
          phase: "correct",
          expected: "ALLOW on Investigation PASS path",
          actual: correctOutput.decision.kind,
        }),
        procedureCommandCount: procedureCommands.length,
        procedureCommandsPassed,
        relatedCommandCount: relatedCommands.length,
        relatedCommandsPassed,
        relatedPreservedProgress,
        relatedAddedMistake,
        passPathReached: false,
        passCompletion: getFinalCompletion(passState),
        passScore: passState.result?.totalScore ?? null,
        passMistakes: passState.result?.mistakes ?? null,
      };
    }

    procedureCommandsPassed += 1;
    passState = correctOutput.state;
  }

  const passCompletion =
    getFinalCompletion(passState);

  const passScore =
    passState.result?.totalScore ?? null;

  const passMistakes =
    passState.result?.mistakes ?? null;

  const passPathReached =
    passState.executionState === "SCORECARD" &&
    passCompletion === "PASS";

  if (!passPathReached) {
    return {
      ...fail({
        stepNumber: transcript.length,
        input:
          procedureCommands[procedureCommands.length - 1] ??
          "(no final procedure)",
        phase: "completion",
        expected:
          "SCORECARD with PASS after all registered Investigation procedures",
        actual:
          `${passState.executionState} with ` +
          `${passCompletion ?? "null"} completion`,
      }),
      procedureCommandCount: procedureCommands.length,
      procedureCommandsPassed,
      relatedCommandCount: relatedCommands.length,
      relatedCommandsPassed,
      relatedPreservedProgress,
      relatedAddedMistake,
      passPathReached,
      passCompletion,
      passScore,
      passMistakes,
    };
  }

  // ISOLATED IDENTITY-GATED RELATED CHECK
  if (scenarioId === "email_client_corrupted_profile") {
    let securityState: SimState = {
      ...initialState(),
      mode: "investigation",
      assessmentIntegrity: "maintained",
    };

    const securitySelected =
      handleInput(securityState, selectCommand);

    if (
      securitySelected.decision.kind !== "ALLOW" ||
      securitySelected.state.previewScenario !== scenarioId
    ) {
      return fail({
        stepNumber: transcript.length + 1,
        input: selectCommand,
        phase: "setup",
        expected: "ALLOW selecting security-test scenario",
        actual: securitySelected.decision.kind,
      });
    }

    const securityStarted =
      handleInput(securitySelected.state, "start");

    if (
      securityStarted.decision.kind !== "ALLOW" ||
      securityStarted.state.executionState !== "RUNNING"
    ) {
      return fail({
        stepNumber: transcript.length + 1,
        input: "start",
        phase: "setup",
        expected: "ALLOW starting security-test ticket",
        actual: securityStarted.decision.kind,
      });
    }

    securityState = securityStarted.state;

    const securitySteps: Array<{
      command: string;
      expected: "ALLOW" | "RELATED" | "DENY";
      phase: "security" | "setup" | "related" | "repeat";
      countRelated?: boolean;
    }> = [
      {
        command: "check_email_status",
        expected: "RELATED",
        phase: "related",
      },
      {
        command: "check_email_status",
        expected: "DENY",
        phase: "repeat",
      },
      {
        command: "check_email_login_status",
        expected: "DENY",
        phase: "security",
      },
      {
        command: "verify_identity",
        expected: "ALLOW",
        phase: "setup",
      },
      {
        command: "check_email_login_status",
        expected: "RELATED",
        phase: "related",
        countRelated: true,
      },
      {
        command: "check_email_login_status",
        expected: "DENY",
        phase: "repeat",
      },
    ];

    for (const step of securitySteps) {
      const factsBefore =
        getScenarioFactsSnapshot(securityState);

      const output =
        handleInput(securityState, step.command);

      const factsAfter =
        getScenarioFactsSnapshot(output.state);

      const mustPreserveFacts =
        step.expected !== "ALLOW";

      transcript.push({
        stepNumber: transcript.length + 1,
        input: step.command,
        phase: step.phase,
        decision: output.decision.kind,
        message: output.message || "",
      });

      if (
        output.decision.kind !== step.expected ||
        (mustPreserveFacts && factsBefore !== factsAfter)
      ) {
        return fail({
          stepNumber: transcript.length,
          input: step.command,
          phase: step.phase,
          expected:
            `${step.expected}` +
            (mustPreserveFacts
              ? " with unchanged scenario facts"
              : ""),
          actual:
            `${output.decision.kind}, facts ` +
            `${factsBefore === factsAfter ? "unchanged" : "changed"}`,
        });
      }

      if (step.countRelated === true) {
        relatedCommandsPassed += 1;
      }

      if (step.phase === "repeat") {
        repeatChecks += 1;
        repeatChecksPassed += 1;
      }

      securityState = output.state;
    }
  }

  // REPEAT CHECKS:
  // Test each non-final procedure in its own fresh Investigation attempt.
  // This prevents intentional repeat DENYs from contaminating the PASS path.

  for (
    let repeatIndex = 0;
    repeatIndex < procedureCommands.length - 1;
    repeatIndex += 1
  ) {
    let repeatState: SimState = {
      ...initialState(),
      mode: "investigation",
      assessmentIntegrity: "maintained",
    };

    const repeatSelected =
      handleInput(repeatState, selectCommand);

    if (
      repeatSelected.decision.kind !== "ALLOW" ||
      repeatSelected.state.previewScenario !== scenarioId
    ) {
      return {
        ...fail({
          stepNumber: transcript.length + 1,
          input: selectCommand,
          phase: "setup",
          expected:
            `ALLOW and previewScenario ${scenarioId} on repeat attempt`,
          actual:
            `${repeatSelected.decision.kind} and previewScenario ` +
            `${repeatSelected.state.previewScenario ?? "null"}`,
        }),
        procedureCommandCount: procedureCommands.length,
        procedureCommandsPassed,
        relatedCommandCount: relatedCommands.length,
        relatedCommandsPassed,
        relatedPreservedProgress,
        relatedAddedMistake,
        repeatChecks,
        repeatChecksPassed,
        passPathReached,
        passCompletion,
        passScore,
        passMistakes,
      };
    }

    repeatState = repeatSelected.state;

    const repeatStarted =
      handleInput(repeatState, "start");

    if (
      repeatStarted.decision.kind !== "ALLOW" ||
      repeatStarted.state.executionState !== "RUNNING" ||
      repeatStarted.state.scenario !== scenarioId
    ) {
      return {
        ...fail({
          stepNumber: transcript.length + 1,
          input: "start",
          phase: "setup",
          expected:
            `ALLOW, RUNNING, and scenario ${scenarioId} on repeat attempt`,
          actual:
            `${repeatStarted.decision.kind}, ` +
            `${repeatStarted.state.executionState}, scenario ` +
            `${repeatStarted.state.scenario ?? "null"}`,
        }),
        procedureCommandCount: procedureCommands.length,
        procedureCommandsPassed,
        relatedCommandCount: relatedCommands.length,
        relatedCommandsPassed,
        relatedPreservedProgress,
        relatedAddedMistake,
        repeatChecks,
        repeatChecksPassed,
        passPathReached,
        passCompletion,
        passScore,
        passMistakes,
      };
    }

    repeatState = repeatStarted.state;

    for (
      let setupIndex = 0;
      setupIndex <= repeatIndex;
      setupIndex += 1
    ) {
      const setupCommand =
        procedureCommands[setupIndex];

      const setupOutput =
        handleInput(repeatState, setupCommand);

      if (setupOutput.decision.kind !== "ALLOW") {
        repeatState = setupOutput.state;

        return {
          ...fail({
            stepNumber: transcript.length + 1,
            input: setupCommand,
            phase: "correct",
            expected:
              "ALLOW while preparing isolated repeat check",
            actual: setupOutput.decision.kind,
          }),
          procedureCommandCount: procedureCommands.length,
          procedureCommandsPassed,
          relatedCommandCount: relatedCommands.length,
          relatedCommandsPassed,
          relatedPreservedProgress,
          relatedAddedMistake,
          repeatChecks,
          repeatChecksPassed,
          passPathReached,
          passCompletion,
          passScore,
          passMistakes,
        };
      }

      repeatState = setupOutput.state;
    }

    const repeatedCommand =
      procedureCommands[repeatIndex];

    const factsBeforeRepeat =
      getScenarioFactsSnapshot(repeatState);

    const repeatedOutput =
      handleInput(repeatState, repeatedCommand);

    const factsAfterRepeat =
      getScenarioFactsSnapshot(repeatedOutput.state);

    const repeatPreservedState =
      factsBeforeRepeat === factsAfterRepeat;

    repeatChecks += 1;

    transcript.push({
      stepNumber: transcript.length + 1,
      input: repeatedCommand,
      phase: "repeat",
      decision: repeatedOutput.decision.kind,
      message: repeatedOutput.message || "",
    });

    if (
      repeatedOutput.decision.kind !== "DENY" ||
      !repeatPreservedState
    ) {
      return {
        ...fail({
          stepNumber: transcript.length,
          input: repeatedCommand,
          phase: "repeat",
          expected:
            "DENY with unchanged scenario facts",
          actual:
            `${repeatedOutput.decision.kind} with ` +
            `${repeatPreservedState ? "unchanged" : "changed"} scenario facts`,
        }),
        procedureCommandCount: procedureCommands.length,
        procedureCommandsPassed,
        relatedCommandCount: relatedCommands.length,
        relatedCommandsPassed,
        relatedPreservedProgress,
        relatedAddedMistake,
        repeatChecks,
        repeatChecksPassed,
        passPathReached,
        passCompletion,
        passScore,
        passMistakes,
      };
    }

    repeatChecksPassed += 1;
  }

  // DENY / TAKEOVER TRIP WIRE:
//
// Investigation takeover is determined by the engine.
// Keep sending controlled unknown commands until the engine
// decides the run can no longer reach a passing score.

let denyIndex = 0;

while (testState.executionState === "RUNNING") {
  denyIndex += 1;

  const denyInput =
    `investigation_validation_unknown_${denyIndex}`;

  const progressBeforeDeny =
    getScenarioFactsSnapshot(testState);

  const deniesBeforeDeny = testState.runLog.filter(
    (event) => event.decision === "DENY"
  ).length;

  const deniedOutput =
    handleInput(testState, denyInput);

  transcript.push({
    stepNumber: transcript.length + 1,
    input: denyInput,
    phase:
      deniedOutput.state.executionState === "SCORECARD"
        ? "takeover"
        : "deny",
    decision: deniedOutput.decision.kind,
    message: deniedOutput.message || "",
  });

  const progressAfterDeny =
    getScenarioFactsSnapshot(deniedOutput.state);

  const deniesAfterDeny =
    deniedOutput.state.runLog.filter(
      (event) => event.decision === "DENY"
    ).length;

  const denyPreservedProgress =
    progressAfterDeny === progressBeforeDeny;

  const denyAddedExactlyOneMistake =
    deniesAfterDeny === deniesBeforeDeny + 1;

  if (
    deniedOutput.decision.kind !== "DENY" ||
    !denyPreservedProgress ||
    !denyAddedExactlyOneMistake
  ) {
    testState = deniedOutput.state;

    return {
      ...fail({
        stepNumber: transcript.length,
        input: denyInput,
        phase: "deny",
        expected:
          "DENY with unchanged scenario progress and exactly one added mistake",
        actual:
          `${deniedOutput.decision.kind}, progress ` +
          `${denyPreservedProgress ? "preserved" : "changed"}, ` +
          `mistake ${
            denyAddedExactlyOneMistake
              ? "added exactly once"
              : "count incorrect"
          }`,
      }),
      relatedPreservedProgress,
      relatedAddedMistake,
    };
  }

  testState = deniedOutput.state;
}

  const denyCount = testState.runLog.filter(
    (event) => event.decision === "DENY"
  ).length;

  const takeoverReached =
    testState.executionState === "SCORECARD";

  const finalCompletion =
    getFinalCompletion(testState);

  const finalScore =
    testState.result?.totalScore ?? null;

  const finalMistakes =
    testState.result?.mistakes ?? null;

  const failureResultIsValid =
    takeoverReached &&
    finalCompletion === "FAIL" &&
    finalScore !== null &&
    finalMistakes !== null &&
    finalMistakes === denyCount &&
    denyCount > 0;

  if (!failureResultIsValid) {
    return {
      status: "FAIL",
      scenarioId,

      procedureCommandCount: procedureCommands.length,
      procedureCommandsPassed,

      relatedCommandCount: relatedCommands.length,
      relatedCommandsPassed,
      relatedPreservedProgress,
      relatedAddedMistake,

      repeatChecks,
      repeatChecksPassed,

      passPathReached,
      passCompletion,
      passScore,
      passMistakes,

      denyCount,
      takeoverReached,
      failPathReached: false,
      failCompletion: finalCompletion,
      failScore: finalScore,
      failMistakes: finalMistakes,

      ticketCreated:
        testState.investigationTicket !== null,
      failure: {
        stepNumber: 8,
        input: "(takeover result)",
        phase: "takeover",
        expected:
          "SCORECARD with FAIL, a calculated score, and mistakes matching DENY count",
        actual:
          `${testState.executionState}, ` +
          `${finalCompletion ?? "null"}, ` +
          `${finalScore ?? "null"}/10, ` +
          `${finalMistakes ?? "null"} mistakes, ` +
          `${denyCount} DENYs`,
      },
      transcript,
    };
  }

  return {
    status: "PASS",
    scenarioId,

      procedureCommandCount: procedureCommands.length,
      procedureCommandsPassed,

      relatedCommandCount: relatedCommands.length,
      relatedCommandsPassed,
      relatedPreservedProgress,
      relatedAddedMistake,

      repeatChecks,
      repeatChecksPassed,

      passPathReached,
      passCompletion,
      passScore,
      passMistakes,

    denyCount,
    takeoverReached,
    failPathReached:
      takeoverReached &&
      finalCompletion === "FAIL",
    failCompletion: finalCompletion,
    failScore: finalScore,
    failMistakes: finalMistakes,

    ticketCreated:
      testState.investigationTicket !== null,
    failure: null,
    transcript,
  };
}