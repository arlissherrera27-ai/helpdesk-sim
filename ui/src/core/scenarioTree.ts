import {
  getScenarioPreviewMetadata,
  getScenarioPreviewSteps,
  getScenarioLabel,
  getScenarioRegistryEntries,
} from "./scenarioRegistry";

import type { ScenarioId } from "./scenarios";
type ScenarioLevel = "Beginner" | "Intermediate" | "Advanced";

type EstimatedTime = "3–5 min" | "5–7 min" | "5–8 min" | "8–12 min";

type ScenarioPreview = {
  id: ScenarioId;
  label: string;
  selectCommand: string;
  level: ScenarioLevel;
  estimatedTime: EstimatedTime;
  description: string;
  skillFocus: string[];
  scenarioContext: string;
  successOutcome: string;
  previewSteps: string[];
};

type ScenarioTierId =
  | "account_access"
  | "password_reset_challenges"
  | "vpn_access_challenges"
  | "shared_drive_access_challenges"
  | "software_app_challenges"
  | "software_install_challenges"
  | "email"
  | "network"
  | "files_storage"
  | "device_performance"
  | "hardware_peripherals"
  | "software_applications";

type ScenarioTierLabel =
  | "Account / Access"
  | "Password Reset"
  | "VPN Access"
  | "Shared Drive Access"
  | "Software App Won’t Open"
  | "Software Installation"
  | "Email"
  | "Network"
  | "Files / Storage"
  | "Device / Performance"
  | "Hardware / Peripherals"
  | "Software / Applications";

  const SCENARIO_TIER_LABELS: Record<
  ScenarioTierId,
  ScenarioTierLabel
> = {
  account_access: "Account / Access",
  password_reset_challenges: "Password Reset",
  vpn_access_challenges: "VPN Access",
  shared_drive_access_challenges: "Shared Drive Access",
  software_app_challenges: "Software App Won’t Open",
  software_install_challenges: "Software Installation",
  email: "Email",
  network: "Network",
  files_storage: "Files / Storage",
  device_performance: "Device / Performance",
  hardware_peripherals: "Hardware / Peripherals",
  software_applications: "Software / Applications",
};

const SCENARIO_TIER_ORDER: Record<
  ScenarioTypeId,
  readonly ScenarioTierId[]
> = {
  standard: [
    "account_access",
    "email",
    "network",
    "files_storage",
    "device_performance",
    "hardware_peripherals",
    "software_applications",
  ],

operational_challenges: [
  "account_access",
  "password_reset_challenges",
  "vpn_access_challenges",
  "shared_drive_access_challenges",
  "network",
  "files_storage",
  "device_performance",
  "hardware_peripherals",
  "email",
  "software_applications",
  "software_install_challenges",
],

  chaos: [],
};

const SCENARIO_TIER_LABEL_OVERRIDES: Partial<
  Record<
    ScenarioTypeId,
    Partial<Record<ScenarioTierId, ScenarioTierLabel>>
  >
> = {
  operational_challenges: {
    software_applications: "Software App Won’t Open",
  },
};

function getScenarioTierLabel(
  scenarioType: ScenarioTypeId,
  tierId: ScenarioTierId
): ScenarioTierLabel {
  return (
    SCENARIO_TIER_LABEL_OVERRIDES[scenarioType]?.[tierId] ??
    SCENARIO_TIER_LABELS[tierId]
  );
}

type ScenarioTier = {
  tierId: ScenarioTierId;
  tierLabel: ScenarioTierLabel;
  scenarios: ScenarioPreview[];
};

function buildScenarioPreview(
  scenarioId: ScenarioId
): ScenarioPreview {
  const metadata = getScenarioPreviewMetadata(scenarioId);

  if (!metadata) {
    throw new Error(
      `Missing preview metadata for scenario: ${scenarioId}`
    );
  }

  return {
    id: scenarioId,
    label: getScenarioLabel(scenarioId),
    selectCommand: metadata.selectCommand,
    level: metadata.level,
    estimatedTime: metadata.estimatedTime,
    description: metadata.description,
    skillFocus: [...metadata.skillFocus],
    scenarioContext: metadata.scenarioContext,
    successOutcome: metadata.successOutcome,
    previewSteps: getScenarioPreviewSteps(scenarioId),
  };
}

