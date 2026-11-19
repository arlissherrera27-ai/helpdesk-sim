import { handleInput } from "./engine";
import {
  getScenarioDefaults,
  getScenarioProcedureCommands,
  getScenarioProcedureOutput,
  getSuccessfulScenarioProcedureCount,
} from "./scenarioRegistry";
import { initialState } from "./state";
import type { SimMode, SimState } from "./types";

const scenarioId = "dhcp_apipa_troubleshooting";

const steps = [
  ["verify_identity", "verify_identity"],
  ["check_network_status", "check_network_status"],
  ["open_command_prompt", "open_command_prompt"],
  ["ipconfig", "ipconfig"],
  ["open_it_knowledge_base", "open_it_knowledge_base"],
  ["open_kb_204", "open_kb_204"],
  ["ping 192.168.1.1", "ping_default_gateway"],
  ["ping 8.8.8.8", "ping_external_ip"],
  ["ipconfig /all", "ipconfig_all"],
  ["ipconfig /renew", "ipconfig_renew"],
  ["ipconfig /all", "ipconfig_all"],
  ["ping 192.168.1.1", "ping_default_gateway"],
  ["ping 8.8.8.8", "ping_external_ip"],
  ["nslookup google.com", "nslookup"],
  ["test_internet_connection", "test_internet_connection"],
] as const;

