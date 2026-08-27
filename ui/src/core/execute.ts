import type { ExecutionPlan, SimState, StatePatch } from "./types";
import { getScenarioDefaults } from "./scenarioRegistry";

function assertNever(value: never): never {
  throw new Error(
    `[EXECUTE INVARIANT] Unhandled execution plan: ${
      (value as ExecutionPlan).kind
    }`
  );
}

type ScenarioFacts = NonNullable<SimState["scenarioFacts"]>;
type ScenarioFactKind = ScenarioFacts["kind"];

type ScenarioFactsFor<
  Kind extends ScenarioFactKind
> = Extract<ScenarioFacts, { kind: Kind }>;

function getScenarioFacts<
  Kind extends ScenarioFactKind
>(
  state: SimState,
  scenarioKind: Kind
): ScenarioFactsFor<Kind> | null {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== scenarioKind) {
    return null;
  }

  return facts as ScenarioFactsFor<Kind>;
}

function wrongScenarioError(
  code: string,
  message: string,
  failingCommand: string
): StatePatch {
  return {
    error: {
      code,
      message,
      failingCommand,
    },
  };
}

function updateScenarioFacts<
  T extends ScenarioFacts
>(
  facts: T,
  updates: Partial<T>
): StatePatch {
  return {
    scenarioFacts: {
      ...facts,
      ...updates,
    },
    error: null,
  };
}

function completeScenario<
  T extends ScenarioFacts
>(
  facts: T,
  updates: Partial<T>
): StatePatch {
  return {
    scenarioFacts: {
      ...facts,
      ...updates,
    },
    result: {
      totalScore: 0,
      mistakes: 0,
      completion: "PASS",
    },
    executionState: "SCORECARD",
    error: null,
  };
}

// Executor: converts an authorized plan into a patch.
// No legitimacy decisions. No mutation here.
export function executePlan(
  state: SimState,
  plan: ExecutionPlan
): StatePatch {
  switch (plan.kind) {
    // --- SYSTEM / CONTROL PLANS --- //
    case "StartNewAttempt": {
      const nextNumber = (state.attempt?.number ?? 0) + 1;

      const scenarioId = state.previewScenario ?? state.scenario;
      const facts = scenarioId ? getScenarioDefaults(scenarioId) : null;

      return {
        newAttempt: { number: nextNumber },
        scenario: scenarioId,
        previewScenario: null,
        executionState: "RUNNING",
        error: null,
        result: null,
        scenarioFacts: facts,
        procedureHelpOpenedCount: 0,
        procedureHelpUsedDuring: [],
      };
    }

    case "SelectScenario": {
      return {
        previewScenario: plan.scenario_id,
        scenario: null,
        scenarioFacts: null,
        attempt: null,
        error: null,
        result: null,
        executionState: "LOBBY",
      };
    }

    // --- SHARED PLANS --- //
case "VerifyIdentity": {
  const facts = state.scenarioFacts;

  if (!facts || !("identity_verified" in facts)) {
    return wrongScenarioError(
      "VERIFY_IDENTITY_WRONG_SCENARIO",
      "That action is not available right now.",
      "verify_identity"
    );
  }

  if (facts.identity_verified) {
    return {
      error: {
        code: "VERIFY_IDENTITY_ALREADY_VERIFIED",
        message: "Identity already verified.",
        failingCommand: "verify_identity",
      },
    };
  }

  return updateScenarioFacts(facts, {
    identity_verified: true,
  });
}
   
    // --- ACCOUNT / ACCESS PLANS --- //

    // password_reset
    case "SendResetCode": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "password_reset" &&
      facts.kind !== "password_reset_recovery_email_never_arrives" &&
      facts.kind !== "password_reset_recovery_email_outdated"
    )
  ) {
    return wrongScenarioError(
      "SEND_RESET_CODE_WRONG_SCENARIO",
      "send_reset_code is only valid in password reset scenarios.",
      "send_reset_code"
    );
  }

  if (facts.identity_verified !== true) {
    return {
      error: {
        code: "SEND_RESET_CODE_IDENTITY_NOT_VERIFIED",
        message: "Must verify identity before sending reset code.",
        failingCommand: "send_reset_code",
      },
    };
  }

  if (facts.code_sent === true) {
    return {
      error: {
        code: "SEND_RESET_CODE_ALREADY_SENT",
        message: "Reset code already sent.",
        failingCommand: "send_reset_code",
      },
    };
  }

  return updateScenarioFacts(facts, {
    code_sent: true,
  });
}

    case "ResendResetCode": {
  const facts = getScenarioFacts(
    state,
    "password_reset_recovery_email_never_arrives"
  );

  if (!facts) {
    return wrongScenarioError(
      "RESEND_RESET_CODE_WRONG_SCENARIO",
      "resend_reset_code is only valid in the recovery email challenge.",
      "resend_reset_code"
    );
  }

  return updateScenarioFacts(facts, {
    email_arrived: true,
  });
}

case "VerifyAlternateContact": {
  const facts = getScenarioFacts(
    state,
    "password_reset_recovery_email_outdated"
  );

  if (!facts) {
    return wrongScenarioError(
      "VERIFY_ALTERNATE_CONTACT_WRONG_SCENARIO",
      "verify_alternate_contact is only valid in password_reset_recovery_email_outdated scenario.",
      "verify_alternate_contact"
    );
  }

  return updateScenarioFacts(facts, {
    alternate_contact_verified: true,
  });
}

case "UpdateRecoveryEmail": {
  const facts = getScenarioFacts(
    state,
    "password_reset_recovery_email_outdated"
  );

  if (!facts) {
    return wrongScenarioError(
      "UPDATE_RECOVERY_EMAIL_WRONG_SCENARIO",
      "update_recovery_email is only valid in password_reset_recovery_email_outdated scenario.",
      "update_recovery_email"
    );
  }

  return updateScenarioFacts(facts, {
    recovery_email_updated: true,
  });
}

    case "ConfirmReset": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "password_reset" &&
      facts.kind !== "password_reset_recovery_email_never_arrives" &&
      facts.kind !== "password_reset_recovery_email_outdated"
    )
  ) {
    return wrongScenarioError(
      "CONFIRM_RESET_WRONG_SCENARIO",
      "confirm_reset is only valid in password reset scenarios.",
      "confirm_reset"
    );
  }

  if (facts.identity_verified !== true) {
    return {
      error: {
        code: "CONFIRM_RESET_IDENTITY_NOT_VERIFIED",
        message: "Must verify identity before confirming reset.",
        failingCommand: "confirm_reset",
      },
    };
  }

  if (facts.code_sent !== true) {
    return {
      error: {
        code: "CONFIRM_RESET_CODE_NOT_SENT",
        message: "Must send reset code before confirming reset.",
        failingCommand: "confirm_reset",
      },
    };
  }

  if (facts.reset_done === true) {
    return {
      error: {
        code: "CONFIRM_RESET_ALREADY_DONE",
        message: "Reset already confirmed.",
        failingCommand: "confirm_reset",
      },
    };
  }

  return updateScenarioFacts(facts, {
    reset_done: true,
  });
}

    case "SetNewPassword": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "password_reset" &&
      facts.kind !== "password_reset_recovery_email_never_arrives" &&
      facts.kind !== "password_reset_recovery_email_outdated"
    )
  ) {
    return wrongScenarioError(
      "SET_NEW_PASSWORD_WRONG_SCENARIO",
      "set_new_password is only valid in password reset scenarios.",
      "set_new_password"
    );
  }

  if (facts.identity_verified !== true) {
    return {
      error: {
        code: "SET_NEW_PASSWORD_IDENTITY_NOT_VERIFIED",
        message: "Must verify identity before setting new password.",
        failingCommand: "set_new_password",
      },
    };
  }

  if (facts.code_sent !== true) {
    return {
      error: {
        code: "SET_NEW_PASSWORD_CODE_NOT_SENT",
        message: "Must send reset code before setting new password.",
        failingCommand: "set_new_password",
      },
    };
  }

  if (facts.reset_done !== true) {
    return {
      error: {
        code: "SET_NEW_PASSWORD_RESET_NOT_CONFIRMED",
        message: "Must confirm reset before setting new password.",
        failingCommand: "set_new_password",
      },
    };
  }

  if (facts.password_updated === true) {
    return {
      error: {
        code: "SET_NEW_PASSWORD_ALREADY_DONE",
        message: "New password has already been set.",
        failingCommand: "set_new_password",
      },
    };
  }

  return updateScenarioFacts(facts, {
    password_updated: true,
  });
}

case "TestSignIn": {
  const facts = state.scenarioFacts;

  if (!facts) {
    return wrongScenarioError(
      "TEST_SIGN_IN_NO_FACTS",
      "No scenario facts found.",
      "test_sign_in"
    );
  }

  if (
    facts.kind === "password_reset" ||
    facts.kind ===
      "password_reset_recovery_email_never_arrives" ||
    facts.kind ===
      "password_reset_recovery_email_outdated"
  ) {
    if (!facts.password_updated) {
      return {
        error: {
          code: "TEST_SIGN_IN_PASSWORD_NOT_UPDATED",
          message:
            "Must set new password before testing sign-in.",
          failingCommand: "test_sign_in",
        },
      };
    }

    return completeScenario(facts, {
      can_login_now: true,
    });
  }

  if (
    facts.kind ===
    "account_lockout_saved_credentials"
  ) {
    if (!facts.first_sign_in_attempted) {
      return updateScenarioFacts(facts, {
        first_sign_in_attempted: true,
        account_locked: true,
        can_login_now: false,
      });
    }

    if (
      !facts.saved_credentials_updated ||
      !facts.account_unlocked_after_fix
    ) {
      return {
        error: {
          code:
            "TEST_SIGN_IN_LOCKOUT_FIX_INCOMPLETE",
          message:
            "Must update the saved credentials and unlock the account again before the final sign-in test.",
          failingCommand: "test_sign_in",
        },
      };
    }

    return completeScenario(facts, {
      can_login_now: true,
    });
  }

  return wrongScenarioError(
    "TEST_SIGN_IN_WRONG_SCENARIO",
    "test_sign_in is not valid for this scenario.",
    "test_sign_in"
  );
}

// account_lockout

case "RequestUnlock": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "account_lockout" &&
      facts.kind !== "account_lockout_saved_credentials"
    )
  ) {
    return wrongScenarioError(
      "REQUEST_UNLOCK_WRONG_SCENARIO",
      "request_unlock is only valid in account lockout scenarios.",
      "request_unlock"
    );
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "REQUEST_UNLOCK_IDENTITY_NOT_VERIFIED",
        message:
          "Must verify identity before requesting unlock.",
        failingCommand: "request_unlock",
      },
    };
  }

  if (!facts.account_locked) {
    return {
      error: {
        code: "REQUEST_UNLOCK_ACCOUNT_NOT_LOCKED",
        message:
          "The account must be locked before another unlock can be requested.",
        failingCommand: "request_unlock",
      },
    };
  }

  if (facts.unlock_requested) {
    return {
      error: {
        code: "REQUEST_UNLOCK_ALREADY_REQUESTED",
        message: "Unlock already requested.",
        failingCommand: "request_unlock",
      },
    };
  }

  if (
    facts.kind === "account_lockout_saved_credentials" &&
    facts.first_sign_in_attempted &&
    !facts.saved_credentials_updated
  ) {
    return {
      error: {
        code:
          "REQUEST_UNLOCK_SAVED_CREDENTIALS_NOT_UPDATED",
        message:
          "Must identify and update the outdated saved credentials before requesting the second unlock.",
        failingCommand: "request_unlock",
      },
    };
  }

  return updateScenarioFacts(facts, {
    unlock_requested: true,
  });
}


