// scenarioValidation.ts
// Automatically validates a scenario from its registered procedure path.
//
// The validator:
// - creates an isolated simulator state
// - selects and starts the requested scenario
// - runs every registered procedure in order
// - immediately repeats every non-final procedure and expects DENY
// - proves expected DENYs do not mutate scenario facts
// - expects the final procedure to complete the scenario with PASS
//
// No UI.
// No scenario-specific test backfilling.
// No direct scenario fact mutation.

import { handleInput } from "./engine";
import { initialState } from "./state";
import type { Decision, SimState } from "./types";
import type { ScenarioId } from "./scenarios";
import { getScenarioProcedureCommands } from "./scenarioRegistry";

type ExpectedDecision = Decision["kind"];

export type ScenarioValidationStepResult = {
  stepNumber: number;
  input: string;
  phase: "correct" | "repeat";
  expectedDecision: ExpectedDecision;
  actualDecision: ExpectedDecision;
  matched: boolean;
  statePreserved: boolean | null;
};

export type ScenarioValidationFailure = {
  stepNumber: number;
  input: string;
  phase: "setup" | "correct" | "repeat" | "completion";
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
  state: SimState
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

  // SETUP 1:
  // Use the same scenario-selection command used by the real UI.
  const selected = handleInput(testState, selectCommand);

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
    selected.state
  );
}

  testState = selected.state;

  // SETUP 2:
  // Start the selected scenario through the real engine.
  const started = handleInput(testState, "start");

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
    started.state
  );
}

  testState = started.state;

  for (
    let procedureIndex = 0;
    procedureIndex < procedureCommands.length;
    procedureIndex += 1
  ) {
    const command = procedureCommands[procedureIndex];
    const isFinalProcedure =
      procedureIndex === procedureCommands.length - 1;

    // CORRECT STEP:
    // Every registered procedure must ALLOW in registered order.
    const correctOutput = handleInput(testState, command);

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
        correctOutput.state
      );
    }

    testState = correctOutput.state;

    // FINAL STEP:
    // Do not repeat it because the scenario should now be complete.
    if (isFinalProcedure) {
      break;
    }

    // REPEAT STEP:
    // Immediately repeating a completed non-final procedure must DENY.
    const factsBeforeRepeat =
      getScenarioFactsSnapshot(testState);

    const repeatedOutput =
      handleInput(testState, command);

    const factsAfterRepeat =
      getScenarioFactsSnapshot(repeatedOutput.state);

    const repeatedStep: ScenarioValidationStepResult = {
      stepNumber: steps.length + 1,
      input: command,
      phase: "repeat",
      expectedDecision: "DENY",
      actualDecision: repeatedOutput.decision.kind,
      matched:
        repeatedOutput.decision.kind === "DENY" &&
        factsAfterRepeat === factsBeforeRepeat,
      statePreserved:
        factsAfterRepeat === factsBeforeRepeat,
    };

    steps.push(repeatedStep);

    if (!repeatedStep.matched) {
      return buildFailureReport(
        scenarioId,
        steps,
        {
          stepNumber: repeatedStep.stepNumber,
          input: command,
          phase: "repeat",
          expected:
            "DENY with unchanged scenario facts",
          actual:
            `${repeatedOutput.decision.kind} with ` +
            `${
              repeatedStep.statePreserved
                ? "unchanged"
                : "changed"
            } scenario facts`,
        },
        repeatedOutput.state
      );
    }

    // Expected DENY is part of the temporary test run.
    // Continue from the returned state because its runLog and score
    // should include the denied attempt while scenario facts remain safe.
    testState = repeatedOutput.state;
  }

  const finalCompletion = getFinalCompletion(testState);
  const finalScore = testState.result?.totalScore ?? null;

  if (
    testState.executionState !== "SCORECARD" ||
    finalCompletion !== "PASS"
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
        expected: "SCORECARD with PASS",
        actual:
          `${testState.executionState} with ` +
          `${finalCompletion ?? "no result"}`,
      },
      testState
    );
  }

  const expectedDeniedCount =
    Math.max(0, procedureCommands.length - 1);

  const expectedScore =
    Math.max(0, 10 - expectedDeniedCount);

  if (finalScore !== expectedScore) {
    return buildFailureReport(
      scenarioId,
      steps,
      {
        stepNumber: steps.length,
        input: "(score validation)",
        phase: "completion",
        expected: `score ${expectedScore}`,
        actual:
          finalScore === null
            ? "no score"
            : `score ${finalScore}`,
      },
      testState
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
  };
}