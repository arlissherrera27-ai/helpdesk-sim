import type { ExecutionPlan, SimState, StatePatch } from "./types";
import { getScenarioDefaults } from "./scenarioRegistry";

// Executor: converts an authorized plan into a patch.
// No legitimacy decisions. No mutation here.
export function executePlan(state: SimState, plan: ExecutionPlan): StatePatch {
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

      // Defensive check (decide() should block this)
      if (!facts || !("identity_verified" in facts)) {
        return {
          error: {
            code: "VERIFY_IDENTITY_WRONG_SCENARIO",
            message: "That action is not available right now.",
            failingCommand: "verify_identity",
          },
        };
      }

      // Defensive check: prevent duplicate verification
      if (facts.identity_verified === true) {
        return {
          error: {
            code: "VERIFY_IDENTITY_ALREADY_VERIFIED",
            message: "Identity already verified.",
            failingCommand: "verify_identity",
          },
        };
      }

      return {
        scenarioFacts: {
          ...facts,
          identity_verified: true,
        },
        error: null,
      };
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
        return {
          error: {
            code: "SEND_RESET_CODE_WRONG_SCENARIO",
            message: "send_reset_code is only valid in password reset scenarios.",
            failingCommand: "send_reset_code",
          },
        };
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

      return {
        scenarioFacts: {
          ...facts,
          code_sent: true,
        },
        error: null,
      };
    }

    case "ResendResetCode": {
      const facts = state.scenarioFacts;

      if (
        !facts ||
        facts.kind !== "password_reset_recovery_email_never_arrives"
      ) {
        return {
          error: {
            code: "RESEND_RESET_CODE_WRONG_SCENARIO",
            message:
              "resend_reset_code is only valid in the recovery email challenge.",
            failingCommand: "resend_reset_code",
          },
        };
      }

      return {
        scenarioFacts: {
          ...facts,
          email_arrived: true,
        },
        error: null,
      };
    }

    case "VerifyAlternateContact": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    facts.kind !== "password_reset_recovery_email_outdated"
  ) {
    return {
      error: {
        code: "VERIFY_ALTERNATE_CONTACT_WRONG_SCENARIO",
        message:
          "verify_alternate_contact is only valid in password_reset_recovery_email_outdated scenario.",
        failingCommand: "verify_alternate_contact",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      alternate_contact_verified: true,
    },
    error: null,
  };
}

case "UpdateRecoveryEmail": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    facts.kind !== "password_reset_recovery_email_outdated"
  ) {
    return {
      error: {
        code: "UPDATE_RECOVERY_EMAIL_WRONG_SCENARIO",
        message:
          "update_recovery_email is only valid in password_reset_recovery_email_outdated scenario.",
        failingCommand: "update_recovery_email",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      recovery_email_updated: true,
    },
    error: null,
  };
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
        return {
          error: {
            code: "CONFIRM_RESET_WRONG_SCENARIO",
            message: "confirm_reset is only valid in password reset scenarios.",
            failingCommand: "confirm_reset",
          },
        };
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

      return {
        scenarioFacts: {
          ...facts,
          reset_done: true,
        },
        error: null,
      };
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
    return {
      error: {
        code: "SET_NEW_PASSWORD_WRONG_SCENARIO",
        message: "set_new_password is only valid in password reset scenarios.",
        failingCommand: "set_new_password",
      },
    };
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

  return {
    scenarioFacts: {
      ...facts,
      password_updated: true,
    },
    error: null,
  };
}

