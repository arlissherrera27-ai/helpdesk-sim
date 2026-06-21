import type { Command, Decision, SimState } from "./types";
import { isValidScenarioId } from "./scenarios";

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
  if (!state.scenarioFacts?.identity_verified) {
    return denyProcedure(commandKind);
  }

  return null;
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
    return { kind: "ALLOW", plan: { kind: "VerifyIdentity" } };
 }

// --- ACCOUNT / ACCESS COMMANDS --- //

// account_lockout
// request_unlock gating rule
if (command.kind === "request_unlock") {
      const runningCheck = mustBeRunning(state);

      if (runningCheck) {
        return runningCheck;
      }

if (state.scenarioFacts?.kind !== "account_lockout") {
  return denyProcedure(command.kind);
}

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

if (state.scenarioFacts.unlock_requested === true) {
  return denyProcedure(command.kind);
}

      return { kind: "ALLOW", plan: { kind: "RequestUnlock" } };
    }

    // confirm_unlock gating rule
if (command.kind === "confirm_unlock") {
      const runningCheck = mustBeRunning(state);

      if (runningCheck) {
        return runningCheck;
      }

if (state.scenarioFacts?.kind !== "account_lockout") {
  return denyProcedure(command.kind);
}

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

if (state.scenarioFacts.unlock_requested !== true) {
  return denyProcedure(command.kind);
}

if (state.scenarioFacts.account_locked !== true) {
  return denyProcedure(command.kind);
}

      return { kind: "ALLOW", plan: { kind: "ConfirmUnlock" } };

    }

    // password_reset
    // send_reset_code gating rule
    if (command.kind === "send_reset_code") {
      const runningCheck = mustBeRunning(state);

      if (runningCheck) {
        return runningCheck;
      }

// Only meaningful inside password reset scenarios
if (
  state.scenarioFacts?.kind !== "password_reset" &&
  state.scenarioFacts?.kind !== "password_reset_recovery_email_never_arrives" &&
  state.scenarioFacts?.kind !== "password_reset_recovery_email_outdated"
) {
  return denyProcedure(command.kind);
}

if (
  state.scenarioFacts.kind === "password_reset_recovery_email_outdated" &&
  state.scenarioFacts.recovery_email_updated !== true
) {
  return denyProcedure(command.kind);
}

// Must have identity verified first
const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

      // Must not already have been sent
      if (state.scenarioFacts.code_sent === true) {
        return denyProcedure(command.kind);
      }

      return { kind: "ALLOW", plan: { kind: "SendResetCode" } };
    }

    // verify_alternate_contact gating rule
    if (command.kind === "verify_alternate_contact") {
      const runningCheck = mustBeRunning(state);

      if (runningCheck) {
        return runningCheck;
      }

      if (
        state.scenarioFacts?.kind !==
        "password_reset_recovery_email_outdated"
      ) {
        return denyProcedure(command.kind);
      }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

      if (state.scenarioFacts.alternate_contact_verified === true) {
        return denyProcedure(command.kind);
      }

      return {
        kind: "ALLOW",
        plan: { kind: "VerifyAlternateContact" },
      };
    }

    // update_recovery_email gating rule
    if (command.kind === "update_recovery_email") {
      const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

      if (
        state.scenarioFacts?.kind !==
        "password_reset_recovery_email_outdated"
      ) {
        return denyProcedure(command.kind);
      }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

      if (state.scenarioFacts.alternate_contact_verified !== true) {
        return denyProcedure(command.kind);
      }

      if (state.scenarioFacts.recovery_email_updated === true) {
        return denyProcedure(command.kind);
      }

      return {
        kind: "ALLOW",
        plan: { kind: "UpdateRecoveryEmail" },
      };
    }

    // resend_reset_code gating rule
    if (command.kind === "resend_reset_code") {
      const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

if (
  state.scenarioFacts?.kind !==
  "password_reset_recovery_email_never_arrives"
) {
  return denyProcedure(command.kind);
}

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

if (state.scenarioFacts.code_sent !== true) {
  return denyProcedure(command.kind);
}

      if (state.scenarioFacts.inbox_filter_checked !== true) {
        return denyProcedure(command.kind);
      }

      if (state.scenarioFacts.inbox_filter_enabled !== false) {
        return denyProcedure(command.kind);
      }

      if (state.scenarioFacts.email_arrived === true) {
        return denyProcedure(command.kind);
      }

      return { kind: "ALLOW", plan: { kind: "ResendResetCode" } };
    }

  // confirm_reset gating rule //
  if (command.kind === "confirm_reset") {
    const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

    // Only meaningful inside password reset scenarios
if (
  state.scenarioFacts?.kind !== "password_reset" &&
  state.scenarioFacts?.kind !== "password_reset_recovery_email_never_arrives" &&
  state.scenarioFacts?.kind !== "password_reset_recovery_email_outdated"
) {
  return denyProcedure(command.kind);
}

    if (
      state.scenarioFacts.kind === "password_reset_recovery_email_never_arrives" &&
      state.scenarioFacts.email_arrived !== true
    ) {
      return denyProcedure(command.kind);
    }

    // Must verify identity first
const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

    // Must send reset code first
    if (state.scenarioFacts.code_sent !== true) {
      return denyProcedure(command.kind);
    }

    // Must not already be completed
    if (state.scenarioFacts.reset_done === true) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "ConfirmReset" } };
  }

  // set_new_password gating rule
  if (command.kind === "set_new_password") { 
    const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

if (
  state.scenarioFacts?.kind !== "password_reset" &&
  state.scenarioFacts?.kind !== "password_reset_recovery_email_never_arrives" &&
  state.scenarioFacts?.kind !== "password_reset_recovery_email_outdated"
) {
  return denyProcedure(command.kind);
}
const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

if (state.scenarioFacts.code_sent !== true) {
  return denyProcedure(command.kind);
}

if (state.scenarioFacts.reset_done !== true) {
  return denyProcedure(command.kind);
}

    return { kind: "ALLOW", plan: { kind: "SetNewPassword" } };
  }

