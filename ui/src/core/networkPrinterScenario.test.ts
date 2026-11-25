import { handleInput } from "./engine";
import { getScenarioProcedureCommands, getScenarioProcedureOutput, getSuccessfulScenarioProcedureCount } from "./scenarioRegistry";
import { initialState } from "./state";
import type { SimMode, SimState } from "./types";
import { NETWORK_PRINTER_EDUCATIONAL_CONTENT } from "./networkPrinterEducationalContent";
import { getPreviewStepLabel } from "./scenarioTree";

const scenarioId = "network_printer_not_printing";

const steps = [
  ["verify_identity", "verify_identity"],
  ["test_printing", "test_printing"],
  ["check_printer_physical_status", "check_printer_physical_status"],
  ["check_printer_status", "check_printer_status"],
  ["check_print_queue", "check_print_queue"],
  ["check_printer_network_configuration", "check_printer_network_configuration"],
  ["check_printer_port", "check_printer_port"],
  ["open_command_prompt", "open_command_prompt"],
  ["ping 192.168.1.60", "ping_printer"],
  ["correct_printer_port_configuration", "correct_printer_port_configuration"],
  ["check_print_queue", "check_print_queue"],
  ["print_test_page", "print_test_page"],
  ["confirm_user_resolution", "confirm_user_resolution"],
] as const;

const evidence = [
  null,
  "Print request submitted; no physical output produced.",
  "The printer is powered on with Ethernet connected and an active network link.",
  "Windows reports Office Printer as offline.",
  "The submitted document remains queued with Error - Printing status.",
  "The printer reports IPv4 address 192.168.1.60, subnet mask 255.255.255.0, and default gateway 192.168.1.1.",
  "Windows printer port is configured for 192.168.1.50, but the printer reports 192.168.1.60.",
  null,
  "192.168.1.60 responded to all four ICMP Echo Requests with 0% packet loss.",
  "The Windows printer port was corrected from 192.168.1.50 to match the printer's actual address 192.168.1.60.",
  "The previously queued document printed successfully and no pending print jobs remain.",
  "The Windows printer test page printed successfully.",
  "The user confirmed that the document printed and the original issue is resolved.",
] as const;

const expectedSystemResults = [
  "The user's identity has been successfully verified.",
  "A document was submitted to the Office Printer. The document did not print.",
  "The printer is powered on. The Ethernet cable is securely connected, and the network link indicator is active.",
  "Windows reports that the Office Printer is offline.",
  "The submitted document remains in the print queue and has not printed.",
  "The printer's current network configuration has been retrieved.",
  "The Windows printer port is configured with an IP address that does not match the printer's current IP address.",
  "Windows Command Prompt has been opened.",
  "The printer responds successfully to the connectivity test.",
  "The Windows printer port has been updated to match the printer's actual IP address.",
  "The previously queued document has printed successfully. No pending print jobs remain.",
  "The Windows printer test page has printed successfully.",
  "The user confirms that documents are printing successfully.",
] as const;

