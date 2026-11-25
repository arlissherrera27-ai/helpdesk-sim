import { handleInput } from "./engine";
import { getScenarioProcedureCommands, getScenarioProcedureOutput, getSuccessfulScenarioProcedureCount } from "./scenarioRegistry";
import { initialState } from "./state";
import type { SimMode, SimState } from "./types";
import { runScenarioValidation } from "./scenarioValidation";
import { DNS_LOOKUP_EDUCATIONAL_CONTENT } from "./dnsLookupEducationalContent";

const semanticTargetText: Record<string, string> = {
  "dns-p01-verification": "Identity Verification",
  "dns-p01-status": "User Status",
  "dns-p02-adapter": "Network Adapter",
  "dns-p02-network": "Network Name",
  "dns-p02-status": "Connection Status",
  "dns-p03-website": "Website:",
  "dns-p03-browser-error": "This site can't be reached",
  "dns-p03-dns-error": "ERR_NAME_NOT_RESOLVED",
  "dns-p04-prompt": "C:\\Users\\OfficeUser>",
  "dns-p05-adapter": "Wireless LAN adapter Wi-Fi",
  "dns-p05-ipv4": "192.168.1.100",
  "dns-p05-subnet": "255.255.255.0",
  "dns-p05-gateway": "192.168.1.1",
  "dns-p06-target": "Pinging 192.168.1.1",
  "dns-p06-reply": "Reply from 192.168.1.1",
  "dns-p06-packet-stats": "Packets: Sent = 4",
  "dns-p06-round-trip-summary": "Minimum = 1ms",
  "dns-p07-target": "Pinging 8.8.8.8",
  "dns-p07-reply": "Reply from 8.8.8.8",
  "dns-p07-stats": "Packets: Sent = 4",
  "dns-p07-round-trip-summary": "Minimum = 19ms",
  "dns-p08-timed-out": "DNS request timed out",
  "dns-p08-2seconds": "timeout was 2 seconds",
  "dns-p08-server": "UnKnown",
  "dns-p08-address": "192.168.1.2",
  "dns-p08-request-timeout": "Request to UnKnown timed-out",
  "dns-p09-description": "Intel(R) Wi-Fi",
  "dns-p09-physical": "02-00-00-00-01-64",
  "dns-p09-dhcp": "DHCP Enabled",
  "dns-p09-auto": "Autoconfiguration Enabled",
  "dns-p09-ipv4": "192.168.1.100",
  "dns-p09-subnet": "255.255.255.0",
  "dns-p09-gateway": "192.168.1.1",
  "dns-p09-dhcp-server": "DHCP Server",
  "dns-p09-dns-server": "DNS Servers",
  "dns-p10-server": "dns.google",
  "dns-p10-address": "8.8.8.8",
  "dns-p10-response": "Non-authoritative answer",
  "dns-p10-name": "google.com",
  "dns-p10-address-answer": "142.250.190.14",
  "dns-p11-destination": "Escalation Destination",
  "dns-p11-service": "Affected Service",
  "dns-p11-server": "DNS Server",
  "dns-p11-evidence": "Evidence Submitted",
  "dns-p11-status": "Escalation Status",
  "dns-p11-condition": "Confirmed Condition",
  "dns-p11-action": "Corrective Action",
  "dns-p11-restoration": "Administrator Status",
  "dns-p12-server-name": "dns.office.local",
  "dns-p12-server-address": "192.168.1.2",
  "dns-p12-response": "Non-authoritative answer",
  "dns-p12-name": "google.com",
  "dns-p12-address": "142.250.190.14",
  "dns-p13-website": "Website:",
  "dns-p13-browser-result": "Browser Result",
  "dns-p13-original-error": "Original Browser Error",
  "dns-p13-user-confirmation": "User Confirmation",
};

void semanticTargetText;

const scenarioId = "dns_lookup_website_not_opening";

const steps = [
  ["verify_identity", "verify_identity"],
  ["check_network_status", "check_network_status"],
  ["test_website_access", "test_website_access"],
  ["open_command_prompt", "open_command_prompt"],
  ["nslookup portal.office.example", "nslookup"],
  ["ipconfig /displaydns", "ipconfig_displaydns"],
  ["ipconfig /flushdns", "ipconfig_flushdns"],
  ["ping portal.office.example", "ping_portal_hostname"],
  ["ipconfig /displaydns", "ipconfig_displaydns"],
  ["test_internet_connection", "test_internet_connection"],
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
  let state = initialState();
  state = { ...state, mode };
  const selected = handleInput(state, "select dns lookup website not opening");
  assert(selected.decision.kind === "ALLOW", `Selection denied in ${mode}`);
  const started = handleInput(selected.state, "start");
  assert(started.decision.kind === "ALLOW", `Start denied in ${mode}`);
  return started.state;
}