// test_sign_in gating rule
if (command.kind === "test_sign_in") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

if (
  state.scenarioFacts?.kind !== "password_reset" &&
  state.scenarioFacts?.kind !== "password_reset_recovery_email_never_arrives" &&
  state.scenarioFacts?.kind !== "password_reset_recovery_email_outdated"
) {
  return denyProcedure(command.kind);
}

if (state.scenarioFacts.reset_done !== true) {
  return denyProcedure(command.kind);
}

if (state.scenarioFacts.password_updated !== true) {
  return denyProcedure(command.kind);
}

if (state.scenarioFacts.can_login_now === true) {
  return denyProcedure(command.kind);
}

  return { kind: "ALLOW", plan: { kind: "TestSignIn" } };
}  

// vpn_access_issue

if (command.kind === "check_vpn_access") { 
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

if (
  !state.scenarioFacts ||
  (
    state.scenarioFacts.kind !== "vpn_access_issue" &&
    state.scenarioFacts.kind !== "vpn_mfa_dependency_missing" &&
    state.scenarioFacts.kind !== "network_drive_vpn_required_first"
  )
) {
  return denyProcedure(command.kind);
}

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.vpn_access_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckVpnAccess" } };
}

if (command.kind === "enable_vpn_access") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

if (
  !state.scenarioFacts ||
  (
    state.scenarioFacts.kind !== "vpn_access_issue" &&
    state.scenarioFacts.kind !== "vpn_mfa_dependency_missing" &&
    state.scenarioFacts.kind !== "network_drive_vpn_required_first"
  )
) {
  return denyProcedure(command.kind);
}

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (!state.scenarioFacts.vpn_access_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.vpn_access_enabled) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "EnableVpnAccess" } };
}

if (command.kind === "confirm_connection") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (
    !state.scenarioFacts ||
    (
      state.scenarioFacts.kind !== "vpn_access_issue" &&
      state.scenarioFacts.kind !== "vpn_mfa_dependency_missing"
    )
  ) {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.vpn_access_enabled) {
    return denyProcedure(command.kind);
  }

  if (
    state.scenarioFacts.kind === "vpn_mfa_dependency_missing" &&
    !state.scenarioFacts.mfa_method_reset
  ) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "ConfirmConnection" } };
}

