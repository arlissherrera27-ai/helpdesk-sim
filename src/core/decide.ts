import { Command, Decision, SimState } from "./types";
import { isValidScenarioId } from "./scenarios";

// Decision Maker: decides legitimacy and returns an authorized plan.
// No state mutation. No execution.
export function decide(state: SimState, command: Command): Decision {
  // Unknown commands are denied
  if (command.kind === "unknown") {
    return { kind: "DENY", reason: `Unknown command: ${command.rawInput.trim()}` };
  }

  // help/status are always allowed (read-only views)
  if (command.kind === "help") {
    return { kind: "ALLOW", plan: { kind: "ReadOnly", view: "HELP" } };
  }

  if (command.kind === "status") {
    return { kind: "ALLOW", plan: { kind: "ReadOnly", view: "STATUS" } };
  }

  if (command.kind === "debug") {
    return { kind: "ALLOW", plan: { kind: "ReadOnly", view: "DEBUG" } };
  }
 
  // select legitimacy rule
  if (command.kind === "select") {
    if (state.executionState !== "LOBBY") {
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

    if (state.scenario === null) {
      return { kind: "DENY", reason: "Cannot start: no scenario selected." };
    }

    return { kind: "ALLOW", plan: { kind: "StartNewAttempt" } };
  }

  // restart legitimacy rule (first slice)
  if (command.kind === "restart") {
    // Rule: restart is only allowed when something has been running or completed.
    // (We deny in LOBBY because there's nothing to restart.)
    if (state.executionState === "LOBBY") {
      return {
        kind: "DENY",
        reason: "Cannot restart from LOBBY. Nothing is running yet.",
      };
    }

    return { kind: "ALLOW", plan: { kind: "StartNewAttempt" } };
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

  // verify_identity gating rule
  if (command.kind === "verify_identity") {
    if (state.executionState !== "RUNNING") {
    return { kind: "DENY", reason: "Must be in a running session." };
    }

    // Only meaningful inside password_reset scenario
    if (state.scenarioFacts?.kind !== "password_reset") {
      return { kind: "DENY", reason: "verify_identity only applies in password_reset." };
    }

    // If already verified, deny (prevents spam + keeps flow clean)
    if (state.scenarioFacts.identity_verified === true) {
      return { kind: "DENY", reason: "That action is no longer valid." };
    }

    // Allow: this will reach engine, which emits effects, and update() applies them
    return { kind: "ALLOW", plan: { kind: "VerifyIdentity" } };
  }

    // send_reset_code gating rule // NEW
    if (command.kind === "send_reset_code") {
      if (state.executionState !== "RUNNING") {
        return { kind: "DENY", reason: "Must be in a running session." };
      }

      // Only meaningful inside password_reset scenario
      if (state.scenarioFacts?.kind !== "password_reset") {
        return {
          kind: "DENY",
          reason: "send_reset_code only applies in password_reset.",
        };
      }

      // Must have identity verified first
      if (state.scenarioFacts.identity_verified !== true) {
        return {
          kind: "DENY",
          reason: PROCEDURE_NOT_RECOGNIZED,
        };
      }

      // Must not already have been sent
      if (state.scenarioFacts.code_sent === true) {
        return { kind: "DENY", reason: "That action is no longer valid." };
      }

      return { kind: "ALLOW", plan: { kind: "SendResetCode" } };
    }

  // confirm_reset gating rule //
  if (command.kind === "confirm_reset") {
    if (state.executionState !== "RUNNING") {
      return { kind: "DENY", reason: "Must be in a running session." };
    }

    // Only meaningful inside password_reset scenario
    if (state.scenarioFacts?.kind !== "password_reset") {
      return {
        kind: "DENY",
        reason: "confirm_reset only applies in password_reset.",
      };
    }

    // Must verify identity first
    if (state.scenarioFacts.identity_verified !== true) {
      return {
        kind: "DENY",
        reason: PROCEDURE_NOT_RECOGNIZED,
      };
    }

    // Must send reset code first
    if (state.scenarioFacts.code_sent !== true) {
      return {
        kind: "DENY",
        reason: PROCEDURE_NOT_RECOGNIZED,
      };
    }

    // Must not already be completed
    if (state.scenarioFacts.reset_done === true) {
      return {
        kind: "DENY",
        reason: "That action is no longer valid.",
      };
    }

    return { kind: "ALLOW", plan: { kind: "ConfirmReset" } };
  }

  // set_new_password gating rule
  if (command.kind === "set_new_password") { 
    if (state.executionState !== "RUNNING") { 
      return { kind: "DENY", reason: "Must be in a running session." }; 
    } 

    if (state.scenarioFacts?.kind !== "password_reset") {
      return { 
        kind: "DENY",
        reason: "set_new_password only applies in password_reset.", 
      }; 
    } 

    if (state.scenarioFacts.identity_verified !== true) {
      return {
        kind: "DENY",
        reason: PROCEDURE_NOT_RECOGNIZED,
      };
    }

    if (state.scenarioFacts.code_sent !== true) {
      return {
        kind: "DENY",
        reason: PROCEDURE_NOT_RECOGNIZED,
      };
    }

    if (state.scenarioFacts.reset_done !== true) {
      return {
        kind: "DENY",
        reason: PROCEDURE_NOT_RECOGNIZED,
      };
    } 

    return { kind: "ALLOW", plan: { kind: "SetNewPassword" } };
  }

  // Safety fallback (should be unreachable with current Command union)
  return { kind: "DENY", reason: "Command not supported." };
}
