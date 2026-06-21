import type { Command } from "./types";
import { lookupCommandDef } from "./commandRegistry";

export const COMMAND_ALIASES: Record<string, string> = {
   // Identity / Authorization
  verify: "verify_identity",
  "verify user": "verify_identity",
  "user verify": "verify_identity",
  "verify identity": "verify_identity",
  "identity verify": "verify_identity",
  "confirm identity": "verify_identity",
  "identity confirm": "verify_identity",
  "confirm user": "verify_identity",
  "user confirm": "verify_identity",
  "confirm account": "verify_identity",
  "account confirm": "verify_identity",
  "confirm id": "verify_identity",
  "id confirm": "verify_identity",
  "verify id": "verify_identity",
  "id verify": "verify_identity",
  "verify account owner": "verify_identity",
  "confirm account owner": "verify_identity",
  "verify requester": "verify_identity",
  "confirm requester": "verify_identity",

  // Password Reset
  "send code": "send_reset_code",
  "code send": "send_reset_code",
  "code send reset": "send_reset_code",
  "send reset code": "send_reset_code",
  "resend_reset_code": "resend_reset_code",
  "resend reset code": "resend_reset_code",
  "resend code": "resend_reset_code",
  "send code again": "resend_reset_code",
  "send reset code again": "resend_reset_code",
  "reset code send": "send_reset_code",
  "send recovery code": "send_reset_code",
  "recovery code send": "send_reset_code",
  "issue reset code": "send_reset_code",
  "reset code issue": "send_reset_code",
  "issue recovery code": "send_reset_code",

  "verify alternate contact": "verify_alternate_contact",
  "confirm alternate contact": "verify_alternate_contact",
  "verify backup contact": "verify_alternate_contact",
  "confirm backup contact": "verify_alternate_contact",
  "verify alternate email": "verify_alternate_contact",
  "confirm alternate email": "verify_alternate_contact",

  "update recovery email": "update_recovery_email",
  "change recovery email": "update_recovery_email",
  "replace recovery email": "update_recovery_email",
  "fix recovery email": "update_recovery_email",
  "update recovery contact": "update_recovery_email",
  "change recovery contact": "update_recovery_email",

  "set password": "set_new_password",
  "password set": "set_new_password",
  "set new password": "set_new_password",
  "new password set": "set_new_password",
  "change password": "set_new_password",
  "password change": "set_new_password",
  "update password": "set_new_password",
  "password update": "set_new_password",

  "test sign in": "test_sign_in",
  "sign in test": "test_sign_in",
  "test signin": "test_sign_in",
  "signin test": "test_sign_in",
  "test login": "test_sign_in",
  "login test": "test_sign_in",
  "verify login": "test_sign_in",
  "login verify": "test_sign_in",
  "confirm login": "test_sign_in",
  "login confirm": "test_sign_in",
  "reset confirm": "confirm_reset",
  "confirm reset": "confirm_reset",
  "confirm password reset": "confirm_reset",
  "password reset confirm": "confirm_reset",
  "complete reset": "confirm_reset",
  "finish reset": "confirm_reset",

    // Email Not Sending — Standard
  "check email status": "check_email_status",
  "email status check": "check_email_status",
  "check email client": "check_email_status",
  "email client check": "check_email_status",
  "check outgoing email": "check_email_status",
  "outgoing email check": "check_email_status",

  "enable email client": "enable_email_client",
  "email client enable": "enable_email_client",
  "bring email client online": "enable_email_client",
  "bring email online": "enable_email_client",
  "turn on email client": "enable_email_client",
  "email client online": "enable_email_client",

  "send test email": "send_test_email",
  "test email send": "send_test_email",
  "send email test": "send_test_email",
  "test outgoing email": "send_test_email",
  "outgoing email test": "send_test_email",

  "check mailbox storage": "check_mailbox_storage",
  "mailbox storage check": "check_mailbox_storage",
  "check mailbox": "check_mailbox_storage",
  "mailbox check": "check_mailbox_storage",

  "archive old emails": "archive_old_emails",
  "old emails archive": "archive_old_emails",
  "archive emails": "archive_old_emails",
  "clear old emails": "archive_old_emails",

  "check sync settings": "check_sync_settings",
  "sync settings check": "check_sync_settings",
  "check email sync": "check_sync_settings",
  "email sync check": "check_sync_settings",

  "resync email client": "resync_email_client",
  "email client resync": "resync_email_client",
  "resync email": "resync_email_client",
  "sync email client": "resync_email_client",

  "test email sync": "test_email_sync",
  "email sync test": "test_email_sync",
  "test sync": "test_email_sync",
  "confirm email sync": "test_email_sync",

  "check shared mailbox membership": "check_shared_mailbox_membership",
  "shared mailbox membership check": "check_shared_mailbox_membership",
  "check shared mailbox": "check_shared_mailbox_membership",
  "shared mailbox check": "check_shared_mailbox_membership",

  "grant shared mailbox access": "grant_shared_mailbox_access",
  "shared mailbox access grant": "grant_shared_mailbox_access",
  "restore shared mailbox access": "grant_shared_mailbox_access",
  "add shared mailbox access": "grant_shared_mailbox_access",

  "test shared mailbox access": "test_shared_mailbox_access",
  "shared mailbox access test": "test_shared_mailbox_access",
  "verify shared mailbox access": "test_shared_mailbox_access",
  "confirm shared mailbox access": "test_shared_mailbox_access",

  "check email login status": "check_email_login_status",
  "email login status check": "check_email_login_status",
  "check email login": "check_email_login_status",
  "email login check": "check_email_login_status",

  "reset email session": "reset_email_session",
  "email session reset": "reset_email_session",
  "reset mailbox session": "reset_email_session",

  "test email login": "test_email_login",
  "email login test": "test_email_login",
  "confirm email login": "test_email_login",
  "verify email login": "test_email_login",

  // Password Reset Operational Challenge — Recovery Email Never Arrives
  "check filters": "check_inbox_filters",
  "check inbox filters": "check_inbox_filters",
  "inbox filters check": "check_inbox_filters",
  "check email filters": "check_inbox_filters",
  "email filters check": "check_inbox_filters",

  "disable filter": "disable_inbox_filter",
  "disable inbox filter": "disable_inbox_filter",
  "turn off filter": "disable_inbox_filter",
  "remove inbox filter": "disable_inbox_filter",
  "fix inbox filter": "disable_inbox_filter",

    // Account Lockout
  "request unlock": "request_unlock",
  "unlock request": "request_unlock",
  "unlock requested": "request_unlock",

  "confirm unlock": "confirm_unlock",
  "unlock confirm": "confirm_unlock",
  "unlock confirmed": "confirm_unlock",

    // VPN Access
  "check vpn": "check_vpn_access",
  "vpn check": "check_vpn_access",
  "check vpn access": "check_vpn_access",
  "vpn access check": "check_vpn_access",
  "check virtual private network": "check_vpn_access",
  "virtual private network check": "check_vpn_access",

  "enable vpn": "enable_vpn_access",
  "vpn enable": "enable_vpn_access",
  "enable vpn access": "enable_vpn_access",
  "vpn access enable": "enable_vpn_access",
  "grant vpn access": "enable_vpn_access",
  "assign vpn access": "enable_vpn_access",

  // MFA / Multi-Factor Authentication
  "check mfa": "check_mfa_status",
  "mfa check": "check_mfa_status",
  "check multi factor authentication": "check_mfa_status",
  "multi factor authentication check": "check_mfa_status",
  "check multi factor": "check_mfa_status",
  "multi factor check": "check_mfa_status",
  "check 2fa": "check_mfa_status",
  "2fa check": "check_mfa_status",
  "check mfa status": "check_mfa_status",
  "mfa status check": "check_mfa_status",
  "check mfa code": "check_mfa_status",

  "reset mfa": "reset_mfa_method",
  "mfa reset": "reset_mfa_method",
  "reset mfa method": "reset_mfa_method",
  "mfa method reset": "reset_mfa_method",
  "reset multi factor authentication": "reset_mfa_method",
  "reset multi factor": "reset_mfa_method",
  "reset 2fa": "reset_mfa_method",
  "fix mfa": "reset_mfa_method",
  "mfa fix": "reset_mfa_method",

  "configure mfa": "reset_mfa_method",
  "mfa configure": "reset_mfa_method",
  "setup mfa": "reset_mfa_method",
  "mfa setup": "reset_mfa_method",
  "enable mfa": "reset_mfa_method",
  "mfa enable": "reset_mfa_method",

  "test mfa": "test_mfa_login",
  "mfa test": "test_mfa_login",
  "test mfa login": "test_mfa_login",
  "mfa login test": "test_mfa_login",
  "test mfa code": "test_mfa_login",
  "test multi factor authentication": "test_mfa_login",
  "test multi factor": "test_mfa_login",
  "test 2fa": "test_mfa_login",

  // Disk / Storage
  "check disk space": "check_disk_space",
  "disk space check": "check_disk_space",
  "check space": "check_disk_space",
  "space check": "check_disk_space",

  "clean temp files": "clear_temp_files",
  "clean temporary files": "clear_temp_files",
  "clear temp files": "clear_temp_files",
  "clear temporary files": "clear_temp_files",
  "remove temp files": "clear_temp_files",
  "remove temporary files": "clear_temp_files",
  "delete temp files": "clear_temp_files",
  "delete temporary files": "clear_temp_files",

  "confirm storage": "confirm_storage_available",
  "storage confirm": "confirm_storage_available",
  "check storage available": "confirm_storage_available",
  "check storage availabilty": "confirm_storage_available",
  "check storage availability": "confirm_storage_available",
  "storage check": "confirm_storage_available",
  "storage usage check": "confirm_storage_available",
  "verify storage": "confirm_storage_available",
  "storage verify": "confirm_storage_available",
  "confirm disk space": "confirm_storage_available",

  // WiFi
  "check wifi": "check_wifi_status",
  "wifi check": "check_wifi_status",
  "check wireless status": "check_wifi_status",
  "wireless status check": "check_wifi_status",
  "enable wifi": "enable_wifi",
  "wifi enable": "enable_wifi",
  "turn on wifi": "enable_wifi",
  "turn wifi on": "enable_wifi",
  "enable wireless": "enable_wifi",

  "test wifi": "test_connection",
  "wifi test": "test_connection",
  "test internet": "test_connection",
  "internet test": "test_connection",
  "confirm internet": "test_connection",

  "test connection": "confirm_connection",
  "connection test": "confirm_connection",
  "test_connection": "confirm_connection",
  "confirm connection": "confirm_connection",
  "test vpn connection": "confirm_connection",
  "vpn connection test": "confirm_connection",
  "confirm vpn connection": "confirm_connection",

    // Internet / Network Adapter
  "check network status": "check_network_status",
  "network status check": "check_network_status",
  "check internet status": "check_network_status",
  "internet status check": "check_network_status",

  "check network adapter": "check_network_adapter",
  "network adapter check": "check_network_adapter",
  "check adapter": "check_network_adapter",
  "adapter check": "check_network_adapter",

  "restart network adapter": "restart_network_adapter",
  "network adapter restart": "restart_network_adapter",
  "restart adapter": "restart_network_adapter",
  "adapter restart": "restart_network_adapter",

  "test internet connection": "test_internet_connection",
  "internet connection test": "test_internet_connection",
  "test internet access": "test_internet_connection",
  "confirm internet access": "test_internet_connection",

  // Network Speed
  "check speed": "check_network_speed",
  "speed check": "check_network_speed",
  "check network speed": "check_network_speed",
  "network speed check": "check_network_speed",
  "test internet speed": "check_network_speed",
  "internet speed test": "check_network_speed",
  "run speed test": "check_network_speed",
  "speed test": "check_network_speed",

  // Ethernet
  "check ethernet": "check_ethernet_connection",
  "ethernet check": "check_ethernet_connection",
  "check ethernet cable": "check_ethernet_connection",
  "ethernet cable check": "check_ethernet_connection",
  "inspect ethernet": "check_ethernet_connection",
  "inspect cable": "check_ethernet_connection",

  "reconnect ethernet": "reconnect_ethernet_cable",
  "ethernet reconnect": "reconnect_ethernet_cable",
  "reconnect cable": "reconnect_ethernet_cable",
  "cable reconnect": "reconnect_ethernet_cable",
  "plug ethernet back in": "reconnect_ethernet_cable",
  "plug cable back in": "reconnect_ethernet_cable",

  // Network Drive
  "check network drive": "check_network_drive_mapping",
  "network drive check": "check_network_drive_mapping",
  "check drive mapping": "check_network_drive_mapping",
  "drive mapping check": "check_network_drive_mapping",

  "remap drive": "remap_network_drive",
  "drive remap": "remap_network_drive",
  "map network drive": "remap_network_drive",
  "network drive map": "remap_network_drive",
  "remap network drive": "remap_network_drive",
  "map drive": "remap_network_drive",
  "drive map": "remap_network_drive",
  "restore network drive": "remap_network_drive",
  "reconnect network drive": "remap_network_drive",

  "test network drive": "test_network_drive_access",
  "network drive test": "test_network_drive_access",
  "verify network drive": "test_network_drive_access",
  "confirm network drive": "test_network_drive_access",

  // Shared Drive Access
  "review shared drive access": "check_shared_drive_permissions",
  "review shared drive permissions": "check_shared_drive_permissions",
  "check shared drive": "check_shared_drive_permissions",
  "shared drive check": "check_shared_drive_permissions",
  "check shared drive permissions": "check_shared_drive_permissions",
  "shared drive permissions check": "check_shared_drive_permissions",
  "check drive permissions": "check_shared_drive_permissions",
  "drive permissions check": "check_shared_drive_permissions",

  "grant shared drive access": "grant_shared_drive_access",
  "shared drive access grant": "grant_shared_drive_access",
  "restore shared drive access": "grant_shared_drive_access",
  "add shared drive access": "grant_shared_drive_access",

  "check shared drive access": "test_shared_drive_access",
  "shared drive access check": "test_shared_drive_access",
  "test shared drive": "test_shared_drive_access",
  "shared drive test": "test_shared_drive_access",
  "test shared drive access": "test_shared_drive_access",
  "shared drive access test": "test_shared_drive_access",
  "verify shared drive access": "test_shared_drive_access",
  "confirm shared drive access": "test_shared_drive_access",

  // User Permissions
  "check permissions": "check_user_permissions",
  "permissions check": "check_user_permissions",
  "check user permissions": "check_user_permissions",
  "user permissions check": "check_user_permissions",
  "verify permissions": "check_user_permissions",
  "review permissions": "check_user_permissions",

  "add user to group": "add_user_to_group",
  "user add to group": "add_user_to_group",
  "add group membership": "add_user_to_group",
  "group membership add": "add_user_to_group",
  "restore group membership": "add_user_to_group",
  "group membership restore": "add_user_to_group",
  "add to access group": "add_user_to_group",
  "access group add": "add_user_to_group",

  "grant permission": "grant_required_permission",
  "permission grant": "grant_required_permission",
  "grant required permission": "grant_required_permission",
  "restore permission": "grant_required_permission",
  "grant access": "grant_required_permission",
  "restore access": "grant_required_permission",

  "test permission": "test_permission_access",
  "permission test": "test_permission_access",
  "test permission access": "test_permission_access",
  "permission access test": "test_permission_access",
  "verify permission access": "test_permission_access",
  "confirm permission access": "test_permission_access",

  // Folder Access
  "check folder permissions": "check_folder_permissions",
  "folder permissions check": "check_folder_permissions",
  "check folder access": "check_folder_permissions",
  "folder access check": "check_folder_permissions",
  "review folder access": "check_folder_permissions",

  "grant folder access": "grant_folder_access",
  "folder access grant": "grant_folder_access",
  "restore folder access": "grant_folder_access",
  "grant folder permission": "grant_folder_access",

  "test folder access": "test_folder_access",
  "folder access test": "test_folder_access",
  "verify folder access": "test_folder_access",
  "confirm folder access": "test_folder_access",

  // File Association
  "check file open error": "check_file_open_error",
  "file open error check": "check_file_open_error",
  "check open error": "check_file_open_error",
  "open error check": "check_file_open_error",

  "check associated file": "check_file_association",
  "association file check": "check_file_association",
  "check file association": "check_file_association",
  "file association check": "check_file_association",
  "check default app": "check_file_association",

  "repair file": "repair_file_association",
  "file repair": "repair_file_association",
  "repair file association": "repair_file_association",
  "fix file association": "repair_file_association",
  "repair default app": "repair_file_association",
  "fix default app": "repair_file_association",

  "test file": "test_file_open",
  "file test": "test_file_open",
  "open file": "test_file_open",
  "file open": "test_file_open",
  "test file open": "test_file_open",
  "verify file opens": "test_file_open",
  "confirm file opens": "test_file_open",

  // Printer
  "check printer": "check_printer_status",
  "printer check": "check_printer_status",
  "restart printer": "restart_printer",
  "printer restart": "restart_printer",
  "test printer": "print_test_page",
  "printer test": "print_test_page",
  "print test": "print_test_page",
  "print test page": "print_test_page",
  "run print test": "print_test_page",

  // Performance / Memory
  "check memory": "check_memory_usage",
  "memory check": "check_memory_usage",
  "check memory usage": "check_memory_usage",
  "memory usage check": "check_memory_usage",

  "close heavy apps": "close_memory_heavy_apps",
  "heavy apps close": "close_memory_heavy_apps",
  "close memory apps": "close_memory_heavy_apps",
  "close large apps": "close_memory_heavy_apps",
  "close resource heavy apps": "close_memory_heavy_apps",

  "test performance": "test_performance",
  "performance test": "test_performance",
  "test system performance": "test_performance",
  "confirm performance": "test_performance",

  // Running Apps
  "check running apps": "check_running_apps",
  "running apps check": "check_running_apps",
  "close unnecessary apps": "close_unnecessary_apps",
  "close extra apps": "close_unnecessary_apps",

  // Application
  "check application": "check_app_status",
  "application check": "check_app_status",
  "check app": "check_app_status",
  "app check": "check_app_status",
  "check application status": "check_app_status",
  "check app status": "check_app_status",

  "restart app": "restart_application",
  "app restart": "restart_application",
  "restart application": "restart_application",
  "restart app process": "restart_application",
  "app process restart": "restart_application",
  "application restart": "restart_application",
  "reopen app": "restart_application",
  "reopen application": "restart_application",

  "test application": "test_application_launch",
  "application test": "test_application_launch",
  "test app": "test_application_launch",
  "app test": "test_application_launch",
  "launch application": "test_application_launch",
  "launch app": "test_application_launch",
  "verify app opens": "test_application_launch",
  "confirm app opens": "test_application_launch",

  "check license": "check_license_assignment",
  "license check": "check_license_assignment",
  "check license assignment": "check_license_assignment",
  "license assignment check": "check_license_assignment",
  "check software license": "check_license_assignment",
  "software license check": "check_license_assignment",
  "check app license": "check_license_assignment",
  "app license check": "check_license_assignment",

  "assign license": "assign_software_license",
  "license assign": "assign_software_license",
  "assign software license": "assign_software_license",
  "software license assign": "assign_software_license",
  "assign app license": "assign_software_license",
  "app license assign": "assign_software_license",
  "add software license": "assign_software_license",
  "add app license": "assign_software_license",

  "check software version": "check_software_version",
  "software version check": "check_software_version",
  "check version": "check_software_version",
  "version check": "check_software_version",
  "check update": "check_software_version",
  "update check": "check_software_version",

  "install update": "install_software_update",
  "update install": "install_software_update",
  "install software update": "install_software_update",
  "update software": "install_software_update",
  "apply update": "install_software_update",
  "install patch": "install_software_update",

  // Mouse / Keyboard
  "check device": "check_device_connection",
  "device check": "check_device_connection",
  "check device connection": "check_device_connection",
  "device connection check": "check_device_connection",
  "check mouse": "check_device_connection",
  "mouse check": "check_device_connection",
  "check keyboard": "check_device_connection",
  "keyboard check": "check_device_connection",

  "reconnect device": "reconnect_device",
  "device reconnect": "reconnect_device",
  "reconnect mouse": "reconnect_device",
  "reconnect keyboard": "reconnect_device",

  "test device": "test_input_device",
  "device test": "test_input_device",
  "test input": "test_input_device",
  "input test": "test_input_device",
  "test mouse keyboard": "test_input_device",
  "test mouse": "test_input_device",
  "test keyboard": "test_input_device",

  // Browser
  "check extensions": "check_browser_extensions",
  "extensions check": "check_browser_extensions",
  "check browser extensions": "check_browser_extensions",
  "browser extensions check": "check_browser_extensions",

  "disable extensions": "disable_unnecessary_extensions",
  "extensions disable": "disable_unnecessary_extensions",
  "disable unnecessary extensions": "disable_unnecessary_extensions",
  "turn off extensions": "disable_unnecessary_extensions",
  "remove extensions": "disable_unnecessary_extensions",

  "test browser": "test_browser_performance",
  "browser test": "test_browser_performance",
  "test browser performance": "test_browser_performance",
  "verify browser": "test_browser_performance",
  "confirm browser performance": "test_browser_performance",

  // Software Install Permissions
  "check install permissions": "check_install_permissions",
  "install permissions check": "check_install_permissions",
  "check software install permissions": "check_install_permissions",
  "software install permissions check": "check_install_permissions",

  "grant install permissions": "grant_install_permissions",
  "install permissions grant": "grant_install_permissions",
  "grant software install permissions": "grant_install_permissions",
  "software install permissions grant": "grant_install_permissions",

  "test software install": "test_software_install",
  "software install test": "test_software_install",
  "test install": "test_software_install",
  "install test": "test_software_install",

  // Attachment Too Large
  "check attachment": "check_attachment_size",
  "attachment check": "check_attachment_size",
  "check attachment size": "check_attachment_size",
  "attachment size check": "check_attachment_size",
  "check file size": "check_attachment_size",

  "compress file": "compress_attachment",
  "file compress": "compress_attachment",
  "compress attachment": "compress_attachment",
  "attachment compress": "compress_attachment",
  "reduce file size": "compress_attachment",
  "reduce attachment size": "compress_attachment",

  // Monitor / Display
  "check display connection": "check_display_connection",
  "display connection check": "check_display_connection",
  "check monitor connection": "check_display_connection",
  "monitor connection check": "check_display_connection",

  "check display": "check_display_settings",
  "display check": "check_display_settings",
  "check display settings": "check_display_settings",
  "display settings check": "check_display_settings",
  "check monitor": "check_display_settings",
  "monitor check": "check_display_settings",

  "detect monitor": "detect_second_monitor",
  "monitor detect": "detect_second_monitor",
  "detect second monitor": "detect_second_monitor",
  "detect display": "detect_second_monitor",
  "display detect": "detect_second_monitor",
  "find second monitor": "detect_second_monitor",

  "test monitor": "test_dual_display",
  "monitor test": "test_dual_display",
  "test dual display": "test_dual_display",
  "dual display test": "test_dual_display",
  "verify second monitor": "test_dual_display",
  "confirm second monitor": "test_dual_display",

  // Microphone / Webcam
  "check microphone": "check_microphone_settings",
  "microphone check": "check_microphone_settings",
  "check mic": "check_microphone_settings",
  "mic check": "check_microphone_settings",

  "enable microphone": "enable_microphone",
  "microphone enable": "enable_microphone",
  "enable mic": "enable_microphone",
  "mic enable": "enable_microphone",
  "turn on microphone": "enable_microphone",
  "turn on mic": "enable_microphone",

  "test mic": "test_microphone",
  "mic test": "test_microphone",
  "test microphone": "test_microphone",
  "microphone test": "test_microphone",
  "verify mic": "test_microphone",
  "verify microphone": "test_microphone",
  "confirm mic": "test_microphone",
  "confirm microphone": "test_microphone",

  "check webcam": "check_webcam_settings",
  "webcam check": "check_webcam_settings",

  "enable webcam": "enable_webcam",
  "webcam enable": "enable_webcam",
  "turn on webcam": "enable_webcam",

  "test webcam": "test_webcam",
  "webcam test": "test_webcam",
  "verify webcam": "test_webcam",
  "confirm webcam": "test_webcam",
};