case "ConfirmUnlock": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "account_lockout" &&
      facts.kind !== "account_lockout_saved_credentials"
    )
  ) {
    return wrongScenarioError(
      "CONFIRM_UNLOCK_WRONG_SCENARIO",
      "confirm_unlock is only valid in account lockout scenarios.",
      "confirm_unlock"
    );
  }

  if (!facts.unlock_requested) {
    return {
      error: {
        code: "CONFIRM_UNLOCK_NOT_REQUESTED",
        message:
          "Must request unlock before confirming.",
        failingCommand: "confirm_unlock",
      },
    };
  }

  if (facts.kind === "account_lockout") {
    return completeScenario(facts, {
      account_locked: false,
      unlock_requested: false,
      can_login_now: true,
    });
  }

  if (!facts.first_sign_in_attempted) {
    return updateScenarioFacts(facts, {
      account_locked: false,
      unlock_requested: false,
      account_unlocked_after_fix: false,
      can_login_now: false,
    });
  }

  if (!facts.saved_credentials_updated) {
    return {
      error: {
        code:
          "CONFIRM_UNLOCK_SAVED_CREDENTIALS_NOT_UPDATED",
        message:
          "Must update the outdated saved credentials before confirming the second unlock.",
        failingCommand: "confirm_unlock",
      },
    };
  }

  return updateScenarioFacts(facts, {
    account_locked: false,
    unlock_requested: false,
    account_unlocked_after_fix: true,
    can_login_now: false,
  });
}

case "ReviewFailedAuthenticationAttempts": {
  const facts = getScenarioFacts(
    state,
    "account_lockout_saved_credentials"
  );

  if (!facts) {
    return wrongScenarioError(
      "REVIEW_FAILED_AUTHENTICATION_ATTEMPTS_WRONG_SCENARIO",
      "review_failed_authentication_attempts is only valid in account_lockout_saved_credentials scenario.",
      "review_failed_authentication_attempts"
    );
  }

  return updateScenarioFacts(facts, {
    repeated_authentication_attempts_reviewed: true,
  });
}

case "UpdateSavedCredentials": {
  const facts = getScenarioFacts(
    state,
    "account_lockout_saved_credentials"
  );

  if (!facts) {
    return wrongScenarioError(
      "UPDATE_SAVED_CREDENTIALS_WRONG_SCENARIO",
      "update_saved_credentials is only valid in account_lockout_saved_credentials scenario.",
      "update_saved_credentials"
    );
  }

  return updateScenarioFacts(facts, {
    saved_credentials_updated: true,
    unlock_requested: false,
    account_locked: true,
    account_unlocked_after_fix: false,
    can_login_now: false,
  });
}

// vpn_access_issue

    // vpn_access_issue

    case "CheckVpnAccess": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "vpn_access_issue" &&
      facts.kind !== "vpn_mfa_dependency_missing" &&
      facts.kind !== "network_drive_vpn_required_first"
    )
  ) {
    return wrongScenarioError(
      "CHECK_VPN_ACCESS_WRONG_SCENARIO",
      "check_vpn_access is only valid in VPN scenarios.",
      "check_vpn_access"
    );
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "CHECK_VPN_ACCESS_IDENTITY_NOT_VERIFIED",
        message: "Must verify identity before checking VPN access.",
        failingCommand: "check_vpn_access",
      },
    };
  }

  if (facts.vpn_access_checked) {
    return {
      error: {
        code: "CHECK_VPN_ACCESS_ALREADY_DONE",
        message: "VPN access already checked.",
        failingCommand: "check_vpn_access",
      },
    };
  }

  return updateScenarioFacts(facts, {
    vpn_access_checked: true,
  });
}

   case "EnableVpnAccess": {
  const facts = state.scenarioFacts;

    if (
    !facts ||
    (
      facts.kind !== "vpn_access_issue" &&
      facts.kind !== "network_drive_vpn_required_first"
    )
  ) {
    return wrongScenarioError(
      "ENABLE_VPN_WRONG_SCENARIO",
      "enable_vpn_access is only valid in VPN scenarios.",
      "enable_vpn_access"
    );
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "ENABLE_VPN_IDENTITY_NOT_VERIFIED",
        message: "Must verify identity before enabling VPN access.",
        failingCommand: "enable_vpn_access",
      },
    };
  }

  if (!facts.vpn_access_checked) {
    return {
      error: {
        code: "ENABLE_VPN_NOT_CHECKED",
        message: "Must check VPN access before enabling it.",
        failingCommand: "enable_vpn_access",
      },
    };
  }

  if (facts.vpn_access_enabled) {
    return {
      error: {
        code: "ENABLE_VPN_ALREADY_DONE",
        message: "VPN access already enabled.",
        failingCommand: "enable_vpn_access",
      },
    };
  }

  return updateScenarioFacts(facts, {
    vpn_access_enabled: true,
  });
}

   case "ConfirmConnection": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "vpn_access_issue" &&
      facts.kind !== "vpn_mfa_dependency_missing"
    )
  ) {
    return wrongScenarioError(
      "CONFIRM_CONNECTION_WRONG_SCENARIO",
      "confirm_connection is only valid in VPN access scenarios.",
      "confirm_connection"
    );
  }

  if (!facts.vpn_access_enabled) {
    return {
      error: {
        code: "CONFIRM_CONNECTION_NOT_READY",
        message: "Must enable VPN access before confirming connection.",
        failingCommand: "confirm_connection",
      },
    };
  }

  if (
    facts.kind === "vpn_mfa_dependency_missing" &&
    !facts.mfa_method_reset
  ) {
    return {
      error: {
        code: "CONFIRM_CONNECTION_MFA_NOT_RESET",
        message: "Must reset MFA before confirming connection.",
        failingCommand: "confirm_connection",
      },
    };
  }

  return completeScenario(facts, {
    can_connect_now: true,
  });
}

    // --- EMAIL PLANS --- //

    // email_not_sending
    case "CheckEmailStatus": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "email_not_sending" &&
      facts.kind !== "email_not_sending_outbox"
    )
  ) {
    return wrongScenarioError(
      "CHECK_EMAIL_STATUS_WRONG_SCENARIO",
      "check_email_status is only valid in email-not-sending scenarios.",
      "check_email_status"
    );
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "CHECK_EMAIL_STATUS_IDENTITY_NOT_VERIFIED",
        message:
          "Must verify identity before checking email status.",
        failingCommand: "check_email_status",
      },
    };
  }

  if (facts.email_status_checked) {
    return {
      error: {
        code: "CHECK_EMAIL_STATUS_ALREADY_DONE",
        message: "Email status already checked.",
        failingCommand: "check_email_status",
      },
    };
  }

  return updateScenarioFacts(facts, {
    email_status_checked: true,
  });
}

case "EnableEmailClient": {
  const facts = getScenarioFacts(
    state,
    "email_not_sending"
  );

  if (!facts) {
    return wrongScenarioError(
      "ENABLE_EMAIL_CLIENT_WRONG_SCENARIO",
      "enable_email_client is only valid in email_not_sending scenario.",
      "enable_email_client"
    );
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "ENABLE_EMAIL_CLIENT_IDENTITY_NOT_VERIFIED",
        message: "Must verify identity before enabling email client.",
        failingCommand: "enable_email_client",
      },
    };
  }

  if (!facts.email_status_checked) {
    return {
      error: {
        code: "ENABLE_EMAIL_CLIENT_STATUS_NOT_CHECKED",
        message: "Must check email status before enabling email client.",
        failingCommand: "enable_email_client",
      },
    };
  }

  if (facts.email_client_online) {
    return {
      error: {
        code: "ENABLE_EMAIL_CLIENT_ALREADY_ONLINE",
        message: "Email client is already online.",
        failingCommand: "enable_email_client",
      },
    };
  }

  return updateScenarioFacts(facts, {
    email_client_online: true,
  });
}

case "CheckOutbox": {
  const facts = getScenarioFacts(
    state,
    "email_not_sending_outbox"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_OUTBOX_WRONG_SCENARIO",
      "check_outbox is only valid in the stuck-Outbox email scenario.",
      "check_outbox"
    );
  }

  if (!facts.first_send_test_completed) {
    return {
      error: {
        code: "CHECK_OUTBOX_SEND_TEST_NOT_COMPLETED",
        message:
          "Must reproduce the email send failure before checking the Outbox.",
        failingCommand: "check_outbox",
      },
    };
  }

  if (facts.outbox_checked) {
    return {
      error: {
        code: "CHECK_OUTBOX_ALREADY_DONE",
        message: "The Outbox has already been checked.",
        failingCommand: "check_outbox",
      },
    };
  }

  return updateScenarioFacts(facts, {
    outbox_checked: true,
  });
}

case "SendStuckOutboxEmail": {
  const facts = getScenarioFacts(
    state,
    "email_not_sending_outbox"
  );

  if (!facts) {
    return wrongScenarioError(
      "SEND_STUCK_OUTBOX_EMAIL_WRONG_SCENARIO",
      "send_stuck_outbox_email is only valid in the stuck-Outbox email scenario.",
      "send_stuck_outbox_email"
    );
  }

  if (!facts.outbox_checked) {
    return {
      error: {
        code: "SEND_STUCK_OUTBOX_EMAIL_NOT_CHECKED",
        message:
          "Must check the Outbox before releasing the stuck message.",
        failingCommand: "send_stuck_outbox_email",
      },
    };
  }

  if (facts.stuck_outbox_email_sent) {
    return {
      error: {
        code: "SEND_STUCK_OUTBOX_EMAIL_ALREADY_DONE",
        message:
          "The stuck Outbox message has already been sent.",
        failingCommand: "send_stuck_outbox_email",
      },
    };
  }

  return updateScenarioFacts(facts, {
    stuck_outbox_email_sent: true,
  });
}

case "SendTestEmail": {
  const facts = state.scenarioFacts;

  if (!facts) {
    return wrongScenarioError(
      "SEND_TEST_EMAIL_NO_FACTS",
      "No scenario facts found.",
      "send_test_email"
    );
  }

  if (facts.kind === "email_not_sending") {
    if (!facts.email_client_online) {
      return {
        error: {
          code: "SEND_TEST_EMAIL_CLIENT_OFFLINE",
          message:
            "Must enable email client before sending test email.",
          failingCommand: "send_test_email",
        },
      };
    }

    return completeScenario(facts, {
      can_send_email: true,
    });
  }

  if (facts.kind === "email_not_sending_outbox") {
    if (!facts.email_status_checked) {
      return {
        error: {
          code: "SEND_TEST_EMAIL_STATUS_NOT_CHECKED",
          message:
            "Must check email status before sending a test email.",
          failingCommand: "send_test_email",
        },
      };
    }

    if (!facts.first_send_test_completed) {
      return updateScenarioFacts(facts, {
        first_send_test_completed: true,
        can_send_email: false,
      });
    }

    if (!facts.stuck_outbox_email_sent) {
      return {
        error: {
          code: "SEND_TEST_EMAIL_OUTBOX_FIX_INCOMPLETE",
          message:
            "Must check the Outbox and release the stuck message before the final test email.",
          failingCommand: "send_test_email",
        },
      };
    }

    return completeScenario(facts, {
      can_send_email: true,
    });
  }

  if (facts.kind === "not_receiving_email") {
  if (!facts.email_client_resynced) {
    return {
      error: {
        code: "SEND_TEST_EMAIL_SYNC_NOT_COMPLETED",
        message:
          "Must sync the mailbox before testing incoming email.",
        failingCommand: "send_test_email",
      },
    };
  }

  return completeScenario(facts, {
    can_receive_email: true,
  });
}

if (
  facts.kind ===
  "not_receiving_email_inbox_rule_redirecting"
) {
  if (!facts.email_client_resynced) {
    return {
      error: {
        code: "SEND_TEST_EMAIL_SYNC_NOT_COMPLETED",
        message:
          "Must sync the mailbox before testing incoming email.",
        failingCommand: "send_test_email",
      },
    };
  }

  if (!facts.first_receive_test_completed) {
    return updateScenarioFacts(facts, {
      first_receive_test_completed: true,
      can_receive_email: false,
    });
  }

  if (!facts.filter_disabled) {
    return {
      error: {
        code: "SEND_TEST_EMAIL_RULE_STILL_ACTIVE",
        message:
          "Must resolve the inbox rule before the final incoming email test.",
        failingCommand: "send_test_email",
      },
    };
  }

  return completeScenario(facts, {
    can_receive_email: true,
  });
}

  if (
    facts.kind === "mailbox_full" ||
    facts.kind ===
      "mailbox_full_archive_policy_not_applied"
  ) {
    if (!facts.old_emails_archived) {
      return {
        error: {
          code: "SEND_TEST_EMAIL_MAILBOX_STILL_FULL",
          message:
            "Must archive old emails before testing email delivery.",
          failingCommand: "send_test_email",
        },
      };
    }

    return completeScenario(facts, {
      mailbox_receiving_email: true,
    });
  }

  if (facts.kind === "attachment_too_large") {
    if (!facts.attachment_compressed) {
      return {
        error: {
          code: "SEND_TEST_EMAIL_ATTACHMENT_NOT_COMPRESSED",
          message: "Must compress attachment before sending test email.",
          failingCommand: "send_test_email",
        },
      };
    }

    return completeScenario(facts, {
      test_email_sent: true,
    });
  }

  return wrongScenarioError(
    "SEND_TEST_EMAIL_WRONG_SCENARIO",
    "send_test_email is not valid for this scenario.",
    "send_test_email"
  );
}

