import { handleInput } from "./engine";
import { getScenarioProcedureCommands, getScenarioProcedureOutput, getSuccessfulScenarioProcedureCount } from "./scenarioRegistry";
import { initialState } from "./state";
import type { SimMode, SimState } from "./types";
import { NETWORK_PRINTER_EDUCATIONAL_CONTENT } from "./networkPrinterEducationalContent";

const scenarioId = "network_printer_not_printing";

const steps = [
  ["verify_identity", "verify_identity"],
  ["test_printing", "test_printing"],
  ["check_printer_status", "check_printer_status"],
  ["check_print_queue", "check_print_queue"],
  ["check_printer_port", "check_printer_port"],
  ["open_command_prompt", "open_command_prompt"],
  ["ipconfig", "ipconfig"],
  ["ping 192.168.1.1", "ping_default_gateway"],
  ["ping 192.168.1.50", "ping_printer"],
  ["check_printer_physical_status", "check_printer_physical_status"],
  ["reconnect_printer_ethernet", "reconnect_printer_ethernet"],
  ["ping 192.168.1.50", "ping_printer"],
  ["check_print_queue", "check_print_queue"],
  ["print_test_page", "print_test_page"],
  ["confirm_user_resolution", "confirm_user_resolution"],
] as const;

const evidence = [
  null,
  "Print request submitted; no physical output produced.",
  "Windows reports Office Printer as offline.",
  "One incomplete print job with Error - Printing status.",
  "Standard TCP/IP Port configured for 192.168.1.50.",
  null,
  "Workstation IPv4: 192.168.1.100/24; gateway: 192.168.1.1.",
  "Four successful ICMP Echo Replies from the default gateway.",
  "Destination host unreachable; no successful Echo Replies from the printer destination.",
  "Printer powered on; Ethernet cable disconnected; link down.",
  "Ethernet link established; printer displays IPv4 address 192.168.1.50.",
  "Four successful ICMP Echo Replies from the printer destination.",
  "Previously queued document printed; no pending jobs.",
  "Windows test page printed successfully.",
  "User successfully repeated the original printing operation and confirmed resolution.",
] as const;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function equal(actual: unknown, expected: unknown, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function start(mode: SimMode): SimState {
  let state = { ...initialState(), mode };
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
  equal(annotationCount, 62, "Printer annotation count changed");

  const lessonCount = Object.values(NETWORK_PRINTER_EDUCATIONAL_CONTENT).reduce(
    (count, procedure) =>
      count + Object.values(procedure.learnMore).filter((content) => content !== null && content.trim().length > 0).length,
    0
  );
  equal(lessonCount, 45, "Printer Learn More section count changed");

  let state = start(mode);
  if (mode === "practice") {
    const wrong = handleInput(state, "definitely_not_a_printer_command");
    assert(wrong.decision.kind === "DENY", "Unknown printer command was not denied");
    assert(wrong.state.executionState === "RUNNING", "Practice entered terminal failure after an unknown command");
    state = wrong.state;
  }
  equal(getScenarioProcedureCommands(scenarioId), steps.map(([, command]) => command), "Printer registry sequence changed");

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

    if (index < 14) {
      assert(output.state.executionState === "RUNNING", `Scenario exited before procedure 15 in ${mode}`);
      assert(output.state.result === null, `Scenario completed before procedure 15 in ${mode}`);

      const repeated = handleInput(output.state, input);
      assert(repeated.decision.kind === "DENY", `Immediate repeat was not denied at procedure ${index + 1}`);
      equal(repeated.state.evidence, output.state.evidence, `Repeat duplicated evidence at procedure ${index + 1}`);
    }

    state = output.state;
  }

  assert(state.evidence.length === 13, `Expected 13 applicable evidence entries, found ${state.evidence.length}`);
  assert(state.result?.completion === "PASS", `Final procedure did not PASS in ${mode}`);
  assert(state.executionState === "SCORECARD", `Final procedure did not enter SCORECARD in ${mode}`);
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
