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
  ["unlock_user_account", "unlock_user_account"],
  ["test_user_login", "test_user_login"],
  ["check_account_status", "check_account_status"],
  ["review_account_lockout_events", "review_account_lockout_events"],
  ["check_windows_credential_manager", "check_windows_credential_manager"],
  ["remove_outdated_credential", "remove_outdated_credential"],
  ["unlock_user_account", "unlock_user_account"],
  ["test_user_login", "test_user_login"],
  ["test_affected_network_resource", "test_affected_network_resource"],
  ["confirm_user_resolution", "confirm_user_resolution"],
] as const;

const expectedSystemResults = [
  "The user's identity has been successfully verified.",
  "The reported Windows sign-in problem has been confirmed. Windows reports that the user's account is currently locked.",
  "Active Directory Users and Computers has been opened using the technician's authorized administrative account.",
  "The affected user's Active Directory account has been located.",
  "The user's Active Directory account is enabled but currently locked.",
  "The user's Active Directory account has been successfully unlocked.",
  "The user successfully signs in using their current domain password and gains access to the Windows desktop. During the subsequent verification period, the user reports another account lockout. The existing desktop session remains available.",
  "The user's Active Directory account has become locked again following the successful unlock and sign-in.",
  "The relevant Active Directory account lockout event has been located. The event identifies workstation WS-104 as the caller computer associated with the lockout.",
  "A saved Windows credential associated with the internal file server has been located in the affected user's profile.",
  "The outdated Windows credential associated with the internal file server has been removed from the affected user's profile.",
  "The user's Active Directory account has been successfully unlocked after removal of the outdated stored credential.",
  "The user successfully signs in using their current domain password. No additional account lockout is observed during the simulated verification period.",
  "The user successfully accesses the internal shared network drive using their current domain credentials. The account remains unlocked during verification.",
  "The user confirms that Windows sign-in and shared network drive access are functioning normally.",
] as const;