function buildScenarioBranches(
  scenarioType: ScenarioTypeId
): ScenarioTier[] {
  const groupedScenarios = new Map<
    ScenarioTierId,
    ScenarioPreview[]
  >();

  for (const entry of getScenarioRegistryEntries()) {
    if (entry.scenarioType !== scenarioType) {
      continue;
    }

    const tierId = entry.category;
    const existingScenarios = groupedScenarios.get(tierId) ?? [];

    existingScenarios.push(
  buildScenarioPreview(entry.id)
);

    groupedScenarios.set(tierId, existingScenarios);
  }

  const tierOrder = SCENARIO_TIER_ORDER[scenarioType];

  for (const tierId of groupedScenarios.keys()) {
    if (!tierOrder.includes(tierId)) {
      throw new Error(
        `Missing selector order for ${scenarioType} category: ${tierId}`
      );
    }
  }

  return tierOrder.flatMap((tierId) => {
    const scenarios = groupedScenarios.get(tierId);

    if (!scenarios) {
      return [];
    }

    return [
      {
        tierId,
        tierLabel: getScenarioTierLabel(
          scenarioType,
          tierId
        ),
        scenarios,
      },
    ];
  });
}

const generatedStandardScenarioBranches =
  buildScenarioBranches("standard");

const generatedOperationalScenarioBranches =
  buildScenarioBranches("operational_challenges");

