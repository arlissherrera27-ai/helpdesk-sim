import { handleInput } from "./engine";
import {
  getScenarioProcedureCommands,
  getScenarioProcedureEvidence,
  getScenarioProcedureOutput,
  getSuccessfulScenarioProcedureCount,
} from "./scenarioRegistry";
import { initialState } from "./state";
import { ACTIVE_DIRECTORY_LOCKOUT_EDUCATIONAL_CONTENT } from "./activeDirectoryLockoutEducationalContent";
import type { SimMode, SimState } from "./types";

const scenarioId = "active_directory_locked_employee_account";

const steps = [
  ["verify_identity", "verify_identity"],
  ["check_login_error", "check_login_error"],
  ["open_active_directory", "open_active_directory"],
  ["locate_user_account", "locate_user_account"],
  ["check_account_status", "check_account_status"],
  ["check_account_properties", "check_account_properties"],
  ["check_lockout_policy", "check_lockout_policy"],
  ["review_lockout_details", "review_lockout_details"],
  ["unlock_user_account", "unlock_user_account"],
  ["verify_account_status", "verify_account_status"],
  ["test_user_login", "test_user_login"],
  ["confirm_user_resolution", "confirm_user_resolution"],
] as const;

const expectedSystemResults = [
  "Employee identity verified successfully using the organization's approved process.",
  "The employee's Windows sign-in attempt displays an account-lockout message.",
  "Active Directory Users and Computers opened successfully.",
  "The employee's domain user account was located.",
  "The account is enabled, but its lockout status is active.",
  "Additional account properties were retrieved successfully.",
  "The applicable account-lockout policy was retrieved.",
  "Authorized security-event records show repeated unsuccessful authentication attempts preceding the account lockout.",
  "The authorized account-unlock operation completed successfully.",
  "The account no longer reports an active lockout.",
  "The employee successfully signs in to the Windows workstation.",
  "The employee confirms that the original account-access problem is resolved.",
] as const;

