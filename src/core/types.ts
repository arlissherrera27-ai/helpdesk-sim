// --- Core State & Authority Types ---
// This file defines WHAT EXISTS in the system.
// No logic. No behavior. No mutation.

export type ExecutionState =
  | "LOBBY"
  | "RUNNING"
  | "COMPLETED";

// Commands are labeled intents, not behavior
export type Command =
  | { kind: "start"; readOnly: false }
  | { kind: "restart"; readOnly: false }
  | { kind: "quit"; readOnly: false }
  | { kind: "debug"; readOnly: true }
  | { kind: "select"; readOnly: false; scenario_id: string }
  | { kind: "verify_identity"; readOnly: false }
  | { kind: "send_reset_code"; readOnly: false }
  | { kind: "confirm_reset"; readOnly: false }
  | { kind: "set_new_password"; readOnly: false }
  | { kind: "test_sign_in"; readOnly: false }
  | { kind: "check_inbox_filters"; readOnly: false }
  | { kind: "disable_inbox_filter"; readOnly: false }
  | { kind: "resend_reset_code"; readOnly: false }
  | { kind: "help"; readOnly: true }
  | { kind: "status"; readOnly: true }
  | { kind: "unknown"; rawInput: string };

// Decisions are authoritative judgments
export type Decision =
  | { kind: "ALLOW"; plan: ExecutionPlan }
  | { kind: "DENY"; reason: string };

// Execution plans describe WHAT should change, not whether it should
export type ExecutionPlan =
  | { kind: "StartNewAttempt" }
  | { kind: "SelectScenario"; scenario_id: string }
  | { kind: "ReadOnly"; view: "HELP" | "STATUS" | "DEBUG" }
  | { kind: "QuitAttemptToLobby" }
  | { kind: "VerifyIdentity" }
  | { kind: "SendResetCode" }
  | { kind: "ConfirmReset" }
  | { kind: "SetNewPassword" }
  | { kind: "TestSignIn" }
  | { kind: "CheckInboxFilters" }
  | { kind: "DisableInboxFilter" }
  | { kind: "ResendResetCode" };

// Attempts are isolated runs
export type Attempt = {
  id: string;
  number: number;
};

// Scenarios define the rule world
export type Scenario = {
  id: string;
  version: number;
};

// --- Scenario Hidden Facts (Private State) ---
// These are scenario-private truths used later for gating/rules.
// No logic here. Just shape.
export type PasswordResetFacts = {
  kind: "password_reset";
  identity_verified: boolean;
  code_sent: boolean;
  has_recovery_email: boolean;
  reset_done: boolean;
  password_updated: boolean;
  can_login_now: boolean;
  wrong_attempts: number;
};
export type PasswordResetRecoveryEmailNeverArrivesFacts = {
  kind: "password_reset_recovery_email_never_arrives";
  identity_verified: boolean;
  code_sent: boolean;
  email_arrived: boolean;
  inbox_filter_checked: boolean;
  inbox_filter_enabled: boolean;
  reset_done: boolean;
  password_updated: boolean;
  can_login_now: boolean;
  wrong_attempts: number;
};

export type ScenarioFacts =
  | PasswordResetFacts
  | PasswordResetRecoveryEmailNeverArrivesFacts
  | null;

// Errors are sticky within an attempt
export type SimError = {
  code: string;
  message: string;
  failingCommand?: string;
};

// Results are final per attempt
export type ScoreSummary = {
  totalScore: number;          
  mistakes: number;           
  completion: "PASS" | "FAIL";
};

export type Result = ScoreSummary | null;

export type LogEvent = {
  command: string;
  decision: "ALLOW" | "DENY";
  plan: ExecutionPlan["kind"] | null;
  outcome: "denied" | "error" | "success";
  timestamp: string;
};  

// This is the single source of truth
export type SimState = {
  scenario: string | null;
  scenarioFacts: ScenarioFacts;
  attempt: Attempt | null;
  executionState: ExecutionState;
  error: SimError | null;
  result: Result;
  runLog: LogEvent[];
};

// StatePatch describes INTENTIONAL state changes.
// It is applied by the Update layer only.
export type StatePatch = {
  executionState?: ExecutionState;
  error?: SimError | null;
  result?: Result;
  attempt?: Attempt | null;
  scenario?: string | null;
  scenarioFacts?: ScenarioFacts;
  newAttempt?: { number: number };
};