export const PREVIEW_STEP_LABELS: Record<string, string> = {
  // SHARED
  verify_identity: "Verify Identity",

  // ACCOUNT / ACCESS
  send_reset_code: "Send Reset Code",
  resend_reset_code: "Resend Reset Code",
  confirm_reset: "Confirm Reset",
  validate_reset_code: "Validate Reset Code",
  test_sign_in: "Test Sign-In",
  set_new_password: "Set New Password",

  request_unlock: "Request Account Unlock",
  confirm_unlock: "Confirm Account Unlock",

  check_vpn_access: "Check Virtual Private Network (VPN) Access",
  enable_vpn_access: "Enable Virtual Private Network (VPN) Access",
  confirm_vpn_connection: "Confirm Virtual Private Network (VPN) Connection",

  check_mfa_status: "Check Multi-Factor Authentication (MFA) Status",
  check_registered_mfa_device:
    "Check Registered Multi-Factor Authentication (MFA) Device",
  remove_old_mfa_device:
    "Remove Old Multi-Factor Authentication (MFA) Device",
  reset_mfa_method: "Reset Multi-Factor Authentication (MFA) Method",
  test_mfa_login: "Test Multi-Factor Authentication (MFA) Login",

  check_user_permissions: "Check User Permissions",
  grant_required_permission: "Grant Required Permission",
  test_permission_access: "Test Permission Access",

  check_shared_drive_permissions: "Check Shared Drive Permissions",
  grant_shared_drive_access: "Grant Shared Drive Access",
  test_shared_drive_access: "Test Shared Drive Access",

  check_install_permissions: "Check Software Installation Permissions",
  check_software_request_status: "Check Software Request Status",
  approve_software_request: "Approve Software Request",
  grant_install_permissions: "Grant Software Installation Permissions",
  test_software_install: "Test Software Installation",

  // EMAIL
  check_email_status: "Check Email Status",
  enable_email_client: "Enable Email Client",
  check_outbox: "Check Outbox",
  send_stuck_outbox_email: "Send Stuck Outbox Email",
  send_test_email: "Send Test Email",

  check_inbox_filters: "Check Inbox Filters",
  disable_inbox_filter: "Disable Inbox Filter",

  check_mailbox_storage: "Check Mailbox Storage",
  check_archive_policy: "Check Archive Policy",
  apply_archive_policy: "Apply Archive Policy",
  archive_old_emails: "Archive Old Emails",

  check_email_login_status: "Check Email Login Status",

check_saved_email_credentials:
  "Check Saved Email Credentials",

update_saved_email_credentials:
  "Update Saved Email Credentials",

reset_email_session: "Reset Email Session",
test_email_login: "Test Email Login",

  check_sync_settings: "Check Sync Settings",
  resync_email_client: "Resync Email Client",
  test_email_sync: "Test Email Sync",

  check_attachment_size: "Check Attachment Size",
  compress_attachment: "Compress Attachment",

  check_shared_mailbox_membership: "Check Shared Mailbox Membership",
  grant_shared_mailbox_access: "Grant Shared Mailbox Access",
  check_shared_mailbox_automapping:
    "Check Shared Mailbox Auto-Mapping",
  enable_shared_mailbox_automapping:
    "Enable Shared Mailbox Auto-Mapping",
  check_outlook_mailbox_configuration:
    "Check Outlook Mailbox Configuration",
  add_shared_mailbox_to_outlook_profile:
    "Add Shared Mailbox to Outlook Profile",
  test_shared_mailbox_access: "Test Shared Mailbox Access",

  // NETWORK / CONNECTIVITY
  check_wifi_status: "Check Wi-Fi Status",
  enable_wifi: "Enable Wi-Fi",
  test_connection: "Test Network Connection",

  check_network_status: "Check Network Status",
  check_proxy_settings: "Check Proxy Settings",
  disable_incorrect_proxy: "Disable Incorrect Proxy",
  check_network_speed: "Check Network Speed",
  check_network_adapter: "Check Network Adapter",
  restart_network_adapter: "Restart Network Adapter",
  test_internet_connection: "Test Internet Connection",
  check_ethernet_connection: "Check Ethernet Connection",
  reconnect_ethernet_cable: "Reconnect Ethernet Cable",
  open_command_prompt: "Open Command Prompt",
  ipconfig: "Inspect IP Configuration",
  open_it_knowledge_base: "Open IT Knowledge Base",
  open_kb_204: "Open KB-204",
  check_application_error: "Check Application Error",
  check_physical_network_connection: "Check Physical Network Connection",
  check_application_connection_settings: "Check Application Connection Settings",
  open_kb_app_connectivity: "Open KB-205",
  open_powershell: "Open PowerShell",
  ping_application_server: "ping 192.168.1.50",
  test_tcp_port_443: "Test-NetConnection 192.168.1.50 -Port 443",
  test_tcp_port_8443: "Test-NetConnection 192.168.1.50 -Port 8443",
  correct_application_port_configuration: "Correct Application Port Configuration",
  test_application_connection: "Test Application Connection",
  ping_default_gateway: "Ping Default Gateway",
  ping_external_ip: "Ping External IP Address",
  ipconfig_all: "Inspect Detailed IP Configuration",
  ipconfig_renew: "Renew IP Configuration",
  nslookup: "Verify DNS Name Resolution",
  ipconfig_displaydns: "ipconfig /displaydns",
  ipconfig_flushdns: "ipconfig /flushdns",
  ping_portal_hostname: "ping portal.office.example",
  test_website_access: "Verify Reported Website Problem",
  open_company_reporting_tool: "Open Company Reporting Tool",
  open_reporting_config_ini: "Inspect reporting configuration",
  inspect_tcp_8080_listener: "Inspect TCP listener on port 8080",
  identify_report_preview_process: "Identify Report Preview process",
  check_report_preview_tool: "Check Report Preview Tool",
  close_report_preview_tool: "Close Report Preview Tool",
  identify_company_reporting_process: "Identify reporting process",
  test_company_reporting_tool: "Test Company Reporting Tool",
  review_account_lockout_events: "Review Account Lockout Events",
  check_windows_credential_manager: "Check Windows Credential Manager",
  remove_outdated_credential: "Remove Outdated Credential",
  test_affected_network_resource: "Test Affected Network Resource",

  // FILES / STORAGE
  check_disk_space: "Check Disk Space",
  clear_temp_files: "Clear Temporary Files",
  confirm_storage_available: "Confirm Storage Availability",

  check_network_drive_mapping: "Check Network Drive Mapping",
  remap_network_drive: "Remap Network Drive",
  test_network_drive_access: "Test Network Drive Access",

  check_file_open_error: "Check File Open Error",
  check_file_association: "Check File Association",
  repair_file_association: "Repair File Association",
  test_file_open: "Test File Open",

  check_folder_permissions: "Check Folder Permissions",
  check_folder_security_group:
  "Check Folder Security Group",
  grant_folder_access: "Grant Folder Access",
  add_user_to_group: "Add User to Group",
  test_folder_access: "Test Folder Access",

  // DEVICE / PERFORMANCE
  check_running_apps: "Check Running Applications",
  close_unnecessary_apps: "Close Unnecessary Applications",
  test_performance: "Test System Performance",

  check_memory_usage: "Check Memory Usage",
  close_memory_heavy_apps: "Close Memory-Heavy Applications",
  inspect_task_manager: "Inspect Task Manager",
  inspect_resource_monitor: "Inspect Resource Monitor",
  review_application_support_information: "Review Application Support Information",
  safely_close_application: "Safely Close Application",
  verify_system_resource_utilization: "Verify System Resource Utilization",

  check_browser_extensions: "Check Browser Extensions",
  disable_unnecessary_extensions: "Disable Unnecessary Browser Extensions",
  test_browser_performance: "Test Browser Performance",

  // HARDWARE / PERIPHERALS
  test_printing: "Test Printing",
  check_print_queue: "Check Print Queue",
  check_login_error: "Check Login Error",
  open_active_directory: "Open Active Directory",
  locate_user_account: "Locate User Account",
  check_account_status: "Check Account Status",
  unlock_user_account: "Unlock User Account",
  test_user_login: "Test User Login",
  confirm_user_resolution: "Confirm User Resolution",
  check_printer_status: "Check Printer Status",
  check_printer_physical_status: "Check Printer Physical Status",
  check_printer_network_configuration: "Check Printer Network Configuration",
  check_printer_port: "Check Windows Printer Port",
  ping_printer: "ping 192.168.1.60",
  correct_printer_port_configuration: "Correct Printer Port Configuration",
  check_default_printer: "Check Default Printer",
  set_default_printer: "Set Default Printer",
  restart_printer: "Restart Printer",
  print_test_page: "Print Test Page",

  check_device_connection: "Check Device Connection",
  reconnect_device: "Reconnect Device",
  test_input_device: "Test Input Device",

  check_microphone_settings: "Check Microphone Settings",
  enable_microphone: "Enable Microphone",
  test_microphone: "Test Microphone",

  check_recording_device:
    "Check Recording Device",

  select_recording_device:
    "Select Recording Device",

  check_webcam_settings: "Check Webcam Settings",
  enable_webcam: "Enable Webcam",
  test_webcam: "Test Webcam",

  check_display_connection: "Check Display Connection",
  check_display_settings: "Check Display Settings",
  detect_second_monitor: "Detect Second Monitor",

  check_display_enabled_status:
    "Check Display Enabled Status",

  enable_second_display:
    "Enable Second Display",

  test_dual_display: "Test Dual Display",

  // SOFTWARE / APPLICATIONS
  check_app_status: "Check Application Status",
  check_application_status: "Check Application Status",
  restart_application: "Restart Application",
  check_email_client_profile: "Check Email Client Profile",
  repair_email_client_profile: "Repair Email Client Profile",
  test_application_launch: "Test Application Launch",
  check_software_version: "Check Software Version",
  install_software_update: "Install Software Update",
};

