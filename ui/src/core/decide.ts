import type {
  Command,
  Decision,
  ExecutionPlan,
  SimState,
} from "./types";
import { isValidScenarioId } from "./scenarios";
import {
  procedureCatalog,
  type ProcedureCommandKind,
  type ProcedurePlanKind,
} from "./procedureCatalog";
import { scenarioDecisionRegistry } from "./scenarioDecisionRegistry";
import {
  procedureDecisionRegistry,
  type ProcedureDecisionDefinition,
} from "./procedureDecisionRegistry";

const PROCEDURE_NOT_RECOGNIZED =
  "Unknown procedure: that procedure was not recognized for this step.\n\n" +
  "This simulator evaluates troubleshooting procedures, not exact wording.\n\n" +
  "Try describing the procedure you are performing.";

const PROCEDURE_DENIED =
  "That is not the correct procedure at this step.";

function denyProcedure(commandKind: string): Decision {
  return {
    kind: "DENY",
    reason:
    `Last entered procedure:\n"${commandKind}"\n\n` +
    PROCEDURE_DENIED,
    denyType: "PROCEDURE_DENIED",
  };
}

type ProcedureExecutionPlan = Extract<
  ExecutionPlan,
  { kind: ProcedurePlanKind }
>;

// Trip wire: procedure plans must remain simple plans containing only `kind`.
// If a future procedure plan requires extra data, TypeScript stops this helper
// from silently constructing an incomplete plan.
type ProcedurePlanWithRequiredFields = {
  [Plan in ProcedureExecutionPlan as Plan["kind"]]:
    Exclude<keyof Plan, "kind"> extends never
      ? never
      : Plan["kind"];
}[ProcedureExecutionPlan["kind"]];

export const SIMPLE_PROCEDURE_PLAN_COVERAGE:
  ProcedurePlanWithRequiredFields extends never
    ? true
    : never = true;

    type ScenarioRegistryProcedureCommandKind = {
  [ScenarioKind in keyof typeof scenarioDecisionRegistry]:
    keyof (typeof scenarioDecisionRegistry)[ScenarioKind];
}[keyof typeof scenarioDecisionRegistry];

type RegisteredProcedureCommandKind =
  | keyof typeof procedureDecisionRegistry
  | ScenarioRegistryProcedureCommandKind;

type DirectlyHandledProcedureCommandKind =
  "verify_identity";

type MissingProcedureDecisionCoverage = Exclude<
  ProcedureCommandKind,
  RegisteredProcedureCommandKind |
    DirectlyHandledProcedureCommandKind
>;

export const PROCEDURE_DECISION_REGISTRY_COVERAGE:
  MissingProcedureDecisionCoverage extends never
    ? true
    : never = true;

function allowProcedurePlan(
  planKind: ProcedurePlanKind
): Decision {
  return {
    kind: "ALLOW",
    plan: {
      kind: planKind,
    } as ProcedureExecutionPlan,
  };
}

function allowProcedure(
  commandKind: ProcedureCommandKind
): Decision {
  return allowProcedurePlan(
    procedureCatalog[commandKind].plan
  );
}

function decideRegisteredProcedure(
  state: SimState,
  commandKind: ProcedureCommandKind
): Decision | null {
  if (!(commandKind in procedureDecisionRegistry)) {
    return null;
  }

  const definition =
    procedureDecisionRegistry[
      commandKind as keyof typeof procedureDecisionRegistry
    ] as ProcedureDecisionDefinition;

  const runningCheck = mustBeRunning(state);

  if (runningCheck) {
    return runningCheck;
  }

  const facts = state.scenarioFacts;

  if (!facts) {
    return denyProcedure(commandKind);
  }

  const identityCheck = mustHaveIdentityVerified(
    state,
    commandKind
  );

  if (identityCheck) {
    return identityCheck;
  }

  const scenarioRule = definition.scenarios[
    facts.kind
  ] as
    | ((scenarioFacts: typeof facts) => boolean)
    | undefined;

  if (!scenarioRule) {
    return denyProcedure(commandKind);
  }

  if (!scenarioRule(facts)) {
    return denyProcedure(commandKind);
  }

  const configuredPlan = definition.plan;

  if (!configuredPlan) {
    return allowProcedure(commandKind);
  }

  const planKind =
    typeof configuredPlan === "string"
      ? configuredPlan
      : configuredPlan[facts.kind];

  if (!planKind) {
    return allowProcedure(commandKind);
  }

  return allowProcedurePlan(planKind);
}



function mustBeRunning(state: SimState): Decision | null {
  if (state.executionState !== "RUNNING") {
    return { kind: "DENY", reason: "Must be in a running session." };
  }

  return null;
}

function mustHaveIdentityVerified(
  state: SimState,
  commandKind: string
): Decision | null {
  if (
  !state.scenarioFacts ||
  (
    "identity_verified" in state.scenarioFacts &&
    !state.scenarioFacts.identity_verified
  )
) {
    return denyProcedure(commandKind);
  }

  return null;
}