const expectedTechnicalMarkers = [
  ["Identity Verification: Successful", "User Status: Verified"],
  ["CORP\\amorgan", "account is currently locked out"],
  ["Active Directory Users and Computers", "Domain: corp.example", "Administrative connection established"],
  ["Name: Alex Morgan", "User Logon Name: amorgan", "Matching Objects: 1"],
  ["Account Enabled: Yes", "Account Locked: Yes", "Password Expired: No"],
  ["Previous Account State: Locked", "Current Account State: Unlocked", "Password Changed: No"],
  ["Interactive Sign-in: Successful", "Desktop Access: Available"],
  ["Account Locked: Yes", "Previous Unlock: Successful", "Current Lockout: Confirmed"],
  ["Event ID: 4740", "Account Name: amorgan", "Caller Computer Name: WS-104"],
  ["Network Address: fs-01.corp.example", "User Name: CORP\\amorgan", "Reconnect at Sign-in: Enabled"],
  ["Credential Removal: Successful", "Stored Credential: Not Present", "Network Drive Configuration: Unchanged"],
  ["Previous Account State: Locked", "Current Account State: Unlocked", "Password Changed: No"],
  ["Interactive Sign-in: Successful", "Additional Lockout Observed: No"],
  ["Mapped Drive: S:", "Network Path: \\\\fs-01.corp.example\\Shared", "Authentication: Successful"],
  ["It's working now", "new password", "shared files"],
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
  equal(Object.keys(ACTIVE_DIRECTORY_LOCKOUT_EDUCATIONAL_CONTENT).length, 15, "Expected education for all 15 procedures");

  let state = startScenario(mode);
  assert(state.scenarioFacts?.kind === scenarioId, "Expected Active Directory scenario facts");
  assert(state.scenarioFacts.account_locked && state.scenarioFacts.account_enabled, "Initial account state is incorrect");
  assert(!state.scenarioFacts.password_expired && state.scenarioFacts.password_valid, "Initial password state is incorrect");

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

    if (index === 6) {
      assert(!presentation.systemResult.includes("network drive"), "Procedure 7 prematurely disclosed the network drive root cause");
      assert(!presentation.systemResult.includes("credential"), "Procedure 7 prematurely disclosed stored credential evidence");
    }
    if (index === 8) {
      const callerAnnotation = presentation.annotations.find((annotation) => annotation.id === "adlock-p09-a6");
      assert(callerAnnotation?.targetLineId === "adlock-p09-caller", "Procedure 9 caller-computer annotation is attached incorrectly");
    }
    if (index === 9) {
      const credentialPathLine = presentation.technicalOutput.split("\n").find((line) => line.startsWith("Network Path:"));
      const credentialPath = credentialPathLine?.slice("Network Path: ".length) ?? "";
      let credentialLeadingBackslashes = 0;
      while (credentialPath[credentialLeadingBackslashes] === "\\") credentialLeadingBackslashes += 1;
      assert(credentialLeadingBackslashes === 2, "Procedure 10 UNC path does not contain exactly two leading backslashes");
      const credentialSeparator = credentialPath.indexOf("\\", credentialLeadingBackslashes);
      assert(credentialSeparator >= 0 && credentialPath.slice(credentialSeparator, credentialSeparator + 2) === "\\S", "Procedure 10 UNC path does not contain exactly one separator before the share");
      const credentialEvidence = getScenarioProcedureEvidence(scenarioId, command, index);
      assert(credentialEvidence?.text.includes("predates today's domain password change"), "Procedure 10 missing user-provided credential-age evidence");
      assert(presentation.technicalOutput.includes("created before today's domain password change"), "Procedure 10 missing user-provided credential age evidence");
    }
    if (index === 13) {
      const resourcePathLine = presentation.technicalOutput.split("\n").find((line) => line.startsWith("Network Path:"));
      const resourcePath = resourcePathLine?.slice("Network Path: ".length) ?? "";
      let resourceLeadingBackslashes = 0;
      while (resourcePath[resourceLeadingBackslashes] === "\\") resourceLeadingBackslashes += 1;
      assert(resourceLeadingBackslashes === 2, "Procedure 14 UNC path does not contain exactly two leading backslashes");
      const resourceSeparator = resourcePath.indexOf("\\", resourceLeadingBackslashes);
      assert(resourceSeparator >= 0 && resourcePath.slice(resourceSeparator, resourceSeparator + 2) === "\\S", "Procedure 14 UNC path does not contain exactly one separator before the share");
      const networkEvidence = getScenarioProcedureEvidence(scenarioId, command, index);
      assert(networkEvidence?.text.includes("fs-01.corp.example"), "Procedure 14 evidence lost the file server hostname");
      assert(networkEvidence?.text.includes("\\Shared"), "Procedure 14 evidence is missing one server/share separator");
    }

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
      assert(output.state.executionState === "RUNNING", `Scenario exited before procedure 15 in ${mode}`);
      assert(output.state.result === null, `Scenario completed before procedure 15 in ${mode}`);
      assertDeniedWithoutProgress(output.state, input);
    }

    if (index === 5) {
      const facts = getActiveDirectoryFacts(output.state);
      assert(facts.account_unlocked && !facts.account_locked, "First unlock did not clear the lockout");
      assert(facts.password_valid && !facts.password_expired, "Unlock changed password state");
      assert(output.state.result === null, "First unlock completed the scenario prematurely");
    }
    if (index === 6) {
      const facts = getActiveDirectoryFacts(output.state);
      assert(facts.user_login_succeeded && facts.recurring_lockout_triggered && facts.account_locked, "First login did not trigger the recurring lockout");
      assert(output.state.result === null, "First login completed the scenario prematurely");
    }
    if (index === 7) {
      assert(getActiveDirectoryFacts(output.state).recurring_lockout_confirmed, "Recurring lockout was not confirmed");
    }
    if (index === 8) {
      const facts = getActiveDirectoryFacts(output.state);
      assert(facts.lockout_event_reviewed && facts.caller_workstation_identified, "Event 4740 or WS-104 was not recorded");
      assert(!facts.outdated_credential_identified, "Credential root cause was exposed before procedure 10");
    }
    if (index === 9) {
      assert(getActiveDirectoryFacts(output.state).outdated_credential_identified, "Outdated credential was not identified");
    }
    if (index === 10) {
      const facts = getActiveDirectoryFacts(output.state);
      assert(facts.outdated_credential_removed && facts.recurring_authentication_stopped, "Credential removal did not stop recurring authentication");
      assert(!facts.outdated_credential_present && facts.account_locked, "Credential removal unlocked the account or left the credential present");
      assert(output.state.result === null, "Credential removal completed the scenario prematurely");
    }
    if (index === 11) {
      const facts = getActiveDirectoryFacts(output.state);
      assert(facts.second_account_unlock_completed && !facts.account_locked, "Second unlock did not complete");
      assert(output.state.result === null, "Second unlock completed the scenario prematurely");
    }
    if (index === 12) {
      assert(getActiveDirectoryFacts(output.state).final_login_succeeded, "Final login verification was not recorded");
      assert(output.state.result === null, "Final login completed the scenario prematurely");
    }
    if (index === 13) {
      assert(getActiveDirectoryFacts(output.state).affected_network_resource_verified, "Affected network resource was not verified");
      assert(output.state.result === null, "Network resource verification completed the scenario prematurely");
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
