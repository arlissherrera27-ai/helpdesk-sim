import type { ScenarioId } from "./scenarios";
import type {
  EvidenceItem,
  LogEvent,
  ScenarioFacts,
} from "./types";
import type {
  ProcedureResultPresentation,
  TechnicalOutputLine,
} from "./procedurePresentation";
import { DHCP_EDUCATIONAL_CONTENT } from "./dhcpEducationalContent";
import { DNS_LOOKUP_EDUCATIONAL_CONTENT } from "./dnsLookupEducationalContent";
import { NETWORK_PRINTER_EDUCATIONAL_CONTENT } from "./networkPrinterEducationalContent";
import { TCP_PORT_EDUCATIONAL_CONTENT } from "./tcpPortEducationalContent";
import { ACTIVE_DIRECTORY_LOCKOUT_EDUCATIONAL_CONTENT } from "./activeDirectoryLockoutEducationalContent";
import { ACTIVE_NETWORK_CONNECTIONS_EDUCATIONAL_CONTENT } from "./activeNetworkConnectionsEducationalContent";
import { COMPUTER_RUNNING_SLOWLY_EDUCATIONAL_CONTENT } from "./computerRunningSlowlyEducationalContent";

type ScenarioProcedureStep = {
  command: string;
  preview: string;
  technicianEntry?: string;
  systemResult?: string;
  technicalOutput?: string;
  evidence?: EvidenceItem;
};

type InvestigationRelatedAction = {
  agent?: string;
  system: string;
  customer?: string;
  evidence?: EvidenceItem;
};

type ScenarioLevel =
  | "Beginner"
  | "Intermediate"
  | "Advanced";

type ScenarioEstimatedTime =
  | "3–5 min"
  | "5–7 min"
  | "5–8 min"
  | "8–12 min";

export type ScenarioTypeId =
  | "standard"
  | "operational_challenges"
  | "chaos";

export type ScenarioCategoryId =
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

type ScenarioPreviewMetadata = {
  level: ScenarioLevel;
  estimatedTime: ScenarioEstimatedTime;
  description: string;
  skillFocus: readonly string[];
  scenarioContext: string;
  successOutcome: string;
  selectCommand: string;
};

type ScenarioDefinition = {
  label: string;
  startPrompt: string;
  scenarioType: ScenarioTypeId;
  category: ScenarioCategoryId;
  procedure: readonly ScenarioProcedureStep[];

  investigation?: {
    relatedActions: Readonly<Record<string, InvestigationRelatedAction>>;
  };

  completion: {
    command: string;
    fact: string;
  };
  proofLines: readonly string[];
  successLines: readonly string[];
  defaults: ScenarioFacts;
  previewMetadata: ScenarioPreviewMetadata;
};

// Official scenario truth. Commands are internal; preview text is user-facing.

export const SCENARIO_REGISTRY = {
password_reset: {
  label: "Password Reset",
  startPrompt: `Customer: I lost access to my password. Can you help me?

What is your first troubleshooting step?`,
  scenarioType: "standard",
  category: "account_access",
  procedure: [
    {
      command: "verify_identity",
      preview: "Verify the user's identity to ensure they are authorized to recover the account.",
    },
    {
      command: "send_reset_code",
      preview: "Send a recovery code to the verified contact on file.",
    },
    {
      command: "confirm_reset",
      preview:
          "Validate the recovery code to confirm ownership of the recovery method.",
      },
      {
        command: "set_new_password",
        preview:
          "Update the account password using the verified recovery process.",
      },
      {
        command: "test_sign_in",
        preview: "Test sign-in to confirm account access has been restored.",
      },
    ],

        completion: {
      command: "test_sign_in",
      fact: "can_login_now",
    },

    proofLines: [
      "Verified account ownership before making account changes",
      "Confirmed control of the recovery method",
      "Successfully restored account access through the approved recovery process",
    ],

    successLines: [
      "Agent: The password reset has been completed and account access has been verified.",
      "System: The user can sign in successfully after completing the approved recovery process.",
      "Customer: Perfect, I’m back in.",
    ],

defaults: {
  kind: "password_reset",
  identity_verified: false,
  code_sent: false,
  has_recovery_email: true,
  reset_done: false,
  password_updated: false,
  can_login_now: false,
  wrong_attempts: 0,
},

previewMetadata: {
  level: "Beginner",
  estimatedTime: "3–5 min",
  description:
    "Reset the user’s password after verifying identity.",
  skillFocus: [
    "Identity Verification",
    "Account Recovery",
  ],
  scenarioContext:
    "Employee cannot access their company account after forgetting their password.",
  successOutcome:
    "The user regains secure account access.",
  selectCommand:
    "select password reset",
},
},

password_reset_recovery_email_never_arrives: {
  label: "Password Reset — Recovery Email Never Arrives",
  startPrompt: `Customer: I forgot my password and can’t get into my company account.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "password_reset_challenges",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity to ensure they are authorized to recover the account.",
      },
      {
        command: "send_reset_code",
        preview: "Send a recovery code to the verified contact on file.",
      },
      {
        command: "check_inbox_filters",
        preview:
          "Check whether an inbox filter is blocking the recovery email.",
      },
      {
        command: "disable_inbox_filter",
        preview:
          "Disable the inbox filter that is preventing the recovery email from arriving.",
      },
      {
        command: "resend_reset_code",
        preview:
          "Resend the recovery code after fixing the delivery issue.",
      },
      {
        command: "confirm_reset",
        preview:
          "Validate the recovery code to confirm ownership of the recovery method.",
      },
      {
        command: "set_new_password",
        preview:
          "Update the account password using the verified recovery process.",
      },
      {
        command: "test_sign_in",
        preview: "Test sign-in to confirm account access has been restored.",
      },
    ],

      completion: {
      command: "test_sign_in",
      fact: "can_login_now",
    },

    proofLines: [
      "Verified account ownership before making account changes",
      "Identified that the recovery email was blocked by an inbox filter",
      "Corrected the inbox filter before resending the recovery code",
      "Confirmed control of the recovery method after resolving the delivery issue",
      "Successfully restored account access through the approved recovery process",
    ],

    successLines: [
      "Agent: The recovery email delivery issue has been resolved and account access has been restored.",
      "System: The inbox filter was corrected before the recovery code was resent and verified.",
      "Customer: Perfect, I’m back in.",
    ],

    defaults: {
      kind: "password_reset_recovery_email_never_arrives",
      identity_verified: false,
      code_sent: false,
      email_arrived: false,
      inbox_filter_checked: false,
      inbox_filter_enabled: true,
      reset_done: false,
      password_updated: false,
      can_login_now: false,
      wrong_attempts: 0,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "5–8 min",
      description:
        "Complete a password reset when the recovery email is blocked by an inbox filter.",
      skillFocus: [
        "Account Recovery",
        "Email Delivery Troubleshooting",
        "Dependency Awareness",
      ],
      scenarioContext:
        "A user cannot reset their password because the recovery email never reaches their inbox.",
      successOutcome:
        "The blocking inbox filter is corrected, the recovery code is received, and account access is restored.",
      selectCommand:
        "select password reset recovery email never arrives",
    },
  },

account_lockout: {
  label: "Account Lockout",
  startPrompt: `Customer: I’m locked out of my account and can’t sign in.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "account_access",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before making account access changes.",
      },
      {
        command: "request_unlock",
        preview:
          "Request an account unlock after confirming the user is authorized.",
      },
      {
        command: "confirm_unlock",
        preview:
          "Confirm the unlock and verify sign-in access has been restored.",
      },
    ],

    completion: {
      command: "confirm_unlock",
      fact: "can_login_now",
    },

    proofLines: [
      "Verified account ownership before requesting unlock",
      "Confirmed the account was eligible to be unlocked",
      "Restored sign-in access by removing the lockout restriction",
    ],

    successLines: [
      "Agent: The account lockout has been cleared and sign-in access has been verified.",
      "System: The account is unlocked and authentication restrictions have been removed.",
      "Customer: Perfect, I can sign in now.",
    ],

defaults: {
  kind: "account_lockout",
  identity_verified: false,
  unlock_requested: false,
  account_locked: true,
  can_login_now: false,
},

previewMetadata: {
  level: "Beginner",
  estimatedTime: "3–5 min",
  description:
    "Unlock the user’s account after verifying identity.",
  skillFocus: [
    "Identity Verification",
    "Account Recovery",
  ],
  scenarioContext:
    "Employee is locked out after too many failed sign-in attempts.",
  successOutcome:
    "The user regains secure account access.",
  selectCommand:
    "select account lockout",
},
},

active_directory_locked_employee_account: {
  label: "Active Directory — Locked Employee Account",
  startPrompt: `Customer: I changed my password earlier today, and now I can't sign in to my work computer. It keeps telling me that my account is locked. I'm using my new password, but I still can't get in.

What is your first troubleshooting step?`,
  scenarioType: "standard",
  category: "account_access",
  procedure: [
    { command: "verify_identity", preview: "Verify user identity.", technicianEntry: "verify_identity", systemResult: "The user's identity has been successfully verified.", technicalOutput: "Identity Verification: Successful\nUser Status: Verified", evidence: { id: "ad-lockout-identity", text: "Alex Morgan's identity was verified before account troubleshooting." } },
    { command: "check_login_error", preview: "Check Login Error", technicianEntry: "check_login_error", systemResult: "The reported Windows sign-in problem has been confirmed. Windows reports that the user's account is currently locked.", technicalOutput: "Windows Sign-in\n\nCORP\\amorgan\n\nThe referenced account is currently locked out\nand may not be logged on to.", evidence: { id: "ad-lockout-login-error", text: "Windows reports that CORP\\amorgan is locked out." } },
    { command: "open_active_directory", preview: "Open Active Directory", technicianEntry: "open_active_directory", systemResult: "Active Directory Users and Computers has been opened using the technician's authorized administrative account.", technicalOutput: "Active Directory Users and Computers\n\nDomain: corp.example\n\nAdministrative connection established.", evidence: { id: "ad-lockout-console-open", text: "Active Directory Users and Computers is connected to corp.example using authorized administrative access." } },
    { command: "locate_user_account", preview: "Locate User Account", technicianEntry: "locate_user_account", systemResult: "The affected user's Active Directory account has been located.", technicalOutput: "Active Directory Search Results\n\nName: Alex Morgan\nUser Logon Name: amorgan\nDomain: CORP\n\nMatching Objects: 1", evidence: { id: "ad-lockout-user-located", text: "The CORP\\amorgan account for Alex Morgan was located." } },
    { command: "check_account_status", preview: "Check Account Status", technicianEntry: "check_account_status", systemResult: "The user's Active Directory account is enabled but currently locked.", technicalOutput: "Active Directory Account Status\n\nUser: CORP\\amorgan\n\nAccount Enabled: Yes\nAccount Locked: Yes\nPassword Expired: No", evidence: { id: "ad-lockout-account-status-initial", text: "CORP\\amorgan is enabled and locked; the password is not expired." } },
    { command: "unlock_user_account", preview: "Unlock User Account", technicianEntry: "unlock_user_account", systemResult: "The user's Active Directory account has been successfully unlocked.", technicalOutput: "Active Directory Account Update\n\nUser: CORP\\amorgan\n\nPrevious Account State: Locked\nCurrent Account State: Unlocked\n\nPassword Changed: No\nOperation Status: Successful", evidence: { id: "ad-lockout-first-unlock", text: "CORP\\amorgan was unlocked; the password was not changed." } },
    { command: "test_user_login", preview: "Test User Login", technicianEntry: "test_user_login", systemResult: "The user successfully signs in using their current domain password and gains access to the Windows desktop. During the subsequent verification period, the user reports another account lockout. The existing desktop session remains available.", technicalOutput: "Windows Sign-in Verification\n\nUser: CORP\\amorgan\n\nInteractive Sign-in: Successful\nDesktop Access: Available", evidence: { id: "ad-lockout-first-login-success", text: "Alex Morgan signed in successfully and retained desktop access before the recurring lockout." } },
    { command: "check_account_status", preview: "Check Account Status", technicianEntry: "check_account_status", systemResult: "The user's Active Directory account has become locked again following the successful unlock and sign-in.", technicalOutput: "Active Directory Account Status\n\nUser: CORP\\amorgan\n\nAccount Enabled: Yes\nAccount Locked: Yes\nPassword Expired: No\n\nPrevious Unlock: Successful\nCurrent Lockout: Confirmed", evidence: { id: "ad-lockout-recurring-status", text: "CORP\\amorgan became locked again after the first successful unlock and login." } },
    { command: "review_account_lockout_events", preview: "Review account lockout events.", technicianEntry: "review_account_lockout_events", systemResult: "The relevant Active Directory account lockout event has been located. The event identifies workstation WS-104 as the caller computer associated with the lockout.", technicalOutput: "Event Viewer\n\nComputer: DC-01.corp.example\nLog Name: Security\nSource: Microsoft-Windows-Security-Auditing\nEvent ID: 4740\n\nA user account was locked out.\n\nAccount That Was Locked Out:\n    Account Name: amorgan\n\nAdditional Information:\n    Caller Computer Name: WS-104", evidence: { id: "ad-lockout-events-4740", text: "Event 4740 on DC-01.corp.example identifies amorgan and caller computer WS-104." } },
    { command: "check_windows_credential_manager", preview: "Check Windows Credential Manager.", technicianEntry: "check_windows_credential_manager", systemResult: "A saved Windows credential associated with the internal file server has been located in the affected user's profile.", technicalOutput: "Windows Credential Manager\n\nWindows Credentials\n\nNetwork Address: fs-01.corp.example\nUser Name: CORP\\amorgan\nCredential Type: Windows Credential\nPersistence: Enterprise\n\nMapped Network Drive Information\n\nDrive: S:\nNetwork Path: \\\\fs-01.corp.example\\Shared\nReconnect at Sign-in: Enabled\n\nUser Confirmation: The user confirms that the saved file server credential was created before today's domain password change and has not been updated since.", evidence: { id: "ad-lockout-outdated-credential", text: "The user confirms that the saved fs-01.corp.example credential predates today's domain password change and has not been updated since. S: is configured to reconnect at sign-in." } },
    { command: "remove_outdated_credential", preview: "Remove outdated credential.", technicianEntry: "remove_outdated_credential", systemResult: "The outdated Windows credential associated with the internal file server has been removed from the affected user's profile.", technicalOutput: "Windows Credential Manager\n\nTarget: fs-01.corp.example\nUser Name: CORP\\amorgan\n\nCredential Removal: Successful\nStored Credential: Not Present\n\nMapped Network Drive: S:\nNetwork Drive Configuration: Unchanged", evidence: { id: "ad-lockout-credential-removed", text: "The fs-01.corp.example credential was removed; the S: drive configuration remains unchanged." } },
    { command: "unlock_user_account", preview: "Unlock User Account", technicianEntry: "unlock_user_account", systemResult: "The user's Active Directory account has been successfully unlocked after removal of the outdated stored credential.", technicalOutput: "Active Directory Account Update\n\nUser: CORP\\amorgan\n\nPrevious Account State: Locked\nCurrent Account State: Unlocked\n\nPassword Changed: No\nOperation Status: Successful", evidence: { id: "ad-lockout-second-unlock", text: "CORP\\amorgan was unlocked again after the outdated credential was removed." } },
    { command: "test_user_login", preview: "Test User Login", technicianEntry: "test_user_login", systemResult: "The user successfully signs in using their current domain password. No additional account lockout is observed during the simulated verification period.", technicalOutput: "Windows Sign-in Verification\n\nUser: CORP\\amorgan\n\nInteractive Sign-in: Successful\nDesktop Access: Available\n\nActive Directory Account Status: Unlocked\nAdditional Lockout Observed: No", evidence: { id: "ad-lockout-final-login", text: "Alex Morgan signed in successfully and no additional lockout was observed." } },
    { command: "test_affected_network_resource", preview: "Test affected network resource.", technicianEntry: "test_affected_network_resource", systemResult: "The user successfully accesses the internal shared network drive using their current domain credentials. The account remains unlocked during verification.", technicalOutput: "Network Resource Verification\n\nMapped Drive: S:\nNetwork Path: \\\\fs-01.corp.example\\Shared\n\nAuthentication: Successful\nNetwork Drive Access: Available\nShared Folder Access: Successful\n\nActive Directory Account Status: Unlocked", evidence: { id: "ad-lockout-network-resource", text: "S: and \\\\fs-01.corp.example\\Shared authenticate successfully while the account remains unlocked." } },
    { command: "confirm_user_resolution", preview: "Confirm User Resolution", technicianEntry: "confirm_user_resolution", systemResult: "The user confirms that Windows sign-in and shared network drive access are functioning normally.", technicalOutput: "User Response: \"It's working now. I can sign in with my new password, and I can access our shared files without getting locked out again.\"", evidence: { id: "ad-lockout-resolution-confirmed", text: "Alex Morgan confirmed sign-in and shared file access work without another lockout." } },
  ],
  completion: { command: "confirm_user_resolution", fact: "user_resolution_confirmed" },
  proofLines: [
    "Alex Morgan's identity was verified",
    "The initial CORP\\amorgan account lockout was confirmed",
    "The account was located and unlocked without resetting the password",
    "The first login succeeded and a recurring lockout was triggered",
    "Event 4740 identified caller workstation WS-104",
    "The outdated fs-01.corp.example credential was identified and removed",
    "The account was unlocked again and final sign-in succeeded",
    "S: shared folder access and user resolution were verified",
  ],
  successLines: [
    "The account lockout recurring-authentication source was removed.",
    "Alex Morgan confirmed Windows sign-in and shared file access are working.",
  ],
  defaults: {
    kind: "active_directory_locked_employee_account",
    identity_verified: false,
    login_error_checked: false,
    active_directory_opened: false,
    user_account_located: false,
    account_status_checked: false,
    account_unlocked: false,
    user_login_succeeded: false,
    recurring_lockout_triggered: false,
    recurring_lockout_confirmed: false,
    lockout_event_reviewed: false,
    caller_workstation_identified: false,
    outdated_credential_identified: false,
    outdated_credential_removed: false,
    recurring_authentication_stopped: false,
    second_account_unlock_completed: false,
    final_login_succeeded: false,
    affected_network_resource_verified: false,
    user_resolution_confirmed: false,
    account_enabled: true,
    account_locked: true,
    password_valid: true,
    password_expired: false,
    outdated_credential_present: true,
  },
  previewMetadata: {
    level: "Beginner",
    estimatedTime: "8–12 min",
    description: "Investigate a recurring Windows domain account lockout and correct the outdated credential causing repeated authentication failures.",
    skillFocus: ["Active Directory", "Account Lockout", "Stored Credentials"],
    scenarioContext: "The employee changed passwords, but an outdated stored network credential repeatedly locks the domain account.",
    successOutcome: "The credential source is removed, the account is unlocked again, and sign-in and network resource access are verified.",
    selectCommand: "select active directory locked employee account",
  },
},

account_lockout_saved_credentials: {
  label: "Account Lockout — Saved Credentials Keep Relocking Account",
  startPrompt: `Customer: My account keeps getting locked. IT already unlocked it once today, but it locked again.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "account_access",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before making account access changes.",
    },
    {
      command: "request_unlock",
      preview:
        "Request an account unlock after confirming the user is authorized.",
    },
    {
      command: "confirm_unlock",
      preview:
        "Confirm the account has been unlocked.",
    },
    {
      command: "test_sign_in",
      preview:
        "Test sign-in to verify whether the issue has actually been resolved.",
    },
    {
      command: "review_failed_authentication_attempts",
      preview:
        "Review failed authentication attempts to identify what is repeatedly locking the account.",
    },
    {
      command: "update_saved_credentials",
      preview:
        "Update the outdated saved credentials causing repeated account lockouts.",
    },
    {
      command: "request_unlock",
      preview:
        "Unlock the account again after correcting the underlying cause.",
    },
    {
      command: "confirm_unlock",
      preview:
        "Confirm the account unlock completed successfully.",
    },
    {
      command: "test_sign_in",
      preview:
        "Verify the customer can now sign in without the account locking again.",
    },
  ],

  completion: {
    command: "test_sign_in",
    fact: "can_login_now",
  },

  proofLines: [
    "Verified account ownership before modifying account access",
    "Confirmed the account repeatedly relocked after the initial unlock",
    "Reviewed failed authentication attempts to locate the source",
    "Updated the outdated saved credentials causing repeated lockouts",
    "Unlocked the account after correcting the dependency",
    "Verified successful sign-in without additional lockouts",
  ],

  successLines: [
    "Agent: The repeated account lockout has been resolved and sign-in has been verified.",
    "System: The outdated saved credentials were updated before the account was unlocked again.",
    "Customer: Great, it's finally staying signed in now.",
  ],

  defaults: {
    kind: "account_lockout_saved_credentials",
    identity_verified: false,
    account_locked: true,
    unlock_requested: false,
    first_sign_in_attempted: false,
    repeated_authentication_attempts_reviewed: false,
    saved_credentials_updated: false,
    account_unlocked_after_fix: false,
    can_login_now: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Resolve an account that repeatedly locks because another device is using outdated saved credentials.",
    skillFocus: [
      "Account Lockout",
      "Authentication Troubleshooting",
      "Dependency Awareness",
    ],
    scenarioContext:
      "A user can be unlocked temporarily, but another device immediately locks the account again using an outdated password.",
    successOutcome:
      "The source of the repeated authentication failures is corrected and the account remains accessible.",
    selectCommand:
      "select account lockout saved credentials",
  },
},

password_reset_recovery_email_outdated: {
  label: "Password Reset — Recovery Email Outdated",
  startPrompt: `Customer: I forgot my password, but I don't have access to my recovery email anymore.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "password_reset_challenges",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before making account recovery changes.",
    },
    {
      command: "verify_alternate_contact",
      preview:
        "Verify an approved alternate contact before changing the recovery email.",
    },
    {
      command: "update_recovery_email",
      preview:
        "Update the outdated recovery email after alternate contact verification.",
    },
    {
      command: "send_reset_code",
      preview: "Send a recovery code to the updated recovery email.",
    },
    {
      command: "confirm_reset",
      preview:
        "Validate the recovery code to confirm ownership of the recovery method.",
    },
    {
      command: "set_new_password",
      preview:
        "Update the account password using the verified recovery process.",
    },
    {
      command: "test_sign_in",
      preview: "Test sign-in to confirm account access has been restored.",
    },
  ],

  completion: {
    command: "test_sign_in",
    fact: "can_login_now",
  },

  proofLines: [
    "Verified account ownership before making account changes",
    "Verified an approved alternate contact before changing recovery information",
    "Updated the outdated recovery email through the approved recovery process",
    "Sent the reset code to the updated recovery contact",
    "Successfully restored account access through the approved recovery process",
  ],

  successLines: [
    "Agent: The recovery email was updated through the approved verification process and account access has been restored.",
    "System: The reset code was sent to the updated recovery contact and the password reset was completed successfully.",
    "Customer: Perfect, I’m back in.",
  ],

  defaults: {
    kind: "password_reset_recovery_email_outdated",
    identity_verified: false,
    alternate_contact_verified: false,
    recovery_email_updated: false,
    code_sent: false,
    reset_done: false,
    password_updated: false,
    can_login_now: false,
    wrong_attempts: 0,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–8 min",
    description:
      "Complete a password reset when the recovery email address is outdated.",
    skillFocus: [
      "Account Recovery",
      "Alternate Contact Verification",
      "Recovery Information Management",
    ],
    scenarioContext:
      "A user cannot receive a password reset code because they no longer have access to the recovery email on file.",
    successOutcome:
      "An approved alternate contact is verified, the recovery email is updated, and account access is restored.",
    selectCommand:
      "select password reset recovery email outdated",
  },
},

vpn_access_issue: {
  label: "VPN Access Issue",
  startPrompt: `Customer: I can’t connect to my work network (VPN).

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "account_access",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before changing remote access settings.",
      },
      {
        command: "check_vpn_access",
        preview:
          "Check whether VPN access is assigned to the user account.",
      },
      {
        command: "enable_vpn_access",
        preview:
          "Enable VPN access so the user is allowed to connect remotely.",
      },
      {
        command: "confirm_connection",
        preview:
          "Confirm the VPN connection works after VPN access is assigned.",
      },
    ],

    completion: {
      command: "confirm_connection",
      fact: "can_connect_now",
    },

    proofLines: [
      "Verified the user before changing remote access settings",
      "Confirmed VPN access was missing from the account",
      "Restored remote network access and confirmed connection worked",
    ],

    successLines: [
      "Agent: VPN access has been assigned and the connection has been verified.",
      "System: The user can successfully connect through the VPN.",
      "Customer: Great, I’m connected now.",
    ],

    defaults: {
      kind: "vpn_access_issue",
      identity_verified: false,
      vpn_access_checked: false,
      vpn_access_enabled: false,
      can_connect_now: false,
    },
  previewMetadata: {
  level: "Beginner",
  estimatedTime: "3–5 min",
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
  selectCommand:
    "select vpn access issue",
},

},

vpn_mfa_dependency_missing: {
  label: "VPN Access Issue — MFA Dependency Missing",
  startPrompt: `Customer: I can’t connect to the work VPN.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "vpn_access_challenges",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before changing remote access settings.",
      },
      {
        command: "check_vpn_access",
        preview:
          "Check whether VPN access is assigned to the user account.",
      },
      {
        command: "check_mfa_status",
        preview:
          "Check whether MFA is configured for the user before VPN sign-in can complete.",
      },
      {
        command: "reset_mfa_method",
        preview:
          "Configure or reset the MFA method required for VPN access.",
      },
      {
        command: "confirm_connection",
        preview:
          "Confirm the VPN connection works after the MFA dependency is resolved.",
      },
    ],

    completion: {
      command: "confirm_connection",
      fact: "can_connect_now",
    },

    proofLines: [
      "Verified the user before changing remote access settings",
      "Confirmed VPN access was assigned correctly",
      "Identified that MFA setup was required before VPN access could complete",
      "Configured the MFA dependency required for VPN authentication",
      "Confirmed remote access worked after MFA configuration",
    ],

    successLines: [
      "Agent: VPN access is assigned and the MFA dependency has been resolved.",
      "System: The user can now complete MFA and connect to the VPN successfully.",
      "Customer: Great, I’m connected now.",
    ],

    defaults: {
      kind: "vpn_mfa_dependency_missing",
      identity_verified: false,
      vpn_access_checked: false,
      vpn_access_enabled: true,
      mfa_status_checked: false,
      mfa_method_reset: false,
      can_connect_now: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "5–7 min",
      description:
        "Restore VPN access when Multi-Factor Authentication has not been configured.",
      skillFocus: [
        "VPN Troubleshooting",
        "MFA Configuration",
        "Dependency Awareness",
      ],
      scenarioContext:
        "A user has VPN access assigned but cannot complete the connection because the required MFA method is missing.",
      successOutcome:
        "The MFA dependency is resolved and the user successfully connects to the VPN.",
      selectCommand:
        "select vpn mfa dependency missing",
    },
  },

