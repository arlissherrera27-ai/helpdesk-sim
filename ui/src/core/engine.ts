import type { Decision, LogEvent, SimState } from "./types";
import { parseCommand } from "./parse";
import { decide } from "./decide";
import { executePlan } from "./execute";
import { applyPatch } from "./update";
import { evaluateRun } from "./score";
import { SCENARIO_LABELS } from "./scenarios";

import {
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

if (finalPatch.result) {
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
    ? SCENARIO_LABELS[state.scenario as keyof typeof SCENARIO_LABELS] // ← UPDATE
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
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.continue;
  break;

    case "ConfirmUnlock":
  message =
    "Agent: I’m completing the account unlock and verifying that access has been restored.\n\n" +
    "System: The account has been unlocked successfully. Authentication restrictions have been removed and sign-in access is available again.\n\n" +
    "Customer: Perfect, I can sign in now.\n\n" + NEXT_STEP_PROMPTS.default;
  break;

  case "CheckVpnAccess":
    message =
      "Agent: I’m checking whether remote network access is assigned to this user account.\n\n" +
      "System: VPN access is not currently assigned to the user account. Without that assignment, remote connection attempts will fail.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
    break;

case "EnableVpnAccess":
  if (state.scenario === "vpn_mfa_dependency_missing") {
    message =
      "Agent: I’m assigning VPN access to the user account now.\n\n" +
      "System: VPN access has been assigned successfully, but the connection still cannot complete because MFA setup is required.\n\n" +
      "Customer: It still won’t connect. It says I need to finish MFA setup first.\n\n" +
      NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m assigning VPN access to the user account now.\n\n" +
    "System: VPN access has been assigned successfully. The account is now permitted to connect to the remote work network.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` + NEXT_STEP_PROMPTS.default;
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
  message =
    "Agent: I’m checking the email client status to see why messages are not sending.\n\n" +
    "System: The email client is currently offline. Because the client is offline, outgoing email cannot be transmitted.\n\n" +
    "Customer: Oh, I didn’t realize that.\n\n" + NEXT_STEP_PROMPTS.default;
  break;

case "EnableEmailClient":
  message =
    "Agent: I’m bringing the email client back online so outgoing messages can send again.\n\n" +
    "System: The email client is now online. Outgoing messages can now be transmitted normally.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "SendTestEmail":
  if (state.scenario === "email_not_sending") {
    message =
      "Agent: I’m sending a test email to confirm outgoing email is working.\n\n" +
      "System: The test email was sent successfully. Outgoing email delivery has been restored.\n\n" +
      "Customer: Got it, it works now.";
  } else if (state.scenario === "not_receiving_email") {
    message =
      "Agent: I’m sending a test email to confirm incoming email is reaching the inbox.\n\n" +
      "System: The test email was delivered successfully. Incoming email is no longer being blocked or redirected away from the inbox.\n\n" +
      "Customer: Great, I received it.";
  } else if (state.scenario === "mailbox_full") {
    message =
      "Agent: I’m sending a test email to confirm new messages can be delivered.\n\n" +
      "System: The test email was delivered successfully. Mailbox space is available and new email can arrive normally.\n\n" +
      "Customer: Great, I received it.";
  }

  break;
  
   case "CheckMailboxStorage":
  message =
    "Agent: I’m checking mailbox storage to see why new emails are not arriving.\n\n" +
    "System: The mailbox has reached its storage limit. Until space is recovered, new emails cannot be delivered.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "ArchiveOldEmails":
  message =
    "Agent: I’m archiving old emails to recover mailbox storage space.\n\n" +
    "System: Old emails have been archived. Mailbox storage is now available for new incoming messages.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "CheckSyncSettings":
  message =
    "Agent: I’m checking the email synchronization settings.\n\n" +
    "System: Email synchronization is disabled. Because synchronization is disabled, new messages cannot update in the email client.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "ResyncEmailClient":
  message =
    "Agent: I’m restoring email synchronization now.\n\n" +
    "System: Email synchronization has been restored successfully. The client can now update new messages normally.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestEmailSync":
  message =
    "Agent: I’m testing email synchronization now.\n\n" +
    "System: The email client is synchronizing new messages normally. Message updates are being received successfully.\n\n" +
    "Customer: Great, my emails are updating again.";
  break;

case "CheckSharedMailboxMembership":
  message =
    "Agent: I’m checking shared mailbox membership and permissions.\n\n" +
    "System: The user is no longer assigned to the shared mailbox. Without mailbox membership, access is denied.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "GrantSharedMailboxAccess":
  message =
    "Agent: I’m restoring shared mailbox permissions now.\n\n" +
    "System: Shared mailbox access permissions have been restored successfully. The user is now authorized to open the mailbox.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestSharedMailboxAccess":
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
  message =
    "Agent: I’m checking the email login status to see why sign-in is failing.\n\n" +
    "System: The email account session is stuck and cannot complete authentication successfully. The session must be reset before sign-in can proceed.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "ResetEmailSession":
  message =
    "Agent: I’m resetting the email session so the account can sign in cleanly.\n\n" +
    "System: The email session has been reset successfully. The authentication blockage has been cleared.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestEmailLogin":
  message =
    "Agent: I’m testing email sign-in now.\n\n" +
    "System: Email sign-in is working normally. The user can successfully authenticate and access the mailbox.\n\n" +
    "Customer: Great, I can access my email now.";
  break;

case "CheckInboxFilters":
  message =
    "Agent: I’m checking the inbox filters to see if emails are being blocked or redirected.\n\n" +
    "System: A filter is currently redirecting incoming emails away from the inbox. This prevents expected messages from appearing where the user looks for them.\n\n" +
    "Customer: Oh wow.\n\n" + NEXT_STEP_PROMPTS.default;
  break;

case "DisableInboxFilter":
  message =
    "Agent: I’m disabling that filter so incoming emails reach the inbox normally.\n\n" +
    "System: The filter has been removed. Incoming emails will now be delivered to the inbox instead of being redirected.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "CheckWifiStatus": 
  message =
    "Agent: I’m checking the device’s wireless settings to see why it is not connecting.\n\n" +
    "System: Wi-Fi is currently turned off on the device. Because wireless networking is disabled, the device cannot detect or connect to available networks.\n\n" +
    "Customer: Oh okay.\n\n" + NEXT_STEP_PROMPTS.default;
  break;

case "EnableWifi":
  message =
    "Agent: I’m turning Wi-Fi back on so the device can connect.\n\n" +
    "System: Wi-Fi has been enabled. The device can now detect available wireless networks and connect normally.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestConnection":
  message =
    "Agent: I’m testing the connection now to confirm network access is restored.\n\n" +
    "System: The device successfully connected to Wi-Fi. Network access has been restored.\n\n" +
    "Customer: That worked, thanks.";
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
  message =
    "Agent: I’m checking the network status to see why internet access is unavailable.\n\n" +
    "System: The device is connected to the local network, but internet access is not currently available. The connection needs to be refreshed before internet traffic can pass normally.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
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
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
    break;
  }
       
  message =
    "Agent: I’m restarting the network adapter to refresh the connection.\n\n" +
    "System: The network adapter has restarted successfully. The network connection has been refreshed and internet access can be tested again.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestInternetConnection":
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
  message =
    "Agent: I’m checking the printer status to see why it is not printing.\n\n" +
    "System: The printer is currently offline and unavailable to the computer. Print jobs cannot be processed until connectivity is restored.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "RestartPrinter":
  message =
    "Agent: I’m restarting the printer so it can reconnect properly.\n\n" +
    "System: The printer has restarted successfully and is back online. The device can now accept print jobs again.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "PrintTestPage":
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
  if (state.scenario === "application_crash") {
    message =
      "Agent: I’m restarting the application to clear the crash state.\n\n" +
      "System: The application restarted successfully. The crash state has been cleared and the application is ready to be tested for stability.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m restarting the application so it can launch cleanly.\n\n" +
    "System: The application has been restarted successfully. The stuck launch state has been cleared.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.alright}\n\n` + NEXT_STEP_PROMPTS.default;
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
  message =
    "Agent: I’m checking the microphone settings to see why audio is not being picked up.\n\n" +
    "System: The microphone is currently disabled in the device settings. While disabled, the device cannot capture audio input.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "EnableMicrophone":
  message =
    "Agent: I’m enabling the microphone so the device can capture audio again.\n\n" +
    "System: The microphone has been enabled successfully. The device is now allowed to capture audio input.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.gotIt}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestMicrophone":
  message =
    "Agent: I’m testing the microphone now to confirm audio is working.\n\n" +
    "System: The microphone is capturing audio normally. Audio input functionality has been restored.\n\n" +
    "Customer: Great, they can hear me now.";
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
  message =
    "Agent: I’m checking the folder permissions to see why access is missing.\n\n" +
    "System: The folder exists, but this user does not currently have access to it. Without folder permissions, the folder cannot be opened.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
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

case "TestMfaLogin":
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

  message =
    "Agent: I’m resetting the MFA method so the user can authenticate again.\n\n" +
    "System: The MFA method has been reset successfully. The old verification issue has been cleared, and the account can establish a working authentication method.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "CheckMfaStatus":
  if (state.scenario === "vpn_mfa_dependency_missing") {
    message =
      "Agent: I’m checking the MFA status to see why the VPN connection cannot complete.\n\n" +
      "System: MFA has not been configured for this user. VPN access depends on MFA setup before the connection can complete.\n\n" +
      `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
    break;
  }

  message =
    "Agent: I’m checking the MFA status to see why the verification code is failing.\n\n" +
    "System: The user’s MFA method is not properly synced with the account. Because the method is out of sync, valid sign-in verification cannot complete.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
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
  message =
    "Agent: I’m testing browser performance now to confirm it responds normally.\n\n" +
    "System: The browser is responding normally again. Browser performance has been restored.\n\n" +
    "Customer: Great, it’s much faster now.";
  break;

case "CheckInstallPermissions":
  message =
    "Agent: I’m checking the user’s install permissions to see why software cannot be installed.\n\n" +
    "System: The user does not currently have permission to install software on this device. That restriction prevents new software from being added.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "GrantInstallPermissions":
  message =
    "Agent: I’m granting the required software installation permissions.\n\n" +
    "System: Software installation permissions have been updated successfully. The user is now allowed to install the required software.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestSoftwareInstall":
  message =
    "Agent: I’m testing the software installation now to confirm it works.\n\n" +
    "System: The software installs successfully. The installation permission issue has been resolved.\n\n" +
    "Customer: Yes, the installation worked.";
  break;

case "CheckDisplayConnection":
  message =
    "Agent: I’m checking the display cable and connection to confirm the second monitor is physically connected.\n\n" +
    "System: The second monitor is connected, but the computer has not fully registered the display yet. Display settings must be checked next so the operating system can detect it.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "CheckDisplaySettings":
  message =
    "Agent: I’m checking the display settings to see why the second monitor is not being detected.\n\n" +
    "System: The second monitor is physically connected but not currently detected in display settings. The computer must detect the display before it can be used.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "DetectSecondMonitor":
  message =
    "Agent: I’m detecting the second monitor so the computer can recognize it.\n\n" +
    "System: The second monitor has been detected successfully. The operating system can now communicate with the display.\n\n" +
    `Customer: ${CUSTOMER_REACTIONS.acknowledge.okay}\n\n` + NEXT_STEP_PROMPTS.default;
  break;

case "TestDualDisplay":
  message =
    "Agent: I’m testing the dual monitor setup now to confirm both screens work.\n\n" +
    "System: Both monitors are detected and displaying correctly. Dual display functionality has been restored.\n\n" +
    "Customer: Great, both screens are working now.";
  break;

    case "SelectScenario":
      message = `Scenario selected: ${decision.plan.scenario_id.replace(/_/g, " ")}`;
      break;
    default:
      message = "[ENGINE] Action completed.";
  }
}

  return { state: nextState, message, decision };
}