case "TestSignIn": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
    facts.kind !== "password_reset" &&
    facts.kind !== "password_reset_recovery_email_never_arrives" &&
    facts.kind !== "password_reset_recovery_email_outdated"
    )
  ) {
    return {
      error: {
        code: "TEST_SIGN_IN_WRONG_SCENARIO",
        message: "test_sign_in is only valid in password reset scenarios.",
        failingCommand: "test_sign_in",
      },
    };
  }

  if (facts.password_updated !== true) {
    return {
      error: {
        code: "TEST_SIGN_IN_PASSWORD_NOT_UPDATED",
        message: "Must set new password before testing sign-in.",
        failingCommand: "test_sign_in",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      can_login_now: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

    // account_lockout

    case "RequestUnlock": {
      const facts = state.scenarioFacts;

      if (!facts || facts.kind !== "account_lockout") {
        return {
          error: {
            code: "REQUEST_UNLOCK_WRONG_SCENARIO",
            message: "request_unlock is only valid in account_lockout scenario.",
            failingCommand: "request_unlock",
          },
        };
      }

      if (facts.identity_verified !== true) {
        return {
          error: {
            code: "REQUEST_UNLOCK_IDENTITY_NOT_VERIFIED",
            message: "Must verify identity before requesting unlock.",
            failingCommand: "request_unlock",
          },
        };
      }

      if (facts.unlock_requested === true) {
        return {
          error: {
            code: "REQUEST_UNLOCK_ALREADY_REQUESTED",
            message: "Unlock already requested.",
            failingCommand: "request_unlock",
          },
        };
      }

      return {
        scenarioFacts: {
          ...facts,
          unlock_requested: true,
        },
        error: null,
      };
    }

    case "ConfirmUnlock": {
      const facts = state.scenarioFacts;

      if (!facts || facts.kind !== "account_lockout") {
        return {
          error: {
            code: "CONFIRM_UNLOCK_WRONG_SCENARIO",
            message: "confirm_unlock is only valid in account_lockout scenario.",
            failingCommand: "confirm_unlock",
          },
        };
      }

      if (facts.identity_verified !== true) {
        return {
          error: {
            code: "CONFIRM_UNLOCK_IDENTITY_NOT_VERIFIED",
            message: "Must verify identity before confirming unlock.",
            failingCommand: "confirm_unlock",
          },
        };
      }

      if (facts.unlock_requested !== true) {
        return {
          error: {
            code: "CONFIRM_UNLOCK_NOT_REQUESTED",
            message: "Must request unlock before confirming.",
            failingCommand: "confirm_unlock",
          },
        };
      }

      if (facts.account_locked !== true) {
        return {
          error: {
            code: "CONFIRM_UNLOCK_ALREADY_UNLOCKED",
            message: "Account is already unlocked.",
            failingCommand: "confirm_unlock",
          },
        };
      }

      return {
        scenarioFacts: {
          ...facts,
          account_locked: false,
          can_login_now: true,
        },
        result: { totalScore: 0, mistakes: 0, completion: "PASS" }, // ← MATCH password_reset pattern
        executionState: "COMPLETED",
        error: null,
      };
    }

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
    return {
      error: {
        code: "CHECK_VPN_ACCESS_WRONG_SCENARIO",
        message: "check_vpn_access is only valid in vpn_access_issue scenario.",
        failingCommand: "check_vpn_access",
      },
    };
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

  return {
    scenarioFacts: {
      ...facts,
      vpn_access_checked: true,
    },
    error: null,
  };
}

    case "EnableVpnAccess": {
  const facts = state.scenarioFacts;

if (
  !facts ||
  (
    facts.kind !== "vpn_access_issue" &&
    facts.kind !== "vpn_mfa_dependency_missing" &&
    facts.kind !== "network_drive_vpn_required_first"
  )
) {
    return {
      error: {
        code: "ENABLE_VPN_WRONG_SCENARIO",
        message: "enable_vpn_access is only valid in vpn_access_issue scenario.",
        failingCommand: "enable_vpn_access",
      },
    };
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

  return {
    scenarioFacts: {
      ...facts,
      vpn_access_enabled: true,
    },
    error: null,
  };
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
    return {
      error: {
        code: "CONFIRM_CONNECTION_WRONG_SCENARIO",
        message: "confirm_connection is only valid in vpn_access_issue scenario.",
        failingCommand: "confirm_connection",
      },
    };
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

  return {
    scenarioFacts: {
      ...facts,
      can_connect_now: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

    // --- EMAIL PLANS --- //

    // email_not_sending
    case "CheckEmailStatus": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "email_not_sending") {
    return {
      error: {
        code: "CHECK_EMAIL_STATUS_WRONG_SCENARIO",
        message: "check_email_status is only valid in email_not_sending scenario.",
        failingCommand: "check_email_status",
      },
    };
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "CHECK_EMAIL_STATUS_IDENTITY_NOT_VERIFIED",
        message: "Must verify identity before checking email status.",
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

  return {
    scenarioFacts: {
      ...facts,
      email_status_checked: true,
    },
    error: null,
  };
}

case "EnableEmailClient": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "email_not_sending") {
    return {
      error: {
        code: "ENABLE_EMAIL_CLIENT_WRONG_SCENARIO",
        message: "enable_email_client is only valid in email_not_sending scenario.",
        failingCommand: "enable_email_client",
      },
    };
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

  return {
    scenarioFacts: {
      ...facts,
      email_client_online: true,
    },
    error: null,
  };
}

case "SendTestEmail": {
  const facts = state.scenarioFacts;

  if (!facts) {
    return {
      error: {
        code: "SEND_TEST_EMAIL_NO_FACTS",
        message: "No scenario facts found.",
        failingCommand: "send_test_email",
      },
    };
  }

  if (facts.kind === "email_not_sending") {
    if (!facts.email_client_online) {
      return {
        error: {
          code: "SEND_TEST_EMAIL_CLIENT_OFFLINE",
          message: "Must enable email client before sending test email.",
          failingCommand: "send_test_email",
        },
      };
    }

    return {
      scenarioFacts: {
        ...facts,
        can_send_email: true,
      },
      result: { totalScore: 0, mistakes: 0, completion: "PASS" },
      executionState: "COMPLETED",
      error: null,
    };
  }

    if (facts.kind === "not_receiving_email") {
    if (!facts.filter_disabled) {
      return {
        error: {
          code: "SEND_TEST_EMAIL_FILTER_ACTIVE",
          message: "Must disable inbox filter before testing email.",
          failingCommand: "send_test_email",
        },
      };
    }

    return {
      scenarioFacts: {
        ...facts,
        can_receive_email: true,
      },
      result: { totalScore: 0, mistakes: 0, completion: "PASS" },
      executionState: "COMPLETED",
      error: null,
    };
  }

    if (facts.kind === "mailbox_full") {
    if (!facts.old_emails_archived) {
      return {
        error: {
          code: "SEND_TEST_EMAIL_MAILBOX_STILL_FULL",
          message: "Must archive old emails before testing email delivery.",
          failingCommand: "send_test_email",
        },
      };
    }

    return {
      scenarioFacts: {
        ...facts,
        mailbox_receiving_email: true,
      },
      result: { totalScore: 0, mistakes: 0, completion: "PASS" },
      executionState: "COMPLETED",
      error: null,
    };
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

    return {
      scenarioFacts: {
        ...facts,
        test_email_sent: true,
      },
      result: { totalScore: 0, mistakes: 0, completion: "PASS" },
      executionState: "COMPLETED",
      error: null,
    };
  }

  return {
    error: {
      code: "SEND_TEST_EMAIL_WRONG_SCENARIO",
      message: "send_test_email is not valid for this scenario.",
      failingCommand: "send_test_email",
    },
  };
}

// mailbox_full
case "CheckMailboxStorage": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "mailbox_full") {
    return {
      error: {
        code: "CHECK_MAILBOX_STORAGE_WRONG_SCENARIO",
        message: "check_mailbox_storage is only valid in mailbox_full scenario.",
        failingCommand: "check_mailbox_storage",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      mailbox_storage_checked: true,
    },
    error: null,
  };
}

case "ArchiveOldEmails": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "mailbox_full") {
    return {
      error: {
        code: "ARCHIVE_OLD_EMAILS_WRONG_SCENARIO",
        message: "archive_old_emails is only valid in mailbox_full scenario.",
        failingCommand: "archive_old_emails",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      old_emails_archived: true,
    },
    error: null,
  };
}

// shared_mailbox_missing

case "CheckSharedMailboxMembership": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "shared_mailbox_missing") {
    return {
      error: {
        code: "CHECK_SHARED_MAILBOX_MEMBERSHIP_WRONG_SCENARIO",
        message:
          "check_shared_mailbox_membership is only valid in shared_mailbox_missing scenario.",
        failingCommand: "check_shared_mailbox_membership",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      shared_mailbox_membership_checked: true,
    },
    error: null,
  };
}

case "GrantSharedMailboxAccess": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "shared_mailbox_missing") {
    return {
      error: {
        code: "GRANT_SHARED_MAILBOX_ACCESS_WRONG_SCENARIO",
        message:
          "grant_shared_mailbox_access is only valid in shared_mailbox_missing scenario.",
        failingCommand: "grant_shared_mailbox_access",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      shared_mailbox_access_granted: true,
    },
    error: null,
  };
}

