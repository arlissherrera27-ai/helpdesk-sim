// --- Core State & Authority Types ---
// This file defines WHAT EXISTS in the system.
// No logic. No behavior. No mutation.

export type ExecutionState =
  | "LOBBY"
  | "RUNNING"
  | "COMPLETED";

// Commands are labeled intents, not behavior
export type Command =
  // SYSTEM / CONTROL
  | { kind: "start"; readOnly: false }
  | { kind: "restart"; readOnly: false }
  | { kind: "quit"; readOnly: false }
  | { kind: "debug"; readOnly: true }
  | { kind: "select"; readOnly: false; scenario_id: string }
  | { kind: "help"; readOnly: true }
  | { kind: "status"; readOnly: true }
  | { kind: "unknown"; rawInput: string }

  // SHARED
  | { kind: "verify_identity"; readOnly: false }

  // ACCOUNT / ACCESS
  | { kind: "send_reset_code"; readOnly: false }
  | { kind: "verify_alternate_contact"; readOnly: false }
  | { kind: "update_recovery_email"; readOnly: false }
  | { kind: "confirm_reset"; readOnly: false }
  | { kind: "set_new_password"; readOnly: false }
  | { kind: "test_sign_in"; readOnly: false }
  | { kind: "request_unlock"; readOnly: false }
  | { kind: "confirm_unlock"; readOnly: false }
  | { kind: "check_vpn_access"; readOnly: false }
  | { kind: "enable_vpn_access"; readOnly: false }
  | { kind: "confirm_connection"; readOnly: false }
  | { kind: "check_mfa_status"; readOnly: false }
  | { kind: "reset_mfa_method"; readOnly: false }
  | { kind: "test_mfa_login"; readOnly: false }
  | { kind: "check_user_permissions"; readOnly: false }
  | { kind: "grant_required_permission"; readOnly: false }
  | { kind: "test_permission_access"; readOnly: false }
  | { kind: "check_shared_drive_permissions"; readOnly: false }
  | { kind: "grant_shared_drive_access"; readOnly: false }
  | { kind: "add_user_to_group"; readOnly: false }
  | { kind: "test_shared_drive_access"; readOnly: false }
  | { kind: "check_install_permissions"; readOnly: false }
  | { kind: "grant_install_permissions"; readOnly: false }
  | { kind: "test_software_install"; readOnly: false }

  // EMAIL
  | { kind: "check_email_status"; readOnly: false }
  | { kind: "enable_email_client"; readOnly: false }
  | { kind: "check_inbox_filters"; readOnly: false }
  | { kind: "disable_inbox_filter"; readOnly: false }
  | { kind: "resend_reset_code"; readOnly: false }
  | { kind: "send_test_email"; readOnly: false }
  | { kind: "check_mailbox_storage"; readOnly: false }
  | { kind: "archive_old_emails"; readOnly: false }
  | { kind: "check_email_login_status"; readOnly: false }
  | { kind: "reset_email_session"; readOnly: false }
  | { kind: "test_email_login"; readOnly: false }
  | { kind: "check_sync_settings"; readOnly: false }
  | { kind: "resync_email_client"; readOnly: false }
  | { kind: "test_email_sync"; readOnly: false }
  | { kind: "check_attachment_size"; readOnly: false }
  | { kind: "compress_attachment"; readOnly: false }
  | { kind: "check_shared_mailbox_membership"; readOnly: false }
  | { kind: "grant_shared_mailbox_access"; readOnly: false }
  | { kind: "test_shared_mailbox_access"; readOnly: false }

  // NETWORK / CONNECTIVITY
  | { kind: "check_wifi_status"; readOnly: false }
  | { kind: "enable_wifi"; readOnly: false }
  | { kind: "test_connection"; readOnly: false }
  | { kind: "check_network_status"; readOnly: false }
  | { kind: "check_network_adapter"; readOnly: false }
  | { kind: "check_network_speed"; readOnly: false }
  | { kind: "check_ethernet_connection"; readOnly: false }
  | { kind: "reconnect_ethernet_cable"; readOnly: false }
  | { kind: "restart_network_adapter"; readOnly: false }
  | { kind: "test_internet_connection"; readOnly: false }

  // FILES / STORAGE
  | { kind: "check_disk_space"; readOnly: false }
  | { kind: "clear_temp_files"; readOnly: false }
  | { kind: "confirm_storage_available"; readOnly: false }
  | { kind: "check_network_drive_mapping"; readOnly: false }
  | { kind: "remap_network_drive"; readOnly: false }
  | { kind: "test_network_drive_access"; readOnly: false }
  | { kind: "check_file_open_error"; readOnly: false }
  | { kind: "check_file_association"; readOnly: false }
  | { kind: "repair_file_association"; readOnly: false }
  | { kind: "test_file_open"; readOnly: false }
  | { kind: "check_folder_permissions"; readOnly: false }
  | { kind: "grant_folder_access"; readOnly: false }
  | { kind: "test_folder_access"; readOnly: false }

  // DEVICE / PERFORMANCE
  | { kind: "check_running_apps"; readOnly: false }
  | { kind: "close_unnecessary_apps"; readOnly: false }
  | { kind: "test_performance"; readOnly: false }
  | { kind: "check_memory_usage"; readOnly: false }
  | { kind: "close_memory_heavy_apps"; readOnly: false }
  | { kind: "check_browser_extensions"; readOnly: false }
  | { kind: "disable_unnecessary_extensions"; readOnly: false }
  | { kind: "test_browser_performance"; readOnly: false }

  // HARDWARE / PERIPHERALS
  | { kind: "check_printer_status"; readOnly: false }
  | { kind: "restart_printer"; readOnly: false }
  | { kind: "print_test_page"; readOnly: false }
  | { kind: "check_device_connection"; readOnly: false }
  | { kind: "reconnect_device"; readOnly: false }
  | { kind: "test_input_device"; readOnly: false }
  | { kind: "check_microphone_settings"; readOnly: false }
  | { kind: "enable_microphone"; readOnly: false }
  | { kind: "test_microphone"; readOnly: false }
  | { kind: "check_webcam_settings"; readOnly: false }
  | { kind: "enable_webcam"; readOnly: false }
  | { kind: "test_webcam"; readOnly: false }
  | { kind: "check_display_connection"; readOnly: false }
  | { kind: "check_display_settings"; readOnly: false }
  | { kind: "detect_second_monitor"; readOnly: false }
  | { kind: "test_dual_display"; readOnly: false }

  // SOFTWARE / APPLICATIONS
  | { kind: "check_app_status"; readOnly: false }
  | { kind: "restart_application"; readOnly: false }
  | { kind: "test_application_launch"; readOnly: false }
  | { kind: "check_license_assignment"; readOnly: false }
  | { kind: "assign_software_license"; readOnly: false }
  | { kind: "check_software_version"; readOnly: false }
  | { kind: "install_software_update"; readOnly: false }

