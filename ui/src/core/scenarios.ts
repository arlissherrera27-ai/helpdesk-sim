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
  "mfa_code_old_phone_still_registered",
  "permissions_denied",
  "shared_drive_access_issue",
  "shared_drive_group_membership_missing",
  "cannot_install_software",
  "cannot_install_software_admin_approval_required",

  // EMAIL
  "email_not_sending",
  "not_receiving_email",
  "not_receiving_email_inbox_rule_redirecting",
  "mailbox_full",
  "mailbox_full_archive_policy_not_applied",
  "email_login_issue",
  "email_client_not_syncing",
  "email_client_not_syncing_cached_session_stuck",
  "attachment_too_large",
  "shared_mailbox_missing",
  "shared_mailbox_outlook_profile_not_updated",

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
  "printer_wrong_default_printer",
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

export function isValidScenarioId(id: string): id is ScenarioId {
  return (SCENARIO_IDS as readonly string[]).includes(id);
}