// src/core/scenarios.ts
// Domain source of truth for valid scenario IDs.

export const SCENARIO_IDS = [
  // ACCOUNT / ACCESS
  "password_reset",
  "password_reset_recovery_email_never_arrives",
  "password_reset_recovery_email_outdated",
  "account_lockout",
  "vpn_access_issue",
  "vpn_mfa_dependency_missing",
  "mfa_code_not_working",
  "permissions_denied",
  "shared_drive_access_issue",
  "shared_drive_group_membership_missing",
  "cannot_install_software",

  // EMAIL
  "email_not_sending",
  "not_receiving_email",
  "mailbox_full",
  "email_login_issue",
  "email_client_not_syncing",
  "attachment_too_large",
  "shared_mailbox_missing",

  // NETWORK / CONNECTIVITY
  "cannot_connect_wifi",
  "internet_no_access",
  "slow_network_connection",
  "ethernet_not_connected",

  // FILES / STORAGE
  "disk_space_full",
  "network_drive_missing",
  "network_drive_vpn_required_first",
  "cannot_open_file",
  "folder_access_missing",

  // DEVICE / PERFORMANCE
  "too_many_apps_running",
  "low_memory",
  "browser_running_slow",

  // HARDWARE / PERIPHERALS
  "printer_not_working",
  "mouse_keyboard_not_working",
  "microphone_not_working",
  "webcam_not_working",
  "second_monitor_not_detected",

  // SOFTWARE / APPLICATIONS
  "software_app_not_opening",
  "software_app_license_not_assigned",
  "application_crash",
  "software_update_required",
] as const;

export type ScenarioId = (typeof SCENARIO_IDS)[number];

export const SCENARIO_LABELS: Record<ScenarioId, string> = {
  // ACCOUNT / ACCESS
  password_reset: "Password Reset",
  password_reset_recovery_email_never_arrives:
    "Password Reset: Recovery Email Never Arrives",
  password_reset_recovery_email_outdated:
    "Password Reset: Recovery Email Outdated",
  account_lockout: "Account Lockout",
  vpn_access_issue: "VPN Access Issue",
  vpn_mfa_dependency_missing: "VPN Access: MFA Dependency Missing",
  mfa_code_not_working: "MFA (Multi-Factor Authentication) Code Not Working",
  permissions_denied: "Permissions Denied",
  shared_drive_access_issue: "Cannot Access Shared Drive",
  shared_drive_group_membership_missing:
    "Shared Drive Access: Group Membership Missing",
  cannot_install_software: "Cannot Install Software",

  // EMAIL
  email_not_sending: "Email Not Sending",
  not_receiving_email: "Email Not Receiving",
  mailbox_full: "Mailbox Full",
  email_login_issue: "Email Login Issue",
  email_client_not_syncing: "Email Client Not Syncing",
  attachment_too_large: "Attachment Too Large",
  shared_mailbox_missing: "Shared Mailbox Missing",

  // NETWORK / CONNECTIVITY
  cannot_connect_wifi: "Cannot Connect to WiFi",
  internet_no_access: "Internet No Access",
  slow_network_connection: "Slow Network Connection",
  ethernet_not_connected: "Ethernet Not Connected",

  // FILES / STORAGE
  disk_space_full: "Disk Space Full",
  network_drive_missing: "Network Drive Missing",
  network_drive_vpn_required_first:
    "Network Drive Missing: VPN Required First",
  cannot_open_file: "Cannot Open File",
  folder_access_missing: "Folder Access Missing",

  // DEVICE / PERFORMANCE
  too_many_apps_running: "Too Many Apps Running",
  low_memory: "Low Memory",
  browser_running_slow: "Browser Running Slow",

  // HARDWARE / PERIPHERALS
  printer_not_working: "Printer Not Working",
  mouse_keyboard_not_working: "Mouse / Keyboard Not Working",
  microphone_not_working: "Microphone Not Working",
  webcam_not_working: "Webcam Not Working",
  second_monitor_not_detected: "Second Monitor Not Detected",

  // SOFTWARE / APPLICATIONS
  software_app_not_opening: "Software App Won’t Open",
  software_app_license_not_assigned:
    "Software App Won’t Open: License Not Assigned",
  application_crash: "Application Crash",
  software_update_required: "Software Update Required",
};
// SCENARIO_LABELS = (map id → clean display label)

export function isValidScenarioId(id: string): id is ScenarioId {
  return (SCENARIO_IDS as readonly string[]).includes(id);
}