const expectedSystemResults = [
  "User identity verified successfully. Troubleshooting may proceed.",
  "The laptop is connected to the office Wi-Fi network.",
  "Windows Command Prompt opened successfully.",
  "The workstation's basic IP configuration is displayed.",
  "IT Knowledge Base opened successfully. Available articles are displayed.",
  "Knowledge Base article KB-204 opened successfully. The organization's documented Office Wi-Fi configuration is displayed.",
  "The ping test failed. The workstation did not receive a response from the documented default gateway.",
  "The external IP connectivity test failed. Windows could not successfully transmit the ping requests.",
  "Detailed IP configuration retrieved. DHCP is enabled on the wireless adapter, but the workstation currently has an automatically assigned IPv4 link-local address rather than an address from the documented office subnet.",
  "The DHCP renewal request completed successfully. The Wi-Fi adapter received an IPv4 address, subnet mask, and default gateway matching the documented office network.",
  "Detailed network configuration retrieved. The Wi-Fi adapter now has an IPv4 address, subnet mask, and default gateway consistent with the documented office network. DHCP lease information and DNS server configuration are also available.",
  "The default gateway responded successfully to all four ping requests. No packet loss was reported.",
  "The external IP address responded successfully to all four ping requests. No packet loss was reported.",
  "The configured DNS server responded successfully to the lookup request and returned an IP address for google.com.",
  "The workstation successfully loads the test website. The user also confirms that the websites affected by the original issue are now accessible.",
];

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string): void {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${message}\nExpected: ${JSON.stringify(expected)}\nActual: ${JSON.stringify(actual)}`);
  }
}

function getDhcpFacts(state: SimState) {
  assert(state.scenarioFacts?.kind === scenarioId, "Expected active DHCP scenario facts.");
  return state.scenarioFacts;
}

function startScenario(mode: SimMode): SimState {
  const selected = handleInput(
    { ...initialState(), mode },
    "select dhcp apipa troubleshooting"
  );
  assert(selected.decision.kind === "ALLOW", `Scenario selection failed in ${mode}.`);

  const started = handleInput(selected.state, "start");
  assert(started.decision.kind === "ALLOW", `Scenario start failed in ${mode}.`);
  assert(started.state.executionState === "RUNNING", `Scenario did not start in ${mode}.`);
  return started.state;
}

function assertDeniedWithoutProgress(state: SimState, input: string): void {
  const beforeFacts = JSON.stringify(state.scenarioFacts);
  const beforeResult = JSON.stringify(state.result);
  const beforeProgress = getSuccessfulScenarioProcedureCount(
    state.scenario,
    state.runLog
  );
  const output = handleInput(state, input);

  assert(output.decision.kind === "DENY", `Expected ${input} to be denied.`);
  assertEqual(output.state.scenarioFacts, state.scenarioFacts, `${input} changed scenario facts.`);
  assertEqual(output.state.result, state.result, `${input} changed the result.`);
  assertEqual(
    getSuccessfulScenarioProcedureCount(output.state.scenario, output.state.runLog),
    beforeProgress,
    `${input} advanced procedure progress.`
  );
  assertEqual(JSON.stringify(state.scenarioFacts), beforeFacts, "Input state facts were mutated.");
  assertEqual(JSON.stringify(state.result), beforeResult, "Input state result was mutated.");
}

function runThrough(state: SimState, count: number): SimState {
  let current = state;
  for (let index = 0; index < count; index += 1) {
    const [input, command] = steps[index];
    const output = handleInput(current, input);
    assert(output.decision.kind === "ALLOW", `Procedure ${index + 1} was denied: ${input}`);
    const event = output.state.runLog[output.state.runLog.length - 1];
    assert(
      event?.command === command && event.outcome === "success",
      `Procedure ${index + 1} did not execute successfully.`
    );
    current = output.state;
  }
  return current;
}

function verifyFullRun(mode: SimMode): void {
  const commandSequence = getScenarioProcedureCommands(scenarioId);
  assertEqual(commandSequence.length, 15, "DHCP procedure length changed.");
  assertEqual(
    commandSequence,
    steps.map(([, command]) => command),
    "Registered DHCP command sequence differs from the approved script."
  );

  let state = startScenario(mode);
  const defaults = getScenarioDefaults(scenarioId);
  assertEqual(state.scenarioFacts, defaults, `Initial DHCP facts differ in ${mode}.`);

  assertDeniedWithoutProgress(state, "ipconfig /renew");
  assertDeniedWithoutProgress(state, "check_network_status");

  const messages: string[] = [];
  for (let index = 0; index < steps.length; index += 1) {
    const [input, command] = steps[index];
    const output = handleInput(state, input);

    assert(output.decision.kind === "ALLOW", `Procedure ${index + 1} was denied in ${mode}: ${input}`);
    const event = output.state.runLog[output.state.runLog.length - 1];
    assert(
      event?.decision === "ALLOW" &&
        event.outcome === "success" &&
        event.command === command,
      `Procedure ${index + 1} did not produce a successful execution event in ${mode}.`
    );

    const procedureOutput = getScenarioProcedureOutput(scenarioId, command, index);
    assert(procedureOutput, `Missing procedure output for occurrence ${index + 1}.`);
    assert(procedureOutput.annotations.length > 0, `Missing annotations for procedure ${index + 1}.`);
    for (const [section, content] of Object.entries(procedureOutput.learnMore)) {
      assert(content && content.trim().length > 0, `Missing ${section} content for procedure ${index + 1}.`);
    }
    const technicalLineIds = new Set(
      procedureOutput.technicalLines?.map((line) => line.id) ?? []
    );
    for (const annotation of procedureOutput.annotations) {
      assert(
        technicalLineIds.has(annotation.targetLineId),
        `Annotation ${annotation.id} has no technical line at procedure ${index + 1}.`
      );
    }
    const expectedOccurrence = steps
      .slice(0, index + 1)
      .filter(([, expectedCommand]) => expectedCommand === command)
      .length;
    assertEqual(
      procedureOutput.commandOccurrence,
      expectedOccurrence,
      `Presentation occurrence is incorrect at procedure ${index + 1}.`
    );
    assertEqual(
      procedureOutput.systemResult,
      expectedSystemResults[index],
      `System Result changed at procedure ${index + 1}.`
    );
    assertEqual(
      procedureOutput.technicalLines?.map((line) => line.text).join("\n"),
      procedureOutput.technicalOutput,
      `Structured technical lines changed output at procedure ${index + 1}.`
    );
    assertEqual(
      output.message,
      `${procedureOutput.systemResult}\n\n${procedureOutput.technicalOutput}`,
      `Conversation output selected the wrong occurrence at procedure ${index + 1}.`
    );
    messages.push(output.message);

    const procedureCount = getSuccessfulScenarioProcedureCount(
      output.state.scenario,
      output.state.runLog
    );
    assertEqual(procedureCount, index + 1, `Procedure ${index + 1} progress is incorrect.`);

    if (index < steps.length - 1) {
      assert(output.state.executionState === "RUNNING", `Scenario exited before procedure 15 in ${mode}.`);
      assert(output.state.result === null, `Scenario produced a result before procedure 15 in ${mode}.`);
    }

    if (index === 8) {
      const facts = getDhcpFacts(output.state);
      assertEqual(facts.ipv4_address, "169.254.23.18", "IP changed before renewal.");
      assertEqual(facts.subnet_mask, "255.255.0.0", "Subnet mask changed before renewal.");
      assertEqual(facts.default_gateway, null, "Gateway appeared before renewal.");
      assert(facts.dhcp_server === null && facts.dns_server === null, "DHCP/DNS server data appeared before its approved verification.");
    }

    if (index === 9) {
      const facts = getDhcpFacts(output.state);
      assert(facts.dhcp_lease_renewed, "DHCP renewal was not recorded.");
      assertEqual(facts.ipv4_address, "192.168.1.100", "Renewal did not assign the approved IP address.");
      assertEqual(facts.subnet_mask, "255.255.255.0", "Renewal did not assign the approved subnet mask.");
      assertEqual(facts.default_gateway, "192.168.1.1", "Renewal did not assign the approved gateway.");
      assert(facts.dhcp_server === null && facts.dns_server === null, "Renewal alone populated unverified server data.");
      assert(!facts.internet_access_restored, "Renewal alone restored internet access.");
    }

    if (index === 10) {
      const facts = getDhcpFacts(output.state);
      assertEqual(facts.dhcp_server, "192.168.1.10", "DHCP server verification is incorrect.");
      assertEqual(facts.dns_server, "192.168.1.10", "DNS server verification is incorrect.");
    }

    if (index < steps.length - 1) {
      assertDeniedWithoutProgress(output.state, input);
    }
    state = output.state;
  }

  assert(messages[6].includes("PING: transmit failed. General failure."), "Procedure 7 did not show the approved failed gateway output.");
  assert(messages[7].includes("Packets: Sent = 4, Received = 0, Lost = 4 (100% loss)"), "Procedure 8 did not show the approved failed external ping output.");
  assert(messages[8].includes("Autoconfiguration IPv4 Address. . : 169.254.23.18"), "Procedure 9 did not show APIPA details.");
  assert(messages[10].includes("IPv4 Address. . . . . . . . . . . : 192.168.1.100(Preferred)"), "Procedure 11 did not show the renewed IP configuration.");
  assert(messages[10].includes("DNS Servers . . . . . . . . . . . : 192.168.1.10"), "Procedure 11 did not show the approved DNS server.");
  assert(messages[11].includes("Reply from 192.168.1.1"), "Procedure 12 did not show successful gateway replies.");
  assert(messages[12].includes("Reply from 8.8.8.8"), "Procedure 13 did not show successful external-IP replies.");
  assert(messages[13].includes("Address:  142.250.190.14"), "Procedure 14 did not show the approved DNS result.");
  assert(messages[14].includes("User confirms websites now load"), "Procedure 15 did not include user confirmation.");
  assert(messages[6] !== messages[11], "Gateway ping occurrences reused the same output.");
  assert(messages[7] !== messages[12], "External ping occurrences reused the same output.");
  assert(messages[8] !== messages[10], "ipconfig /all occurrences reused the same output.");

  for (const [firstIndex, secondIndex, firstPrefix, secondPrefix] of [
    [6, 11, "dhcp-p07-", "dhcp-p12-"],
    [7, 12, "dhcp-p08-", "dhcp-p13-"],
    [8, 10, "dhcp-p09-", "dhcp-p11-"],
  ] as const) {
    const first = getScenarioProcedureOutput(
      scenarioId,
      steps[firstIndex][1],
      firstIndex
    );
    const second = getScenarioProcedureOutput(
      scenarioId,
      steps[secondIndex][1],
      secondIndex
    );
    assert(first && second, "Repeated procedure presentation is missing.");
    assert(first.commandOccurrence === 1 && second.commandOccurrence === 2, "Repeated occurrence identity is incorrect.");
    assert(first.annotations.every((annotation) => annotation.targetLineId.startsWith(firstPrefix)), "First repeated annotation was attached to the wrong occurrence.");
    assert(second.annotations.every((annotation) => annotation.targetLineId.startsWith(secondPrefix)), "Second repeated annotation was attached to the wrong occurrence.");
  }

  const finalFacts = getDhcpFacts(state);
  assert(finalFacts.internet_access_restored, "Final procedure did not restore internet access.");
  assert(finalFacts.user_confirmed_access, "Final procedure did not record user confirmation.");
  assert(state.result?.completion === "PASS", `Final procedure did not PASS in ${mode}.`);
  assertEqual(
    getSuccessfulScenarioProcedureCount(state.scenario, state.runLog),
    15,
    `Final procedure count is incorrect in ${mode}.`
  );
}

for (const mode of ["practice", "assessment", "investigation"] as const) {
  verifyFullRun(mode);
}

let restartState = runThrough(startScenario("practice"), 2);
const restartOutput = handleInput(restartState, "restart");
assert(restartOutput.decision.kind === "ALLOW", "Restart was denied after DHCP procedure progress.");
restartState = restartOutput.state;
assertEqual(
  restartState.scenarioFacts,
  getScenarioDefaults(scenarioId),
  "Restart did not restore initial DHCP facts."
);
assertEqual(
  getSuccessfulScenarioProcedureCount(restartState.scenario, restartState.runLog),
  0,
  "Restart did not reset DHCP procedure progress."
);
assertDeniedWithoutProgress(restartState, "check_network_status");

let failedRenewState = runThrough(startScenario("practice"), 9);
const failedRenewFacts = getDhcpFacts(failedRenewState);
const corruptedRenewState: SimState = {
  ...failedRenewState,
  scenarioFacts: {
    ...failedRenewFacts,
    dhcp_server: "192.168.1.10",
  },
};
const failedRenew = handleInput(corruptedRenewState, "ipconfig /renew");
assert(failedRenew.decision.kind === "ALLOW", "Failed-execution test did not pass decision authorization.");
const failedRenewEvent = failedRenew.state.runLog[failedRenew.state.runLog.length - 1];
assert(failedRenewEvent?.outcome === "error", "Invalid renewal state did not fail execution.");
assertEqual(failedRenew.state.scenarioFacts, corruptedRenewState.scenarioFacts, "Failed execution mutated DHCP facts.");
assertEqual(
  getSuccessfulScenarioProcedureCount(failedRenew.state.scenario, failedRenew.state.runLog),
  9,
  "Failed execution advanced procedure progress."
);