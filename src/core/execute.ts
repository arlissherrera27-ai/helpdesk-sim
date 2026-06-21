import { ExecutionPlan, SimState, StatePatch, ScenarioFacts } from "./types";

// Executor: converts an authorized plan into a patch.
// No legitimacy decisions. No mutation here.
export function executePlan(state: SimState, plan: ExecutionPlan): StatePatch {
  switch (plan.kind) {
case "StartNewAttempt": {
  const nextNumber = (state.attempt?.number ?? 0) + 1;

  const facts: ScenarioFacts =
    state.scenario === "password_reset"
      ? {
          kind: "password_reset",
          identity_verified: false,
          code_sent: false,
          has_recovery_email: true,
          reset_done: false,
          password_updated: false,
          can_login_now: false,
          wrong_attempts: 0,
        }
      : state.scenario === "password_reset_recovery_email_never_arrives"
        ? {
            kind: "password_reset_recovery_email_never_arrives",
            identity_verified: false,
            code_sent: false,
            email_arrived: false,
            inbox_filter_checked: false,
            inbox_filter_enabled: true,
            reset_done: false,
            password_updated: false,
            can_login_now: false,
            wrong_attempts: 0,
          }
        : null;

  return {
    attempt: {
      id: crypto.randomUUID(),
      number: nextNumber,
    },
    executionState: "RUNNING",
    error: null,
    result: null,
    scenarioFacts: facts,
  };
}

case "SelectScenario": {
  const facts: ScenarioFacts =
    plan.scenario_id === "password_reset"
      ? {
          kind: "password_reset" as const,
          identity_verified: false,
          code_sent: false,
          has_recovery_email: true,
          reset_done: false,
          password_updated: false,
          can_login_now: false,
          wrong_attempts: 0,
        }
      : plan.scenario_id === "password_reset_recovery_email_never_arrives"
        ? {
            kind: "password_reset_recovery_email_never_arrives" as const,
            identity_verified: false,
            code_sent: false,
            email_arrived: false,
            inbox_filter_checked: false,
            inbox_filter_enabled: true,
            reset_done: false,
            password_updated: false,
            can_login_now: false,
            wrong_attempts: 0,
          }
        : null;

  return {
    scenario: plan.scenario_id,
    scenarioFacts: facts,
    attempt: null,
    error: null,
    result: null,
  };
}

    case "VerifyIdentity": {
      const facts = state.scenarioFacts;

      // Defensive check (decide() should block this)
      if (!facts || facts.kind !== "password_reset") {
        return {
          error: {
            code: "VERIFY_IDENTITY_WRONG_SCENARIO",
            message: "verify_identity is only valid in password_reset scenario.",
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
   
    case "SendResetCode": {
      const facts = state.scenarioFacts;

      if (!facts || facts.kind !== "password_reset") {
        return {
          error: {
            code: "SEND_RESET_CODE_WRONG_SCENARIO",
            message: "send_reset_code is only valid in password_reset scenario.",
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

    case "ConfirmReset": {
      const facts = state.scenarioFacts;

      if (!facts || facts.kind !== "password_reset") {
        return {
          error: {
            code: "CONFIRM_RESET_WRONG_SCENARIO",
            message: "confirm_reset is only valid in password_reset scenario.",
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

  if (!facts || facts.kind !== "password_reset") {
    return {
      error: {
        code: "SET_NEW_PASSWORD_WRONG_SCENARIO",
        message: "set_new_password is only valid in password_reset scenario.",
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
      facts.kind !== "password_reset_recovery_email_never_arrives"
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

    case "QuitAttemptToLobby": {
      return {
        executionState: "LOBBY",
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