// mailbox_full
case "CheckMailboxStorage": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "mailbox_full" &&
      facts.kind !==
        "mailbox_full_archive_policy_not_applied"
    )
  ) {
    return wrongScenarioError(
      "CHECK_MAILBOX_STORAGE_WRONG_SCENARIO",
      "check_mailbox_storage is only valid in mailbox-full scenarios.",
      "check_mailbox_storage"
    );
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "CHECK_MAILBOX_STORAGE_IDENTITY_NOT_VERIFIED",
        message:
          "Must verify identity before checking mailbox storage.",
        failingCommand: "check_mailbox_storage",
      },
    };
  }

  if (facts.mailbox_storage_checked) {
    return {
      error: {
        code: "CHECK_MAILBOX_STORAGE_ALREADY_DONE",
        message: "Mailbox storage has already been checked.",
        failingCommand: "check_mailbox_storage",
      },
    };
  }

  return updateScenarioFacts(facts, {
    mailbox_storage_checked: true,
  });
}

case "CheckArchivePolicy": {
  const facts = getScenarioFacts(
    state,
    "mailbox_full_archive_policy_not_applied"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_ARCHIVE_POLICY_WRONG_SCENARIO",
      "check_archive_policy is only valid in the archive-policy mailbox challenge.",
      "check_archive_policy"
    );
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "CHECK_ARCHIVE_POLICY_IDENTITY_NOT_VERIFIED",
        message:
          "Must verify identity before checking the archive policy.",
        failingCommand: "check_archive_policy",
      },
    };
  }

  if (!facts.mailbox_storage_checked) {
    return {
      error: {
        code: "CHECK_ARCHIVE_POLICY_STORAGE_NOT_CHECKED",
        message:
          "Must check mailbox storage before checking the archive policy.",
        failingCommand: "check_archive_policy",
      },
    };
  }

  if (facts.archive_policy_checked) {
    return {
      error: {
        code: "CHECK_ARCHIVE_POLICY_ALREADY_DONE",
        message: "The archive policy has already been checked.",
        failingCommand: "check_archive_policy",
      },
    };
  }

  return updateScenarioFacts(facts, {
    archive_policy_checked: true,
  });
}

case "ApplyArchivePolicy": {
  const facts = getScenarioFacts(
    state,
    "mailbox_full_archive_policy_not_applied"
  );

  if (!facts) {
    return wrongScenarioError(
      "APPLY_ARCHIVE_POLICY_WRONG_SCENARIO",
      "apply_archive_policy is only valid in the archive-policy mailbox challenge.",
      "apply_archive_policy"
    );
  }

  if (!facts.archive_policy_checked) {
    return {
      error: {
        code: "APPLY_ARCHIVE_POLICY_NOT_CHECKED",
        message:
          "Must check the archive policy before applying it.",
        failingCommand: "apply_archive_policy",
      },
    };
  }

  if (facts.archive_policy_applied) {
    return {
      error: {
        code: "APPLY_ARCHIVE_POLICY_ALREADY_DONE",
        message: "The archive policy has already been applied.",
        failingCommand: "apply_archive_policy",
      },
    };
  }

  return updateScenarioFacts(facts, {
    archive_policy_applied: true,
  });
}

case "ArchiveOldEmails": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "mailbox_full" &&
      facts.kind !==
        "mailbox_full_archive_policy_not_applied"
    )
  ) {
    return wrongScenarioError(
      "ARCHIVE_OLD_EMAILS_WRONG_SCENARIO",
      "archive_old_emails is only valid in mailbox-full scenarios.",
      "archive_old_emails"
    );
  }

  if (!facts.mailbox_storage_checked) {
    return {
      error: {
        code: "ARCHIVE_OLD_EMAILS_STORAGE_NOT_CHECKED",
        message:
          "Must check mailbox storage before archiving old emails.",
        failingCommand: "archive_old_emails",
      },
    };
  }

  if (
    facts.kind ===
      "mailbox_full_archive_policy_not_applied" &&
    !facts.archive_policy_applied
  ) {
    return {
      error: {
        code: "ARCHIVE_OLD_EMAILS_POLICY_NOT_APPLIED",
        message:
          "The archive policy must be applied before old emails can be archived.",
        failingCommand: "archive_old_emails",
      },
    };
  }

  if (facts.old_emails_archived) {
    return {
      error: {
        code: "ARCHIVE_OLD_EMAILS_ALREADY_DONE",
        message: "Old emails have already been archived.",
        failingCommand: "archive_old_emails",
      },
    };
  }

  return updateScenarioFacts(facts, {
    old_emails_archived: true,
  });
}

// shared_mailbox_missing

case "CheckSharedMailboxMembership": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "shared_mailbox_missing" &&
      facts.kind !==
        "shared_mailbox_outlook_profile_not_updated" &&
      facts.kind !==
        "shared_mailbox_automapping_missing"
    )
  ) {
    return wrongScenarioError(
      "CHECK_SHARED_MAILBOX_MEMBERSHIP_WRONG_SCENARIO",
      "check_shared_mailbox_membership is only valid in shared mailbox scenarios.",
      "check_shared_mailbox_membership"
    );
  }

  return updateScenarioFacts(facts, {
    shared_mailbox_membership_checked: true,
  });
}

case "CheckSharedMailboxAutomapping": {
  const facts = getScenarioFacts(
    state,
    "shared_mailbox_automapping_missing"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_SHARED_MAILBOX_AUTOMAPPING_WRONG_SCENARIO",
      "check_shared_mailbox_automapping is only valid in the shared mailbox auto-mapping challenge.",
      "check_shared_mailbox_automapping"
    );
  }

  if (!facts.shared_mailbox_access_tested) {
    return {
      error: {
        code:
          "CHECK_SHARED_MAILBOX_AUTOMAPPING_ACCESS_NOT_TESTED",
        message:
          "Must test shared mailbox access before checking auto-mapping.",
        failingCommand:
          "check_shared_mailbox_automapping",
      },
    };
  }

  return updateScenarioFacts(facts, {
    shared_mailbox_automapping_checked: true,
  });
}

case "EnableSharedMailboxAutomapping": {
  const facts = getScenarioFacts(
    state,
    "shared_mailbox_automapping_missing"
  );

  if (!facts) {
    return wrongScenarioError(
      "ENABLE_SHARED_MAILBOX_AUTOMAPPING_WRONG_SCENARIO",
      "enable_shared_mailbox_automapping is only valid in the shared mailbox auto-mapping challenge.",
      "enable_shared_mailbox_automapping"
    );
  }

  if (!facts.shared_mailbox_automapping_checked) {
    return {
      error: {
        code:
          "ENABLE_SHARED_MAILBOX_AUTOMAPPING_NOT_CHECKED",
        message:
          "Must check shared mailbox auto-mapping before enabling it.",
        failingCommand:
          "enable_shared_mailbox_automapping",
      },
    };
  }

  return updateScenarioFacts(facts, {
    shared_mailbox_automapping_enabled: true,
  });
}

case "GrantSharedMailboxAccess": {
  const facts = getScenarioFacts(
    state,
    "shared_mailbox_missing"
  );

  if (!facts) {
    return wrongScenarioError(
      "GRANT_SHARED_MAILBOX_ACCESS_WRONG_SCENARIO",
      "grant_shared_mailbox_access is only valid in shared_mailbox_missing scenario.",
      "grant_shared_mailbox_access"
    );
  }

  return updateScenarioFacts(facts, {
    shared_mailbox_access_granted: true,
  });
}

case "CheckOutlookMailboxConfiguration": {
  const facts = getScenarioFacts(
    state,
    "shared_mailbox_outlook_profile_not_updated"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_OUTLOOK_MAILBOX_CONFIGURATION_WRONG_SCENARIO",
      "check_outlook_mailbox_configuration is only valid in the Outlook profile shared mailbox challenge.",
      "check_outlook_mailbox_configuration"
    );
  }

  if (!facts.shared_mailbox_access_tested) {
    return {
      error: {
        code:
          "CHECK_OUTLOOK_MAILBOX_CONFIGURATION_ACCESS_NOT_TESTED",
        message:
          "Must test shared mailbox access before checking the Outlook mailbox configuration.",
        failingCommand:
          "check_outlook_mailbox_configuration",
      },
    };
  }

  return updateScenarioFacts(facts, {
    outlook_mailbox_configuration_checked: true,
  });
}

case "AddSharedMailboxToOutlookProfile": {
  const facts = getScenarioFacts(
    state,
    "shared_mailbox_outlook_profile_not_updated"
  );

  if (!facts) {
    return wrongScenarioError(
      "ADD_SHARED_MAILBOX_TO_OUTLOOK_PROFILE_WRONG_SCENARIO",
      "add_shared_mailbox_to_outlook_profile is only valid in the Outlook profile shared mailbox challenge.",
      "add_shared_mailbox_to_outlook_profile"
    );
  }

  if (!facts.outlook_mailbox_configuration_checked) {
    return {
      error: {
        code:
          "ADD_SHARED_MAILBOX_TO_OUTLOOK_PROFILE_CONFIGURATION_NOT_CHECKED",
        message:
          "Must check the Outlook mailbox configuration before adding the shared mailbox.",
        failingCommand:
          "add_shared_mailbox_to_outlook_profile",
      },
    };
  }

  return updateScenarioFacts(facts, {
    shared_mailbox_added_to_outlook_profile: true,
  });
}

case "TestSharedMailboxAccess": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "shared_mailbox_missing" &&
      facts.kind !==
        "shared_mailbox_outlook_profile_not_updated" &&
      facts.kind !==
        "shared_mailbox_automapping_missing"
    )
  ) {
    return wrongScenarioError(
      "TEST_SHARED_MAILBOX_ACCESS_WRONG_SCENARIO",
      "test_shared_mailbox_access is only valid in shared mailbox scenarios.",
      "test_shared_mailbox_access"
    );
  }

  if (facts.kind === "shared_mailbox_missing") {
    return completeScenario(facts, {
      shared_mailbox_working: true,
    });
  }

  if (!facts.shared_mailbox_access_tested) {
    return updateScenarioFacts(facts, {
      shared_mailbox_access_tested: true,
      shared_mailbox_working: false,
    });
  }

  if (
    facts.kind ===
    "shared_mailbox_outlook_profile_not_updated"
  ) {
    if (!facts.shared_mailbox_added_to_outlook_profile) {
      return {
        error: {
          code:
            "TEST_SHARED_MAILBOX_ACCESS_PROFILE_NOT_UPDATED",
          message:
            "The shared mailbox must be added to the Outlook profile before access can be verified.",
          failingCommand:
            "test_shared_mailbox_access",
        },
      };
    }

    return completeScenario(facts, {
      shared_mailbox_working: true,
    });
  }

  if (
    !facts.shared_mailbox_automapping_enabled ||
    !facts.application_restarted
  ) {
    return {
      error: {
        code:
          "TEST_SHARED_MAILBOX_ACCESS_AUTOMAPPING_FIX_INCOMPLETE",
        message:
          "Must enable shared mailbox auto-mapping and restart Outlook before the final access test.",
        failingCommand:
          "test_shared_mailbox_access",
      },
    };
  }

  return completeScenario(facts, {
    shared_mailbox_working: true,
  });
}

// attachment_too_large

case "CheckAttachmentSize": {
  const facts = getScenarioFacts(
    state,
    "attachment_too_large"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_ATTACHMENT_SIZE_WRONG_SCENARIO",
      "check_attachment_size is only valid in attachment_too_large scenario.",
      "check_attachment_size"
    );
  }

  return updateScenarioFacts(facts, {
    attachment_size_checked: true,
  });
}