case "TestSharedMailboxAccess": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "shared_mailbox_missing") {
    return {
      error: {
        code: "TEST_SHARED_MAILBOX_ACCESS_WRONG_SCENARIO",
        message:
          "test_shared_mailbox_access is only valid in shared_mailbox_missing scenario.",
        failingCommand: "test_shared_mailbox_access",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      shared_mailbox_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// attachment_too_large

case "CheckAttachmentSize": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "attachment_too_large") {
    return {
      error: {
        code: "CHECK_ATTACHMENT_SIZE_WRONG_SCENARIO",
        message: "check_attachment_size is only valid in attachment_too_large scenario.",
        failingCommand: "check_attachment_size",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      attachment_size_checked: true,
    },
    error: null,
  };
}

case "CompressAttachment": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "attachment_too_large") {
    return {
      error: {
        code: "COMPRESS_ATTACHMENT_WRONG_SCENARIO",
        message: "compress_attachment is only valid in attachment_too_large scenario.",
        failingCommand: "compress_attachment",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      attachment_compressed: true,
    },
    error: null,
  };
}

// email_client_not_syncing

case "CheckSyncSettings": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "email_client_not_syncing") {
    return {
      error: {
        code: "CHECK_SYNC_SETTINGS_WRONG_SCENARIO",
        message: "check_sync_settings is only valid in email_client_not_syncing scenario.",
        failingCommand: "check_sync_settings",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      sync_settings_checked: true,
    },
    error: null,
  };
}

case "ResyncEmailClient": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "email_client_not_syncing") {
    return {
      error: {
        code: "RESYNC_EMAIL_CLIENT_WRONG_SCENARIO",
        message: "resync_email_client is only valid in email_client_not_syncing scenario.",
        failingCommand: "resync_email_client",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      email_client_resynced: true,
    },
    error: null,
  };
}

case "TestEmailSync": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "email_client_not_syncing") {
    return {
      error: {
        code: "TEST_EMAIL_SYNC_WRONG_SCENARIO",
        message: "test_email_sync is only valid in email_client_not_syncing scenario.",
        failingCommand: "test_email_sync",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      email_sync_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// email_login_issue

case "CheckEmailLoginStatus": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "email_login_issue") {
    return {
      error: {
        code: "CHECK_EMAIL_LOGIN_STATUS_WRONG_SCENARIO",
        message: "check_email_login_status is only valid in email_login_issue scenario.",
        failingCommand: "check_email_login_status",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      email_login_checked: true,
    },
    error: null,
  };
}

case "ResetEmailSession": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "email_login_issue") {
    return {
      error: {
        code: "RESET_EMAIL_SESSION_WRONG_SCENARIO",
        message: "reset_email_session is only valid in email_login_issue scenario.",
        failingCommand: "reset_email_session",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      email_session_reset: true,
    },
    error: null,
  };
}

case "TestEmailLogin": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "email_login_issue") {
    return {
      error: {
        code: "TEST_EMAIL_LOGIN_WRONG_SCENARIO",
        message: "test_email_login is only valid in email_login_issue scenario.",
        failingCommand: "test_email_login",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      email_login_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// not_receiving_email

case "CheckInboxFilters": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "not_receiving_email" &&
      facts.kind !== "password_reset_recovery_email_never_arrives"
    )
  ) {
    return {
      error: {
        code: "CHECK_INBOX_FILTERS_WRONG_SCENARIO",
        message: "check_inbox_filters is only valid in inbox filter scenarios.",
        failingCommand: "check_inbox_filters",
      },
    };
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "CHECK_INBOX_FILTERS_IDENTITY_NOT_VERIFIED",
        message: "Must verify identity before checking inbox filters.",
        failingCommand: "check_inbox_filters",
      },
    };
  }

  if (facts.kind === "not_receiving_email") {
    return {
      scenarioFacts: {
        ...facts,
        filters_checked: true,
      },
      error: null,
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      inbox_filter_checked: true,
    },
    error: null,
  };
}

case "DisableInboxFilter": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    (
      facts.kind !== "not_receiving_email" &&
      facts.kind !== "password_reset_recovery_email_never_arrives"
    )
  ) {
    return {
      error: {
        code: "DISABLE_INBOX_FILTER_WRONG_SCENARIO",
        message: "disable_inbox_filter is only valid in inbox filter scenarios.",
        failingCommand: "disable_inbox_filter",
      },
    };
  }

  if (
    facts.kind === "not_receiving_email" &&
    !facts.filters_checked
  ) {
    return {
      error: {
        code: "DISABLE_INBOX_FILTER_NOT_CHECKED",
        message: "Must check inbox filters before disabling the filter.",
        failingCommand: "disable_inbox_filter",
      },
    };
  }

  if (
    facts.kind === "password_reset_recovery_email_never_arrives" &&
    !facts.inbox_filter_checked
  ) {
    return {
      error: {
        code: "DISABLE_INBOX_FILTER_NOT_CHECKED",
        message: "Must check inbox filters before disabling the filter.",
        failingCommand: "disable_inbox_filter",
      },
    };
  }

  if (facts.kind === "not_receiving_email") {
    return {
      scenarioFacts: {
        ...facts,
        filter_disabled: true,
      },
      error: null,
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      inbox_filter_enabled: false,
    },
    error: null,
  };
}

