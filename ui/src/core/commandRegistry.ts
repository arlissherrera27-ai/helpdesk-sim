// commandRegistry.ts
// Single source of truth for command meaning.
// No execution, no state, no policy logic.

import type { Command } from "./types"; // adjust path if your folder differs

type KnownVerb = Exclude<Command["kind"], "unknown">;

// Registry stores *verb identity* for known commands.
// Arg-bearing commands are still validated here by verb, but constructed in parse.ts.
const registry: Record<string, KnownVerb> = {
  // Mutating
  start: "start",
  restart: "restart",
  quit: "quit",
  debug: "debug",
  select: "select",
  // SHARED
  verify_identity: "verify_identity",

  // ACCOUNT / ACCESS
  send_reset_code: "send_reset_code",
  verify_alternate_contact: "verify_alternate_contact",
  update_recovery_email: "update_recovery_email",
  confirm_reset: "confirm_reset",
  set_new_password: "set_new_password",
  test_sign_in: "test_sign_in",
  verify_login: "test_sign_in",
  confirm_account_access: "test_sign_in",

  request_unlock: "request_unlock",
  confirm_unlock: "confirm_unlock",

  check_vpn_access: "check_vpn_access",
  enable_vpn_access: "enable_vpn_access",
  confirm_connection: "confirm_connection",
  confirm_vpn_connection: "confirm_connection",
  test_vpn_connection: "confirm_connection",

  check_mfa_status: "check_mfa_status",
  reset_mfa_method: "reset_mfa_method",
  test_mfa_login: "test_mfa_login",

  check_user_permissions: "check_user_permissions",
  grant_required_permission: "grant_required_permission",
  test_permission_access: "test_permission_access",

  check_shared_drive_permissions: "check_shared_drive_permissions",
  grant_shared_drive_access: "grant_shared_drive_access",
  add_user_to_group: "add_user_to_group",
  test_shared_drive_access: "test_shared_drive_access",

  check_install_permissions: "check_install_permissions",
  grant_install_permissions: "grant_install_permissions",
  test_software_install: "test_software_install",

  // EMAIL
  check_email_status: "check_email_status",
  enable_email_client: "enable_email_client",
  send_test_email: "send_test_email",

  check_mailbox_storage: "check_mailbox_storage",
  archive_old_emails: "archive_old_emails",

  check_email_login_status: "check_email_login_status",
  reset_email_session: "reset_email_session",
  test_email_login: "test_email_login",

  check_sync_settings: "check_sync_settings",
  resync_email_client: "resync_email_client",
  test_email_sync: "test_email_sync",

  check_attachment_size: "check_attachment_size",
  compress_attachment: "compress_attachment",

  check_shared_mailbox_membership: "check_shared_mailbox_membership",
  grant_shared_mailbox_access: "grant_shared_mailbox_access",
  test_shared_mailbox_access: "test_shared_mailbox_access",

  check_inbox_filters: "check_inbox_filters",
  disable_inbox_filter: "disable_inbox_filter",
  resend_reset_code: "resend_reset_code",

  // NETWORK / CONNECTIVITY
  check_wifi_status: "check_wifi_status",
  enable_wifi: "enable_wifi",
  test_connection: "test_connection",

  check_network_status: "check_network_status",
  check_network_adapter: "check_network_adapter",
  restart_network_adapter: "restart_network_adapter",
  test_internet_connection: "test_internet_connection",

  check_network_speed: "check_network_speed",

  check_ethernet_connection: "check_ethernet_connection",
  reconnect_ethernet_cable: "reconnect_ethernet_cable",

  // FILES / STORAGE
  check_disk_space: "check_disk_space",
  clear_temp_files: "clear_temp_files",
  confirm_storage_available: "confirm_storage_available",

  check_network_drive_mapping: "check_network_drive_mapping",
  remap_network_drive: "remap_network_drive",
  test_network_drive_access: "test_network_drive_access",

  check_file_open_error: "check_file_open_error",
  check_file_association: "check_file_association",
  repair_file_association: "repair_file_association",
  test_file_open: "test_file_open",

  check_folder_permissions: "check_folder_permissions",
  grant_folder_access: "grant_folder_access",
  test_folder_access: "test_folder_access",

  // DEVICE / PERFORMANCE
  check_running_apps: "check_running_apps",
  close_unnecessary_apps: "close_unnecessary_apps",
  test_performance: "test_performance",

  check_memory_usage: "check_memory_usage",
  close_memory_heavy_apps: "close_memory_heavy_apps",

  check_browser_extensions: "check_browser_extensions",
  disable_unnecessary_extensions: "disable_unnecessary_extensions",
  test_browser_performance: "test_browser_performance",

  // HARDWARE / PERIPHERALS
  check_printer_status: "check_printer_status",
  restart_printer: "restart_printer",
  print_test_page: "print_test_page",

  check_device_connection: "check_device_connection",
  reconnect_device: "reconnect_device",
  test_input_device: "test_input_device",

  check_microphone_settings: "check_microphone_settings",
  enable_microphone: "enable_microphone",
  test_microphone: "test_microphone",

  check_webcam_settings: "check_webcam_settings",
  enable_webcam: "enable_webcam",
  test_webcam: "test_webcam",

  check_display_connection: "check_display_connection",
  check_display_settings: "check_display_settings",
  detect_second_monitor: "detect_second_monitor",
  test_dual_display: "test_dual_display",

  // SOFTWARE / APPLICATIONS
  check_app_status: "check_app_status",
  restart_application: "restart_application",
  test_application_launch: "test_application_launch",
  check_license_assignment: "check_license_assignment",
  assign_software_license: "assign_software_license",

  check_software_version: "check_software_version",
  install_software_update: "install_software_update",
  // ReadOnly (+ aliases)
  help: "help",
  "?": "help",

  status: "status",
  state: "status",
} as const;

export function lookupCommandDef(token: string): KnownVerb | null {
  return registry[token] ?? null;
}