mfa_code_not_working: {
  label: "MFA Code Not Working",
  startPrompt: `Customer: My MFA code is not working and I can't sign in.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "account_access",

  procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before changing Multi-Factor Authentication (MFA) settings.",
      },
      {
        command: "check_mfa_status",
        preview:
          "Check the MFA status to confirm the authentication method is failing.",
      },
      {
        command: "reset_mfa_method",
        preview:
          "Reset the MFA method so the user can complete authentication.",
      },
      {
        command: "test_mfa_login",
        preview:
          "Test MFA login to confirm the user can sign in successfully.",
      },
    ],

    completion: {
      command: "test_mfa_login",
      fact: "mfa_working",
    },

    proofLines: [
      "Verified the user before changing MFA settings",
      "Confirmed the MFA method was not working correctly",
      "Reset the MFA method",
      "Validated successful MFA login",
    ],

    successLines: [
      "Agent: The MFA method has been reset and successful sign-in has been verified.",
      "System: MFA authentication is working normally after the reset.",
      "Customer: Great, I can sign in now.",
    ],

    defaults: {
      kind: "mfa_code_not_working",
      identity_verified: false,
      mfa_status_checked: false,
      mfa_method_reset: false,
      mfa_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore Multi-Factor Authentication (MFA) access by resetting a failed authentication method.",
      skillFocus: [
        "Identity Verification",
        "MFA Troubleshooting",
        "Authentication Recovery",
      ],
      scenarioContext:
        "A user cannot sign in because their current MFA authentication method is not working.",
      successOutcome:
        "The MFA method is reset and successful sign-in is verified.",
      selectCommand:
        "select mfa code not working",
    },
  },

mfa_code_old_phone_still_registered: {
  label: "MFA Code Not Working — Old Phone Still Registered",
  startPrompt: `Customer: I replaced my phone, and now my MFA prompts are still going to the old device.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "vpn_access_challenges",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before changing Multi-Factor Authentication (MFA) device registration.",
    },
    {
      command: "check_mfa_status",
      preview:
        "Check the MFA status to confirm why authentication cannot be completed.",
    },
    {
      command: "check_registered_mfa_device",
      preview:
        "Check which device is currently registered for MFA.",
    },
    {
      command: "remove_old_mfa_device",
      preview:
        "Remove the outdated phone from the user's registered MFA devices.",
    },
    {
      command: "reset_mfa_method",
      preview:
        "Reset the MFA method so the user can configure authentication on the current phone.",
    },
    {
      command: "test_mfa_login",
      preview:
        "Test MFA login to confirm the user can authenticate successfully.",
    },
  ],

  completion: {
    command: "test_mfa_login",
    fact: "mfa_working",
  },

  proofLines: [
    "Verified the user before changing MFA device registration",
    "Confirmed the MFA method was still associated with an outdated phone",
    "Checked the registered MFA device before making changes",
    "Removed the old phone from the user's MFA registration",
    "Reset the MFA method after removing the outdated device",
    "Validated successful MFA login using the current device",
  ],

  successLines: [
    "Agent: The old phone has been removed, the MFA method has been reset, and successful sign-in has been verified.",
    "System: MFA authentication is now associated with the current device and is working normally.",
    "Customer: Great, I can sign in with my new phone now.",
  ],

  defaults: {
    kind: "mfa_code_old_phone_still_registered",
    identity_verified: false,
    mfa_status_checked: false,
    registered_mfa_device_checked: false,
    old_mfa_device_removed: false,
    mfa_method_reset: false,
    mfa_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Restore MFA access when authentication prompts are still being sent to an old phone.",
    skillFocus: [
      "MFA Troubleshooting",
      "Device Registration",
      "Authentication Recovery",
    ],
    scenarioContext:
      "A user replaced their phone, but the old device remains registered for Multi-Factor Authentication.",
    successOutcome:
      "The outdated device is removed, MFA is configured on the current phone, and sign-in is verified.",
    selectCommand:
      "select mfa code old phone still registered",
  },
},

software_app_license_not_assigned: {
  label: "Software License Not Assigned",
  startPrompt: `Customer: The application is installed, but it says I don't have access to use it.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "software_applications",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before checking software access.",
      },
      {
        command: "check_app_status",
        preview:
          "Check whether the application is installed and available.",
      },
      {
        command: "check_license_assignment",
        preview:
          "Check whether the user has the required software license assigned.",
      },
      {
        command: "assign_software_license",
        preview:
          "Assign the required software license to the user's account.",
      },
      {
        command: "test_application_launch",
        preview:
          "Test the application launch to confirm the license issue is resolved.",
      },
    ],

    completion: {
      command: "test_application_launch",
      fact: "application_working",
    },

    proofLines: [
      "Verified the user before modifying software licensing",
      "Confirmed the required software license was not assigned",
      "Assigned the required software license",
      "Validated successful application launch",
    ],

    successLines: [
      "Agent: The required software license has been assigned and application access has been verified.",
      "System: The application launches successfully with the assigned license.",
      "Customer: Great, it works now.",
    ],

  defaults: {
    kind: "software_app_license_not_assigned",
    identity_verified: false,
    app_status_checked: false,
    license_assignment_checked: false,
    software_license_assigned: false,
    application_working: false,
  },

  previewMetadata: {
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
    selectCommand:
      "select software_app_license_not_assigned",
  },
},

email_not_sending: {
  label: "Email Not Sending",
  startPrompt: `Customer: My emails are not sending.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "email",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting the mailbox account.",
      },
      {
        command: "check_email_status",
        preview:
          "Check the email client status to determine why outgoing messages are not sending.",
      },
      {
        command: "enable_email_client",
        preview:
          "Bring the email client back online so outgoing messages can send.",
      },
      {
        command: "send_test_email",
        preview:
          "Send a test email to confirm outgoing email delivery is working.",
      },
    ],

    completion: {
      command: "send_test_email",
      fact: "can_send_email",
    },

    proofLines: [
      "Verified the user before making email configuration changes",
      "Confirmed outgoing email functionality was unavailable",
      "Restored email sending capability",
      "Validated email delivery with a successful test message",
    ],

    successLines: [
      "Agent: Outgoing email has been restored and a test message was sent successfully.",
      "System: The email client is online and can transmit messages normally.",
      "Customer: Great, I can send email again.",
    ],

    defaults: {
      kind: "email_not_sending",
      identity_verified: false,
      email_status_checked: false,
      email_client_online: false,
      can_send_email: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore outgoing email by bringing the email client back online.",
      skillFocus: [
        "Email Troubleshooting",
        "Client Connectivity",
        "Operational Verification",
      ],
scenarioContext:
  "A user cannot send outgoing email because the email client is currently offline.",
      successOutcome:
        "Outgoing email is restored and verified with a successful test message.",
      selectCommand:
        "select email not sending",
    },
  },

  email_not_sending_outbox: {
  label: "Email Not Sending — Stuck in Outbox",

  startPrompt: `Customer: My email is stuck in the Outbox and will not send.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "email",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting the mailbox account.",
    },
    {
      command: "check_email_status",
      preview:
        "Check the email client status to confirm the client is online and available.",
    },
    {
      command: "send_test_email",
      preview:
        "Send a test email to reproduce the outgoing email problem.",
    },
    {
      command: "check_outbox",
      preview:
        "Check the Outbox to identify the message preventing outgoing email from completing.",
    },
    {
      command: "send_stuck_outbox_email",
      preview:
        "Release and resend the stuck Outbox message.",
    },
    {
      command: "send_test_email",
      preview:
        "Send another test email to confirm outgoing email is working normally.",
    },
  ],

  completion: {
    command: "send_test_email",
    fact: "can_send_email",
  },

  proofLines: [
    "Verified the user before troubleshooting outgoing email",
    "Confirmed the email client was online and available",
    "Reproduced the outgoing email failure with a test message",
    "Checked the Outbox and identified a stuck message",
    "Released and resent the stuck Outbox message",
    "Verified outgoing email with a successful final test message",
  ],

  successLines: [
    "Agent: The stuck Outbox message has been released and outgoing email has been verified.",
    "System: Messages can now leave the Outbox and send successfully.",
    "Customer: Great, my email is sending now.",
  ],

  defaults: {
    kind: "email_not_sending_outbox",
    identity_verified: false,
    email_status_checked: false,
    first_send_test_completed: false,
    outbox_checked: false,
    stuck_outbox_email_sent: false,
    can_send_email: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "3–5 min",
    description:
      "Restore outgoing email by identifying and releasing a message stuck in the Outbox.",
    skillFocus: [
      "Email Troubleshooting",
      "Outbox Management",
      "Problem Reproduction",
      "Operational Verification",
    ],
    scenarioContext:
      "The email client is online, but a message remains stuck in the Outbox and prevents outgoing email from completing normally.",
    successOutcome:
      "The stuck message is released and outgoing email is verified with a successful test message.",
    selectCommand:
      "select email not sending outbox",
  },
},

email_client_working_offline: {
  label: "Classic Outlook — Working Offline",
  startPrompt: `Customer: Outlook is not receiving mail and my outgoing emails keep staying in the Outbox.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "email",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting the email client.",
    },
    {
      command: "check_email_status",
      preview:
        "Check the email client status to confirm whether Outlook is disconnected from the mailbox.",
      evidence: {
        id: "outlook_working_offline_status",
        text: "Outlook shows Working Offline and outgoing messages remain queued in the Outbox.",
      },
    },
    {
      command: "check_email_connectivity",
      preview:
        "Check the mailbox connectivity to confirm whether the mail service is reachable outside the client state.",
      evidence: {
        id: "outlook_email_service_reachable",
        text: "Network connectivity is available and the email service is reachable.",
      },
    },
    {
      command: "check_webmail",
      preview:
        "Open the mailbox in a browser to observe whether the account itself is accessible outside Outlook.",
      evidence: {
        id: "outlook_webmail_accessible",
        text: "The mailbox opens successfully in the browser.",
      },
    },
    {
      command: "check_work_offline",
      preview:
        "Check the Outlook desktop setting to confirm whether the client is currently configured to Work Offline.",
      evidence: {
        id: "outlook_work_offline_enabled",
        text: "Classic Outlook Work Offline is enabled.",
      },
    },
    {
      command: "disable_work_offline",
      preview:
        "Turn off Work Offline so Outlook can reconnect to the mailbox and resume synchronization.",
    },
    {
      command: "test_email",
      preview:
        "Send and receive a test message to confirm the mailbox is working normally again.",
    },
  ],

  completion: {
    command: "test_email",
    fact: "can_send_and_receive_email",
  },

  proofLines: [
    "Verified the user before troubleshooting the Outlook client state",
    "Confirmed the desktop client was disconnected and messages remained queued in the Outbox",
    "Confirmed the mail service was accessible outside the client state",
    "Confirmed the desktop client was set to Work Offline",
    "Disabled Work Offline to reconnect Outlook to the mailbox",
    "Validated successful send and receive with a final test message",
  ],

  successLines: [
    "Agent: Outlook has been reconnected to the mailbox and email delivery has been verified.",
    "System: Work Offline has been disabled and Outlook can now send and receive mail normally.",
    "Customer: Great, my email is working again.",
  ],

  defaults: {
    kind: "email_client_working_offline",
    identity_verified: false,
    email_status_checked: false,
    email_connectivity_checked: false,
    webmail_checked: false,
    work_offline_checked: false,
    work_offline_enabled: true,
    work_offline_disabled: false,
    can_send_and_receive_email: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Restore Outlook mail flow when the desktop client is disconnected by Work Offline mode.",
    skillFocus: [
      "Email Troubleshooting",
      "Outlook Configuration",
      "Operational Verification",
    ],
    scenarioContext:
      "A user reports that Outlook is not receiving mail and outgoing messages remain stuck in the Outbox while the account itself remains active.",
    successOutcome:
      "Work Offline is disabled and Outlook successfully sends and receives mail again.",
    selectCommand:
      "select email client working offline",
  },
},

not_receiving_email: {
  label: "Not Receiving Email",
  startPrompt: `Customer: I'm not receiving any emails.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "email",

        procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting the mailbox.",
      },
      {
        command: "check_sync_settings",
        preview:
          "Check the mailbox sync status to determine why new email is not updating.",
      },
      {
        command: "resync_email_client",
        preview:
          "Sync the email client to restore incoming message updates.",
      },
      {
        command: "send_test_email",
        preview:
          "Send a test email to confirm incoming mail is received.",
      },
    ],

    completion: {
      command: "send_test_email",
      fact: "can_receive_email",
    },

        proofLines: [
      "Verified the user before troubleshooting the mailbox",
      "Checked mailbox synchronization status",
      "Resynchronized the email client",
      "Confirmed incoming email delivery with a successful test message",
    ],

    successLines: [
      "Agent: Incoming email delivery has been restored and verified with a test message.",
      "System: New messages are now reaching the inbox successfully.",
      "Customer: Great, I received the email.",
    ],

defaults: {
  kind: "not_receiving_email",
  identity_verified: false,
  sync_settings_checked: false,
  email_client_resynced: false,
  can_receive_email: false,
},

previewMetadata: {
  level: "Beginner",
  estimatedTime: "3–5 min",
  description:
  "Restore incoming email by checking and resynchronizing the mailbox.",
  skillFocus: [
  "Email Troubleshooting",
  "Mailbox Synchronization",
  "Operational Verification",
],
  scenarioContext:
  "A user reports that new email is no longer updating in their mailbox.",
  successOutcome:
  "Mailbox synchronization is restored and incoming email delivery is verified.",
  selectCommand:
    "select not receiving email",
},
  },

not_receiving_email_inbox_rule_redirecting: {
  label: "Email Not Receiving — Inbox Rule Redirecting Mail",
  startPrompt: `Customer: I'm not receiving emails I need for work.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "email",

    procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting the mailbox.",
    },
    {
      command: "check_sync_settings",
      preview:
        "Check the mailbox sync status to confirm the client is updating normally.",
    },
    {
      command: "resync_email_client",
      preview:
        "Sync the email client to refresh incoming message updates.",
    },
    {
      command: "send_test_email",
      preview:
        "Send a test email to verify whether incoming delivery has been restored.",
    },
    {
      command: "check_inbox_filters",
      preview:
        "Review inbox rules and filters after normal mailbox synchronization does not restore delivery.",
    },
    {
      command: "disable_inbox_filter",
      preview:
        "Disable the inbox rule that is redirecting incoming mail away from the inbox.",
    },
    {
      command: "send_test_email",
      preview:
        "Send another test email to confirm incoming delivery reaches the inbox.",
    },
  ],

  completion: {
    command: "send_test_email",
    fact: "can_receive_email",
  },

    proofLines: [
    "Verified the user before troubleshooting the mailbox",
    "Confirmed mailbox synchronization settings were checked",
    "Resynchronized the email client before investigating deeper causes",
    "Verified incoming email still did not appear after normal synchronization",
    "Reviewed inbox rules and identified a redirecting rule",
    "Disabled the redirecting inbox rule",
    "Confirmed incoming email reached the inbox with a successful final test message",
  ],

  successLines: [
    "Agent: The redirecting inbox rule has been disabled and incoming email delivery has been verified.",
    "System: New messages now arrive in the inbox successfully.",
    "Customer: Great, I can see the email now.",
  ],

    defaults: {
    kind: "not_receiving_email_inbox_rule_redirecting",
    identity_verified: false,
    sync_settings_checked: false,
    email_client_resynced: false,
    first_receive_test_completed: false,
    inbox_filter_checked: false,
    inbox_filter_enabled: true,
    filter_disabled: false,
    can_receive_email: false,
  },

      previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Resolve an incoming email issue when normal mailbox synchronization does not restore delivery.",
    skillFocus: [
      "Email Troubleshooting",
      "Mailbox Synchronization",
      "Inbox Rules",
      "Dependency Awareness",
    ],
    scenarioContext:
      "A user reports that incoming email is missing even after normal mailbox synchronization is refreshed.",
    successOutcome:
      "A redirecting inbox rule is identified and disabled after normal synchronization troubleshooting fails.",
    selectCommand:
      "select not_receiving_email_inbox_rule_redirecting",
  },
},

mailbox_full: {
  label: "Mailbox Full",
  startPrompt: `Customer: I stopped receiving new emails and my mailbox says it is full.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "email",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before changing mailbox storage.",
      },
      {
        command: "check_mailbox_storage",
        preview:
          "Check mailbox storage to confirm the mailbox is full.",
      },
      {
        command: "archive_old_emails",
        preview:
          "Archive old emails to recover mailbox space.",
      },
      {
        command: "send_test_email",
        preview:
          "Send a test email to confirm new messages can be delivered.",
      },
    ],

    completion: {
      command: "send_test_email",
      fact: "mailbox_receiving_email",
    },

    proofLines: [
      "Verified the user before making mailbox changes",
      "Confirmed mailbox storage capacity had been reached",
      "Recovered mailbox storage space",
      "Verified new email delivery resumed successfully",
    ],

    successLines: [
      "Agent: Mailbox space has been recovered and new email delivery has been verified.",
      "System: The mailbox has available storage and can receive new messages.",
      "Customer: Great, I’m receiving emails again.",
    ],

    defaults: {
      kind: "mailbox_full",
      identity_verified: false,
      mailbox_storage_checked: false,
      old_emails_archived: false,
      mailbox_receiving_email: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Recover mailbox storage so new email can be delivered normally.",
      skillFocus: [
        "Mailbox Management",
        "Storage Recovery",
        "Operational Verification",
      ],
      scenarioContext:
        "A user's mailbox has reached its storage limit and can no longer receive new messages.",
      successOutcome:
        "Mailbox storage is recovered and incoming email delivery resumes.",
      selectCommand:
        "select mailbox full",
    },
  },

mailbox_full_archive_policy_not_applied: {
  label: "Mailbox Full — Archive Policy Not Applied",
  startPrompt: `Customer: I stopped receiving new emails and my mailbox says it is full.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "email",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before changing mailbox storage or archive settings.",
    },
    {
      command: "check_mailbox_storage",
      preview:
        "Check mailbox storage to confirm the mailbox has reached its limit.",
    },
    {
      command: "check_archive_policy",
      preview:
        "Check whether the mailbox archive policy is assigned and active.",
    },
    {
      command: "apply_archive_policy",
      preview:
        "Apply the required archive policy so old email can be moved automatically.",
    },
    {
      command: "archive_old_emails",
      preview:
        "Archive old emails to recover mailbox storage space.",
    },
    {
      command: "send_test_email",
      preview:
        "Send a test email to confirm new messages can be delivered.",
    },
  ],

  completion: {
    command: "send_test_email",
    fact: "mailbox_receiving_email",
  },

  proofLines: [
    "Verified the user before changing mailbox storage or archive settings",
    "Confirmed the mailbox storage limit had been reached",
    "Identified that the required archive policy was not applied",
    "Applied the archive policy before attempting mailbox cleanup",
    "Archived old email and recovered mailbox storage space",
    "Verified new email delivery resumed successfully",
  ],

  successLines: [
    "Agent: The archive policy has been applied, mailbox space has been recovered, and new email delivery has been verified.",
    "System: The missing archive policy dependency was resolved before old email was archived and mailbox delivery resumed.",
    "Customer: Great, I’m receiving emails again.",
  ],

  defaults: {
    kind: "mailbox_full_archive_policy_not_applied",
    identity_verified: false,
    mailbox_storage_checked: false,
    archive_policy_checked: false,
    archive_policy_applied: false,
    old_emails_archived: false,
    mailbox_receiving_email: false,
  },
    previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Resolve a full mailbox when the archive policy has not been applied.",
    skillFocus: [
      "Mailbox Management",
      "Archive Policy",
      "Dependency Awareness",
    ],
    scenarioContext:
      "A user cannot receive new email because the mailbox archive policy has not been applied and old email is not being archived automatically.",
    successOutcome:
      "The archive policy is applied, old email is archived, and new email delivery resumes successfully.",
    selectCommand:
      "select mailbox_full_archive_policy_not_applied",
  },
},

email_login_issue: {
  label: "Email Login Issue",
  startPrompt: `Customer: I cannot sign in to my email.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "email",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting email access.",
      },
      {
        command: "check_email_login_status",
        preview:
          "Check email login status to identify why sign-in is failing.",
      },
      {
        command: "reset_email_session",
        preview:
          "Reset the email session so the account can sign in cleanly.",
      },
      {
        command: "test_email_login",
        preview:
          "Test email login to confirm access is restored.",
      },
    ],

    completion: {
      command: "test_email_login",
      fact: "email_login_working",
    },

    proofLines: [
      "Verified the user before making email access changes",
      "Confirmed the email sign-in issue",
      "Restored email authentication functionality",
      "Validated successful email sign-in",
    ],

    successLines: [
      "Agent: Email authentication has been restored and sign-in has been verified.",
      "System: The email account can authenticate successfully.",
      "Customer: Great, I can access my email now.",
    ],

    defaults: {
      kind: "email_login_issue",
      identity_verified: false,
      email_login_checked: false,
      email_session_reset: false,
      email_login_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore email access by resetting a failed email session.",
      skillFocus: [
        "Email Authentication",
        "Session Recovery",
        "Operational Verification",
      ],
      scenarioContext:
        "A user cannot sign in to their company email account.",
      successOutcome:
        "The email session is reset and successful sign-in is verified.",
      selectCommand:
        "select email login issue",
    },
  },

  email_login_cached_credentials: {
  label: "Email Login — Cached Credentials",

  startPrompt: `Customer: I changed my password recently, but the email application still will not let me sign in.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "email",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting email authentication.",
    },
    {
      command: "check_email_login_status",
      preview:
        "Check the email login status to confirm the account is active but the email client cannot authenticate.",
    },
    {
      command: "test_email_login",
      preview:
        "Test email login to reproduce the authentication failure before making changes.",
    },
    {
      command: "check_saved_email_credentials",
      preview:
        "Check the saved email credentials to determine whether the client is using an outdated password.",
    },
    {
      command: "update_saved_email_credentials",
      preview:
        "Update the saved email credentials with the user's current password.",
    },
    {
      command: "test_email_login",
      preview:
        "Test email login again to confirm authentication works with the corrected saved credentials.",
    },
  ],

  completion: {
    command: "test_email_login",
    fact: "email_login_working",
  },

  proofLines: [
    "Verified the user before troubleshooting email authentication",
    "Confirmed the account was active but email authentication was failing",
    "Reproduced the email login failure before making changes",
    "Identified an outdated password stored in the email client",
    "Updated the saved email credentials with the current password",
    "Verified successful email login after correcting the saved credentials",
  ],

  successLines: [
    "Agent: The outdated saved email credentials have been corrected and sign-in has been verified.",
    "System: The email application can now authenticate successfully using the current password.",
    "Customer: Great, I can access my email again.",
  ],

  defaults: {
    kind: "email_login_cached_credentials",
    identity_verified: false,
    email_login_checked: false,
    first_email_login_tested: false,
    saved_email_credentials_checked: false,
    saved_email_credentials_updated: false,
    email_login_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Restore email access when the client is using an outdated saved password.",
    skillFocus: [
      "Email Authentication",
      "Credential Management",
      "Problem Reproduction",
      "Operational Verification",
    ],
    scenarioContext:
      "A user changed their password, but the email application continues submitting an outdated locally saved password.",
    successOutcome:
      "The outdated saved credentials are identified, updated, and successful email login is verified.",
    selectCommand:
      "select email login cached credentials",
  },
},

email_client_not_syncing: {
  label: "Email Client Not Syncing",
  startPrompt: `Customer: My email isn't updating with new messages.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "email",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting email synchronization.",
    },
    {
      command: "check_sync_settings",
      preview:
        "Check sync settings to identify why the email client is not updating.",
    },
    {
      command: "resync_email_client",
      preview:
        "Resync the email client so new messages can update normally.",
    },
    {
      command: "test_email_sync",
      preview:
        "Test email sync to confirm new messages are updating.",
    },
  ],

  completion: {
    command: "test_email_sync",
    fact: "email_sync_working",
  },

  proofLines: [
    "Verified the user before modifying email synchronization settings",
    "Confirmed email synchronization was disabled",
    "Restored synchronization functionality",
    "Validated successful email synchronization",
  ],

  successLines: [
    "Agent: Email synchronization has been restored and verified.",
    "System: The email client is updating messages normally.",
    "Customer: Great, my emails are updating again.",
  ],

  defaults: {
    kind: "email_client_not_syncing",
    identity_verified: false,
    sync_settings_checked: false,
    email_client_resynced: false,
    email_sync_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "3–5 min",
    description:
      "Restore email synchronization so new messages update normally.",
    skillFocus: [
      "Email Synchronization",
      "Client Configuration",
      "Operational Verification",
    ],
    scenarioContext:
      "A user's email client is open, but new messages are not updating.",
    successOutcome:
      "Email synchronization is restored and new message updates are verified.",
    selectCommand:
      "select email client not syncing",
  },
},

email_client_not_syncing_cached_session_stuck: {
  label: "Email Client Not Syncing — Cached Session Stuck",
  startPrompt: `Customer: My email client is open, but new messages are not updating.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "email",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting email synchronization.",
    },
    {
      command: "check_sync_settings",
      preview:
        "Check the synchronization settings to confirm they are configured correctly.",
    },
    {
      command: "check_email_login_status",
      preview:
        "Check the email account session to identify whether a stale login session is blocking synchronization.",
    },
    {
      command: "reset_email_session",
      preview:
        "Reset the stale email session so the client can establish a clean mailbox connection.",
    },
    {
      command: "resync_email_client",
      preview:
        "Resync the email client after clearing the stale session.",
    },
    {
      command: "test_email_sync",
      preview:
        "Test email synchronization to confirm new messages update normally.",
    },
  ],

  completion: {
    command: "test_email_sync",
    fact: "email_sync_working",
  },

  proofLines: [
    "Verified the user before troubleshooting email synchronization",
    "Confirmed the synchronization settings were configured correctly",
    "Identified that a stale authenticated session was blocking mailbox updates",
    "Reset the stale email session before resynchronizing the client",
    "Restored email synchronization",
    "Validated successful message updates",
  ],

  successLines: [
    "Agent: The stale email session has been cleared and synchronization has been restored.",
    "System: The cached-session dependency was resolved before the email client was resynchronized.",
    "Customer: Great, my new emails are showing up again.",
  ],

  defaults: {
    kind: "email_client_not_syncing_cached_session_stuck",
    identity_verified: false,
    sync_settings_checked: false,
    email_login_checked: false,
    email_session_reset: false,
    email_client_resynced: false,
    email_sync_working: false,
  },
    previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Resolve an email synchronization issue caused by a stale cached email session.",
    skillFocus: [
      "Email Synchronization",
      "Session Recovery",
      "Dependency Awareness",
    ],
    scenarioContext:
      "A user reports that their email client is open, but new messages are not updating because a cached authenticated session is preventing synchronization.",
    successOutcome:
      "The cached email session is reset, synchronization resumes, and new messages update successfully.",
    selectCommand:
      "select email_client_not_syncing_cached_session_stuck",
  },
},