// --- NETWORK / CONNECTIVITY PLANS --- //

// cannot_connect_wifi
case "CheckWifiStatus": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "cannot_connect_wifi") {
    return {
      error: {
        code: "CHECK_WIFI_STATUS_WRONG_SCENARIO",
        message: "check_wifi_status is only valid in cannot_connect_wifi scenario.",
        failingCommand: "check_wifi_status",
      },
    };
  }

  if (!facts.identity_verified) {
    return {
      error: {
        code: "CHECK_WIFI_STATUS_IDENTITY_NOT_VERIFIED",
        message: "Must verify identity before checking WiFi status.",
        failingCommand: "check_wifi_status",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      wifi_checked: true,
    },
    error: null,
  };
}

case "EnableWifi": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "cannot_connect_wifi") {
    return {
      error: {
        code: "ENABLE_WIFI_WRONG_SCENARIO",
        message: "enable_wifi is only valid in cannot_connect_wifi scenario.",
        failingCommand: "enable_wifi",
      },
    };
  }

  if (!facts.wifi_checked) {
    return {
      error: {
        code: "ENABLE_WIFI_NOT_CHECKED",
        message: "Must check WiFi status before enabling WiFi.",
        failingCommand: "enable_wifi",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      wifi_enabled: true,
    },
    error: null,
  };
}

case "TestConnection": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "cannot_connect_wifi") {
    return {
      error: {
        code: "TEST_CONNECTION_WRONG_SCENARIO",
        message: "test_connection is only valid in cannot_connect_wifi scenario.",
        failingCommand: "test_connection",
      },
    };
  }

  if (!facts.wifi_enabled) {
    return {
      error: {
        code: "TEST_CONNECTION_WIFI_NOT_ENABLED",
        message: "Must enable WiFi before testing connection.",
        failingCommand: "test_connection",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      can_connect_wifi: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// --- DEVICE / PERFORMANCE PLANS --- //

// too_many_apps_running
case "CheckRunningApps": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "too_many_apps_running") {
    return {
      error: {
        code: "CHECK_RUNNING_APPS_WRONG_SCENARIO",
        message: "check_running_apps is only valid in too_many_apps_running scenario.",
        failingCommand: "check_running_apps",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      apps_checked: true,
    },
    error: null,
  };
}

case "CloseUnnecessaryApps": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "too_many_apps_running") {
    return {
      error: {
        code: "CLOSE_UNNECESSARY_APPS_WRONG_SCENARIO",
        message: "close_unnecessary_apps is only valid in too_many_apps_running scenario.",
        failingCommand: "close_unnecessary_apps",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      apps_closed: true,
    },
    error: null,
  };
}

case "TestPerformance": {
  const facts = state.scenarioFacts;

  if (!facts) {
    return {
      error: {
        code: "TEST_PERFORMANCE_NO_FACTS",
        message: "No scenario facts found.",
        failingCommand: "test_performance",
      },
    };
  }

  if (facts.kind === "too_many_apps_running") {
    return {
      scenarioFacts: {
        ...facts,
        performance_ok: true,
      },
      result: { totalScore: 0, mistakes: 0, completion: "PASS" },
      executionState: "COMPLETED",
      error: null,
    };
  }

  if (facts.kind === "low_memory") {
    return {
      scenarioFacts: {
        ...facts,
        memory_ok: true,
      },
      result: { totalScore: 0, mistakes: 0, completion: "PASS" },
      executionState: "COMPLETED",
      error: null,
    };
  }

  return {
    error: {
      code: "TEST_PERFORMANCE_WRONG_SCENARIO",
      message: "test_performance is not valid for this scenario.",
      failingCommand: "test_performance",
    },
  };
}

// low_memory

case "CheckMemoryUsage": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "low_memory") {
    return {
      error: {
        code: "CHECK_MEMORY_USAGE_WRONG_SCENARIO",
        message: "check_memory_usage is only valid in low_memory scenario.",
        failingCommand: "check_memory_usage",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      memory_checked: true,
    },
    error: null,
  };
}

case "CloseMemoryHeavyApps": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "low_memory") {
    return {
      error: {
        code: "CLOSE_MEMORY_HEAVY_APPS_WRONG_SCENARIO",
        message: "close_memory_heavy_apps is only valid in low_memory scenario.",
        failingCommand: "close_memory_heavy_apps",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      memory_heavy_apps_closed: true,
    },
    error: null,
  };
}

case "CheckPrinterStatus": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "printer_not_working") {
    return {
      error: {
        code: "CHECK_PRINTER_STATUS_WRONG_SCENARIO",
        message: "check_printer_status is only valid in printer_not_working scenario.",
        failingCommand: "check_printer_status",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      printer_checked: true,
    },
    error: null,
  };
}

case "RestartPrinter": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "printer_not_working") {
    return {
      error: {
        code: "RESTART_PRINTER_WRONG_SCENARIO",
        message: "restart_printer is only valid in printer_not_working scenario.",
        failingCommand: "restart_printer",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      printer_restarted: true,
    },
    error: null,
  };
}