// Decisions are authoritative judgments
export type DenyType =
  | "UNKNOWN_INPUT"
  | "PROCEDURE_DENIED";

export type Decision =
  | { kind: "ALLOW"; plan: ExecutionPlan }
  | { kind: "DENY"; reason: string; denyType?: DenyType };

// Execution plans describe WHAT should change, not whether it should
export type ExecutionPlan =
  // SYSTEM / CONTROL
  | { kind: "StartNewAttempt" }
  | { kind: "SelectScenario"; scenario_id: string }
  | { kind: "ReadOnly"; view: "HELP" | "STATUS" | "DEBUG" }
  | { kind: "QuitAttemptToLobby" }

  // SHARED
  | { kind: "VerifyIdentity" }

  // ACCOUNT / ACCESS
  | { kind: "SendResetCode" }
  | { kind: "VerifyAlternateContact" }
  | { kind: "UpdateRecoveryEmail" }
  | { kind: "ConfirmReset" }
  | { kind: "SetNewPassword" }
  | { kind: "TestSignIn" }
  | { kind: "RequestUnlock" }
  | { kind: "ConfirmUnlock" }
  | { kind: "CheckVpnAccess" }
  | { kind: "EnableVpnAccess" }
  | { kind: "ConfirmConnection" }
  | { kind: "CheckMfaStatus" }
  | { kind: "ResetMfaMethod" }
  | { kind: "TestMfaLogin" }
  | { kind: "CheckUserPermissions" }
  | { kind: "GrantRequiredPermission" }
  | { kind: "TestPermissionAccess" }
  | { kind: "CheckSharedDrivePermissions" }
  | { kind: "GrantSharedDriveAccess" }
  | { kind: "AddUserToGroup" }
  | { kind: "TestSharedDriveAccess" }
  | { kind: "CheckInstallPermissions" }
  | { kind: "GrantInstallPermissions" }
  | { kind: "TestSoftwareInstall" }

  // EMAIL
  | { kind: "CheckEmailStatus" }
  | { kind: "EnableEmailClient" }
  | { kind: "SendTestEmail" }
  | { kind: "CheckInboxFilters" }
  | { kind: "DisableInboxFilter" }
  | { kind: "ResendResetCode" }
  | { kind: "CheckMailboxStorage" }
  | { kind: "ArchiveOldEmails" }
  | { kind: "CheckEmailLoginStatus" }
  | { kind: "ResetEmailSession" }
  | { kind: "TestEmailLogin" }
  | { kind: "CheckSyncSettings" }
  | { kind: "ResyncEmailClient" }
  | { kind: "TestEmailSync" }
  | { kind: "CheckAttachmentSize" }
  | { kind: "CompressAttachment" }
  | { kind: "CheckSharedMailboxMembership" }
  | { kind: "GrantSharedMailboxAccess" }
  | { kind: "TestSharedMailboxAccess" }

  // NETWORK / CONNECTIVITY
  | { kind: "CheckWifiStatus" }
  | { kind: "EnableWifi" }
  | { kind: "TestConnection" }
  | { kind: "CheckNetworkStatus" }
  | { kind: "CheckNetworkAdapter" }
  | { kind: "CheckNetworkSpeed" }
  | { kind: "CheckEthernetConnection" }
  | { kind: "ReconnectEthernetCable" }
  | { kind: "RestartNetworkAdapter" }
  | { kind: "TestInternetConnection" }

  // FILES / STORAGE
  | { kind: "CheckDiskSpace" }
  | { kind: "ClearTempFiles" }
  | { kind: "ConfirmStorageAvailable" }
  | { kind: "CheckNetworkDriveMapping" }
  | { kind: "RemapNetworkDrive" }
  | { kind: "TestNetworkDriveAccess" }
  | { kind: "CheckFileOpenError" }
  | { kind: "CheckFileAssociation" }
  | { kind: "RepairFileAssociation" }
  | { kind: "TestFileOpen" }
  | { kind: "CheckFolderPermissions" }
  | { kind: "GrantFolderAccess" }
  | { kind: "TestFolderAccess" }

  // DEVICE / PERFORMANCE
  | { kind: "CheckRunningApps" }
  | { kind: "CloseUnnecessaryApps" }
  | { kind: "TestPerformance" }
  | { kind: "CheckMemoryUsage" }
  | { kind: "CloseMemoryHeavyApps" }
  | { kind: "CheckBrowserExtensions" }
  | { kind: "DisableUnnecessaryExtensions" }
  | { kind: "TestBrowserPerformance" }

  // HARDWARE / PERIPHERALS
  | { kind: "CheckPrinterStatus" }
  | { kind: "RestartPrinter" }
  | { kind: "PrintTestPage" }
  | { kind: "CheckDeviceConnection" }
  | { kind: "ReconnectDevice" }
  | { kind: "TestInputDevice" }
  | { kind: "CheckMicrophoneSettings" }
  | { kind: "EnableMicrophone" }
  | { kind: "TestMicrophone" }
  | { kind: "CheckWebcamSettings" }
  | { kind: "EnableWebcam" }
  | { kind: "TestWebcam" }
  | { kind: "CheckDisplayConnection" }
  | { kind: "CheckDisplaySettings" }
  | { kind: "DetectSecondMonitor" }
  | { kind: "TestDualDisplay" }

  // SOFTWARE / APPLICATIONS
  | { kind: "CheckAppStatus" }
  | { kind: "RestartApplication" }
  | { kind: "TestApplicationLaunch" }
  | { kind: "CheckLicenseAssignment" }
  | { kind: "AssignSoftwareLicense" }
  | { kind: "CheckSoftwareVersion" }
  | { kind: "InstallSoftwareUpdate" };