attachment_too_large: {
  label: "Attachment Too Large",
  startPrompt: `Customer: My email won't send when I attach this file.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "email",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting the email send failure.",
      },
      {
        command: "check_attachment_size",
        preview:
          "Check the attachment size to confirm it exceeds the email limit.",
      },
      {
        command: "compress_attachment",
        preview:
          "Compress the attachment so it is within the allowed size.",
      },
      {
        command: "send_test_email",
        preview:
          "Send a test email to confirm the message can be sent.",
      },
    ],

    completion: {
      command: "send_test_email",
      fact: "test_email_sent",
    },

    proofLines: [
      "Verified the user before modifying the email attachment",
      "Confirmed the attachment exceeded allowed size limits",
      "Reduced the attachment size to an acceptable level",
      "Validated successful email transmission",
    ],

    successLines: [
      "Agent: The attachment size issue has been resolved and email delivery has been verified.",
      "System: The attachment is within allowed limits and can be transmitted successfully.",
      "Customer: Great, the email went through.",
    ],

    defaults: {
      kind: "attachment_too_large",
      identity_verified: false,
      attachment_size_checked: false,
      attachment_compressed: false,
      test_email_sent: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Reduce an oversized email attachment and confirm the message sends successfully.",
      skillFocus: [
        "Email Troubleshooting",
        "Attachment Management",
        "Operational Verification",
      ],
      scenarioContext:
        "A user cannot send an email because the attached file exceeds the allowed size limit.",
      successOutcome:
        "The attachment is reduced to an acceptable size and the email sends successfully.",
      selectCommand:
        "select attachment too large",
    },
  },

shared_mailbox_missing: {
  label: "Shared Mailbox Missing",
  startPrompt: `Customer: I can't access the shared mailbox anymore.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "email",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before changing mailbox access.",
      },
      {
        command: "check_shared_mailbox_membership",
        preview:
          "Check shared mailbox membership to confirm why access is missing.",
      },
      {
        command: "grant_shared_mailbox_access",
        preview:
          "Grant shared mailbox access for the user.",
      },
      {
        command: "test_shared_mailbox_access",
        preview:
          "Test shared mailbox access to confirm it opens normally.",
      },
    ],

    completion: {
      command: "test_shared_mailbox_access",
      fact: "shared_mailbox_working",
    },

    proofLines: [
      "Verified the user before modifying mailbox access",
      "Confirmed shared mailbox membership was missing",
      "Restored shared mailbox permissions",
      "Validated successful shared mailbox access",
    ],

    successLines: [
      "Agent: Shared mailbox access has been restored and verified.",
      "System: The user can open the shared mailbox successfully.",
      "Customer: Great, I can see the mailbox again.",
    ],

    defaults: {
      kind: "shared_mailbox_missing",
      identity_verified: false,
      shared_mailbox_membership_checked: false,
      shared_mailbox_access_granted: false,
      shared_mailbox_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore access to a shared mailbox by correcting missing membership.",
      skillFocus: [
        "Shared Mailbox Access",
        "Permission Management",
        "Operational Verification",
      ],
      scenarioContext:
        "A user cannot open a shared mailbox because the required mailbox access is missing.",
      successOutcome:
        "Shared mailbox access is granted and successfully verified.",
      selectCommand:
        "select shared mailbox missing",
    },
  },

shared_mailbox_outlook_profile_not_updated: {
  label: "Shared Mailbox Missing — Outlook Profile Not Updated",
  startPrompt: `Customer: I can't see the Finance shared mailbox in Outlook.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "email",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting shared mailbox access.",
    },
    {
      command: "check_shared_mailbox_membership",
      preview:
        "Check the user's shared mailbox membership to confirm access is already assigned.",
    },
    {
      command: "test_shared_mailbox_access",
      preview:
        "Test shared mailbox access to confirm the mailbox is still unavailable.",
    },
    {
      command: "check_outlook_mailbox_configuration",
      preview:
        "Check the Outlook mailbox configuration to determine whether the shared mailbox is missing from the profile.",
    },
    {
      command: "add_shared_mailbox_to_outlook_profile",
      preview:
        "Add the shared mailbox to the Outlook profile after confirming the configuration issue.",
    },
    {
      command: "test_shared_mailbox_access",
      preview:
        "Test shared mailbox access again to confirm the mailbox now appears and opens normally.",
    },
  ],

  completion: {
    command: "test_shared_mailbox_access",
    fact: "shared_mailbox_working",
  },

  proofLines: [
    "Verified the user before troubleshooting shared mailbox access",
    "Confirmed the user already had the required shared mailbox membership",
    "Verified the mailbox was still unavailable despite correct permissions",
    "Identified that the shared mailbox had not been added to the Outlook profile",
    "Added the shared mailbox to the Outlook profile",
    "Returned to the original issue and confirmed the mailbox opened successfully",
  ],

  successLines: [
    "Agent: The Finance shared mailbox has been added to the Outlook profile and access has been verified.",
    "System: The user already had mailbox permissions, but the Outlook profile had not been updated.",
    "Customer: Great, I can see the Finance mailbox now.",
  ],

    defaults: {
    kind: "shared_mailbox_outlook_profile_not_updated",
    identity_verified: false,
    shared_mailbox_membership_checked: false,
    shared_mailbox_access_tested: false,
    outlook_mailbox_configuration_checked: false,
    shared_mailbox_added_to_outlook_profile: false,
    shared_mailbox_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Resolve a missing shared mailbox when mailbox permissions already exist but the Outlook profile has not been updated.",
    skillFocus: [
      "Shared Mailbox Access",
      "Outlook Configuration",
      "Dependency Awareness",
    ],
    scenarioContext:
      "A user already has permission to the Finance shared mailbox, but it does not appear in Outlook because it has not been added to the Outlook profile.",
    successOutcome:
      "The shared mailbox is added to the Outlook profile and access is successfully verified.",
    selectCommand:
      "select shared_mailbox_outlook_profile_not_updated",
},
},

shared_mailbox_automapping_missing: {
  label: "Shared Mailbox — Auto-Mapping Missing",

  startPrompt: `Customer: I was given access to the Finance shared mailbox, but it still does not appear automatically in Outlook.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "email",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting shared mailbox access.",
    },
    {
      command: "check_shared_mailbox_membership",
      preview:
        "Check the user's shared mailbox membership to confirm Full Access is already assigned.",
    },
    {
      command: "test_shared_mailbox_access",
      preview:
        "Test shared mailbox access to confirm the mailbox still does not appear automatically.",
    },
    {
      command: "check_shared_mailbox_automapping",
      preview:
        "Check whether auto-mapping is enabled for the user's shared mailbox permission.",
    },
    {
      command: "enable_shared_mailbox_automapping",
      preview:
        "Enable auto-mapping so Outlook can discover and load the shared mailbox automatically.",
    },
    {
      command: "restart_application",
      preview:
        "Restart Outlook so the corrected auto-mapping configuration can be discovered.",
    },
    {
      command: "test_shared_mailbox_access",
      preview:
        "Test shared mailbox access again to confirm the mailbox appears automatically and opens normally.",
    },
  ],

  completion: {
    command: "test_shared_mailbox_access",
    fact: "shared_mailbox_working",
  },

  proofLines: [
    "Verified the user before troubleshooting shared mailbox access",
    "Confirmed the user already had the required shared mailbox permission",
    "Verified the mailbox still did not appear automatically in Outlook",
    "Identified that shared mailbox auto-mapping was disabled",
    "Enabled auto-mapping for the shared mailbox permission",
    "Restarted Outlook after correcting the auto-mapping configuration",
    "Confirmed the shared mailbox appeared automatically and opened successfully",
  ],

  successLines: [
    "Agent: Shared mailbox auto-mapping has been enabled and access has been verified.",
    "System: Outlook discovered the Finance shared mailbox automatically after the auto-mapping configuration was corrected.",
    "Customer: Great, the Finance mailbox is showing up now.",
  ],

  defaults: {
    kind: "shared_mailbox_automapping_missing",
    identity_verified: false,
    shared_mailbox_membership_checked: false,
    shared_mailbox_access_tested: false,
    shared_mailbox_automapping_checked: false,
    shared_mailbox_automapping_enabled: false,
    application_restarted: false,
    shared_mailbox_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Restore automatic shared mailbox visibility by correcting a disabled auto-mapping configuration.",
    skillFocus: [
      "Shared Mailbox Access",
      "Auto-Mapping",
      "Outlook Configuration",
      "Dependency Awareness",
    ],
    scenarioContext:
      "A user already has Full Access to the Finance shared mailbox, but it does not appear automatically in Outlook because auto-mapping is disabled.",
    successOutcome:
      "Auto-mapping is enabled, Outlook is restarted, and the shared mailbox appears automatically and opens successfully.",
    selectCommand:
      "select shared mailbox automapping missing",
  },
},

email_application_will_not_open: {
  label: "Email Application Will Not Open",
  startPrompt: `Customer: I can't get my email application to open. Every time I click it, nothing happens.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "email",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting the email application.",
    },
    {
      command: "check_app_status",
      preview:
        "Check the email application status to confirm it is not launching.",
    },
    {
      command: "restart_application",
      preview:
        "Restart the email application to recover the unresponsive process.",
    },
    {
      command: "test_application_launch",
      preview:
        "Test the email application launch to confirm it opens successfully.",
    },
  ],

  completion: {
    command: "test_application_launch",
    fact: "application_working",
  },

  proofLines: [
    "Verified the user before troubleshooting the email application",
    "Confirmed the email application was unable to launch",
    "Restarted the unresponsive email application",
    "Validated successful email application launch",
  ],

  successLines: [
    "Agent: The email application has been restarted and access has been verified.",
    "System: The email application launches successfully.",
    "Customer: Great, I can access my email now.",
  ],

  defaults: {
    kind: "email_application_will_not_open",
    identity_verified: false,
    app_status_checked: false,
    application_restarted: false,
    application_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "3–5 min",
    description:
      "Restart an unresponsive email application and confirm it opens normally.",
    skillFocus: [
      "Email Application Troubleshooting",
      "Basic Software Recovery",
      "Operational Verification",
    ],
    scenarioContext:
      "A customer reports that their workplace email application does not respond when launched.",
    successOutcome:
      "The email application launches successfully and the customer regains access to email.",
    selectCommand:
      "select email application will not open",
  },
},

email_client_corrupted_profile: {
  label: "Email Client Won't Open — Corrupted Profile",

  startPrompt: `Customer: My email application won't open. I already tried reopening it, but it still won't launch.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "email",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting the email application.",
    },
    {
      command: "check_app_status",
      preview:
        "Check the email application status to confirm it is not launching.",
      evidence: {
        id: "email_app_startup_hanging",
        text: "Email application starts but hangs before opening a usable window.",
      },
    },
    {
      command: "restart_application",
      preview:
        "Restart the application to rule out a temporary process issue.",
    },
    {
      command: "test_application_launch",
      preview:
        "Test the application to determine whether the restart resolved the issue.",
      evidence: {
        id: "email_launch_failed_after_restart",
        text: "Email application still fails to launch after restarting.",
      },
    },
    {
      command: "check_email_client_profile",
      preview:
        "Check the email client's profile for corruption after the restart fails.",
      evidence: {
        id: "email_profile_corrupted",
        text: "Email client profile contains damaged configuration data preventing startup.",
      },
    },
    {
      command: "repair_email_client_profile",
      preview:
        "Repair the corrupted email profile.",
      evidence: {
        id: "email_profile_repaired",
        text: "Damaged email client profile configuration was repaired successfully.",
      },
    },
    {
      command: "test_application_launch",
      preview:
        "Verify the application launches successfully after the profile repair.",
    },
  ],

  investigation: {
    relatedActions: {
      check_email_status: {
        agent:
          "I'm checking whether the email service is experiencing an outage.",
        system:
          "The email service is operational. No service outage is reported for this user's organization.",
        customer:
          "Okay, so the email service is still running.",
        evidence: {
          id: "email_service_operational",
          text: "Email service is operational with no reported outage.",
        },
      },

      check_email_login_status: {
        agent:
          "I'm checking whether the user's email account can authenticate successfully.",
        system:
          "The user's email account is active and authentication is successful. No account sign-in restriction is detected.",
        customer:
          "Okay, good to know my account is still working.",
        evidence: {
          id: "email_account_authentication_successful",
          text: "Email account authentication succeeds without restrictions.",
        },
      },
    },
  },

  completion: {
    command: "test_application_launch",
    fact: "application_working",
  },

  proofLines: [
    "Verified the user's identity before troubleshooting the application",
    "Confirmed restarting the application did not resolve the issue",
    "Identified a corrupted email client profile",
    "Repaired the corrupted profile",
    "Verified the application launched successfully",
  ],

  successLines: [
    "Agent: The corrupted email profile has been repaired and the application is opening normally.",
    "System: The application launch issue was caused by a corrupted email client profile.",
    "Customer: Great, it's opening again.",
  ],

  defaults: {
  kind: "email_client_corrupted_profile",
  identity_verified: false,
  app_status_checked: false,
  application_restarted: false,
  application_launch_tested: false,
  email_client_profile_checked: false,
  email_client_profile_repaired: false,
  application_working: false,
},

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Resolve an email application that still will not open after a restart by repairing a corrupted profile.",
    skillFocus: [
      "Email Troubleshooting",
      "Application Recovery",
      "Dependency Awareness",
    ],
    scenarioContext:
      "The email application still fails after a restart because the user's profile is corrupted.",
    successOutcome:
      "The profile is repaired and the application launches successfully.",
    selectCommand:
      "select email client corrupted profile",
  },
},

cannot_connect_wifi: {
  label: "Cannot Connect to Wi-Fi",
  startPrompt: `Customer: I can’t connect to WiFi.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "network",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting the device connection.",
      },
      {
        command: "check_wifi_status",
        preview:
          "Check Wi-Fi status to identify why the device cannot connect.",
      },
      {
        command: "enable_wifi",
        preview:
          "Enable Wi-Fi so the device can connect to wireless networks.",
      },
      {
        command: "test_connection",
        preview:
          "Test the connection to confirm network access is restored.",
      },
    ],

    completion: {
      command: "test_connection",
      fact: "can_connect_wifi",
    },

        proofLines: [
      "Verified the user before troubleshooting device connectivity",
      "Confirmed Wi-Fi connectivity was unavailable",
      "Restored wireless connectivity",
      "Validated successful network connection",
    ],

    successLines: [
      "Agent: Wi-Fi connectivity has been restored and verified.",
      "System: The device is connected to the wireless network successfully.",
      "Customer: Great, I'm connected now.",
    ],

    defaults: {
      kind: "cannot_connect_wifi",
      identity_verified: false,
      wifi_checked: false,
      wifi_enabled: false,
      can_connect_wifi: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore wireless connectivity by enabling Wi-Fi and verifying the connection.",
      skillFocus: [
        "Wi-Fi Troubleshooting",
        "Device Connectivity",
        "Operational Verification",
      ],
      scenarioContext:
        "A user's computer cannot connect to the available wireless network.",
      successOutcome:
        "Wi-Fi is enabled and network connectivity is successfully verified.",
      selectCommand:
        "select cannot connect wifi",
    },
  },

  cannot_connect_wifi_corrupted_profile: {
  label: "Wi-Fi — Corrupted Profile",
  startPrompt: `Customer: My laptop won't connect to Wi-Fi anymore. It worked yesterday, but now it keeps failing to connect.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "network",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting the wireless connection.",
    },
    {
      command: "check_wifi_status",
      preview:
        "Check Wi-Fi status to confirm wireless connectivity is enabled.",
    },
    {
      command: "test_connection",
      preview:
        "Test the Wi-Fi connection to confirm the connection still fails.",
    },
    {
      command: "check_wifi_profile",
      preview:
        "Check the saved Wi-Fi profile for corruption after the initial connection test fails.",
    },
    {
      command: "remove_corrupted_wifi_profile",
      preview:
        "Remove the corrupted saved Wi-Fi profile from the device.",
    },
    {
      command: "reconnect_wifi",
      preview:
        "Reconnect to the Wi-Fi network and create a clean wireless profile.",
    },
    {
      command: "test_connection",
      preview:
        "Test the Wi-Fi connection again to confirm wireless access is restored.",
    },
  ],

  completion: {
    command: "test_connection",
    fact: "can_connect_wifi",
  },

  proofLines: [
    "Verified the user before troubleshooting wireless connectivity",
    "Confirmed Wi-Fi was enabled but the device still could not connect",
    "Tested the connection and confirmed the original issue remained",
    "Identified a corrupted saved Wi-Fi profile",
    "Removed the corrupted wireless profile",
    "Reconnected to the wireless network using a clean profile",
    "Verified successful Wi-Fi connectivity",
  ],

  successLines: [
    "Agent: The corrupted Wi-Fi profile has been removed and wireless connectivity has been restored.",
    "System: The device reconnected using a clean Wi-Fi profile and the connection test completed successfully.",
    "Customer: Great, I'm connected again.",
  ],

  defaults: {
    kind: "cannot_connect_wifi_corrupted_profile",
    identity_verified: false,
    wifi_checked: false,
    first_connection_tested: false,
    wifi_profile_checked: false,
    corrupted_wifi_profile_removed: false,
    wifi_reconnected: false,
    can_connect_wifi: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Restore Wi-Fi connectivity by removing a corrupted saved wireless profile and reconnecting.",
    skillFocus: [
      "Wi-Fi Troubleshooting",
      "Wireless Profile Management",
      "Dependency Awareness",
    ],
    scenarioContext:
      "A user's device cannot reconnect to Wi-Fi because the saved wireless profile has become corrupted.",
    successOutcome:
      "The corrupted profile is removed, a clean Wi-Fi connection is created, and connectivity is verified.",
    selectCommand:
      "select cannot connect wifi corrupted profile",
  },
},

internet_no_access: {
  label: "Internet No Access",
  startPrompt: `Customer: My computer is connected to the network, but I cannot access the internet.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "network",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting internet access.",
      },
      {
        command: "check_network_status",
        preview:
          "Check network status to confirm internet access is unavailable.",
      },
      {
        command: "check_network_adapter",
        preview:
          "Check the network adapter to confirm the connection problem is adapter-related.",
      },
      {
        command: "restart_network_adapter",
        preview:
          "Restart the network adapter to refresh the connection.",
      },
      {
        command: "test_internet_connection",
        preview:
          "Test internet connectivity to confirm access is restored.",
      },
    ],

    completion: {
      command: "test_internet_connection",
      fact: "internet_restored",
    },

        proofLines: [
      "Verified the user before troubleshooting internet access",
      "Confirmed the device had network connectivity but no internet access",
      "Restored internet connectivity through the approved network recovery process",
      "Validated successful internet access",
    ],

    successLines: [
      "Agent: Internet access has been restored and verified.",
      "System: The device can reach online services successfully.",
      "Customer: Great, the internet is working now.",
    ],

    defaults: {
      kind: "internet_no_access",
      identity_verified: false,
      network_checked: false,
      network_adapter_checked: false,
      network_adapter_restarted: false,
      internet_restored: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore internet access by checking and restarting the network adapter.",
      skillFocus: [
        "Network Troubleshooting",
        "Adapter Recovery",
        "Operational Verification",
      ],
      scenarioContext:
        "A computer is connected to the local network but cannot access internet services.",
      successOutcome:
        "The network adapter is restored and internet access is successfully verified.",
      selectCommand:
        "select internet no access",
    },
  },

  internet_no_access_proxy: {
  label: "Internet — Proxy",

  startPrompt: `Customer: My computer says it is connected to the network, but websites will not load.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "network",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting internet access.",
    },
    {
      command: "check_network_status",
      preview:
        "Check network status to confirm the device is connected locally but cannot reach the internet.",
    },
    {
      command: "test_internet_connection",
      preview:
        "Test internet access to confirm the issue remains after the initial network check.",
    },
    {
      command: "check_proxy_settings",
      preview:
        "Check the proxy settings to determine whether an incorrect proxy configuration is blocking internet traffic.",
    },
    {
      command: "disable_incorrect_proxy",
      preview:
        "Disable the incorrect proxy configuration after confirming it is causing the internet access issue.",
    },
    {
      command: "restart_network_adapter",
      preview:
        "Restart the network adapter to refresh the connection after correcting the proxy settings.",
    },
    {
      command: "test_internet_connection",
      preview:
        "Test internet access again to confirm online connectivity has been restored.",
    },
  ],

  completion: {
    command: "test_internet_connection",
    fact: "internet_restored",
  },

  proofLines: [
    "Verified the user before troubleshooting internet access",
    "Confirmed the device was connected to the local network but could not reach the internet",
    "Tested internet access and confirmed the original issue remained",
    "Identified an incorrect proxy configuration blocking internet traffic",
    "Disabled the incorrect proxy configuration",
    "Restarted the network adapter after correcting the proxy settings",
    "Verified successful internet access",
  ],

  successLines: [
    "Agent: The incorrect proxy configuration has been disabled and internet access has been restored.",
    "System: The network adapter refreshed successfully after the proxy settings were corrected.",
    "Customer: Great, websites are loading again.",
  ],

  defaults: {
    kind: "internet_no_access_proxy",
    identity_verified: false,
    network_checked: false,
    first_internet_tested: false,
    proxy_settings_checked: false,
    incorrect_proxy_disabled: false,
    network_adapter_restarted: false,
    internet_restored: false,
  },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "5–7 min",
      description:
        "Restore internet access by identifying and disabling an incorrect proxy configuration.",
      skillFocus: [
        "Internet Troubleshooting",
        "Proxy Configuration",
        "Dependency Awareness",
      ],
      scenarioContext:
        "A user's computer is connected to the local network, but an incorrect proxy configuration is blocking internet traffic.",
      successOutcome:
        "The incorrect proxy is disabled, the network connection is refreshed, and internet access is verified.",
      selectCommand:
        "select internet no access proxy",
  },
},

dns_incorrect_configuration: {
  label: "DNS — Incorrect/Unreachable DNS Configuration",

  startPrompt: `Customer: My computer says it’s connected to the network, but websites are not loading.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "network",

  procedure: [
    {
      command: "check_network_status",
      preview:
        "Check the active network connection and IP configuration.",
    },
    {
      command: "test_internet_connection",
      preview:
        "Test external connectivity to determine whether the network path is working.",
    },
    {
      command: "check_dns_configuration",
      preview:
        "Check the DNS configuration assigned to the active network adapter.",
    },
    {
      command: "test_dns_server_connectivity",
      preview:
        "Test connectivity to the configured DNS server.",
    },
    {
      command: "test_dns_resolution",
      preview:
        "Test hostname resolution through the configured DNS resolver.",
    },
    {
      command: "correct_dns_configuration",
      preview:
        "Replace the incorrect DNS configuration with the approved DNS configuration.",
    },
    {
      command: "test_dns_resolution",
      preview:
        "Test hostname resolution again after correcting the DNS configuration.",
    },
    {
      command: "test_internet_connection",
      preview:
        "Verify normal internet access by hostname after DNS resolution is restored.",
    },
  ],

  completion: {
    command: "test_internet_connection",
    fact: "internet_access_restored",
  },

  proofLines: [
    "Inspected the DNS configuration assigned to the active network adapter",
    "Confirmed the configured DNS server could not be reached",
    "Confirmed hostname resolution failed through the configured resolver",
    "Corrected the DNS configuration using the approved resolver",
    "Verified hostname resolution after correcting the DNS configuration",
    "Verified normal internet access by hostname",
  ],

  successLines: [
    "Agent: DNS configuration has been corrected and internet access has been verified.",
    "System: Hostname resolution and internet access are working normally with the corrected DNS configuration.",
    "Customer: Great, websites are loading again.",
  ],

  defaults: {
    kind: "dns_incorrect_configuration",
    network_status_checked: false,
    internet_connection_tested: false,
    dns_configuration_checked: false,
    dns_server_connectivity_tested: false,
    dns_resolution_tested: false,
    dns_configuration_corrected: false,
    dns_resolution_restored: false,
    internet_access_restored: false,
  },

  previewMetadata: {
    level: "Intermediate",
    estimatedTime: "5–8 min",
    description:
      "Diagnose and correct a DNS configuration issue when network connectivity exists but hostname resolution fails.",
    skillFocus: [
      "Network Troubleshooting",
      "DNS Configuration",
      "DNS Resolution",
      "Connectivity Testing",
    ],
    scenarioContext:
      "A workstation is connected to the network, but hostname-based internet access fails because the configured DNS resolver is unreachable or incorrect.",
    successOutcome:
      "The DNS configuration is corrected, hostname resolution succeeds, and normal internet access is verified.",
    selectCommand:
      "select dns incorrect configuration",
  },
},

slow_network_connection: {
  label: "Slow Network Connection",
  startPrompt: `Customer: My internet connection is extremely slow today.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "network",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting network performance.",
      },
      {
        command: "check_network_speed",
        preview:
          "Check network speed to confirm the connection is degraded.",
      },
      {
        command: "check_network_adapter",
        preview:
          "Check the network adapter to confirm the slowdown is adapter-related.",
      },
      {
        command: "restart_network_adapter",
        preview:
          "Restart the network adapter to restore normal performance.",
      },
      {
        command: "test_internet_connection",
        preview:
          "Test internet connectivity to confirm the connection is stable.",
      },
    ],

    completion: {
      command: "test_internet_connection",
      fact: "internet_speed_restored",
    },

        proofLines: [
      "Verified the user before troubleshooting network performance",
      "Confirmed degraded network performance",
      "Corrected the network adapter condition affecting speed",
      "Validated restored network performance",
    ],

    successLines: [
      "Agent: Network performance has been restored and verified.",
      "System: The network connection is operating within normal performance levels.",
      "Customer: Great, it's much faster now.",
    ],

    defaults: {
      kind: "slow_network_connection",
      identity_verified: false,
      network_speed_checked: false,
      network_adapter_checked: false,
      network_adapter_restarted: false,
      internet_speed_restored: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore normal network performance by checking and restarting the network adapter.",
      skillFocus: [
        "Network Performance",
        "Adapter Troubleshooting",
        "Operational Verification",
      ],
      scenarioContext:
        "A user reports that their internet connection is unusually slow.",
      successOutcome:
        "Normal network speed is restored and connectivity is successfully verified.",
      selectCommand:
        "select slow network connection",
    },
  },

