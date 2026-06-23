import {
  getScenarioPreviewSteps,
  getScenarioLabel,
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
  | "Email"
  | "Network"
  | "Files / Storage"
  | "Device / Performance"
  | "Hardware / Peripherals"
  | "Software / Applications";

type ScenarioTier = {
  tierId: ScenarioTierId;
  tierLabel: ScenarioTierLabel;
  scenarios: ScenarioPreview[];
};

const DEFAULT_LEVEL: ScenarioLevel = "Beginner";

const DEFAULT_ESTIMATED_TIME: EstimatedTime = "3–5 min";

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
  reset_mfa_method: "Reset Multi-Factor Authentication (MFA) Method",
  test_mfa_login: "Test Multi-Factor Authentication (MFA) Login",

  check_user_permissions: "Check User Permissions",
  grant_required_permission: "Grant Required Permission",
  test_permission_access: "Test Permission Access",

  check_shared_drive_permissions: "Check Shared Drive Permissions",
  grant_shared_drive_access: "Grant Shared Drive Access",
  test_shared_drive_access: "Test Shared Drive Access",

  check_install_permissions: "Check Software Installation Permissions",
  grant_install_permissions: "Grant Software Installation Permissions",
  test_software_install: "Test Software Installation",

  // EMAIL
  check_email_status: "Check Email Status",
  enable_email_client: "Enable Email Client",
  send_test_email: "Send Test Email",

  check_inbox_filters: "Check Inbox Filters",
  disable_inbox_filter: "Disable Inbox Filter",

  check_mailbox_storage: "Check Mailbox Storage",
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
  branches: ScenarioTier[];
};