case "CompressAttachment": {
  const facts = getScenarioFacts(
    state,
    "attachment_too_large"
  );

  if (!facts) {
    return wrongScenarioError(
      "COMPRESS_ATTACHMENT_WRONG_SCENARIO",
      "compress_attachment is only valid in attachment_too_large scenario.",
      "compress_attachment"
    );
  }

  return updateScenarioFacts(facts, {
    attachment_compressed: true,
  });
}

// email_client_not_syncing

case "CheckSyncSettings": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "email_client_not_syncing" &&
      facts.kind !==
        "email_client_not_syncing_cached_session_stuck" &&
      facts.kind !== "not_receiving_email" &&
      facts.kind !==
        "not_receiving_email_inbox_rule_redirecting"
    )
  ) {
    return wrongScenarioError(
      "CHECK_SYNC_SETTINGS_WRONG_SCENARIO",
      "check_sync_settings is only valid in email sync scenarios.",
      "check_sync_settings"
    );
  }

  return updateScenarioFacts(facts, {
    sync_settings_checked: true,
  });
}

case "ResyncEmailClient": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "email_client_not_syncing" &&
      facts.kind !==
        "email_client_not_syncing_cached_session_stuck" &&
      facts.kind !== "not_receiving_email" &&
      facts.kind !==
        "not_receiving_email_inbox_rule_redirecting"
    )
  ) {
    return wrongScenarioError(
      "RESYNC_EMAIL_CLIENT_WRONG_SCENARIO",
      "resync_email_client is only valid in email sync scenarios.",
      "resync_email_client"
    );
  }

  return updateScenarioFacts(facts, {
    email_client_resynced: true,
  });
}

case "TestEmailSync": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "email_client_not_syncing" &&
      facts.kind !==
        "email_client_not_syncing_cached_session_stuck"
    )
  ) {
    return wrongScenarioError(
      "TEST_EMAIL_SYNC_WRONG_SCENARIO",
      "test_email_sync is only valid in email sync scenarios.",
      "test_email_sync"
    );
  }

  return completeScenario(facts, {
    email_sync_working: true,
  });
}

// email_login_issue

case "CheckEmailLoginStatus": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "email_login_issue" &&
      facts.kind !==
        "email_login_cached_credentials" &&
      facts.kind !==
        "email_client_not_syncing_cached_session_stuck"
    )
  ) {
    return wrongScenarioError(
      "CHECK_EMAIL_LOGIN_STATUS_WRONG_SCENARIO",
      "check_email_login_status is only valid in email login and session scenarios.",
      "check_email_login_status"
    );
  }

  return updateScenarioFacts(facts, {
    email_login_checked: true,
  });
}

case "CheckSavedEmailCredentials": {
  const facts = getScenarioFacts(
    state,
    "email_login_cached_credentials"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_SAVED_EMAIL_CREDENTIALS_WRONG_SCENARIO",
      "check_saved_email_credentials is only valid in the cached email credentials scenario.",
      "check_saved_email_credentials"
    );
  }

  if (!facts.first_email_login_tested) {
    return {
      error: {
        code:
          "CHECK_SAVED_EMAIL_CREDENTIALS_LOGIN_NOT_TESTED",
        message:
          "Must reproduce the email login failure before checking saved email credentials.",
        failingCommand:
          "check_saved_email_credentials",
      },
    };
  }

  return updateScenarioFacts(facts, {
    saved_email_credentials_checked: true,
  });
}

case "UpdateSavedEmailCredentials": {
  const facts = getScenarioFacts(
    state,
    "email_login_cached_credentials"
  );

  if (!facts) {
    return wrongScenarioError(
      "UPDATE_SAVED_EMAIL_CREDENTIALS_WRONG_SCENARIO",
      "update_saved_email_credentials is only valid in the cached email credentials scenario.",
      "update_saved_email_credentials"
    );
  }

  if (!facts.saved_email_credentials_checked) {
    return {
      error: {
        code:
          "UPDATE_SAVED_EMAIL_CREDENTIALS_NOT_CHECKED",
        message:
          "Must check the saved email credentials before updating them.",
        failingCommand:
          "update_saved_email_credentials",
      },
    };
  }

  return updateScenarioFacts(facts, {
    saved_email_credentials_updated: true,
  });
}

case "ResetEmailSession": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "email_login_issue" &&
      facts.kind !==
        "email_client_not_syncing_cached_session_stuck"
    )
  ) {
    return wrongScenarioError(
      "RESET_EMAIL_SESSION_WRONG_SCENARIO",
      "reset_email_session is only valid in email session scenarios.",
      "reset_email_session"
    );
  }

  return updateScenarioFacts(facts, {
    email_session_reset: true,
  });
}

case "TestEmailLogin": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "email_login_issue" &&
      facts.kind !==
        "email_login_cached_credentials"
    )
  ) {
    return wrongScenarioError(
      "TEST_EMAIL_LOGIN_WRONG_SCENARIO",
      "test_email_login is only valid in supported email login scenarios.",
      "test_email_login"
    );
  }

  if (facts.kind === "email_login_issue") {
    return completeScenario(facts, {
      email_login_working: true,
    });
  }

  if (!facts.first_email_login_tested) {
    return updateScenarioFacts(facts, {
      first_email_login_tested: true,
      email_login_working: false,
    });
  }

  if (!facts.saved_email_credentials_updated) {
    return {
      error: {
        code:
          "TEST_EMAIL_LOGIN_CREDENTIAL_FIX_INCOMPLETE",
        message:
          "Must check and update the saved email credentials before the final login test.",
        failingCommand: "test_email_login",
      },
    };
  }

  return completeScenario(facts, {
    email_login_working: true,
  });
}

// not_receiving_email

case "CheckInboxFilters": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
  facts.kind !==
    "not_receiving_email_inbox_rule_redirecting" &&
  facts.kind !==
    "password_reset_recovery_email_never_arrives"
)
  ) {
    return wrongScenarioError(
      "CHECK_INBOX_FILTERS_WRONG_SCENARIO",
      "check_inbox_filters is only valid in inbox filter scenarios.",
      "check_inbox_filters"
    );
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "CHECK_INBOX_FILTERS_IDENTITY_NOT_VERIFIED",
        message:
          "Must verify identity before checking inbox filters.",
        failingCommand: "check_inbox_filters",
      },
    };
  }

  return updateScenarioFacts(facts, {
    inbox_filter_checked: true,
  });
}

case "DisableInboxFilter": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !==
        "not_receiving_email_inbox_rule_redirecting" &&
      facts.kind !==
        "password_reset_recovery_email_never_arrives"
    )
  ) {
    return wrongScenarioError(
      "DISABLE_INBOX_FILTER_WRONG_SCENARIO",
      "disable_inbox_filter is only valid in inbox filter scenarios.",
      "disable_inbox_filter"
    );
  }

  if (
    facts.kind ===
      "not_receiving_email_inbox_rule_redirecting" &&
    !facts.inbox_filter_checked
  ) {
    return {
      error: {
        code: "DISABLE_INBOX_FILTER_NOT_CHECKED",
        message:
          "Must check inbox filters before disabling the filter.",
        failingCommand: "disable_inbox_filter",
      },
    };
  }

  if (
    facts.kind ===
      "password_reset_recovery_email_never_arrives" &&
    !facts.inbox_filter_checked
  ) {
    return {
      error: {
        code: "DISABLE_INBOX_FILTER_NOT_CHECKED",
        message:
          "Must check inbox filters before disabling the filter.",
        failingCommand: "disable_inbox_filter",
      },
    };
  }

  if (
    facts.kind ===
      "not_receiving_email_inbox_rule_redirecting"
  ) {
    return updateScenarioFacts(facts, {
      inbox_filter_enabled: false,
      filter_disabled: true,
    });
  }

  return updateScenarioFacts(facts, {
    inbox_filter_enabled: false,
  });
}

// --- NETWORK / CONNECTIVITY PLANS --- //

// cannot_connect_wifi

case "CheckWifiStatus": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "cannot_connect_wifi" &&
      facts.kind !==
        "cannot_connect_wifi_corrupted_profile"
    )
  ) {
    return wrongScenarioError(
      "CHECK_WIFI_STATUS_WRONG_SCENARIO",
      "check_wifi_status is only valid in Wi-Fi connection scenarios.",
      "check_wifi_status"
    );
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "CHECK_WIFI_STATUS_IDENTITY_NOT_VERIFIED",
        message:
          "Must verify identity before checking Wi-Fi status.",
        failingCommand: "check_wifi_status",
      },
    };
  }

  return updateScenarioFacts(facts, {
    wifi_checked: true,
  });
}

case "EnableWifi": {
  const facts = getScenarioFacts(
    state,
    "cannot_connect_wifi"
  );

  if (!facts) {
    return wrongScenarioError(
      "ENABLE_WIFI_WRONG_SCENARIO",
      "enable_wifi is only valid in cannot_connect_wifi scenario.",
      "enable_wifi"
    );
  }

  if (!facts.wifi_checked) {
    return {
      error: {
        code: "ENABLE_WIFI_NOT_CHECKED",
        message:
          "Must check WiFi status before enabling WiFi.",
        failingCommand: "enable_wifi",
      },
    };
  }

  return updateScenarioFacts(facts, {
    wifi_enabled: true,
  });
}

case "TestConnection": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "cannot_connect_wifi" &&
      facts.kind !==
        "cannot_connect_wifi_corrupted_profile"
    )
  ) {
    return wrongScenarioError(
      "TEST_CONNECTION_WRONG_SCENARIO",
      "test_connection is only valid in Wi-Fi connection scenarios.",
      "test_connection"
    );
  }

  if (facts.kind === "cannot_connect_wifi") {
    if (!facts.wifi_enabled) {
      return {
        error: {
          code: "TEST_CONNECTION_WIFI_NOT_ENABLED",
          message:
            "Must enable Wi-Fi before testing the connection.",
          failingCommand: "test_connection",
        },
      };
    }

    return completeScenario(facts, {
      can_connect_wifi: true,
    });
  }

  if (!facts.wifi_checked) {
    return {
      error: {
        code: "TEST_CONNECTION_WIFI_NOT_CHECKED",
        message:
          "Must check Wi-Fi status before testing the connection.",
        failingCommand: "test_connection",
      },
    };
  }

  if (!facts.first_connection_tested) {
    return updateScenarioFacts(facts, {
      first_connection_tested: true,
      can_connect_wifi: false,
    });
  }

  if (!facts.wifi_reconnected) {
    return {
      error: {
        code: "TEST_CONNECTION_WIFI_NOT_RECONNECTED",
        message:
          "Must remove the corrupted profile and reconnect to Wi-Fi before the final connection test.",
        failingCommand: "test_connection",
      },
    };
  }

  return completeScenario(facts, {
    can_connect_wifi: true,
  });
}

case "CheckWifiProfile": {
  const facts = getScenarioFacts(
    state,
    "cannot_connect_wifi_corrupted_profile"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_WIFI_PROFILE_WRONG_SCENARIO",
      "check_wifi_profile is only valid in the corrupted Wi-Fi profile scenario.",
      "check_wifi_profile"
    );
  }

  return updateScenarioFacts(facts, {
    wifi_profile_checked: true,
  });
}

case "RemoveCorruptedWifiProfile": {
  const facts = getScenarioFacts(
    state,
    "cannot_connect_wifi_corrupted_profile"
  );

  if (!facts) {
    return wrongScenarioError(
      "REMOVE_CORRUPTED_WIFI_PROFILE_WRONG_SCENARIO",
      "remove_corrupted_wifi_profile is only valid in the corrupted Wi-Fi profile scenario.",
      "remove_corrupted_wifi_profile"
    );
  }

  return updateScenarioFacts(facts, {
    corrupted_wifi_profile_removed: true,
  });
}

case "ReconnectWifi": {
  const facts = getScenarioFacts(
    state,
    "cannot_connect_wifi_corrupted_profile"
  );

  if (!facts) {
    return wrongScenarioError(
      "RECONNECT_WIFI_WRONG_SCENARIO",
      "reconnect_wifi is only valid in the corrupted Wi-Fi profile scenario.",
      "reconnect_wifi"
    );
  }

  return updateScenarioFacts(facts, {
    wifi_reconnected: true,
  });
}