function runFull(mode: SimMode): void {
  let state = start(mode);
  const commands = getScenarioProcedureCommands(scenarioId);
  equal(commands, steps.map(([, command]) => command), "DNS registry sequence changed");
  assert(commands.length === 10, "DNS scenario must contain 10 procedures");

  for (let index = 0; index < steps.length; index += 1) {
    const [input, command] = steps[index];
    const beforeProgress = getSuccessfulScenarioProcedureCount(state.scenario, state.runLog);
    const output = handleInput(state, input);

    assert(output.decision.kind === "ALLOW", `Procedure ${index + 1} denied: ${input}`);
    const event = output.state.runLog[output.state.runLog.length - 1];
    assert(event?.decision === "ALLOW" && event.outcome === "success" && event.command === command, `Procedure ${index + 1} did not execute successfully`);

    const presentation = getScenarioProcedureOutput(scenarioId, command, index);
    assert(presentation, `Missing presentation for procedure ${index + 1}`);
    assert(presentation.annotations.length > 0, `Missing annotations for procedure ${index + 1}`);
    assert(presentation.learnMore.howToExecute && presentation.learnMore.whatItDoesAndHow && presentation.learnMore.whyThisMatters, `Missing lesson content for procedure ${index + 1}`);

    const lineIds = new Map(
      (presentation.technicalLines ?? []).map((line) => [line.id, line.text])
    );
    for (const annotation of presentation.annotations) {
      assert(lineIds.has(annotation.targetLineId), `Annotation target missing at procedure ${index + 1}: ${annotation.targetLineId}`);
    }

    if (index === 1) {
      assert(presentation.annotations.some((annotation) => annotation.content.includes("Wi-Fi enabled")), "DNS procedure 2 missing Wi-Fi annotation");
      assert(presentation.annotations.some((annotation) => annotation.content.includes("Airplane mode off")), "DNS procedure 2 missing airplane-mode annotation");
      assert(presentation.annotations.some((annotation) => annotation.content.includes("Connected network")), "DNS procedure 2 missing network annotation");
      assert(presentation.annotations.some((annotation) => annotation.content.includes("Signal strength")), "DNS procedure 2 missing signal-strength annotation");
    }
    if (index === 4) {
      equal(presentation.technicianEntry, "nslookup portal.office.example", "DNS procedure 5 primary label changed");
      assert(presentation.annotations.some((annotation) => annotation.content.includes("Server —")), "DNS procedure 5 missing server annotation");
      assert(presentation.annotations.some((annotation) => annotation.content.includes("First Address")), "DNS procedure 5 missing first-address annotation");
      assert(presentation.annotations.some((annotation) => annotation.content.includes("Second Address")), "DNS procedure 5 missing second-address annotation");
    }
    if (index === 5) {
      equal(presentation.technicianEntry, "ipconfig /displaydns", "DNS procedure 6 primary label changed");
      assert(presentation.annotations.some((annotation) => annotation.targetLineId === "dns-p06-ttl"), "DNS procedure 6 TTL annotation is attached incorrectly");
      assert(presentation.annotations.some((annotation) => annotation.targetLineId === "dns-p06-address"), "DNS procedure 6 A-record annotation is attached incorrectly");
    }
    if (index === 6) {
      equal(presentation.technicianEntry, "ipconfig /flushdns", "DNS procedure 7 primary label changed");
      assert(presentation.technicalOutput.includes("Successfully flushed the DNS Resolver Cache."), "DNS procedure 7 missing flush output");
    }
    if (index === 7) {
      equal(presentation.technicianEntry, "ping portal.office.example", "DNS procedure 8 primary label changed");
      assert(presentation.annotations.some((annotation) => annotation.targetLineId === "dns-p08-loss"), "DNS procedure 8 packet-loss annotation is attached incorrectly");
      assert(presentation.annotations.some((annotation) => annotation.targetLineId === "dns-p08-minmax"), "DNS procedure 8 round-trip annotation is attached incorrectly");
    }
    if (index === 8) {
      equal(presentation.technicianEntry, "ipconfig /displaydns", "DNS procedure 9 primary label changed");
      const exactTargets = new Map(presentation.annotations.map((annotation) => [annotation.id, annotation.targetLineId]));
      equal(exactTargets.get("dns-p09-name"), "dns-p09-name", "DNS procedure 9 Record Name attachment changed");
      equal(exactTargets.get("dns-p09-type"), "dns-p09-type", "DNS procedure 9 Record Type attachment changed");
      equal(exactTargets.get("dns-p09-ttl"), "dns-p09-ttl", "DNS procedure 9 TTL attachment changed");
      equal(exactTargets.get("dns-p09-length"), "dns-p09-length", "DNS procedure 9 Data Length attachment changed");
      equal(exactTargets.get("dns-p09-section"), "dns-p09-section", "DNS procedure 9 Section attachment changed");
      equal(exactTargets.get("dns-p09-address"), "dns-p09-address", "DNS procedure 9 A-record attachment changed");
      assert(presentation.annotations.some((annotation) => annotation.targetLineId === "dns-p09-ttl"), "DNS procedure 9 TTL annotation is attached incorrectly");
      assert(presentation.annotations.some((annotation) => annotation.targetLineId === "dns-p09-address"), "DNS procedure 9 A-record annotation is attached incorrectly");
    }
    if (index === 9) {
      equal(presentation.technicianEntry, "test_internet_connection", "DNS procedure 10 canonical technician entry changed");
    }

    equal(
      getSuccessfulScenarioProcedureCount(output.state.scenario, output.state.runLog),
      beforeProgress + 1,
      `Procedure ${index + 1} did not advance exactly one success`
    );

    if (index < 9) {
      assert(output.state.result === null, `Scenario completed before procedure 10 in ${mode}`);
      assert(output.state.executionState === "RUNNING", `Scenario exited before procedure 10 in ${mode}`);

      const repeated = handleInput(output.state, input);
      assert(repeated.decision.kind === "DENY", `Immediate repeat was not denied at procedure ${index + 1}: ${input}`);
      equal(repeated.state.scenarioFacts, output.state.scenarioFacts, `Repeat mutated facts at procedure ${index + 1}`);
      equal(
        getSuccessfulScenarioProcedureCount(repeated.state.scenario, repeated.state.runLog),
        beforeProgress + 1,
        `Repeat advanced progress at procedure ${index + 1}`
      );
    }

    if (output.state.scenarioFacts?.kind === scenarioId) {
      const facts = output.state.scenarioFacts;
      if (index === 4) {
        assert(facts.configured_dns_lookup_succeeded, "Direct DNS lookup did not return the current address");
        equal(facts.current_portal_address, "192.168.1.60", "Direct DNS address changed");
        equal(facts.outdated_cached_address, "192.168.1.50", "Direct DNS lookup replaced the cached entry");
      }
      if (index === 5) assert(facts.initial_dns_cache_inspected, "Initial cache inspection was not recorded");
      if (index === 6) {
        assert(facts.dns_cache_flushed, "DNS cache flush was not recorded");
        equal(facts.outdated_cached_address, "", "Cache flush did not remove the outdated cached address");
      }
      if (index === 7) {
        assert(facts.portal_hostname_ping_succeeded, "Hostname ping was not recorded");
        equal(facts.outdated_cached_address, "192.168.1.60", "Ping did not repopulate cache with current address");
        assert(output.state.result === null, "Hostname ping prematurely completed the scenario");
      }
      if (index === 8) {
        assert(facts.updated_dns_cache_inspected, "Updated cache inspection was not recorded");
        assert(output.state.result === null, "Updated cache inspection prematurely completed the scenario");
      }
    }

    state = output.state;
  }

  assert(state.result?.completion === "PASS", `Final procedure did not PASS in ${mode}`);
  equal(state.result?.totalScore, 10, `DNS scenario did not score 10/10 in ${mode}`);
  assert(state.executionState === "SCORECARD", `Final procedure did not enter SCORECARD in ${mode}`);
  assert(state.scenarioFacts?.kind === scenarioId && state.scenarioFacts.internet_access_verified && state.scenarioFacts.user_confirmed_resolution, `Final DNS resolution facts missing in ${mode}`);
}