ethernet_not_connected: {
  label: "Ethernet Not Connected",
  startPrompt: `Customer: My computer says the ethernet cable is disconnected.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "network",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting the wired connection.",
      },
      {
        command: "check_ethernet_connection",
        preview:
          "Check the ethernet connection to confirm the cable is disconnected.",
      },
      {
        command: "reconnect_ethernet_cable",
        preview:
          "Reconnect the ethernet cable to restore the wired network connection.",
      },
      {
        command: "test_internet_connection",
        preview:
          "Test internet connectivity to confirm network access is restored.",
      },
    ],

    completion: {
      command: "test_internet_connection",
      fact: "ethernet_connection_restored",
    },

        proofLines: [
      "Verified the user before troubleshooting wired connectivity",
      "Confirmed the ethernet connection was disconnected",
      "Restored wired network connectivity",
      "Validated successful internet access",
    ],

    successLines: [
      "Agent: The ethernet connection has been restored and verified.",
      "System: The device can communicate on the wired network successfully.",
      "Customer: Great, the connection is working now.",
    ],

    defaults: {
      kind: "ethernet_not_connected",
      identity_verified: false,
      ethernet_checked: false,
      ethernet_cable_reconnected: false,
      ethernet_connection_restored: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore wired network access by reconnecting the ethernet connection.",
      skillFocus: [
        "Wired Connectivity",
        "Physical Connection Troubleshooting",
        "Operational Verification",
      ],
      scenarioContext:
        "A user's computer reports that the ethernet cable is disconnected.",
      successOutcome:
        "The ethernet connection is restored and internet access is successfully verified.",
      selectCommand:
        "select ethernet not connected",
    },
  },

  dns_lookup_website_not_opening: {
    label: "DNS Cache — Website Not Opening",
    startPrompt: `Customer: My computer is connected to Wi-Fi, and other websites seem to work, but I can't open our employee portal. It was working earlier today.

What is your first troubleshooting step?`,
    scenarioType: "standard",
    category: "network",
    procedure: [
      { command: "verify_identity", preview: "Verify user identity.", technicianEntry: "verify_identity", systemResult: "The user's identity has been successfully verified.", technicalOutput: "Identity Verification: Successful\nUser Status: Verified" },
      { command: "check_network_status", preview: "Check network status.", technicianEntry: "check_network_status", systemResult: "The workstation's wireless connection and basic wireless settings have been inspected. No obvious wireless connectivity problem was identified.", technicalOutput: "Network Adapter: Wi-Fi\nWi-Fi: Enabled\nAirplane Mode: Off\nNetwork Name: Office Wi-Fi\nConnection Status: Connected\nSignal Strength: Strong", evidence: { id: "dns-wireless-status", text: "Office Wi-Fi is enabled and connected with strong signal; airplane mode is off." } },
      { command: "test_website_access", preview: "Test website access.", technicianEntry: "test_website_access", systemResult: "A known external website loaded successfully. The reported employee portal access problem was reproduced.", technicalOutput: "Website: https://www.google.com\nResult: Loaded successfully\n\nWebsite: https://portal.office.example\nResult: This site can't be reached\nError: ERR_CONNECTION_TIMED_OUT", evidence: { id: "dns-website-access", text: "Google loaded successfully; portal.office.example timed out with ERR_CONNECTION_TIMED_OUT." } },
      { command: "open_command_prompt", preview: "Open Command Prompt.", technicianEntry: "open_command_prompt", systemResult: "Windows Command Prompt has been opened successfully.", technicalOutput: "Microsoft Windows [Version 10.0.22631.4602]\n(c) Microsoft Corporation. All rights reserved.\n\nC:\\Users\\OfficeUser>" },
      { command: "nslookup", preview: "nslookup portal.office.example", technicianEntry: "nslookup portal.office.example", systemResult: "The configured organizational DNS server successfully resolved the employee portal hostname.", technicalOutput: "Server:  dns.office.example\nAddress: 192.168.1.2\n\nName:    portal.office.example\nAddress: 192.168.1.60", evidence: { id: "dns-server-current-address", text: "The organizational DNS server returned 192.168.1.60 for portal.office.example." } },
      { command: "ipconfig_displaydns", preview: "ipconfig /displaydns", technicianEntry: "ipconfig /displaydns", systemResult: "The Windows DNS resolver cache has been inspected. The cached employee portal record contains an IPv4 address that differs from the address returned by the organizational DNS server.", technicalOutput: "Windows IP Configuration\n\n    portal.office.example\n    ----------------------------------------\n    Record Name . . . . . : portal.office.example\n    Record Type . . . . . : 1\n    Time To Live  . . . . : 1800\n    Data Length . . . . . : 4\n    Section . . . . . . . : Answer\n    A (Host) Record . . . : 192.168.1.50", evidence: { id: "dns-cache-outdated-address", text: "The local cache contains 192.168.1.50 with 1800 seconds TTL for portal.office.example." } },
      { command: "ipconfig_flushdns", preview: "ipconfig /flushdns", technicianEntry: "ipconfig /flushdns", systemResult: "The Windows DNS resolver cache has been successfully flushed. The outdated dynamically cached employee portal record has been removed.", technicalOutput: "Windows IP Configuration\n\nSuccessfully flushed the DNS Resolver Cache.", evidence: { id: "dns-cache-flushed", text: "Windows successfully flushed the DNS Resolver Cache; the outdated portal record was removed." } },
      { command: "ping_portal_hostname", preview: "ping portal.office.example", technicianEntry: "ping portal.office.example", systemResult: "Windows resolved the employee portal hostname to the current IPv4 address. The destination responded successfully.", technicalOutput: "Pinging portal.office.example [192.168.1.60] with 32 bytes of data:\n\nReply from 192.168.1.60: bytes=32 time=1ms TTL=64\nReply from 192.168.1.60: bytes=32 time=2ms TTL=64\nReply from 192.168.1.60: bytes=32 time=1ms TTL=64\nReply from 192.168.1.60: bytes=32 time=1ms TTL=64\n\nPing statistics for 192.168.1.60:\n    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),\n\nApproximate round trip times in milli-seconds:\n    Minimum = 1ms, Maximum = 2ms, Average = 1ms", evidence: { id: "dns-ping-current-address", text: "ping resolved portal.office.example to 192.168.1.60 and received four replies." } },
      { command: "ipconfig_displaydns", preview: "ipconfig /displaydns", technicianEntry: "ipconfig /displaydns", systemResult: "The Windows DNS resolver cache now contains the updated employee portal address.", technicalOutput: "Windows IP Configuration\n\n    portal.office.example\n    ----------------------------------------\n    Record Name . . . . . : portal.office.example\n    Record Type . . . . . : 1\n    Time To Live  . . . . : 3600\n    Data Length . . . . . : 4\n    Section . . . . . . . : Answer\n    A (Host) Record . . . : 192.168.1.60", evidence: { id: "dns-cache-updated-address", text: "The local cache now contains 192.168.1.60 with 3600 seconds TTL for portal.office.example." } },
      { command: "test_internet_connection", preview: "Test Website Access and Confirm Resolution", technicianEntry: "test_internet_connection", systemResult: "The employee portal loaded successfully. The user confirms that the original website access problem has been resolved.", technicalOutput: "Website Verification\n\nWebsite: https://portal.office.example\nBrowser Result: Loaded successfully\nOriginal Connection Error: Not reproduced\nUser Confirmation: Original issue resolved", evidence: { id: "dns-website-restored", text: "The employee portal loaded successfully and the user confirmed the original issue was resolved." } },
    ],
    completion: { command: "test_internet_connection", fact: "user_confirmed_resolution" },
    proofLines: [
      "User identity verified",
      "Wireless network settings inspected",
      "External website access succeeded and employee portal access failed",
      "Organizational DNS returned 192.168.1.60",
      "Local cache contained outdated address 192.168.1.50",
      "DNS cache flushed",
      "Hostname ping resolved and reached 192.168.1.60",
      "Updated cache record verified",
      "Employee portal access and user resolution confirmed",
    ],
    successLines: [
      "The employee portal loaded successfully.",
      "Customer: \"It's working now. I can open the employee portal again.\"",
    ],
    defaults: {
      kind: "dns_lookup_website_not_opening",
      identity_verified: false,
      network_status_checked: false,
      website_access_tested: false,
      command_prompt_opened: false,
      configured_dns_lookup_succeeded: false,
      initial_dns_cache_inspected: false,
      dns_cache_flushed: false,
      portal_hostname_ping_succeeded: false,
      updated_dns_cache_inspected: false,
      internet_access_verified: false,
      user_confirmed_resolution: false,
      wifi_enabled: true,
      airplane_mode_off: true,
      signal_strength: "Strong",
      ipv4_address: "192.168.1.100",
      subnet_mask: "255.255.255.0",
      default_gateway: "192.168.1.1",
      configured_dns_server: "192.168.1.2",
      portal_hostname: "portal.office.example",
      outdated_cached_address: "192.168.1.50",
      current_portal_address: "192.168.1.60",
      initial_cache_ttl: 1800,
      updated_cache_ttl: 3600,
    },
    previewMetadata: {
      level: "Beginner",
      estimatedTime: "5–8 min",
      description: "Troubleshoot employee portal access by comparing direct DNS results with the Windows local DNS cache.",
      skillFocus: ["DNS Resolution", "DNS Cache", "A Records and TTL"],
      scenarioContext: "The employee portal does not open while external websites remain accessible and the DNS server has a new address.",
      successOutcome: "The outdated local DNS cache entry is flushed and verified with the current portal address.",
      selectCommand: "select dns lookup website not opening",
    },
  },

  tcp_port_connectivity: {
    label: "TCP Port Connectivity — Company Application Cannot Connect",
    startPrompt: `Customer: I'm trying to open the Company Portal, but it keeps saying it can't connect to the server. Everything else seems to be working. I can still access websites, but I can't get into the Company Portal.

What is your first troubleshooting step?`,
    scenarioType: "standard",
    category: "network",
    procedure: [
      { command: "verify_identity", preview: "Verify user identity.", technicianEntry: "verify_identity", systemResult: "The user's identity has been successfully verified.", technicalOutput: "Identity Verification: Successful\nUser Status: Verified" },
      { command: "check_application_error", preview: "Check application error.", technicianEntry: "check_application_error", systemResult: "The Company Portal connection problem has been reproduced.", technicalOutput: "Company Portal\n\nConnection Error\n\nUnable to establish a connection to the server.", evidence: { id: "tcp-app-connection-error", text: "The Company Portal displayed an inability to establish a connection to the server." } },
      { command: "check_physical_network_connection", preview: "Check physical network connection.", technicianEntry: "check_physical_network_connection", systemResult: "The workstation's Ethernet cable is securely connected, and the network link indicator is active.", technicalOutput: "Ethernet Cable: Connected\nNetwork Link: Active", evidence: { id: "tcp-physical-network", text: "The workstation Ethernet cable is connected and the network link is active." } },
      { command: "check_network_status", preview: "Check network status.", technicianEntry: "check_network_status", systemResult: "The workstation is connected to the organization's network. General internet access is working.", technicalOutput: "Network Adapter: Ethernet\nConnection Status: Connected\nInternet Access: Available", evidence: { id: "tcp-network-status", text: "Ethernet is connected and general internet access is available." } },
      { command: "check_application_connection_settings", preview: "Check application connection settings.", technicianEntry: "check_application_connection_settings", systemResult: "The Company Portal's current connection settings have been retrieved.", technicalOutput: "Application: Company Portal\nServer Address: 192.168.1.50\nConnection Protocol: HTTPS\nTCP Port: 443", evidence: { id: "tcp-app-settings-443", text: "Company Portal is configured for 192.168.1.50 over HTTPS on TCP port 443." } },
      { command: "open_it_knowledge_base", preview: "Open IT Knowledge Base.", technicianEntry: "open_it_knowledge_base", systemResult: "The organization's IT Knowledge Base has been opened.", technicalOutput: "IT Knowledge Base\nApproved support portal opened." },
      { command: "open_kb_app_connectivity", preview: "Open KB-205.", technicianEntry: "open_kb_app_connectivity", systemResult: "KB-205 has been retrieved. The documented Company Portal connection settings have been identified.", technicalOutput: "KB-205 — Company Portal Connectivity\n\nApplication: Company Portal\nApplication Server: 192.168.1.50\nConnection Protocol: HTTPS\nRequired TCP Port: 8443\n\nSupport Authorization:\nLevel 1 Help Desk technicians are authorized\nto correct the application's connection settings.", evidence: { id: "tcp-kb8443", text: "KB-205 documents Company Portal at 192.168.1.50:8443 and authorizes Level 1 correction." } },
      { command: "open_powershell", preview: "Open PowerShell.", technicianEntry: "open_powershell", systemResult: "Windows PowerShell has been opened.", technicalOutput: "Windows PowerShell\nCopyright (C) Microsoft Corporation. All rights reserved.\n\nPS C:\\Users\\Technician>" },
      { command: "ping_application_server", preview: "ping 192.168.1.50", technicianEntry: "ping 192.168.1.50", systemResult: "The application server responds successfully to the ICMP connectivity test.", technicalOutput: "PS C:\\Users\\Technician> ping 192.168.1.50\n\nPinging 192.168.1.50 with 32 bytes of data:\nReply from 192.168.1.50: bytes=32 time=1ms TTL=128\nReply from 192.168.1.50: bytes=32 time=1ms TTL=128\nReply from 192.168.1.50: bytes=32 time=2ms TTL=128\nReply from 192.168.1.50: bytes=32 time=1ms TTL=128\n\nPing statistics for 192.168.1.50:\n    Packets: Sent = 4, Received = 4, Lost = 0\n    (0% loss),\n\nApproximate round trip times in milli-seconds:\n    Minimum = 1ms, Maximum = 2ms, Average = 1ms", evidence: { id: "tcp-server-ping", text: "Application server 192.168.1.50 responded to 4 ICMP echo requests; 0 lost." } },
      { command: "test_tcp_port_443", preview: "Test-NetConnection 192.168.1.50 -Port 443", technicianEntry: "Test-NetConnection 192.168.1.50 -Port 443", systemResult: "The application server is reachable, but a TCP connection to the application's currently configured port cannot be established.", technicalOutput: "PS C:\\Users\\Technician> Test-NetConnection 192.168.1.50 -Port 443\n\nWARNING: TCP connect to (192.168.1.50 : 443) failed\n\nComputerName           : 192.168.1.50\nRemoteAddress          : 192.168.1.50\nRemotePort             : 443\nInterfaceAlias         : Ethernet\nSourceAddress          : 192.168.1.100\nPingSucceeded          : True\nPingReplyDetails (RTT) : 1 ms\nTcpTestSucceeded       : False", evidence: { id: "tcp443-test-failed", text: "TCP 443 test failed while PingSucceeded was True and TcpTestSucceeded was False." } },
      { command: "test_tcp_port_8443", preview: "Test-NetConnection 192.168.1.50 -Port 8443", technicianEntry: "Test-NetConnection 192.168.1.50 -Port 8443", systemResult: "A TCP connection to the documented Company Portal destination port has been established successfully.\n\nThe server IP address is unchanged. Only the tested destination port differs.", technicalOutput: "PS C:\\Users\\Technician> Test-NetConnection 192.168.1.50 -Port 8443\n\nComputerName     : 192.168.1.50\nRemoteAddress    : 192.168.1.50\nRemotePort       : 8443\nInterfaceAlias   : Ethernet\nSourceAddress    : 192.168.1.100\nTcpTestSucceeded : True", evidence: { id: "tcp8443-test-succeeded", text: "TCP 8443 test succeeded at 192.168.1.50 with TcpTestSucceeded True and no firewall remediation performed." } },
      { command: "correct_application_port_configuration", preview: "Correct application port configuration.", technicianEntry: "correct_application_port_configuration", systemResult: "The Company Portal's destination TCP port has been corrected to match the documented application configuration.\n\nThe server IP address remains unchanged.", technicalOutput: "Application: Company Portal\nServer Address: 192.168.1.50\nConnection Protocol: HTTPS\n\nPrevious TCP Port: 443\nUpdated TCP Port: 8443\n\nConfiguration Match: Yes\nSettings Saved: Yes", evidence: { id: "tcp-app-port-corrected", text: "Company Portal port changed from TCP 443 to TCP 8443 while server 192.168.1.50 remained unchanged." } },
      { command: "test_application_connection", preview: "Test application connection.", technicianEntry: "test_application_connection", systemResult: "The Company Portal has successfully connected to its application server and loaded normally using the corrected configuration.", technicalOutput: "Application: Company Portal\nServer Address: 192.168.1.50\nConnection Protocol: HTTPS\nTCP Port: 8443\n\nConnection Status: Connected\nPortal Status: Loaded Successfully", evidence: { id: "tcp-app-connection-restored", text: "Company Portal connected successfully at 192.168.1.50:8443 and loaded normally." } },
      { command: "confirm_user_resolution", preview: "Confirm User Resolution", technicianEntry: "confirm_user_resolution", systemResult: "The user confirms that the Company Portal is accessible and functioning normally.", technicalOutput: "User Response: \"It's working now. I can open the Company Portal and access everything I need.\"", evidence: { id: "tcp-user-resolution-confirmed", text: "User confirmed Company Portal is accessible and functioning normally." } },
    ],
    completion: { command: "confirm_user_resolution", fact: "user_resolution_confirmed" },
    proofLines: ["Verified the user", "Reproduced the Company Portal connection error", "Confirmed physical network and general connectivity", "Retrieved the incorrect application port setting", "Verified KB-205 required TCP port 8443", "Confirmed server ICMP reachability", "Confirmed port 443 failure and port 8443 success", "Corrected the application port and verified the portal with the user"],
    successLines: ["Company Portal connects successfully and the employee confirms resolution.", "User Confirmation: Successful"],
    defaults: {
      kind: "tcp_port_connectivity",
      identity_verified: false,
      application_error_checked: false,
      physical_network_connection_checked: false,
      network_status_checked: false,
      application_connection_settings_checked: false,
      knowledge_base_opened: false,
      app_connectivity_article_opened: false,
      powershell_opened: false,
      application_server_ping_succeeded: false,
      tcp_port_443_test_failed: false,
      tcp_port_8443_test_succeeded: false,
      application_port_configuration_corrected: false,
      application_connection_verified: false,
      user_resolution_confirmed: false,
      ipv4_address: "192.168.1.100",
      subnet_mask: "255.255.255.0",
      default_gateway: "192.168.1.1",
      application_server: "192.168.1.50",
      incorrect_tcp_port: 443,
      required_tcp_port: 8443,
    },
    previewMetadata: { level: "Beginner", estimatedTime: "5–8 min", description: "Troubleshoot a Company Portal connection by distinguishing IP reachability from TCP port connectivity.", skillFocus: ["TCP Connectivity", "PowerShell Diagnostics", "Application Configuration"], scenarioContext: "A company application cannot connect to its server while general internet connectivity remains available.", successOutcome: "The application port is corrected and Company Portal access is verified.", selectCommand: "select tcp port connectivity" },
  },

  active_network_connections_application_port_conflict: {
    label: "Active Network Connections — Application Port Conflict",
    startPrompt: `Customer: The Company Reporting Tool displays an error during startup and closes before I can generate a report. I need it to work so I can complete normal reporting activities.

What is your first troubleshooting step?`,
    scenarioType: "standard",
    category: "network",
    procedure: [
      {
        command: "verify_identity",
        preview: "Verify the employee and affected workstation.",
        technicianEntry: "Simulator procedure: verify_identity (not a Windows command)",
        systemResult: "The employee's identity has been verified. The affected workstation and reported application have been confirmed.",
        technicalOutput: "",
      },
      {
        command: "open_company_reporting_tool",
        preview: "Reproduce the reported application startup failure.",
        technicianEntry: "Simulator procedure: open_company_reporting_tool (not a Windows command)",
        systemResult: "The Company Reporting Tool fails during initialization and closes after displaying a startup error.",
        technicalOutput: "Company Reporting Tool\n\nStartup Error\n\nUnable to initialize local reporting service.\n\nSocket error: 10048\n\nApplication startup unsuccessful.",
        evidence: { id: "active-connections-startup-error", text: "The Company Reporting Tool displayed socket error 10048 during startup and closed." },
      },
      {
        command: "open_reporting_config_ini",
        preview: "Inspect the application's reporting configuration.",
        technicianEntry: "Simulator procedure: open_reporting_config.ini (not a Windows command)",
        systemResult: "The Company Reporting Tool configuration file has been inspected.\n\nThe local reporting service is configured to use TCP address 127.0.0.1 and port 8080.\n\nNo configuration changes have been made.",
        technicalOutput: "File: C:\\CompanyTools\\Reporting\\config.ini\n\n[LocalService]\nProtocol=TCP\nListenAddress=127.0.0.1\nListenPort=8080",
        evidence: { id: "active-connections-config", text: "The configuration file specifies TCP 127.0.0.1:8080 for the local reporting service." },
      },
      {
        command: "inspect_tcp_8080_listener",
        preview: "Inspect current network information for the configured endpoint.",
        technicianEntry: "netstat -ano | findstr :8080",
        systemResult: "A TCP listener is present on local address 127.0.0.1 and port 8080.\n\nThe listener is associated with process ID 4820.",
        technicalOutput: "C:\\>netstat -ano | findstr :8080\n  TCP    127.0.0.1:8080    0.0.0.0:0    LISTENING    4820",
        evidence: { id: "active-connections-listener-4820", text: "A TCP listener on 127.0.0.1:8080 is associated with PID 4820." },
      },
      {
        command: "identify_report_preview_process",
        preview: "Identify the executable associated with the discovered process ID.",
        technicianEntry: 'tasklist /FI "PID eq 4820"',
        systemResult: "Process ID 4820 belongs to ReportPreview.exe, the executable associated with the Report Preview Tool.\n\nThe process associated with the conflicting local listener has been identified.",
        technicalOutput: 'C:\\>tasklist /FI "PID eq 4820"\n\nImage Name                     PID Session Name        Session#    Mem Usage\n========================= ======== ================ =========== ============\nReportPreview.exe             4820 Console                    1     48,216 K',
        evidence: { id: "active-connections-process-4820", text: "PID 4820 belongs to ReportPreview.exe." },
      },
      {
        command: "check_report_preview_tool",
        preview: "Confirm the application's status and that it is safe to close.",
        technicianEntry: "Simulator procedure: check_report_preview_tool (not a Windows command)",
        systemResult: "The Report Preview Tool is running on the affected workstation.\n\nThe employee confirms that the application is no longer needed and that no unsaved work or active reporting operations remain.\n\nAuthorization to close the application has been obtained.",
        technicalOutput: "",
        evidence: { id: "active-connections-safe-to-close", text: "The employee confirms no unsaved work or active operations and authorizes normal shutdown of Report Preview Tool." },
      },
      {
        command: "close_report_preview_tool",
        preview: "Close the approved application normally.",
        technicianEntry: "Simulator procedure: close_report_preview_tool (not a Windows command)",
        systemResult: "The Report Preview Tool has been closed normally with the employee's authorization.\n\nNo unsaved work was reported.",
        technicalOutput: "",
        evidence: { id: "active-connections-preview-tool-closed", text: "Report Preview Tool was closed normally after the employee authorized shutdown." },
      },
      {
        command: "inspect_tcp_8080_listener",
        preview: "Recheck the filtered network connection information.",
        technicianEntry: "netstat -ano | findstr :8080",
        systemResult: "No matching network entries were returned.\n\nThe previously identified TCP listener on 127.0.0.1:8080 is no longer present in the current network connection information.",
        technicalOutput: "C:\\>netstat -ano | findstr :8080\n\nC:\\>",
        evidence: { id: "active-connections-listener-absent", text: "No matching entry for the previously identified listener was returned during the current inspection." },
      },
      {
        command: "open_company_reporting_tool",
        preview: "Retry the original application startup operation.",
        technicianEntry: "Simulator procedure: open_company_reporting_tool (not a Windows command)",
        systemResult: "The Company Reporting Tool starts successfully.\n\nThe local reporting service reports successful initialization, and the previous startup error does not appear.",
        technicalOutput: "Company Reporting Tool\n\nLocal reporting service initialized.\n\nApplication status: Ready",
        evidence: { id: "active-connections-reporting-tool-started", text: "The Company Reporting Tool initialized successfully without the previous startup error." },
      },
      {
        command: "inspect_tcp_8080_listener",
        preview: "Inspect the current listener on the configured endpoint.",
        technicianEntry: "netstat -ano | findstr :8080",
        systemResult: "A TCP listener is present on local address 127.0.0.1 and port 8080.\n\nThe current listener is associated with process ID 6132.",
        technicalOutput: "C:\\>netstat -ano | findstr :8080\n  TCP    127.0.0.1:8080    0.0.0.0:0    LISTENING    6132",
        evidence: { id: "active-connections-reporting-listener-6132", text: "A TCP listener on 127.0.0.1:8080 is associated with PID 6132." },
      },
      {
        command: "identify_company_reporting_process",
        preview: "Confirm the executable associated with the current process ID.",
        technicianEntry: 'tasklist /FI "PID eq 6132"',
        systemResult: "Process ID 6132 belongs to ReportingTool.exe.\n\nThe Company Reporting Tool has been confirmed as the process associated with the required local TCP listener.",
        technicalOutput: 'C:\\>tasklist /FI "PID eq 6132"\n\nImage Name                     PID Session Name        Session#    Mem Usage\n========================= ======== ================ =========== ============\nReportingTool.exe             6132 Console                    1     82,640 K',
        evidence: { id: "active-connections-reporting-process-6132", text: "PID 6132 belongs to ReportingTool.exe." },
      },
      {
        command: "test_company_reporting_tool",
        preview: "Test the application's normal reporting function.",
        technicianEntry: "Simulator procedure: test_company_reporting_tool (not a Windows command)",
        systemResult: "The Company Reporting Tool successfully generates and displays a sample report.\n\nNo application errors occur during the test operation.",
        technicalOutput: "Company Reporting Tool\n\nReport: Sample Report\n\nGeneration status: Completed\n\nApplication status: Ready",
        evidence: { id: "active-connections-report-generated", text: "The Company Reporting Tool generated and displayed a sample report without errors." },
      },
      {
        command: "confirm_user_resolution",
        preview: "Confirm normal reporting activities with the employee.",
        technicianEntry: "Simulator procedure: confirm_user_resolution (not a Windows command)",
        systemResult: "The employee confirms that the Company Reporting Tool opens successfully and generates reports as expected.\n\nThe original reported issue has been resolved.",
        technicalOutput: "",
        evidence: { id: "active-connections-user-resolution", text: "The employee confirms the Company Reporting Tool opens and generates reports as expected." },
      },
    ],
    investigation: {
      relatedActions: {
        check_network_status: {
          agent: "I’m checking the workstation's general network status.",
          system: "Windows reports that the workstation has an active network connection. This check does not identify the cause of the reported application startup problem.",
          evidence: { id: "active-connections-network-status", text: "The workstation reports an active network connection; the cause of the application startup problem remains undetermined." },
        },
      },
    },
    completion: {
      command: "confirm_user_resolution",
      fact: "user_resolution_confirmed",
    },
    proofLines: [
      "Verified the employee and affected workstation",
      "Reproduced the Company Reporting Tool startup error",
      "Inspected the configured local TCP endpoint",
      "Identified the process associated with the initial listener",
      "Confirmed operational safety and authorization before normal application shutdown",
      "Verified the previous listener was absent after shutdown",
      "Retested application startup and identified the current listener owner",
      "Generated a sample report and confirmed resolution with the employee",
    ],
    successLines: [
      "The Company Reporting Tool starts and generates reports successfully.",
      "The employee confirms normal reporting activities are restored.",
    ],
    defaults: {
      kind: "active_network_connections_application_port_conflict",
      identity_verified: false,
      application_startup_failure_reproduced: false,
      reporting_configuration_inspected: false,
      conflicting_listener_discovered: false,
      conflicting_process_identified: false,
      report_preview_tool_operational_status_checked: false,
      report_preview_tool_safe_to_close: false,
      report_preview_tool_running: true,
      report_preview_tool_closed: false,
      conflicting_listener_present: true,
      conflicting_listener_absence_verified: false,
      company_reporting_tool_running: false,
      reporting_listener_discovered: false,
      reporting_process_owner_verified: false,
      reporting_functionality_verified: false,
      user_resolution_confirmed: false,
    },
    previewMetadata: {
      level: "Beginner",
      estimatedTime: "5–8 min",
      description: "Investigate an application startup error and restore normal reporting activity.",
      skillFocus: ["Windows Network Connections", "Process Identification", "Application Verification"],
      scenarioContext: "The Company Reporting Tool closes during startup and the employee cannot generate reports.",
      successOutcome: "The employee can open the reporting tool and generate reports again.",
      selectCommand: "select active network connections application port conflict",
    },
  },

  dhcp_apipa_troubleshooting: {
    label: "DHCP Address Renewal",
    startPrompt: "Customer: Websites would not load.",
    scenarioType: "standard",
    category: "network",
    procedure: [
      {
        command: "verify_identity",
        preview: "verify_identity",
        systemResult: "User identity verified successfully. Troubleshooting may proceed.",
        technicalOutput: `Identity Verification
Status : Verified`,
      },
      {
        command: "check_network_status",
        preview: "check_network_status",
        systemResult: "The laptop is connected to the office Wi-Fi network.",
        technicalOutput: `Network Status

Connection Type : Wi-Fi
Network Name    : Office Wi-Fi
Connection      : Connected`,
      },
      {
        command: "open_command_prompt",
        preview: "open_command_prompt",
        systemResult: "Windows Command Prompt opened successfully.",
        technicalOutput: `Command Prompt


Microsoft Windows [Version 10.0.26100]
(c) Microsoft Corporation. All rights reserved.

C:UsersOfficeUser>`,
      },
      {
        command: "ipconfig",
        preview: "ipconfig",
        systemResult: "The workstation's basic IP configuration is displayed.",
        technicalOutput: `C:UsersOfficeUser>ipconfig

Windows IP Configuration


Wireless LAN adapter Wi-Fi:

   Connection-specific DNS Suffix  . :
   Link-local IPv6 Address . . . . . : fe80::2c41:7e9a:8f10:23b1%12
   Autoconfiguration IPv4 Address. . : 169.254.23.18
   Subnet Mask . . . . . . . . . . . : 255.255.0.0
   Default Gateway . . . . . . . . . :


C:UsersOfficeUser>`,
      },
      {
        command: "open_it_knowledge_base",
        preview: "open_it_knowledge_base",
        systemResult: "IT Knowledge Base opened successfully. Available articles are displayed.",
        technicalOutput: `IT KNOWLEDGE BASE

Available Articles:
KB-101 — Password Reset
KB-204 — Office Wi-Fi Network Configuration
KB-310 — Printer Troubleshooting`,
      },
      {
        command: "open_kb_204",
        preview: "open_kb_204",
        systemResult: "Knowledge Base article KB-204 opened successfully. The organization's documented Office Wi-Fi configuration is displayed.",
        technicalOutput: `KB-204 — OFFICE WI-FI NETWORK CONFIGURATION

Network Name : Office Wi-Fi
IPv4 Subnet  : 192.168.1.0/24
Gateway      : 192.168.1.1
DHCP Server  : 192.168.1.10
Addressing   : Automatic (DHCP)`,
      },
      {
        command: "ping_default_gateway",
        preview: "ping 192.168.1.1",
        technicianEntry: "ping 192.168.1.1",
        systemResult: "The ping test failed. The workstation did not receive a response from the documented default gateway.",
        technicalOutput: `C:UsersOfficeUser>ping 192.168.1.1

Pinging 192.168.1.1 with 32 bytes of data:
PING: transmit failed. General failure.
PING: transmit failed. General failure.
PING: transmit failed. General failure.
PING: transmit failed. General failure.

Ping statistics for 192.168.1.1:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),