case "CheckNetworkStatus": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "internet_no_access" &&
      facts.kind !== "internet_no_access_proxy"
    )
  ) {
    return wrongScenarioError(
      "CHECK_NETWORK_STATUS_WRONG_SCENARIO",
      "check_network_status is only valid in internet access scenarios.",
      "check_network_status"
    );
  }

  return updateScenarioFacts(facts, {
    network_checked: true,
  });
}

case "TestInternetConnection": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "internet_no_access" &&
      facts.kind !== "internet_no_access_proxy" &&
      facts.kind !== "slow_network_connection" &&
      facts.kind !== "ethernet_not_connected"
    )
  ) {
    return wrongScenarioError(
      "TEST_INTERNET_CONNECTION_WRONG_SCENARIO",
      "test_internet_connection is only valid in internet connectivity scenarios.",
      "test_internet_connection"
    );
  }

  if (facts.kind === "internet_no_access") {
    return completeScenario(facts, {
      internet_restored: true,
    });
  }

  if (facts.kind === "internet_no_access_proxy") {
    if (!facts.first_internet_tested) {
      return updateScenarioFacts(facts, {
        first_internet_tested: true,
        internet_restored: false,
      });
    }

    if (
      !facts.incorrect_proxy_disabled ||
      !facts.network_adapter_restarted
    ) {
      return {
        error: {
          code: "TEST_INTERNET_CONNECTION_PROXY_FIX_INCOMPLETE",
          message:
            "Must disable the incorrect proxy and restart the network adapter before the final internet test.",
          failingCommand: "test_internet_connection",
        },
      };
    }

    return completeScenario(facts, {
      internet_restored: true,
    });
  }

  if (facts.kind === "slow_network_connection") {
    return completeScenario(facts, {
      internet_speed_restored: true,
    });
  }

  return completeScenario(facts, {
    ethernet_connection_restored: true,
  });
}

case "CheckProxySettings": {
  const facts = getScenarioFacts(
    state,
    "internet_no_access_proxy"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_PROXY_SETTINGS_WRONG_SCENARIO",
      "check_proxy_settings is only valid in the proxy internet-access scenario.",
      "check_proxy_settings"
    );
  }

  return updateScenarioFacts(facts, {
    proxy_settings_checked: true,
  });
}

case "DisableIncorrectProxy": {
  const facts = getScenarioFacts(
    state,
    "internet_no_access_proxy"
  );

  if (!facts) {
    return wrongScenarioError(
      "DISABLE_INCORRECT_PROXY_WRONG_SCENARIO",
      "disable_incorrect_proxy is only valid in the proxy internet-access scenario.",
      "disable_incorrect_proxy"
    );
  }

  return updateScenarioFacts(facts, {
    incorrect_proxy_disabled: true,
  });
}

// --- DEVICE / PERFORMANCE PLANS --- //

// too_many_apps_running
case "CheckRunningApps": {
  const facts = getScenarioFacts(
    state,
    "too_many_apps_running"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_RUNNING_APPS_WRONG_SCENARIO",
      "check_running_apps is only valid in too_many_apps_running scenario.",
      "check_running_apps"
    );
  }

  return updateScenarioFacts(facts, {
    apps_checked: true,
  });
}

case "CloseUnnecessaryApps": {
  const facts = getScenarioFacts(
    state,
    "too_many_apps_running"
  );

  if (!facts) {
    return wrongScenarioError(
      "CLOSE_UNNECESSARY_APPS_WRONG_SCENARIO",
      "close_unnecessary_apps is only valid in too_many_apps_running scenario.",
      "close_unnecessary_apps"
    );
  }

  return updateScenarioFacts(facts, {
    apps_closed: true,
  });
}

case "TestPerformance": {
  const facts = state.scenarioFacts;

  if (!facts) {
    return wrongScenarioError(
      "TEST_PERFORMANCE_NO_FACTS",
      "No scenario facts found.",
      "test_performance"
    );
  }

  if (facts.kind === "too_many_apps_running") {
    return completeScenario(facts, {
      performance_ok: true,
    });
  }

  if (facts.kind === "low_memory") {
    return completeScenario(facts, {
      memory_ok: true,
    });
  }

  return wrongScenarioError(
    "TEST_PERFORMANCE_WRONG_SCENARIO",
    "test_performance is not valid for this scenario.",
    "test_performance"
  );
}

// low_memory

case "CheckMemoryUsage": {
  const facts = getScenarioFacts(
    state,
    "low_memory"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_MEMORY_USAGE_WRONG_SCENARIO",
      "check_memory_usage is only valid in low_memory scenario.",
      "check_memory_usage"
    );
  }

  return updateScenarioFacts(facts, {
    memory_checked: true,
  });
}

case "CloseMemoryHeavyApps": {
  const facts = getScenarioFacts(
    state,
    "low_memory"
  );

  if (!facts) {
    return wrongScenarioError(
      "CLOSE_MEMORY_HEAVY_APPS_WRONG_SCENARIO",
      "close_memory_heavy_apps is only valid in low_memory scenario.",
      "close_memory_heavy_apps"
    );
  }

  return updateScenarioFacts(facts, {
    memory_heavy_apps_closed: true,
  });
}

case "CheckPrinterStatus": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "printer_not_working" &&
      facts.kind !== "printer_wrong_default_printer"
    )
  ) {
    return wrongScenarioError(
      "CHECK_PRINTER_STATUS_WRONG_SCENARIO",
      "check_printer_status is only valid in printer scenarios.",
      "check_printer_status"
    );
  }

  return updateScenarioFacts(facts, {
    printer_checked: true,
  });
}

case "CheckDefaultPrinter": {
  const facts = getScenarioFacts(
    state,
    "printer_wrong_default_printer"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_DEFAULT_PRINTER_WRONG_SCENARIO",
      "check_default_printer is only valid in printer_wrong_default_printer scenario.",
      "check_default_printer"
    );
  }

  return updateScenarioFacts(facts, {
    default_printer_checked: true,
  });
}

case "SetDefaultPrinter": {
  const facts = getScenarioFacts(
    state,
    "printer_wrong_default_printer"
  );

  if (!facts) {
    return wrongScenarioError(
      "SET_DEFAULT_PRINTER_WRONG_SCENARIO",
      "set_default_printer is only valid in printer_wrong_default_printer scenario.",
      "set_default_printer"
    );
  }

  return updateScenarioFacts(facts, {
    correct_default_printer_set: true,
  });
}

case "RestartPrinter": {
  const facts = getScenarioFacts(
    state,
    "printer_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "RESTART_PRINTER_WRONG_SCENARIO",
      "restart_printer is only valid in printer_not_working scenario.",
      "restart_printer"
    );
  }

  return updateScenarioFacts(facts, {
    printer_restarted: true,
  });
}

case "PrintTestPage": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "printer_not_working" &&
      facts.kind !== "printer_wrong_default_printer"
    )
  ) {
    return wrongScenarioError(
      "PRINT_TEST_PAGE_WRONG_SCENARIO",
      "print_test_page is only valid in printer scenarios.",
      "print_test_page"
    );
  }

  return completeScenario(facts, {
    printer_working: true,
  });
}

// --- FILES / STORAGE PLANS --- //

// disk_space_full

case "CheckDiskSpace": {
  const facts = getScenarioFacts(
    state,
    "disk_space_full"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_DISK_SPACE_WRONG_SCENARIO",
      "check_disk_space is only valid in disk_space_full scenario.",
      "check_disk_space"
    );
  }

  return updateScenarioFacts(facts, {
    disk_checked: true,
  });
}

case "ClearTempFiles": {
  const facts = getScenarioFacts(
    state,
    "disk_space_full"
  );

  if (!facts) {
    return wrongScenarioError(
      "CLEAR_TEMP_FILES_WRONG_SCENARIO",
      "clear_temp_files is only valid in disk_space_full scenario.",
      "clear_temp_files"
    );
  }

  return updateScenarioFacts(facts, {
    temp_files_cleared: true,
  });
}

case "ConfirmStorageAvailable": {
  const facts = getScenarioFacts(
    state,
    "disk_space_full"
  );

  if (!facts) {
    return wrongScenarioError(
      "CONFIRM_STORAGE_AVAILABLE_WRONG_SCENARIO",
      "confirm_storage_available is only valid in disk_space_full scenario.",
      "confirm_storage_available"
    );
  }

  return completeScenario(facts, {
    storage_available: true,
  });
}

// network_drive_missing + network_drive_vpn_required_first

case "CheckNetworkDriveMapping": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "network_drive_missing" &&
      facts.kind !== "network_drive_vpn_required_first"
    )
  ) {
    return wrongScenarioError(
      "CHECK_NETWORK_DRIVE_MAPPING_WRONG_SCENARIO",
      "check_network_drive_mapping is only valid in network drive scenarios.",
      "check_network_drive_mapping"
    );
  }

  return updateScenarioFacts(facts, {
    network_drive_mapping_checked: true,
  });
}

case "RemapNetworkDrive": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "network_drive_missing" &&
      facts.kind !== "network_drive_vpn_required_first"
    )
  ) {
    return wrongScenarioError(
      "REMAP_NETWORK_DRIVE_WRONG_SCENARIO",
      "remap_network_drive is only valid in network drive scenarios.",
      "remap_network_drive"
    );
  }

  return updateScenarioFacts(facts, {
    network_drive_remapped: true,
  });
}

case "TestNetworkDriveAccess": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "network_drive_missing" &&
      facts.kind !== "network_drive_vpn_required_first"
    )
  ) {
    return wrongScenarioError(
      "TEST_NETWORK_DRIVE_ACCESS_WRONG_SCENARIO",
      "test_network_drive_access is only valid in network drive scenarios.",
      "test_network_drive_access"
    );
  }

  return completeScenario(facts, {
    network_drive_access_working: true,
  });
}

// mouse_keyboard_not_working

case "CheckDeviceConnection": {
  const facts = getScenarioFacts(
    state,
    "mouse_keyboard_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_DEVICE_CONNECTION_WRONG_SCENARIO",
      "check_device_connection is only valid in mouse_keyboard_not_working scenario.",
      "check_device_connection"
    );
  }

  return updateScenarioFacts(facts, {
    device_connection_checked: true,
  });
}

case "ReconnectDevice": {
  const facts = getScenarioFacts(
    state,
    "mouse_keyboard_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "RECONNECT_DEVICE_WRONG_SCENARIO",
      "reconnect_device is only valid in mouse_keyboard_not_working scenario.",
      "reconnect_device"
    );
  }

  return updateScenarioFacts(facts, {
    device_reconnected: true,
  });
}

case "TestInputDevice": {
  const facts = getScenarioFacts(
    state,
    "mouse_keyboard_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "TEST_INPUT_DEVICE_WRONG_SCENARIO",
      "test_input_device is only valid in mouse_keyboard_not_working scenario.",
      "test_input_device"
    );
  }

  return completeScenario(facts, {
    input_device_working: true,
  });
}

// --- SOFTWARE / APPLICATIONS PLANS --- //

// software_app_not_opening + application_crash
case "CheckAppStatus": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "software_app_not_opening" &&
      facts.kind !== "email_application_will_not_open" &&
      facts.kind !== "email_client_corrupted_profile" &&
      facts.kind !== "application_crash" &&
      facts.kind !== "software_app_license_not_assigned" &&
      facts.kind !== "browser_running_slow_extension"
    )
  ) {
    return wrongScenarioError(
      "CHECK_APP_STATUS_WRONG_SCENARIO",
      "check_app_status is only valid in software app scenarios.",
      "check_app_status"
    );
  }

  return updateScenarioFacts(facts, {
    app_status_checked: true,
  });
}

case "CheckLicenseAssignment": {
  const facts = getScenarioFacts(
    state,
    "software_app_license_not_assigned"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_LICENSE_ASSIGNMENT_WRONG_SCENARIO",
      "check_license_assignment is only valid in software_app_license_not_assigned scenario.",
      "check_license_assignment"
    );
  }

  return updateScenarioFacts(facts, {
    license_assignment_checked: true,
  });
}

case "AssignSoftwareLicense": {
  const facts = getScenarioFacts(
    state,
    "software_app_license_not_assigned"
  );

  if (!facts) {
    return wrongScenarioError(
      "ASSIGN_SOFTWARE_LICENSE_WRONG_SCENARIO",
      "assign_software_license is only valid in software_app_license_not_assigned scenario.",
      "assign_software_license"
    );
  }

  return updateScenarioFacts(facts, {
    software_license_assigned: true,
  });
}

