import { handleInput } from "./engine";
import { getScenarioProcedureCommands, getScenarioProcedureOutput, getSuccessfulScenarioProcedureCount } from "./scenarioRegistry";
import { initialState } from "./state";
import type { SimMode, SimState } from "./types";
import { TCP_PORT_EDUCATIONAL_CONTENT } from "./tcpPortEducationalContent";
import { getPreviewStepLabel } from "./scenarioTree";

const scenarioId = "tcp_port_connectivity";

const steps = [
  ["verify_identity", "verify_identity"],
  ["check_application_error", "check_application_error"],
  ["check_physical_network_connection", "check_physical_network_connection"],
  ["check_network_status", "check_network_status"],
  ["check_application_connection_settings", "check_application_connection_settings"],
  ["open_it_knowledge_base", "open_it_knowledge_base"],
  ["open_kb_app_connectivity", "open_kb_app_connectivity"],
  ["open_powershell", "open_powershell"],
  ["ping 192.168.1.50", "ping_application_server"],
  ["Test-NetConnection 192.168.1.50 -Port 443", "test_tcp_port_443"],
  ["Test-NetConnection 192.168.1.50 -Port 8443", "test_tcp_port_8443"],
  ["correct_application_port_configuration", "correct_application_port_configuration"],
  ["test_application_connection", "test_application_connection"],
  ["confirm_user_resolution", "confirm_user_resolution"],
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
  const state = { ...initialState(), mode };
  const selected = handleInput(state, "select tcp port connectivity");
  assert(selected.decision.kind === "ALLOW", `Selection denied in ${mode}`);
  const started = handleInput(selected.state, "start");
  assert(started.decision.kind === "ALLOW", `Start denied in ${mode}`);
  return started.state;
}

function assertDeniedWithoutProgress(state: SimState, input: string): void {
  const beforeProgress = getSuccessfulScenarioProcedureCount(state.scenario, state.runLog);
  const beforeEvidence = state.evidence;
  const output = handleInput(state, input);
  assert(output.decision.kind === "DENY", `Expected ${input} to be denied`);
  equal(getSuccessfulScenarioProcedureCount(output.state.scenario, output.state.runLog), beforeProgress, `${input} unexpectedly advanced the scenario`);
  equal(output.state.evidence, beforeEvidence, `${input} unexpectedly changed evidence`);
}