C:UsersOfficeUser>`,
        evidence: {
          id: "dhcp-gateway-before-renewal",
          text: "The ping test failed. The workstation did not receive a response from the documented default gateway.",
        },
      },
      {
        command: "ping_external_ip",
        preview: "ping 8.8.8.8",
        technicianEntry: "ping 8.8.8.8",
        systemResult: "The external IP connectivity test failed. Windows could not successfully transmit the ping requests.",
        technicalOutput: `C:UsersOfficeUser>ping 8.8.8.8

Pinging 8.8.8.8 with 32 bytes of data:
PING: transmit failed. General failure.
PING: transmit failed. General failure.
PING: transmit failed. General failure.
PING: transmit failed. General failure.

Ping statistics for 8.8.8.8:
    Packets: Sent = 4, Received = 0, Lost = 4 (100% loss),

C:UsersOfficeUser>`,
        evidence: {
          id: "dhcp-external-ip-before-renewal",
          text: "The external IP connectivity test failed. Windows could not successfully transmit the ping requests.",
        },
      },
      {
        command: "ipconfig_all",
        preview: "ipconfig /all",
        technicianEntry: "ipconfig /all",
        systemResult: "Detailed IP configuration retrieved. DHCP is enabled on the wireless adapter, but the workstation currently has an automatically assigned IPv4 link-local address rather than an address from the documented office subnet.",
          technicalOutput: `C:UsersOfficeUser>ipconfig /all

    Windows IP Configuration

      Host Name . . . . . . . . . . . . : OFFICE-LT-014
      Primary Dns Suffix  . . . . . . . : office.example
      Node Type . . . . . . . . . . . . : Hybrid
      IP Routing Enabled. . . . . . . . : No
      WINS Proxy Enabled . . . . . . . : No

    Wireless LAN adapter Wi-Fi:

      Connection-specific DNS Suffix  . :
      Description . . . . . . . . . . . : Intel(R) Wi-Fi 6 AX201 160MHz
      Physical Address. . . . . . . . . : 02-1A-2B-3C-4D-5E
      DHCP Enabled. . . . . . . . . . . : Yes
      Autoconfiguration Enabled . . . . : Yes
      Link-local IPv6 Address . . . . . : fe80::2c41:7e9a:8f10:23b1%12(Preferred)
      Autoconfiguration IPv4 Address. . : 169.254.23.18(Preferred)
      Subnet Mask . . . . . . . . . . . : 255.255.0.0
      Default Gateway . . . . . . . . . :
      DHCPv6 IAID . . . . . . . . . . . : 123456789
      DHCPv6 Client DUID . . . . . . . : 00-01-00-01-2A-1B-3C-4D-02-1A-2B-3C-4D-5E

    C:UsersOfficeUser>`,
        evidence: {
          id: "dhcp-details-before-renewal",
          text: "Detailed IP configuration retrieved. DHCP is enabled on the wireless adapter, but the workstation currently has an automatically assigned IPv4 link-local address rather than an address from the documented office subnet.",
        },
      },
      {
        command: "ipconfig_renew",
        preview: "ipconfig /renew",
        technicianEntry: "ipconfig /renew",
        systemResult: "The DHCP renewal request completed successfully. The Wi-Fi adapter received an IPv4 address, subnet mask, and default gateway matching the documented office network.",
        technicalOutput: `C:UsersOfficeUser>ipconfig /renew

Windows IP Configuration


Wireless LAN adapter Wi-Fi:

   Connection-specific DNS Suffix  . : office.example
   IPv4 Address. . . . . . . . . . . : 192.168.1.100
   Subnet Mask . . . . . . . . . . . : 255.255.255.0
   Default Gateway . . . . . . . . . : 192.168.1.1

C:UsersOfficeUser>`,
      },
      {
        command: "ipconfig_all",
        preview: "ipconfig /all",
        technicianEntry: "ipconfig /all",
        systemResult: "Detailed network configuration retrieved. The Wi-Fi adapter now has an IPv4 address, subnet mask, and default gateway consistent with the documented office network. DHCP lease information and DNS server configuration are also available.",
          technicalOutput: `C:UsersOfficeUser>ipconfig /all

    Windows IP Configuration

      Host Name . . . . . . . . . . . . : OFFICE-LT-014
      Primary Dns Suffix  . . . . . . . : office.example
      Node Type . . . . . . . . . . . . : Hybrid
      IP Routing Enabled. . . . . . . . : No
      WINS Proxy Enabled. . . . . . . . : No

    Wireless LAN adapter Wi-Fi:

      Connection-specific DNS Suffix  . : office.example
      Description . . . . . . . . . . . : Intel(R) Wi-Fi 6 AX201 160MHz
      Physical Address. . . . . . . . . : 02-1A-2B-3C-4D-5E
      DHCP Enabled. . . . . . . . . . . : Yes
      Autoconfiguration Enabled . . . . : Yes
      Link-local IPv6 Address . . . . . : fe80::2c41:7e9a:8f10:23b1%12(Preferred)
      IPv4 Address. . . . . . . . . . . : 192.168.1.100(Preferred)
      Subnet Mask . . . . . . . . . . . : 255.255.255.0
      Lease Obtained. . . . . . . . . . : Tuesday, November 17, 2026 1:30:00 PM
      Lease Expires . . . . . . . . . . : Wednesday, November 18, 2026 1:30:00 PM
      Default Gateway . . . . . . . . . : 192.168.1.1
      DHCP Server . . . . . . . . . . . : 192.168.1.10
      DHCPv6 IAID . . . . . . . . . . . : 123456789
      DHCPv6 Client DUID . . . . . . . : 00-01-00-01-2A-1B-3C-4D-02-1A-2B-3C-4D-5E
      DNS Servers . . . . . . . . . . . : 192.168.1.10

    C:UsersOfficeUser>`,
        evidence: {
          id: "dhcp-details-after-renewal",
          text: "Detailed network configuration retrieved. The Wi-Fi adapter now has an IPv4 address, subnet mask, and default gateway consistent with the documented office network. DHCP lease information and DNS server configuration are also available.",
        },
      },
      {
        command: "ping_default_gateway",
        preview: "ping 192.168.1.1",
        technicianEntry: "ping 192.168.1.1",
        systemResult: "The default gateway responded successfully to all four ping requests. No packet loss was reported.",
        technicalOutput: `C:UsersOfficeUser>ping 192.168.1.1

Pinging 192.168.1.1 with 32 bytes of data:
Reply from 192.168.1.1: bytes=32 time=1ms TTL=64
Reply from 192.168.1.1: bytes=32 time=2ms TTL=64
Reply from 192.168.1.1: bytes=32 time=1ms TTL=64
Reply from 192.168.1.1: bytes=32 time=2ms TTL=64

Ping statistics for 192.168.1.1:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 1ms, Maximum = 2ms, Average = 1ms

C:UsersOfficeUser>`,
        evidence: {
          id: "dhcp-gateway-after-renewal",
          text: "The default gateway responded successfully to all four ping requests. No packet loss was reported.",
        },
      },
      {
        command: "ping_external_ip",
        preview: "ping 8.8.8.8",
        technicianEntry: "ping 8.8.8.8",
        systemResult: "The external IP address responded successfully to all four ping requests. No packet loss was reported.",
        technicalOutput: `C:UsersOfficeUser>ping 8.8.8.8

Pinging 8.8.8.8 with 32 bytes of data:
Reply from 8.8.8.8: bytes=32 time=18ms TTL=117
Reply from 8.8.8.8: bytes=32 time=20ms TTL=117
Reply from 8.8.8.8: bytes=32 time=19ms TTL=117
Reply from 8.8.8.8: bytes=32 time=21ms TTL=117

Ping statistics for 8.8.8.8:
    Packets: Sent = 4, Received = 4, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 18ms, Maximum = 21ms, Average = 19ms

C:UsersOfficeUser>`,
        evidence: {
          id: "dhcp-external-ip-after-renewal",
          text: "The external IP address responded successfully to all four ping requests. No packet loss was reported.",
        },
      },
      {
        command: "nslookup",
        preview: "nslookup google.com",
        technicianEntry: "nslookup google.com",
        systemResult: "The configured DNS server responded successfully to the lookup request and returned an IP address for google.com.",
        technicalOutput: `C:UsersOfficeUser>nslookup google.com
Server:  dns.office.example
Address:  192.168.1.10

Non-authoritative answer:
Name:    google.com
Address:  142.250.190.14

C:UsersOfficeUser>`,
      },
      {
        command: "test_internet_connection",
        preview: "test_internet_connection",
        systemResult: "The workstation successfully loads the test website. The user also confirms that the websites affected by the original issue are now accessible.",
        technicalOutput: `INTERNET CONNECTION TEST

Workstation: OFFICE-LT-014
Connection:  Office Wi-Fi

Browser Test:
  Website: https://www.google.com
  Result:  Page loaded successfully

User Verification:
  Original issue: Websites would not load
  Current result: User confirms websites now load

Final Status:
  Internet and website access verified successfully.`,
      },
    ],
    completion: {
      command: "test_internet_connection",
      fact: "internet_access_restored",
    },
    proofLines: [
      "User identity verified successfully. Troubleshooting may proceed.",
      "The laptop is connected to the office Wi-Fi network.",
      "The workstation's basic IP configuration is displayed.",
      "The ping test failed. The workstation did not receive a response from the documented default gateway.",
      "The external IP connectivity test failed. Windows could not successfully transmit the ping requests.",
      "The DHCP renewal request completed successfully. The Wi-Fi adapter received an IPv4 address, subnet mask, and default gateway matching the documented office network.",
      "The default gateway responded successfully to all four ping requests. No packet loss was reported.",
      "The external IP address responded successfully to all four ping requests. No packet loss was reported.",
      "The configured DNS server responded successfully to the lookup request and returned an IP address for google.com.",
      "The workstation successfully loads the test website. The user also confirms that the websites affected by the original issue are now accessible.",
    ],
    successLines: [
      `The workstation successfully loads the test website. The user also confirms that the websites affected by the original issue are now accessible.

INTERNET CONNECTION TEST

Workstation: OFFICE-LT-014
Connection:  Office Wi-Fi

Browser Test:
  Website: https://www.google.com
  Result:  Page loaded successfully

User Verification:
  Original issue: Websites would not load
  Current result: User confirms websites now load

Final Status:
  Internet and website access verified successfully.`,
    ],
    defaults: {
      kind: "dhcp_apipa_troubleshooting",
      identity_verified: false,
      network_status_checked: false,
      command_prompt_opened: false,
      ip_configuration_inspected: false,
      knowledge_base_opened: false,
      kb_204_opened: false,
      initial_gateway_ping_failed: false,
      initial_external_ping_failed: false,
      initial_detailed_configuration_inspected: false,
      dhcp_lease_renewed: false,
      renewed_configuration_inspected: false,
      renewed_gateway_ping_succeeded: false,
      renewed_external_ping_succeeded: false,
      dns_resolution_succeeded: false,
      internet_access_restored: false,
      user_confirmed_access: false,
      ipv4_address: "169.254.23.18",
      subnet_mask: "255.255.0.0",
      default_gateway: null,
      dhcp_enabled: true,
      wifi_connected: true,
      dhcp_server: null,
      dns_server: null,
    },
    previewMetadata: {
      level: "Intermediate",
      estimatedTime: "8–12 min",
      description: "Troubleshoot the DHCP configuration and verify internet and website access.",
      skillFocus: ["DHCP", "IP Configuration", "Connectivity Verification"],
      scenarioContext: "The laptop is connected to the office Wi-Fi network. Websites would not load.",
      successOutcome: "The workstation successfully loads the test website. The user also confirms that the websites affected by the original issue are now accessible.",
      selectCommand: "select dhcp apipa troubleshooting",
    },
  },

network_drive_missing: {
  label: "Network Drive Missing",
  startPrompt: `Customer: I cannot see my team network drive anymore.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "files_storage",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting network drive access.",
      },
      {
        command: "check_network_drive_mapping",
        preview:
          "Check the network drive mapping to confirm why the drive is missing.",
      },
      {
        command: "remap_network_drive",
        preview:
          "Remap the network drive so it appears for the user.",
      },
      {
        command: "test_network_drive_access",
        preview:
          "Test network drive access to confirm the user can open it.",
      },
    ],

    completion: {
      command: "test_network_drive_access",
      fact: "network_drive_access_working",
    },

        proofLines: [
      "Verified the user before modifying network drive access",
      "Confirmed the network drive mapping was missing",
      "Restored the network drive mapping",
      "Validated successful network drive access",
    ],

    successLines: [
      "Agent: The network drive has been restored and access has been verified.",
      "System: The network drive opens successfully for the user.",
      "Customer: Great, I can access the network drive now.",
    ],

    defaults: {
      kind: "network_drive_missing",
      identity_verified: false,
      network_drive_mapping_checked: false,
      network_drive_remapped: false,
      network_drive_access_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore a missing network drive by checking and repairing its mapping.",
      skillFocus: [
        "Network Drive Troubleshooting",
        "Drive Mapping",
        "Operational Verification",
      ],
      scenarioContext:
        "A user can no longer see the team network drive they need for work.",
      successOutcome:
        "The network drive is remapped and access is successfully verified.",
      selectCommand:
        "select network drive missing",
    },
  },

network_drive_vpn_required_first: {
  label: "Network Drive Missing — VPN Required First",
  startPrompt: `Customer: I cannot see my team network drive anymore.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "files_storage",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting network drive access.",
      },
      {
        command: "check_vpn_access",
        preview:
          "Check whether VPN access is assigned before troubleshooting the network drive.",
      },
      {
        command: "enable_vpn_access",
        preview:
          "Enable VPN access so the network drive can become available.",
      },
      {
        command: "check_network_drive_mapping",
        preview:
          "Check the network drive mapping after VPN access is restored.",
      },
      {
        command: "remap_network_drive",
        preview:
          "Remap the network drive so it appears for the user.",
      },
      {
        command: "test_network_drive_access",
        preview:
          "Test network drive access to confirm the user can open it.",
      },
    ],

    completion: {
      command: "test_network_drive_access",
      fact: "network_drive_access_working",
    },

    proofLines: [
      "Verified the user before modifying network drive access",
      "Confirmed VPN access was unavailable",
      "Restored VPN access required for network drive connectivity",
      "Confirmed the network drive mapping was missing",
      "Restored the network drive mapping",
      "Validated successful network drive access",
    ],

    successLines: [
      "Agent: VPN access has been restored, the network drive has been remapped, and access has been verified.",
      "System: The VPN dependency was resolved before completing the network drive recovery workflow.",
      "Customer: Great, I can access the network drive now.",
    ],

    defaults: {
      kind: "network_drive_vpn_required_first",
      identity_verified: false,
      vpn_access_checked: false,
      vpn_access_enabled: false,
      network_drive_mapping_checked: false,
      network_drive_remapped: false,
      network_drive_access_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "5–7 min",
      description:
        "Restore a missing network drive after resolving a required VPN dependency.",
      skillFocus: [
        "Network Drive Troubleshooting",
        "VPN Connectivity",
        "Dependency Awareness",
      ],
      scenarioContext:
        "A user cannot access a network drive because VPN connectivity must be restored before the drive can be mapped.",
      successOutcome:
        "VPN access is restored, the network drive is remapped, and access is verified.",
      selectCommand:
        "select network drive vpn required first",
    },
  },

disk_space_full: {
  label: "Disk Space Full",
  startPrompt: `Customer: My computer says the disk space is full.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "files_storage",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting storage capacity.",
      },
      {
        command: "check_disk_space",
        preview:
          "Check available disk space to confirm storage exhaustion.",
      },
      {
        command: "clear_temp_files",
        preview:
          "Remove temporary files to recover storage space.",
      },
      {
        command: "confirm_storage_available",
        preview:
          "Confirm storage space is available again.",
      },
    ],

    completion: {
      command: "confirm_storage_available",
      fact: "storage_available",
    },

        proofLines: [
      "Verified the user before troubleshooting storage capacity",
      "Confirmed disk space was critically low",
      "Removed temporary files to recover storage",
      "Validated storage availability was restored",
    ],

    successLines: [
      "Agent: Storage space has been recovered and availability has been verified.",
      "System: The device now has sufficient available storage.",
      "Customer: Great, that fixed it.",
    ],

    defaults: {
      kind: "disk_space_full",
      identity_verified: false,
      disk_checked: false,
      temp_files_cleared: false,
      storage_available: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Recover storage space by removing temporary files and verifying availability.",
      skillFocus: [
        "Storage Troubleshooting",
        "Disk Cleanup",
        "Operational Verification",
      ],
      scenarioContext:
        "A user's computer reports that the disk is full and has little or no available storage.",
      successOutcome:
        "Temporary files are removed and sufficient storage space is restored.",
      selectCommand:
        "select disk space full",
    },
  },