// Attempts are isolated runs
export type Attempt = {
  id: string;
  number: number;
};

// Scenarios define the rule world
export type Scenario = {
  id: string;
  version: number;
};

// --- Scenario Hidden Facts (Private State) ---
// These are scenario-private truths used later for gating/rules.
// No logic here. Just shape.
// ACCOUNT / ACCESS
export type PasswordResetFacts = {
  kind: "password_reset";
  identity_verified: boolean;
  code_sent: boolean;
  has_recovery_email: boolean;
  reset_done: boolean;
  password_updated: boolean;
  can_login_now: boolean;
  wrong_attempts: number;
};

export type PasswordResetRecoveryEmailNeverArrivesFacts = {
  kind: "password_reset_recovery_email_never_arrives";
  identity_verified: boolean;
  code_sent: boolean;
  email_arrived: boolean;
  inbox_filter_checked: boolean;
  inbox_filter_enabled: boolean;
  reset_done: boolean;
  password_updated: boolean;
  can_login_now: boolean;
  wrong_attempts: number;
};

export type PasswordResetRecoveryEmailOutdatedFacts = {
  kind: "password_reset_recovery_email_outdated";
  identity_verified: boolean;
  alternate_contact_verified: boolean;
  recovery_email_updated: boolean;
  code_sent: boolean;
  reset_done: boolean;
  password_updated: boolean;
  can_login_now: boolean;
  wrong_attempts: number;
};

