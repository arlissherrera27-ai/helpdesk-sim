import type { ScenarioId } from "./scenarios";
import type { ScenarioFacts } from "./types";

type ScenarioProcedureStep = {
  command: string;
  preview: string;
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
  completion: {
    command: string;
    fact: string;
  };
  proofLines: readonly string[];
  successLines: readonly string[];
  defaults: ScenarioFacts;
  previewMetadata: ScenarioPreviewMetadata;
};

// Official scenario truth.
// Commands are internal. Preview text is user-facing.

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
        preview:
          "Verify the user's identity to ensure they are authorized to recover the account.",
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
    },
    {
      command: "check_email_client_profile",
      preview:
        "Check the email client's profile for corruption after the restart fails.",
    },
    {
      command: "repair_email_client_profile",
      preview:
        "Repair the corrupted email profile.",
    },
    {
      command: "test_application_launch",
      preview:
        "Verify the application launches successfully after the profile repair.",
    },
  ],

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

export function getScenarioPreviewSteps(scenarioId: string): string[] {
  const scenario =
    SCENARIO_REGISTRY[scenarioId as keyof typeof SCENARIO_REGISTRY];

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