cannot_open_file: {
  label: "Cannot Open File",
  startPrompt: `Customer: I cannot open one of my work files.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "files_storage",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting file access.",
      },
      {
        command: "check_file_open_error",
        preview:
          "Check the file open error to identify the cause.",
      },
      {
        command: "check_file_association",
        preview:
          "Check the file association assigned to the file type.",
      },
      {
        command: "repair_file_association",
        preview:
          "Repair the file association so the file opens correctly.",
      },
      {
        command: "test_file_open",
        preview:
          "Test opening the file to confirm the issue is resolved.",
      },
    ],

    completion: {
      command: "test_file_open",
      fact: "file_opens_successfully",
    },

        proofLines: [
      "Verified the user before troubleshooting file access",
      "Confirmed the file could not be opened correctly",
      "Repaired the required file association",
      "Validated successful file access",
    ],

    successLines: [
      "Agent: The file association has been repaired and file access has been verified.",
      "System: The file opens successfully in the correct application.",
      "Customer: Great, it opens now.",
    ],

    defaults: {
      kind: "cannot_open_file",
      identity_verified: false,
      file_open_error_checked: false,
      file_association_checked: false,
      file_association_repaired: false,
      file_opens_successfully: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore file access by identifying and repairing an incorrect file association.",
      skillFocus: [
        "File Troubleshooting",
        "Application Association",
        "Operational Verification",
      ],
      scenarioContext:
        "A user cannot open a work file because the file type is not associated with the correct application.",
      successOutcome:
        "The file association is repaired and the file opens successfully.",
      selectCommand:
        "select cannot open file",
    },
  },

folder_access_missing: {
  label: "Folder Access Missing",
  startPrompt: `Customer: I cannot access a folder I need for work.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "files_storage",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before modifying folder access.",
      },
      {
        command: "check_folder_permissions",
        preview:
          "Check folder permissions to determine why access is unavailable.",
      },
      {
        command: "grant_folder_access",
        preview:
          "Grant the required folder permissions.",
      },
      {
        command: "test_folder_access",
        preview:
          "Test folder access to confirm the user can open it.",
      },
    ],

    completion: {
      command: "test_folder_access",
      fact: "folder_access_working",
    },

        proofLines: [
      "Verified the user before modifying folder access",
      "Confirmed folder access was unavailable",
      "Restored folder access permissions",
      "Validated successful folder access",
    ],

    successLines: [
      "Agent: Folder access has been restored and verified.",
      "System: The folder opens successfully for the user.",
      "Customer: Great, I can access the folder now.",
    ],

    defaults: {
      kind: "folder_access_missing",
      identity_verified: false,
      folder_permissions_checked: false,
      folder_access_granted: false,
      folder_access_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore folder access by checking and granting the required permissions.",
      skillFocus: [
        "Folder Permissions",
        "Access Management",
        "Operational Verification",
      ],
      scenarioContext:
        "A user cannot open a folder required for their daily work.",
      successOutcome:
        "The required folder permissions are granted and access is successfully verified.",
      selectCommand:
        "select folder access missing",
    },
  },

  folder_access_required_security_group_missing: {
  label: "Folder Access — Required Security Group Missing",

  startPrompt: `Customer: I can see the shared folder, but every time I try to open it I get an access denied message.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "files_storage",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting folder access.",
    },
    {
      command: "check_folder_permissions",
      preview:
        "Check the folder permissions to confirm the access configuration.",
    },
    {
      command: "test_folder_access",
      preview:
        "Test folder access to confirm the issue still occurs.",
    },
    {
      command: "check_folder_security_group",
      preview:
        "Check whether the user belongs to the required security group for the folder.",
    },
    {
      command: "add_user_to_group",
      preview:
        "Add the user to the required security group.",
    },
    {
      command: "test_folder_access",
      preview:
        "Test folder access again to confirm access has been restored.",
    },
  ],

  completion: {
    command: "test_folder_access",
    fact: "folder_access_working",
  },

  proofLines: [
    "Verified the user's identity before changing folder access",
    "Confirmed the folder permissions were configured correctly",
    "Verified the original access issue still occurred",
    "Identified the user was missing from the required security group",
    "Added the user to the required security group",
    "Verified successful folder access",
  ],

  successLines: [
    "Agent: The required security group membership has been updated and folder access has been verified.",
    "System: The user was added to the required security group and can now access the folder successfully.",
    "Customer: Great, I can open the folder now.",
  ],

  defaults: {
    kind: "folder_access_required_security_group_missing",
    identity_verified: false,
    folder_permissions_checked: false,
    first_folder_access_tested: false,
    folder_security_group_checked: false,
    user_added_to_group: false,
    folder_access_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Resolve folder access by identifying a missing required security group membership.",
    skillFocus: [
      "Folder Permissions",
      "Security Groups",
      "Dependency Awareness",
    ],
    scenarioContext:
      "A user has correct folder permissions configured, but is not a member of the security group required to access the folder.",
    successOutcome:
      "The required security group membership is corrected and folder access is verified.",
    selectCommand:
      "select folder access required security group missing",
  },
},

permissions_denied: {
  label: "Permissions Denied",
  startPrompt: `Customer: I keep getting a permissions denied message.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "account_access",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before modifying permissions.",
      },
      {
        command: "check_user_permissions",
        preview:
          "Check the user's permissions for the blocked resource.",
      },
      {
        command: "grant_required_permission",
        preview:
          "Grant the required permission for the user's role.",
      },
      {
        command: "test_permission_access",
        preview:
          "Test access to confirm the permission works.",
      },
    ],

    completion: {
      command: "test_permission_access",
      fact: "permission_access_working",
    },

        proofLines: [
      "Verified the user before modifying permissions",
      "Confirmed required permissions were missing",
      "Restored the required permissions",
      "Validated successful access",
    ],

    successLines: [
      "Agent: The required permission has been granted and access has been verified.",
      "System: The resource opens successfully with the updated permission.",
      "Customer: Great, I can access it now.",
    ],

    defaults: {
      kind: "permissions_denied",
      identity_verified: false,
      user_permissions_checked: false,
      required_permission_granted: false,
      permission_access_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore access by identifying and granting a missing user permission.",
      skillFocus: [
        "Permission Troubleshooting",
        "Access Management",
        "Operational Verification",
      ],
      scenarioContext:
        "A user receives a permission-denied message when attempting to access a required work resource.",
      successOutcome:
        "The required permission is granted and resource access is successfully verified.",
      selectCommand:
        "select permissions denied",
    },
  },

shared_drive_access_issue: {
  label: "Shared Drive Access Issue",
  startPrompt: `Customer: I can’t access the shared drive I need for work.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "account_access",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before changing shared drive access.",
      },
      {
        command: "check_shared_drive_permissions",
        preview:
          "Check shared drive permissions to confirm why access is blocked.",
      },
      {
        command: "grant_shared_drive_access",
        preview:
          "Grant the correct shared drive access for the user.",
      },
      {
        command: "test_shared_drive_access",
        preview:
          "Test shared drive access to confirm the user can open it.",
      },
    ],

    completion: {
      command: "test_shared_drive_access",
      fact: "shared_drive_access_working",
    },

        proofLines: [
      "Verified the user before changing shared drive access",
      "Confirmed shared drive permissions were preventing access",
      "Restored the required shared drive permissions",
      "Validated successful shared drive access",
    ],

    successLines: [
      "Agent: Shared drive permissions have been restored and access has been verified.",
      "System: The shared drive opens successfully for the user.",
      "Customer: Great, I can access it now.",
    ],

    defaults: {
      kind: "shared_drive_access_issue",
      identity_verified: false,
      shared_drive_permissions_checked: false,
      shared_drive_access_granted: false,
      shared_drive_access_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore shared drive access by correcting missing permissions.",
      skillFocus: [
        "Shared Drive Troubleshooting",
        "Access Management",
        "Operational Verification",
      ],
      scenarioContext:
        "A user cannot access a shared drive required for their work.",
      successOutcome:
        "The required shared drive permissions are granted and access is successfully verified.",
      selectCommand:
        "select shared drive access issue",
    },
  },

cannot_install_software: {
  label: "Cannot Install Software",
  startPrompt: `Customer: I need to install software, but the installation keeps failing.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "account_access",

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before changing software installation access.",
      },
      {
        command: "check_install_permissions",
        preview:
          "Check whether the user has permission to install software.",
      },
      {
        command: "grant_install_permissions",
        preview:
          "Grant the required software installation permissions.",
      },
      {
        command: "test_software_install",
        preview:
          "Test software installation to confirm it works.",
      },
    ],

    completion: {
      command: "test_software_install",
      fact: "software_install_working",
    },

        proofLines: [
      "Verified the user before modifying installation permissions",
      "Confirmed installation permissions were unavailable",
      "Restored software installation permissions",
      "Validated successful software installation",
    ],

    successLines: [
      "Agent: Software installation permissions have been restored and verified.",
      "System: The software installs successfully with the updated permissions.",
      "Customer: Yes, the installation worked.",
    ],

    defaults: {
      kind: "cannot_install_software",
      identity_verified: false,
      install_permissions_checked: false,
      install_permissions_granted: false,
      software_install_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore software installation access by correcting missing permissions.",
      skillFocus: [
        "Software Installation",
        "Permission Management",
        "Operational Verification",
      ],
      scenarioContext:
        "A user cannot install required work software because installation permissions are unavailable.",
      successOutcome:
        "Installation permissions are granted and the software installation succeeds.",
      selectCommand:
        "select cannot install software",
    },
  },

cannot_install_software_admin_approval_required: {
  label: "Cannot Install Software — Admin Approval Required",
  startPrompt: `Customer: I need to install software for work, but the installation keeps getting blocked.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "software_install_challenges",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before changing software installation access.",
    },
    {
      command: "check_install_permissions",
      preview:
        "Check whether the user has permission to install software.",
    },
    {
      command: "check_software_request_status",
      preview:
        "Check whether the software installation request is still waiting for administrator approval.",
    },
    {
      command: "approve_software_request",
      preview:
        "Approve the pending software installation request.",
    },
    {
      command: "grant_install_permissions",
      preview:
        "Grant installation permissions after the request has been approved.",
    },
    {
      command: "test_software_install",
      preview:
        "Test software installation to confirm it works successfully.",
    },
  ],

  completion: {
    command: "test_software_install",
    fact: "software_install_working",
  },

  proofLines: [
    "Verified the user before modifying installation permissions",
    "Confirmed installation permissions were unavailable",
    "Identified that administrator approval was still pending",
    "Approved the pending software request",
    "Granted installation permissions after approval",
    "Validated successful software installation",
  ],

  successLines: [
    "Agent: The software request has been approved, installation permissions have been granted, and the installation has been verified.",
    "System: The administrative approval dependency was resolved before software installation completed successfully.",
    "Customer: Perfect, the installation worked.",
  ],

  defaults: {
    kind: "cannot_install_software_admin_approval_required",
    identity_verified: false,
    install_permissions_checked: false,
    software_request_checked: false,
    software_request_approved: false,
    install_permissions_granted: false,
    software_install_working: false,
  },
    previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
  "Troubleshoot a blocked software installation by identifying and resolving the dependency preventing installation access.",
skillFocus: [
  "Software Installation",
  "Approval Workflow",
  "Dependency Awareness",
],
scenarioContext:
  "A user cannot install required work software even though the installation request has already been submitted.",
successOutcome:
  "The blocking dependency is resolved, installation permissions are granted, and the software installs successfully.",
    selectCommand:
      "select cannot_install_software_admin_approval_required",
  },
},

too_many_apps_running: {
  label: "Too Many Apps Running",
  startPrompt: `Customer: My computer is running very slowly today.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "device_performance",

    procedure: [
      { command: "verify_identity", preview: "Verify the user's identity before troubleshooting device performance." },
      { command: "check_running_apps", preview: "Check running applications to identify unnecessary resource usage." },
      { command: "close_unnecessary_apps", preview: "Close unnecessary applications to free system resources." },
      { command: "test_performance", preview: "Test performance to confirm the device responds normally." },
    ],
        completion: { command: "test_performance", fact: "performance_ok" },

        proofLines: [
      "Verified the user before troubleshooting device performance",
      "Confirmed excessive applications were consuming system resources",
      "Closed unnecessary applications",
      "Validated normal device performance",
    ],

    successLines: [
      "Agent: Unnecessary applications have been closed and performance has been verified.",
      "System: Resource usage has returned to normal levels.",
      "Customer: It’s much better now.",
    ],

defaults: {
  kind: "too_many_apps_running",
  identity_verified: false,
  apps_checked: false,
  apps_closed: false,
  performance_ok: false,
},

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore computer performance by closing unnecessary running applications.",
      skillFocus: [
        "Performance Troubleshooting",
        "Resource Management",
        "Operational Verification",
      ],
      scenarioContext:
        "A user's computer is running slowly because too many applications are consuming system resources.",
      successOutcome:
        "Unnecessary applications are closed and normal computer performance is restored.",
      selectCommand:
        "select too many apps running",
    },
  },

low_memory: {
  label: "Low Memory",
  startPrompt: `Customer: My computer keeps freezing and feels extremely sluggish.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "device_performance",

    procedure: [
      { command: "verify_identity", preview: "Verify the user's identity before troubleshooting memory usage." },
      { command: "check_memory_usage", preview: "Check memory usage to identify what is slowing the device down." },
      { command: "close_memory_heavy_apps", preview: "Close memory-heavy applications to reduce RAM usage." },
      { command: "test_performance", preview: "Test performance to confirm the device responds normally." },
    ],
        completion: { command: "test_performance", fact: "memory_ok" },

        proofLines: [
      "Verified the user before troubleshooting memory usage",
      "Confirmed memory exhaustion was affecting performance",
      "Reduced memory consumption by closing resource-intensive applications",
      "Validated normal device performance",
    ],

    successLines: [
      "Agent: Memory usage has been reduced and performance has been verified.",
      "System: Memory consumption is within acceptable levels.",
      "Customer: It’s much better now.",
    ],

defaults: {
  kind: "low_memory",
  identity_verified: false,
  memory_checked: false,
  memory_heavy_apps_closed: false,
  memory_ok: false,
},

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
  "Restore computer performance by reducing excessive memory usage.",

      skillFocus: [
        "Performance Troubleshooting",
        "Resource Management",
        "Operational Verification",
      ],
      scenarioContext:
  "A user's computer is freezing and running slowly because memory usage is critically high.",
      successOutcome:

  "Memory-heavy applications are closed, memory usage is reduced, and normal computer performance is restored.",
      selectCommand:
        "select low memory",
    },
  },

computer_running_slowly_memory_leak: {
  label: "Computer Running Slowly",
  startPrompt: `Subject: Computer Running Slowly
Employee: Jordan Taylor
Workstation: WS-108

Employee message:
"My computer has been running really slowly today. Switching between applications takes a long time, and sometimes everything freezes for a few seconds. I can still get my work done, but it's taking much longer than usual."

What is your first troubleshooting step?`,
  scenarioType: "standard",
  category: "device_performance",
  procedure: [
    {
      command: "verify_identity",
      preview: "Verify the employee's identity and support authorization.",
      technicianEntry: "Verify user",
      systemResult: "Employee identity verified.\n\nJordan Taylor is confirmed as the assigned employee for workstation WS-108.\n\nThe technician is authorized to investigate the reported workstation performance issue.",
      technicalOutput: "",
      evidence: { id: "computer-slow-identity", text: "Employee identity verified; Jordan Taylor and workstation WS-108 confirmed; support authorization established." },
    },
    {
      command: "test_performance",
      preview: "Check workstation performance and reproduce the reported symptoms.",
      technicianEntry: "Check workstation performance",
      systemResult: "The technician reproduces the reported performance issue.\n\nSwitching between applications is delayed, File Explorer responds slowly, and the workstation briefly becomes unresponsive during normal employee activity.\n\nThe reported issue is confirmed.",
      technicalOutput: `Workstation: WS-108
Operating system: Windows 11

Observed behavior:

- Application switching: Delayed
- File Explorer responsiveness: Slow
- Intermittent freezing: Observed
- Workstation operational: Yes`,
      evidence: { id: "computer-slow-initial-performance", text: "Application switching delays, slow File Explorer, and intermittent freezing reproduced on WS-108." },
    },
    {
      command: "restart_workstation",
      preview: "Restart the workstation with employee authorization.",
      technicianEntry: "Restart computer",
      systemResult: "The employee confirms that all work has been saved and authorizes the restart.\n\nThe workstation restarts successfully.\n\nAfter the employee signs in, the normal desktop environment and startup applications load.",
      technicalOutput: `Restart status: Successful
Windows sign-in: Successful
Desktop environment: Available
Startup applications: Loaded`,
      evidence: { id: "computer-slow-workstation-restarted", text: "The employee authorized the restart after saving work; Windows and startup applications loaded successfully." },
    },
    {
      command: "test_performance",
      preview: "Retest performance after normal activity resumes.",
      technicianEntry: "Check workstation performance",
      systemResult: "The workstation initially responds normally following the restart.\n\nAfter approximately 10 minutes of normal employee activity, application switching becomes delayed and intermittent freezing returns.\n\nThe performance issue remains unresolved.",
      technicalOutput: `Post-restart observation:

Immediately after sign-in:

- Application switching: Normal
- File Explorer responsiveness: Normal
- Intermittent freezing: Not observed

After 10 minutes of normal activity:

- Application switching: Delayed
- File Explorer responsiveness: Slow
- Intermittent freezing: Observed`,
      evidence: { id: "computer-slow-symptoms-recurred", text: "Performance improved immediately after restart, then the original delays and freezing returned after normal activity." },
    },
    {
      command: "check_disk_space",
      preview: "Check the system drive's available storage capacity.",
      technicianEntry: "Open This PC",
      systemResult: "The technician inspects the available storage capacity of the workstation's system drive.\n\nThe system drive has 118 GB of available storage.",
      technicalOutput: `This PC — Devices and drives
Local Disk (C:)
- Total capacity: 256 GB
- Used space: 138 GB
    - Free space: 118 GB`,
      evidence: { id: "computer-slow-disk-space", text: "Local Disk (C:) has a total capacity of 256 GB with 118 GB of free storage." },
    },
    {
      command: "inspect_task_manager",
      preview: "Inspect Task Manager CPU, memory, disk, GPU and process usage.",
      technicianEntry: "Inspect Task Manager",
      systemResult: "Task Manager shows elevated memory utilization and disk active time.\n\nCPU and GPU utilization remain comparatively low.\n\nCompany Sync Tool is the largest individual consumer of memory among the displayed processes.",
      technicalOutput: `Task Manager — Performance

CPU
- Utilization: 24%
Memory
- Installed: 8.0 GB
- In use: 7.5 GB
- Available: 0.3 GB
- Utilization: 96%
Disk 0 (C:)
- Type: SSD
- Active time: 100%
GPU 0
- Utilization: 5%

Task Manager — Processes

Name | CPU | Memory | Disk

Company Sync Tool | 4% | 5,600 MB | 1.2 MB/s
Web Browser | 6% | 620 MB | 0.2 MB/s
File Explorer | 1% | 95 MB | 0.1 MB/s
Other displayed processes | 13% | Various | Various

The process list is a selected excerpt, not a complete accounting of all system memory.`,
      evidence: { id: "computer-slow-task-manager", text: "Task Manager shows 96% memory use, 0.3 GB available, 100% disk active time, low CPU/GPU use, and Company Sync Tool as the largest displayed memory consumer." },
    },
    {
      command: "inspect_resource_monitor",
      preview: "Inspect Resource Monitor memory, hard-fault, disk and process activity over time.",
      technicianEntry: "Inspect Resource Monitor",
      systemResult: "Resource Monitor shows sustained memory pressure and substantial hard-fault activity.\n\nDisk activity includes frequent access to the Windows paging file.\n\nDuring a controlled observation of normal synchronization activity, CompanySync.exe continues consuming additional memory.",
      technicalOutput: `Resource Monitor — Memory

Process: CompanySync.exe
- Private (KB): Approximately 5,632,000 (5,500 MB)
- Working Set (KB): Approximately 5,734,400 (5,600 MB)
- Hard faults/sec: 120
System-wide hard faults/sec: Approximately 180

Resource Monitor — Disk Activity

Image: System
File: C:\\pagefile.sys
- Read activity: Approximately 8,400,000 B/sec
- Write activity: Approximately 3,200,000 B/sec

Technician observation — CompanySync.exe private memory

Normal synchronization workload:

Observation time | Private memory (converted to MB)
Start | 5,500 MB
After 2 minutes | 5,750 MB
After 5 minutes | 6,100 MB

The observation table represents technician-recorded measurements, not a native Resource Monitor historical report.`,
      evidence: { id: "computer-slow-resource-monitor", text: "Resource Monitor shows memory pressure, hard faults, paging-file activity, and CompanySync.exe private memory increasing from 5,500 MB to 6,100 MB over five minutes." },
    },
    {
      command: "review_application_support_information",
      preview: "Review the installed application version and approved support information.",
      technicianEntry: "Review application support information",
      systemResult: "The installed Company Sync Tool version is 2.4.1.\n\nThe organization's IT Knowledge Base contains a documented memory leak affecting this version during synchronization activity.\n\nVersion 2.4.2 contains the corrective update and is approved for installation on managed workstations.",
      technicalOutput: `Company Sync Tool — About

Installed version: 2.4.1

IT Knowledge Base

Article: KB-206
Title: Company Sync Tool Memory Leak
Affected version: 2.4.1

Documented symptoms:

- Increasing process memory consumption during synchronization.
- Reduced available physical memory.
- Increased paging activity.
- Reduced workstation responsiveness.
- Temporary improvement following application or workstation restart.

Documented cause:

Version 2.4.1 fails to release certain memory allocations during repeated synchronization operations.

Corrected version: 2.4.2
Approved installation source: Managed Software Repository
Installation authorization: Level 1 Desktop Support
Installation requirement: Close Company Sync Tool before installing the update.`,
      evidence: { id: "computer-slow-known-issue", text: "KB-206 documents a Company Sync Tool 2.4.1 memory leak, approves version 2.4.2 through the Managed Software Repository, and authorizes Level 1 installation after closing the application." },
    },
    {
      command: "safely_close_application",
      preview: "Safely close Company Sync Tool after synchronization completes and employee authorization.",
      technicianEntry: "Safely close application",
      systemResult: "Company Sync Tool is inspected before closure.\n\nThe current synchronization operation completes.\n\nThe employee confirms that no unsaved work will be affected and authorizes application closure.\n\nCompany Sync Tool exits successfully.",
      technicalOutput: `Company Sync Tool
Synchronization status: Complete
Pending operations: None
Employee authorization: Confirmed
Application status: Closed

Task Manager — Processes
CompanySync.exe: Not running`,
      evidence: { id: "computer-slow-app-closed", text: "Synchronization completed, no pending operations remained, the employee authorized closure, and CompanySync.exe stopped running." },
    },
    {
      command: "install_software_update",
      preview: "Install the authorized Company Sync Tool 2.4.2 update.",
      technicianEntry: "Install approved application update",
      systemResult: "The approved Company Sync Tool version 2.4.2 installer is obtained from the organization's managed software repository.\n\nThe installation completes successfully.\n\nThe installer reports that no workstation restart is required.",
      technicalOutput: `Managed Software Repository
Package: Company Sync Tool 2.4.2
Approval status: Authorized

Installation Results

Previous version: 2.4.1
Target version: 2.4.2
Installation status: Successful
Restart required: No`,
      evidence: { id: "computer-slow-update-installed", text: "Authorized Company Sync Tool 2.4.2 installed successfully; no workstation restart was required." },
    },
    {
      command: "check_software_version",
      preview: "Launch the updated application and verify its installed version.",
      technicianEntry: "Verify updated application",
      systemResult: "Company Sync Tool launches successfully.\n\nThe application's About information confirms that version 2.4.2 is installed.\n\nThe application initializes and its synchronization functionality becomes available.",
      technicalOutput: `Company Sync Tool — About
Application: Company Sync Tool
Installed version: 2.4.2
Application status: Running
Synchronization functionality: Available`,
      evidence: { id: "computer-slow-updated-app-verified", text: "Company Sync Tool launched successfully, reports version 2.4.2, and has synchronization functionality available." },
    },
    {
      command: "verify_system_resource_utilization",
      preview: "Repeat the equivalent synchronization workload and verify system resources.",
      technicianEntry: "Verify system resource utilization",
      systemResult: "The original synchronization workload is repeated.\n\nThe workstation maintains substantially more available physical memory, and disk active time remains reduced.\n\nCompanySync.exe does not demonstrate the previous abnormal memory growth during the equivalent five-minute observation period.",
      technicalOutput: `Task Manager — Performance

CPU
- Utilization: 12%
Memory
- Installed: 8.0 GB
- In use: 3.3 GB
- Available: 4.5 GB
- Utilization: 42%
Disk 0 (C:)
- Type: SSD
- Active time: 8%
GPU 0
- Utilization: 5%

Task Manager — Processes

Company Sync Tool
- CPU: 3%
- Memory: Approximately 290 MB

Resource Monitor — Memory

Process: CompanySync.exe
- Private (KB): Approximately 266,240 (260 MB)
- Working Set (KB): Approximately 296,960 (290 MB)
- Hard faults/sec: 0
System-wide hard faults/sec: Approximately 2

Resource Monitor — Disk Activity

Image: System
File: C:\\pagefile.sys
- Read activity: 0 B/sec during sampled interval
- Write activity: Approximately 16,384 B/sec

Technician observation — CompanySync.exe private memory

Equivalent synchronization workload:

Observation time | Private memory (converted to MB)
Start | 250 MB
After 2 minutes | 265 MB
After 5 minutes | 260 MB

Before-and-after comparison

Measurement | Before update | After update
Memory utilization | 96% | 42%
Available memory | 0.3 GB | 4.5 GB
Disk active time | 100% | 8%
Process private memory growth over 5 minutes | +600 MB | +10 MB
System hard faults/sec | 180 | 2

These values are simulated observations under the scenario's specified workload.`,
      evidence: { id: "computer-slow-resources-verified", text: "Under an equivalent workload, memory utilization decreased to 42%, available memory rose to 4.5 GB, disk active time fell to 8%, process memory remained stable, and hard faults fell to 2/sec." },
    },
    {
      command: "test_performance",
      preview: "Repeat the original workstation checks and confirm resolution with the employee.",
      technicianEntry: "Test workstation performance",
        systemResult: "The technician repeats the original workstation performance checks.\n\nApplication switching and File Explorer responsiveness remain normal during the employee's usual activity.\n\nCompany Sync Tool completes its normal synchronization workload.\n\nThe employee confirms that the original performance problem is no longer occurring.\n\nEmployee: \"Everything is responding normally again. I can switch between my applications without waiting, and the freezing hasn't come back.\"",
      technicalOutput: `Functional Verification

Application switching: Normal
File Explorer responsiveness: Normal
Company Sync Tool synchronization: Successful
Intermittent freezing: Not reproduced
Employee confirmation: Received
Resolution status: Verified`,
      evidence: { id: "computer-slow-resolution-confirmed", text: "Normal application switching and File Explorer responsiveness verified; synchronization succeeded; employee confirmed the original symptoms were resolved." },
    },
  ],
  completion: {
    command: "test_performance",
    fact: "user_confirmation_received",
  },
  proofLines: [
    "Verified employee identity and support authorization",
    "Reproduced the reported workstation performance problem",
    "Observed temporary improvement after restart and recurrence during normal activity",
    "Confirmed adequate free storage and identified memory pressure and paging activity",
    "Matched the installed Company Sync Tool version with documented KB-206 symptoms",
    "Closed the application safely and installed the authorized corrective update",
    "Verified the updated application and improved resource utilization under comparable workload",
    "Confirmed normal workstation functionality with the employee",
  ],
  successLines: [
    "The Company Sync Tool memory leak was corrected and workstation performance was verified.",
    "The employee confirms normal application switching and workstation responsiveness.",
  ],
  defaults: {
    kind: "computer_running_slowly_memory_leak",
    identity_verified: false,
    initial_performance_check_completed: false,
    restart_authorized: false,
    workstation_restarted: false,
    post_restart_performance_check_completed: false,
    symptoms_recurred: false,
    disk_space_checked: false,
    task_manager_inspected: false,
    resource_pressure_observed: false,
    resource_monitor_inspected: false,
    paging_activity_observed: false,
    baseline_memory_growth_observed: false,
    support_information_reviewed: false,
    documented_memory_leak_confirmed: false,
    update_authorized: false,
    sync_tool_running: true,
    application_safely_closed: false,
    software_update_installed: false,
    updated_application_verified: false,
    post_update_resources_verified: false,
    memory_growth_not_reproduced: false,
    final_performance_verified: false,
    user_confirmation_received: false,
    sync_tool_version: "2.4.1",
  },
  previewMetadata: {
    level: "Beginner",
    estimatedTime: "8–12 min",
    description: "Challenging beginner — Level 1 troubleshooting for recurring Windows workstation performance problems.",
    skillFocus: ["Performance Troubleshooting", "Resource Interpretation", "Evidence-Based Verification"],
    scenarioContext: "An employee's workstation remains operational but is unusually slow and intermittently freezes.",
    successOutcome: "The employee can complete usual workstation activities with normal responsiveness.",
    selectCommand: "select computer running slowly memory leak",
  },
},