export type AccountLockoutFacts = {
  kind: "account_lockout";
  identity_verified: boolean;
  account_locked: boolean;
  unlock_requested: boolean;
  can_login_now: boolean;
};

export type VpnAccessIssueFacts = {
  kind: "vpn_access_issue";
  identity_verified: boolean; 
  vpn_access_checked: boolean;
  vpn_access_enabled: boolean;
  can_connect_now: boolean;
};

export type VpnMfaDependencyMissingFacts = {
  kind: "vpn_mfa_dependency_missing";
  identity_verified: boolean;
  vpn_access_checked: boolean;
  vpn_access_enabled: boolean;
  mfa_status_checked: boolean;
  mfa_method_reset: boolean;
  can_connect_now: boolean;
};

export type MfaCodeNotWorkingFacts = {
  kind: "mfa_code_not_working";
  identity_verified: boolean;
  mfa_status_checked: boolean;
  mfa_method_reset: boolean;
  mfa_working: boolean;
};

export type PermissionsDeniedFacts = {
  kind: "permissions_denied";
  identity_verified: boolean;
  user_permissions_checked: boolean;
  required_permission_granted: boolean;
  permission_access_working: boolean;
};

export type SharedDriveAccessIssueFacts = {
  kind: "shared_drive_access_issue";
  identity_verified: boolean;
  shared_drive_permissions_checked: boolean;
  shared_drive_access_granted: boolean;
  shared_drive_access_working: boolean;
};

export type SharedDriveGroupMembershipMissingFacts = {
  kind: "shared_drive_group_membership_missing";
  identity_verified: boolean;
  shared_drive_permissions_checked: boolean;
  user_added_to_group: boolean;
  shared_drive_access_working: boolean;
};

export type CannotInstallSoftwareFacts = {
  kind: "cannot_install_software";
  identity_verified: boolean;
  install_permissions_checked: boolean;
  install_permissions_granted: boolean;
  software_install_working: boolean;
};

// EMAIL
export type EmailNotSendingFacts = {
  kind: "email_not_sending";
  identity_verified: boolean;
  email_status_checked: boolean;
  email_client_online: boolean;
  can_send_email: boolean;
};

export type NotReceivingEmailFacts = {
  kind: "not_receiving_email";
  identity_verified: boolean;
  filters_checked: boolean;
  filter_disabled: boolean;
  can_receive_email: boolean;
};

export type NotReceivingEmailInboxRuleRedirectingFacts = {
  kind: "not_receiving_email_inbox_rule_redirecting";
  identity_verified: boolean;
  inbox_filter_checked: boolean;
  inbox_filter_enabled: boolean;
  filter_disabled: boolean;
  can_receive_email: boolean;
};

export type MailboxFullFacts = {
  kind: "mailbox_full";
  identity_verified: boolean;
  mailbox_storage_checked: boolean;
  old_emails_archived: boolean;
  mailbox_receiving_email: boolean;
};

export type EmailLoginIssueFacts = {
  kind: "email_login_issue";
  identity_verified: boolean;
  email_login_checked: boolean;
  email_session_reset: boolean;
  email_login_working: boolean;
};

export type EmailClientNotSyncingFacts = {
  kind: "email_client_not_syncing";
  identity_verified: boolean;
  sync_settings_checked: boolean;
  email_client_resynced: boolean;
  email_sync_working: boolean;
};

export type AttachmentTooLargeFacts = {
  kind: "attachment_too_large";
  identity_verified: boolean;
  attachment_size_checked: boolean;
  attachment_compressed: boolean;
  test_email_sent: boolean;
};

export type SharedMailboxMissingFacts = {
  kind: "shared_mailbox_missing";
  identity_verified: boolean;
  shared_mailbox_membership_checked: boolean;
  shared_mailbox_access_granted: boolean;
  shared_mailbox_working: boolean;
};

