import type { ScenarioFacts } from "./types";

type ScenarioProcedureStep = {
  command: string;
  preview: string;
};

type ScenarioDefinition = {
  label: string;
  startPrompt: string;
  procedure: readonly ScenarioProcedureStep[];
  completion: {
    command: string;
    fact: string;
  };
  proofLines: readonly string[];
  successLines: readonly string[];
  defaults: ScenarioFacts;
};

// Official scenario truth.
// Commands are internal. Preview text is user-facing.

export const SCENARIO_REGISTRY = {
password_reset: {
  label: "Password Reset",
  startPrompt: `Customer: I lost access to my password. Can you help me?

What is your first troubleshooting step?`,

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
  },

password_reset_recovery_email_never_arrives: {
  label: "Password Reset — Recovery Email Never Arrives",
  startPrompt: `Customer: I forgot my password and can’t get into my company account.

What is your first troubleshooting step?`,

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
  },

account_lockout: {
  label: "Account Lockout",
  startPrompt: `Customer: I’m locked out of my account and can’t sign in.

What is your first troubleshooting step?`,

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
  },

password_reset_recovery_email_outdated: {
  label: "Password Reset — Recovery Email Outdated",
  startPrompt: `Customer: I forgot my password, but I don't have access to my recovery email anymore.

What is your first troubleshooting step?`,

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
},

vpn_access_issue: {
  label: "VPN Access Issue",
  startPrompt: `Customer: I can’t connect to my work network (VPN).

What is your first troubleshooting step?`,

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
  },

vpn_mfa_dependency_missing: {
  label: "VPN Access Issue — MFA Dependency Missing",
  startPrompt: `Customer: I can’t connect to the work VPN.

What is your first troubleshooting step?`,

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
      vpn_access_enabled: false,
      mfa_status_checked: false,
      mfa_method_reset: false,
      can_connect_now: false,
    },
  },

mfa_code_not_working: {
  label: "MFA Code Not Working",
  startPrompt: `Customer: My MFA code is not working and I can't sign in.

What is your first troubleshooting step?`,

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
  },

software_app_license_not_assigned: {
  label: "Software License Not Assigned",
  startPrompt: `Customer: The application is installed, but it says I don't have access to use it.

What is your first troubleshooting step?`,

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
  },

email_not_sending: {
  label: "Email Not Sending",
  startPrompt: `Customer: My emails are not sending.

What is your first troubleshooting step?`,

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
  },

not_receiving_email: {
  label: "Not Receiving Email",
  startPrompt: `Customer: I'm not receiving any emails.

What is your first troubleshooting step?`,

    procedure: [
      {
        command: "verify_identity",
        preview:
          "Verify the user's identity before troubleshooting the mailbox.",
      },
      {
        command: "check_inbox_filters",
        preview:
          "Check inbox filters to see if incoming email is being redirected.",
      },
      {
        command: "disable_inbox_filter",
        preview:
          "Disable the blocking filter so incoming emails reach the inbox.",
      },
      {
        command: "send_test_email",
        preview:
          "Send a test email to confirm incoming delivery works.",
      },
    ],

    completion: {
      command: "send_test_email",
      fact: "can_receive_email",
    },

    proofLines: [
      "Verified the user before making email configuration changes",
      "Investigated incoming email delivery behavior",
      "Resolved the condition preventing email delivery",
      "Confirmed email receipt with a successful test message",
    ],

    successLines: [
      "Agent: Incoming email delivery has been restored and verified with a test message.",
      "System: New messages are now reaching the inbox successfully.",
      "Customer: Great, I received the email.",
    ],

    defaults: {
  kind: "not_receiving_email",
  identity_verified: false,
  filters_checked: false,
  filter_disabled: false,
  can_receive_email: false,
},
  },

mailbox_full: {
  label: "Mailbox Full",
  startPrompt: `Customer: I stopped receiving new emails and my mailbox says it is full.

What is your first troubleshooting step?`,

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
  },

email_login_issue: {
  label: "Email Login Issue",
  startPrompt: `Customer: I cannot sign in to my email.

What is your first troubleshooting step?`,

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
  },

email_client_not_syncing: {
  label: "Email Client Not Syncing",
  startPrompt: `Customer: My email isn't updating with new messages.

What is your first troubleshooting step?`,

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
  },

attachment_too_large: {
  label: "Attachment Too Large",
  startPrompt: `Customer: My email won't send when I attach this file.

What is your first troubleshooting step?`,

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
  },

shared_mailbox_missing: {
  label: "Shared Mailbox Missing",
  startPrompt: `Customer: I can't access the shared mailbox anymore.

What is your first troubleshooting step?`,

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
  },

cannot_connect_wifi: {
  label: "Cannot Connect to Wi-Fi",
  startPrompt: `Customer: I can’t connect to WiFi.

What is your first troubleshooting step?`,

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
  },

internet_no_access: {
  label: "Internet No Access",
  startPrompt: `Customer: My computer is connected to the network, but I cannot access the internet.

What is your first troubleshooting step?`,

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
  },