browser_running_slow: {
  label: "Browser Running Slow",
  startPrompt: `Customer: My web browser has become painfully slow.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "device_performance",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting browser performance.",
    },
    {
      command: "check_browser_cache",
      preview:
        "Check the browser cache for accumulated temporary web data that may be affecting performance.",
    },
    {
      command: "clear_browser_cache",
      preview:
        "Clear the browser cache to remove accumulated temporary web data.",
    },
    {
      command: "test_browser_performance",
      preview:
        "Test browser performance to confirm normal responsiveness has been restored.",
    },
  ],

  completion: {
    command: "test_browser_performance",
    fact: "browser_performance_ok",
  },

  successLines: [
    "Agent: Browser performance has been restored and verified.",
    "System: Browser responsiveness has returned to normal after clearing accumulated cached data.",
    "Customer: Great, it’s much faster now.",
  ],

  proofLines: [
    "Verified the user before troubleshooting browser performance",
    "Checked the browser cache for accumulated temporary web data",
    "Cleared the browser cache to reduce unnecessary cached data",
    "Validated normal browser responsiveness",
  ],

  defaults: {
    kind: "browser_running_slow",
    identity_verified: false,
    browser_cache_checked: false,
    browser_cache_cleared: false,
    browser_performance_ok: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "3–5 min",
    description:
      "Restore browser performance by checking and clearing accumulated browser cache data.",
    skillFocus: [
      "Browser Troubleshooting",
      "Cache Management",
      "Operational Verification",
    ],
    scenarioContext:
      "A user's web browser has become slow because accumulated cached web data is affecting browser performance.",
    successOutcome:
      "The browser cache is cleared and normal browser responsiveness is restored.",
    selectCommand:
      "select browser running slow",
  },
},

  browser_running_slow_extension: {
  label: "Browser Slow — Extension",

  startPrompt: `Customer: My browser has become extremely slow. I already closed it and opened it again, but it is still running badly.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "device_performance",

  procedure: [
  {
    command: "verify_identity",
    preview:
      "Verify the user's identity before troubleshooting browser performance.",
  },
  {
    command: "check_browser_cache",
    preview:
      "Check the browser cache as part of normal browser performance troubleshooting.",
  },
  {
    command: "clear_browser_cache",
    preview:
      "Clear accumulated browser cache data before testing performance.",
  },
  {
    command: "test_browser_performance",
    preview:
      "Test browser performance to determine whether normal cache troubleshooting resolved the slowdown.",
  },
    {
      command: "check_browser_extensions",
      preview:
        "Check installed browser extensions after the restart fails to restore performance.",
    },
    {
      command: "disable_unnecessary_extensions",
      preview:
        "Disable the extension causing excessive browser resource usage.",
    },
    {
      command: "test_browser_performance",
      preview:
        "Test browser performance again to confirm normal responsiveness has been restored.",
    },
  ],

  completion: {
    command: "test_browser_performance",
    fact: "browser_performance_ok",
  },

  proofLines: [
    "Verified the user before troubleshooting browser performance",
    "Restarted the browser to rule out a temporary process issue",
    "Confirmed browser performance remained degraded after the restart",
    "Identified an unnecessary extension causing excessive resource usage",
    "Disabled the problematic browser extension",
    "Returned to the original issue and verified normal browser responsiveness",
  ],

  successLines: [
    "Agent: The problematic browser extension has been disabled and browser performance has been verified.",
    "System: Restarting the browser did not resolve the issue because an extension was consuming excessive resources.",
    "Customer: Great, the browser is running normally again.",
  ],

defaults: {
  kind: "browser_running_slow_extension",
  identity_verified: false,
  browser_cache_checked: false,
  browser_cache_cleared: false,
  browser_performance_tested_after_cache: false,
  browser_extensions_checked: false,
  unnecessary_extensions_disabled: false,
  browser_performance_ok: false,
},

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Resolve browser slowness that continues after a restart by identifying and disabling a problematic extension.",
    skillFocus: [
      "Browser Troubleshooting",
      "Extension Management",
      "Dependency Awareness",
    ],
    scenarioContext:
      "A user's browser remains slow after being restarted because an installed extension is consuming excessive resources.",
    successOutcome:
      "The problematic extension is disabled and normal browser performance is restored.",
    selectCommand:
      "select browser running slow extension",
  },
},

network_printer_not_printing: {
  label: "Network Printer Not Printing",
  startPrompt: `Customer: I'm trying to print a document to the office printer, but nothing is coming out. Windows is showing the printer as offline.

What is your first troubleshooting step?`,
  scenarioType: "standard",
  category: "hardware_peripherals",
  procedure: [
    { command: "verify_identity", preview: "Verify user identity.", technicianEntry: "verify_identity", systemResult: "The user's identity has been successfully verified.", technicalOutput: "Identity Verification: Successful\nUser Status: Verified" },
    { command: "test_printing", preview: "Test printing.", technicianEntry: "test_printing", systemResult: "A document was submitted to the Office Printer. The document did not print.", technicalOutput: "Printer: Office Printer\nDocument: Test Document\nPrint Request: Submitted\nPhysical Print Output: Not produced", evidence: { id: "printer-test-request-no-output", text: "Print request submitted; no physical output produced." } },
    { command: "check_printer_physical_status", preview: "Check printer physical status.", technicianEntry: "check_printer_physical_status", systemResult: "The printer is powered on. The Ethernet cable is securely connected, and the network link indicator is active.", technicalOutput: "Power: On\nEthernet: Connected\nNetwork Link: Active", evidence: { id: "printer-physical-link-active", text: "The printer is powered on with Ethernet connected and an active network link." } },
    { command: "check_printer_status", preview: "Check printer status.", technicianEntry: "check_printer_status", systemResult: "Windows reports that the Office Printer is offline.", technicalOutput: "Printer: Office Printer\nStatus: Offline", evidence: { id: "printer-status-offline", text: "Windows reports Office Printer as offline." } },
    { command: "check_print_queue", preview: "Check Print Queue", technicianEntry: "check_print_queue", systemResult: "The submitted document remains in the print queue and has not printed.", technicalOutput: "Printer: Office Printer\nDocument: Test Document\nStatus: Error - Printing\nPending Jobs: 1", evidence: { id: "printer-incomplete-job-before-repair", text: "The submitted document remains queued with Error - Printing status." } },
    { command: "check_printer_network_configuration", preview: "Check printer network configuration.", technicianEntry: "check_printer_network_configuration", systemResult: "The printer's current network configuration has been retrieved.", technicalOutput: "Connection Type: Ethernet\nIPv4 Address: 192.168.1.60\nSubnet Mask: 255.255.255.0\nDefault Gateway: 192.168.1.1", evidence: { id: "printer-actual-network-configuration", text: "The printer reports IPv4 address 192.168.1.60, subnet mask 255.255.255.0, and default gateway 192.168.1.1." } },
    { command: "check_printer_port", preview: "Check Windows printer port.", technicianEntry: "check_printer_port", systemResult: "The Windows printer port is configured with an IP address that does not match the printer's current IP address.", technicalOutput: "Printer: Office Printer\nPort Type: Standard TCP/IP Port\nConfigured IP Address: 192.168.1.50\nActual Printer IP Address: 192.168.1.60\nConfiguration Match: No", evidence: { id: "printer-port-address-mismatch", text: "Windows printer port is configured for 192.168.1.50, but the printer reports 192.168.1.60." } },
    { command: "open_command_prompt", preview: "Open Command Prompt.", technicianEntry: "open_command_prompt", systemResult: "Windows Command Prompt has been opened.", technicalOutput: "Microsoft Windows [Version 10.0.26100.1]\n(c) Microsoft Corporation. All rights reserved.\n\nC:\\Users\\Technician>" },
    { command: "ping_printer", preview: "ping 192.168.1.60", technicianEntry: "ping 192.168.1.60", systemResult: "The printer responds successfully to the connectivity test.", technicalOutput: "C:\\Users\\Technician>ping 192.168.1.60\n\nPinging 192.168.1.60 with 32 bytes of data:\nReply from 192.168.1.60: bytes=32 time=1ms TTL=64\nReply from 192.168.1.60: bytes=32 time=1ms TTL=64\nReply from 192.168.1.60: bytes=32 time=2ms TTL=64\nReply from 192.168.1.60: bytes=32 time=1ms TTL=64\n\nPing statistics for 192.168.1.60:\n    Packets: Sent = 4, Received = 4, Lost = 0\n    (0% loss),\n\nApproximate round trip times in milli-seconds:\n    Minimum = 1ms, Maximum = 2ms, Average = 1ms", evidence: { id: "printer-actual-ip-ping-success", text: "192.168.1.60 responded to all four ICMP Echo Requests with 0% packet loss." } },
    { command: "correct_printer_port_configuration", preview: "Correct printer port configuration.", technicianEntry: "correct_printer_port_configuration", systemResult: "The Windows printer port has been updated to match the printer's actual IP address.", technicalOutput: "Previous IP Address: 192.168.1.50\nUpdated IP Address: 192.168.1.60\nConfiguration Match: Yes", evidence: { id: "printer-port-configuration-corrected", text: "The Windows printer port was corrected from 192.168.1.50 to match the printer's actual address 192.168.1.60." } },
    { command: "check_print_queue", preview: "Check Print Queue", technicianEntry: "check_print_queue", systemResult: "The previously queued document has printed successfully. No pending print jobs remain.", technicalOutput: "Printer: Office Printer\nPending Jobs: 0\nPreviously Queued Document: Test Document\nPhysical Print Output: Confirmed", evidence: { id: "printer-queued-document-printed-no-jobs", text: "The previously queued document printed successfully and no pending print jobs remain." } },
    { command: "print_test_page", preview: "Print test page.", technicianEntry: "print_test_page", systemResult: "The Windows printer test page has printed successfully.", technicalOutput: "Printer: Office Printer\nTest Page: Printed Successfully", evidence: { id: "printer-windows-test-page-success", text: "The Windows printer test page printed successfully." } },
    { command: "confirm_user_resolution", preview: "Confirm User Resolution", technicianEntry: "confirm_user_resolution", systemResult: "The user confirms that documents are printing successfully.", technicalOutput: "User Response: \"It's working now. My document printed. Thank you.\"", evidence: { id: "printer-user-resolution-confirmed", text: "The user confirmed that the document printed and the original issue is resolved." } },
  ],
  completion: { command: "confirm_user_resolution", fact: "user_resolution_confirmed" },
  proofLines: [
    "Verified the user before troubleshooting printing",
    "Reproduced the original printing problem",
    "Confirmed the printer was powered on with an active Ethernet link",
    "Confirmed Windows reported the Office Printer as offline",
    "Confirmed the submitted document remained queued with an error",
    "Retrieved the printer's actual IPv4 address from its network configuration",
    "Identified that the Windows printer port address did not match the printer",
    "Confirmed the printer's actual IPv4 address responded to ping",
    "Corrected the Windows printer port and verified successful printing",
    "Confirmed the user can print documents successfully",
  ],
  successLines: [
    "The Windows printer port was corrected to match the printer's actual IPv4 address.",
    "The previously queued document and a Windows test page printed successfully.",
    "Customer: \"It's working now. My document printed. Thank you.\"",
  ],
  defaults: {
    kind: "network_printer_not_printing",
    identity_verified: false,
    printing_tested: false,
    printer_physical_status_checked: false,
    printer_status_checked: false,
    print_queue_checked: false,
    printer_network_configuration_checked: false,
    printer_port_checked: false,
    command_prompt_opened: false,
    printer_ping_succeeded: false,
    printer_port_configuration_corrected: false,
    queued_document_printed: false,
    windows_test_page_printed: false,
    user_resolution_confirmed: false,
    printer_offline: true,
    printer_ethernet_connected: true,
    printer_network_link_active: true,
    printer_port_address: "192.168.1.50",
    printer_ipv4_address: "192.168.1.60",
  },
  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–8 min",
    description: "Diagnose a network printer issue by checking printer status, queued jobs, network configuration, and the Windows printer port.",
    skillFocus: ["Printer Troubleshooting", "Network Connectivity", "TCP/IP Port Configuration"],
    scenarioContext: "A user reports that Windows shows the Office Printer as offline and submitted documents are not printing.",
    successOutcome: "Printing is restored and the user confirms the original problem is resolved.",
    selectCommand: "select network printer not printing",
  },
},

printer_not_working: {
  label: "Printer Not Working",
  startPrompt: `Customer: I’m trying to print something, but the printer isn’t working.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "hardware_peripherals",

  procedure: [
    { command: "verify_identity", preview: "Verify the user's identity before troubleshooting the printer." },
    { command: "check_printer_status", preview: "Check printer status to identify why it is not printing." },
    { command: "restart_printer", preview: "Restart the printer so it can reconnect properly." },
    { command: "print_test_page", preview: "Print a test page to confirm the printer works." },
  ],
  completion: { command: "print_test_page", fact: "printer_working" },

  proofLines: [
    "Verified the user before troubleshooting printer access",
    "Confirmed the printer was unavailable",
    "Restored printer availability",
    "Validated printing with a successful test page",
  ],

  successLines: [
    "Agent: Printer functionality has been restored and verified.",
    "System: The printer can successfully process print jobs.",
    "Customer: Great, it printed.",
  ],

    defaults: {
      kind: "printer_not_working",
      identity_verified: false,
      printer_checked: false,
      printer_restarted: false,
      printer_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore printing by restarting the printer and verifying operation.",
      skillFocus: [
        "Printer Troubleshooting",
        "Hardware Recovery",
        "Operational Verification",
      ],
      scenarioContext:
        "A user cannot print because the office printer is not responding.",
      successOutcome:
        "The printer is restored and a successful test page is printed.",
      selectCommand:
        "select printer not working",
    },
  },

printer_wrong_default_printer: {
  label: "Printer Not Working — Wrong Default Printer",
  startPrompt: `Customer: I’m sending documents to print, but nothing is coming out of the office printer.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "hardware_peripherals",

  procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before troubleshooting printer settings.",
    },
    {
      command: "check_printer_status",
      preview:
        "Check the printer status to confirm the office printer is available.",
    },
    {
      command: "check_default_printer",
      preview:
        "Check which printer is currently selected as the default printer.",
    },
    {
      command: "set_default_printer",
      preview:
        "Set the correct office printer as the default printer.",
    },
    {
      command: "print_test_page",
      preview:
        "Print a test page to confirm jobs are sent to the correct printer.",
    },
  ],

  completion: {
    command: "print_test_page",
    fact: "printer_working",
  },

  proofLines: [
    "Verified the user before changing printer settings",
    "Confirmed the office printer was available",
    "Identified that the wrong printer was selected as the default",
    "Set the correct office printer as the default printer",
    "Validated printing with a successful test page",
  ],

  successLines: [
    "Agent: The correct default printer has been selected and printing has been verified.",
    "System: Print jobs are now being sent to the correct office printer.",
    "Customer: Great, it printed from the right printer.",
  ],

  defaults: {
    kind: "printer_wrong_default_printer",
    identity_verified: false,
    printer_checked: false,
    default_printer_checked: false,
    correct_default_printer_set: false,
    printer_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Resolve a printer issue caused by the wrong default printer being selected.",
    skillFocus: [
      "Printer Troubleshooting",
      "Printer Configuration",
      "Dependency Awareness",
    ],
    scenarioContext:
      "A user reports that documents are not printing because jobs are being sent to the wrong printer.",
    successOutcome:
      "The correct default printer is selected and printing is successfully verified.",
    selectCommand:
      "select printer_wrong_default_printer",
  },
},

mouse_keyboard_not_working: {
  label: "Mouse and Keyboard Not Working",
  startPrompt: `Customer: My mouse and keyboard are not working.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "hardware_peripherals",

    procedure: [
      { command: "verify_identity", preview: "Verify the user's identity before troubleshooting input devices." },
      { command: "check_device_connection", preview: "Check the device connection to identify why the mouse and keyboard are not responding." },
      { command: "reconnect_device", preview: "Reconnect the input devices so the computer can detect them." },
      { command: "test_input_device", preview: "Test the input devices to confirm they respond normally." },
    ],
    completion: { command: "test_input_device", fact: "input_device_working" },

proofLines: [
  "Verified the user before troubleshooting input devices",
  "Confirmed the input devices were not responding",
  "Restored mouse and keyboard connectivity",
  "Validated input devices were responding normally",
],


successLines: [
  "Agent: Input device functionality has been restored and verified.",
  "System: The mouse and keyboard are responding normally.",
  "Customer: Great, they’re working now.",
],

    defaults: {
      kind: "mouse_keyboard_not_working",
      identity_verified: false,
      device_connection_checked: false,
      device_reconnected: false,
      input_device_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore input device functionality by reconnecting the mouse and keyboard.",
      skillFocus: [
        "Input Device Troubleshooting",
        "Hardware Connectivity",
        "Operational Verification",
      ],
      scenarioContext:
        "A user's mouse and keyboard are no longer responding.",
      successOutcome:
        "The input devices reconnect successfully and normal operation is verified.",
      selectCommand:
        "select mouse keyboard not working",
    },
  },

microphone_not_working: {
  label: "Microphone Not Working",
  startPrompt: `Customer: My microphone is not working during calls.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "hardware_peripherals",

    procedure: [
      { command: "verify_identity", preview: "Verify the user's identity before troubleshooting the microphone." },
      { command: "check_microphone_settings", preview: "Check microphone settings to identify why audio is not being captured." },
      { command: "enable_microphone", preview: "Enable the microphone so the device can capture audio." },
      { command: "test_microphone", preview: "Test the microphone to confirm audio is working." },
    ],
    completion: { command: "test_microphone", fact: "microphone_working" },

proofLines: [
  "Verified the user before troubleshooting microphone functionality",
  "Confirmed microphone settings were preventing audio capture",
  "Restored microphone functionality",
  "Validated successful audio input",
],

successLines: [
  "Agent: Microphone functionality has been restored and verified.",
  "System: Audio input is being captured normally.",
  "Customer: Great, they can hear me now.",
],

    defaults: {
      kind: "microphone_not_working",
      identity_verified: false,
      microphone_settings_checked: false,
      microphone_enabled: false,
      microphone_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore microphone functionality by correcting microphone settings.",
      skillFocus: [
        "Audio Troubleshooting",
        "Device Configuration",
        "Operational Verification",
      ],
      scenarioContext:
        "A user's microphone is not capturing audio during calls.",
      successOutcome:
        "The microphone is enabled and audio capture is successfully verified.",
      selectCommand:
        "select microphone not working",
    },
  },

  microphone_wrong_recording_device: {
  label: "Microphone — Wrong Recording Device",

  startPrompt: `Customer: My microphone is turned on, but nobody can hear me during calls.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "hardware_peripherals",

  procedure: [
    {
      command: "check_microphone_settings",
      preview:
        "Check the microphone settings to confirm the microphone is enabled and available.",
    },
    {
      command: "test_microphone",
      preview:
        "Test the microphone to reproduce the audio-input failure before changing the recording device.",
    },
    {
      command: "check_recording_device",
      preview:
        "Check which recording device is currently selected after the microphone test fails.",
    },
    {
      command: "select_recording_device",
      preview:
        "Select the intended microphone as the active recording device.",
    },
    {
      command: "test_microphone",
      preview:
        "Test the microphone again to confirm audio input works through the selected recording device.",
    },
  ],

  completion: {
    command: "test_microphone",
    fact: "microphone_working",
  },

  proofLines: [
    "Confirmed the microphone was enabled and available",
    "Reproduced the audio-input failure before changing the recording device",
    "Identified that the wrong recording device was selected",
    "Selected the intended microphone as the active recording device",
    "Verified successful audio input through the correct microphone",
  ],

  successLines: [
    "Agent: The correct recording device has been selected and microphone input has been verified.",
    "System: Audio is now being captured through the intended microphone.",
    "Customer: Great, they can hear me now.",
  ],

  defaults: {
    kind: "microphone_wrong_recording_device",
    microphone_settings_checked: false,
    first_microphone_tested: false,
    recording_device_checked: false,
    correct_recording_device_selected: false,
    microphone_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Restore microphone input by identifying and correcting the selected recording device.",
    skillFocus: [
      "Microphone Troubleshooting",
      "Recording Device Selection",
      "Problem Reproduction",
      "Operational Verification",
    ],
    scenarioContext:
      "The microphone is enabled, but the computer is using the wrong recording device during calls.",
    successOutcome:
      "The intended microphone is selected and successful audio input is verified.",
    selectCommand:
      "select microphone wrong recording device",
  },
},

webcam_not_working: {
  label: "Webcam Not Working",
  startPrompt: `Customer: My webcam is not working during video calls.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "hardware_peripherals",

    procedure: [
      { command: "verify_identity", preview: "Verify the user's identity before troubleshooting the webcam." },
      { command: "check_webcam_settings", preview: "Check webcam settings to identify why video is not appearing." },
      { command: "enable_webcam", preview: "Enable the webcam so the device can display video." },
      { command: "test_webcam", preview: "Test the webcam to confirm video is working." },
    ],
    completion: { command: "test_webcam", fact: "webcam_working" },

proofLines: [
  "Verified the user before troubleshooting webcam functionality",
  "Confirmed webcam settings were preventing video capture",
  "Restored webcam functionality",
  "Validated successful video input",
],

successLines: [
  "Agent: Webcam functionality has been restored and verified.",
  "System: Video input is operating normally.",
  "Customer: Great, it's working now.",
],

    defaults: {
      kind: "webcam_not_working",
      identity_verified: false,
      webcam_settings_checked: false,
      webcam_enabled: false,
      webcam_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore webcam functionality by correcting webcam settings.",
      skillFocus: [
        "Video Device Troubleshooting",
        "Device Configuration",
        "Operational Verification",
      ],
      scenarioContext:
        "A user's webcam is not working during video meetings.",
      successOutcome:
        "The webcam is enabled and video functionality is successfully verified.",
      selectCommand:
        "select webcam not working",
    },
  },

second_monitor_not_detected: {
  label: "Second Monitor Not Detected",
  startPrompt: `Customer: My second monitor is not being detected.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "hardware_peripherals",

    procedure: [
      { command: "verify_identity", preview: "Verify the user's identity before troubleshooting the display setup." },
      { command: "check_display_connection", preview: "Check the display connection to confirm the monitor is physically connected." },
      { command: "check_display_settings", preview: "Check display settings to identify why the second monitor is not detected." },
      { command: "detect_second_monitor", preview: "Detect the second monitor so the computer can recognize it." },
      { command: "test_dual_display", preview: "Test dual display to confirm both screens work." },
    ],
    completion: { command: "test_dual_display", fact: "dual_display_working" },

proofLines: [
  "Verified the user before troubleshooting the display configuration",
  "Confirmed the second monitor was not detected",
  "Restored dual-display functionality",
  "Validated both displays were operating normally",
],

    successLines: [
      "Agent: The second monitor has been detected and functionality has been verified.",
      "System: Both displays are operating correctly.",
      "Customer: Great, both screens are working now.",
    ],

    defaults: {
      kind: "second_monitor_not_detected",
      identity_verified: false,
      display_connection_checked: false,
      display_settings_checked: false,
      second_monitor_detected: false,
      dual_display_working: false,
    },

    previewMetadata: {
      level: "Beginner",
      estimatedTime: "3–5 min",
      description:
        "Restore dual-display functionality by detecting the second monitor.",
      skillFocus: [
        "Display Troubleshooting",
        "Monitor Configuration",
        "Operational Verification",
      ],
      scenarioContext:
        "A user's second monitor is connected but is not being detected by the computer.",
      successOutcome:
        "The second monitor is detected and dual-display functionality is verified.",
      selectCommand:
        "select second monitor not detected",
    },
  },

  second_monitor_display_disabled: {
  label: "Second Monitor — Display Disabled",

  startPrompt: `Customer: My second monitor is connected and shows up in the display settings, but the screen stays blank.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "hardware_peripherals",

  procedure: [
    {
      command: "check_display_connection",
      preview:
        "Check the display cable, power, and physical connection to confirm the second monitor is connected correctly.",
    },
    {
      command: "check_display_settings",
      preview:
        "Check display settings to confirm the connected monitor appears in the operating system.",
    },
    {
      command: "detect_second_monitor",
      preview:
        "Detect the second monitor so the operating system fully registers the connected display.",
    },
    {
      command: "test_dual_display",
      preview:
        "Test the dual-display setup to confirm whether the detected monitor is actually active.",
    },
    {
      command: "check_display_enabled_status",
      preview:
        "Check whether the detected second display is enabled after the initial dual-display test fails.",
    },
    {
      command: "enable_second_display",
      preview:
        "Enable the second display so the operating system can send an active desktop signal to it.",
    },
    {
      command: "test_dual_display",
      preview:
        "Test the dual-display setup again to confirm both monitors are active and displaying correctly.",
    },
  ],

  completion: {
    command: "test_dual_display",
    fact: "dual_display_working",
  },

  proofLines: [
    "Confirmed the second monitor was securely connected and receiving power",
    "Confirmed the operating system recognized the connected monitor",
    "Detected the second monitor successfully",
    "Tested the dual-display setup and confirmed the detected monitor remained inactive",
    "Identified that the second display was disabled in the display configuration",
    "Enabled the second display",
    "Verified both monitors were active and displaying correctly",
  ],

  successLines: [
    "Agent: The disabled second display has been enabled and dual-display functionality has been verified.",
    "System: Both monitors are active and the desktop extends successfully across both displays.",
    "Customer: Great, both screens are working now.",
  ],

  defaults: {
    kind: "second_monitor_display_disabled",
    display_connection_checked: false,
    display_settings_checked: false,
    second_monitor_detected: false,
    first_dual_display_tested: false,
    display_enabled_status_checked: false,
    second_display_enabled: false,
    dual_display_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Restore a detected but inactive second monitor by identifying and enabling a disabled display configuration.",
    skillFocus: [
      "Display Troubleshooting",
      "Monitor Configuration",
      "Problem Reproduction",
      "Operational Verification",
    ],
    scenarioContext:
      "A second monitor is securely connected and detected by the operating system, but the screen remains blank because the display is disabled.",
    successOutcome:
      "The disabled display is identified, enabled, and verified through a successful dual-display test.",
    selectCommand:
      "select second monitor display disabled",
  },
},