// NETWORK / CONNECTIVITY
export type CannotConnectWifiFacts = {
  kind: "cannot_connect_wifi";
  identity_verified: boolean;
  wifi_checked: boolean;
  wifi_enabled: boolean;
  can_connect_wifi: boolean;
};

export type InternetNoAccessFacts = {
  kind: "internet_no_access";
  identity_verified: boolean;
  network_checked: boolean;
  network_adapter_checked: boolean;
  network_adapter_restarted: boolean;
  internet_restored: boolean;
};

export type SlowNetworkConnectionFacts = {
  kind: "slow_network_connection";
  identity_verified: boolean;
  network_speed_checked: boolean;
  network_adapter_checked: boolean;
  network_adapter_restarted: boolean;
  internet_speed_restored: boolean;
};

export type EthernetNotConnectedFacts = {
  kind: "ethernet_not_connected";
  identity_verified: boolean;
  ethernet_checked: boolean;
  ethernet_cable_reconnected: boolean;
  ethernet_connection_restored: boolean;
};

// FILES / STORAGE
export type DiskSpaceFullFacts = {
  kind: "disk_space_full";
  identity_verified: boolean;
  disk_checked: boolean;
  temp_files_cleared: boolean;
  storage_available: boolean;
};

export type NetworkDriveMissingFacts = {
  kind: "network_drive_missing";
  identity_verified: boolean;
  network_drive_mapping_checked: boolean;
  network_drive_remapped: boolean;
  network_drive_access_working: boolean;
};

export type NetworkDriveVpnRequiredFirstFacts = {
  kind: "network_drive_vpn_required_first";
  identity_verified: boolean;
  vpn_access_checked: boolean;
  vpn_access_enabled: boolean;
  network_drive_mapping_checked: boolean;
  network_drive_remapped: boolean;
  network_drive_access_working: boolean;
};

export type CannotOpenFileFacts = {
  kind: "cannot_open_file";
  identity_verified: boolean;
  file_open_error_checked: boolean;
  file_association_checked: boolean;
  file_association_repaired: boolean;
  file_opens_successfully: boolean;
};

export type FolderAccessMissingFacts = {
  kind: "folder_access_missing";
  identity_verified: boolean;
  folder_permissions_checked: boolean;
  folder_access_granted: boolean;
  folder_access_working: boolean;
};

// DEVICE / PERFORMANCE
export type TooManyAppsRunningFacts = {
  kind: "too_many_apps_running";
  identity_verified: boolean;
  apps_checked: boolean;
  apps_closed: boolean;
  performance_ok: boolean;
};

export type LowMemoryFacts = {
  kind: "low_memory";
  identity_verified: boolean;
  memory_checked: boolean;
  memory_heavy_apps_closed: boolean;
  memory_ok: boolean;
};

export type BrowserRunningSlowFacts = {
  kind: "browser_running_slow";
  identity_verified: boolean;
  browser_extensions_checked: boolean;
  unnecessary_extensions_disabled: boolean;
  browser_performance_ok: boolean;
};

// HARDWARE / PERIPHERALS
export type PrinterNotWorkingFacts = {
  kind: "printer_not_working";
  identity_verified: boolean;
  printer_checked: boolean;
  printer_restarted: boolean;
  printer_working: boolean;
};

export type MouseKeyboardNotWorkingFacts = {
  kind: "mouse_keyboard_not_working";
  identity_verified: boolean;
  device_connection_checked: boolean;
  device_reconnected: boolean;
  input_device_working: boolean;
};

export type MicrophoneNotWorkingFacts = {
  kind: "microphone_not_working";
  identity_verified: boolean;
  microphone_settings_checked: boolean;
  microphone_enabled: boolean;
  microphone_working: boolean;
};

export type WebcamNotWorkingFacts = {
  kind: "webcam_not_working";
  identity_verified: boolean;
  webcam_settings_checked: boolean;
  webcam_enabled: boolean;
  webcam_working: boolean;
};

export type SecondMonitorNotDetectedFacts = {
  kind: "second_monitor_not_detected";
  identity_verified: boolean;
  display_connection_checked: boolean;
  display_settings_checked: boolean;
  second_monitor_detected: boolean;
  dual_display_working: boolean;
};

// SOFTWARE / APPLICATIONS
export type SoftwareAppNotOpeningFacts = {
  kind: "software_app_not_opening";
  identity_verified: boolean;
  app_status_checked: boolean;
  application_restarted: boolean;
  application_working: boolean;
};