case "RestartApplication": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "software_app_not_opening" &&
      facts.kind !== "email_application_will_not_open" &&
      facts.kind !== "email_client_corrupted_profile" &&
      facts.kind !== "application_crash" &&
      facts.kind !== "shared_mailbox_automapping_missing"
    )
  ) {
    return wrongScenarioError(
      "RESTART_APPLICATION_WRONG_SCENARIO",
      "restart_application is only valid in software app scenarios.",
      "restart_application"
    );
  }

  return updateScenarioFacts(facts, {
    application_restarted: true,
  });
}

case "CheckEmailClientProfile": {
  const facts = getScenarioFacts(
    state,
    "email_client_corrupted_profile"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_EMAIL_CLIENT_PROFILE_WRONG_SCENARIO",
      "check_email_client_profile is only valid in the corrupted email profile scenario.",
      "check_email_client_profile"
    );
  }

  if (!facts.application_restarted) {
    return {
      error: {
        code: "CHECK_EMAIL_CLIENT_PROFILE_APPLICATION_NOT_RESTARTED",
        message:
          "Must restart and test the application before checking the email client profile.",
        failingCommand: "check_email_client_profile",
      },
    };
  }

  return updateScenarioFacts(facts, {
    email_client_profile_checked: true,
  });
}

case "RepairEmailClientProfile": {
  const facts = getScenarioFacts(
    state,
    "email_client_corrupted_profile"
  );

  if (!facts) {
    return wrongScenarioError(
      "REPAIR_EMAIL_CLIENT_PROFILE_WRONG_SCENARIO",
      "repair_email_client_profile is only valid in the corrupted email profile scenario.",
      "repair_email_client_profile"
    );
  }

  if (!facts.email_client_profile_checked) {
    return {
      error: {
        code: "REPAIR_EMAIL_CLIENT_PROFILE_NOT_CHECKED",
        message:
          "Must check the email client profile before repairing it.",
        failingCommand: "repair_email_client_profile",
      },
    };
  }

  return updateScenarioFacts(facts, {
    email_client_profile_repaired: true,
  });
}

case "TestApplicationLaunch": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "software_app_not_opening" &&
      facts.kind !== "email_application_will_not_open" &&
      facts.kind !== "email_client_corrupted_profile" &&
      facts.kind !== "application_crash" &&
      facts.kind !== "software_update_required" &&
      facts.kind !== "software_app_license_not_assigned"
    )
  ) {
    return wrongScenarioError(
      "TEST_APPLICATION_LAUNCH_WRONG_SCENARIO",
      "test_application_launch is only valid in software app scenarios.",
      "test_application_launch"
    );
  }

if (
  facts.kind === "email_client_corrupted_profile" &&
  !facts.email_client_profile_repaired
) {
  return updateScenarioFacts(facts, {
    application_launch_tested: true,
    application_working: false,
  });
}

  return completeScenario(facts, {
    application_working: true,
  });
}

// software_update_required

case "CheckSoftwareVersion": {
  const facts = getScenarioFacts(
    state,
    "software_update_required"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_SOFTWARE_VERSION_WRONG_SCENARIO",
      "check_software_version is only valid in software_update_required scenario.",
      "check_software_version"
    );
  }

  return updateScenarioFacts(facts, {
    software_version_checked: true,
  });
}

case "InstallSoftwareUpdate": {
  const facts = getScenarioFacts(
    state,
    "software_update_required"
  );

  if (!facts) {
    return wrongScenarioError(
      "INSTALL_SOFTWARE_UPDATE_WRONG_SCENARIO",
      "install_software_update is only valid in software_update_required scenario.",
      "install_software_update"
    );
  }

  return updateScenarioFacts(facts, {
    software_update_installed: true,
  });
}

// microphone_not_working
// microphone_wrong_recording_device

case "CheckMicrophoneSettings": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "microphone_not_working" &&
      facts.kind !== "microphone_wrong_recording_device"
    )
  ) {
    return wrongScenarioError(
      "CHECK_MICROPHONE_SETTINGS_WRONG_SCENARIO",
      "check_microphone_settings is only valid in supported microphone scenarios.",
      "check_microphone_settings"
    );
  }

  return updateScenarioFacts(facts, {
    microphone_settings_checked: true,
  });
}

case "EnableMicrophone": {
  const facts = getScenarioFacts(
    state,
    "microphone_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "ENABLE_MICROPHONE_WRONG_SCENARIO",
      "enable_microphone is only valid in microphone_not_working scenario.",
      "enable_microphone"
    );
  }

  return updateScenarioFacts(facts, {
    microphone_enabled: true,
  });
}

case "CheckRecordingDevice": {
  const facts = getScenarioFacts(
    state,
    "microphone_wrong_recording_device"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_RECORDING_DEVICE_WRONG_SCENARIO",
      "check_recording_device is only valid in the wrong-recording-device microphone scenario.",
      "check_recording_device"
    );
  }

  if (!facts.first_microphone_tested) {
    return {
      error: {
        code:
          "CHECK_RECORDING_DEVICE_MICROPHONE_NOT_TESTED",
        message:
          "Must test the microphone and reproduce the failure before checking the recording device.",
        failingCommand: "check_recording_device",
      },
    };
  }

  return updateScenarioFacts(facts, {
    recording_device_checked: true,
  });
}

case "SelectRecordingDevice": {
  const facts = getScenarioFacts(
    state,
    "microphone_wrong_recording_device"
  );

  if (!facts) {
    return wrongScenarioError(
      "SELECT_RECORDING_DEVICE_WRONG_SCENARIO",
      "select_recording_device is only valid in the wrong-recording-device microphone scenario.",
      "select_recording_device"
    );
  }

  if (!facts.recording_device_checked) {
    return {
      error: {
        code:
          "SELECT_RECORDING_DEVICE_NOT_CHECKED",
        message:
          "Must check the current recording device before selecting the intended microphone.",
        failingCommand: "select_recording_device",
      },
    };
  }

  return updateScenarioFacts(facts, {
    correct_recording_device_selected: true,
  });
}

case "TestMicrophone": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "microphone_not_working" &&
      facts.kind !== "microphone_wrong_recording_device"
    )
  ) {
    return wrongScenarioError(
      "TEST_MICROPHONE_WRONG_SCENARIO",
      "test_microphone is only valid in supported microphone scenarios.",
      "test_microphone"
    );
  }

  if (facts.kind === "microphone_not_working") {
    return completeScenario(facts, {
      microphone_working: true,
    });
  }

  if (!facts.first_microphone_tested) {
    return updateScenarioFacts(facts, {
      first_microphone_tested: true,
      microphone_working: false,
    });
  }

  if (!facts.correct_recording_device_selected) {
    return {
      error: {
        code:
          "TEST_MICROPHONE_RECORDING_DEVICE_NOT_CORRECTED",
        message:
          "Must check and select the intended recording device before the final microphone test.",
        failingCommand: "test_microphone",
      },
    };
  }

  return completeScenario(facts, {
    microphone_working: true,
  });
}

case "CheckSharedDrivePermissions": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "shared_drive_access_issue" &&
      facts.kind !== "shared_drive_group_membership_missing"
    )
  ) {
    return wrongScenarioError(
      "CHECK_SHARED_DRIVE_PERMISSIONS_WRONG_SCENARIO",
      "check_shared_drive_permissions is only valid in shared drive access scenarios.",
      "check_shared_drive_permissions"
    );
  }

  return updateScenarioFacts(facts, {
    shared_drive_permissions_checked: true,
  });
}

case "GrantSharedDriveAccess": {
  const facts = getScenarioFacts(
    state,
    "shared_drive_access_issue"
  );

  if (!facts) {
    return wrongScenarioError(
      "GRANT_SHARED_DRIVE_ACCESS_WRONG_SCENARIO",
      "grant_shared_drive_access is only valid in shared_drive_access_issue scenario.",
      "grant_shared_drive_access"
    );
  }

  return updateScenarioFacts(facts, {
    shared_drive_access_granted: true,
  });
}

case "AddUserToGroup": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "shared_drive_group_membership_missing" &&
      facts.kind !==
        "folder_access_required_security_group_missing"
    )
  ) {
    return wrongScenarioError(
      "ADD_USER_TO_GROUP_WRONG_SCENARIO",
      "add_user_to_group is only valid in supported group-membership scenarios.",
      "add_user_to_group"
    );
  }

  return updateScenarioFacts(facts, {
    user_added_to_group: true,
  });
}

case "TestSharedDriveAccess": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "shared_drive_access_issue" &&
      facts.kind !== "shared_drive_group_membership_missing"
    )
  ) {
    return wrongScenarioError(
      "TEST_SHARED_DRIVE_ACCESS_WRONG_SCENARIO",
      "test_shared_drive_access is only valid in shared drive access scenarios.",
      "test_shared_drive_access"
    );
  }

  return completeScenario(facts, {
    shared_drive_access_working: true,
  });
}

case "CheckUserPermissions": {
  const facts = getScenarioFacts(
    state,
    "permissions_denied"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_USER_PERMISSIONS_WRONG_SCENARIO",
      "check_user_permissions is only valid in permissions_denied scenario.",
      "check_user_permissions"
    );
  }

  return updateScenarioFacts(facts, {
    user_permissions_checked: true,
  });
}

case "GrantRequiredPermission": {
  const facts = getScenarioFacts(
    state,
    "permissions_denied"
  );

  if (!facts) {
    return wrongScenarioError(
      "GRANT_REQUIRED_PERMISSION_WRONG_SCENARIO",
      "grant_required_permission is only valid in permissions_denied scenario.",
      "grant_required_permission"
    );
  }

  return updateScenarioFacts(facts, {
    required_permission_granted: true,
  });
}

case "TestPermissionAccess": {
  const facts = getScenarioFacts(
    state,
    "permissions_denied"
  );

  if (!facts) {
    return wrongScenarioError(
      "TEST_PERMISSION_ACCESS_WRONG_SCENARIO",
      "test_permission_access is only valid in permissions_denied scenario.",
      "test_permission_access"
    );
  }

  return completeScenario(facts, {
    permission_access_working: true,
  });
}

// folder_access_missing

case "CheckFolderPermissions": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "folder_access_missing" &&
      facts.kind !== "folder_access_required_security_group_missing"
    )
  ) {
    return wrongScenarioError(
      "CHECK_FOLDER_PERMISSIONS_WRONG_SCENARIO",
      "check_folder_permissions is only valid in folder access scenarios.",
      "check_folder_permissions"
    );
  }

  return updateScenarioFacts(facts, {
    folder_permissions_checked: true,
  });
}

case "CheckFolderSecurityGroup": {
  const facts = getScenarioFacts(
    state,
    "folder_access_required_security_group_missing"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_FOLDER_SECURITY_GROUP_WRONG_SCENARIO",
      "check_folder_security_group is only valid in the required security group folder-access scenario.",
      "check_folder_security_group"
    );
  }

  return updateScenarioFacts(facts, {
    folder_security_group_checked: true,
  });
}

case "GrantFolderAccess": {
  const facts = getScenarioFacts(
    state,
    "folder_access_missing"
  );

  if (!facts) {
    return wrongScenarioError(
      "GRANT_FOLDER_ACCESS_WRONG_SCENARIO",
      "grant_folder_access is only valid in folder_access_missing scenario.",
      "grant_folder_access"
    );
  }

  return updateScenarioFacts(facts, {
    folder_access_granted: true,
  });
}

case "TestFolderAccess": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "folder_access_missing" &&
      facts.kind !==
        "folder_access_required_security_group_missing"
    )
  ) {
    return wrongScenarioError(
      "TEST_FOLDER_ACCESS_WRONG_SCENARIO",
      "test_folder_access is only valid in folder access scenarios.",
      "test_folder_access"
    );
  }

  if (facts.kind === "folder_access_missing") {
    return completeScenario(facts, {
      folder_access_working: true,
    });
  }

  if (!facts.first_folder_access_tested) {
    return updateScenarioFacts(facts, {
      first_folder_access_tested: true,
      folder_access_working: false,
    });
  }

  if (
    !facts.folder_security_group_checked ||
    !facts.user_added_to_group
  ) {
    return {
      error: {
        code: "TEST_FOLDER_ACCESS_GROUP_FIX_INCOMPLETE",
        message:
          "Must check the required security group and add the user before performing the final folder access test.",
        failingCommand: "test_folder_access",
      },
    };
  }

  return completeScenario(facts, {
    folder_access_working: true,
  });
}