// --- EMAIL COMMANDS --- //
if (command.kind === "check_email_status") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}
  if (
    !state.scenarioFacts ||
    state.scenarioFacts.kind !== "email_not_sending"
  ) {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.email_status_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckEmailStatus" } };
}

if (command.kind === "enable_email_client") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (
    !state.scenarioFacts ||
    state.scenarioFacts.kind !== "email_not_sending"
  ) {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (!state.scenarioFacts.email_status_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.email_client_online) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "EnableEmailClient" } };
}

if (command.kind === "send_test_email") { 
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.kind === "attachment_too_large") {
    if (!state.scenarioFacts.attachment_compressed) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "SendTestEmail" } };
  }

  if (state.scenarioFacts.kind === "email_not_sending") {
    if (!state.scenarioFacts.email_client_online) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "SendTestEmail" } };
  }

    if (state.scenarioFacts.kind === "not_receiving_email") {
    if (!state.scenarioFacts.filter_disabled) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "SendTestEmail" } };
  }

  if (state.scenarioFacts.kind === "mailbox_full") {
    if (!state.scenarioFacts.old_emails_archived) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "SendTestEmail" } };
  }

  return denyProcedure(command.kind);
}

// --- MAILBOX FULL COMMANDS --- //

if (command.kind === "check_mailbox_storage") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "mailbox_full") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.mailbox_storage_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckMailboxStorage" } };
}

if (command.kind === "archive_old_emails") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "mailbox_full") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.mailbox_storage_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.old_emails_archived) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "ArchiveOldEmails" } };
}

// --- EMAIL LOGIN ISSUE COMMANDS --- //

if (command.kind === "check_email_login_status") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "email_login_issue") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.email_login_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckEmailLoginStatus" } };
}

if (command.kind === "reset_email_session") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "email_login_issue") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.email_login_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.email_session_reset) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "ResetEmailSession" } };
}

if (command.kind === "test_email_login") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "email_login_issue") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.email_session_reset) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestEmailLogin" } };
}

// --- EMAIL CLIENT NOT SYNCING COMMANDS --- //

if (command.kind === "check_sync_settings") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "email_client_not_syncing") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  return { kind: "ALLOW", plan: { kind: "CheckSyncSettings" } };
}

if (command.kind === "resync_email_client") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "email_client_not_syncing") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.sync_settings_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "ResyncEmailClient" } };
}

if (command.kind === "test_email_sync") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "email_client_not_syncing") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.email_client_resynced) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestEmailSync" } };
}

// --- ATTACHMENT TOO LARGE COMMANDS --- //

if (command.kind === "check_attachment_size") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "attachment_too_large") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.attachment_size_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckAttachmentSize" } };
}

if (command.kind === "compress_attachment") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}
  if (!state.scenarioFacts || state.scenarioFacts.kind !== "attachment_too_large") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.attachment_size_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.attachment_compressed) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CompressAttachment" } };
}

// --- SHARED MAILBOX MISSING COMMANDS --- //

if (command.kind === "check_shared_mailbox_membership") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "shared_mailbox_missing") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  return {
    kind: "ALLOW",
    plan: { kind: "CheckSharedMailboxMembership" },
  };
}

if (command.kind === "grant_shared_mailbox_access") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "shared_mailbox_missing") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.shared_mailbox_membership_checked) {
    return denyProcedure(command.kind);
  }

  return {
    kind: "ALLOW",
    plan: { kind: "GrantSharedMailboxAccess" },
  };
}

if (command.kind === "test_shared_mailbox_access") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "shared_mailbox_missing") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.shared_mailbox_access_granted) {
    return denyProcedure(command.kind);
  }

  return {
    kind: "ALLOW",
    plan: { kind: "TestSharedMailboxAccess" },
  };
}

// --- NETWORK / CONNECTIVITY COMMANDS --- //

// slow_network_connection

if (command.kind === "check_network_speed") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "slow_network_connection") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.network_speed_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckNetworkSpeed" } };
}

// ethernet_not_connected

if (command.kind === "check_ethernet_connection") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "ethernet_not_connected") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.ethernet_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckEthernetConnection" } };
}