function decideRegisteredScenarioProcedure(
  state: SimState,
  commandKind: ProcedureCommandKind
): Decision | null {
  const facts = state.scenarioFacts;

  if (!facts) {
    return null;
  }

  if (!(facts.kind in scenarioDecisionRegistry)) {
    return null;
  }

  const scenarioRules =
    scenarioDecisionRegistry[
      facts.kind as keyof typeof scenarioDecisionRegistry
    ];

if (!(commandKind in scenarioRules)) {
  return null;
}

const rule =
  scenarioRules[
    commandKind as keyof typeof scenarioRules
  ] as (scenarioFacts: typeof facts) => boolean;

  if (!rule) {
    return null;
  }

  const runningCheck = mustBeRunning(state);

  if (runningCheck) {
    return runningCheck;
  }

  const identityCheck = mustHaveIdentityVerified(
    state,
    commandKind
  );

  if (identityCheck) {
    return identityCheck;
  }

  if (!rule(facts)) {
    return denyProcedure(commandKind);
  }

  return allowProcedure(commandKind);
}

// Decision Maker: decides legitimacy and returns an authorized plan.
// No state mutation. No execution.
export function decide(state: SimState, command: Command): Decision {
// --- SYSTEM / CONTROL COMMANDS --- //
// Unknown commands are denied
if (command.kind === "unknown") {
  return {
    kind: "DENY",
    reason: PROCEDURE_NOT_RECOGNIZED,
    denyType: "UNKNOWN_INPUT",
  };
}

// Help is available in Practice only.
// Assessment must not expose guided procedure assistance.
if (command.kind === "help") {
  if (state.mode === "assessment") {
    return {
      kind: "DENY",
      reason:
        "Procedure Help is unavailable during Assessment.",
    };
  }

  return {
    kind: "ALLOW",
    plan: {
      kind: "ReadOnly",
      view: "HELP",
    },
  };
}

  if (command.kind === "status") {
    return { kind: "ALLOW", plan: { kind: "ReadOnly", view: "STATUS" } };
  }

  if (command.kind === "debug") {
    return { kind: "ALLOW", plan: { kind: "ReadOnly", view: "DEBUG" } };
  }

  if (command.kind === "view_scorecard") {
    if (state.executionState !== "SCORECARD") {
      return {
        kind: "DENY",
        reason: "Scorecard is not available yet.",
      };
    }

    return {
      kind: "ALLOW",
      plan: { kind: "ViewScorecard" },
    };
  }

  // select legitimacy rule
  if (command.kind === "select") {
    if (
      state.executionState !== "LOBBY" &&
      state.executionState !== "COMPLETED"
    ) {
      return { kind: "DENY", reason: "Cannot select: session already running." };
    }
 
    if (!isValidScenarioId(command.scenario_id)) {
      return {
        kind: "DENY",
        reason: `Cannot select: Unknown scenario: ${command.scenario_id}`,
      };
    }

    return {
      kind: "ALLOW",
      plan: { kind: "SelectScenario", scenario_id: command.scenario_id },
    };
  }

  // start legitimacy rule
  if (command.kind === "start") {
    // Rule: start is only allowed from LOBBY
    if (state.executionState !== "LOBBY") {
      return { kind: "DENY", reason: "Cannot start: already in a session." };
    }

    if (state.scenario === null && state.previewScenario === null) {
      return { kind: "DENY", reason: "Cannot start: no scenario selected." };
    }

    return { kind: "ALLOW", plan: { kind: "StartNewAttempt" } };
  }

  // Restart is a Practice-only recovery action.
// Assessment attempts cannot be restarted.
if (command.kind === "restart") {
  if (state.mode === "assessment") {
    return {
      kind: "DENY",
      reason:
        "Restart is unavailable during Assessment.",
    };
  }

  if (state.executionState === "LOBBY") {
    return {
      kind: "DENY",
      reason:
        "Cannot restart from LOBBY. Nothing is running yet.",
    };
  }

  return {
    kind: "ALLOW",
    plan: {
      kind: "StartNewAttempt",
    },
  };
}

  // quit legitimacy rule
  if (command.kind === "quit") {
    // Rule: quit is only allowed if a session exists
    if (state.executionState === "LOBBY") {
      return {
        kind: "DENY",
        reason: "Cannot quit: no active session.",
      };
    }

    return { kind: "ALLOW", plan: { kind: "QuitAttemptToLobby" } };
  }
  
  // --- SHARED COMMANDS --- //
  // verify_identity gating rule
  if (command.kind === "verify_identity") {
    const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

    // verify_identity works in scenarios using command
    if (
      !state.scenarioFacts ||
      !("identity_verified" in state.scenarioFacts)
    ) {
      return denyProcedure(command.kind); // ← FRAMEWORK RULE
    }

    // If already verified, deny (prevents spam + keeps flow clean)
    if (state.scenarioFacts.identity_verified === true) {
      return denyProcedure(command.kind);
    }

    // Allow: this will reach engine, which emits effects, and update() applies them
    return allowProcedure(command.kind);
  }

    const registeredProcedureDecision =
    decideRegisteredProcedure(
      state,
      command.kind
    );

  if (registeredProcedureDecision) {
    return registeredProcedureDecision;
  }

  const registeredScenarioDecision =
    decideRegisteredScenarioProcedure(
      state,
      command.kind
    );

  if (registeredScenarioDecision) {
    return registeredScenarioDecision;
  }

  // Safety fallback (should be unreachable with current Command union)
  return { kind: "DENY", reason: "Command not supported." };
}
