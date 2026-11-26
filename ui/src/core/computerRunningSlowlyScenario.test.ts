import { handleInput } from "./engine";
import { parseCommand } from "./parse";
import {
  getScenarioProcedureCommands,
  getScenarioProcedureOutput,
  getScenarioPreviewMetadata,
  getScenarioPreviewSteps,
  getScenarioStartPrompt,
} from "./scenarioRegistry";
import { initialState } from "./state";
import type { SimMode, SimState } from "./types";
import { COMPUTER_RUNNING_SLOWLY_EDUCATIONAL_CONTENT } from "./computerRunningSlowlyEducationalContent";
import { runInvestigationValidation, runScenarioValidation } from "./scenarioValidation";

const scenarioId = "computer_running_slowly_memory_leak";
const selectCommand = "select computer running slowly memory leak";
const steps = [
  ["verify user", "verify_identity"],
  ["check computer speed", "test_performance"],
  ["reboot computer", "restart_workstation"],
  ["retest computer speed", "test_performance"],
  ["open this pc", "check_disk_space"],
  ["ctrl + shift + esc", "inspect_task_manager"],
  ["resmon.exe", "inspect_resource_monitor"],
  ["open kb-206", "review_application_support_information"],
  ["safely close application", "safely_close_application"],
  ["install company sync tool 2.4.2", "install_software_update"],
  ["verify company sync tool version", "check_software_version"],
  ["verify memory and disk activity", "verify_system_resource_utilization"],
  ["verify issue resolved", "test_performance"],
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function start(mode: SimMode): SimState {
  const selected = handleInput({ ...initialState(), mode }, selectCommand);
  assert(selected.decision.kind === "ALLOW", `Scenario selection denied in ${mode}.`);
  const started = handleInput(selected.state, "start");
  assert(started.decision.kind === "ALLOW", `Scenario start denied in ${mode}.`);
  return started.state;
}

function runGoldenPath(mode: SimMode): void {
  let state = start(mode);
  assertEqual(getScenarioProcedureCommands(scenarioId), steps.map(([, command]) => command), "Approved procedure order changed.");

  for (let index = 0; index < steps.length; index += 1) {
    const [input, command] = steps[index];
    const output = handleInput(state, input);
    assert(output.decision.kind === "ALLOW", `Procedure ${index + 1} was denied in ${mode}: ${input}`);
    assert(output.state.runLog.at(-1)?.command === command, `Procedure ${index + 1} executed the wrong command.`);
    assert(output.procedureResult, `Procedure ${index + 1} has no result presentation.`);

    for (const [section, content] of Object.entries(output.procedureResult.learnMore)) {
      assert(content?.trim(), `Procedure ${index + 1} is missing ${section}.`);
    }

    const outputLineIds = new Set(output.procedureResult.technicalLines?.map((line) => line.id) ?? []);
    for (const annotation of output.procedureResult.annotations) {
      assert(outputLineIds.has(annotation.targetLineId), `Procedure ${index + 1} has an orphaned annotation.`);
    }

    if (index < steps.length - 1) {
      assert(output.state.result === null, `Scenario completed before procedure ${index + 2}.`);
    }

    if (index === 0) {
      assert(!output.procedureResult.technicalOutput, "Identity verification must not fabricate technical output.");
    }
    if (index === 1) {
      const initialText = output.procedureResult.technicalOutput + output.procedureResult.systemResult;
      assert(!initialText.includes("Company Sync Tool"), "Initial reproduction revealed the affected application.");
      assert(!initialText.includes("memory leak"), "Initial reproduction revealed the root cause.");
      assert(!initialText.includes("pagefile"), "Initial reproduction revealed paging activity.");
      assert(!initialText.includes("2.4.2"), "Initial reproduction revealed the correction.");
    }
    if (index === 3) {
      assert(output.procedureResult.technicalOutput.includes("After 10 minutes of normal activity"), "Post-restart performance retest did not establish recurrence.");
      assert(output.state.scenarioFacts?.kind === scenarioId && output.state.scenarioFacts.symptoms_recurred, "Recurring symptoms were not recorded.");
    }
    if (index === 6) {
      assert(output.procedureResult.technicalOutput.includes("C:\\pagefile.sys"), "Resource Monitor output lost the Windows pagefile path.");
      assert(output.procedureResult.technicalOutput.includes("5,500 MB") && output.procedureResult.technicalOutput.includes("6,100 MB"), "Baseline memory-growth observations are missing.");
    }
    if (index === 7) {
      assert(output.procedureResult.technicalOutput.includes("KB-206"), "Application support information omitted KB-206.");
      assert(output.procedureResult.technicalOutput.includes("2.4.2"), "Approved corrected version is missing from support evidence.");
    }
    if (index === 9) {
      assert(output.state.scenarioFacts?.kind === scenarioId && output.state.scenarioFacts.sync_tool_version === "2.4.2", "The update did not set the corrected version.");
      assert(output.procedureResult.systemResult.includes("no workstation restart is required"), "The approved installer restart requirement changed.");
    }
    if (index === 10) {
      assert(output.state.scenarioFacts?.kind === scenarioId && output.state.scenarioFacts.sync_tool_running, "Updated application did not remain running after version verification.");
    }
    if (index === 11) {
      assert(output.state.result === null, "Technical verification prematurely completed the scenario.");
    }

    state = output.state;
  }

  assert(state.result?.completion === "PASS", `Golden Path did not pass in ${mode}.`);
  assertEqual(state.result.totalScore, 10, `Expected 10/10 in ${mode}.`);
  assert(state.assessmentIntegrity === "maintained", `Assessment integrity changed in ${mode}.`);
  assert(state.procedureHelpOpenedCount === 0 && state.procedureHelpUsedDuring.length === 0, `Unexpected assistance was recorded in ${mode}.`);
  assert(state.scenarioFacts?.kind === scenarioId && state.scenarioFacts.user_confirmation_received, "Final employee confirmation was not recorded.");
}

assertEqual(getScenarioProcedureCommands(scenarioId), [
  "verify_identity",
  "test_performance",
  "restart_workstation",
  "test_performance",
  "check_disk_space",
  "inspect_task_manager",
  "inspect_resource_monitor",
  "review_application_support_information",
  "safely_close_application",
  "install_software_update",
  "check_software_version",
  "verify_system_resource_utilization",
  "test_performance",
], "Scenario must contain exactly the 13 approved procedures.");
assertEqual(getScenarioPreviewSteps(scenarioId).length, 1, "Practice preview exposed the entire future procedure sequence.");
const previewMetadata = getScenarioPreviewMetadata(scenarioId);
assert(previewMetadata, "Scenario preview metadata is missing.");
const previewMetadataText = [
  previewMetadata.level,
  previewMetadata.estimatedTime,
  previewMetadata.description,
  ...previewMetadata.skillFocus,
  previewMetadata.scenarioContext,
  previewMetadata.successOutcome,
].join(" ");
assert(!/Company Sync Tool|CompanySync\.exe|memory leak|pagefile|2\.4\.2|Task Manager|Resource Monitor|Application Updates|KB-206/i.test(previewMetadataText), "Scenario preview metadata exposed future diagnostic tools or corrective actions.");
assert(!getScenarioStartPrompt(scenarioId).includes("Company Sync Tool"), "Incoming ticket revealed the affected application.");
assert(!getScenarioStartPrompt(scenarioId).includes("memory leak"), "Incoming ticket revealed the root cause.");
assert(!getScenarioStartPrompt(scenarioId).includes("pagefile"), "Incoming ticket revealed paging activity.");
assert(!getScenarioStartPrompt(scenarioId).includes("2.4.2"), "Incoming ticket revealed the corrective update.");
assert(getScenarioStartPrompt(scenarioId).includes("Subject: Computer Running Slowly"), "Incoming ticket omitted its subject.");
assert(getScenarioStartPrompt(scenarioId).includes("Employee: Jordan Taylor"), "Incoming ticket omitted the employee name.");
assert(getScenarioStartPrompt(scenarioId).includes("Workstation: WS-108"), "Incoming ticket omitted the workstation identifier.");

const aliasCases = [
  ["verify identity", "verify_identity"],
  ["verify user", "verify_identity"],
  ["confirm employee identity", "verify_identity"],
  ["check workstation performance", "test_performance"],
  ["check computer speed", "test_performance"],
  ["check computer performance", "test_performance"],
  ["retest computer speed", "test_performance"],
  ["restart computer", "restart_workstation"],
  ["restart workstation", "restart_workstation"],
  ["reboot computer", "restart_workstation"],
  ["reboot workstation", "restart_workstation"],
  ["open this pc", "check_disk_space"],
  ["check disk space", "check_disk_space"],
  ["check storage capacity", "check_disk_space"],
  ["check available storage", "check_disk_space"],
  ["inspect task manager", "inspect_task_manager"],
  ["open task manager", "inspect_task_manager"],
  ["check resource utilization", "inspect_task_manager"],
  ["check system resources", "inspect_task_manager"],
  ["review task manager", "inspect_task_manager"],
  ["ctrl + shift + esc", "inspect_task_manager"],
  ["inspect resource monitor", "inspect_resource_monitor"],
  ["open resource monitor", "inspect_resource_monitor"],
  ["check memory and disk activity", "inspect_resource_monitor"],
  ["review resource monitor", "inspect_resource_monitor"],
  ["resmon.exe", "inspect_resource_monitor"],
  ["resmon", "inspect_resource_monitor"],
  ["review application support information", "review_application_support_information"],
  ["check for known application issues", "review_application_support_information"],
  ["review company sync tool support information", "review_application_support_information"],
  ["open kb-206", "review_application_support_information"],
  ["review kb-206", "review_application_support_information"],
  ["check company sync tool known issues", "review_application_support_information"],
  ["safely close application", "safely_close_application"],
  ["close application", "safely_close_application"],
  ["close company sync tool", "safely_close_application"],
  ["exit company sync tool", "safely_close_application"],
  ["install approved application update", "install_software_update"],
  ["update application", "install_software_update"],
  ["update company sync tool", "install_software_update"],
  ["install company sync tool 2.4.2", "install_software_update"],
  ["verify updated application", "check_software_version"],
  ["verify company sync tool version", "check_software_version"],
  ["check updated application version", "check_software_version"],
  ["check application version", "check_software_version"],
  ["verify system resource utilization", "verify_system_resource_utilization"],
  ["recheck system resources", "verify_system_resource_utilization"],
  ["verify resource utilization", "verify_system_resource_utilization"],
  ["retest system resources", "verify_system_resource_utilization"],
  ["verify memory and disk activity", "verify_system_resource_utilization"],
  ["test workstation performance", "test_performance"],
  ["verify issue resolved", "test_performance"],
  ["confirm workstation performance", "test_performance"],
] as const;

for (const [input, kind] of aliasCases) {
  assertEqual(parseCommand(input).kind, kind, `Alias did not resolve: ${input}`);
}

const educationKeys = Object.keys(COMPUTER_RUNNING_SLOWLY_EDUCATIONAL_CONTENT)
  .map(Number)
  .sort((left, right) => left - right);
assertEqual(educationKeys, Array.from({ length: 13 }, (_, index) => index + 1), "Expected educational coverage for procedures 1-13.");
assertEqual(educationKeys.reduce((total, key) => total + Object.values(COMPUTER_RUNNING_SLOWLY_EDUCATIONAL_CONTENT[key].learnMore).filter((value) => value?.trim()).length, 0), 39, "Expected all 39 Learn More sections.");

for (let index = 0; index < steps.length; index += 1) {
  const command = steps[index][1];
  const presentation = getScenarioProcedureOutput(scenarioId, command, index);
  assert(presentation, `Missing procedure presentation at step ${index + 1}.`);
  const lineIds = new Set(presentation.technicalLines?.map((line) => line.id) ?? []);
  for (const annotation of presentation.annotations) {
    assert(lineIds.has(annotation.targetLineId), `Orphan annotation ${annotation.id} at step ${index + 1}.`);
  }
}

const initialStateBeforeIdentity = start("practice");
assert(handleInput(initialStateBeforeIdentity, "restart_workstation").decision.kind === "DENY", "Restart bypassed initial performance evidence.");
assert(handleInput(initialStateBeforeIdentity, "install_software_update").decision.kind === "DENY", "Update installation bypassed authorization and safe closure.");
assert(handleInput(initialStateBeforeIdentity, "check_software_version").decision.kind === "DENY", "Corrected version was accessible before installation.");
assert(handleInput(initialStateBeforeIdentity, "verify_system_resource_utilization").decision.kind === "DENY", "Technical verification bypassed the update and version verification.");

const afterIdentity = handleInput(initialStateBeforeIdentity, "verify_identity").state;
assert(handleInput(afterIdentity, "restart_workstation").decision.kind === "DENY", "Restart bypassed the initial performance check.");

function runThrough(mode: SimMode, count: number): SimState {
  let state = start(mode);
  for (const [input] of steps.slice(0, count)) {
    const output = handleInput(state, input);
    assert(output.decision.kind === "ALLOW", `Prerequisite setup was denied: ${input}`);
    state = output.state;
  }
  return state;
}

const beforeSupportReview = runThrough("practice", 7);
assert(handleInput(beforeSupportReview, "safely_close_application").decision.kind === "DENY", "Application closure bypassed the approved support information.");

const afterSupportBeforeClosure = runThrough("practice", 8);
assert(handleInput(afterSupportBeforeClosure, "install_software_update").decision.kind === "DENY", "Update installation bypassed safe application closure.");
assert(handleInput(afterSupportBeforeClosure, "check_software_version").decision.kind === "DENY", "Corrected version was verified before installation.");
assert(handleInput(afterSupportBeforeClosure, "verify_system_resource_utilization").decision.kind === "DENY", "Post-update resource verification bypassed installation and version checks.");

for (const mode of ["practice", "assessment", "investigation"] as const) {
  runGoldenPath(mode);
}

const practiceCombined = runScenarioValidation(scenarioId, selectCommand);
assert(practiceCombined.status === "PASS", "Practice Combined Test failed.");
assertEqual(practiceCombined.finalScore, 10, "Practice independent score changed.");
assertEqual(practiceCombined.steps.filter((step) => step.matched).length, practiceCombined.steps.length, "Negative/repeat checks did not all pass.");

const investigationValidation = runInvestigationValidation(scenarioId, selectCommand, "");
assert(investigationValidation.status === "PASS", "Investigation validation failed.");
assertEqual(investigationValidation.procedureCommandsPassed, 13, "Investigation did not complete 13 procedures.");
assertEqual(investigationValidation.passScore, 10, "Investigation pass score changed.");
assert(investigationValidation.failPathReached, "Investigation takeover/fail path was not reached by the validation harness.");
assertEqual(investigationValidation.repeatChecksPassed, investigationValidation.repeatChecks, "Investigation repeat checks failed.");