import { ACTIVE_NETWORK_CONNECTIONS_EDUCATIONAL_CONTENT } from "./activeNetworkConnectionsEducationalContent";
import { handleInput } from "./engine";
import {
  getScenarioPreviewSteps,
  getScenarioStartPrompt,
  getScenarioProcedureCommands,
  getScenarioProcedureOutput,
} from "./scenarioRegistry";
import { runScenarioValidation } from "./scenarioValidation";
import { initialState } from "./state";
import type { SimMode, SimState } from "./types";

const scenarioId = "active_network_connections_application_port_conflict";
const selectCommand = "select active network connections application port conflict";
const steps = [
  ["verify_identity", "verify_identity"],
  ["open_company_reporting_tool", "open_company_reporting_tool"],
  ["open_reporting_config.ini", "open_reporting_config_ini"],
  ["netstat -ano | findstr :8080", "inspect_tcp_8080_listener"],
  ['tasklist /FI "PID eq 4820"', "identify_report_preview_process"],
  ["check_report_preview_tool", "check_report_preview_tool"],
  ["close_report_preview_tool", "close_report_preview_tool"],
  ["netstat -ano | findstr :8080", "inspect_tcp_8080_listener"],
  ["open_company_reporting_tool", "open_company_reporting_tool"],
  ["netstat -ano | findstr :8080", "inspect_tcp_8080_listener"],
  ['tasklist /FI "PID eq 6132"', "identify_company_reporting_process"],
  ["test_company_reporting_tool", "test_company_reporting_tool"],
  ["confirm_user_resolution", "confirm_user_resolution"],
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const procedureNumbers = Object.keys(
  ACTIVE_NETWORK_CONNECTIONS_EDUCATIONAL_CONTENT
)
  .map(Number)
  .sort((left, right) => left - right);

assert(
  JSON.stringify(procedureNumbers) === JSON.stringify(Array.from({ length: 13 }, (_, index) => index + 1)),
  "Educational content must cover all 13 approved procedures.",
);

for (const [procedureNumber, education] of Object.entries(
  ACTIVE_NETWORK_CONNECTIONS_EDUCATIONAL_CONTENT
)) {
  assert(
    education.learnMore.howToExecute?.trim(),
    `Procedure ${procedureNumber} is missing How to Execute content.`,
  );
  assert(
    education.learnMore.whatItDoesAndHow?.trim(),
    `Procedure ${procedureNumber} is missing What It Does and How content.`,
  );
  assert(
    education.learnMore.whyThisMatters?.trim(),
    `Procedure ${procedureNumber} is missing Why This Matters content.`,
  );

  const lineIds = new Set(Object.values(education.technicalLineIds));
  for (const annotation of education.annotations) {
    assert(
      lineIds.has(annotation.targetLineId),
      `Procedure ${procedureNumber} annotation ${annotation.id} has no technical line target.`,
    );
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

assertEqual(getScenarioProcedureCommands(scenarioId), steps.map(([, command]) => command), "Registered procedure order changed.");
assertEqual(steps.length, 13, "Approved procedure count changed.");
const startPrompt = getScenarioStartPrompt(scenarioId);
assert(!startPrompt.includes("8080"), "Incoming ticket leaked the required port.");
assert(!startPrompt.includes("ReportPreview.exe"), "Incoming ticket leaked the conflicting executable.");
assert(!startPrompt.includes("4820"), "Incoming ticket leaked a process ID.");
assertEqual(getScenarioPreviewSteps(scenarioId).length, 1, "Preview revealed the full troubleshooting procedure sequence.");

function start(mode: SimMode): SimState {
  const selected = handleInput({ ...initialState(), mode }, selectCommand);
  assert(selected.decision.kind === "ALLOW", `Scenario selection denied in ${mode}.`);
  const started = handleInput(selected.state, "start");
  assert(started.decision.kind === "ALLOW", `Scenario start denied in ${mode}.`);
  return started.state;
}

function runGoldenPath(mode: SimMode): void {
  let state = start(mode);
  assert(state.investigationTicket !== null || mode !== "investigation", "Investigation ticket was not created.");

  if (mode === "investigation") {
    const related = handleInput(state, "check_network_status");
    assert(related.decision.kind === "RELATED", "Investigation network check did not use the related-action path.");
    assert(!related.message.includes("8080"), "Investigation check leaked the undiscovered port.");
    state = related.state;
  }

  for (let index = 0; index < steps.length; index += 1) {
    const [input, command] = steps[index];
    const output = handleInput(state, input);
    assert(output.decision.kind === "ALLOW", `Procedure ${index + 1} was denied: ${input}`);
    assert(output.state.runLog.at(-1)?.command === command, `Procedure ${index + 1} executed the wrong command.`);
    assert(output.procedureResult, `Procedure ${index + 1} has no presentation.`);
    for (const [section, content] of Object.entries(output.procedureResult.learnMore)) {
      assert(content?.trim(), `Procedure ${index + 1} is missing ${section} presentation content.`);
    }
    const outputLineIds = new Set(output.procedureResult.technicalLines?.map((line) => line.id) ?? []);
    for (const annotation of output.procedureResult.annotations) {
      assert(outputLineIds.has(annotation.targetLineId), `Procedure ${index + 1} annotation target is not rendered.`);
    }
    if (output.procedureResult.technicalOutput.length === 0) {
      assert(!output.procedureResult.technicalLines, `Procedure ${index + 1} fabricated technical output lines.`);
    } else {
      assertEqual(
        output.procedureResult.technicalLines?.map((line) => line.text).join("\n"),
        output.procedureResult.technicalOutput,
        `Procedure ${index + 1} structured output changed the approved technical text.`,
      );
    }

    const resultText = `${output.procedureResult.systemResult}\n${output.procedureResult.technicalOutput}`;
    if (index === 1) {
      assert(!resultText.includes("8080"), "Procedure 2 leaked the configured port.");
      assert(!resultText.includes("ReportPreview.exe"), "Procedure 2 leaked the conflicting executable.");
      assert(!resultText.includes("4820"), "Procedure 2 leaked a process ID.");
    }
    if (index === 3) {
      assert(!resultText.includes("ReportPreview.exe"), "Procedure 4 leaked the owning executable.");
      assert(output.procedureResult.technicalOutput.startsWith("C:\\>netstat -ano | findstr :8080\n  TCP"), "Procedure 4 output is not filtered netstat output.");
      assert(!output.procedureResult.technicalOutput.includes("Proto"), "Filtered netstat output must not add column headings.");
    }
    if (index === 6) {
      assert(!resultText.includes("8080"), "Procedure 7 claimed listener removal before verification.");
      assert(!resultText.toLowerCase().includes("released"), "Procedure 7 claimed the endpoint was released.");
    }
    if (index === 8) {
      assert(!resultText.includes("ReportingTool.exe"), "Procedure 9 leaked process ownership.");
      assert(!resultText.includes("resolved"), "Procedure 9 announced resolution before verification.");
    }
    if (index === 9) {
      assert(!resultText.includes("ReportingTool.exe"), "Procedure 10 leaked the executable name.");
    }
    if (index < steps.length - 1) {
      assert(output.state.result === null, `Scenario completed before procedure ${index + 2}.`);
    }

    state = output.state;
  }

  assert(state.result?.completion === "PASS", `Golden Path did not pass in ${mode}.`);
  assertEqual(state.result.totalScore, 10, `Golden Path score changed in ${mode}.`);
  assert(state.scenarioFacts?.kind === scenarioId && state.scenarioFacts.user_resolution_confirmed, "Final employee confirmation was not recorded.");
}

const preIdentityState = start("practice");
assert(handleInput(preIdentityState, "open_company_reporting_tool").decision.kind === "DENY", "Application launch was allowed before identity verification.");
const gatedState = handleInput(preIdentityState, "verify_identity").state;
assert(handleInput(gatedState, 'tasklist /FI "PID eq 4820"').decision.kind === "DENY", "Undiscovered process ID bypassed the required sequence.");
assert(handleInput(gatedState, 'tasklist /FI "PID eq 6132"').decision.kind === "DENY", "Undiscovered reporting process ID bypassed the required sequence.");
assert(handleInput(gatedState, "netstat -ano | findstr :8080").decision.kind === "DENY", "Listener inspection was allowed before configuration discovery.");
assert(handleInput(gatedState, "confirm_user_resolution").decision.kind === "DENY", "User resolution was allowed before technical verification.");

let beforeSafetyCheck = start("practice");
for (const [input] of steps.slice(0, 5)) {
  beforeSafetyCheck = handleInput(beforeSafetyCheck, input).state;
}
assert(
  handleInput(beforeSafetyCheck, "close_report_preview_tool").decision.kind === "DENY",
  "Corrective action was allowed before checking operational safety and authorization.",
);

for (const mode of ["practice", "assessment", "investigation"] as const) {
  runGoldenPath(mode);
}

const combinedTest = runScenarioValidation(scenarioId, selectCommand);
assert(combinedTest.status === "PASS", "Developer Combined Test failed for this scenario.");
assertEqual(combinedTest.matchedSteps, combinedTest.totalSteps, "Developer Combined Test omitted ordered/repeat checks.");
const combinedProcedures = combinedTest.transcript.filter((entry) => entry.phase === "correct");
assertEqual(combinedProcedures.length, 13, "Developer Combined Test transcript omitted procedures.");
assert(combinedProcedures.every((entry) => entry.procedureResult), "Developer Combined Test did not expand all procedure presentations.");

for (const [command, index] of [
  ["open_company_reporting_tool", 1],
  ["open_reporting_config_ini", 2],
  ["inspect_tcp_8080_listener", 3],
  ["identify_report_preview_process", 4],
  ["check_report_preview_tool", 5],
  ["close_report_preview_tool", 6],
  ["inspect_tcp_8080_listener", 7],
  ["open_company_reporting_tool", 8],
  ["inspect_tcp_8080_listener", 9],
  ["identify_company_reporting_process", 10],
  ["test_company_reporting_tool", 11],
  ["confirm_user_resolution", 12],
] as const) {
  assert(
    getScenarioProcedureOutput(scenarioId, command, index),
    `Procedure ${index + 1} is missing occurrence-specific presentation.`,
  );
}

for (const index of [0, 5, 6, 12]) {
  const command = steps[index][1];
  const presentation = getScenarioProcedureOutput(scenarioId, command, index);
  assert(presentation?.technicalOutput === "", `Procedure ${index + 1} must have no technical output.`);
  assert(!presentation?.technicalLines, `Procedure ${index + 1} must not fabricate technical output lines.`);
  assert(presentation?.learnMore.howToExecute, `Procedure ${index + 1} must retain educational content without technical output.`);
}