slow_network_connection: {
  label: "Slow Network Connection",
  startPrompt: `Customer: My internet connection is extremely slow today.

What is your first troubleshooting step?`,

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
  },

ethernet_not_connected: {
  label: "Ethernet Not Connected",
  startPrompt: `Customer: My computer says the ethernet cable is disconnected.

What is your first troubleshooting step?`,

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
  },

network_drive_missing: {
  label: "Network Drive Missing",
  startPrompt: `Customer: I cannot see my team network drive anymore.

What is your first troubleshooting step?`,

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
  },
network_drive_vpn_required_first: {
  label: "Network Drive Missing — VPN Required First",
  startPrompt: `Customer: I cannot see my team network drive anymore.

What is your first troubleshooting step?`,

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
  },

disk_space_full: {
  label: "Disk Space Full",
  startPrompt: `Customer: My computer says the disk space is full.

What is your first troubleshooting step?`,

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
  },

cannot_open_file: {
  label: "Cannot Open File",
  startPrompt: `Customer: I cannot open one of my work files.

What is your first troubleshooting step?`,

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
  },

folder_access_missing: {
  label: "Folder Access Missing",
  startPrompt: `Customer: I cannot access a folder I need for work.

What is your first troubleshooting step?`,

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
  },

permissions_denied: {
  label: "Permissions Denied",
  startPrompt: `Customer: I keep getting a permissions denied message.

What is your first troubleshooting step?`,

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
  },

shared_drive_access_issue: {
  label: "Shared Drive Access Issue",
  startPrompt: `Customer: I can’t access the shared drive I need for work.

What is your first troubleshooting step?`,

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
  },

cannot_install_software: {
  label: "Cannot Install Software",
  startPrompt: `Customer: I need to install software, but the installation keeps failing.

What is your first troubleshooting step?`,

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
  },

too_many_apps_running: {
  label: "Too Many Apps Running",
  startPrompt: `Customer: My computer is running very slowly today.

What is your first troubleshooting step?`,

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
  },

low_memory: {
  label: "Low Memory",
  startPrompt: `Customer: My computer keeps freezing and feels extremely sluggish.

What is your first troubleshooting step?`,

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
  },

browser_running_slow: {
  label: "Browser Running Slow",
  startPrompt: `Customer: My web browser has become painfully slow.

What is your first troubleshooting step?`,

    procedure: [
      { command: "verify_identity", preview: "Verify the user's identity before troubleshooting browser performance." },
      { command: "check_browser_extensions", preview: "Check browser extensions to identify unnecessary performance load." },
      { command: "disable_unnecessary_extensions", preview: "Disable unnecessary extensions to improve browser responsiveness." },
      { command: "test_browser_performance", preview: "Test browser performance to confirm it responds normally." },
    ],
        completion: { command: "test_browser_performance", fact: "browser_performance_ok" },

    successLines: [
      "Agent: Browser performance has been restored and verified.",
      "System: Browser responsiveness has returned to normal.",
      "Customer: Great, it’s much faster now.",
    ],

        proofLines: [
      "Verified the user before troubleshooting browser performance",
      "Confirmed browser extensions were affecting performance",
      "Disabled unnecessary browser extensions",
      "Validated normal browser responsiveness",
    ],

    defaults: {
      kind: "browser_running_slow",
      identity_verified: false,
      browser_extensions_checked: false,
      unnecessary_extensions_disabled: false,
      browser_performance_ok: false,
    },
  },

printer_not_working: {
  label: "Printer Not Working",
  startPrompt: `Customer: I’m trying to print something, but the printer isn’t working.

What is your first troubleshooting step?`,

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
  },

mouse_keyboard_not_working: {
  label: "Mouse and Keyboard Not Working",
  startPrompt: `Customer: My mouse and keyboard are not working.

What is your first troubleshooting step?`,

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
  },

microphone_not_working: {
  label: "Microphone Not Working",
  startPrompt: `Customer: My microphone is not working during calls.

What is your first troubleshooting step?`,

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
  },

webcam_not_working: {
  label: "Webcam Not Working",
  startPrompt: `Customer: My webcam is not working during video calls.

What is your first troubleshooting step?`,

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
  },

second_monitor_not_detected: {
  label: "Second Monitor Not Detected",
  startPrompt: `Customer: My second monitor is not being detected.

What is your first troubleshooting step?`,

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
  },

software_app_not_opening: {
  label: "Software Application Not Opening",
  startPrompt: `Customer: My work application will not open.

What is your first troubleshooting step?`,

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
  },

application_crash: {
  label: "Application Crash",
  startPrompt: `Customer: My work application keeps crashing.

What is your first troubleshooting step?`,

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
  },

software_update_required: {
  label: "Software Update Required",
  startPrompt: `Customer: My work application says an update is required.

What is your first troubleshooting step?`,

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
  },

shared_drive_group_membership_missing: {
  label: "Shared Drive Group Membership Missing",
  startPrompt: `Customer: I can’t access the shared drive I need for work.

What is your first troubleshooting step?`,

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
},
} as const satisfies Record<string, ScenarioDefinition>;

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