if (command.kind === "reconnect_ethernet_cable") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "ethernet_not_connected") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.ethernet_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.ethernet_cable_reconnected) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "ReconnectEthernetCable" } };
}

// cannot_connect_wifi
if (command.kind === "check_wifi_status") { 
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "cannot_connect_wifi") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}
  if (state.scenarioFacts.wifi_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckWifiStatus" } };
}

if (command.kind === "enable_wifi") { // ← ADD
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "cannot_connect_wifi") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.wifi_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.wifi_enabled) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "EnableWifi" } };
}

if (command.kind === "test_connection") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts) {
    return denyProcedure(command.kind);
  }

  if (
    state.scenarioFacts.kind === "vpn_access_issue" ||
    state.scenarioFacts.kind === "vpn_mfa_dependency_missing"
  ) {
    if (!state.scenarioFacts.vpn_access_enabled) {
      return denyProcedure(command.kind);
    }

    if (
      state.scenarioFacts.kind === "vpn_mfa_dependency_missing" &&
      !state.scenarioFacts.mfa_method_reset
    ) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "ConfirmConnection" } };
  }

  if (state.scenarioFacts.kind === "cannot_connect_wifi") {
    if (!state.scenarioFacts.wifi_enabled) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "TestConnection" } };
  }

  return denyProcedure(command.kind);
}

if (command.kind === "check_inbox_filters") {
if (
  !state.scenarioFacts ||
  (
    state.scenarioFacts.kind !== "not_receiving_email" &&
    state.scenarioFacts.kind !== "password_reset_recovery_email_never_arrives"
  )
) {
  return denyProcedure(command.kind);
}

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (
    state.scenarioFacts.kind === "not_receiving_email" &&
    state.scenarioFacts.filters_checked
  ) {
    return denyProcedure(command.kind);
  }

if (
  state.scenarioFacts.kind === "password_reset_recovery_email_never_arrives" &&
  state.scenarioFacts.code_sent !== true
) {
  return denyProcedure(command.kind);
}

if (
  state.scenarioFacts.kind === "password_reset_recovery_email_never_arrives" &&
  state.scenarioFacts.inbox_filter_checked
) {
  return denyProcedure(command.kind);
}

  return { kind: "ALLOW", plan: { kind: "CheckInboxFilters" } };
}

if (command.kind === "disable_inbox_filter") {
  if (
    !state.scenarioFacts ||
    (
      state.scenarioFacts.kind !== "not_receiving_email" &&
      state.scenarioFacts.kind !== "password_reset_recovery_email_never_arrives"
    )
  ) {
    return denyProcedure(command.kind);
  }

if (
  state.scenarioFacts.kind === "password_reset_recovery_email_never_arrives" &&
  !state.scenarioFacts.inbox_filter_checked
) {
  return denyProcedure(command.kind);
}

  return { kind: "ALLOW", plan: { kind: "DisableInboxFilter" } };
}

// too_many_apps_running
if (command.kind === "check_running_apps") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (
    !state.scenarioFacts ||
    state.scenarioFacts.kind !== "too_many_apps_running"
  ) {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.apps_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckRunningApps" } };
}

if (command.kind === "close_unnecessary_apps") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (
    !state.scenarioFacts ||
    state.scenarioFacts.kind !== "too_many_apps_running"
  ) {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.apps_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.apps_closed) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CloseUnnecessaryApps" } };
}

if (command.kind === "test_performance") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.kind === "too_many_apps_running") {
    if (!state.scenarioFacts.apps_closed) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "TestPerformance" } };
  }

  if (state.scenarioFacts.kind === "low_memory") {
    if (!state.scenarioFacts.memory_heavy_apps_closed) {
      return denyProcedure(command.kind);
    }

if (state.scenarioFacts.memory_ok) {
  return denyProcedure(command.kind);
}

    return { kind: "ALLOW", plan: { kind: "TestPerformance" } };
  }

  return denyProcedure(command.kind);
}

// --- HARDWARE / PERIPHERALS COMMANDS --- //

// printer_not_working
if (command.kind === "check_printer_status") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "printer_not_working") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.printer_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckPrinterStatus" } };
}

if (command.kind === "restart_printer") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "printer_not_working") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.printer_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.printer_restarted) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "RestartPrinter" } };
}