function runFull(mode: SimMode): void {
  equal(getScenarioProcedureCommands(scenarioId).length, 14, "TCP procedure count changed");
  equal(getScenarioProcedureCommands(scenarioId), steps.map(([, command]) => command), "TCP registry sequence changed");

  let state = start(mode);

  const wrongOrder = handleInput(state, "check_application_connection_settings");
  assert(wrongOrder.decision.kind === "DENY", "Wrong-order application settings check was not rejected");

  assertDeniedWithoutProgress(state, "Test-NetConnection 192.168.1.99 -Port 8443");
  assertDeniedWithoutProgress(state, "Test-NetConnection 192.168.1.50 -Port 8080");

  for (let index = 0; index < steps.length; index += 1) {
    const [input, command] = steps[index];
    const beforeProgress = getSuccessfulScenarioProcedureCount(state.scenario, state.runLog);
    const output = handleInput(state, input);

    assert(output.decision.kind === "ALLOW", `Procedure ${index + 1} denied: ${input}`);
    const event = output.state.runLog[output.state.runLog.length - 1];
    assert(event?.decision === "ALLOW" && event.outcome === "success" && event.command === command, `Procedure ${index + 1} did not execute successfully`);

    equal(getSuccessfulScenarioProcedureCount(output.state.scenario, output.state.runLog), beforeProgress + 1, `Procedure ${index + 1} did not advance exactly one success`);

    if (index === 8) {
      equal(input, "ping 192.168.1.50", "Standalone server ping command changed");
      assert(output.state.scenarioFacts?.kind === scenarioId && output.state.scenarioFacts.application_server_ping_succeeded, "Server ping fact was not recorded");
    }

    if (index === 9) {
      equal(input, "Test-NetConnection 192.168.1.50 -Port 443", "443 test command changed");
      assert(output.state.scenarioFacts?.kind === scenarioId && output.state.scenarioFacts.tcp_port_443_test_failed, "443 diagnostic failure was not recorded");
    }

    if (index === 10) {
      equal(input, "Test-NetConnection 192.168.1.50 -Port 8443", "8443 test command changed");
      assert(output.state.scenarioFacts?.kind === scenarioId && output.state.scenarioFacts.tcp_port_8443_test_succeeded, "8443 connectivity success was not recorded");
    }

    if (index === 11) {
      assert(output.state.scenarioFacts?.kind === scenarioId && output.state.scenarioFacts.application_port_configuration_corrected, "Application port correction was not recorded");
      equal(output.state.scenarioFacts.application_server, "192.168.1.50", "Correction changed the server IP address");
      equal(output.state.scenarioFacts.required_tcp_port, 8443, "Required port changed during correction");
      assert(output.state.result === null, "Correction prematurely completed the scenario");
    }

    if (index === 12) {
      assert(output.state.scenarioFacts?.kind === scenarioId && output.state.scenarioFacts.application_connection_verified, "Application-level verification was not recorded");
      assert(output.state.result === null, "Application verification prematurely completed the scenario");
    }

    const presentation = getScenarioProcedureOutput(scenarioId, command, index);
    assert(presentation, `Missing presentation at procedure ${index + 1}`);
    assert(presentation.learnMore.howToExecute && presentation.learnMore.whatItDoesAndHow && presentation.learnMore.whyThisMatters, `Missing Learn More at procedure ${index + 1}`);

    if (index === 4) {
      assert(presentation.learnMore.whyThisMatters?.includes("Inspecting the current connection settings"), "Procedure 5 no longer explains settings inspection");
    }
    if (index === 8) {
      equal(presentation.technicianEntry, "ping 192.168.1.50", "Ping primary label changed");
      assert(presentation.annotations.some((annotation) => annotation.content.includes("ICMP")), "Procedure 9 is missing ICMP explanation");
      assert(presentation.annotations.some((annotation) => annotation.content.includes("Packet loss")), "Procedure 9 is missing packet-loss explanation");
      assert(presentation.annotations.some((annotation) => annotation.content.includes("Round-trip statistics")), "Procedure 9 is missing round-trip statistics explanation");
    }
    if (index === 9) equal(presentation.technicianEntry, "Test-NetConnection 192.168.1.50 -Port 443", "443 primary label changed");
    if (index === 10) equal(presentation.technicianEntry, "Test-NetConnection 192.168.1.50 -Port 8443", "8443 primary label changed");

    const technicalLineIds = new Set(presentation.technicalLines?.map((line) => line.id) ?? []);
    for (const annotation of presentation.annotations) {
      assert(technicalLineIds.has(annotation.targetLineId), `Annotation ${annotation.id} has no matching technical line`);
    }

    if (index === 8) {
      const packetLossAnnotation = presentation.annotations.find((annotation) => annotation.id === "tcp-p09-packets");
      const roundTripAnnotation = presentation.annotations.find((annotation) => annotation.id === "tcp-p09-average");
      assert(packetLossAnnotation?.targetLineId === "tcp-p09-packets", "TCP packet-loss annotation target is incorrect");
      assert(roundTripAnnotation?.targetLineId === "tcp-p09-average", "TCP round-trip annotation target is incorrect");
    }
    if (index === 9) {
      assert(presentation.technicalOutput.includes("TcpTestSucceeded       : False"), "443 test did not produce a failed TCP result");
      assert(presentation.annotations.some((annotation) => annotation.content.includes("Transmission Control Protocol")), "Procedure 10 is missing TCP explanation");
      assert(presentation.annotations.some((annotation) => annotation.content.includes("Round-Trip Time")), "Procedure 10 is missing RTT explanation");
    }
    if (index === 13) {
      equal(presentation.technicianEntry, "confirm_user_resolution", "Procedure 14 technician entry changed");
      equal(getPreviewStepLabel(command), "Confirm User Resolution", "Procedure 14 primary title changed");
    }
    if (index === 10) {
      assert(presentation.technicalOutput.includes("TcpTestSucceeded : True"), "8443 test did not produce a successful TCP result");
      assert(presentation.learnMore.whyThisMatters?.includes("A successful TCP connection confirms that the specified destination port is reachable"), "Procedure 11 is missing successful TCP limitations");
      assert(!presentation.technicalOutput.includes("PingSucceeded"), "Successful 8443 output unexpectedly included PingSucceeded");
    }

    if (index < 13) {
      assert(output.state.executionState === "RUNNING", `Scenario exited before procedure 14 in ${mode}`);
      assert(output.state.result === null, `Scenario completed before procedure 14 in ${mode}`);
      const repeated = handleInput(output.state, input);
      assert(repeated.decision.kind === "DENY", `Immediate repeat was not denied at procedure ${index + 1}`);
      equal(repeated.state.evidence, output.state.evidence, `Repeat duplicated evidence at procedure ${index + 1}`);
    }

    state = output.state;
  }

  assert(state.result?.completion === "PASS", `Final procedure did not PASS in ${mode}`);
  equal(state.result.totalScore, 10, `Expected 10/10 in ${mode}`);
  assert(state.executionState === "SCORECARD", `Final procedure did not enter SCORECARD in ${mode}`);
  assert(state.scenarioFacts?.kind === scenarioId && state.scenarioFacts.user_resolution_confirmed, "Final user confirmation fact was missing");
}

for (const mode of ["practice", "assessment", "investigation"] as const) {
  runFull(mode);
}

const educationKeys = Object.keys(TCP_PORT_EDUCATIONAL_CONTENT).map(Number).sort((a, b) => a - b);
equal(educationKeys, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14], "TCP educational content count changed");
