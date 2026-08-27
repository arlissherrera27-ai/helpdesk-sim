import type { Decision, LogEvent, SimState } from "./types";
import { parseCommand } from "./parse";
import { decide } from "./decide";
import { executePlan } from "./execute";
import { applyPatch } from "./update";
import { evaluateRun } from "./score";

import {
  getScenarioLabel,
  getScenarioProofLines,
  getScenarioSuccessLines,
  getScenarioStartPrompt,
} from "./scenarioRegistry";

const NEXT_STEP_PROMPTS = {
  default: "What do you do next?",
  continue: "Continue troubleshooting.",
  proceed: "Proceed with the next step.",
  howContinue: "How would you continue?",
};

const CUSTOMER_REACTIONS = {
  acknowledge: {
    okay: "Okay.",
    alright: "Alright.",
    gotIt: "Got it.",
    understood: "Understood.",
    soundsGood: "Sounds good.",
  },

  discovery: {
    makesSense: "That makes sense.",
    explainsIt: "That explains it.",
    understandNow: "I understand now.",
    didntRealize: "I didn’t realize that.",
    thatWouldDoIt: "That would explain the issue.",
  },

  success: {
    worksNow: "Great, it works now.",
    fixed: "That fixed it.",
    thankYou: "Perfect, thank you.",
    backOnline: "Looks like everything is back online.",
    workingAgain: "Everything seems to be working again.",
    appreciateIt: "I appreciate the help.",
  },
};

const FINAL_NEXT_ACTIONS =
  "Type 'restart' to try again, 'quit' to return to the lobby, or 'select scenario' to choose another.";

export type EngineOutput = {
  state: SimState;
  message: string;
  decision: Decision;
};

function assertNeverPlan(plan: never): never {
  throw new Error(
    `[ENGINE MESSAGE INVARIANT] Missing scripted message for execution plan: ${
      (plan as { kind?: string }).kind ?? "unknown"
    }`
  );
}

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
    command.kind === "unknown"
      ? `Unknown procedure:\n"${command.rawInput}"\n\nThis simulator evaluates troubleshooting procedures, not exact wording.\n\nTry describing the procedure you are performing.`
      : decision.reason;

  const mistakeType =
    command.kind === "unknown"
      ? "unknown"
      : message.toLowerCase().includes("already")
        ? "repeated"
        : undefined;

  const attemptedInput =
    command.kind === "unknown" ? command.rawInput : command.kind;

  const logEvent: LogEvent = {
    command: command.kind,
    decision: "DENY",
    plan: null,
    outcome: "denied",
    timestamp: new Date().toISOString(),
    attemptedInput,
    mistakeType,
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
    const score = evaluateRun([...state.runLog, logEvent], patch.result.completion);
    finalPatch = { ...patch, result: score };
  }

  const nextState = applyPatch(state, finalPatch, logEvent);

  let message = "";