if (command.kind === "print_test_page") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "printer_not_working") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.printer_restarted) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "PrintTestPage" } };
}

// disk_space_full
if (command.kind === "check_disk_space") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "disk_space_full") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}
  if (state.scenarioFacts.disk_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckDiskSpace" } };
}

if (command.kind === "clear_temp_files") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "disk_space_full") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.disk_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.temp_files_cleared) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "ClearTempFiles" } };
}

if (command.kind === "confirm_storage_available") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "disk_space_full") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.temp_files_cleared) {
    return denyProcedure(command.kind);
  }

  return {
    kind: "ALLOW",
    plan: { kind: "ConfirmStorageAvailable" },
  };
}

// --- DEVICE / PERFORMANCE COMMANDS --- //

// low_memory

if (command.kind === "check_memory_usage") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "low_memory") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.memory_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckMemoryUsage" } };
}

if (command.kind === "close_memory_heavy_apps") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "low_memory") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.memory_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.memory_heavy_apps_closed) {
    return denyProcedure(command.kind);
  }

  return {
    kind: "ALLOW",
    plan: { kind: "CloseMemoryHeavyApps" },
  };
}

// mouse_keyboard_not_working

if (command.kind === "check_device_connection") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "mouse_keyboard_not_working") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.device_connection_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckDeviceConnection" } };
}

if (command.kind === "reconnect_device") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "mouse_keyboard_not_working") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.device_connection_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.device_reconnected) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "ReconnectDevice" } };
}

if (command.kind === "test_input_device") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "mouse_keyboard_not_working") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.device_reconnected) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.input_device_working) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestInputDevice" } };
}

// --- SOFTWARE / APPLICATIONS COMMANDS --- //

// software_app_not_opening + application_crash

if (command.kind === "check_app_status") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

if (
  !state.scenarioFacts ||
  (
    state.scenarioFacts.kind !== "software_app_not_opening" &&
    state.scenarioFacts.kind !== "application_crash" &&
    state.scenarioFacts.kind !== "software_app_license_not_assigned"
  )
) {
  return denyProcedure(command.kind);
}

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.app_status_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckAppStatus" } };
}

if (command.kind === "check_license_assignment") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (
    !state.scenarioFacts ||
    state.scenarioFacts.kind !== "software_app_license_not_assigned"
  ) {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (!state.scenarioFacts.app_status_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.license_assignment_checked) {
    return denyProcedure(command.kind);
  }

  return {
    kind: "ALLOW",
    plan: { kind: "CheckLicenseAssignment" },
  };
}

if (command.kind === "assign_software_license") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (
    !state.scenarioFacts ||
    state.scenarioFacts.kind !== "software_app_license_not_assigned"
  ) {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.license_assignment_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.software_license_assigned) {
    return denyProcedure(command.kind);
  }

  return {
    kind: "ALLOW",
    plan: { kind: "AssignSoftwareLicense" },
  };
}

if (command.kind === "restart_application") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (
  !state.scenarioFacts ||
  (
    state.scenarioFacts.kind !== "software_app_not_opening" &&
    state.scenarioFacts.kind !== "application_crash"
  )
) {
  return denyProcedure(command.kind);
}

  if (!state.scenarioFacts.app_status_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.application_restarted) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "RestartApplication" } };
}

if (command.kind === "test_application_launch") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (
  !state.scenarioFacts ||
  (
    state.scenarioFacts.kind !== "software_app_not_opening" &&
    state.scenarioFacts.kind !== "application_crash" &&
    state.scenarioFacts.kind !== "software_update_required" &&
    state.scenarioFacts.kind !== "software_app_license_not_assigned"
  )
) {
  return denyProcedure(command.kind);
}

  if (
    state.scenarioFacts.kind === "software_update_required" &&
    !state.scenarioFacts.software_update_installed
  ) {
    return denyProcedure(command.kind);
  }

  if (
    state.scenarioFacts.kind === "software_app_license_not_assigned" &&
    !state.scenarioFacts.software_license_assigned
  ) {
    return denyProcedure(command.kind);
  }

  if (
    state.scenarioFacts.kind !== "software_update_required" &&
    state.scenarioFacts.kind !== "software_app_license_not_assigned" &&
    !state.scenarioFacts.application_restarted
  ) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.application_working) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestApplicationLaunch" } };
}