// webcam_not_working

case "CheckWebcamSettings": {
  const facts = getScenarioFacts(
    state,
    "webcam_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_WEBCAM_SETTINGS_WRONG_SCENARIO",
      "check_webcam_settings is only valid in webcam_not_working scenario.",
      "check_webcam_settings"
    );
  }

  return updateScenarioFacts(facts, {
    webcam_settings_checked: true,
  });
}

case "EnableWebcam": {
  const facts = getScenarioFacts(
    state,
    "webcam_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "ENABLE_WEBCAM_WRONG_SCENARIO",
      "enable_webcam is only valid in webcam_not_working scenario.",
      "enable_webcam"
    );
  }

  return updateScenarioFacts(facts, {
    webcam_enabled: true,
  });
}

case "TestWebcam": {
  const facts = getScenarioFacts(
    state,
    "webcam_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "TEST_WEBCAM_WRONG_SCENARIO",
      "test_webcam is only valid in webcam_not_working scenario.",
      "test_webcam"
    );
  }

  return completeScenario(facts, {
    webcam_working: true,
  });
}

case "CheckMfaStatus": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "mfa_code_not_working" &&
      facts.kind !== "vpn_mfa_dependency_missing" &&
      facts.kind !==
        "mfa_code_old_phone_still_registered"
    )
  ) {
    return wrongScenarioError(
      "CHECK_MFA_STATUS_WRONG_SCENARIO",
      "check_mfa_status is only valid in MFA scenarios.",
      "check_mfa_status"
    );
  }

  return updateScenarioFacts(facts, {
    mfa_status_checked: true,
  });
}

case "CheckRegisteredMfaDevice": {
  const facts = getScenarioFacts(
    state,
    "mfa_code_old_phone_still_registered"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_REGISTERED_MFA_DEVICE_WRONG_SCENARIO",
      "check_registered_mfa_device is only valid in mfa_code_old_phone_still_registered scenario.",
      "check_registered_mfa_device"
    );
  }

  return updateScenarioFacts(facts, {
    registered_mfa_device_checked: true,
  });
}

case "RemoveOldMfaDevice": {
  const facts = getScenarioFacts(
    state,
    "mfa_code_old_phone_still_registered"
  );

  if (!facts) {
    return wrongScenarioError(
      "REMOVE_OLD_MFA_DEVICE_WRONG_SCENARIO",
      "remove_old_mfa_device is only valid in mfa_code_old_phone_still_registered scenario.",
      "remove_old_mfa_device"
    );
  }

  return updateScenarioFacts(facts, {
    old_mfa_device_removed: true,
  });
}

case "ResetMfaMethod": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "mfa_code_not_working" &&
      facts.kind !== "vpn_mfa_dependency_missing" &&
      facts.kind !==
        "mfa_code_old_phone_still_registered"
    )
  ) {
    return wrongScenarioError(
      "RESET_MFA_METHOD_WRONG_SCENARIO",
      "reset_mfa_method is only valid in MFA scenarios.",
      "reset_mfa_method"
    );
  }

  return updateScenarioFacts(facts, {
    mfa_method_reset: true,
  });
}

case "TestMfaLogin": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "mfa_code_not_working" &&
      facts.kind !==
        "mfa_code_old_phone_still_registered"
    )
  ) {
    return wrongScenarioError(
      "TEST_MFA_LOGIN_WRONG_SCENARIO",
      "test_mfa_login is only valid in MFA login scenarios.",
      "test_mfa_login"
    );
  }

  return completeScenario(facts, {
    mfa_working: true,
  });
}

// browser_running_slow

case "CheckBrowserCache": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "browser_running_slow" &&
      facts.kind !== "browser_running_slow_extension"
    )
  ) {
    return wrongScenarioError(
      "CHECK_BROWSER_CACHE_WRONG_SCENARIO",
      "check_browser_cache is only valid in browser slow scenarios.",
      "check_browser_cache"
    );
  }

  return updateScenarioFacts(facts, {
    browser_cache_checked: true,
  });
}

case "ClearBrowserCache": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "browser_running_slow" &&
      facts.kind !== "browser_running_slow_extension"
    )
  ) {
    return wrongScenarioError(
      "CLEAR_BROWSER_CACHE_WRONG_SCENARIO",
      "clear_browser_cache is only valid in browser slow scenarios.",
      "clear_browser_cache"
    );
  }

  return updateScenarioFacts(facts, {
    browser_cache_cleared: true,
  });
}

case "CheckBrowserExtensions": {
  const facts = getScenarioFacts(
    state,
    "browser_running_slow_extension"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_BROWSER_EXTENSIONS_WRONG_SCENARIO",
      "check_browser_extensions is only valid in the browser extension scenario.",
      "check_browser_extensions"
    );
  }

  return updateScenarioFacts(facts, {
    browser_extensions_checked: true,
  });
}

case "DisableUnnecessaryExtensions": {
  const facts = getScenarioFacts(
    state,
    "browser_running_slow_extension"
  );

  if (!facts) {
    return wrongScenarioError(
      "DISABLE_UNNECESSARY_EXTENSIONS_WRONG_SCENARIO",
      "disable_unnecessary_extensions is only valid in the browser extension scenario.",
      "disable_unnecessary_extensions"
    );
  }

  return updateScenarioFacts(facts, {
    unnecessary_extensions_disabled: true,
  });
}

case "TestBrowserPerformance": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "browser_running_slow" &&
      facts.kind !== "browser_running_slow_extension"
    )
  ) {
    return wrongScenarioError(
      "TEST_BROWSER_PERFORMANCE_WRONG_SCENARIO",
      "test_browser_performance is only valid in browser slow scenarios.",
      "test_browser_performance"
    );
  }

 if (facts.kind === "browser_running_slow_extension") {
  if (!facts.browser_cache_cleared) {
    return {
      error: {
        code:
          "TEST_BROWSER_PERFORMANCE_CACHE_NOT_CLEARED",
        message:
          "Must complete the normal browser cache troubleshooting before testing performance.",
        failingCommand: "test_browser_performance",
      },
    };
  }

  if (!facts.browser_performance_tested_after_cache) {
    return updateScenarioFacts(facts, {
      browser_performance_tested_after_cache: true,
      browser_performance_ok: false,
    });
  }

  if (!facts.unnecessary_extensions_disabled) {
    return {
      error: {
        code:
          "TEST_BROWSER_PERFORMANCE_EXTENSION_NOT_DISABLED",
        message:
          "Must identify and disable the problematic extension before performing the final performance test.",
        failingCommand: "test_browser_performance",
      },
    };
  }
}

  return completeScenario(facts, {
    browser_performance_ok: true,
  });
}

case "CheckInstallPermissions": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "cannot_install_software" &&
      facts.kind !==
        "cannot_install_software_admin_approval_required"
    )
  ) {
    return wrongScenarioError(
      "CHECK_INSTALL_PERMISSIONS_WRONG_SCENARIO",
      "check_install_permissions is only valid in software installation scenarios.",
      "check_install_permissions"
    );
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code:
          "CHECK_INSTALL_PERMISSIONS_IDENTITY_NOT_VERIFIED",
        message:
          "Must verify identity before checking installation permissions.",
        failingCommand: "check_install_permissions",
      },
    };
  }

  if (facts.install_permissions_checked) {
    return {
      error: {
        code: "CHECK_INSTALL_PERMISSIONS_ALREADY_DONE",
        message:
          "Installation permissions have already been checked.",
        failingCommand: "check_install_permissions",
      },
    };
  }

  return updateScenarioFacts(facts, {
    install_permissions_checked: true,
  });
}

case "CheckSoftwareRequestStatus": {
  const facts = getScenarioFacts(
    state,
    "cannot_install_software_admin_approval_required"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_SOFTWARE_REQUEST_STATUS_WRONG_SCENARIO",
      "check_software_request_status is only valid in the admin approval software installation challenge.",
      "check_software_request_status"
    );
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code:
          "CHECK_SOFTWARE_REQUEST_STATUS_IDENTITY_NOT_VERIFIED",
        message:
          "Must verify identity before checking the software request.",
        failingCommand: "check_software_request_status",
      },
    };
  }

  if (!facts.install_permissions_checked) {
    return {
      error: {
        code:
          "CHECK_SOFTWARE_REQUEST_STATUS_PERMISSIONS_NOT_CHECKED",
        message:
          "Must check installation permissions before checking the software request.",
        failingCommand: "check_software_request_status",
      },
    };
  }

  if (facts.software_request_checked) {
    return {
      error: {
        code:
          "CHECK_SOFTWARE_REQUEST_STATUS_ALREADY_DONE",
        message:
          "The software request status has already been checked.",
        failingCommand: "check_software_request_status",
      },
    };
  }

  return updateScenarioFacts(facts, {
    software_request_checked: true,
  });
}

case "ApproveSoftwareRequest": {
  const facts = getScenarioFacts(
    state,
    "cannot_install_software_admin_approval_required"
  );

  if (!facts) {
    return wrongScenarioError(
      "APPROVE_SOFTWARE_REQUEST_WRONG_SCENARIO",
      "approve_software_request is only valid in the admin approval software installation challenge.",
      "approve_software_request"
    );
  }

  if (!facts.software_request_checked) {
    return {
      error: {
        code:
          "APPROVE_SOFTWARE_REQUEST_STATUS_NOT_CHECKED",
        message:
          "Must check the software request status before approving it.",
        failingCommand: "approve_software_request",
      },
    };
  }

  if (facts.software_request_approved) {
    return {
      error: {
        code: "APPROVE_SOFTWARE_REQUEST_ALREADY_DONE",
        message:
          "The software request has already been approved.",
        failingCommand: "approve_software_request",
      },
    };
  }

  return updateScenarioFacts(facts, {
    software_request_approved: true,
  });
}

case "GrantInstallPermissions": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "cannot_install_software" &&
      facts.kind !==
        "cannot_install_software_admin_approval_required"
    )
  ) {
    return wrongScenarioError(
      "GRANT_INSTALL_PERMISSIONS_WRONG_SCENARIO",
      "grant_install_permissions is only valid in software installation scenarios.",
      "grant_install_permissions"
    );
  }

  if (!facts.install_permissions_checked) {
    return {
      error: {
        code: "GRANT_INSTALL_PERMISSIONS_NOT_CHECKED",
        message:
          "Must check installation permissions before granting them.",
        failingCommand: "grant_install_permissions",
      },
    };
  }

  if (
    facts.kind ===
      "cannot_install_software_admin_approval_required" &&
    !facts.software_request_approved
  ) {
    return {
      error: {
        code:
          "GRANT_INSTALL_PERMISSIONS_REQUEST_NOT_APPROVED",
        message:
          "The software request must be approved before installation permissions can be granted.",
        failingCommand: "grant_install_permissions",
      },
    };
  }

  if (facts.install_permissions_granted) {
    return {
      error: {
        code:
          "GRANT_INSTALL_PERMISSIONS_ALREADY_DONE",
        message:
          "Installation permissions have already been granted.",
        failingCommand: "grant_install_permissions",
      },
    };
  }

  return updateScenarioFacts(facts, {
    install_permissions_granted: true,
  });
}

case "TestSoftwareInstall": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "cannot_install_software" &&
      facts.kind !==
        "cannot_install_software_admin_approval_required"
    )
  ) {
    return wrongScenarioError(
      "TEST_SOFTWARE_INSTALL_WRONG_SCENARIO",
      "test_software_install is only valid in software installation scenarios.",
      "test_software_install"
    );
  }

  if (!facts.install_permissions_granted) {
    return {
      error: {
        code:
          "TEST_SOFTWARE_INSTALL_PERMISSIONS_NOT_GRANTED",
        message:
          "Must grant installation permissions before testing the installation.",
        failingCommand: "test_software_install",
      },
    };
  }

  if (facts.software_install_working) {
    return {
      error: {
        code: "TEST_SOFTWARE_INSTALL_ALREADY_DONE",
        message:
          "The software installation has already been tested.",
        failingCommand: "test_software_install",
      },
    };
  }

  return completeScenario(facts, {
    software_install_working: true,
  });
}

// second_monitor_not_detected
// second_monitor_display_disabled