// Parser only labels intent.
// It does not decide legitimacy.
export function parseCommand(inputRaw: string): Command {
  const trimmed = inputRaw.trim();
  const lower = trimmed.toLowerCase();
  const aliasedLower = COMMAND_ALIASES[lower] ?? lower;

  if (lower.length === 0) {
    return { kind: "unknown", rawInput: inputRaw };
  }

  // Split into: verb + rest
  const [verb, ...rest] = aliasedLower.split(/\s+/);
  const normalizedArgs = rest.join("_");

  // Special-case: select accepts a multi-word scenario name and normalizes it
  if (verb === "select") {
    const scenario_id = normalizedArgs;
    if (!scenario_id) {
      return { kind: "unknown", rawInput: inputRaw };
    }
    return { kind: "select", readOnly: false, scenario_id };
  }

  // For non-select commands, normalize the full input so
  // "confirm reset" becomes "confirm_reset"
  const normalizedVerb = aliasedLower.replace(/\s+/g, "_");
  const verbKind = lookupCommandDef(normalizedVerb);

  if (!verbKind) {
    return { kind: "unknown", rawInput: inputRaw };
  }

  // Construct command for non-arg verbs
  switch (verbKind) {
    case "start":
      return { kind: "start", readOnly: false };
    case "restart":
      return { kind: "restart", readOnly: false };
    case "quit":
      return { kind: "quit", readOnly: false };
    case "verify_identity":
      return { kind: "verify_identity", readOnly: false };
    case "send_reset_code":
      return { kind: "send_reset_code", readOnly: false };

    case "verify_alternate_contact":
      return { kind: "verify_alternate_contact", readOnly: false };

    case "update_recovery_email":
      return { kind: "update_recovery_email", readOnly: false };

    case "confirm_reset":
      return { kind: "confirm_reset", readOnly: false };
    case "set_new_password":
      return { kind: "set_new_password", readOnly: false };
    case "test_sign_in":
      return { kind: "test_sign_in", readOnly: false };
    case "request_unlock":
      return { kind: "request_unlock", readOnly: false };
    case "confirm_unlock":
      return { kind: "confirm_unlock", readOnly: false };
    case "check_vpn_access":
      return { kind: "check_vpn_access", readOnly: false };
    case "enable_vpn_access":
      return { kind: "enable_vpn_access", readOnly: false };
    case "confirm_connection":
      return { kind: "confirm_connection", readOnly: false };
    case "check_email_status":
      return { kind: "check_email_status", readOnly: false };
    case "enable_email_client":
      return { kind: "enable_email_client", readOnly: false };
    case "send_test_email":
      return { kind: "send_test_email", readOnly: false };
    case "check_mailbox_storage":
      return { kind: "check_mailbox_storage", readOnly: false };
    case "archive_old_emails":
      return { kind: "archive_old_emails", readOnly: false };
    case "check_email_login_status":
     return { kind: "check_email_login_status", readOnly: false };
    case "reset_email_session":
     return { kind: "reset_email_session", readOnly: false };
    case "test_email_login":
     return { kind: "test_email_login", readOnly: false };
    case "check_sync_settings":
     return { kind: "check_sync_settings", readOnly: false };
    case "resync_email_client":
     return { kind: "resync_email_client", readOnly: false };
    case "test_email_sync":
     return { kind: "test_email_sync", readOnly: false };
    case "check_attachment_size":
     return { kind: "check_attachment_size", readOnly: false };
    case "compress_attachment":
     return { kind: "compress_attachment", readOnly: false };
    case "check_shared_mailbox_membership":
      return { kind: "check_shared_mailbox_membership", readOnly: false };
    case "grant_shared_mailbox_access":
      return { kind: "grant_shared_mailbox_access", readOnly: false };
    case "test_shared_mailbox_access":
      return { kind: "test_shared_mailbox_access", readOnly: false }; 
    case "check_inbox_filters":
      return { kind: "check_inbox_filters", readOnly: false };
    case "disable_inbox_filter":
      return { kind: "disable_inbox_filter", readOnly: false };
    case "resend_reset_code":
      return { kind: "resend_reset_code", readOnly: false };
    case "check_wifi_status":
      return { kind: "check_wifi_status", readOnly: false };
    case "enable_wifi":
      return { kind: "enable_wifi", readOnly: false };
    case "test_connection": 
      return { kind: "test_connection", readOnly: false };
    case "check_network_status":
      return { kind: "check_network_status", readOnly: false };
    case "check_network_adapter":
      return { kind: "check_network_adapter", readOnly: false };
    case "check_network_speed":
      return { kind: "check_network_speed", readOnly: false };
    case "check_ethernet_connection":
      return { kind: "check_ethernet_connection", readOnly: false };
    case "check_file_open_error":
      return { kind: "check_file_open_error", readOnly: false };
    case "check_file_association":
      return { kind: "check_file_association", readOnly: false };
    case "repair_file_association":
      return { kind: "repair_file_association", readOnly: false };
    case "test_file_open":
      return { kind: "test_file_open", readOnly: false };
      case "reconnect_ethernet_cable":
      return { kind: "reconnect_ethernet_cable", readOnly: false };
    case "restart_network_adapter":
      return { kind: "restart_network_adapter", readOnly: false };
    case "test_internet_connection":
      return { kind: "test_internet_connection", readOnly: false };  
    case "check_running_apps":
      return { kind: "check_running_apps", readOnly: false };
    case "close_unnecessary_apps":
      return { kind: "close_unnecessary_apps", readOnly: false };
    case "test_performance":
      return { kind: "test_performance", readOnly: false };
    case "check_printer_status":
      return { kind: "check_printer_status", readOnly: false };
    case "restart_printer":
      return { kind: "restart_printer", readOnly: false };
    case "print_test_page":
      return { kind: "print_test_page", readOnly: false };
    case "check_disk_space":
      return { kind: "check_disk_space", readOnly: false };
    case "clear_temp_files":
      return { kind: "clear_temp_files", readOnly: false };
    case "confirm_storage_available":
      return { kind: "confirm_storage_available", readOnly: false };
    case "check_memory_usage":
      return { kind: "check_memory_usage", readOnly: false };
    case "close_memory_heavy_apps":
      return { kind: "close_memory_heavy_apps", readOnly: false };
    case "check_device_connection":
      return { kind: "check_device_connection", readOnly: false };
    case "reconnect_device":
      return { kind: "reconnect_device", readOnly: false };
    case "test_input_device":
      return { kind: "test_input_device", readOnly: false };
    case "check_app_status":
      return { kind: "check_app_status", readOnly: false };
    case "restart_application":
      return { kind: "restart_application", readOnly: false };
    case "test_application_launch":
      return { kind: "test_application_launch", readOnly: false };
    case "check_license_assignment":
      return { kind: "check_license_assignment", readOnly: false };
    case "assign_software_license":
      return { kind: "assign_software_license", readOnly: false };
    case "check_software_version":
      return { kind: "check_software_version", readOnly: false };
    case "install_software_update":
      return { kind: "install_software_update", readOnly: false };
    case "check_microphone_settings":
      return { kind: "check_microphone_settings", readOnly: false };
    case "enable_microphone":
      return { kind: "enable_microphone", readOnly: false };
    case "test_microphone":
      return { kind: "test_microphone", readOnly: false };
    case "check_shared_drive_permissions":
      return { kind: "check_shared_drive_permissions", readOnly: false };
    case "grant_shared_drive_access":
      return { kind: "grant_shared_drive_access", readOnly: false };
    case "add_user_to_group":
      return { kind: "add_user_to_group", readOnly: false };
    case "test_shared_drive_access":
      return { kind: "test_shared_drive_access", readOnly: false };
    case "check_network_drive_mapping":
      return { kind: "check_network_drive_mapping", readOnly: false };
    case "remap_network_drive":
      return { kind: "remap_network_drive", readOnly: false };
    case "test_network_drive_access":
      return { kind: "test_network_drive_access", readOnly: false };
    case "check_user_permissions":
      return { kind: "check_user_permissions", readOnly: false };
    case "grant_required_permission":
      return { kind: "grant_required_permission", readOnly: false };
    case "test_permission_access":
      return { kind: "test_permission_access", readOnly: false };
    case "check_folder_permissions":
      return { kind: "check_folder_permissions", readOnly: false };
    case "grant_folder_access":
      return { kind: "grant_folder_access", readOnly: false };
    case "test_folder_access":
      return { kind: "test_folder_access", readOnly: false };
    case "check_webcam_settings":
      return { kind: "check_webcam_settings", readOnly: false };
    case "enable_webcam":
      return { kind: "enable_webcam", readOnly: false };
    case "test_webcam":
      return { kind: "test_webcam", readOnly: false };
    case "check_mfa_status":
      return { kind: "check_mfa_status", readOnly: false };
    case "reset_mfa_method":
      return { kind: "reset_mfa_method", readOnly: false };
    case "test_mfa_login":
      return { kind: "test_mfa_login", readOnly: false };
    case "check_browser_extensions":
      return { kind: "check_browser_extensions", readOnly: false };
    case "disable_unnecessary_extensions":
      return { kind: "disable_unnecessary_extensions", readOnly: false };
    case "test_browser_performance":
      return { kind: "test_browser_performance", readOnly: false };
    case "check_install_permissions":
      return { kind: "check_install_permissions", readOnly: false };
    case "grant_install_permissions":
      return { kind: "grant_install_permissions", readOnly: false };
    case "test_software_install":
      return { kind: "test_software_install", readOnly: false };
    case "check_display_connection":
      return { kind: "check_display_connection", readOnly: false };
    case "check_display_settings":
      return { kind: "check_display_settings", readOnly: false };
    case "detect_second_monitor":
      return { kind: "detect_second_monitor", readOnly: false };
    case "test_dual_display":
      return { kind: "test_dual_display", readOnly: false };
    case "help":
      return { kind: "help", readOnly: true };
    case "status":
      return { kind: "status", readOnly: true };
    case "debug":
      return { kind: "debug", readOnly: true };
    default:
      return { kind: "unknown", rawInput: inputRaw };
  }
}