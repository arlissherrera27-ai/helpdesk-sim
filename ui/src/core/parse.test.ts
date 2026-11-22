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
  ["nslookup google.com 8.8.8.8", "nslookup_alternative_dns"],
  ["test_website_access", "test_website_access"],
  ["escalate_dns_issue", "escalate_dns_issue"],
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
assertCommand("nslookup google.com 1.1.1.1", {
  kind: "unknown",
  rawInput: "nslookup google.com 1.1.1.1",
});
assertCommand("nslookup example.com", {
  kind: "unknown",
  rawInput: "nslookup example.com",
});

assertCommand("test_printing", { kind: "test_printing", readOnly: false });
assertCommand("check_print_queue", { kind: "check_print_queue", readOnly: false });
assertCommand("check_printer_port", { kind: "check_printer_port", readOnly: false });
assertCommand("check_printer_physical_status", { kind: "check_printer_physical_status", readOnly: false });
assertCommand("reconnect_printer_ethernet", { kind: "reconnect_printer_ethernet", readOnly: false });
assertCommand("confirm_user_resolution", { kind: "confirm_user_resolution", readOnly: false });
assertCommand("ping 192.168.1.50", { kind: "ping_application_server", readOnly: false });
assertCommand("start", { kind: "start", readOnly: false });
assertCommand("check wifi", { kind: "check_wifi_status", readOnly: false });
assertCommand("wifi check", { kind: "check_wifi_status", readOnly: false });
assertCommand("check wifi / ignored", {
  kind: "check_wifi_status",
  readOnly: false,
});