// software_update_required
if (command.kind === "check_software_version") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "software_update_required") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.software_version_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckSoftwareVersion" } };
}

if (command.kind === "install_software_update") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "software_update_required") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.software_version_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.software_update_installed) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "InstallSoftwareUpdate" } };
}

// microphone_not_working

if (command.kind === "check_microphone_settings") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "microphone_not_working") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.microphone_settings_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckMicrophoneSettings" } };
}

if (command.kind === "enable_microphone") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "microphone_not_working") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.microphone_settings_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.microphone_enabled) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "EnableMicrophone" } };
}

if (command.kind === "test_microphone") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "microphone_not_working") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.microphone_enabled) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestMicrophone" } };
}

// --- SHARED DRIVE ACCESS ISSUE COMMANDS --- //

if (command.kind === "check_shared_drive_permissions") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (
    !state.scenarioFacts ||
    (
      state.scenarioFacts.kind !== "shared_drive_access_issue" &&
      state.scenarioFacts.kind !== "shared_drive_group_membership_missing"
    )
  ) {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.shared_drive_permissions_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckSharedDrivePermissions" } };
}

if (command.kind === "grant_shared_drive_access") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "shared_drive_access_issue") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.shared_drive_permissions_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.shared_drive_access_granted) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "GrantSharedDriveAccess" } };
}

if (command.kind === "add_user_to_group") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (
    !state.scenarioFacts ||
    state.scenarioFacts.kind !==
      "shared_drive_group_membership_missing"
  ) {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (!state.scenarioFacts.shared_drive_permissions_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.user_added_to_group) {
    return denyProcedure(command.kind);
  }

  return {
    kind: "ALLOW",
    plan: { kind: "AddUserToGroup" },
  };
}

if (command.kind === "test_shared_drive_access") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.kind === "shared_drive_access_issue") {
    if (!state.scenarioFacts.shared_drive_access_granted) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "TestSharedDriveAccess" } };
  }

  if (state.scenarioFacts.kind === "shared_drive_group_membership_missing") {
    if (!state.scenarioFacts.user_added_to_group) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "TestSharedDriveAccess" } };
  }

  return denyProcedure(command.kind);
}

// --- FILES / STORAGE COMMANDS --- //

// network_drive_missing
if (command.kind === "check_network_drive_mapping") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

if (
  !state.scenarioFacts ||
  (
    state.scenarioFacts.kind !== "network_drive_missing" &&
    state.scenarioFacts.kind !== "network_drive_vpn_required_first"
  )
) {
  return denyProcedure(command.kind);
}

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

if (
  state.scenarioFacts.kind === "network_drive_vpn_required_first" &&
  !state.scenarioFacts.vpn_access_enabled
) {
  return denyProcedure(command.kind);
}

  if (state.scenarioFacts.network_drive_mapping_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckNetworkDriveMapping" } };
}

if (command.kind === "remap_network_drive") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

if (
  !state.scenarioFacts ||
  (
    state.scenarioFacts.kind !== "network_drive_missing" &&
    state.scenarioFacts.kind !== "network_drive_vpn_required_first"
  )
) {
  return denyProcedure(command.kind);
}

  if (!state.scenarioFacts.network_drive_mapping_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.network_drive_remapped) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "RemapNetworkDrive" } };
}

if (command.kind === "test_network_drive_access") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}
if (
  !state.scenarioFacts ||
  (
    state.scenarioFacts.kind !== "network_drive_missing" &&
    state.scenarioFacts.kind !== "network_drive_vpn_required_first"
  )
) {
  return denyProcedure(command.kind);
}

  if (!state.scenarioFacts.network_drive_remapped) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.network_drive_access_working) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestNetworkDriveAccess" } };
}

// --- PERMISSIONS DENIED COMMANDS --- //

if (command.kind === "check_user_permissions") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "permissions_denied") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.user_permissions_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckUserPermissions" } };
}