case "PrintTestPage": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "printer_not_working") {
    return {
      error: {
        code: "PRINT_TEST_PAGE_WRONG_SCENARIO",
        message: "print_test_page is only valid in printer_not_working scenario.",
        failingCommand: "print_test_page",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      printer_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// --- FILES / STORAGE PLANS --- //

// disk_space_full
case "CheckDiskSpace": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "disk_space_full") {
    return {
      error: {
        code: "CHECK_DISK_SPACE_WRONG_SCENARIO",
        message: "check_disk_space is only valid in disk_space_full scenario.",
        failingCommand: "check_disk_space",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      disk_checked: true,
    },
    error: null,
  };
}

case "ClearTempFiles": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "disk_space_full") {
    return {
      error: {
        code: "CLEAR_TEMP_FILES_WRONG_SCENARIO",
        message: "clear_temp_files is only valid in disk_space_full scenario.",
        failingCommand: "clear_temp_files",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      temp_files_cleared: true,
    },
    error: null,
  };
}

case "ConfirmStorageAvailable": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "disk_space_full") {
    return {
      error: {
        code: "CONFIRM_STORAGE_AVAILABLE_WRONG_SCENARIO",
        message: "confirm_storage_available is only valid in disk_space_full scenario.",
        failingCommand: "confirm_storage_available",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      storage_available: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
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
    return {
      error: {
        code: "CHECK_NETWORK_DRIVE_MAPPING_WRONG_SCENARIO",
        message:
          "check_network_drive_mapping is only valid in network drive scenarios.",
        failingCommand: "check_network_drive_mapping",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      network_drive_mapping_checked: true,
    },
    error: null,
  };
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
    return {
      error: {
        code: "REMAP_NETWORK_DRIVE_WRONG_SCENARIO",
        message:
          "remap_network_drive is only valid in network drive scenarios.",
        failingCommand: "remap_network_drive",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      network_drive_remapped: true,
    },
    error: null,
  };
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
    return {
      error: {
        code: "TEST_NETWORK_DRIVE_ACCESS_WRONG_SCENARIO",
        message:
          "test_network_drive_access is only valid in network drive scenarios.",
        failingCommand: "test_network_drive_access",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      network_drive_access_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// mouse_keyboard_not_working

case "CheckDeviceConnection": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "mouse_keyboard_not_working") {
    return {
      error: {
        code: "CHECK_DEVICE_CONNECTION_WRONG_SCENARIO",
        message: "check_device_connection is only valid in mouse_keyboard_not_working scenario.",
        failingCommand: "check_device_connection",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      device_connection_checked: true,
    },
    error: null,
  };
}

case "ReconnectDevice": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "mouse_keyboard_not_working") {
    return {
      error: {
        code: "RECONNECT_DEVICE_WRONG_SCENARIO",
        message: "reconnect_device is only valid in mouse_keyboard_not_working scenario.",
        failingCommand: "reconnect_device",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      device_reconnected: true,
    },
    error: null,
  };
}

case "TestInputDevice": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "mouse_keyboard_not_working") {
    return {
      error: {
        code: "TEST_INPUT_DEVICE_WRONG_SCENARIO",
        message: "test_input_device is only valid in mouse_keyboard_not_working scenario.",
        failingCommand: "test_input_device",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      input_device_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// --- SOFTWARE / APPLICATIONS PLANS --- //

// software_app_not_opening + application_crash
case "CheckAppStatus": {
  const facts = state.scenarioFacts;

  if (
  !facts ||
  (
    facts.kind !== "software_app_not_opening" &&
    facts.kind !== "application_crash" &&
    facts.kind !== "software_app_license_not_assigned"
  )
) {
  return {
    error: {
      code: "CHECK_APP_STATUS_WRONG_SCENARIO",
      message: "check_app_status is only valid in software app scenarios.",
      failingCommand: "check_app_status",
    },
  };
}

  return {
    scenarioFacts: {
      ...facts,
      app_status_checked: true,
    },
    error: null,
  };
}

case "CheckLicenseAssignment": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    facts.kind !== "software_app_license_not_assigned"
  ) {
    return {
      error: {
        code: "CHECK_LICENSE_ASSIGNMENT_WRONG_SCENARIO",
        message:
          "check_license_assignment is only valid in software_app_license_not_assigned scenario.",
        failingCommand: "check_license_assignment",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      license_assignment_checked: true,
    },
    error: null,
  };
}

case "AssignSoftwareLicense": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    facts.kind !== "software_app_license_not_assigned"
  ) {
    return {
      error: {
        code: "ASSIGN_SOFTWARE_LICENSE_WRONG_SCENARIO",
        message:
          "assign_software_license is only valid in software_app_license_not_assigned scenario.",
        failingCommand: "assign_software_license",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      software_license_assigned: true,
    },
    error: null,
  };
}

case "RestartApplication": {
  const facts = state.scenarioFacts;

  if (
  !facts ||
  (
    facts.kind !== "software_app_not_opening" &&
    facts.kind !== "application_crash"
  )
) {
  return {
    error: {
      code: "RESTART_APPLICATION_WRONG_SCENARIO",
      message: "restart_application is only valid in software app scenarios.",
      failingCommand: "restart_application",
    },
  };
}

  return {
    scenarioFacts: {
      ...facts,
      application_restarted: true,
    },
    error: null,
  };
}

case "TestApplicationLaunch": {
  const facts = state.scenarioFacts;

  if (
  !facts ||
  (
    facts.kind !== "software_app_not_opening" &&
    facts.kind !== "application_crash" &&
    facts.kind !== "software_update_required" &&
    facts.kind !== "software_app_license_not_assigned"
  )
) {
  return {
    error: {
      code: "TEST_APPLICATION_LAUNCH_WRONG_SCENARIO",
      message: "test_application_launch is only valid in software app scenarios.",
      failingCommand: "test_application_launch",
    },
  };
}

  return {
    scenarioFacts: {
      ...facts,
      application_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// software_update_required

case "CheckSoftwareVersion": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "software_update_required") {
    return {
      error: {
        code: "CHECK_SOFTWARE_VERSION_WRONG_SCENARIO",
        message: "check_software_version is only valid in software_update_required scenario.",
        failingCommand: "check_software_version",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      software_version_checked: true,
    },
    error: null,
  };
}

case "InstallSoftwareUpdate": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "software_update_required") {
    return {
      error: {
        code: "INSTALL_SOFTWARE_UPDATE_WRONG_SCENARIO",
        message: "install_software_update is only valid in software_update_required scenario.",
        failingCommand: "install_software_update",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      software_update_installed: true,
    },
    error: null,
  };
}

// microphone_not_working

case "CheckMicrophoneSettings": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "microphone_not_working") {
    return {
      error: {
        code: "CHECK_MICROPHONE_SETTINGS_WRONG_SCENARIO",
        message: "check_microphone_settings is only valid in microphone_not_working scenario.",
        failingCommand: "check_microphone_settings",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      microphone_settings_checked: true,
    },
    error: null,
  };
}

case "EnableMicrophone": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "microphone_not_working") {
    return {
      error: {
        code: "ENABLE_MICROPHONE_WRONG_SCENARIO",
        message: "enable_microphone is only valid in microphone_not_working scenario.",
        failingCommand: "enable_microphone",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      microphone_enabled: true,
    },
    error: null,
  };
}

case "TestMicrophone": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "microphone_not_working") {
    return {
      error: {
        code: "TEST_MICROPHONE_WRONG_SCENARIO",
        message: "test_microphone is only valid in microphone_not_working scenario.",
        failingCommand: "test_microphone",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      microphone_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
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
    return {
      error: {
        code: "CHECK_SHARED_DRIVE_PERMISSIONS_WRONG_SCENARIO",
        message:
          "check_shared_drive_permissions is only valid in shared drive access scenarios.",
        failingCommand: "check_shared_drive_permissions",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      shared_drive_permissions_checked: true,
    },
    error: null,
  };
}

case "GrantSharedDriveAccess": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "shared_drive_access_issue") {
    return {
      error: {
        code: "GRANT_SHARED_DRIVE_ACCESS_WRONG_SCENARIO",
        message:
          "grant_shared_drive_access is only valid in shared_drive_access_issue scenario.",
        failingCommand: "grant_shared_drive_access",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      shared_drive_access_granted: true,
    },
    error: null,
  };
}

case "AddUserToGroup": {
  const facts = state.scenarioFacts;

  if (
    !facts ||
    facts.kind !== "shared_drive_group_membership_missing"
  ) {
    return {
      error: {
        code: "ADD_USER_TO_GROUP_WRONG_SCENARIO",
        message:
          "add_user_to_group is only valid in shared_drive_group_membership_missing scenario.",
        failingCommand: "add_user_to_group",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      user_added_to_group: true,
    },
    error: null,
  };
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
    return {
      error: {
        code: "TEST_SHARED_DRIVE_ACCESS_WRONG_SCENARIO",
        message:
          "test_shared_drive_access is only valid in shared drive access scenarios.",
        failingCommand: "test_shared_drive_access",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      shared_drive_access_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

case "CheckUserPermissions": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "permissions_denied") {
    return {
      error: {
        code: "CHECK_USER_PERMISSIONS_WRONG_SCENARIO",
        message: "check_user_permissions is only valid in permissions_denied scenario.",
        failingCommand: "check_user_permissions",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      user_permissions_checked: true,
    },
    error: null,
  };
}

case "GrantRequiredPermission": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "permissions_denied") {
    return {
      error: {
        code: "GRANT_REQUIRED_PERMISSION_WRONG_SCENARIO",
        message: "grant_required_permission is only valid in permissions_denied scenario.",
        failingCommand: "grant_required_permission",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      required_permission_granted: true,
    },
    error: null,
  };
}

case "TestPermissionAccess": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "permissions_denied") {
    return {
      error: {
        code: "TEST_PERMISSION_ACCESS_WRONG_SCENARIO",
        message: "test_permission_access is only valid in permissions_denied scenario.",
        failingCommand: "test_permission_access",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      permission_access_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// folder_access_missing

case "CheckFolderPermissions": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "folder_access_missing") {
    return {
      error: {
        code: "CHECK_FOLDER_PERMISSIONS_WRONG_SCENARIO",
        message: "check_folder_permissions is only valid in folder_access_missing scenario.",
        failingCommand: "check_folder_permissions",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      folder_permissions_checked: true,
    },
    error: null,
  };
}

case "GrantFolderAccess": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "folder_access_missing") {
    return {
      error: {
        code: "GRANT_FOLDER_ACCESS_WRONG_SCENARIO",
        message: "grant_folder_access is only valid in folder_access_missing scenario.",
        failingCommand: "grant_folder_access",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      folder_access_granted: true,
    },
    error: null,
  };
}

case "TestFolderAccess": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "folder_access_missing") {
    return {
      error: {
        code: "TEST_FOLDER_ACCESS_WRONG_SCENARIO",
        message: "test_folder_access is only valid in folder_access_missing scenario.",
        failingCommand: "test_folder_access",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      folder_access_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// webcam_not_working

case "CheckWebcamSettings": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "webcam_not_working") {
    return {
      error: {
        code: "CHECK_WEBCAM_SETTINGS_WRONG_SCENARIO",
        message: "check_webcam_settings is only valid in webcam_not_working scenario.",
        failingCommand: "check_webcam_settings",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      webcam_settings_checked: true,
    },
    error: null,
  };
}

case "EnableWebcam": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "webcam_not_working") {
    return {
      error: {
        code: "ENABLE_WEBCAM_WRONG_SCENARIO",
        message: "enable_webcam is only valid in webcam_not_working scenario.",
        failingCommand: "enable_webcam",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      webcam_enabled: true,
    },
    error: null,
  };
}

case "TestWebcam": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "webcam_not_working") {
    return {
      error: {
        code: "TEST_WEBCAM_WRONG_SCENARIO",
        message: "test_webcam is only valid in webcam_not_working scenario.",
        failingCommand: "test_webcam",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      webcam_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

case "CheckMfaStatus": {
  const facts = state.scenarioFacts;

  if (
  !facts ||
  (
    facts.kind !== "mfa_code_not_working" &&
    facts.kind !== "vpn_mfa_dependency_missing"
  )
) {
    return {
      error: {
        code: "CHECK_MFA_STATUS_WRONG_SCENARIO",
        message: "check_mfa_status is only valid in mfa_code_not_working scenario.",
        failingCommand: "check_mfa_status",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      mfa_status_checked: true,
    },
    error: null,
  };
}

case "ResetMfaMethod": {
  const facts = state.scenarioFacts;

  if (
  !facts ||
  (
    facts.kind !== "mfa_code_not_working" &&
    facts.kind !== "vpn_mfa_dependency_missing"
  )
) {
    return {
      error: {
        code: "RESET_MFA_METHOD_WRONG_SCENARIO",
        message: "reset_mfa_method is only valid in mfa_code_not_working scenario.",
        failingCommand: "reset_mfa_method",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      mfa_method_reset: true,
    },
    error: null,
  };
}

case "TestMfaLogin": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "mfa_code_not_working") {
    return {
      error: {
        code: "TEST_MFA_LOGIN_WRONG_SCENARIO",
        message: "test_mfa_login is only valid in mfa_code_not_working scenario.",
        failingCommand: "test_mfa_login",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      mfa_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// browser_running_slow

// --- HARDWARE / PERIPHERALS PLANS --- //

// printer_not_working
case "CheckBrowserExtensions": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "browser_running_slow") {
    return {
      error: {
        code: "CHECK_BROWSER_EXTENSIONS_WRONG_SCENARIO",
        message: "check_browser_extensions is only valid in browser_running_slow scenario.",
        failingCommand: "check_browser_extensions",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      browser_extensions_checked: true,
    },
    error: null,
  };
}

case "DisableUnnecessaryExtensions": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "browser_running_slow") {
    return {
      error: {
        code: "DISABLE_UNNECESSARY_EXTENSIONS_WRONG_SCENARIO",
        message: "disable_unnecessary_extensions is only valid in browser_running_slow scenario.",
        failingCommand: "disable_unnecessary_extensions",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      unnecessary_extensions_disabled: true,
    },
    error: null,
  };
}

case "TestBrowserPerformance": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "browser_running_slow") {
    return {
      error: {
        code: "TEST_BROWSER_PERFORMANCE_WRONG_SCENARIO",
        message: "test_browser_performance is only valid in browser_running_slow scenario.",
        failingCommand: "test_browser_performance",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      browser_performance_ok: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

case "CheckInstallPermissions": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "cannot_install_software") {
    return {
      error: {
        code: "CHECK_INSTALL_PERMISSIONS_WRONG_SCENARIO",
        message: "check_install_permissions is only valid in cannot_install_software scenario.",
        failingCommand: "check_install_permissions",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      install_permissions_checked: true,
    },
    error: null,
  };
}

case "GrantInstallPermissions": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "cannot_install_software") {
    return {
      error: {
        code: "GRANT_INSTALL_PERMISSIONS_WRONG_SCENARIO",
        message: "grant_install_permissions is only valid in cannot_install_software scenario.",
        failingCommand: "grant_install_permissions",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      install_permissions_granted: true,
    },
    error: null,
  };
}

case "TestSoftwareInstall": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "cannot_install_software") {
    return {
      error: {
        code: "TEST_SOFTWARE_INSTALL_WRONG_SCENARIO",
        message: "test_software_install is only valid in cannot_install_software scenario.",
        failingCommand: "test_software_install",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      software_install_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// second_monitor_not_detected

case "CheckDisplayConnection": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "second_monitor_not_detected") {
    return {
      error: {
        code: "CHECK_DISPLAY_CONNECTION_WRONG_SCENARIO",
        message: "check_display_connection is only valid in second_monitor_not_detected scenario.",
        failingCommand: "check_display_connection",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      display_connection_checked: true,
    },
    error: null,
  };
}

case "CheckDisplaySettings": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "second_monitor_not_detected") {
    return {
      error: {
        code: "CHECK_DISPLAY_SETTINGS_WRONG_SCENARIO",
        message: "check_display_settings is only valid in second_monitor_not_detected scenario.",
        failingCommand: "check_display_settings",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      display_settings_checked: true,
    },
    error: null,
  };
}

case "DetectSecondMonitor": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "second_monitor_not_detected") {
    return {
      error: {
        code: "DETECT_SECOND_MONITOR_WRONG_SCENARIO",
        message: "detect_second_monitor is only valid in second_monitor_not_detected scenario.",
        failingCommand: "detect_second_monitor",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      second_monitor_detected: true,
    },
    error: null,
  };
}

case "TestDualDisplay": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "second_monitor_not_detected") {
    return {
      error: {
        code: "TEST_DUAL_DISPLAY_WRONG_SCENARIO",
        message: "test_dual_display is only valid in second_monitor_not_detected scenario.",
        failingCommand: "test_dual_display",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      dual_display_working: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
}

// ethernet_not_connected

case "CheckEthernetConnection": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "ethernet_not_connected") {
    return {
      error: {
        code: "CHECK_ETHERNET_CONNECTION_WRONG_SCENARIO",
        message: "check_ethernet_connection is only valid in ethernet_not_connected scenario.",
        failingCommand: "check_ethernet_connection",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      ethernet_checked: true,
    },
    error: null,
  };
}

case "ReconnectEthernetCable": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "ethernet_not_connected") {
    return {
      error: {
        code: "RECONNECT_ETHERNET_CABLE_WRONG_SCENARIO",
        message: "reconnect_ethernet_cable is only valid in ethernet_not_connected scenario.",
        failingCommand: "reconnect_ethernet_cable",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      ethernet_cable_reconnected: true,
    },
    error: null,
  };
}

// slow_network_connection

case "CheckNetworkSpeed": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "slow_network_connection") {
    return {
      error: {
        code: "CHECK_NETWORK_SPEED_WRONG_SCENARIO",
        message: "check_network_speed is only valid in slow_network_connection scenario.",
        failingCommand: "check_network_speed",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      network_speed_checked: true,
    },
    error: null,
  };
}

// internet_no_access

case "CheckNetworkStatus": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "internet_no_access") {
    return {
      error: {
        code: "CHECK_NETWORK_STATUS_WRONG_SCENARIO",
        message: "check_network_status is only valid in internet_no_access scenario.",
        failingCommand: "check_network_status",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      network_checked: true,
    },
    error: null,
  };
}

case "CheckNetworkAdapter": {
  const facts = state.scenarioFacts;

  if (!facts) {
    return {
      error: {
        code: "CHECK_NETWORK_ADAPTER_NO_FACTS",
        message: "No scenario facts found.",
        failingCommand: "check_network_adapter",
      },
    };
  }

  if (facts.kind === "internet_no_access") {
    return {
      scenarioFacts: {
        ...facts,
        network_adapter_checked: true,
      },
      error: null,
    };
  }

  if (facts.kind === "slow_network_connection") {
    return {
      scenarioFacts: {
        ...facts,
        network_adapter_checked: true,
      },
      error: null,
    };
  }

  return {
    error: {
      code: "CHECK_NETWORK_ADAPTER_WRONG_SCENARIO",
      message: "check_network_adapter is not valid for this scenario.",
      failingCommand: "check_network_adapter",
    },
  };
}

case "RestartNetworkAdapter": {
  const facts = state.scenarioFacts;

  if (!facts) {
    return {
      error: {
        code: "RESTART_NETWORK_ADAPTER_NO_FACTS",
        message: "No scenario facts found.",
        failingCommand: "restart_network_adapter",
      },
    };
  }

  if (facts.kind === "internet_no_access") {
    return {
      scenarioFacts: {
        ...facts,
        network_adapter_restarted: true,
      },
      error: null,
    };
  }

  if (facts.kind === "slow_network_connection") {
    return {
      scenarioFacts: {
        ...facts,
        network_adapter_restarted: true,
      },
      error: null,
    };
  }

  return {
    error: {
      code: "RESTART_NETWORK_ADAPTER_WRONG_SCENARIO",
      message: "restart_network_adapter is not valid for this scenario.",
      failingCommand: "restart_network_adapter",
    },
  };
}

case "TestInternetConnection": {
  const facts = state.scenarioFacts;

  if (!facts) {
    return {
      error: {
        code: "TEST_INTERNET_CONNECTION_NO_FACTS",
        message: "No scenario facts found.",
        failingCommand: "test_internet_connection",
      },
    };
  }

  if (facts.kind === "internet_no_access") {
    return {
      scenarioFacts: {
        ...facts,
        internet_restored: true,
      },
      result: { totalScore: 0, mistakes: 0, completion: "PASS" },
      executionState: "COMPLETED",
      error: null,
    };
  }

  if (facts.kind === "slow_network_connection") {
    return {
      scenarioFacts: {
        ...facts,
        internet_speed_restored: true,
      },
      result: { totalScore: 0, mistakes: 0, completion: "PASS" },
      executionState: "COMPLETED",
      error: null,
    };
  }

    if (facts.kind === "ethernet_not_connected") {
    return {
      scenarioFacts: {
        ...facts,
        ethernet_connection_restored: true,
      },
      result: { totalScore: 0, mistakes: 0, completion: "PASS" },
      executionState: "COMPLETED",
      error: null,
    };
  }

  return {
    error: {
      code: "TEST_INTERNET_CONNECTION_WRONG_SCENARIO",
      message: "test_internet_connection is not valid for this scenario.",
      failingCommand: "test_internet_connection",
    },
  };
}

// cannot_open_file

case "CheckFileOpenError": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "cannot_open_file") {
    return {
      error: {
        code: "CHECK_FILE_OPEN_ERROR_WRONG_SCENARIO",
        message: "check_file_open_error is only valid in cannot_open_file scenario.",
        failingCommand: "check_file_open_error",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      file_open_error_checked: true,
    },
    error: null,
  };
}

case "CheckFileAssociation": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "cannot_open_file") {
    return {
      error: {
        code: "CHECK_FILE_ASSOCIATION_WRONG_SCENARIO",
        message: "check_file_association is only valid in cannot_open_file scenario.",
        failingCommand: "check_file_association",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      file_association_checked: true,
    },
    error: null,
  };
}

case "RepairFileAssociation": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "cannot_open_file") {
    return {
      error: {
        code: "REPAIR_FILE_ASSOCIATION_WRONG_SCENARIO",
        message: "repair_file_association is only valid in cannot_open_file scenario.",
        failingCommand: "repair_file_association",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      file_association_repaired: true,
    },
    error: null,
  };
}

case "TestFileOpen": {
  const facts = state.scenarioFacts;

  if (!facts || facts.kind !== "cannot_open_file") {
    return {
      error: {
        code: "TEST_FILE_OPEN_WRONG_SCENARIO",
        message: "test_file_open is only valid in cannot_open_file scenario.",
        failingCommand: "test_file_open",
      },
    };
  }

  return {
    scenarioFacts: {
      ...facts,
      file_opens_successfully: true,
    },
    result: { totalScore: 0, mistakes: 0, completion: "PASS" },
    executionState: "COMPLETED",
    error: null,
  };
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
  // Safety tripwire: should be unreachable if ExecutionPlan union is exhaustive
  throw new Error(`Unsupported plan: ${(plan as any).kind}`);
}