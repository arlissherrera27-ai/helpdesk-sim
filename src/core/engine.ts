import { Decision, LogEvent, SimState } from "./types";
import { parseCommand } from "./parse";
import { decide } from "./decide";
import { executePlan } from "./execute";
import { applyPatch } from "./update";
import { evaluateRun } from "./score";

export type EngineOutput = {
  state: SimState;
  message: string;
  decision: Decision;
};

// Engine: runs the pipeline (Parse → Decide → Execute → Update).
export function handleInput(state: SimState, inputRaw: string): EngineOutput {
  const command = parseCommand(inputRaw);
  const decision = decide(state, command);

  // 3F Proof #2 — Lock B (Engine tripwire):
  // If parse ever yields an unknown command, the engine must observe that decision DENIES it.
  // If not, crash loudly (unknown must never execute).
  if ((command as any).kind === "unknown") {
    const denied = decision.kind === "DENY";
    const correctlyLabeled =
      typeof (decision as any).reason === "string" &&
      (decision as any).reason.toLowerCase().includes("unknown");

    if (!denied || !correctlyLabeled) {
      throw new Error(
        `INVARIANT VIOLATION: unknown command was not hard-denied\n` +
          `command.kind=${(command as any).kind}\n` +
          `decision.kind=${(decision as any).kind}\n` +
          `decision.reason=${(decision as any).reason}`
      );
    }
  }


  // Deny: no mutation (for this first slice)
  if (decision.kind === "DENY") {
    const message =
      command.kind === "unknown" ? `[PARSE] ${decision.reason}` : decision.reason;

    const logEvent: LogEvent = {
      command: command.kind,
      decision: "DENY",
      plan: null,
      outcome: "denied",
      timestamp: new Date().toISOString(),
    };

    const nextState = applyPatch(state, {}, logEvent);

    return { state: nextState, message, decision };
  }

  // ReadOnly: execute view logic (output only), prove no mutation, return to caller
  if (decision.plan.kind === "ReadOnly") {
    const before = JSON.stringify(state);
    let message = "";

    if (decision.plan.view === "HELP") {
      let commands: string[] = [];

      if (state.executionState === "LOBBY") {
        if (state.scenario === null) {
          commands = ["select <scenario>", "status", "help"];
        } else {
          commands = ["start", "status", "help"];
        }
      } else if (state.executionState === "RUNNING") {
        commands = ["status", "restart", "quit"];
      }

      message = `Available commands:\n${commands.join("\n")}`;
    } else if (decision.plan.view === "DEBUG") {
      message = JSON.stringify(state, null, 2);
    } else if (decision.plan.view === "STATUS") {
      const resultLine = state.result
        ? `\nResult: ${state.result.completion} — Score: ${state.result.totalScore} — Mistakes: ${state.result.mistakes}`
        : "";
      
        message =
    `STATUS:

Scenario: ${state.scenario ?? "none"}
Attempt: ${state.attempt?.number ?? "none"}
State: ${state.executionState}${resultLine}`;
    } else {
      message = `VIEW: ${decision.plan.view}`;
    }

    const after = JSON.stringify(state);
    if (after !== before) {
      throw new Error(
        `MUTATION DETECTED (ReadOnly)\nBEFORE:\n${before}\nAFTER:\n${after}`
      );
    }

    const logEvent: LogEvent = {         
      command: command.kind,              
      decision: "ALLOW",                
      plan: decision.plan.kind,           
      outcome: "success",                  
      timestamp: new Date().toISOString(), 
    };                                     

    const nextState = applyPatch(state, {}, logEvent);

    return { state: nextState, message, decision };
  }

  const patch = executePlan(state, decision.plan);

  // If execute failed, show the error and DO NOT mutate state.
  if (patch.error) {
    const logEvent: LogEvent = {
      command: command.kind,
      decision: "ALLOW",
      plan: decision.plan.kind,
      outcome: "error",
      timestamp: new Date().toISOString(),
    };

    const nextState = applyPatch(state, {}, logEvent);

    return { state: nextState, message: `[EXECUTE] ${patch.error.message}`, decision };
  }

  const logEvent: LogEvent = {
    command: command.kind,
    decision: "ALLOW",
    plan: decision.plan.kind,
    outcome: "success",
    timestamp: new Date().toISOString(),
  };

  let finalPatch = patch;

  if (patch.result?.completion === "PASS" || patch.result?.completion === "FAIL") {
    const score = evaluateRun([...state.runLog, logEvent]);
    finalPatch = { ...patch, result: score };
  }

  const nextState = applyPatch(state, finalPatch, logEvent);

  let message = "";

if (finalPatch.result) {
  message = 
    `${finalPatch.result.completion} — Score: ${finalPatch.result.totalScore} — Mistakes: ${finalPatch.result.mistakes}\n\n` +
    `Type 'restart' to try again or 'quit' to exit.`;
} else {
  switch (decision.plan.kind) {
    case "StartNewAttempt":
      message = `Customer: I lost access to my password. Can you help me?

What do you do?`;
      break;
    case "QuitAttemptToLobby":
      message = "Session ended. Returned to lobby.";
      break;
    case "VerifyIdentity":
      message = "Identity verified. What do you do next?";
      break;
    case "SendResetCode":
      message = "Reset code sent. What do you do next?";
      break;
    case "ConfirmReset":
      message = "Password reset confirmed. What do you do next?";
      break;
    case "SetNewPassword":
      message = "New password set. You can now log in.";
      break;
    case "SelectScenario":
      message = `Scenario selected: ${decision.plan.scenario_id}`;
      break;
    default:
      message = "[ENGINE] Action completed.";
  }
}

  return { state: nextState, message, decision };
}