const expectedTechnicalMarkers = [
  ["Identity Verification: Successful", "User Status: Verified"],
  ["Printer: Office Printer", "Print Request: Submitted", "Physical Print Output: Not produced"],
  ["Power: On", "Ethernet: Connected", "Network Link: Active"],
  ["Printer: Office Printer", "Status: Offline"],
  ["Status: Error - Printing", "Pending Jobs: 1"],
  ["IPv4 Address: 192.168.1.60", "Subnet Mask: 255.255.255.0", "Default Gateway: 192.168.1.1"],
  ["Configured IP Address: 192.168.1.50", "Actual Printer IP Address: 192.168.1.60", "Configuration Match: No"],
  ["Microsoft Windows [Version 10.0.26100.1]", "C:\\Users\\Technician>"],
  ["ping 192.168.1.60", "Reply from 192.168.1.60", "Lost = 0", "0% loss"],
  ["Previous IP Address: 192.168.1.50", "Updated IP Address: 192.168.1.60", "Configuration Match: Yes"],
  ["Pending Jobs: 0", "Physical Print Output: Confirmed"],
  ["Test Page: Printed Successfully"],
  ["User Response:", "My document printed. Thank you."],
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal(actual: unknown, expected: unknown, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function assertDeniedWithoutProgress(state: SimState, input: string): void {
  const beforeProgress = getSuccessfulScenarioProcedureCount(state.scenario, state.runLog);
  const beforeEvidence = state.evidence;
  const output = handleInput(state, input);
  assert(output.decision.kind === "DENY", `Expected ${input} to be denied`);
  equal(
    getSuccessfulScenarioProcedureCount(output.state.scenario, output.state.runLog),
    beforeProgress,
    `${input} unexpectedly advanced the scenario`
  );
  equal(output.state.evidence, beforeEvidence, `${input} unexpectedly changed evidence`);
}

function start(mode: SimMode): SimState {
  const state = { ...initialState(), mode };
  const selected = handleInput(state, "select network printer not printing");
  assert(selected.decision.kind === "ALLOW", `Selection denied in ${mode}`);
  const started = handleInput(selected.state, "start");
  assert(started.decision.kind === "ALLOW", `Start denied in ${mode}`);
  return started.state;
}

function runFull(mode: SimMode): void {
  const annotationCount = Object.values(NETWORK_PRINTER_EDUCATIONAL_CONTENT).reduce(
    (count, procedure) => count + procedure.annotations.length,
    0
  );
  equal(annotationCount, 35, "Printer annotation count changed");

  const lessonCount = Object.values(NETWORK_PRINTER_EDUCATIONAL_CONTENT).reduce(
    (count, procedure) =>
      count + Object.values(procedure.learnMore).filter((content) => content !== null && content.trim().length > 0).length,
    0
  );
  equal(lessonCount, 39, "Printer Learn More section count changed");

  const wrongOrderState = start("practice");
  assertDeniedWithoutProgress(wrongOrderState, "check_printer_status");

  let state = start(mode);
  equal(getScenarioProcedureCommands(scenarioId), steps.map(([, command]) => command), "Printer registry sequence changed");
  equal(steps.length, 13, "Printer procedure count changed");

  for (let index = 0; index < steps.length; index += 1) {
    const [input, command] = steps[index];
    const beforeProgress = getSuccessfulScenarioProcedureCount(state.scenario, state.runLog);
    const beforeEvidenceCount = state.evidence.length;
    const beforeEvidence = state.evidence;
    const output = handleInput(state, input);

    assert(output.decision.kind === "ALLOW", `Procedure ${index + 1} denied: ${input}`);
    const event = output.state.runLog[output.state.runLog.length - 1];
    assert(event?.decision === "ALLOW" && event.outcome === "success" && event.command === command, `Procedure ${index + 1} did not execute successfully`);

    const presentation = getScenarioProcedureOutput(scenarioId, command, index);
    assert(presentation, `Missing presentation at procedure ${index + 1}`);
    assert(presentation.learnMore.howToExecute && presentation.learnMore.whatItDoesAndHow && presentation.learnMore.whyThisMatters, `Missing lesson content at procedure ${index + 1}`);
    equal(presentation.systemResult, expectedSystemResults[index], `System Result changed at procedure ${index + 1}`);
    for (const marker of expectedTechnicalMarkers[index]) {
      assert(presentation.technicalOutput.includes(marker), `Technical Output at procedure ${index + 1} is missing: ${marker}`);
    }
    assert(presentation.annotations.length > 0, `Missing annotations at procedure ${index + 1}`);
    const technicalLineIds = new Set(presentation.technicalLines?.map((line) => line.id) ?? []);
    for (const annotation of presentation.annotations) {
      assert(technicalLineIds.has(annotation.targetLineId), `Annotation ${annotation.id} has no displayed line`);
    }
    equal(
      presentation.technicalLines?.map((line) => line.text).join("\n"),
      presentation.technicalOutput,
      `Technical output lines changed at procedure ${index + 1}`
    );

    if (index === 8) {
      equal(input, "ping 192.168.1.60", "Printer ping procedure did not expose the actual command");
      const roundTripAnnotation = presentation.annotations.find((annotation) => annotation.id === "printer-p09-roundtrip");
      const lossAnnotation = presentation.annotations.find((annotation) => annotation.id === "printer-p09-loss-note");
      assert(roundTripAnnotation?.targetLineId === "printer-p09-summary", "Printer round-trip annotation is attached incorrectly");
      assert(lossAnnotation?.targetLineId === "printer-p09-loss", "Printer packet-loss annotation is attached incorrectly");
      equal(presentation.technicianEntry, "ping 192.168.1.60", "Printer ping technician entry changed");
      equal(getPreviewStepLabel(command), "ping 192.168.1.60", "Printer ping primary label is not the actual command");
      assertDeniedWithoutProgress(state, "ping 192.168.1.50");
    }

    equal(
      getSuccessfulScenarioProcedureCount(output.state.scenario, output.state.runLog),
      beforeProgress + 1,
      `Procedure ${index + 1} did not advance exactly one success`
    );

    const expectedEvidence = evidence[index];
    if (expectedEvidence === null) {
      equal(output.state.evidence, beforeEvidence, `Procedure ${index + 1} unexpectedly added evidence`);
      equal(output.state.evidence.length, beforeEvidenceCount, `Procedure ${index + 1} evidence count changed unexpectedly`);
    } else {
      assert(output.state.evidence.length === beforeEvidenceCount + 1, `Procedure ${index + 1} did not add exactly one evidence entry`);
      assert(output.state.evidence.some((item) => item.text === expectedEvidence), `Missing expected evidence at procedure ${index + 1}`);
    }

    if (index < 12) {
      assert(output.state.executionState === "RUNNING", `Scenario exited before procedure 13 in ${mode}`);
      assert(output.state.result === null, `Scenario completed before procedure 13 in ${mode}`);

      const repeated = handleInput(output.state, input);
      assert(repeated.decision.kind === "DENY", `Immediate repeat was not denied at procedure ${index + 1}`);
      equal(repeated.state.evidence, output.state.evidence, `Repeat duplicated evidence at procedure ${index + 1}`);
    }

    if (index === 9) {
      assert(output.state.scenarioFacts?.kind === scenarioId, "Expected Network Printer facts after port correction");
      equal(output.state.scenarioFacts.printer_port_address, "192.168.1.60", "Windows port was not updated to the actual printer address");
      assert(output.state.scenarioFacts.printer_port_configuration_corrected, "Port correction was not recorded");
    }
    if (index === 10) {
      assert(output.state.scenarioFacts?.kind === scenarioId, "Expected Network Printer facts after queue verification");
      assert(output.state.scenarioFacts.queued_document_printed, "Previously queued document was not recorded as printed");
    }

    state = output.state;
  }

  assert(state.evidence.length === 11, `Expected 11 applicable evidence entries, found ${state.evidence.length}`);
  assert(state.result?.completion === "PASS", `Final procedure did not PASS in ${mode}`);
  equal(state.result.totalScore, 10, `Expected a 10/10 clean-path score in ${mode}`);
  assert(state.executionState === "SCORECARD", `Final procedure did not enter SCORECARD in ${mode}`);
  assert(state.scenarioFacts?.kind === scenarioId && state.scenarioFacts.user_resolution_confirmed, "Final user confirmation fact was not recorded");
}

for (const mode of ["practice", "assessment", "investigation"] as const) {
  runFull(mode);
}

let restartState = start("practice");
restartState = handleInput(restartState, "verify_identity").state;
restartState = handleInput(restartState, "test_printing").state;
const restart = handleInput(restartState, "restart");
assert(restart.decision.kind === "ALLOW", "Restart denied after printer progress");
equal(restart.state.evidence, [], "Restart retained printer evidence");
