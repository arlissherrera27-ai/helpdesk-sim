// src/core/scenarios.ts
// Domain source of truth for valid scenario IDs.

export const SCENARIO_IDS = [
  // ACCOUNT / ACCESS
  "password_reset",
  "password_reset_recovery_email_never_arrives",
  "password_reset_recovery_email_outdated",
  "account_lockout",
  "account_lockout_saved_credentials",
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
  "email_not_sending_outbox",
  "not_receiving_email",
  "not_receiving_email_inbox_rule_redirecting",
  "mailbox_full",
  "mailbox_full_archive_policy_not_applied",
  "email_login_issue",
  "email_login_cached_credentials",
  "email_client_not_syncing",
  "email_client_not_syncing_cached_session_stuck",
  "attachment_too_large",
  "shared_mailbox_missing",
  "shared_mailbox_outlook_profile_not_updated",
  "shared_mailbox_automapping_missing",
  "email_application_will_not_open",
  "email_client_corrupted_profile",

  // NETWORK / CONNECTIVITY
  "cannot_connect_wifi",
  "cannot_connect_wifi_corrupted_profile",
  "internet_no_access",
  "internet_no_access_proxy",
  "slow_network_connection",
  "ethernet_not_connected",

  // FILES / STORAGE
  "disk_space_full",
  "network_drive_missing",
  "network_drive_vpn_required_first",
  "cannot_open_file",
  "folder_access_missing",
  "folder_access_required_security_group_missing",

  // DEVICE / PERFORMANCE
  "too_many_apps_running",
  "low_memory",
  "browser_running_slow",
  "browser_running_slow_extension",

  // HARDWARE / PERIPHERALS
  "printer_not_working",
  "printer_wrong_default_printer",
  "mouse_keyboard_not_working",
  "microphone_not_working",
  "microphone_wrong_recording_device",
  "webcam_not_working",
  "second_monitor_not_detected",
  "second_monitor_display_disabled",
  "audio_not_working",

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