const standardScenarioBranches: ScenarioTier[] = [
  {
    tierId: "account_access",
    tierLabel: "Account / Access",
    scenarios: [
{
  id: "password_reset",
  label: getScenarioLabel("password_reset"),
        selectCommand: "select password reset",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description: "Reset the user’s password after verifying identity.",
        skillFocus: ["Identity Verification", "Account Recovery"],
        scenarioContext:
          "Employee cannot access their company account after forgetting their password.",
        successOutcome: "The user regains secure account access.",
         
        previewSteps: getScenarioPreviewSteps("password_reset"),
      },
      {
        id: "account_lockout",
        label: getScenarioLabel("account_lockout"),
        selectCommand: "select account lockout",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description: "Unlock the user’s account after verifying identity.",
        skillFocus: ["Identity Verification", "Account Recovery"],
        scenarioContext:
          "Employee is locked out after too many failed sign-in attempts.",
        successOutcome: "The user regains secure account access.",
         
        previewSteps: getScenarioPreviewSteps("account_lockout"),
      },
      {
      id: "vpn_access_issue",
      label: getScenarioLabel("vpn_access_issue"),
        selectCommand: "select vpn access issue",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restore Virtual Private Network (VPN) access so the user can connect to the work network.",
        skillFocus: [
          "Remote Access Troubleshooting",
          "Network Access Verification",
        ],
        scenarioContext:
          "Remote employee cannot connect to the company VPN.",
        successOutcome:
          "User successfully connects to the company network.",
         
        previewSteps: getScenarioPreviewSteps("vpn_access_issue"),
      },
      {
        id: "mfa_code_not_working",
        label: getScenarioLabel("mfa_code_not_working"),
        selectCommand: "select mfa code not working",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Reset a failing Multi-Factor Authentication (MFA) method and confirm sign-in works.",
        skillFocus: [
          "Authentication Troubleshooting",
          "Account Security",
          "Login Verification",
        ],
        scenarioContext:
          "A customer reports that their MFA code is not working during sign-in.",
        successOutcome:
          "The customer can complete MFA and sign in successfully.",
         
        previewSteps: getScenarioPreviewSteps("mfa_code_not_working"),
      },
      {
        id: "permissions_denied",
        label: getScenarioLabel("permissions_denied"),
        selectCommand: "select permissions denied",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description: "Restore access after checking the user's permissions.",
        skillFocus: [
          "Permission Troubleshooting",
          "Access Control",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports they are blocked by a permissions denied message.",
        successOutcome:
          "The customer can access the required resource successfully.",
         
        previewSteps: getScenarioPreviewSteps("permissions_denied"),
      },
      {
        id: "shared_drive_access_issue",
        label: getScenarioLabel("shared_drive_access_issue"),
        selectCommand: "select shared drive access issue",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description: "Restore shared drive access after checking permissions.",
        skillFocus: [
          "Access Troubleshooting",
          "Permission Verification",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports they cannot access their team shared drive.",
        successOutcome:
          "The customer can open and use the shared drive.",
         
        previewSteps: getScenarioPreviewSteps("shared_drive_access_issue"),
      },
      {
        id: "cannot_install_software",
        label: getScenarioLabel("cannot_install_software"),
        selectCommand: "select cannot install software",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restore software installation access after checking permissions.",
        skillFocus: [
          "Permission Troubleshooting",
          "Software Access",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports they cannot install software on their computer.",
        successOutcome:
          "The customer can install the required software successfully.",
         
        previewSteps: getScenarioPreviewSteps("cannot_install_software"),
      },
    ],
  },

  {
    tierId: "email",
    tierLabel: "Email",
    scenarios: [
      {
        id: "email_not_sending",
        label: getScenarioLabel("email_not_sending"),
        selectCommand: "select email not sending",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Bring the email client online and confirm outgoing mail works.",
        skillFocus: ["Email Troubleshooting", "Client Configuration"],
        scenarioContext:
          "Employee can receive email but outgoing messages are failing.",
        successOutcome: "Outgoing email functions normally.",
         
        previewSteps: getScenarioPreviewSteps("email_not_sending"),
      },
      {
        id: "not_receiving_email",
        label: getScenarioLabel("not_receiving_email"),
        selectCommand: "select not receiving email",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Correct inbox filtering so the user can receive email again.",
        skillFocus: ["Inbox Troubleshooting", "Email Flow Verification"],
        scenarioContext:
          "Important incoming emails are not appearing in the inbox.",
        successOutcome:
          "Incoming email delivery works normally again.",
         
        previewSteps: getScenarioPreviewSteps("not_receiving_email"),
      },
      {
        id: "mailbox_full",
        label: getScenarioLabel("mailbox_full"),
        selectCommand: "select mailbox full",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Free mailbox storage space so new emails can arrive normally.",
        skillFocus: [
          "Mailbox Troubleshooting",
          "Storage Management",
          "Email Verification",
        ],
        scenarioContext:
          "The customer is no longer receiving new email because the mailbox storage limit has been reached.",
        successOutcome:
          "New emails arrive normally after mailbox space is recovered.",
         
        previewSteps: getScenarioPreviewSteps("mailbox_full"),
      },
      {
        id: "email_login_issue",
        label: getScenarioLabel("email_login_issue"),
        selectCommand: "select email login issue",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restore email sign-in after checking the login session.",
        skillFocus: [
          "Email Access Troubleshooting",
          "Session Recovery",
          "Login Verification",
        ],
        scenarioContext:
          "The customer cannot sign in to their email account.",
        successOutcome:
          "The customer can sign in to email successfully.",
         
        previewSteps: getScenarioPreviewSteps("email_login_issue"),
      },
      {
        id: "email_client_not_syncing",
        label: getScenarioLabel("email_client_not_syncing"),
        selectCommand: "select email client not syncing",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restore email synchronization in the email client.",
        skillFocus: [
          "Email Troubleshooting",
          "Sync Recovery",
          "Client Verification",
        ],
        scenarioContext:
          "The customer’s email application is open but not receiving updated emails.",
        successOutcome:
          "The email client synchronizes normally again.",
         
        previewSteps: getScenarioPreviewSteps("email_client_not_syncing"),
      },
      {
        id: "attachment_too_large",
        label: getScenarioLabel("attachment_too_large"),
        selectCommand: "select attachment too large",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Resolve an email sending issue caused by an oversized attachment.",
        skillFocus: [
          "Email Troubleshooting",
          "Attachment Handling",
          "Operational Verification",
        ],
        scenarioContext:
          "The customer cannot send an email because the attachment is too large.",
        successOutcome:
          "The customer can send the email successfully after reducing the attachment size.",
         
        previewSteps: getScenarioPreviewSteps("attachment_too_large"),
      },
      {
        id: "shared_mailbox_missing",
        label: getScenarioLabel("shared_mailbox_missing"),
        selectCommand: "select shared mailbox missing",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description: "Restore access to a missing shared mailbox.",
        skillFocus: [
          "Mailbox Permissions",
          "Access Recovery",
          "Email Verification",
        ],
        scenarioContext:
          "The customer cannot see or open a shared mailbox they normally use.",
        successOutcome:
          "The shared mailbox becomes accessible again.",
         
        previewSteps: getScenarioPreviewSteps("shared_mailbox_missing"),
      },
    ],
  },

  {
    tierId: "network",
    tierLabel: "Network",
    scenarios: [
      {
        id: "cannot_connect_wifi",
        label: getScenarioLabel("cannot_connect_wifi"),
        selectCommand: "select cannot connect wifi",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restore Wi-Fi connectivity and confirm internet access works.",
        skillFocus: [
          "Wireless Troubleshooting",
          "Connectivity Verification",
        ],
        scenarioContext:
          "User device cannot connect to the wireless network.",
        successOutcome:
          "The device reconnects to Wi-Fi and internet access is restored.",
         
        previewSteps: getScenarioPreviewSteps("cannot_connect_wifi"),
      },
      {
        id: "internet_no_access",
        label: getScenarioLabel("internet_no_access"),
        selectCommand: "select internet no access",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restore internet connectivity after troubleshooting the network connection.",
        skillFocus: [
          "Network Troubleshooting",
          "Connectivity Verification",
        ],
        scenarioContext:
          "The device is connected to the network but cannot access the internet.",
        successOutcome:
          "Internet connectivity is restored successfully.",
         
        previewSteps: getScenarioPreviewSteps("internet_no_access"),
      },
      {
        id: "slow_network_connection",
        label: getScenarioLabel("slow_network_connection"),
        selectCommand: "select slow network connection",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restore normal network performance after checking connection speed.",
        skillFocus: [
          "Network Troubleshooting",
          "Performance Diagnosis",
          "Connectivity Verification",
        ],
        scenarioContext:
          "The customer reports that the internet connection is working but extremely slow.",
        successOutcome:
          "Network speed returns to normal and the connection remains stable.",
         
        previewSteps: getScenarioPreviewSteps("slow_network_connection"),
      },
      {
        id: "ethernet_not_connected",
        label: getScenarioLabel("ethernet_not_connected"),
        selectCommand: "select ethernet not connected",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restore a disconnected wired network connection.",
        skillFocus: [
          "Network Troubleshooting",
          "Physical Connectivity",
          "Operational Verification",
        ],
        scenarioContext:
          "The computer reports that the ethernet cable is disconnected.",
        successOutcome:
          "The wired network connection is restored successfully.",
         
        previewSteps: getScenarioPreviewSteps("ethernet_not_connected"),
      },
    ],
  },

  {
    tierId: "files_storage",
    tierLabel: "Files / Storage",
    scenarios: [
      {
        id: "disk_space_full",
        label: getScenarioLabel("disk_space_full"),
        selectCommand: "select disk space full",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description: "Recover storage space by clearing temporary files.",
        skillFocus: ["Storage Troubleshooting", "System Cleanup"],
        scenarioContext:
          "The device is critically low on storage space.",
        successOutcome:
          "Enough storage space is recovered for normal operation.",
         
        previewSteps: getScenarioPreviewSteps("disk_space_full"),
      },
      {
        id: "network_drive_missing",
        label: getScenarioLabel("network_drive_missing"),
        selectCommand: "select network drive missing",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description: "Restore a missing mapped network drive.",
        skillFocus: [
          "File Access Troubleshooting",
          "Drive Mapping",
          "Operational Verification",
        ],
        scenarioContext:
          "The customer cannot see their team network drive in File Explorer.",
        successOutcome:
          "The customer can see and open the network drive again.",
         
        previewSteps: getScenarioPreviewSteps("network_drive_missing"),
      },
      {
        id: "cannot_open_file",
        label: getScenarioLabel("cannot_open_file"),
        selectCommand: "select cannot open file",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Repair a broken file association so the customer can open the file normally.",
        skillFocus: [
          "File Troubleshooting",
          "File Association Repair",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports that a file will not open correctly on their computer.",
        successOutcome:
          "The file opens normally again.",
         
        previewSteps: getScenarioPreviewSteps("cannot_open_file"),
      },
      {
        id: "folder_access_missing",
        label: getScenarioLabel("folder_access_missing"),
        selectCommand: "select folder access missing",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restore access to a missing or unavailable work folder.",
        skillFocus: [
          "Folder Access Troubleshooting",
          "Permission Verification",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports they cannot access a folder they need for work.",
        successOutcome:
          "The customer can open and use the folder successfully.",
         
        previewSteps: getScenarioPreviewSteps("folder_access_missing"),
      },
    ],
  },

  {
    tierId: "device_performance",
    tierLabel: "Device / Performance",
    scenarios: [
      {
        id: "too_many_apps_running",
        label: getScenarioLabel("too_many_apps_running"),
        selectCommand: "select too many apps running",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Close unnecessary applications and confirm the device responds normally.",
        skillFocus: [
          "Performance Troubleshooting",
          "Resource Management",
        ],
        scenarioContext:
          "Device performance is degraded because too many applications are running.",
        successOutcome:
          "Device performance returns to normal responsiveness.",
         
        previewSteps: getScenarioPreviewSteps("too_many_apps_running"),
      },
      {
        id: "low_memory",
        label: getScenarioLabel("low_memory"),
        selectCommand: "select low memory",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Close memory-heavy applications and confirm performance improves.",
        skillFocus: [
          "Performance Troubleshooting",
          "Memory Usage",
          "Operational Verification",
        ],
        scenarioContext:
          "The device is slow because memory usage is too high.",
        successOutcome:
          "Memory usage is reduced and performance returns to normal.",
         
        previewSteps: getScenarioPreviewSteps("low_memory"),
      },
      {
        id: "browser_running_slow",
        label: getScenarioLabel("browser_running_slow"),
        selectCommand: "select browser running slow",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Disable unnecessary browser extensions and confirm browser performance improves.",
        skillFocus: [
          "Browser Troubleshooting",
          "Performance Optimization",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports that their browser is running slowly.",
        successOutcome:
          "The browser responds normally after unnecessary extensions are disabled.",
         
        previewSteps: getScenarioPreviewSteps("browser_running_slow"),
      },
    ],
  },

  {
    tierId: "hardware_peripherals",
    tierLabel: "Hardware / Peripherals",
    scenarios: [
      {
        id: "printer_not_working",
        label: getScenarioLabel("printer_not_working"),
        selectCommand: "select printer not working",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Troubleshoot printer connectivity and confirm printing works.",
        skillFocus: [
          "Printer Troubleshooting",
          "Device Recovery",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports that the printer is not responding.",
        successOutcome: "Printer functionality is restored.",
         
        previewSteps: getScenarioPreviewSteps("printer_not_working"),
      },
      {
        id: "mouse_keyboard_not_working",
        label: getScenarioLabel("mouse_keyboard_not_working"),
        selectCommand: "select mouse keyboard not working",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Troubleshoot unresponsive input devices and confirm normal operation.",
        skillFocus: [
          "Device Troubleshooting",
          "Connection Verification",
          "Peripheral Recovery",
        ],
        scenarioContext:
          "A customer reports that their mouse and keyboard are not responding.",
        successOutcome:
          "Restore normal mouse and keyboard functionality.",
         
        previewSteps: getScenarioPreviewSteps("mouse_keyboard_not_working"),
      },
      {
        id: "microphone_not_working",
        label: getScenarioLabel("microphone_not_working"),
        selectCommand: "select microphone not working",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description: "Restore microphone input and confirm audio works.",
        skillFocus: [
          "Peripheral Troubleshooting",
          "Device Settings",
          "Audio Verification",
        ],
        scenarioContext:
          "A customer reports that their microphone is not working during calls.",
        successOutcome:
          "The microphone captures audio normally during calls.",
         
        previewSteps: getScenarioPreviewSteps("microphone_not_working"),
      },
      {
        id: "webcam_not_working",
        label: getScenarioLabel("webcam_not_working"),
        selectCommand: "select webcam not working",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restore webcam functionality and confirm video works.",
        skillFocus: [
          "Peripheral Troubleshooting",
          "Video Device Settings",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports that their webcam is not working during video calls.",
        successOutcome:
          "The webcam displays video normally during calls.",
         
        previewSteps: getScenarioPreviewSteps("webcam_not_working"),
      },
      {
        id: "second_monitor_not_detected",
        label: getScenarioLabel("second_monitor_not_detected"),
        selectCommand: "select second monitor not detected",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Detect a second monitor and confirm dual display works.",
        skillFocus: [
          "Display Troubleshooting",
          "Peripheral Detection",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports that their second monitor is not being detected.",
        successOutcome:
          "Both monitors are detected and displaying correctly.",
         
        previewSteps: getScenarioPreviewSteps("second_monitor_not_detected"),
      },
    ],
  },

  {
    tierId: "software_applications",
    tierLabel: "Software / Applications",
    scenarios: [
      {
        id: "software_app_not_opening",
        label: getScenarioLabel("software_app_not_opening"),
        selectCommand: "select software app not opening",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restart the affected application and confirm it opens normally.",
        skillFocus: [
          "Application Troubleshooting",
          "Basic Software Recovery",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports that a work application will not open.",
        successOutcome:
          "The application launches and responds normally.",
         
        previewSteps: getScenarioPreviewSteps("software_app_not_opening"),
      },
      {
        id: "application_crash",
        label: getScenarioLabel("application_crash"),
        selectCommand: "select application crash",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Restart a crashing application and confirm it stays stable.",
        skillFocus: [
          "Application Troubleshooting",
          "Crash Recovery",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports that a work application keeps crashing.",
        successOutcome:
          "The application runs normally without crashing.",
         
        previewSteps: getScenarioPreviewSteps("application_crash"),
      },
      {
        id: "software_update_required",
        label: getScenarioLabel("software_update_required"),
        selectCommand: "select software update required",
        level: DEFAULT_LEVEL,
        estimatedTime: DEFAULT_ESTIMATED_TIME,
        description:
          "Install a required software update and confirm the application works.",
        skillFocus: [
          "Software Troubleshooting",
          "Update Management",
          "Operational Verification",
        ],
        scenarioContext:
          "A customer reports that a work application requires an update before it can be used.",
        successOutcome:
          "The required software update is installed and the application works normally.",
         
        previewSteps: getScenarioPreviewSteps("software_update_required"),
      },
    ],
  },
];
export const scenarioTree: ScenarioType[] = [
  {
    typeId: "standard",
    typeLabel: "Standard Scenarios",
    description: "Practice normal workplace troubleshooting procedures.",
    enabled: true,
    branches: standardScenarioBranches,
  },
  {
    typeId: "operational_challenges",
    typeLabel: "Operational Challenges",
    description: "Handle one realistic complication while completing the ticket.",
    enabled: true,
    branches: [
      {
        tierId: "password_reset_challenges",
        tierLabel: "Password Reset",
scenarios: [
  {
    id: "password_reset_recovery_email_never_arrives",
    label: getScenarioLabel("password_reset_recovery_email_never_arrives"),
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Resolve a password reset when the recovery email does not arrive.",
    skillFocus: [
      "Account Recovery",
      "Email Delivery Troubleshooting",
      "Dependency Awareness",
    ],
    scenarioContext:
      "Employee cannot access their company account after forgetting their password.",
    successOutcome:
      "The user receives the recovery code and regains secure account access.",
    previewSteps: getScenarioPreviewSteps(
      "password_reset_recovery_email_never_arrives"
    ),
    selectCommand:
      "select password_reset_recovery_email_never_arrives",
  },

  {
    id: "password_reset_recovery_email_outdated",
    label: getScenarioLabel("password_reset_recovery_email_outdated"),
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Resolve a password reset when the recovery email on file is no longer accessible.",
    skillFocus: [
      "Account Recovery",
      "Alternate Contact Verification",
      "Security Process Awareness",
    ],
    scenarioContext:
      "Employee cannot access their company account because the recovery email on file is outdated.",
    successOutcome:
      "The recovery email is securely updated and account access is restored.",
    previewSteps: getScenarioPreviewSteps(
      "password_reset_recovery_email_outdated"
    ),
    selectCommand:
      "select password_reset_recovery_email_outdated",
  },
],
      },
      {
        tierId: "vpn_access_challenges",
        tierLabel: "VPN Access",
        scenarios: [
          {
            id: "vpn_mfa_dependency_missing",
            label: getScenarioLabel("vpn_mfa_dependency_missing"),
            level: "Beginner",
            estimatedTime: "5–7 min",
            description:
              "Resolve a VPN access issue when Multi-Factor Authentication (MFA) has not been configured.",
            skillFocus: [
              "VPN Troubleshooting",
              "Authentication Dependencies",
              "Access Verification",
            ],
            scenarioContext:
              "A user has VPN access assigned but cannot complete the connection because MFA is not configured.",
            successOutcome:
              "The user successfully connects after the MFA dependency is resolved.",
            previewSteps: getScenarioPreviewSteps(
              "vpn_mfa_dependency_missing"
            ),
            selectCommand:
              "select vpn_mfa_dependency_missing",
          },
        ],
      },
      {
        tierId: "shared_drive_access_challenges",
        tierLabel: "Shared Drive Access",
        scenarios: [
          {
            id: "shared_drive_group_membership_missing",
            label: getScenarioLabel("shared_drive_group_membership_missing"),
            level: "Beginner",
            estimatedTime: "5–7 min",
            description:
              "Resolve shared drive access when the user is missing from the required access group.",
            skillFocus: [
              "Shared Drive Access",
              "Group Membership",
              "Permission Troubleshooting",
            ],
            scenarioContext:
              "Employee cannot access a shared drive because they are not a member of the required access group.",
            successOutcome:
              "The user is added to the required group and can access the shared drive.",
            previewSteps: getScenarioPreviewSteps(
              "shared_drive_group_membership_missing"
            ),
            selectCommand:
              "select shared_drive_group_membership_missing",
          },
        ],
      },
      {
        tierId: "files_storage",
        tierLabel: "Files / Storage",
        scenarios: [
          {
            id: "network_drive_vpn_required_first",
            label: getScenarioLabel("network_drive_vpn_required_first"),
            level: "Beginner",
            estimatedTime: "5–7 min",
            description:
              "Resolve a missing network drive when VPN access must be restored before drive mapping can be repaired.",
            skillFocus: [
              "VPN Troubleshooting",
              "Network Drive Access",
              "Dependency Awareness",
            ],
            scenarioContext:
              "A user cannot see their team network drive because VPN access is not assigned.",
            successOutcome:
              "VPN access is restored, the network drive is remapped, and access is successfully verified.",
            previewSteps: getScenarioPreviewSteps(
              "network_drive_vpn_required_first"
            ),
            selectCommand:
              "select network_drive_vpn_required_first",
          },
        ],
      },
            {
        tierId: "email",
        tierLabel: "Email",
        scenarios: [
          {
            id: "not_receiving_email_inbox_rule_redirecting",
            label: getScenarioLabel(
              "not_receiving_email_inbox_rule_redirecting"
            ),
            level: "Beginner",
            estimatedTime: "5–7 min",
            description:
              "Resolve an email delivery issue caused by an inbox rule redirecting incoming mail.",
            skillFocus: [
              "Email Troubleshooting",
              "Inbox Rules",
              "Dependency Awareness",
            ],
            scenarioContext:
              "A user reports that important incoming emails never appear in their inbox.",
            successOutcome:
              "The redirecting inbox rule is removed and incoming email delivery is verified.",
            previewSteps: getScenarioPreviewSteps(
              "not_receiving_email_inbox_rule_redirecting"
            ),
            selectCommand:
              "select not_receiving_email_inbox_rule_redirecting",
          },
        ],
      },
      {
        tierId: "software_applications",
        tierLabel: "Software App Won’t Open",
        scenarios: [
          {
            id: "software_app_license_not_assigned",
            label: getScenarioLabel("software_app_license_not_assigned"),
            level: "Beginner",
            estimatedTime: "5–7 min",
            description:
              "Resolve an application launch issue caused by a missing software license assignment.",
            skillFocus: [
              "Software Licensing",
              "Application Access",
              "Entitlement Troubleshooting",
            ],
            scenarioContext:
              "A user cannot open a work application because the required software license is not assigned.",
            successOutcome:
              "The required software license is assigned and the application launches successfully.",
            previewSteps: getScenarioPreviewSteps(
              "software_app_license_not_assigned"
            ),
            selectCommand:
              "select software_app_license_not_assigned",
          },
        ],
      },
    ],
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