export function getPreviewStepLabel(step: string): string {
  return PREVIEW_STEP_LABELS[step] ?? step.replaceAll("_", " ");
}

export type ScenarioTypeId =
  | "standard"
  | "operational_challenges"
  | "chaos";

export type ScenarioType = {
  typeId: ScenarioTypeId;
  typeLabel: string;
  description: string;
  enabled: boolean;
  branches: readonly ScenarioTier[];
};

export const scenarioTree: ScenarioType[] = [
  {
    typeId: "standard",
    typeLabel: "Standard Scenarios",
    description: "Practice normal workplace troubleshooting procedures.",
    enabled: true,
    branches: generatedStandardScenarioBranches,
  },
   {
    typeId: "operational_challenges",
    typeLabel: "Operational Challenges",
    description: "Handle one realistic complication while completing the ticket.",
    enabled: true,
    branches: generatedOperationalScenarioBranches,
  },
    {
      typeId: "chaos",
      typeLabel: "Investigation Mode",
      description: "Investigate realistic tickets without guided procedures.",
      enabled: false,
      branches: [],
    },
];

export function getScenarioTypeDisplayLabel(
  scenarioId: ScenarioId
): string {
  for (const scenarioType of scenarioTree) {
    for (const branch of scenarioType.branches) {
      if (branch.scenarios.some((scenario) => scenario.id === scenarioId)) {
        switch (scenarioType.typeId) {
          case "standard":
            return "Standard";

          case "operational_challenges":
            return "Operational Challenge";

          case "chaos":
            return "Chaos";
        }
      }
    }
  }

  return "Standard";
}
