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
    "password_reset_challenges",
    "vpn_access_challenges",
    "shared_drive_access_challenges",
    "files_storage",
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
  send_test_email: "Send Test Email",

  check_inbox_filters: "Check Inbox Filters",
  disable_inbox_filter: "Disable Inbox Filter",

  check_mailbox_storage: "Check Mailbox Storage",
  check_archive_policy: "Check Archive Policy",
  apply_archive_policy: "Apply Archive Policy",
  archive_old_emails: "Archive Old Emails",

  check_email_login_status: "Check Email Login Status",
  reset_email_session: "Reset Email Session",
  test_email_login: "Test Email Login",

  check_sync_settings: "Check Sync Settings",
  resync_email_client: "Resync Email Client",
  test_email_sync: "Test Email Sync",

  check_attachment_size: "Check Attachment Size",
  compress_attachment: "Compress Attachment",

  check_shared_mailbox_membership: "Check Shared Mailbox Membership",
  grant_shared_mailbox_access: "Grant Shared Mailbox Access",
  check_outlook_mailbox_configuration:
    "Check Outlook Mailbox Configuration",
  add_shared_mailbox_to_outlook_profile:
    "Add Shared Mailbox to Outlook Profile",
  test_shared_mailbox_access: "Test Shared Mailbox Access",

  // NETWORK / CONNECTIVITY
  check_wifi_status: "Check Wi-Fi Status",
  enable_wifi: "Enable Wi-Fi",
  test_connection: "Test Network Connection",

  check_network_speed: "Check Network Speed",
  check_network_adapter: "Check Network Adapter",
  check_ethernet_connection: "Check Ethernet Connection",
  reconnect_ethernet_cable: "Reconnect Ethernet Cable",

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
  grant_folder_access: "Grant Folder Access",
  test_folder_access: "Test Folder Access",

  // DEVICE / PERFORMANCE
  check_running_apps: "Check Running Applications",
  close_unnecessary_apps: "Close Unnecessary Applications",
  test_performance: "Test System Performance",

  check_memory_usage: "Check Memory Usage",
  close_memory_heavy_apps: "Close Memory-Heavy Applications",

  check_browser_extensions: "Check Browser Extensions",
  disable_unnecessary_extensions: "Disable Unnecessary Browser Extensions",
  test_browser_performance: "Test Browser Performance",

  // HARDWARE / PERIPHERALS
  check_printer_status: "Check Printer Status",
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

  check_webcam_settings: "Check Webcam Settings",
  enable_webcam: "Enable Webcam",
  test_webcam: "Test Webcam",

  check_display_connection: "Check Display Connection",
  check_display_settings: "Check Display Settings",
  detect_second_monitor: "Detect Second Monitor",
  test_dual_display: "Test Dual Display",

  // SOFTWARE / APPLICATIONS
  check_app_status: "Check Application Status",
  check_application_status: "Check Application Status",
  restart_application: "Restart Application",
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
    typeLabel: "Chaos Scenarios",
    description: "Multiple issues interact at once.",
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