const expectedTechnicalMarkers = [
  ["Identity Verification: Successful", "Employee: Jordan Lee", "User Status: Verified"],
  ["Workstation: WS-014", "Sign-in Account: CORP\\jlee", "Sign-in Result: Unsuccessful"],
  ["Console: Active Directory Users and Computers", "Connected Domain: corp.example.com"],
  ["Display Name: Jordan Lee", "Logon Name: jlee", "Search Result: 1 matching account"],
  ["Account Enabled: Yes", "Account Locked Out: Yes", "Password Expired: No", "Account Expired: No"],
  ["Account Type: Domain User", "Password Last Set: 2026-11-10 09:15", "Password Expired: No"],
  ["Account Lockout Threshold: 5 invalid attempts", "Account Lockout Duration: 30 minutes", "Policy Status: Enabled"],
  ["Failed Sign-in Events: 5", "Failure Category: Invalid credentials", "Lockout Event ID: 4740"],
  ["Action: Unlock Account", "Authorization: Delegated Help Desk Permission", "Operation Result: Successful"],
  ["Account Enabled: Yes", "Account Locked Out: No", "Password Expired: No"],
  ["Workstation: WS-014", "Authentication Result: Successful", "Windows Session: Started"],
  ["Reported Issue: Account locked during Windows sign-in", "User Confirmation: Issue resolved", "Scenario Status: Resolved"],
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal(actual: unknown, expected: unknown, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function getActiveDirectoryFacts(state: SimState) {
  const facts = state.scenarioFacts;
  assert(facts?.kind === scenarioId, "Expected Active Directory scenario facts");
  return facts;
}

function startScenario(mode: SimMode): SimState {
  const selected = handleInput({ ...initialState(), mode }, "select active directory locked employee account");
  assert(selected.decision.kind === "ALLOW", `Scenario selection denied in ${mode}`);
  const started = handleInput(selected.state, "start");
  assert(started.decision.kind === "ALLOW", `Scenario start denied in ${mode}`);
  return started.state;
}

function assertDeniedWithoutProgress(state: SimState, input: string): void {
  const facts = JSON.stringify(state.scenarioFacts);
  const evidence = JSON.stringify(state.evidence);
  const progress = getSuccessfulScenarioProcedureCount(state.scenario, state.runLog);
  const output = handleInput(state, input);
  assert(output.decision.kind === "DENY", `${input} was not denied`);
  equal(output.state.scenarioFacts, state.scenarioFacts, `${input} changed scenario facts`);
  equal(output.state.evidence, state.evidence, `${input} changed evidence`);
  equal(
    getSuccessfulScenarioProcedureCount(output.state.scenario, output.state.runLog),
    progress,
    `${input} advanced procedure progress`
  );
  equal(JSON.stringify(state.scenarioFacts), facts, "Input facts were mutated");
  equal(JSON.stringify(state.evidence), evidence, "Input evidence was mutated");
}

function runActiveDirectoryScenario(mode: SimMode): void {
  equal(
    getScenarioProcedureCommands(scenarioId),
    steps.map(([, command]) => command),
    "Registered Active Directory procedure order changed"
  );
  equal(Object.keys(ACTIVE_DIRECTORY_LOCKOUT_EDUCATIONAL_CONTENT).length, 12, "Expected education for all 12 procedures");

  let state = startScenario(mode);
  assert(state.scenarioFacts?.kind === scenarioId, "Expected Active Directory scenario facts");
  assert(state.scenarioFacts.account_locked && state.scenarioFacts.account_enabled, "Initial account state is incorrect");
  assert(!state.scenarioFacts.password_expired && !state.scenarioFacts.account_expired, "Initial expiration state is incorrect");

  assertDeniedWithoutProgress(state, "unlock_user_account");
  assertDeniedWithoutProgress(state, "confirm_unlock");
  assertDeniedWithoutProgress(state, "test_user_login");

  for (let index = 0; index < steps.length; index += 1) {
    const [input, command] = steps[index];
    const previousEvidence = state.evidence;
    const output = handleInput(state, input);

    assert(output.decision.kind === "ALLOW", `Procedure ${index + 1} was denied in ${mode}: ${input}`);
    const event = output.state.runLog[output.state.runLog.length - 1];
    assert(
      event?.decision === "ALLOW" && event.outcome === "success" && event.command === command,
      `Procedure ${index + 1} did not execute successfully in ${mode}`
    );

    const presentation = getScenarioProcedureOutput(scenarioId, command, index);
    assert(presentation, `Missing structured presentation at procedure ${index + 1}`);
    equal(presentation.systemResult, expectedSystemResults[index], `System Result changed at procedure ${index + 1}`);
    for (const marker of expectedTechnicalMarkers[index]) {
      assert(presentation.technicalOutput.includes(marker), `Technical Output at procedure ${index + 1} is missing: ${marker}`);
    }
    assert(presentation.annotations.length > 0, `Missing annotations at procedure ${index + 1}`);
    assert(presentation.learnMore.howToExecute?.trim(), `Missing How to Execute at procedure ${index + 1}`);
    assert(presentation.learnMore.whatItDoesAndHow?.trim(), `Missing What It Does and How at procedure ${index + 1}`);
    assert(presentation.learnMore.whyThisMatters?.trim(), `Missing Why This Matters at procedure ${index + 1}`);

    const lineIds = new Set(presentation.technicalLines?.map((line) => line.id) ?? []);
    for (const annotation of presentation.annotations) {
      assert(lineIds.has(annotation.targetLineId), `Annotation ${annotation.id} has no displayed line`);
    }
    equal(
      presentation.technicalLines?.map((line) => line.text).join("\n"),
      presentation.technicalOutput,
      `Technical line presentation changed at procedure ${index + 1}`
    );

    const discovered = getScenarioProcedureEvidence(scenarioId, command, index);
    assert(discovered, `Missing approved evidence at procedure ${index + 1}`);
    assert(output.state.evidence.some((item) => item.id === discovered.id), `Evidence missing at procedure ${index + 1}`);
    equal(output.state.evidence.length, previousEvidence.length + 1, `Procedure ${index + 1} did not add exactly one evidence item`);

    const allowedEvidenceIds = new Set(
      steps
        .slice(0, index + 1)
        .map(([, stepCommand], stepIndex) => getScenarioProcedureEvidence(scenarioId, stepCommand, stepIndex)?.id)
        .filter((id): id is string => Boolean(id))
    );
    assert(
      output.state.evidence.every((item) => allowedEvidenceIds.has(item.id)),
      `Future evidence was exposed by procedure ${index + 1}`
    );

    equal(
      getSuccessfulScenarioProcedureCount(output.state.scenario, output.state.runLog),
      index + 1,
      `Procedure ${index + 1} did not advance exactly once`
    );

    if (index < steps.length - 1) {
      assert(output.state.executionState === "RUNNING", `Scenario exited before procedure 12 in ${mode}`);
      assert(output.state.result === null, `Scenario completed before procedure 12 in ${mode}`);
      assertDeniedWithoutProgress(output.state, input);
    }

    if (index === 7) {
      assert(output.state.evidence.some((item) => item.id === "ad-lockout-events"), "Lockout event evidence was not recorded at procedure 8");
    }
    if (index < 7) {
      assert(!output.state.evidence.some((item) => item.id === "ad-lockout-events"), `Lockout-event evidence was exposed before procedure 8 in ${mode}`);
    }
    if (index === 8) {
      const facts = getActiveDirectoryFacts(output.state);
      assert(facts.account_unlocked, "Unlock operation was not recorded");
      assert(!facts.account_locked, "Unlock did not clear the lockout state");
      assert(facts.account_enabled, "Unlock changed the enabled state");
      assert(!facts.password_expired, "Unlock changed password expiration state");
      assert(output.state.result === null, "Unlock completed the scenario prematurely");
    }
    if (index === 10) {
      assert(getActiveDirectoryFacts(output.state).user_login_succeeded, "Employee sign-in was not recorded");
      assert(output.state.result === null, "Sign-in test completed before employee confirmation");
    }

    state = output.state;
  }

  assert(state.result?.completion === "PASS", `Final confirmation did not PASS in ${mode}`);
  assert(state.executionState === "SCORECARD", `Final confirmation did not reach SCORECARD in ${mode}`);
  assert(getActiveDirectoryFacts(state).user_resolution_confirmed, "Final user confirmation fact was not recorded");
  assertDeniedWithoutProgress(state, "confirm_user_resolution");
}

for (const mode of ["practice", "assessment", "investigation"] as const) {
  runActiveDirectoryScenario(mode);
}

let legacyState: SimState = { ...initialState(), mode: "practice" };
const legacySelection = handleInput(legacyState, "select account lockout");
assert(legacySelection.decision.kind === "ALLOW", "Existing account_lockout scenario selection changed");
legacyState = handleInput(legacySelection.state, "start").state;
for (const input of ["verify_identity", "request_unlock", "confirm_unlock"]) {
  const output = handleInput(legacyState, input);
  assert(output.decision.kind === "ALLOW", `Existing account_lockout command was denied: ${input}`);
  legacyState = output.state;
}
assert(legacyState.result?.completion === "PASS", "Existing account_lockout scenario no longer completes through confirm_unlock");
