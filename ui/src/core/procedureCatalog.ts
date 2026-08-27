// procedureCatalog.ts
// Typed source of truth for procedure command identity.
//
// This file connects each canonical procedure Command kind to its
// corresponding ExecutionPlan kind.
//
// No aliases.
// No parsing.
// No scenario policy.
// No state mutation.
// No dialogue.

import type { Command, ExecutionPlan } from "./types";

// System/control commands require special construction or behavior.
// They remain explicit in parse.ts and decide.ts.
type SystemCommandKind =
  | "start"
  | "restart"
  | "quit"
  | "debug"
  | "view_scorecard"
  | "select"
  | "help"
  | "status"
  | "unknown";

type SystemPlanKind =
  | "StartNewAttempt"
  | "SelectScenario"
  | "ReadOnly"
  | "ViewScorecard"
  | "QuitAttemptToLobby";

export type ProcedureCommandKind = Exclude<
  Command["kind"],
  SystemCommandKind
>;

export type ProcedurePlanKind = Exclude<
  ExecutionPlan["kind"],
  SystemPlanKind
>;

type ProcedureCatalog = {
  [CommandKind in ProcedureCommandKind]: {
    plan: ProcedurePlanKind;
  };
};

export const procedureCatalog = {
  // SHARED
  verify_identity: { plan: "VerifyIdentity" },

  // ACCOUNT / ACCESS
  send_reset_code: { plan: "SendResetCode" },
  verify_alternate_contact: { plan: "VerifyAlternateContact" },
  update_recovery_email: { plan: "UpdateRecoveryEmail" },
  confirm_reset: { plan: "ConfirmReset" },
  set_new_password: { plan: "SetNewPassword" },
  test_sign_in: { plan: "TestSignIn" },
  request_unlock: { plan: "RequestUnlock" },
  confirm_unlock: { plan: "ConfirmUnlock" },
  review_failed_authentication_attempts: {
    plan: "ReviewFailedAuthenticationAttempts",
  },
  update_saved_credentials: {
    plan: "UpdateSavedCredentials",
  },
  check_vpn_access: { plan: "CheckVpnAccess" },
  enable_vpn_access: { plan: "EnableVpnAccess" },
  confirm_connection: { plan: "ConfirmConnection" },
  check_mfa_status: { plan: "CheckMfaStatus" },
  check_registered_mfa_device: { plan: "CheckRegisteredMfaDevice" },
  remove_old_mfa_device: { plan: "RemoveOldMfaDevice" },
  reset_mfa_method: { plan: "ResetMfaMethod" },
  test_mfa_login: { plan: "TestMfaLogin" },
  check_user_permissions: { plan: "CheckUserPermissions" },
  grant_required_permission: { plan: "GrantRequiredPermission" },
  test_permission_access: { plan: "TestPermissionAccess" },
  check_shared_drive_permissions: { plan: "CheckSharedDrivePermissions" },
  grant_shared_drive_access: { plan: "GrantSharedDriveAccess" },
  add_user_to_group: { plan: "AddUserToGroup" },
  test_shared_drive_access: { plan: "TestSharedDriveAccess" },
  check_install_permissions: { plan: "CheckInstallPermissions" },
  check_software_request_status: { plan: "CheckSoftwareRequestStatus" },
  approve_software_request: { plan: "ApproveSoftwareRequest" },
  grant_install_permissions: { plan: "GrantInstallPermissions" },
  test_software_install: { plan: "TestSoftwareInstall" },

  // EMAIL
  check_email_status: { plan: "CheckEmailStatus" },
  enable_email_client: { plan: "EnableEmailClient" },
  check_outbox: { plan: "CheckOutbox" },
  send_stuck_outbox_email: {
    plan: "SendStuckOutboxEmail",
  },
  check_inbox_filters: { plan: "CheckInboxFilters" },
  disable_inbox_filter: { plan: "DisableInboxFilter" },
  resend_reset_code: { plan: "ResendResetCode" },
  send_test_email: { plan: "SendTestEmail" },
  check_mailbox_storage: { plan: "CheckMailboxStorage" },
  check_archive_policy: { plan: "CheckArchivePolicy" },
  apply_archive_policy: { plan: "ApplyArchivePolicy" },
  archive_old_emails: { plan: "ArchiveOldEmails" },
check_email_login_status: {
  plan: "CheckEmailLoginStatus",
},

check_saved_email_credentials: {
  plan: "CheckSavedEmailCredentials",
},

update_saved_email_credentials: {
  plan: "UpdateSavedEmailCredentials",
},

reset_email_session: {
  plan: "ResetEmailSession",
},

test_email_login: {
  plan: "TestEmailLogin",
},
  check_sync_settings: { plan: "CheckSyncSettings" },
  resync_email_client: { plan: "ResyncEmailClient" },
  test_email_sync: { plan: "TestEmailSync" },
  check_attachment_size: { plan: "CheckAttachmentSize" },
  compress_attachment: { plan: "CompressAttachment" },
  check_shared_mailbox_membership: {
  plan: "CheckSharedMailboxMembership",
},
grant_shared_mailbox_access: {
  plan: "GrantSharedMailboxAccess",
},
check_shared_mailbox_automapping: {
  plan: "CheckSharedMailboxAutomapping",
},
enable_shared_mailbox_automapping: {
  plan: "EnableSharedMailboxAutomapping",
},
check_outlook_mailbox_configuration: {
  plan: "CheckOutlookMailboxConfiguration",
},
  add_shared_mailbox_to_outlook_profile: {
    plan: "AddSharedMailboxToOutlookProfile",
  },
  test_shared_mailbox_access: { plan: "TestSharedMailboxAccess" },
  check_email_client_profile: {
    plan: "CheckEmailClientProfile",
  },
  repair_email_client_profile: {
    plan: "RepairEmailClientProfile",
  },

  // NETWORK / CONNECTIVITY
  check_wifi_status: { plan: "CheckWifiStatus" },
  enable_wifi: { plan: "EnableWifi" },
  test_connection: { plan: "TestConnection" },
  check_wifi_profile: { plan: "CheckWifiProfile" },
  remove_corrupted_wifi_profile: {
    plan: "RemoveCorruptedWifiProfile",
  },
  reconnect_wifi: { plan: "ReconnectWifi" },
  check_network_status: { plan: "CheckNetworkStatus" },
  check_proxy_settings: { plan: "CheckProxySettings" },
  disable_incorrect_proxy: {
    plan: "DisableIncorrectProxy",
  },
  check_network_adapter: { plan: "CheckNetworkAdapter" },
  check_network_speed: { plan: "CheckNetworkSpeed" },
  check_ethernet_connection: { plan: "CheckEthernetConnection" },
  reconnect_ethernet_cable: { plan: "ReconnectEthernetCable" },
  restart_network_adapter: { plan: "RestartNetworkAdapter" },
  test_internet_connection: { plan: "TestInternetConnection" },

  // FILES / STORAGE
  check_disk_space: { plan: "CheckDiskSpace" },
  clear_temp_files: { plan: "ClearTempFiles" },
  confirm_storage_available: { plan: "ConfirmStorageAvailable" },
  check_network_drive_mapping: { plan: "CheckNetworkDriveMapping" },
  remap_network_drive: { plan: "RemapNetworkDrive" },
  test_network_drive_access: { plan: "TestNetworkDriveAccess" },
  check_file_open_error: { plan: "CheckFileOpenError" },
  check_file_association: { plan: "CheckFileAssociation" },
  repair_file_association: { plan: "RepairFileAssociation" },
  test_file_open: { plan: "TestFileOpen" },
  check_folder_permissions: { plan: "CheckFolderPermissions" },
  check_folder_security_group: {
  plan: "CheckFolderSecurityGroup",
},
  grant_folder_access: { plan: "GrantFolderAccess" },
  test_folder_access: { plan: "TestFolderAccess" },

  // DEVICE / PERFORMANCE
  check_running_apps: { plan: "CheckRunningApps" },
  close_unnecessary_apps: { plan: "CloseUnnecessaryApps" },
  test_performance: { plan: "TestPerformance" },
  check_memory_usage: { plan: "CheckMemoryUsage" },
  close_memory_heavy_apps: { plan: "CloseMemoryHeavyApps" },

  check_browser_cache: { plan: "CheckBrowserCache" },
  clear_browser_cache: { plan: "ClearBrowserCache" },

  check_browser_extensions: { plan: "CheckBrowserExtensions" },
  disable_unnecessary_extensions: {
    plan: "DisableUnnecessaryExtensions",
  },
  test_browser_performance: { plan: "TestBrowserPerformance" },

  // HARDWARE / PERIPHERALS
  check_printer_status: { plan: "CheckPrinterStatus" },
  check_default_printer: { plan: "CheckDefaultPrinter" },
  set_default_printer: { plan: "SetDefaultPrinter" },
  restart_printer: { plan: "RestartPrinter" },
  print_test_page: { plan: "PrintTestPage" },
  check_device_connection: { plan: "CheckDeviceConnection" },
  reconnect_device: { plan: "ReconnectDevice" },
  test_input_device: { plan: "TestInputDevice" },
  check_microphone_settings: {
  plan: "CheckMicrophoneSettings",
},

enable_microphone: {
  plan: "EnableMicrophone",
},

test_microphone: {
  plan: "TestMicrophone",
},

check_recording_device: {
  plan: "CheckRecordingDevice",
},

select_recording_device: {
  plan: "SelectRecordingDevice",
},
  check_webcam_settings: { plan: "CheckWebcamSettings" },
  enable_webcam: { plan: "EnableWebcam" },
  test_webcam: { plan: "TestWebcam" },
  check_display_connection: {
  plan: "CheckDisplayConnection",
},

check_display_settings: {
  plan: "CheckDisplaySettings",
},

detect_second_monitor: {
  plan: "DetectSecondMonitor",
},

check_display_enabled_status: {
  plan: "CheckDisplayEnabledStatus",
},

enable_second_display: {
  plan: "EnableSecondDisplay",
},

test_dual_display: {
  plan: "TestDualDisplay",
},
  check_audio_output: { plan: "CheckAudioOutput" },
  check_volume_status: { plan: "CheckVolumeStatus" },
  select_audio_output: { plan: "SelectAudioOutput" },
  test_audio: { plan: "TestAudio" },

  // SOFTWARE / APPLICATIONS
  check_app_status: { plan: "CheckAppStatus" },
  restart_application: { plan: "RestartApplication" },
  test_application_launch: { plan: "TestApplicationLaunch" },
  check_license_assignment: { plan: "CheckLicenseAssignment" },
  assign_software_license: { plan: "AssignSoftwareLicense" },
  check_software_version: { plan: "CheckSoftwareVersion" },
  install_software_update: { plan: "InstallSoftwareUpdate" },
} as const satisfies ProcedureCatalog;

// Trip wire: every non-system ExecutionPlan must appear in the catalog.
// Missing or invalid plan coverage creates a TypeScript error here.
type CatalogPlanKind =
  (typeof procedureCatalog)[keyof typeof procedureCatalog]["plan"];

type MissingProcedurePlan = Exclude<ProcedurePlanKind, CatalogPlanKind>;
type InvalidCatalogPlan = Exclude<CatalogPlanKind, ProcedurePlanKind>;

export const PROCEDURE_CATALOG_PLAN_COVERAGE:
  [MissingProcedurePlan, InvalidCatalogPlan] extends [never, never]
    ? true
    : never = true;