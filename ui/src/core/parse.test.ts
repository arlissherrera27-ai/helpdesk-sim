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
  ["test_website_access", "test_website_access"],
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
assertCommand("ping 192.168.1.60", {
  kind: "unknown",
  rawInput: "ping 192.168.1.60",
});
assertCommand("nslookup google.com 1.1.1.1", {
  kind: "unknown",
  rawInput: "nslookup google.com 1.1.1.1",
});
assertCommand("nslookup portal.office.example", { kind: "nslookup", readOnly: false });
assertCommand("ipconfig /displaydns", { kind: "ipconfig_displaydns", readOnly: false });
assertCommand("ipconfig /flushdns", { kind: "ipconfig_flushdns", readOnly: false });
assertCommand("ping portal.office.example", { kind: "ping_portal_hostname", readOnly: false });
assertCommand("nslookup wrong.office.example", { kind: "unknown", rawInput: "nslookup wrong.office.example" });
assertCommand("ping wrong.office.example", { kind: "unknown", rawInput: "ping wrong.office.example" });
assertCommand("nslookup example.com", {
  kind: "unknown",
  rawInput: "nslookup example.com",
});

assertCommand("test_printing", { kind: "test_printing", readOnly: false });
assertCommand("check_print_queue", { kind: "check_print_queue", readOnly: false });
assertCommand("check_printer_port", { kind: "check_printer_port", readOnly: false });
assertCommand("check_printer_physical_status", { kind: "check_printer_physical_status", readOnly: false });
assertCommand("check_printer_network_configuration", { kind: "check_printer_network_configuration", readOnly: false });
assertCommand("correct_printer_port_configuration", { kind: "correct_printer_port_configuration", readOnly: false });
assertCommand("reconnect_printer_ethernet", { kind: "unknown", rawInput: "reconnect_printer_ethernet" });
assertCommand("confirm_user_resolution", { kind: "confirm_user_resolution", readOnly: false });
assertCommand("ping 192.168.1.50", { kind: "ping_application_server", readOnly: false });
assertCommand("review_account_lockout_events", { kind: "review_account_lockout_events", readOnly: false });
assertCommand("check_windows_credential_manager", { kind: "check_windows_credential_manager", readOnly: false });
assertCommand("remove_outdated_credential", { kind: "remove_outdated_credential", readOnly: false });
assertCommand("test_affected_network_resource", { kind: "test_affected_network_resource", readOnly: false });
assertCommand("Test-NetConnection 192.168.1.50 -Port 443", { kind: "test_tcp_port_443", readOnly: false });
assertCommand("Test-NetConnection 192.168.1.50 -Port 8443", { kind: "test_tcp_port_8443", readOnly: false });
assertCommand("confirm employee identity", { kind: "verify_identity", readOnly: false });
assertCommand("Check workstation performance", { kind: "test_performance", readOnly: false });
assertCommand("Retest computer speed", { kind: "test_performance", readOnly: false });
assertCommand("Reboot computer", { kind: "restart_workstation", readOnly: false });
assertCommand("Open This PC", { kind: "check_disk_space", readOnly: false });
assertCommand("Ctrl + Shift + Esc", { kind: "inspect_task_manager", readOnly: false });
assertCommand("resmon.exe", { kind: "inspect_resource_monitor", readOnly: false });
assertCommand("Open KB-206", { kind: "review_application_support_information", readOnly: false });
assertCommand("Close Company Sync Tool", { kind: "safely_close_application", readOnly: false });
assertCommand("Install Company Sync Tool 2.4.2", { kind: "install_software_update", readOnly: false });
assertCommand("Verify Company Sync Tool version", { kind: "check_software_version", readOnly: false });
assertCommand("Verify memory and disk activity", { kind: "verify_system_resource_utilization", readOnly: false });
assertCommand("open_reporting_config.ini", { kind: "open_reporting_config_ini", readOnly: false });
assertCommand("netstat -ano | findstr :8080", { kind: "inspect_tcp_8080_listener", readOnly: false });
assertCommand('tasklist /FI "PID eq 4820"', { kind: "identify_report_preview_process", readOnly: false });
assertCommand('tasklist /FI "PID eq 6132"', { kind: "identify_company_reporting_process", readOnly: false });
assertCommand("Test-NetConnection 192.168.1.99 -Port 8443", { kind: "unknown", rawInput: "Test-NetConnection 192.168.1.99 -Port 8443" });
assertCommand("Test-NetConnection 192.168.1.50 -Port 8080", { kind: "unknown", rawInput: "Test-NetConnection 192.168.1.50 -Port 8080" });
assertCommand("start", { kind: "start", readOnly: false });
assertCommand("check wifi", { kind: "check_wifi_status", readOnly: false });
assertCommand("wifi check", { kind: "check_wifi_status", readOnly: false });
assertCommand("check wifi / ignored", {
  kind: "check_wifi_status",
  readOnly: false,
});