case "CheckDisplayConnection": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "second_monitor_not_detected" &&
      facts.kind !== "second_monitor_display_disabled"
    )
  ) {
    return wrongScenarioError(
      "CHECK_DISPLAY_CONNECTION_WRONG_SCENARIO",
      "check_display_connection is only valid in supported second-monitor scenarios.",
      "check_display_connection"
    );
  }

  return updateScenarioFacts(facts, {
    display_connection_checked: true,
  });
}

case "CheckDisplaySettings": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "second_monitor_not_detected" &&
      facts.kind !== "second_monitor_display_disabled"
    )
  ) {
    return wrongScenarioError(
      "CHECK_DISPLAY_SETTINGS_WRONG_SCENARIO",
      "check_display_settings is only valid in supported second-monitor scenarios.",
      "check_display_settings"
    );
  }

  if (!facts.display_connection_checked) {
    return {
      error: {
        code:
          "CHECK_DISPLAY_SETTINGS_CONNECTION_NOT_CHECKED",
        message:
          "Must check the physical display connection before reviewing display settings.",
        failingCommand: "check_display_settings",
      },
    };
  }

  return updateScenarioFacts(facts, {
    display_settings_checked: true,
  });
}

case "DetectSecondMonitor": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "second_monitor_not_detected" &&
      facts.kind !== "second_monitor_display_disabled"
    )
  ) {
    return wrongScenarioError(
      "DETECT_SECOND_MONITOR_WRONG_SCENARIO",
      "detect_second_monitor is only valid in supported second-monitor scenarios.",
      "detect_second_monitor"
    );
  }

  if (!facts.display_settings_checked) {
    return {
      error: {
        code:
          "DETECT_SECOND_MONITOR_SETTINGS_NOT_CHECKED",
        message:
          "Must check display settings before detecting the second monitor.",
        failingCommand: "detect_second_monitor",
      },
    };
  }

  return updateScenarioFacts(facts, {
    second_monitor_detected: true,
  });
}

case "CheckDisplayEnabledStatus": {
  const facts = getScenarioFacts(
    state,
    "second_monitor_display_disabled"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_DISPLAY_ENABLED_STATUS_WRONG_SCENARIO",
      "check_display_enabled_status is only valid in the display-disabled second-monitor scenario.",
      "check_display_enabled_status"
    );
  }

  if (!facts.first_dual_display_tested) {
    return {
      error: {
        code:
          "CHECK_DISPLAY_ENABLED_STATUS_DISPLAY_NOT_TESTED",
        message:
          "Must test the detected second monitor before checking whether the display is enabled.",
        failingCommand:
          "check_display_enabled_status",
      },
    };
  }

  return updateScenarioFacts(facts, {
    display_enabled_status_checked: true,
  });
}

case "EnableSecondDisplay": {
  const facts = getScenarioFacts(
    state,
    "second_monitor_display_disabled"
  );

  if (!facts) {
    return wrongScenarioError(
      "ENABLE_SECOND_DISPLAY_WRONG_SCENARIO",
      "enable_second_display is only valid in the display-disabled second-monitor scenario.",
      "enable_second_display"
    );
  }

  if (!facts.display_enabled_status_checked) {
    return {
      error: {
        code:
          "ENABLE_SECOND_DISPLAY_STATUS_NOT_CHECKED",
        message:
          "Must check the display enabled status before enabling the second display.",
        failingCommand: "enable_second_display",
      },
    };
  }

  return updateScenarioFacts(facts, {
    second_display_enabled: true,
  });
}

case "TestDualDisplay": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "second_monitor_not_detected" &&
      facts.kind !== "second_monitor_display_disabled"
    )
  ) {
    return wrongScenarioError(
      "TEST_DUAL_DISPLAY_WRONG_SCENARIO",
      "test_dual_display is only valid in supported second-monitor scenarios.",
      "test_dual_display"
    );
  }

  if (!facts.second_monitor_detected) {
    return {
      error: {
        code:
          "TEST_DUAL_DISPLAY_MONITOR_NOT_DETECTED",
        message:
          "Must detect the second monitor before testing dual-display functionality.",
        failingCommand: "test_dual_display",
      },
    };
  }

  if (facts.kind === "second_monitor_not_detected") {
    return completeScenario(facts, {
      dual_display_working: true,
    });
  }

  if (!facts.first_dual_display_tested) {
    return updateScenarioFacts(facts, {
      first_dual_display_tested: true,
      dual_display_working: false,
    });
  }

  if (!facts.second_display_enabled) {
    return {
      error: {
        code:
          "TEST_DUAL_DISPLAY_SECOND_DISPLAY_DISABLED",
        message:
          "Must check and enable the second display before the final dual-display test.",
        failingCommand: "test_dual_display",
      },
    };
  }

  return completeScenario(facts, {
    dual_display_working: true,
  });
}

case "CheckAudioOutput": {
  const facts = getScenarioFacts(
    state,
    "audio_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_AUDIO_OUTPUT_WRONG_SCENARIO",
      "check_audio_output is only valid in audio_not_working scenario.",
      "check_audio_output"
    );
  }

  return updateScenarioFacts(facts, {
    audio_output_checked: true,
  });
}

case "CheckVolumeStatus": {
  const facts = getScenarioFacts(
    state,
    "audio_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_VOLUME_STATUS_WRONG_SCENARIO",
      "check_volume_status is only valid in audio_not_working scenario.",
      "check_volume_status"
    );
  }

  return updateScenarioFacts(facts, {
    volume_status_checked: true,
  });
}

case "SelectAudioOutput": {
  const facts = getScenarioFacts(
    state,
    "audio_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "SELECT_AUDIO_OUTPUT_WRONG_SCENARIO",
      "select_audio_output is only valid in audio_not_working scenario.",
      "select_audio_output"
    );
  }

  return updateScenarioFacts(facts, {
    audio_output_selected: true,
  });
}

case "TestAudio": {
  const facts = getScenarioFacts(
    state,
    "audio_not_working"
  );

  if (!facts) {
    return wrongScenarioError(
      "TEST_AUDIO_WRONG_SCENARIO",
      "test_audio is only valid in audio_not_working scenario.",
      "test_audio"
    );
  }

  return completeScenario(facts, {
    audio_working: true,
  });
}

// ethernet_not_connected

case "CheckEthernetConnection": {
  const facts = getScenarioFacts(
    state,
    "ethernet_not_connected"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_ETHERNET_CONNECTION_WRONG_SCENARIO",
      "check_ethernet_connection is only valid in ethernet_not_connected scenario.",
      "check_ethernet_connection"
    );
  }

  return updateScenarioFacts(facts, {
    ethernet_checked: true,
  });
}

case "ReconnectEthernetCable": {
  const facts = getScenarioFacts(
    state,
    "ethernet_not_connected"
  );

  if (!facts) {
    return wrongScenarioError(
      "RECONNECT_ETHERNET_CABLE_WRONG_SCENARIO",
      "reconnect_ethernet_cable is only valid in ethernet_not_connected scenario.",
      "reconnect_ethernet_cable"
    );
  }

  return updateScenarioFacts(facts, {
    ethernet_cable_reconnected: true,
  });
}

// slow_network_connection

case "CheckNetworkSpeed": {
  const facts = getScenarioFacts(
    state,
    "slow_network_connection"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_NETWORK_SPEED_WRONG_SCENARIO",
      "check_network_speed is only valid in slow_network_connection scenario.",
      "check_network_speed"
    );
  }

  return updateScenarioFacts(facts, {
    network_speed_checked: true,
  });
}

// internet_no_access

case "CheckNetworkStatus": {
  const facts = getScenarioFacts(
    state,
    "internet_no_access"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_NETWORK_STATUS_WRONG_SCENARIO",
      "check_network_status is only valid in internet_no_access scenario.",
      "check_network_status"
    );
  }

  return updateScenarioFacts(facts, {
    network_checked: true,
  });
}

case "CheckNetworkAdapter": {
  const facts = state.scenarioFacts;

  if (!facts) {
    return wrongScenarioError(
      "CHECK_NETWORK_ADAPTER_NO_FACTS",
      "No scenario facts found.",
      "check_network_adapter"
    );
  }

  if (
    facts.kind === "internet_no_access" ||
    facts.kind === "slow_network_connection"
  ) {
    return updateScenarioFacts(facts, {
      network_adapter_checked: true,
    });
  }

  return wrongScenarioError(
    "CHECK_NETWORK_ADAPTER_WRONG_SCENARIO",
    "check_network_adapter is not valid for this scenario.",
    "check_network_adapter"
  );
}

case "RestartNetworkAdapter": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "internet_no_access" &&
      facts.kind !== "internet_no_access_proxy" &&
      facts.kind !== "slow_network_connection"
    )
  ) {
    return wrongScenarioError(
      "RESTART_NETWORK_ADAPTER_WRONG_SCENARIO",
      "restart_network_adapter is only valid in network connectivity scenarios.",
      "restart_network_adapter"
    );
  }

  return updateScenarioFacts(facts, {
    network_adapter_restarted: true,
  });
}

// cannot_open_file

case "CheckFileOpenError": {
  const facts = getScenarioFacts(
    state,
    "cannot_open_file"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_FILE_OPEN_ERROR_WRONG_SCENARIO",
      "check_file_open_error is only valid in cannot_open_file scenario.",
      "check_file_open_error"
    );
  }

  return updateScenarioFacts(facts, {
    file_open_error_checked: true,
  });
}

case "CheckFileAssociation": {
  const facts = getScenarioFacts(
    state,
    "cannot_open_file"
  );

  if (!facts) {
    return wrongScenarioError(
      "CHECK_FILE_ASSOCIATION_WRONG_SCENARIO",
      "check_file_association is only valid in cannot_open_file scenario.",
      "check_file_association"
    );
  }

  return updateScenarioFacts(facts, {
    file_association_checked: true,
  });
}

case "RepairFileAssociation": {
  const facts = getScenarioFacts(
    state,
    "cannot_open_file"
  );

  if (!facts) {
    return wrongScenarioError(
      "REPAIR_FILE_ASSOCIATION_WRONG_SCENARIO",
      "repair_file_association is only valid in cannot_open_file scenario.",
      "repair_file_association"
    );
  }

  return updateScenarioFacts(facts, {
    file_association_repaired: true,
  });
}

case "TestFileOpen": {
  const facts = getScenarioFacts(
    state,
    "cannot_open_file"
  );

  if (!facts) {
    return wrongScenarioError(
      "TEST_FILE_OPEN_WRONG_SCENARIO",
      "test_file_open is only valid in cannot_open_file scenario.",
      "test_file_open"
    );
  }

  return completeScenario(facts, {
    file_opens_successfully: true,
  });
}

case "ReviewFailedAuthenticationAttempts": {
  const facts = getScenarioFacts(
    state,
    "account_lockout_saved_credentials"
  );

  if (!facts) {
    return wrongScenarioError(
      "REVIEW_FAILED_AUTHENTICATION_ATTEMPTS_WRONG_SCENARIO",
      "review_failed_authentication_attempts is only valid in account_lockout_saved_credentials scenario.",
      "review_failed_authentication_attempts"
    );
  }

  return updateScenarioFacts(facts, {
    repeated_authentication_attempts_reviewed: true,
  });
}

// --- SYSTEM / CONTROL PLANS --- //

    case "QuitAttemptToLobby": {
      return {
        executionState: "LOBBY",
        scenario: null,     
        scenarioFacts: null,
        attempt: null,
        error: null,
        result: null,
      };
    }

    case "ViewScorecard": {
      return {
        executionState: "COMPLETED",
        error: null,
      };
    }

    case "ReadOnly": {
      // Enforce single responsibility: ReadOnly is handled in the engine (output-only),
      // so it must never reach the executor.
      return {
        error: {
          code: "READONLY_REACHED_EXECUTOR",
          message: "Invariant violation: ReadOnly plan reached executor.",
          failingCommand: "help/status",
        },
      };
    }
  }

  return assertNever(plan);
}
// Trip wire: executePlan must remain exhaustive.
//
// The assertNever(plan) at the end of executePlan guarantees that every
// ExecutionPlan kind is handled by a switch case. If a new ExecutionPlan
// is added without an execute handler, TypeScript fails before this module
// can compile.
export const EXECUTE_HANDLER_COVERAGE: true = true;