if (
  finalPatch.result &&
  nextState.executionState === "COMPLETED"
) {
  
  const { completion, totalScore, mistakes } = finalPatch.result;

  const fullRunLog = [...state.runLog, logEvent];

  const unknownAttempts = fullRunLog
    .filter((event) => event.mistakeType === "unknown")
    .map((event) => event.attemptedInput ?? event.command);

  const repeatedAttempts = fullRunLog
    .filter((event) => event.mistakeType === "repeated")
    .map((event) => event.attemptedInput ?? event.command);

const procedureHelpUsedDuring = state.procedureHelpUsedDuring;

const procedureHelpOpenedCount = state.procedureHelpOpenedCount;

const assistanceUsed =
  procedureHelpOpenedCount > 0 || procedureHelpUsedDuring.length > 0;

  const mistakeSection =
    mistakes > 0
      ? "Mistakes\n" +
        "────────────────────────────\n\n" +
        `Mistake Summary:\n${mistakes}\n\n` +
        (unknownAttempts.length > 0
          ? `Unknown Procedure Attempts (${unknownAttempts.length})\n` +
            unknownAttempts.map((item) => `• ${item}`).join("\n") +
            "\n\n"
          : "") +
        (repeatedAttempts.length > 0
          ? `Repeated Procedure Attempts (${repeatedAttempts.length})\n` +
            repeatedAttempts.map((item) => `• ${item}`).join("\n") +
            "\n\n"
          : "")
      : "";

  if (completion === "PASS") {
const registrySuccessLines = state.scenario
  ? getScenarioSuccessLines(state.scenario)
  : [];

const finalSuccessLine =
  registrySuccessLines.length > 0
    ? registrySuccessLines.join("\n\n") + "\n\n"
    : "";

const proofLines = state.scenario
  ? getScenarioProofLines(state.scenario)
  : [];

const reportTitle =
  state.mode === "practice"
    ? "Practice Result"
    : "Assessment Result";

message =
  finalSuccessLine +
  "PASS\n\n" +
reportTitle +
"\n────────────────────────────\n\n" +
`Mode:\n${state.mode === "practice" ? "Practice" : "Assessment"}\n\n` +
(state.mode === "assessment"
  ? `Assessment Integrity:\n${
      state.assessmentIntegrity === "converted_to_practice"
        ? "Converted to Practice"
        : "Maintained"
    }\n\n`
  : "") +
`Score:\n${totalScore}\n\n` +
(assistanceUsed
  ? "Assistance\n" +
    "────────────────────────────\n\n" +
    "Procedure Help Used During:\n" +
    procedureHelpUsedDuring.map((item) => `• ${item}`).join("\n") +
    "\n\n"
  : "Evidence\n" +
    "────────────────────────────\n\n" +
    proofLines.map((line) => `- ${line}`).join("\n") +
    "\n- Completed all required recovery procedures\n" +
    "- Followed the approved recovery workflow\n\n" +
    "────────────────────────────\n\n" +
    `Assistance Level:\n${assistanceUsed ? "Procedure Help Used" : "None"}\n\n` +
    `Procedure Help Opened:\n${procedureHelpOpenedCount} ${
      procedureHelpOpenedCount === 1 ? "time" : "times"
    }\n\n`) +
mistakeSection +
(assistanceUsed
  ? "Assessment Notes\n" +
    "────────────────────────────\n\n" +
    "The procedure was completed successfully with additional assistance during the recovery process.\n\n"
  : "") +
  FINAL_NEXT_ACTIONS;
    
} else {
  
message =
"FAIL\n\n" +
`Mode: ${state.mode === "practice" ? "Practice" : "Assessment"}\n\n` +
`Assessment Integrity: ${
  state.assessmentIntegrity === "converted_to_practice"
    ? "Converted to Practice"
    : "Maintained"
}\n\n` +
`Score: ${totalScore} — Mistakes: ${mistakes}\n\n` +
    "Evaluation:\n" +
`- Did not complete the ${
  state.scenario
    ? getScenarioLabel(state.scenario)
    : "selected"
} procedure successfully\n` +
    "- Recovery flow was broken before completion\n" +
    `- Mistakes recorded: ${mistakes}\n\n` +
    FINAL_NEXT_ACTIONS;
}
  
} else {
  switch (decision.plan.kind) {
    case "StartNewAttempt": {
      const activeScenario = nextState.scenario;

      const registryStartPrompt = activeScenario
        ? getScenarioStartPrompt(activeScenario)
        : "";

message = registryStartPrompt
  ? registryStartPrompt
  : `Customer issue received.

  What is your first troubleshooting step?`;

      break;
    }
    case "QuitAttemptToLobby":
      message = `Returned to lobby.

    Welcome to the Helpdesk Simulator.

    Select a scenario to begin.`;  
      break;
    case "VerifyIdentity":
  message = 
    "Agent: First, I need to verify that I’m working with the authorized account owner before making changes.\n\n" + 
    "System: Identity verification completed. The requester is confirmed as authorized for this account, so account-specific troubleshooting can proceed.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

    case "RequestUnlock":
  message =
    "Agent: I’m requesting an account unlock after confirming the user is authorized for this account.\n\n" +
    "System: The unlock request has been accepted. The account is eligible to be unlocked after verification.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.continue;
  break;

case "ConfirmUnlock":
  if (
    state.scenario === "account_lockout_saved_credentials" &&
    state.scenarioFacts?.kind ===
      "account_lockout_saved_credentials"
  ) {
    if (!state.scenarioFacts.first_sign_in_attempted) {
      message =
        "Agent: I’m completing the initial account unlock so access can be tested.\n\n" +
        "System: The account has been unlocked successfully. Sign-in is available, but the account must still be tested to confirm the lockout does not return.\n\n" +
        "Customer: Alright, I’ll try signing in.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m completing the second account unlock now that the outdated saved credentials have been corrected.\n\n" +
      "System: The account has been unlocked successfully after correcting the repeated authentication source. The account is ready for final sign-in verification.\n\n" +
      "Customer: Okay, I’m ready to try again.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m completing the account unlock and verifying that access has been restored.\n\n" +
    "System: The account has been unlocked successfully. Authentication restrictions have been removed and sign-in access is available again.\n\n" +
    "Customer: Perfect, I can sign in now.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "ReviewFailedAuthenticationAttempts":
  message =
    "Agent: I’m reviewing the failed authentication attempts to determine why the account locked again.\n\n" +
    "System: Multiple automatic sign-in attempts are coming from saved credentials stored on another device. Those repeated failures are immediately locking the account again after each unlock.\n\n" +
    "Customer: That makes sense. I forgot I changed my password on my laptop but not my phone.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "UpdateSavedCredentials":
  message =
    "Agent: I’m updating the outdated saved credentials on the affected device.\n\n" +
    "System: The incorrect saved password has been replaced successfully. The repeated authentication source has been corrected, but the account is still locked and must be unlocked again before final sign-in testing.\n\n" +
    "Customer: Alright, let’s unlock it again.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

  case "CheckVpnAccess":
  if (state.scenario === "vpn_mfa_dependency_missing") {
    message =
      "Agent: I’m checking whether remote network access is assigned to this user account.\n\n" +
      "System: VPN access is already assigned correctly. The connection issue is being caused by another dependency.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking whether remote network access is assigned to this user account.\n\n" +
    "System: VPN access is not currently assigned to the user account. Without that assignment, remote connection attempts will fail.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "EnableVpnAccess":
  message =
    "Agent: I’m assigning VPN access to the user account now.\n\n" +
    "System: VPN access has been assigned successfully. The account is now permitted to connect to the remote work network.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "ConfirmConnection":
  if (state.scenario === "vpn_mfa_dependency_missing") {
    message =
      "Agent: I’m testing the VPN connection now that MFA has been configured.\n\n" +
      "System: The user can successfully complete MFA and connect through the VPN. Remote access has been restored.\n\n" +
      "Customer: That worked, I’m connected now.\n\n" + NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m testing the VPN connection to confirm remote access is working.\n\n" +
    "System: The user can successfully connect through the VPN. Remote network access has been restored.\n\n" +
    "Customer: That worked, I’m connected now.\n\n" + NEXT_STEP_PROMPTS.default;
  break;
  
    case "CheckEmailStatus":
  if (state.scenario === "email_not_sending_outbox") {
    message =
      "Agent: I’m checking the email client status to confirm whether the account and client are available for sending.\n\n" +
      "System: The email client is online and connected successfully. The client itself is available, so the outgoing email failure must be reproduced and investigated further.\n\n" +
      "Customer: So Outlook is connected, but the message still won’t send?\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the email client status to see why messages are not sending.\n\n" +
    "System: The email client is currently offline. Because the client is offline, outgoing email cannot be transmitted.\n\n" +
    "Customer: Oh, I didn’t realize that.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "EnableEmailClient":
  message =
    "Agent: I’m bringing the email client back online so outgoing messages can send again.\n\n" +
    "System: The email client is now online. Outgoing messages can now be transmitted normally.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

  case "CheckOutbox":
  message =
    "Agent: Since the sending failure was reproduced while the email client was online, I’m checking the Outbox for a message that did not complete transmission.\n\n" +
    "System: A message is stuck in the Outbox and remains in a pending send state. That stuck message is preventing outgoing email from completing normally.\n\n" +
    "Customer: I can see it sitting there now.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "SendStuckOutboxEmail":
  message =
    "Agent: I’m releasing and resending the message that is stuck in the Outbox.\n\n" +
    "System: The stuck message has been released from its pending state and sent successfully. Outgoing email is ready for final verification.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "SendTestEmail":
  if (
    state.scenario === "email_not_sending_outbox" &&
    state.scenarioFacts?.kind ===
      "email_not_sending_outbox"
  ) {
    if (!state.scenarioFacts.first_send_test_completed) {
      message =
        "Agent: I’m sending a test email to reproduce the outgoing email problem.\n\n" +
        "System: The test message does not leave the Outbox even though the email client is online. The sending failure has been reproduced and the Outbox should be inspected next.\n\n" +
        "Customer: It’s still sitting there and hasn’t sent.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m sending another test email after releasing the stuck Outbox message.\n\n" +
      "System: The test email left the Outbox and sent successfully. Outgoing email is functioning normally again.\n\n" +
      "Customer: Great, my email is sending now.";
    break;
  }

  if (state.scenario === "email_not_sending") {
    message =
      "Agent: I’m sending a test email to confirm outgoing email is working.\n\n" +
      "System: The test email was sent successfully. Outgoing email delivery has been restored.\n\n" +
      "Customer: Got it, it works now.";
  } else if (
    state.scenario ===
      "not_receiving_email_inbox_rule_redirecting" &&
    state.scenarioFacts?.kind ===
      "not_receiving_email_inbox_rule_redirecting"
  ) {
    if (
      !state.scenarioFacts.first_receive_test_completed
    ) {
      message =
        "Agent: I’m sending a test email to verify incoming delivery after resynchronizing the mailbox.\n\n" +
        "System: The test message reached the mailbox, but it still does not appear in the Inbox. Normal synchronization troubleshooting did not resolve the issue.\n\n" +
        "Customer: I still don’t see it in my Inbox.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m sending another test email to verify incoming delivery after correcting the mailbox rule.\n\n" +
      "System: The test message now appears in the Inbox successfully.\n\n" +
      "Customer: Great, I can see it now.";
  } else if (state.scenario === "not_receiving_email") {
    message =
      "Agent: I’m sending a test email to verify incoming delivery.\n\n" +
      "System: The test message arrived successfully after the mailbox was resynchronized.\n\n" +
      "Customer: Great, I received it.";
  } else if (
    state.scenario === "mailbox_full" ||
    state.scenario ===
      "mailbox_full_archive_policy_not_applied"
  ) {
    message =
      "Agent: I’m sending a test email to confirm new messages can be delivered.\n\n" +
      "System: The test email was delivered successfully. Mailbox space is available and new email can arrive normally.\n\n" +
      "Customer: Great, I received it.";
  }

  break;

case "CheckMailboxStorage":
  if (
    state.scenario ===
      "mailbox_full_archive_policy_not_applied"
  ) {
    message =
      "Agent: I’m checking mailbox storage to determine why new email is not arriving.\n\n" +
      "System: The mailbox has reached its storage limit. The expected archive process has not been clearing older email, so the mailbox cannot accept new messages.\n\n" +
      "Customer: I thought older email was supposed to archive automatically.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking mailbox storage to see why new emails are not arriving.\n\n" +
    "System: The mailbox has reached its storage limit. Until space is recovered, new emails cannot be delivered.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckArchivePolicy":
  message =
    "Agent: I’m checking whether the required mailbox archive policy is assigned and active.\n\n" +
    "System: The mailbox does not currently have the required archive policy applied. Without the policy, older email is not being moved into the archive automatically.\n\n" +
    "Customer: That explains why the mailbox keeps filling up.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "ApplyArchivePolicy":
  message =
    "Agent: I’m applying the required archive policy so older email can be moved out of the primary mailbox.\n\n" +
    "System: The archive policy has been applied successfully. The mailbox is now configured to archive eligible older email.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "ArchiveOldEmails":
  if (
    state.scenario ===
      "mailbox_full_archive_policy_not_applied"
  ) {
    message =
      "Agent: I’m archiving older email now that the required archive policy is in place.\n\n" +
      "System: Eligible older email has been moved into the archive. Storage space is now available in the primary mailbox for new messages.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m archiving old emails to recover mailbox storage space.\n\n" +
    "System: Old emails have been archived. Mailbox storage is now available for new incoming messages.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckSyncSettings":
  if (
    state.scenario ===
      "email_client_not_syncing_cached_session_stuck"
  ) {
    message =
      "Agent: I’m checking the email synchronization settings to determine why new messages are not updating.\n\n" +
      "System: The synchronization settings are enabled and configured correctly. The client should be able to update, so another condition is blocking the connection.\n\n" +
      "Customer: So the sync settings themselves are okay?\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  if (
    state.scenario ===
      "not_receiving_email_inbox_rule_redirecting"
  ) {
    message =
      "Agent: I’m checking the mailbox synchronization status.\n\n" +
      "System: The mailbox synchronization settings are available and can be refreshed normally. No obvious synchronization failure has been identified yet.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  if (state.scenario === "not_receiving_email") {
    message =
      "Agent: I’m checking the mailbox synchronization status.\n\n" +
      "System: The mailbox is not updating incoming messages normally and needs to be resynchronized.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the email synchronization settings.\n\n" +
    "System: Email synchronization is disabled. Because synchronization is disabled, new messages cannot update in the email client.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "ResyncEmailClient":
  if (
    state.scenario ===
      "email_client_not_syncing_cached_session_stuck"
  ) {
    message =
      "Agent: I’m resynchronizing the email client now that the stale session has been cleared.\n\n" +
      "System: The client has established a fresh mailbox connection and synchronization has restarted successfully.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  if (
    state.scenario ===
      "not_receiving_email_inbox_rule_redirecting"
  ) {
    message =
      "Agent: I’m resynchronizing the mailbox to refresh incoming messages.\n\n" +
      "System: The mailbox synchronization completed successfully. Incoming delivery should now be tested.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  if (state.scenario === "not_receiving_email") {
    message =
      "Agent: I’m resynchronizing the mailbox to restore incoming message updates.\n\n" +
      "System: The mailbox has been resynchronized successfully and is ready for an incoming delivery test.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m restoring email synchronization now.\n\n" +
    "System: Email synchronization has been restored successfully. The client can now update new messages normally.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "TestEmailSync":
  if (
    state.scenario ===
      "email_client_not_syncing_cached_session_stuck"
  ) {
    message =
      "Agent: I’m testing email synchronization after resetting the cached session and reconnecting the client.\n\n" +
      "System: New messages are updating successfully. The stale-session dependency has been resolved and mailbox synchronization is working normally.\n\n" +
      "Customer: Great, my new emails are showing up again.";
    break;
  }

  message =
    "Agent: I’m testing email synchronization now.\n\n" +
    "System: The email client is synchronizing new messages normally. Message updates are being received successfully.\n\n" +
    "Customer: Great, my emails are updating again.";
  break;

case "CheckSharedMailboxMembership":
  if (
    state.scenario ===
      "shared_mailbox_outlook_profile_not_updated" ||
    state.scenario ===
      "shared_mailbox_automapping_missing"
  ) {
    message =
      "Agent: I’m checking whether the user already has permission to the Finance shared mailbox.\n\n" +
      "System: The user already has Full Access to the shared mailbox. The permission is assigned correctly, so another configuration condition is preventing the mailbox from appearing in Outlook.\n\n" +
      "Customer: So I already have access?\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking shared mailbox membership and permissions.\n\n" +
    "System: The user is no longer assigned to the shared mailbox. Without mailbox membership, access is denied.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "GrantSharedMailboxAccess":
  message =
    "Agent: I’m restoring shared mailbox permissions now.\n\n" +
    "System: Shared mailbox access permissions have been restored successfully. The user is now authorized to open the mailbox.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

  case "CheckSharedMailboxAutomapping":
  message =
    "Agent: Since the user already has Full Access but the mailbox still does not appear automatically, I’m checking the shared mailbox auto-mapping configuration.\n\n" +
    "System: Auto-mapping is disabled for this shared mailbox permission. Outlook therefore does not discover and load the Finance mailbox automatically even though the user has Full Access.\n\n" +
    "Customer: That explains why I have access but never see it in Outlook.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "EnableSharedMailboxAutomapping":
  message =
    "Agent: I’m enabling auto-mapping for the user’s Finance shared mailbox permission.\n\n" +
    "System: Shared mailbox auto-mapping has been enabled successfully. Outlook can now discover the mailbox automatically, but the application must be restarted before the updated configuration can be loaded.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckOutlookMailboxConfiguration":
  message =
    "Agent: I’m checking the Outlook mailbox configuration to determine why the shared mailbox still is not visible.\n\n" +
    "System: The mailbox has not been added to the Outlook profile. Although the user already has permission, Outlook cannot display the mailbox until it is added.\n\n" +
    "Customer: That would explain why I never saw it.\n\n" +
    NEXT_STEP_PROMPTS.default;
break;

case "AddSharedMailboxToOutlookProfile":
  message =
    "Agent: I’m adding the shared mailbox to the Outlook profile now.\n\n" +
    "System: The shared mailbox has been added successfully. Outlook is now configured to display the mailbox for this user.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
break;

case "TestSharedMailboxAccess":
  if (
    state.scenarioFacts?.kind ===
    "shared_mailbox_outlook_profile_not_updated"
  ) {
    if (!state.scenarioFacts.shared_mailbox_access_tested) {
      message =
        "Agent: I’m testing shared mailbox access now.\n\n" +
        "System: The user still cannot see the shared mailbox even though the required permissions are already assigned. Another configuration issue is preventing Outlook from displaying it.\n\n" +
        "Customer: It’s still missing.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m testing shared mailbox access after updating the Outlook profile.\n\n" +
      "System: The shared mailbox appears successfully in Outlook. The Outlook profile has been updated correctly and access has been restored.\n\n" +
      "Customer: Great, I can see the Finance mailbox now.";
    break;
  }

  if (
    state.scenarioFacts?.kind ===
    "shared_mailbox_automapping_missing"
  ) {
    if (!state.scenarioFacts.shared_mailbox_access_tested) {
      message =
        "Agent: I’m testing whether the Finance shared mailbox appears automatically in Outlook.\n\n" +
        "System: The mailbox still does not appear even though the user has Full Access. The permission exists, but Outlook is not automatically loading the mailbox.\n\n" +
        "Customer: It’s still not showing up anywhere.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m testing shared mailbox access after enabling auto-mapping and restarting Outlook.\n\n" +
      "System: Outlook discovered and loaded the Finance shared mailbox automatically. The mailbox appears in the folder list and opens successfully.\n\n" +
      "Customer: Great, the Finance mailbox is showing up now.";
    break;
  }

  message =
    "Agent: I’m testing shared mailbox access now.\n\n" +
    "System: The shared mailbox is accessible normally. Mailbox access has been restored successfully.\n\n" +
    "Customer: Great, I can see the mailbox again.";
  break;
  
  case "CheckAttachmentSize":
  message =
    "Agent: I’m checking the attachment size to see why the email is not sending.\n\n" +
    "System: The attachment exceeds the allowed email size limit. Messages containing this attachment cannot be transmitted until the size is reduced.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "CompressAttachment":
  message =
    "Agent: I’m compressing the attachment so it can be sent by email.\n\n" +
    "System: The attachment has been compressed and is now within the allowed size limit. The email can now be transmitted successfully.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.gotIt}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "CheckEmailLoginStatus":
  if (
    state.scenario ===
      "email_client_not_syncing_cached_session_stuck"
  ) {
    message =
      "Agent: I’m checking the email account session to see whether authentication is blocking synchronization.\n\n" +
      "System: The email client is holding a stale authenticated session. The account appears signed in, but the cached session cannot communicate with the mailbox correctly.\n\n" +
      "Customer: That would explain why it looks connected but never updates.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  if (
    state.scenario ===
      "email_login_cached_credentials"
  ) {
    message =
      "Agent: I’m checking the email login status to confirm whether the account itself is available for authentication.\n\n" +
      "System: The email account is active and the current password is valid, but the email application is still failing authentication. The failure should be reproduced before checking locally stored credentials.\n\n" +
      "Customer: The new password works on the website, but the email app still rejects it.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the email login status to see why sign-in is failing.\n\n" +
    "System: The email account session is stuck and cannot complete authentication successfully. The session must be reset before sign-in can proceed.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

  case "CheckSavedEmailCredentials":
  message =
    "Agent: Since the current password works elsewhere but the email application still fails, I’m checking the saved email credentials on this device.\n\n" +
    "System: The email application is storing the user’s previous password. The outdated saved credential is being submitted automatically during each login attempt.\n\n" +
    "Customer: That makes sense. I changed my password recently but never updated it in the email app.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "UpdateSavedEmailCredentials":
  message =
    "Agent: I’m replacing the outdated saved email password with the user’s current credentials.\n\n" +
    "System: The locally stored email credentials have been updated successfully. The email application can now authenticate using the current password.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "ResetEmailSession":
  if (
    state.scenario ===
      "email_client_not_syncing_cached_session_stuck"
  ) {
    message =
      "Agent: I’m resetting the cached email session so the client can establish a clean mailbox connection.\n\n" +
      "System: The stale authenticated session has been cleared successfully. The client can now establish a fresh connection to the mailbox.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m resetting the email session so the account can sign in cleanly.\n\n" +
    "System: The email session has been reset successfully. The authentication blockage has been cleared.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "TestEmailLogin":
  if (
    state.scenario ===
      "email_login_cached_credentials" &&
    state.scenarioFacts?.kind ===
      "email_login_cached_credentials"
  ) {
    if (
      !state.scenarioFacts.first_email_login_tested
    ) {
      message =
        "Agent: I’m testing email login to reproduce the authentication failure before changing any saved credentials.\n\n" +
        "System: The email application still rejects the login even though the account is active and the current password works elsewhere. A locally stored credential may be overriding the password being entered.\n\n" +
        "Customer: It failed again in the email app, but I can still sign in through the website.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m testing email login again after updating the saved credentials.\n\n" +
      "System: Email authentication completed successfully using the current password. The outdated locally stored credential is no longer interfering with sign-in.\n\n" +
      "Customer: Great, I can access my email again.";
    break;
  }

  message =
    "Agent: I’m testing email sign-in now.\n\n" +
    "System: Email sign-in is working normally. The user can successfully authenticate and access the mailbox.\n\n" +
    "Customer: Great, I can access my email now.";
  break;

case "CheckInboxFilters":
  if (
    state.scenario ===
      "not_receiving_email_inbox_rule_redirecting"
  ) {
    message =
      "Agent: I’m reviewing the mailbox inbox rules after normal synchronization troubleshooting did not restore Inbox delivery.\n\n" +
      "System: An inbox rule is redirecting incoming messages away from the Inbox.\n\n" +
      "Customer: That explains why I wasn’t seeing them.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the inbox filters to see if emails are being blocked or redirected.\n\n" +
    "System: A filter is currently redirecting incoming emails away from the inbox. This prevents expected messages from appearing where the user looks for them.\n\n" +
    "Customer: Oh wow.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "DisableInboxFilter":
  if (
    state.scenario ===
      "not_receiving_email_inbox_rule_redirecting"
  ) {
    message =
      "Agent: I’m disabling the inbox rule that is redirecting incoming mail.\n\n" +
      "System: The redirecting inbox rule has been disabled successfully.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m disabling that filter so incoming emails reach the inbox normally.\n\n" +
    "System: The filter has been removed. Incoming emails will now be delivered to the inbox instead of being redirected.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckWifiStatus":
  if (
    state.scenario ===
      "cannot_connect_wifi_corrupted_profile"
  ) {
    message =
      "Agent: I’m checking the device’s wireless settings to confirm Wi-Fi is enabled.\n\n" +
      "System: Wi-Fi is enabled and the device can detect the wireless network, but the saved connection is still failing.\n\n" +
      "Customer: I can see the network, but it still won’t connect.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the device’s wireless settings to see why it is not connecting.\n\n" +
    "System: Wi-Fi is currently turned off on the device. Because wireless networking is disabled, the device cannot detect or connect to available networks.\n\n" +
    "Customer: Oh okay.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "EnableWifi":
  message =
    "Agent: I’m turning Wi-Fi back on so the device can connect.\n\n" +
    "System: Wi-Fi has been enabled. The device can now detect available wireless networks and connect normally.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestConnection":
  if (
    state.scenario ===
      "cannot_connect_wifi_corrupted_profile" &&
    state.scenarioFacts?.kind ===
      "cannot_connect_wifi_corrupted_profile"
  ) {
    if (!state.scenarioFacts.first_connection_tested) {
      message =
        "Agent: I’m testing the Wi-Fi connection now that wireless networking has been confirmed.\n\n" +
        "System: The connection still fails even though Wi-Fi is enabled and the network is available. The saved wireless profile may be preventing a clean connection.\n\n" +
        "Customer: It still won’t connect.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m testing the Wi-Fi connection after reconnecting with a clean wireless profile.\n\n" +
      "System: The device connected successfully using the new Wi-Fi profile. Wireless network access has been restored.\n\n" +
      "Customer: Great, I’m connected again.";
    break;
  }

  message =
    "Agent: I’m testing the connection now to confirm network access is restored.\n\n" +
    "System: The device successfully connected to Wi-Fi. Network access has been restored.\n\n" +
    "Customer: That worked, thanks.";
  break;

  case "CheckWifiProfile":
  message =
    "Agent: Since the connection still fails, I’m checking the saved Wi-Fi profile for corruption.\n\n" +
    "System: The saved Wi-Fi profile contains invalid connection data. The corrupted profile is preventing the device from authenticating to the wireless network correctly.\n\n" +
    "Customer: That would explain why it suddenly stopped connecting.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "RemoveCorruptedWifiProfile":
  message =
    "Agent: I’m removing the corrupted saved Wi-Fi profile from the device.\n\n" +
    "System: The damaged wireless profile has been removed successfully. The device can now create a clean connection profile.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "ReconnectWifi":
  message =
    "Agent: I’m reconnecting the device to Wi-Fi so it can create a clean wireless profile.\n\n" +
    "System: The device has reconnected to the wireless network using a newly created Wi-Fi profile. The connection is ready to be tested.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckEthernetConnection":
  message =
    "Agent: I’m checking the wired network connection and ethernet cable status.\n\n" +
    "System: The ethernet cable is disconnected from the device. Without a physical network connection, the device cannot access the wired network.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "ReconnectEthernetCable":
  message =
    "Agent: I’m reconnecting the ethernet cable now.\n\n" +
    "System: The ethernet cable is securely connected and the wired network connection is active. The device can now communicate on the network.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "CheckNetworkSpeed":
  message =
    "Agent: I’m checking the network speed and connection quality.\n\n" +
    "System: The network connection is active, but performance is significantly degraded. The connection is operating below expected performance levels.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;


case "CheckNetworkStatus":
  if (state.scenario === "internet_no_access_proxy") {
    message =
      "Agent: I’m checking the network status to confirm whether the device is connected locally.\n\n" +
      "System: The device is connected to the local network, but websites and online services are still unavailable. Local connectivity is working, so internet traffic must be tested next.\n\n" +
      "Customer: It shows connected, but nothing online will load.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the network status to see why internet access is unavailable.\n\n" +
    "System: The device is connected to the local network, but internet access is not currently available. The connection needs to be refreshed before internet traffic can pass normally.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

  case "CheckProxySettings":
  message =
    "Agent: Since the device is connected but still cannot reach the internet, I’m checking the proxy settings.\n\n" +
    "System: An incorrect proxy configuration is forcing internet traffic through an unavailable proxy server. This configuration is preventing websites and online services from loading.\n\n" +
    "Customer: That would explain why it says connected but nothing opens.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "DisableIncorrectProxy":
  message =
    "Agent: I’m disabling the incorrect proxy configuration so internet traffic can use the normal connection path.\n\n" +
    "System: The incorrect proxy configuration has been disabled successfully. Internet traffic is no longer being routed through the unavailable proxy server.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckNetworkAdapter":
  if (state.scenario === "slow_network_connection") {
    message =
      "Agent: I’m checking the network adapter to see whether it is contributing to the degraded connection speed.\n\n" +
      "System: The network adapter is active, but its connection state is degraded. Restarting the adapter should refresh the connection path and restore normal performance.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the network adapter to determine whether the connection issue is adapter-related.\n\n" +
    "System: The network adapter is present but is not communicating correctly with the network stack. Restarting the adapter should refresh the connection and restore normal communication.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "RestartNetworkAdapter":
  if (state.scenario === "slow_network_connection") {
    message =
      "Agent: I’m restarting the network adapter to restore normal connection performance.\n\n" +
      "System: The network adapter restarted successfully. The connection has been refreshed and degraded network performance has been cleared.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  if (state.scenario === "internet_no_access_proxy") {
    message =
      "Agent: I’m restarting the network adapter so the corrected proxy configuration is applied to a fresh network connection.\n\n" +
      "System: The network adapter restarted successfully. The connection has been refreshed without the incorrect proxy configuration and is ready for final testing.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m restarting the network adapter to refresh the connection.\n\n" +
    "System: The network adapter has restarted successfully. The network connection has been refreshed and internet access can be tested again.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "TestInternetConnection":
  if (
    state.scenario === "internet_no_access_proxy" &&
    state.scenarioFacts?.kind === "internet_no_access_proxy"
  ) {
    if (!state.scenarioFacts.first_internet_tested) {
      message =
        "Agent: I’m testing internet access now that local network connectivity has been confirmed.\n\n" +
        "System: Internet access still fails even though the device is connected to the local network. A configuration issue may be blocking outbound web traffic.\n\n" +
        "Customer: It still won’t load anything online.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m testing internet access after disabling the incorrect proxy and refreshing the network connection.\n\n" +
      "System: Internet access is working successfully. The device can now reach websites and online services through the normal network connection.\n\n" +
      "Customer: Great, everything online is loading again.";
    break;
  }

  message =
    "Agent: I’m testing internet connectivity now to confirm access is restored.\n\n" +
    "System: Internet access has been restored successfully. The device can reach online services again.\n\n" +
    "Customer: Great, the internet is working now.";
  break;

case "CheckRunningApps":
  message =
    "Agent: I’m checking what applications are currently running on the computer.\n\n" +
    "System: Several unnecessary applications are consuming system resources. Their combined usage is reducing overall system performance.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.proceed;
  break;

case "CloseUnnecessaryApps":
  message =
    "Agent: I’m closing the unnecessary applications to free up system resources.\n\n" +
    "System: The unnecessary applications have been closed successfully. System resources are now available for normal operation.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestPerformance":
  if (state.scenario === "too_many_apps_running") {
    message =
      "Agent: I’m testing system performance now to confirm the computer is responding normally.\n\n" +
      "System: Resource usage has returned to normal levels and system responsiveness has improved.\n\n" +
      "Customer: It’s much better now.";
  } else if (state.scenario === "low_memory") {
    message =
      "Agent: I’m testing system performance now to confirm memory usage is under control.\n\n" +
      "System: Memory usage has returned to an acceptable level and the computer is responding normally.\n\n" +
      "Customer: It’s much better now.";
  }

  break;

case "CheckPrinterStatus":
  if (state.scenario === "printer_wrong_default_printer") {
    message =
      "Agent: I’m checking the printer status to confirm whether the office printer is available.\n\n" +
      "System: The office printer is online and available. The device itself is not preventing the print job from completing.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the printer status to see why it is not printing.\n\n" +
    "System: The printer is currently offline and unavailable to the computer. Print jobs cannot be processed until connectivity is restored.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckDefaultPrinter":
  message =
    "Agent: I’m checking which printer is currently set as the default printer.\n\n" +
    "System: A different printer is currently selected as the default. Print jobs are being sent to the wrong device.\n\n" +
    "Customer: That explains why nothing was printing here.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "SetDefaultPrinter":
  message =
    "Agent: I’m setting the correct office printer as the default printer.\n\n" +
    "System: The correct office printer has been set as the default. Future print jobs will now be sent to this printer.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "RestartPrinter":
  message =
    "Agent: I’m restarting the printer so it can reconnect properly.\n\n" +
    "System: The printer has restarted successfully and is back online. The device can now accept print jobs again.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "PrintTestPage":
  if (state.scenario === "printer_wrong_default_printer") {
    message =
      "Agent: I’m printing a test page now that the correct default printer has been selected.\n\n" +
      "System: The test page printed successfully from the correct office printer. The default printer setting has been verified.\n\n" +
      "Customer: Great, it printed from the right printer.";
    break;
  }

  message =
    "Agent: I’m printing a test page to confirm the printer is working.\n\n" +
    "System: The test page printed successfully. Printer communication and print functionality have been restored.\n\n" +
    "Customer: Great, it printed.";
  break;

case "CheckDiskSpace":
  message =
    "Agent: I’m checking the computer’s storage usage to see why space is full.\n\n" +
    "System: The device is critically low on storage space due to accumulated temporary files. Until storage is recovered, normal system operation may be affected.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.continue;
  break;

case "ClearTempFiles":
  message =
    "Agent: I’m removing temporary files to recover usable storage space.\n\n" +
    "System: Temporary files were removed successfully. Storage capacity has been recovered and additional space is now available.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "CheckNetworkDriveMapping":
  if (state.scenario === "network_drive_vpn_required_first") {
    message =
      "Agent: I’m checking the network drive mapping now that VPN access is available.\n\n" +
      "System: The network drive mapping is missing from the user profile. The drive must be remapped before access can be restored.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the network drive mapping.\n\n" +
    "System: The network drive mapping is missing from the user profile. The drive must be remapped before access can be restored.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "RemapNetworkDrive":
  message =
    "Agent: I’m remapping the network drive now.\n\n" +
    "System: The network drive has been remapped successfully. Access can now be tested.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "TestNetworkDriveAccess":
  if (state.scenario === "network_drive_vpn_required_first") {
    message =
      "Agent: I’m testing network drive access now that VPN access and drive mapping have been restored.\n\n" +
      "System: The network drive opens successfully. VPN access is active and the drive is available.\n\n" +
      "Customer: Great, I can access it now.";
    break;
  }

  message =
    "Agent: I’m testing network drive access now.\n\n" +
    "System: The network drive opens successfully. Access has been restored.\n\n" +
    "Customer: Great, I can access it now.";
  break;

case "ConfirmStorageAvailable":
  message =
    "Agent: I’m confirming storage availability now that temporary files have been removed.\n\n" +
    "System: Sufficient storage space is now available. The storage capacity issue has been resolved successfully.\n\n" +
    "Customer: Great, that fixed it.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckMemoryUsage":
  message =
    "Agent: I’m checking current memory usage to determine whether system resources are causing the slowdown.\n\n" +
    "System: Memory usage is critically high. Available system memory is limited, which is reducing performance and responsiveness.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;  

case "CloseMemoryHeavyApps":
  message =
    "Agent: I’m closing the applications consuming excessive memory.\n\n" +
    "System: The memory-heavy applications have been closed successfully. Memory usage has dropped and system resources are available again.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "SendResetCode":
  if (state.scenario === "password_reset_recovery_email_never_arrives") {
    message =
      "Agent: I’m sending a password reset code to the verified recovery contact on file.\n\n" +
      "System: A reset code was issued, but the user reports that the recovery email has not arrived.\n\n" +
      "Customer: I refreshed my inbox a few times, but I still don’t see the recovery email.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m sending a password reset code to the verified recovery contact on file.\n\n" +
    "System: A reset code has been issued to the account’s recovery contact.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.gotIt}\n\n` + NEXT_STEP_PROMPTS.default;
  break;
    
  case "ResendResetCode":
  message =
    "Agent: I’m resending the recovery code now that the inbox filter issue has been corrected.\n\n" +
    "System: The recovery email was delivered successfully. The user now has a usable recovery code.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.gotIt}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

  case "VerifyAlternateContact":
  message =
    "Agent: I’m verifying an approved alternate contact before making recovery account changes.\n\n" +
    "System: The alternate contact has been verified successfully. Recovery account information can now be updated.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.gotIt}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "UpdateRecoveryEmail":
  message =
    "Agent: I’m updating the recovery email using the verified alternate contact information.\n\n" +
    "System: The outdated recovery email has been replaced successfully. Password recovery can now continue using the updated contact.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

  case "ConfirmReset":
  message =
    "Agent: I’m confirming the reset code before allowing the password change.\n\n" +
    "System: The reset code has been confirmed. The account is now authorized for a password update.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.gotIt}\n\n` + NEXT_STEP_PROMPTS.default;
  break;
    
  case "SetNewPassword":
  message =
    "Agent: I’m updating the account password using the verified recovery process.\n\n" +
    "System: The password has been updated successfully. The account is ready for sign-in testing.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.gotIt}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

  case "TestSignIn":
  if (
    state.scenario === "account_lockout_saved_credentials" &&
    state.scenarioFacts?.kind ===
      "account_lockout_saved_credentials"
  ) {
    if (!state.scenarioFacts.first_sign_in_attempted) {
      message =
        "Agent: I’m testing sign-in after the initial account unlock.\n\n" +
        "System: Sign-in fails because another device is still using outdated saved credentials. The repeated authentication attempts immediately lock the account again.\n\n" +
        "Customer: It locked me out again right away.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m testing sign-in after updating the saved credentials and unlocking the account again.\n\n" +
      "System: Sign-in completed successfully. The outdated saved credentials are no longer causing repeated authentication failures, and the account remains unlocked.\n\n" +
      "Customer: Great, it’s finally staying signed in now.";
    break;
  }

  message =
    "Agent: I’m testing sign-in now to confirm the new password works.\n\n" +
    "System: Sign-in was successful with the new password. Account access has been fully restored.\n\n" +
    "Customer: Perfect, I’m back in.";
  break;
    
  case "CheckDeviceConnection":
  message =
    "Agent: I’m checking the mouse and keyboard connection to see why the input devices are not responding.\n\n" +
    "System: The mouse and keyboard connection is loose or not being detected correctly by the computer. Until the connection is restored, user input cannot be processed reliably.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "ReconnectDevice":
  message =
    "Agent: I’m reconnecting the mouse and keyboard so the computer can detect them again.\n\n" +
    "System: The input devices have been reconnected successfully. The computer can detect and communicate with them normally.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.gotIt}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestInputDevice":
  message =
    "Agent: I’m testing the mouse and keyboard now to confirm they respond normally.\n\n" +
    "System: The mouse and keyboard are responding normally. Input functionality has been restored.\n\n" +
    "Customer: Great, they’re working now.";
  break;

case "CheckAppStatus":
  if (state.scenario === "application_crash") {
    message =
      "Agent: I’m checking the application status to see why it keeps crashing.\n\n" +
      "System: The application is unstable and crashing during normal use. Reliable operation cannot continue until the issue is cleared.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
    break;
  }

  if (state.scenario === "software_app_license_not_assigned") {
    message =
      "Agent: I’m checking the application status to confirm whether the application is installed and available.\n\n" +
      "System: The application is installed and available on the device. No launch failure is being caused by installation or application availability.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the application status to see why it will not open.\n\n" +
    "System: The application is stuck and cannot complete a normal launch. The application state must be corrected before it can open successfully.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "RestartApplication":
  if (
    state.scenario ===
    "shared_mailbox_automapping_missing"
  ) {
    message =
      "Agent: I’m restarting Outlook so it can load the corrected shared mailbox auto-mapping configuration.\n\n" +
      "System: Outlook restarted successfully and established a fresh mailbox session. The application is ready to rediscover the Finance shared mailbox automatically.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  if (state.scenario === "application_crash") {
    message =
      "Agent: I’m restarting the application to clear the crash state.\n\n" +
      "System: The application restarted successfully. The crash state has been cleared and the application is ready to be tested for stability.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  if (state.scenario === "email_client_corrupted_profile") {
    message =
      "Agent: I’m restarting the email application to rule out a temporary process issue.\n\n" +
      "System: The email application process restarted successfully, but the underlying launch condition has not yet been verified.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m restarting the application so it can launch cleanly.\n\n" +
    "System: The application has been restarted successfully. The stuck launch state has been cleared.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

  case "CheckEmailClientProfile":
  message =
    "Agent: Since the restart did not resolve the launch issue, I’m checking the email client profile for corruption.\n\n" +
    "System: The email client profile contains damaged configuration data. The corrupted profile is preventing the application from completing its launch process.\n\n" +
    "Customer: That explains why restarting it did not help.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "RepairEmailClientProfile":
  message =
    "Agent: I’m repairing the corrupted email client profile so the application can load its configuration normally.\n\n" +
    "System: The damaged profile configuration has been repaired successfully. The email application is ready to be tested again.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckLicenseAssignment":
  message =
    "Agent: I’m checking whether the user account has the required software license assigned.\n\n" +
    "System: The application requires an assigned software license before it can be used. No qualifying license is currently assigned to this user account.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "AssignSoftwareLicense":
  message =
    "Agent: I’m assigning the required software license to the user account.\n\n" +
    "System: The required software license has been assigned successfully. The account now has the entitlement required to use the application.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "TestApplicationLaunch":
  if (state.scenario === "email_client_corrupted_profile") {
    if (
      state.scenarioFacts?.kind ===
        "email_client_corrupted_profile" &&
      !state.scenarioFacts.email_client_profile_repaired
    ) {
      message =
        "Agent: I’m testing the email application after restarting it.\n\n" +
        "System: The application still fails to launch after the restart. The temporary process recovery did not resolve the underlying issue.\n\n" +
        "Customer: It still does nothing when I try to open it.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m testing the email application after repairing the corrupted profile.\n\n" +
      "System: The email application launches successfully. The repaired profile is loading normally and application access has been restored.\n\n" +
      "Customer: Great, my email is opening again.";
    break;
  }

  if (state.scenario === "application_crash") {
    message =
      "Agent: I’m testing the application now to confirm it stays stable.\n\n" +
      "System: The application is running normally and is no longer crashing. Application stability has been restored.\n\n" +
      "Customer: Great, it is working now.";
    break;
  }

  if (state.scenario === "software_update_required") {
    message =
      "Agent: I’m testing the application now after the update.\n\n" +
      "System: The application opens successfully and the required update is active. The software is now usable with the current version.\n\n" +
      "Customer: Great, it works now.";
    break;
  }

  if (state.scenario === "software_app_license_not_assigned") {
    message =
      "Agent: I’m testing the application now that the required software license has been assigned.\n\n" +
      "System: The application launches successfully. The assigned license is recognized and the user can access the application normally.\n\n" +
      "Customer: Great, it works now.";
    break;
  }

  message =
    "Agent: I’m testing the application now to confirm it opens normally.\n\n" +
    "System: The application launches successfully and is responding normally. Application access has been restored.\n\n" +
    "Customer: Great, it opens now.";
  break;

case "CheckSoftwareVersion":
  message =
    "Agent: I’m checking the software version to confirm whether an update is required.\n\n" +
    "System: The software version is outdated and a required update is available. The application may not work correctly until the update is installed.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "InstallSoftwareUpdate":
  message =
    "Agent: I’m installing the required software update now.\n\n" +
    "System: The required software update has been installed successfully. The application is now on the supported version.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "CheckMicrophoneSettings":
  if (
    state.scenario ===
    "microphone_wrong_recording_device"
  ) {
    message =
      "Agent: I’m checking the microphone settings to confirm the microphone is enabled and available.\n\n" +
      "System: The microphone is enabled and available to the operating system. The device is permitted to capture audio, so the microphone should be tested before changing the input configuration.\n\n" +
      "Customer: It looks turned on, but nobody can hear me during calls.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the microphone settings to see why audio is not being picked up.\n\n" +
    "System: The microphone is currently disabled in the device settings. While disabled, the device cannot capture audio input.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "EnableMicrophone":
  message =
    "Agent: I’m enabling the microphone so the device can capture audio again.\n\n" +
    "System: The microphone has been enabled successfully. The device is now allowed to capture audio input.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.gotIt}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckRecordingDevice":
  message =
    "Agent: Since the microphone is enabled but the test still failed, I’m checking which recording device is currently selected.\n\n" +
    "System: A different audio-input device is selected as the active recording source. The intended microphone is available, but applications are currently capturing audio from the wrong device.\n\n" +
    "Customer: That explains why the microphone looks enabled but nobody hears me.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "SelectRecordingDevice":
  message =
    "Agent: I’m selecting the intended microphone as the active recording device.\n\n" +
    "System: The correct microphone has been selected successfully. Applications will now capture audio from the intended recording device.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "TestMicrophone":
  if (
    state.scenario ===
      "microphone_wrong_recording_device" &&
    state.scenarioFacts?.kind ===
      "microphone_wrong_recording_device"
  ) {
    if (
      !state.scenarioFacts.first_microphone_tested
    ) {
      message =
        "Agent: I’m testing the microphone to reproduce the audio-input problem before changing the recording device.\n\n" +
        "System: The microphone test receives no usable audio even though the intended microphone is enabled and available. The active recording-device selection should be checked next.\n\n" +
        "Customer: It still is not picking up my voice.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m testing the microphone again after selecting the intended recording device.\n\n" +
      "System: The microphone is capturing audio successfully through the correct recording device. Audio input is functioning normally.\n\n" +
      "Customer: Great, they can hear me now.";
    break;
  }

  message =
    "Agent: I’m testing the microphone now to confirm audio is working.\n\n" +
    "System: The microphone is capturing audio normally. Audio input functionality has been restored.\n\n" +
    "Customer: Great, they can hear me now.";
  break;

  case "CheckAudioOutput":
  message =
    "Agent: I’m checking which audio output device the computer is currently using.\n\n" +
    "System: Audio is currently being routed to the wrong output device. Sound is being sent somewhere other than the user’s intended speakers or headphones.\n\n" +
    "Customer: That would explain why I can’t hear anything.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckVolumeStatus":
  message =
    "Agent: I’m checking the system volume and mute settings before changing the output device.\n\n" +
    "System: The system volume is turned up and audio is not muted. The volume settings are not causing the issue.\n\n" +
    "Customer: Okay, so the volume itself is fine.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "SelectAudioOutput":
  message =
    "Agent: I’m selecting the correct speakers as the active audio output device.\n\n" +
    "System: The correct audio output device has been selected successfully. Sound will now be routed to the intended speakers or headphones.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "TestAudio":
  message =
    "Agent: I’m testing audio playback now to confirm sound is working through the selected device.\n\n" +
    "System: Audio playback completed successfully through the correct output device. Sound functionality has been restored.\n\n" +
    "Customer: Great, I can hear it now.";
  break;

case "CheckSharedDrivePermissions":
  if (state.scenario === "shared_drive_group_membership_missing") {
    message =
      "Agent: I’m checking the user’s shared drive permissions and group membership.\n\n" +
      "System: The shared drive is protected by a required access group. The user is not currently a member of that group, so access is denied.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the user’s shared drive permissions to see why access is blocked.\n\n" +
    "System: The user does not currently have permission to access the shared drive. Without that permission, the drive will stay unavailable.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "GrantSharedDriveAccess":
  message =
    "Agent: I’m granting the correct shared drive access for this user.\n\n" +
    "System: Shared drive permissions have been updated successfully. The user is now authorized to access the shared drive.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "AddUserToGroup":
  if (
    state.scenario ===
    "folder_access_required_security_group_missing"
  ) {
    message =
      "Agent: I’m adding the user to the security group required for this folder.\n\n" +
      "System: The user has been added to the required folder-access security group. The existing folder permissions can now apply through the corrected group membership.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.gotIt}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m adding the user to the required shared drive access group.\n\n" +
    "System: The user has been added to the required access group. Group membership is now in place for the shared drive.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.gotIt}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "TestSharedDriveAccess":
  if (state.scenario === "shared_drive_group_membership_missing") {
    message =
      "Agent: I’m testing shared drive access after adding the user to the required group.\n\n" +
      "System: The shared drive opens successfully. The user’s group membership is active and shared drive access has been restored.\n\n" +
      "Customer: Great, I can access it now.";
    break;
  }

  message =
    "Agent: I’m testing shared drive access now to confirm the user can open it.\n\n" +
    "System: The shared drive opens successfully for the user. Shared drive access has been restored.\n\n" +
    "Customer: Great, I can access it now.";
  break;

case "CheckFileOpenError":
  message =
    "Agent: I’m checking the file open error to confirm how the file is failing.\n\n" +
    "System: The file type is recognized, but the computer cannot open it with the currently assigned application. The file association needs to be checked before repair.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "CheckFileAssociation":
  message =
    "Agent: I’m checking the file association settings to see whether the file type is linked to the wrong application.\n\n" +
    "System: The file association is broken and the file type is not linked to the correct application. The file cannot open normally until that link is repaired.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "RepairFileAssociation":
  message =
    "Agent: I’m repairing the file association so the correct application opens the file.\n\n" +
    "System: The file association has been repaired successfully. This file type is now linked to the correct application.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestFileOpen":
  message =
    "Agent: I’m testing the file now to confirm it opens correctly.\n\n" +
    "System: The file opens successfully in the correct application. File access has been restored.\n\n" +
    "Customer: Great, it opens now.";
  break;

case "CheckFolderPermissions":
  if (
    state.scenario ===
    "folder_access_required_security_group_missing"
  ) {
    message =
      "Agent: I’m checking the folder permissions to determine why access is being denied.\n\n" +
      "System: The folder permissions are configured correctly and access is assigned through a required security group. The folder configuration itself is not missing permissions.\n\n" +
      "Customer: So the folder permissions are already correct?\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the folder permissions to see why access is missing.\n\n" +
    "System: The folder exists, but this user does not currently have access to it. Without folder permissions, the folder cannot be opened.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

  case "CheckFolderSecurityGroup":
  message =
    "Agent: Since the folder permissions are configured correctly but access still fails, I’m checking the user’s security group membership.\n\n" +
    "System: The user is not currently a member of the security group required to access this folder. Without that group membership, the existing folder permissions do not apply to the user.\n\n" +
    "Customer: That explains why the permissions looked right but I still couldn’t open it.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckUserPermissions":
  message =
    "Agent: I’m checking the user’s current permissions to determine whether access restrictions are causing the issue.\n\n" +
    "System: The user account does not currently have the required permission level. Access cannot proceed until the correct permissions are assigned.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;  

case "GrantRequiredPermission":
  message =
    "Agent: I’m granting the required permission so the user can access the resource.\n\n" +
    "System: The required permission has been granted successfully. The account now has the access level needed to open the resource.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestPermissionAccess":
  message =
    "Agent: I’m testing access now to confirm the permission change works.\n\n" +
    "System: Access is working successfully with the required permission. The previous authorization block has been resolved.\n\n" +
    "Customer: Great, I can access it now.";
  break;

case "GrantFolderAccess":
  message =
    "Agent: I’m granting the required folder access now.\n\n" +
    "System: Folder access has been granted successfully. The user is now authorized to open the folder.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestFolderAccess":
  if (
    state.scenario ===
      "folder_access_required_security_group_missing" &&
    state.scenarioFacts?.kind ===
      "folder_access_required_security_group_missing"
  ) {
    if (!state.scenarioFacts.first_folder_access_tested) {
      message =
        "Agent: I’m testing folder access after confirming the folder permissions are configured correctly.\n\n" +
        "System: Access is still denied even though the folder permissions are valid. Another authorization dependency is preventing the user from receiving effective access.\n\n" +
        "Customer: I still get the access denied message.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m testing folder access after adding the user to the required security group.\n\n" +
      "System: The folder opens successfully. The corrected security group membership now applies the existing folder permissions to the user.\n\n" +
      "Customer: Great, I can open the folder now.";
    break;
  }

  message =
    "Agent: I’m testing folder access now.\n\n" +
    "System: The folder opens successfully for the user. Folder access has been restored.\n\n" +
    "Customer: Great, I can access the folder now.";
  break;

case "CheckWebcamSettings":
  message =
    "Agent: I’m checking the webcam settings to see why video is not appearing.\n\n" +
    "System: The webcam is currently disabled in the device settings. While disabled, the device cannot provide video input.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "EnableWebcam":
  message =
    "Agent: I’m enabling the webcam so the device can display video again.\n\n" +
    "System: The webcam has been enabled successfully. The device can now provide video input.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestWebcam":
  message =
    "Agent: I’m testing the webcam now to confirm video is working.\n\n" +
    "System: The webcam is displaying video normally. Video input functionality has been restored.\n\n" +
    "Customer: Great, it's working now.";
  break;

case "CheckRegisteredMfaDevice":
  message =
    "Agent: I’m checking which device is currently registered for Multi-Factor Authentication.\n\n" +
    "System: The user’s previous phone is still registered as the active MFA device. Verification prompts will continue going to that phone until it is removed.\n\n" +
    "Customer: That is my old phone. I don’t have access to it anymore.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "RemoveOldMfaDevice":
  message =
    "Agent: I’m removing the outdated phone from the user’s registered MFA devices.\n\n" +
    "System: The previous phone has been removed successfully. The account can now reset MFA and configure verification on the current device.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
break;

case "TestMfaLogin":
  if (
    state.scenario ===
      "mfa_code_old_phone_still_registered"
  ) {
    message =
      "Agent: I’m testing MFA login now using the user’s current phone.\n\n" +
      "System: The user successfully completed MFA verification on the current device. Sign-in access has been restored.\n\n" +
      "Customer: Great, I can sign in with my new phone now.";
    break;
  }

  message =
    "Agent: I’m testing MFA login now to confirm authentication works end to end.\n\n" +
    "System: MFA authentication is working normally. The user can complete verification and sign in successfully.\n\n" +
    "Customer: Great, I can sign in now.";
  break;

case "ResetMfaMethod":
  if (state.scenario === "vpn_mfa_dependency_missing") {
    message =
      "Agent: I’m configuring the MFA method required for VPN access.\n\n" +
      "System: MFA has been configured successfully. The account now has the authentication requirement needed to complete VPN sign-in.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
    break;
  }

  if (
    state.scenario ===
      "mfa_code_old_phone_still_registered"
  ) {
    message =
      "Agent: I’m resetting the MFA method so authentication can be configured on the user’s current phone.\n\n" +
      "System: The MFA method has been reset successfully. The account is ready to use the current device for verification.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m resetting the MFA method so the user can authenticate again.\n\n" +
    "System: The MFA method has been reset successfully. The old verification issue has been cleared, and the account can establish a working authentication method.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckMfaStatus":
  if (state.scenario === "vpn_mfa_dependency_missing") {
    message =
      "Agent: I’m checking the MFA status to see why the VPN connection cannot complete.\n\n" +
      "System: MFA has not been configured for this user. VPN access depends on MFA setup before the connection can complete.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
    break;
  }

  if (
    state.scenario ===
      "mfa_code_old_phone_still_registered"
  ) {
    message =
      "Agent: I’m checking the MFA status to determine why verification is still going to the previous phone.\n\n" +
      "System: MFA is active, but the account is still associated with an outdated registered device. The registered MFA device must be reviewed before authentication can be reset.\n\n" +
      "Customer: That sounds like it could still be using my old phone.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the MFA status to see why the verification code is failing.\n\n" +
    "System: The user’s MFA method is not properly synced with the account. Because the method is out of sync, valid sign-in verification cannot complete.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

  case "CheckBrowserCache":
  message =
    "Agent: I’m checking the browser cache to see whether accumulated cached data may be affecting performance.\n\n" +
    "System: The browser cache contains a large amount of accumulated temporary web data. Clearing the cache may improve browser responsiveness.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "ClearBrowserCache":
  message =
    "Agent: I’m clearing the browser cache to remove accumulated temporary web data.\n\n" +
    "System: The browser cache has been cleared successfully. The browser is ready for performance testing.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;


case "CheckBrowserExtensions":
  message =
    "Agent: I’m checking the browser extensions to see what may be slowing it down.\n\n" +
    "System: Several unnecessary extensions are running and slowing browser performance. These extensions are adding extra load during normal browsing.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "DisableUnnecessaryExtensions":
  message =
    "Agent: I’m disabling unnecessary browser extensions to improve performance.\n\n" +
    "System: The unnecessary extensions have been disabled successfully. Browser load has been reduced.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestBrowserPerformance":
  if (
  state.scenario === "browser_running_slow_extension" &&
  state.scenarioFacts?.kind ===
    "browser_running_slow_extension" &&
  !state.scenarioFacts.browser_performance_tested_after_cache
) {
  message =
    "Agent: I’m testing browser performance after clearing the accumulated cache data.\n\n" +
    "System: The browser is still running slowly even after the cache was cleared. Normal cache troubleshooting did not resolve the underlying performance issue.\n\n" +
    "Customer: It’s still slow.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;
}

  message =
    "Agent: I’m testing browser performance now to confirm it responds normally.\n\n" +
    "System: The browser is responding normally again. Browser performance has been restored.\n\n" +
    "Customer: Great, it’s much faster now.";
  break;

case "CheckInstallPermissions":
  if (
    state.scenario ===
      "cannot_install_software_admin_approval_required"
  ) {
    message =
      "System: The software request has been approved successfully. Installation permissions can now be granted to the user.\n\n" +
      "System: The user does not currently have permission to install the requested software. Installation access cannot be granted yet because the software request has not completed the required approval process.\n\n" +
      "Customer: So something still has to be approved before I can install it?\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

    message =
    "Agent: I’m checking the user’s install permissions to see why software cannot be installed.\n\n" +
    "System: The user does not currently have permission to install software on this device. That restriction prevents new software from being added.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckSoftwareRequestStatus":
  message =
    "Agent: I’m checking the software request status to determine whether the installation has received administrator approval.\n\n" +
    "System: The software request is still pending administrator approval. Installation permissions cannot be granted until the request is approved.\n\n" +
    "Customer: I submitted the request earlier, but I didn’t realize it was still waiting for approval.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "ApproveSoftwareRequest":
  message =
    "Agent: I’m approving the pending software request so the installation process can continue.\n\n" +
    "System: The software request has been approved successfully. Installation permissions can now be granted to the user.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "GrantInstallPermissions":
  if (
    state.scenario ===
      "cannot_install_software_admin_approval_required"
  ) {
    message =
      "Agent: I’m granting the required installation permissions now that the software request has been approved.\n\n" +
      "System: Software installation permissions have been granted successfully following administrator approval. The requested software can now be installed.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m granting the required software installation permissions.\n\n" +
    "System: Software installation permissions have been updated successfully. The user is now allowed to install the required software.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "TestSoftwareInstall":
  if (
    state.scenario ===
      "cannot_install_software_admin_approval_required"
  ) {
    message =
      "Agent: I’m testing the software installation now that approval and installation permissions are in place.\n\n" +
      "System: The software installs successfully. The pending approval dependency and installation permission restriction have both been resolved.\n\n" +
      "Customer: Perfect, the installation worked.";
    break;
  }

  message =
    "Agent: I’m testing the software installation now to confirm it works.\n\n" +
    "System: The software installs successfully. The installation permission issue has been resolved.\n\n" +
    "Customer: Yes, the installation worked.";
  break;

case "CheckDisplayConnection":
  if (
    state.scenario ===
    "second_monitor_display_disabled"
  ) {
    message =
      "Agent: I’m checking the display cable and connection to confirm the second monitor is physically connected.\n\n" +
      "System: The second monitor is connected securely and receiving power. The physical connection is not preventing the display from working, so the display configuration should be checked next.\n\n" +
      "Customer: The monitor is plugged in and powered on, but the screen is still blank.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the display cable and connection to confirm the second monitor is physically connected.\n\n" +
    "System: The second monitor is connected, but the computer has not fully registered the display yet. Display settings must be checked next so the operating system can detect it.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckDisplaySettings":
  if (
    state.scenario ===
    "second_monitor_display_disabled"
  ) {
    message =
      "Agent: I’m checking the display settings to confirm whether the connected monitor appears in the operating system.\n\n" +
      "System: The second monitor appears in display settings, but its current operating state has not yet been verified. The monitor should be detected and tested before investigating a deeper configuration dependency.\n\n" +
      "Customer: So the computer can see the monitor, but it still is not showing anything?\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the display settings to see why the second monitor is not being detected.\n\n" +
    "System: The second monitor is physically connected but not currently detected in display settings. The computer must detect the display before it can be used.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "DetectSecondMonitor":
  if (
    state.scenario ===
    "second_monitor_display_disabled"
  ) {
    message =
      "Agent: I’m detecting the second monitor so the operating system can fully register the connected display.\n\n" +
      "System: The second monitor has been detected successfully. The operating system recognizes the display, but dual-display functionality must still be tested to confirm the monitor is active.\n\n" +
      "Customer: It shows up in the settings now, but the screen is still blank.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m detecting the second monitor so the computer can recognize it.\n\n" +
    "System: The second monitor has been detected successfully. The operating system can now communicate with the display.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "CheckDisplayEnabledStatus":
  message =
    "Agent: Since the second monitor is detected but still not displaying anything, I’m checking whether that display is enabled in the operating system.\n\n" +
    "System: The second monitor is detected, but the display is disabled in the current display configuration. The operating system recognizes the monitor but is not sending an active desktop signal to it.\n\n" +
    "Customer: That explains why the computer sees it but the screen stays blank.\n\n" +
    NEXT_STEP_PROMPTS.default;
  break;

case "EnableSecondDisplay":
  message =
    "Agent: I’m enabling the second display so the operating system can extend the desktop to that monitor.\n\n" +
    "System: The second display has been enabled successfully. The operating system is now configured to send an active desktop signal to both monitors.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` +
    NEXT_STEP_PROMPTS.default;
  break;

case "TestDualDisplay":
  if (
    state.scenario ===
      "second_monitor_display_disabled" &&
    state.scenarioFacts?.kind ===
      "second_monitor_display_disabled"
  ) {
    if (
      !state.scenarioFacts.first_dual_display_tested
    ) {
      message =
        "Agent: I’m testing the dual-display setup now that the second monitor has been detected.\n\n" +
        "System: The operating system detects the second monitor, but the screen remains inactive and does not display the desktop. Another display configuration condition is preventing the monitor from being used.\n\n" +
        "Customer: The monitor is listed, but the screen is still completely blank.\n\n" +
        NEXT_STEP_PROMPTS.default;
      break;
    }

    message =
      "Agent: I’m testing the dual-display setup again after enabling the second display.\n\n" +
      "System: Both monitors are active and displaying correctly. The desktop extends successfully across the primary and second displays.\n\n" +
      "Customer: Great, both screens are working now.";
    break;
  }

  message =
    "Agent: I’m testing the dual monitor setup now to confirm both screens work.\n\n" +
    "System: Both monitors are detected and displaying correctly. Dual display functionality has been restored.\n\n" +
    "Customer: Great, both screens are working now.";
  break;

    case "SelectScenario":
      message = `Scenario selected: ${decision.plan.scenario_id.replace(/_/g, " ")}`;
      break;

    case "ViewScorecard":
      message = "";
      break;

    default:
      assertNeverPlan(decision.plan);
  }
}

  return { state: nextState, message, decision };
}