second_monitor_display_adapter_code_43: {
  label: "Second Monitor — Display Adapter Code 43",

  startPrompt: `Customer: My second monitor stopped working. It worked before, but now I'm not getting anything on it.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "hardware_peripherals",

  procedure: [
    {
      command: "check_display_connection",
      preview:
        "Check the second monitor's physical connection, display cable, and power connection.",
      evidence: {
        id: "display_connection_confirmed",
        text: "Monitor has power and a secure physical connection.",
      },
    },
    {
      command: "check_display_configuration",
      preview:
        "Check the current Windows display configuration.",
      evidence: {
        id: "multiple_displays_configured",
        text: "Windows is configured for multiple displays.",
      },
    },
    {
      command: "detect_displays",
      preview:
        "Ask Windows to detect connected displays again.",
      evidence: {
        id: "second_display_not_detected",
        text: "Windows cannot detect the second monitor.",
      },
    },
    {
      command: "isolate_display_hardware",
      preview:
        "Isolate the monitor and connection hardware to determine whether the display itself is causing the failure.",
      evidence: {
        id: "display_hardware_known_good",
        text: "Monitor functions with a known-good workstation and connection.",
      },
    },
    {
      command: "reset_graphics_driver",
      preview:
        "Reset the Windows graphics driver to see whether the display subsystem recovers.",
    },
    {
      command: "restart_workstation",
      preview:
        "Restart the workstation to reinitialize Windows and the display hardware.",
    },
    {
      command: "detect_displays",
      preview:
        "Run display detection again after the restart.",
    },
    {
      command: "inspect_display_adapter",
      preview:
        "Inspect the display adapter in Device Manager for a device or driver problem.",
      evidence: {
        id: "display_adapter_warning",
        text: "Display adapter shows a warning in Device Manager.",
      },
    },
    {
      command: "inspect_device_status",
      preview:
        "Inspect the display adapter's device status for details about the warning.",
      evidence: {
        id: "display_adapter_code_43",
        text: "Display adapter reports Code 43.",
      },
    },
    {
      command: "update_display_driver",
      preview:
        "Update the display adapter using the approved driver available for the workstation.",
    },
    {
      command: "inspect_device_status",
      preview:
        "Check the display adapter's device status again after the driver update.",
      evidence: {
        id: "code_43_persists_after_driver_update",
        text: "Code 43 persists after the approved driver update.",
      },
    },
    {
      command: "reinstall_display_driver",
      preview:
        "Reinstall the approved display driver to replace the current driver installation and reinitialize the adapter.",
    },
    {
      command: "inspect_device_status",
      preview:
        "Check the display adapter's device status after the driver reinstall.",
      evidence: {
        id: "code_43_persists_after_driver_reinstall",
        text: "Code 43 persists after the approved driver reinstall.",
      },
    },
    {
      command: "escalate_display_issue",
      preview:
        "Document the troubleshooting evidence and escalate the unresolved display issue.",
    },
  ],

  investigation: {
    relatedActions: {
      verify_identity: {
        agent:
          "I’ll verify your identity before continuing with the troubleshooting.",
        system:
          "The customer's identity is verified successfully.",
        customer:
          "Sure, that's me.",
        evidence: {
          id: "customer_identity_verified",
          text: "Customer identity has been verified.",
        },
      },

      check_primary_display: {
        agent:
          "I’m checking whether the primary display is working normally.",
        system:
          "The primary display is functioning normally and continues to show the Windows desktop.",
        evidence: {
          id: "primary_display_working",
          text: "Primary display is functioning normally.",
        },
      },

      check_monitor_input_source: {
        agent:
          "I’m checking the second monitor’s selected input source.",
        system:
          "The second monitor is set to the correct input source for the connected display cable.",
        evidence: {
          id: "monitor_input_source_correct",
          text: "Second monitor is set to the correct input source.",
        },
      },

      test_alternate_display_port: {
        agent:
          "I’m testing the second monitor through another available display output on the workstation.",
        system:
          "The second monitor still does not display through the alternate video output.",
        evidence: {
          id: "alternate_display_port_issue_persists",
          text: "Display issue persists through an alternate video output.",
        },
      },

      check_for_windows_updates: {
        agent:
          "I’m checking Windows Update for pending updates relevant to the display issue.",
        system:
          "No relevant pending Windows updates are available.",
        evidence: {
          id: "no_relevant_windows_updates",
          text: "No relevant Windows updates are pending.",
        },
      },
    },
  },

  completion: {
    command: "escalate_display_issue",
    fact: "display_issue_escalated",
  },

  proofLines: [
    "Confirmed the second monitor had power and a secure physical connection",
    "Confirmed Windows was configured for multiple displays but the second monitor was unavailable",
    "Confirmed Windows could not detect the second monitor",
    "Isolated the monitor and confirmed the display hardware functioned with a known-good workstation and connection",
    "Reset the graphics driver without restoring the second monitor",
    "Restarted the workstation and confirmed the display remained unavailable",
    "Confirmed display detection still failed after the restart",
    "Identified a warning on the display adapter in Device Manager",
    "Confirmed the display adapter reported Code 43",
    "Installed the approved display driver and confirmed Code 43 remained",
    "Reinstalled the approved display driver and confirmed Code 43 remained",
    "Escalated the unresolved display issue with the troubleshooting evidence documented",
  ],

  successLines: [
    "Agent: The monitor and physical connection have been isolated, Windows still cannot detect the display, and the display adapter continues to report Code 43 after approved driver remediation. I'm documenting the troubleshooting results and escalating the unresolved display issue.",
    "System: The ticket is escalated with the troubleshooting history documented, including successful monitor isolation, failed Windows display detection, persistent Code 43, and unsuccessful approved driver update and reinstallation.",
    "Customer: Okay, thank you.",
  ],

defaults: {
  kind: "second_monitor_display_adapter_code_43",
  display_connection_checked: false,
  display_configuration_checked: false,
  first_display_detection_attempted: false,
  display_hardware_isolated: false,
  graphics_driver_reset: false,
  workstation_restarted: false,
  second_display_detection_attempted: false,
  display_adapter_inspected: false,
  first_device_status_inspected: false,
  code_43_detected: false,
  display_driver_updated: false,
  second_device_status_inspected: false,
  display_driver_reinstalled: false,
  final_device_status_inspected: false,
  display_issue_escalated: false,
},

  previewMetadata: {
    level: "Intermediate",
    estimatedTime: "8–12 min",
    description:
      "Troubleshoot an undetected second monitor, identify a persistent display-adapter Code 43 error, perform approved L1 driver remediation, and escalate when the fault remains unresolved.",
    skillFocus: [
      "Display Troubleshooting",
      "Hardware Isolation",
      "Device Manager",
      "Driver Troubleshooting",
      "Escalation Judgment",
    ],
    scenarioContext:
      "A user's second monitor previously worked but is no longer detected by Windows. The monitor itself functions, but the workstation's display adapter reports a persistent Code 43 error.",
    successOutcome:
      "The technician isolates the display problem, identifies the persistent adapter error, performs approved L1 remediation, and escalates the unresolved issue with useful troubleshooting evidence.",
    selectCommand:
      "select second monitor display adapter code 43",
  },
},

audio_not_working: {
  label: "No Sound / Audio Not Working",
  startPrompt: `Customer: I can’t hear any sound from my computer.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "hardware_peripherals",

  procedure: [
  {
    command: "verify_identity",
    preview:
      "Verify the user's identity before troubleshooting audio settings.",
  },
  {
    command: "check_audio_output",
    preview:
      "Check the current audio output device to confirm where sound is being routed.",
  },
    {
      command: "check_volume_status",
      preview:
        "Check the system volume and mute status to confirm audio is enabled.",
    },
    {
      command: "select_audio_output",
      preview:
        "Select the correct audio output device so sound is routed to the intended speakers or headset.",
    },
    {
      command: "test_audio",
      preview:
        "Test audio playback to confirm sound is working normally.",
    },
  ],

  completion: {
    command: "test_audio",
    fact: "audio_working",
  },

  proofLines: [
  "Verified the user before troubleshooting audio settings",
  "Checked the current audio output before changing sound settings",
  "Confirmed the system volume and mute status",
  "Selected the correct audio output device",
  "Validated successful audio playback",
],

  successLines: [
    "Agent: The correct audio output has been selected and sound functionality has been verified.",
    "System: Audio playback is operating normally through the selected output device.",
    "Customer: Great, I can hear it now.",
  ],

  defaults: {
    kind: "audio_not_working",
    identity_verified: false,
    audio_output_checked: false,
    volume_status_checked: false,
    audio_output_selected: false,
    audio_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "3–5 min",
    description:
      "Restore computer sound by checking volume status and selecting the correct audio output.",
    skillFocus: [
      "Audio Troubleshooting",
      "Output Device Configuration",
      "Operational Verification",
    ],
    scenarioContext:
      "A user cannot hear computer audio because sound is routed to the wrong output device.",
    successOutcome:
      "The correct audio output is selected and sound playback is successfully verified.",
    selectCommand:
      "select audio not working",
  },
},

software_app_not_opening: {
  label: "Software Application Not Opening",
  startPrompt: `Customer: My work application will not open.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "software_applications",

    procedure: [
      { command: "verify_identity", preview: "Verify the user's identity before troubleshooting the application." },
      { command: "check_app_status", preview: "Check the application status to identify why it will not open." },
      { command: "restart_application", preview: "Restart the application so it can launch normally." },
      { command: "test_application_launch", preview: "Test application launch to confirm it opens successfully." },
    ],
    completion: { command: "test_application_launch", fact: "application_working" },

proofLines: [
  "Verified the user before troubleshooting application access",
  "Confirmed the application was unable to launch",
  "Restored application functionality",
  "Validated successful application launch",
],

successLines: [
  "Agent: Application access has been restored and verified.",
  "System: The application launches successfully.",
  "Customer: Great, it opens now.",
],

defaults: {
  kind: "software_app_not_opening",
  identity_verified: false,
  app_status_checked: false,
  application_restarted: false,
  application_working: false,
},

previewMetadata: {
  level: "Beginner",
  estimatedTime: "3–5 min",
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
  selectCommand:
    "select software app not opening",
},
  },

application_crash: {
  label: "Application Crash",
  startPrompt: `Customer: My work application keeps crashing.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "software_applications",

    procedure: [
      { command: "verify_identity", preview: "Verify the user's identity before troubleshooting the application." },
      { command: "check_app_status", preview: "Check the application status to identify why it is crashing." },
      { command: "restart_application", preview: "Restart the application to recover from the failure." },
      { command: "test_application_launch", preview: "Test application launch to confirm it runs without crashing." },
    ],
    completion: { command: "test_application_launch", fact: "application_working" },

proofLines: [
  "Verified the user before troubleshooting application stability",
  "Confirmed the application was crashing unexpectedly",
  "Restored stable application operation",
  "Validated successful application launch",
],

successLines: [
  "Agent: Application stability has been restored and verified.",
  "System: The application is running normally and is no longer crashing.",
  "Customer: Great, it is working now.",
],

defaults: {
  kind: "application_crash",
  identity_verified: false,
  app_status_checked: false,
  application_restarted: false,
  application_working: false,
},

previewMetadata: {
  level: "Beginner",
  estimatedTime: "3–5 min",
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
  selectCommand:
    "select application crash",
},
  },

software_update_required: {
  label: "Software Update Required",
  startPrompt: `Customer: My work application says an update is required.

What is your first troubleshooting step?`,

  scenarioType: "standard",
  category: "software_applications",

    procedure: [
      { command: "verify_identity", preview: "Verify the user's identity before making software changes." },
      { command: "check_software_version", preview: "Check the software version to confirm an update is required." },
      { command: "install_software_update", preview: "Install the required software update." },
      { command: "test_application_launch", preview: "Test application launch to confirm the software works correctly." },
    ],
    completion: { command: "test_application_launch", fact: "application_working" },

proofLines: [
  "Verified the user before making software changes",
  "Confirmed the installed version required an update",
  "Installed the required software update",
  "Validated successful application operation",
],

successLines: [
  "Agent: The required software update has been installed and functionality has been verified.",
  "System: The application is running on the supported version successfully.",
  "Customer: Great, it works now.",
],

defaults: {
  kind: "software_update_required",
  identity_verified: false,
  software_version_checked: false,
  software_update_installed: false,
  application_working: false,
},

previewMetadata: {
  level: "Beginner",
  estimatedTime: "3–5 min",
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
  selectCommand:
    "select software update required",
},
  },

shared_drive_group_membership_missing: {
  label: "Shared Drive Group Membership Missing",
  startPrompt: `Customer: I can’t access the shared drive I need for work.

What is your first troubleshooting step?`,

  scenarioType: "operational_challenges",
  category: "shared_drive_access_challenges",

    procedure: [
    {
      command: "verify_identity",
      preview:
        "Verify the user's identity before changing shared drive access.",
    },
    {
      command: "check_shared_drive_permissions",
      preview:
        "Check shared drive permissions to confirm why access is blocked.",
    },
    {
      command: "add_user_to_group",
      preview:
        "Add the user to the required access group for the shared drive.",
    },
    {
      command: "test_shared_drive_access",
      preview:
        "Test shared drive access to confirm the user can open it.",
    },
  ],

  completion: {
    command: "test_shared_drive_access",
    fact: "shared_drive_access_working",
  },

  proofLines: [
    "Verified the user before changing shared drive access",
    "Checked shared drive permissions before making access changes",
    "Identified that required group membership was missing",
    "Added the user to the correct shared drive access group",
    "Confirmed the user could open the shared drive successfully",
  ],

  successLines: [
    "Agent: The required group membership has been added and shared drive access has been verified.",
    "System: The shared drive opens successfully after resolving the group membership requirement.",
    "Customer: Great, I can access the shared drive now.",
  ],

  defaults: {
    kind: "shared_drive_group_membership_missing",
    identity_verified: false,
    shared_drive_permissions_checked: false,
    user_added_to_group: false,
    shared_drive_access_working: false,
  },

  previewMetadata: {
    level: "Beginner",
    estimatedTime: "5–7 min",
    description:
      "Restore shared drive access by resolving a missing group membership dependency.",
    skillFocus: [
      "Shared Drive Troubleshooting",
      "Group Membership",
      "Dependency Awareness",
    ],
    scenarioContext:
      "A user cannot access a required shared drive because they are not a member of the assigned access group.",
    successOutcome:
      "The user is added to the required group and shared drive access is successfully verified.",
    selectCommand:
      "select shared drive group membership missing",
  },
},

} as const satisfies Record<ScenarioId, ScenarioDefinition>;

type ObjectEntry<T extends object> = {
  [K in keyof T]: [K, T[K]];
}[keyof T];

function getTypedObjectEntries<T extends object>(
  value: T
): ObjectEntry<T>[] {
  return Object.entries(value) as ObjectEntry<T>[];
}

export type ScenarioRegistryEntry = {
  id: keyof typeof SCENARIO_REGISTRY;
  scenarioType: ScenarioTypeId;
  category: ScenarioCategoryId;
};

export function getScenarioRegistryEntries(): ScenarioRegistryEntry[] {
  return getTypedObjectEntries(SCENARIO_REGISTRY).map(
    ([scenarioId, scenario]) => ({
      id: scenarioId,
      scenarioType: scenario.scenarioType,
      category: scenario.category,
    })
  );
}

export function getScenarioProcedureCommands(
  scenarioId: string | null
): readonly string[] {
  if (!scenarioId) {
    return [];
  }

  const scenario =
    SCENARIO_REGISTRY[scenarioId as keyof typeof SCENARIO_REGISTRY];

  return scenario?.procedure.map((step) => step.command) ?? [];
}

export function getSuccessfulScenarioProcedureCount(
  scenarioId: string | null,
  runLog: readonly LogEvent[]
): number {
  const requiredCommands = getScenarioProcedureCommands(scenarioId);
  let nextIndex = 0;

  for (const event of runLog) {
    if (
      nextIndex < requiredCommands.length &&
      event.decision === "ALLOW" &&
      event.outcome === "success" &&
      event.plan !== null &&
      event.command === requiredCommands[nextIndex]
    ) {
      nextIndex += 1;
    }
  }

  return nextIndex;
}

export function getScenarioProcedureOutput(
  scenarioId: string,
  command: string,
  procedureIndex: number
): ProcedureResultPresentation | null {
  const scenario =
    SCENARIO_REGISTRY[
      scenarioId as keyof typeof SCENARIO_REGISTRY
    ] as ScenarioDefinition | undefined;
  const step = scenario?.procedure[procedureIndex];

  if (
    !scenario ||
    step?.command !== command ||
    !step.systemResult ||
    step.technicalOutput === undefined ||
    (step.technicalOutput.length === 0 &&
      scenarioId !== "active_network_connections_application_port_conflict" &&
      scenarioId !== "computer_running_slowly_memory_leak")
  ) {
    return null;
  }

  const technicalOutput =
    scenarioId === "dhcp_apipa_troubleshooting" &&
    (procedureIndex === 8 || procedureIndex === 10)
      ? step.technicalOutput
          .replace(
            /^ {4}(?=Windows IP Configuration|Wireless LAN adapter Wi-Fi:|C:UsersOfficeUser>$)/gm,
            ""
          )
          .replace(/^ {6}/gm, "   ")
          .replace(/^ *WINS Proxy Enabled.*$/gm, "WINS Proxy Enabled. . . . . . . . . : No")
      : step.technicalOutput;

  const educationalContent =
    scenarioId === "dhcp_apipa_troubleshooting"
      ? DHCP_EDUCATIONAL_CONTENT[procedureIndex + 1]
      : scenarioId === "dns_lookup_website_not_opening"
        ? DNS_LOOKUP_EDUCATIONAL_CONTENT[procedureIndex + 1]
        : scenarioId === "network_printer_not_printing"
          ? NETWORK_PRINTER_EDUCATIONAL_CONTENT[procedureIndex + 1]
          : scenarioId === "tcp_port_connectivity"
            ? TCP_PORT_EDUCATIONAL_CONTENT[procedureIndex + 1]
            : scenarioId === "active_directory_locked_employee_account"
              ? ACTIVE_DIRECTORY_LOCKOUT_EDUCATIONAL_CONTENT[procedureIndex + 1]
                  : scenarioId === "active_network_connections_application_port_conflict"
                    ? ACTIVE_NETWORK_CONNECTIONS_EDUCATIONAL_CONTENT[procedureIndex + 1]
                    : scenarioId === "computer_running_slowly_memory_leak"
                      ? COMPUTER_RUNNING_SLOWLY_EDUCATIONAL_CONTENT[procedureIndex + 1]
        : undefined;
  const technicalLines: TechnicalOutputLine[] | undefined =
    technicalOutput.length === 0
      ? undefined
      : technicalOutput.split("\n").map((text, lineIndex) => ({
          id:
            educationalContent?.technicalLineIds[lineIndex] ??
            `${scenarioId}.p${procedureIndex + 1}.line${lineIndex}`,
          text,
        }));

  const commandOccurrence = scenario.procedure
    .slice(0, procedureIndex + 1)
    .filter((item) => item.command === command)
    .length;

  return {
    scenarioId,
    command,
    procedureIndex,
    commandOccurrence,
    technicianEntry: step.technicianEntry ?? command,
    systemResult: step.systemResult,
    technicalOutput,
    ...(technicalLines ? { technicalLines } : {}),
    annotations: educationalContent?.annotations ?? [],
    learnMore: {
      howToExecute: educationalContent?.learnMore.howToExecute ?? null,
      whatItDoesAndHow: educationalContent?.learnMore.whatItDoesAndHow ?? null,
      whyThisMatters: educationalContent?.learnMore.whyThisMatters ?? null,
    },
  };
}

export function getScenarioPreviewSteps(scenarioId: string): string[] {
  const scenario =
    SCENARIO_REGISTRY[scenarioId as keyof typeof SCENARIO_REGISTRY];

  if (scenarioId === "active_network_connections_application_port_conflict") {
    return [
      "Investigate the reported application startup problem and verify normal reporting activity.",
    ];
  }

  if (scenarioId === "computer_running_slowly_memory_leak") {
    return ["Investigate the workstation's reported performance problem and verify normal operation."];
  }

  return scenario?.procedure.map((step) => step.preview) ?? [];
}

export function getScenarioPreviewMetadata(
  scenarioId: string
): ScenarioPreviewMetadata | null {
  const scenario = (
    SCENARIO_REGISTRY as Record<string, ScenarioDefinition>
  )[scenarioId];

  return scenario?.previewMetadata ?? null;
}

export function getScenarioDefaults(scenarioId: string): ScenarioFacts {
  const scenario =
    SCENARIO_REGISTRY[scenarioId as keyof typeof SCENARIO_REGISTRY];

  if (scenario && "defaults" in scenario) {
    return scenario.defaults;
  }

  return null;
}

export function getScenarioProofLines(scenarioId: string): string[] {
  const scenario =
    SCENARIO_REGISTRY[scenarioId as keyof typeof SCENARIO_REGISTRY];

  if (scenario && "proofLines" in scenario) {
    return [...scenario.proofLines];
  }

  return [];
}

export function getScenarioSuccessLines(scenarioId: string): string[] {
  const scenario =
    SCENARIO_REGISTRY[scenarioId as keyof typeof SCENARIO_REGISTRY];

  if (scenario && "successLines" in scenario) {
    return [...scenario.successLines];
  }

  return [];
}

export function getScenarioStartPrompt(scenarioId: string): string {
  const scenario =
    SCENARIO_REGISTRY[scenarioId as keyof typeof SCENARIO_REGISTRY];

  if (scenario && "startPrompt" in scenario) {
    return scenario.startPrompt;
  }

  return "";
}

export function getScenarioLabel(scenarioId: string): string {
  const scenario =
    SCENARIO_REGISTRY[scenarioId as keyof typeof SCENARIO_REGISTRY];

  return scenario?.label ?? scenarioId;
}

export function getScenarioProcedureEvidence(
  scenarioId: string,
  command: string,
  procedureIndex?: number
): EvidenceItem | null {
  const scenario =
    SCENARIO_REGISTRY[
      scenarioId as keyof typeof SCENARIO_REGISTRY
    ] as ScenarioDefinition | undefined;

  if (!scenario) {
    return null;
  }

  const step = procedureIndex === undefined
    ? scenario.procedure.find((item) => item.command === command)
    : scenario.procedure[procedureIndex];

  return step?.command === command
    ? step.evidence ?? null
    : null;
}

export function getScenarioInvestigationRelatedAction(
  scenarioId: string,
  command: string
): InvestigationRelatedAction | null {
  const scenario =
    SCENARIO_REGISTRY[
      scenarioId as keyof typeof SCENARIO_REGISTRY
    ] as ScenarioDefinition;

  return (
    scenario.investigation?.relatedActions[command] ??
    null
  );
}

export function getScenarioInvestigationRelatedCommands(
  scenarioId: string
): string[] {
  const scenario =
    SCENARIO_REGISTRY[
      scenarioId as keyof typeof SCENARIO_REGISTRY
    ] as ScenarioDefinition;

  return Object.keys(
    scenario.investigation?.relatedActions ?? {}
  );
}

export function isScenarioInvestigationRelatedAction(
  scenarioId: string,
  command: string
): boolean {
  return (
    getScenarioInvestigationRelatedAction(
      scenarioId,
      command
    ) !== null
  );
}

export function assertScenarioRegistryComplete(): void {
const requiredFields = [
  "label",
  "startPrompt",
  "procedure",
  "completion",
  "proofLines",
  "successLines",
  "defaults",
];

  for (const [scenarioId, scenario] of Object.entries(SCENARIO_REGISTRY)) {
    for (const field of requiredFields) {
      if (!(field in scenario)) {
        throw new Error(
          `[SCENARIO_REGISTRY] ${scenarioId} is missing required field: ${field}`
        );
      }
    }

    if (scenario.startPrompt.trim().length === 0) {
      throw new Error(
        `[SCENARIO_REGISTRY] ${scenarioId} has an empty startPrompt`
      );
    }

    if (!scenario.procedure.length) {
      throw new Error(
        `[SCENARIO_REGISTRY] ${scenarioId} has an empty procedure`
      );
    }

    if (!scenario.proofLines.length) {
      throw new Error(
        `[SCENARIO_REGISTRY] ${scenarioId} has empty proofLines`
      );
    }

    if (!scenario.successLines.length) {
      throw new Error(
        `[SCENARIO_REGISTRY] ${scenarioId} has empty successLines`
      );
    }

    if (!scenario.completion.command || !scenario.completion.fact) {
      throw new Error(
        `[SCENARIO_REGISTRY] ${scenarioId} has incomplete completion metadata`
      );
    }

    if (!scenario.defaults || Object.keys(scenario.defaults).length === 0) {
      throw new Error(
        `[SCENARIO_REGISTRY] ${scenarioId} has empty defaults`
      );
    }
  }
}