const combined = runScenarioValidation(
  "dns_lookup_website_not_opening",
  "select dns lookup website not opening"
);
assert(combined.status === "PASS", "DNS Combined Test did not pass");
assert(combined.transcript.length >= 10, "DNS Combined Test transcript omitted golden-path procedures");
for (const entry of combined.transcript) {
  if (entry.phase === "correct" && entry.procedureResult) {
    assert(entry.evidenceSnapshot, `Missing cumulative evidence snapshot for ${entry.input}`);
  }
}

for (const mode of ["practice", "assessment", "investigation"] as const) {
  runFull(mode);
}

const annotationCount = Object.values(DNS_LOOKUP_EDUCATIONAL_CONTENT).reduce(
  (count, procedure) => count + procedure.annotations.length,
  0
);
assert(annotationCount >= 30, `Expected complete DNS educational coverage, found ${annotationCount}`);

let restartState = start("practice");
for (const [input] of steps.slice(0, 3)) {
  restartState = handleInput(restartState, input).state;
}
const restart = handleInput(restartState, "restart");
assert(restart.decision.kind === "ALLOW", "Restart denied after DNS progress");
equal(
  getSuccessfulScenarioProcedureCount(restart.state.scenario, restart.state.runLog),
  0,
  "Restart did not reset DNS required-procedure progress"
);
if (restart.state.scenarioFacts?.kind === scenarioId) {
  assert(!restart.state.scenarioFacts.identity_verified, "Restart did not reset identity");
  assert(!restart.state.scenarioFacts.initial_dns_cache_inspected, "Restart did not reset DNS cache inspection");
}