if (command.kind === "grant_required_permission") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "permissions_denied") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.user_permissions_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.required_permission_granted) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "GrantRequiredPermission" } };
}

if (command.kind === "test_permission_access") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "permissions_denied") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.required_permission_granted) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.permission_access_working) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestPermissionAccess" } };
}

// folder_access_missing
if (command.kind === "check_folder_permissions") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "folder_access_missing") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.folder_permissions_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckFolderPermissions" } };
}

if (command.kind === "grant_folder_access") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "folder_access_missing") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.folder_permissions_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.folder_access_granted) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "GrantFolderAccess" } };
}

if (command.kind === "test_folder_access") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "folder_access_missing") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.folder_access_granted) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.folder_access_working) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestFolderAccess" } };
}

// webcam_not_working
if (command.kind === "check_webcam_settings") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "webcam_not_working") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.webcam_settings_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckWebcamSettings" } };
}

if (command.kind === "enable_webcam") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "webcam_not_working") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.webcam_settings_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.webcam_enabled) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "EnableWebcam" } };
}

if (command.kind === "test_webcam") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "webcam_not_working") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.webcam_enabled) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestWebcam" } };
}

// --- MFA CODE NOT WORKING COMMANDS --- //

if (command.kind === "check_mfa_status") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (
  !state.scenarioFacts ||
  (
    state.scenarioFacts.kind !== "mfa_code_not_working" &&
    state.scenarioFacts.kind !== "vpn_mfa_dependency_missing"
  )
) {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

if (
  state.scenarioFacts.kind === "vpn_mfa_dependency_missing" &&
  !state.scenarioFacts.vpn_access_enabled
) {
  return denyProcedure(command.kind);
}

if (state.scenarioFacts.mfa_status_checked) {
  return denyProcedure(command.kind);
}

  return { kind: "ALLOW", plan: { kind: "CheckMfaStatus" } };
}

if (command.kind === "reset_mfa_method") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

if (
  !state.scenarioFacts ||
  (
    state.scenarioFacts.kind !== "mfa_code_not_working" &&
    state.scenarioFacts.kind !== "vpn_mfa_dependency_missing"
  )
) {
  return denyProcedure(command.kind);
}

  if (!state.scenarioFacts.mfa_status_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.mfa_method_reset) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "ResetMfaMethod" } };
}

if (command.kind === "test_mfa_login") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

if (
  !state.scenarioFacts ||
  state.scenarioFacts.kind !== "mfa_code_not_working"
) {
  return denyProcedure(command.kind);
}

  if (!state.scenarioFacts.mfa_method_reset) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestMfaLogin" } };
}

// browser_running_slow
if (command.kind === "check_browser_extensions") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "browser_running_slow") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.browser_extensions_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckBrowserExtensions" } };
}

if (command.kind === "disable_unnecessary_extensions") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "browser_running_slow") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.browser_extensions_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.unnecessary_extensions_disabled) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "DisableUnnecessaryExtensions" } };
}

if (command.kind === "test_browser_performance") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "browser_running_slow") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.unnecessary_extensions_disabled) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestBrowserPerformance" } };
}

// --- CANNOT INSTALL SOFTWARE COMMANDS --- //

if (command.kind === "check_install_permissions") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "cannot_install_software") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.install_permissions_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckInstallPermissions" } };
}

if (command.kind === "grant_install_permissions") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "cannot_install_software") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.install_permissions_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.install_permissions_granted) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "GrantInstallPermissions" } };
}

if (command.kind === "test_software_install") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "cannot_install_software") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.install_permissions_granted) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestSoftwareInstall" } };
}

// second_monitor_not_detected
if (command.kind === "check_display_connection") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "second_monitor_not_detected") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.display_connection_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckDisplayConnection" } };
}

if (command.kind === "check_display_settings") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "second_monitor_not_detected") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (!state.scenarioFacts.display_connection_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.display_settings_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckDisplaySettings" } };
}

if (command.kind === "detect_second_monitor") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "second_monitor_not_detected") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.display_settings_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.second_monitor_detected) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "DetectSecondMonitor" } };
}

if (command.kind === "test_dual_display") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "second_monitor_not_detected") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.second_monitor_detected) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestDualDisplay" } };
}