export type SoftwareAppLicenseNotAssignedFacts = {
  kind: "software_app_license_not_assigned";
  identity_verified: boolean;
  app_status_checked: boolean;
  license_assignment_checked: boolean;
  software_license_assigned: boolean;
  application_working: boolean;
};

export type ApplicationCrashFacts = {
  kind: "application_crash";
  identity_verified: boolean;
  app_status_checked: boolean;
  application_restarted: boolean;
  application_working: boolean;
};

export type SoftwareUpdateRequiredFacts = {
  kind: "software_update_required";
  identity_verified: boolean;
  software_version_checked: boolean;
  software_update_installed: boolean;
  application_working: boolean;
};

export type ScenarioFacts =
  // ACCOUNT / ACCESS
  | PasswordResetFacts
  | PasswordResetRecoveryEmailNeverArrivesFacts
  | PasswordResetRecoveryEmailOutdatedFacts
  | AccountLockoutFacts
  | VpnAccessIssueFacts
  | VpnMfaDependencyMissingFacts
  | MfaCodeNotWorkingFacts
  | PermissionsDeniedFacts
  | SharedDriveAccessIssueFacts
  | SharedDriveGroupMembershipMissingFacts
  | CannotInstallSoftwareFacts

  // EMAIL
  | EmailNotSendingFacts
  | NotReceivingEmailFacts
  | NotReceivingEmailInboxRuleRedirectingFacts
  | MailboxFullFacts
  | EmailLoginIssueFacts
  | EmailClientNotSyncingFacts
  | AttachmentTooLargeFacts
  | SharedMailboxMissingFacts

  // NETWORK / CONNECTIVITY
  | CannotConnectWifiFacts
  | InternetNoAccessFacts
  | SlowNetworkConnectionFacts
  | EthernetNotConnectedFacts

  // FILES / STORAGE
  | DiskSpaceFullFacts
  | NetworkDriveMissingFacts
  | NetworkDriveVpnRequiredFirstFacts
  | CannotOpenFileFacts
  | FolderAccessMissingFacts

  // DEVICE / PERFORMANCE
  | TooManyAppsRunningFacts
  | LowMemoryFacts
  | BrowserRunningSlowFacts

  // HARDWARE / PERIPHERALS
  | PrinterNotWorkingFacts
  | MouseKeyboardNotWorkingFacts
  | MicrophoneNotWorkingFacts
  | WebcamNotWorkingFacts
  | SecondMonitorNotDetectedFacts

  // SOFTWARE / APPLICATIONS
  | SoftwareAppNotOpeningFacts
  | SoftwareAppLicenseNotAssignedFacts
  | ApplicationCrashFacts
  | SoftwareUpdateRequiredFacts
  | null;

// Errors are sticky within an attempt
export type SimError = {
  code: string;
  message: string;
  failingCommand?: string;
};

// Results are final per attempt
export type ScoreSummary = {
  totalScore: number;          
  mistakes: number;           
  completion: "PASS" | "FAIL";
};

export type Result = ScoreSummary | null;

export type LogEvent = {
  command: string;
  decision: "ALLOW" | "DENY";
  plan: ExecutionPlan["kind"] | null;
  outcome: "denied" | "error" | "success";
  timestamp: string;
  attemptedInput?: string;
  mistakeType?: "unknown" | "repeated";
};

// This is the single source of truth
export type SimMode = "practice" | "assessment";

export type AssessmentIntegrity =
  | "maintained"
  | "converted_to_practice";

export type SimState = {
  scenario: string | null;
  previewScenario: string | null;
  scenarioFacts: ScenarioFacts;
  attempt: Attempt | null;
  executionState: ExecutionState;
  error: SimError | null;
  result: Result;
  runLog: LogEvent[];
  mode: SimMode;
  assessmentIntegrity: AssessmentIntegrity;
  procedureHelpOpenedCount: number;
  procedureHelpUsedDuring: string[];
};

// StatePatch describes INTENTIONAL state changes.
// It is applied by the Update layer only.
export type StatePatch = {
  mode?: SimMode;
  assessmentIntegrity?: AssessmentIntegrity;
  procedureHelpOpenedCount?: number;
  procedureHelpUsedDuring?: string[];
  executionState?: ExecutionState;
  error?: SimError | null;
  result?: Result;
  attempt?: Attempt | null;
  scenario?: string | null;
  previewScenario?: string | null;
  scenarioFacts?: ScenarioFacts;
  newAttempt?: { number: number };
};
