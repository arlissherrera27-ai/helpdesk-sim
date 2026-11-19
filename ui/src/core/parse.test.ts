import { parseCommand } from "./parse";

function assertCommand(input: string, expected: ReturnType<typeof parseCommand>) {
  const actual = parseCommand(input);

  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(
      `Unexpected parse result for ${JSON.stringify(input)}: ${JSON.stringify(actual)}`,
    );
  }
}

for (const [rawInput, kind] of [
  ["open_command_prompt", "open_command_prompt"],
  ["ipconfig", "ipconfig"],
  ["open_it_knowledge_base", "open_it_knowledge_base"],
  ["open_kb_204", "open_kb_204"],
  ["ping 192.168.1.1", "ping_default_gateway"],
  ["ping 8.8.8.8", "ping_external_ip"],
  ["ipconfig /all", "ipconfig_all"],
  ["ipconfig /renew", "ipconfig_renew"],
  ["nslookup google.com", "nslookup"],
] as const) {
  assertCommand(rawInput, { kind, readOnly: false });
}

assertCommand("ipconfig /check wifi", {
  kind: "unknown",
  rawInput: "ipconfig /check wifi",
});
assertCommand("ipconfig /release", {
  kind: "unknown",
  rawInput: "ipconfig /release",
});
assertCommand("ping 192.168.1.2", {
  kind: "unknown",
  rawInput: "ping 192.168.1.2",
});
assertCommand("nslookup example.com", {
  kind: "unknown",
  rawInput: "nslookup example.com",
});

assertCommand("start", { kind: "start", readOnly: false });
assertCommand("check wifi", { kind: "check_wifi_status", readOnly: false });
assertCommand("wifi check", { kind: "check_wifi_status", readOnly: false });
assertCommand("check wifi / ignored", {
  kind: "check_wifi_status",
  readOnly: false,
});