// --- INTERNET NO ACCESS COMMANDS --- //

if (command.kind === "check_network_status") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "internet_no_access") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.network_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckNetworkStatus" } };
}

if (command.kind === "check_network_adapter") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.kind === "internet_no_access") {
    if (!state.scenarioFacts.network_checked) {
      return denyProcedure(command.kind);
    }

    if (state.scenarioFacts.network_adapter_checked) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "CheckNetworkAdapter" } };
  }

  if (state.scenarioFacts.kind === "slow_network_connection") {
    if (!state.scenarioFacts.network_speed_checked) {
      return denyProcedure(command.kind);
    }

    if (state.scenarioFacts.network_adapter_checked) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "CheckNetworkAdapter" } };
  }

  return denyProcedure(command.kind);
}

if (command.kind === "restart_network_adapter") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts) {
    return denyProcedure(command.kind);
  }

    // INTERNET NO ACCESS
  if (state.scenarioFacts.kind === "internet_no_access") {
    if (!state.scenarioFacts.network_adapter_checked) {
      return denyProcedure(command.kind);
    }

    if (state.scenarioFacts.network_adapter_restarted) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "RestartNetworkAdapter" } };
  }

  // SLOW NETWORK CONNECTION
  if (state.scenarioFacts.kind === "slow_network_connection") {
    if (!state.scenarioFacts.network_adapter_checked) {
      return denyProcedure(command.kind);
    }

    if (state.scenarioFacts.network_adapter_restarted) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "RestartNetworkAdapter" } };
  }

  return denyProcedure(command.kind);
}

if (command.kind === "test_internet_connection") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts) {
    return denyProcedure(command.kind);
  }

  // INTERNET NO ACCESS
  if (state.scenarioFacts.kind === "internet_no_access") {
    if (!state.scenarioFacts.network_adapter_restarted) {
      return denyProcedure(command.kind);
    }

    if (state.scenarioFacts.internet_restored) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "TestInternetConnection" } };
  }

  // SLOW NETWORK CONNECTION
  if (state.scenarioFacts.kind === "slow_network_connection") {
    if (!state.scenarioFacts.network_adapter_restarted) {
      return denyProcedure(command.kind);
    }

    if (state.scenarioFacts.internet_speed_restored) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "TestInternetConnection" } };
  }

  // ETHERNET NOT CONNECTED
  if (state.scenarioFacts.kind === "ethernet_not_connected") {
    if (!state.scenarioFacts.ethernet_cable_reconnected) {
      return denyProcedure(command.kind);
    }

    if (state.scenarioFacts.ethernet_connection_restored) {
      return denyProcedure(command.kind);
    }

    return { kind: "ALLOW", plan: { kind: "TestInternetConnection" } };
  }

  return denyProcedure(command.kind);
}

// cannot_open_file

if (command.kind === "check_file_open_error") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "cannot_open_file") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}

  if (state.scenarioFacts.file_open_error_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckFileOpenError" } };
}

if (command.kind === "check_file_association") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "cannot_open_file") {
    return denyProcedure(command.kind);
  }

const identityCheck = mustHaveIdentityVerified(
  state,
  command.kind
);

if (identityCheck) {
  return identityCheck;
}
  if (!state.scenarioFacts.file_open_error_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.file_association_checked) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "CheckFileAssociation" } };
}

if (command.kind === "repair_file_association") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "cannot_open_file") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.file_association_checked) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.file_association_repaired) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "RepairFileAssociation" } };
}

if (command.kind === "test_file_open") {
  const runningCheck = mustBeRunning(state);

if (runningCheck) {
  return runningCheck;
}

  if (!state.scenarioFacts || state.scenarioFacts.kind !== "cannot_open_file") {
    return denyProcedure(command.kind);
  }

  if (!state.scenarioFacts.file_association_repaired) {
    return denyProcedure(command.kind);
  }

  if (state.scenarioFacts.file_opens_successfully) {
    return denyProcedure(command.kind);
  }

  return { kind: "ALLOW", plan: { kind: "TestFileOpen" } };
}

  // Safety fallback (should be unreachable with current Command union)
  return { kind: "DENY", reason: "Command not supported." };
}
