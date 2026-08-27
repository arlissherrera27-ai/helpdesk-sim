// src/core/scenarioIntegrity/scenarioMutationContracts.ts

import type { ProcedureCommandKind } from "../procedureCatalog";
import type { ScenarioId } from "../scenarios";

export type ScenarioMutationContract = {
  allowedFacts: readonly string[];
  expectedFacts?: readonly string[];
  mayChangeResult?: boolean;
};

export type ScenarioMutationContractEntry =
  | ScenarioMutationContract
  | readonly ScenarioMutationContract[];

export type ScenarioMutationContracts = Partial<
  Record<
    ScenarioId,
    Partial<
      Record<
        ProcedureCommandKind,
        ScenarioMutationContractEntry
      >
    >
  >
>;

export const SCENARIO_MUTATION_CONTRACTS:
  ScenarioMutationContracts = {
    low_memory: {
      verify_identity: {
        allowedFacts: ["identity_verified"],
        expectedFacts: ["identity_verified"],
      },

      check_memory_usage: {
        allowedFacts: ["memory_checked"],
        expectedFacts: ["memory_checked"],
      },

      close_memory_heavy_apps: {
        allowedFacts: ["memory_heavy_apps_closed"],
        expectedFacts: ["memory_heavy_apps_closed"],
      },

      test_performance: {
        allowedFacts: ["memory_ok"],
        expectedFacts: ["memory_ok"],
        mayChangeResult: true,
      },
    },

    too_many_apps_running: {
      verify_identity: {
        allowedFacts: ["identity_verified"],
        expectedFacts: ["identity_verified"],
      },

      check_running_apps: {
        allowedFacts: ["apps_checked"],
        expectedFacts: ["apps_checked"],
      },

      close_unnecessary_apps: {
        allowedFacts: ["apps_closed"],
        expectedFacts: ["apps_closed"],
      },

      test_performance: {
        allowedFacts: ["performance_ok"],
        expectedFacts: ["performance_ok"],
        mayChangeResult: true,
      },
    },

    printer_not_working: {
      verify_identity: {
        allowedFacts: ["identity_verified"],
        expectedFacts: ["identity_verified"],
      },

      check_printer_status: {
        allowedFacts: ["printer_checked"],
        expectedFacts: ["printer_checked"],
      },

      restart_printer: {
        allowedFacts: ["printer_restarted"],
        expectedFacts: ["printer_restarted"],
      },

      print_test_page: {
        allowedFacts: ["printer_working"],
        expectedFacts: ["printer_working"],
        mayChangeResult: true,
      },
    },

    printer_wrong_default_printer: {
      verify_identity: {
        allowedFacts: ["identity_verified"],
        expectedFacts: ["identity_verified"],
      },

      check_printer_status: {
        allowedFacts: ["printer_checked"],
        expectedFacts: ["printer_checked"],
      },

      check_default_printer: {
        allowedFacts: ["default_printer_checked"],
        expectedFacts: ["default_printer_checked"],
      },

      set_default_printer: {
        allowedFacts: ["correct_default_printer_set"],
        expectedFacts: ["correct_default_printer_set"],
      },

      print_test_page: {
        allowedFacts: ["printer_working"],
        expectedFacts: ["printer_working"],
        mayChangeResult: true,
      },
    },
    cannot_connect_wifi_corrupted_profile: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_wifi_status: {
    allowedFacts: ["wifi_checked"],
    expectedFacts: ["wifi_checked"],
  },

  test_connection: [
  {
    allowedFacts: [
      "first_connection_tested",
      "can_connect_wifi",
    ],
    expectedFacts: [
      "first_connection_tested",
    ],
  },
  {
    allowedFacts: [
      "can_connect_wifi",
    ],
    expectedFacts: [
      "can_connect_wifi",
    ],
    mayChangeResult: true,
  },
],

  check_wifi_profile: {
    allowedFacts: ["wifi_profile_checked"],
    expectedFacts: ["wifi_profile_checked"],
  },

  remove_corrupted_wifi_profile: {
    allowedFacts: [
      "corrupted_wifi_profile_removed",
    ],
    expectedFacts: [
      "corrupted_wifi_profile_removed",
    ],
  },

  reconnect_wifi: {
    allowedFacts: ["wifi_reconnected"],
    expectedFacts: ["wifi_reconnected"],
  },
},

internet_no_access_proxy: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_network_status: {
    allowedFacts: ["network_checked"],
    expectedFacts: ["network_checked"],
  },

  test_internet_connection: [
  {
    allowedFacts: [
      "first_internet_tested",
      "internet_restored",
    ],
    expectedFacts: [
      "first_internet_tested",
    ],
  },
  {
    allowedFacts: [
      "internet_restored",
    ],
    expectedFacts: [
      "internet_restored",
    ],
    mayChangeResult: true,
  },
],

  check_proxy_settings: {
    allowedFacts: ["proxy_settings_checked"],
    expectedFacts: ["proxy_settings_checked"],
  },

  disable_incorrect_proxy: {
    allowedFacts: ["incorrect_proxy_disabled"],
    expectedFacts: ["incorrect_proxy_disabled"],
  },

  restart_network_adapter: {
    allowedFacts: ["network_adapter_restarted"],
    expectedFacts: ["network_adapter_restarted"],
  },
},
password_reset: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  send_reset_code: {
    allowedFacts: ["code_sent"],
    expectedFacts: ["code_sent"],
  },

  confirm_reset: {
    allowedFacts: ["reset_done"],
    expectedFacts: ["reset_done"],
  },

  set_new_password: {
    allowedFacts: ["password_updated"],
    expectedFacts: ["password_updated"],
  },

  test_sign_in: {
    allowedFacts: ["can_login_now"],
    expectedFacts: ["can_login_now"],
    mayChangeResult: true,
  },
},

password_reset_recovery_email_never_arrives: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  send_reset_code: {
    allowedFacts: ["code_sent"],
    expectedFacts: ["code_sent"],
  },

  check_inbox_filters: {
    allowedFacts: ["inbox_filter_checked"],
    expectedFacts: ["inbox_filter_checked"],
  },

  disable_inbox_filter: {
    allowedFacts: ["inbox_filter_enabled"],
    expectedFacts: ["inbox_filter_enabled"],
  },

  resend_reset_code: {
    allowedFacts: ["email_arrived"],
    expectedFacts: ["email_arrived"],
  },

  confirm_reset: {
    allowedFacts: ["reset_done"],
    expectedFacts: ["reset_done"],
  },

  set_new_password: {
    allowedFacts: ["password_updated"],
    expectedFacts: ["password_updated"],
  },

  test_sign_in: {
    allowedFacts: ["can_login_now"],
    expectedFacts: ["can_login_now"],
    mayChangeResult: true,
  },
},

password_reset_recovery_email_outdated: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  verify_alternate_contact: {
    allowedFacts: ["alternate_contact_verified"],
    expectedFacts: ["alternate_contact_verified"],
  },

  update_recovery_email: {
    allowedFacts: ["recovery_email_updated"],
    expectedFacts: ["recovery_email_updated"],
  },

  send_reset_code: {
    allowedFacts: ["code_sent"],
    expectedFacts: ["code_sent"],
  },

  confirm_reset: {
    allowedFacts: ["reset_done"],
    expectedFacts: ["reset_done"],
  },

  set_new_password: {
    allowedFacts: ["password_updated"],
    expectedFacts: ["password_updated"],
  },

  test_sign_in: {
    allowedFacts: ["can_login_now"],
    expectedFacts: ["can_login_now"],
    mayChangeResult: true,
  },
},

account_lockout: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  request_unlock: {
    allowedFacts: ["unlock_requested"],
    expectedFacts: ["unlock_requested"],
  },

  confirm_unlock: {
  allowedFacts: [
    "account_locked",
    "unlock_requested",
    "can_login_now",
  ],
  expectedFacts: [
    "account_locked",
    "unlock_requested",
    "can_login_now",
  ],
  mayChangeResult: true,
},
},
account_lockout_saved_credentials: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  request_unlock: [
    {
      allowedFacts: ["unlock_requested"],
      expectedFacts: ["unlock_requested"],
    },
    {
      allowedFacts: ["unlock_requested"],
      expectedFacts: ["unlock_requested"],
    },
  ],

  confirm_unlock: [
    {
      allowedFacts: [
        "account_locked",
        "unlock_requested",
      ],
      expectedFacts: [
        "account_locked",
        "unlock_requested",
      ],
    },
    {
      allowedFacts: [
        "account_locked",
        "unlock_requested",
        "account_unlocked_after_fix",
      ],
      expectedFacts: [
        "account_locked",
        "unlock_requested",
        "account_unlocked_after_fix",
      ],
    },
  ],

  test_sign_in: [
    {
      allowedFacts: [
        "first_sign_in_attempted",
        "account_locked",
      ],
      expectedFacts: [
        "first_sign_in_attempted",
        "account_locked",
      ],
    },
    {
      allowedFacts: ["can_login_now"],
      expectedFacts: ["can_login_now"],
      mayChangeResult: true,
    },
  ],

  review_failed_authentication_attempts: {
    allowedFacts: [
      "repeated_authentication_attempts_reviewed",
    ],
    expectedFacts: [
      "repeated_authentication_attempts_reviewed",
    ],
  },

  update_saved_credentials: {
    allowedFacts: [
      "saved_credentials_updated",
    ],
    expectedFacts: [
      "saved_credentials_updated",
    ],
  },
},
vpn_access_issue: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_vpn_access: {
    allowedFacts: ["vpn_access_checked"],
    expectedFacts: ["vpn_access_checked"],
  },

  enable_vpn_access: {
    allowedFacts: ["vpn_access_enabled"],
    expectedFacts: ["vpn_access_enabled"],
  },

  confirm_connection: {
    allowedFacts: ["can_connect_now"],
    expectedFacts: ["can_connect_now"],
    mayChangeResult: true,
  },
},

vpn_mfa_dependency_missing: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_vpn_access: {
    allowedFacts: ["vpn_access_checked"],
    expectedFacts: ["vpn_access_checked"],
  },

  enable_vpn_access: {
    allowedFacts: ["vpn_access_enabled"],
    expectedFacts: ["vpn_access_enabled"],
  },

  check_mfa_status: {
    allowedFacts: ["mfa_status_checked"],
    expectedFacts: ["mfa_status_checked"],
  },

  reset_mfa_method: {
    allowedFacts: ["mfa_method_reset"],
    expectedFacts: ["mfa_method_reset"],
  },

  confirm_connection: {
    allowedFacts: ["can_connect_now"],
    expectedFacts: ["can_connect_now"],
    mayChangeResult: true,
  },
},

mfa_code_not_working: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_mfa_status: {
    allowedFacts: ["mfa_status_checked"],
    expectedFacts: ["mfa_status_checked"],
  },

  reset_mfa_method: {
    allowedFacts: ["mfa_method_reset"],
    expectedFacts: ["mfa_method_reset"],
  },

  test_mfa_login: {
    allowedFacts: ["mfa_working"],
    expectedFacts: ["mfa_working"],
    mayChangeResult: true,
  },
},

mfa_code_old_phone_still_registered: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_mfa_status: {
    allowedFacts: ["mfa_status_checked"],
    expectedFacts: ["mfa_status_checked"],
  },

  check_registered_mfa_device: {
    allowedFacts: [
      "registered_mfa_device_checked",
    ],
    expectedFacts: [
      "registered_mfa_device_checked",
    ],
  },

  remove_old_mfa_device: {
    allowedFacts: ["old_mfa_device_removed"],
    expectedFacts: ["old_mfa_device_removed"],
  },

  reset_mfa_method: {
    allowedFacts: ["mfa_method_reset"],
    expectedFacts: ["mfa_method_reset"],
  },

  test_mfa_login: {
    allowedFacts: ["mfa_working"],
    expectedFacts: ["mfa_working"],
    mayChangeResult: true,
  },
},
email_not_sending: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_email_status: {
    allowedFacts: ["email_status_checked"],
    expectedFacts: ["email_status_checked"],
  },

  enable_email_client: {
    allowedFacts: ["email_client_online"],
    expectedFacts: ["email_client_online"],
  },

  send_test_email: {
    allowedFacts: ["can_send_email"],
    expectedFacts: ["can_send_email"],
    mayChangeResult: true,
  },
},

email_not_sending_outbox: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_email_status: {
    allowedFacts: ["email_status_checked"],
    expectedFacts: ["email_status_checked"],
  },

  send_test_email: [
    {
      allowedFacts: [
        "first_send_test_completed",
        "can_send_email",
      ],
      expectedFacts: [
        "first_send_test_completed",
      ],
    },
    {
      allowedFacts: ["can_send_email"],
      expectedFacts: ["can_send_email"],
      mayChangeResult: true,
    },
  ],

  check_outbox: {
    allowedFacts: ["outbox_checked"],
    expectedFacts: ["outbox_checked"],
  },

  send_stuck_outbox_email: {
    allowedFacts: ["stuck_outbox_email_sent"],
    expectedFacts: ["stuck_outbox_email_sent"],
  },
},

not_receiving_email: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_sync_settings: {
    allowedFacts: ["sync_settings_checked"],
    expectedFacts: ["sync_settings_checked"],
  },

  resync_email_client: {
    allowedFacts: ["email_client_resynced"],
    expectedFacts: ["email_client_resynced"],
  },

  send_test_email: {
    allowedFacts: ["can_receive_email"],
    expectedFacts: ["can_receive_email"],
    mayChangeResult: true,
  },
},

not_receiving_email_inbox_rule_redirecting: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_sync_settings: {
    allowedFacts: ["sync_settings_checked"],
    expectedFacts: ["sync_settings_checked"],
  },

  resync_email_client: {
    allowedFacts: ["email_client_resynced"],
    expectedFacts: ["email_client_resynced"],
  },

  send_test_email: [
    {
      allowedFacts: [
        "first_receive_test_completed",
        "can_receive_email",
      ],
      expectedFacts: [
        "first_receive_test_completed",
      ],
    },
    {
      allowedFacts: ["can_receive_email"],
      expectedFacts: ["can_receive_email"],
      mayChangeResult: true,
    },
  ],

  check_inbox_filters: {
    allowedFacts: ["inbox_filter_checked"],
    expectedFacts: ["inbox_filter_checked"],
  },

  disable_inbox_filter: {
    allowedFacts: [
      "inbox_filter_enabled",
      "filter_disabled",
    ],
    expectedFacts: [
      "inbox_filter_enabled",
      "filter_disabled",
    ],
  },
},
mailbox_full: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_mailbox_storage: {
    allowedFacts: ["mailbox_storage_checked"],
    expectedFacts: ["mailbox_storage_checked"],
  },

  archive_old_emails: {
    allowedFacts: ["old_emails_archived"],
    expectedFacts: ["old_emails_archived"],
  },

  send_test_email: {
    allowedFacts: ["mailbox_receiving_email"],
    expectedFacts: ["mailbox_receiving_email"],
    mayChangeResult: true,
  },
},

mailbox_full_archive_policy_not_applied: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_mailbox_storage: {
    allowedFacts: ["mailbox_storage_checked"],
    expectedFacts: ["mailbox_storage_checked"],
  },

  check_archive_policy: {
    allowedFacts: ["archive_policy_checked"],
    expectedFacts: ["archive_policy_checked"],
  },

  apply_archive_policy: {
    allowedFacts: ["archive_policy_applied"],
    expectedFacts: ["archive_policy_applied"],
  },

  archive_old_emails: {
    allowedFacts: ["old_emails_archived"],
    expectedFacts: ["old_emails_archived"],
  },

  send_test_email: {
    allowedFacts: ["mailbox_receiving_email"],
    expectedFacts: ["mailbox_receiving_email"],
    mayChangeResult: true,
  },
},

email_login_issue: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_email_login_status: {
    allowedFacts: ["email_login_checked"],
    expectedFacts: ["email_login_checked"],
  },

  reset_email_session: {
    allowedFacts: ["email_session_reset"],
    expectedFacts: ["email_session_reset"],
  },

  test_email_login: {
    allowedFacts: ["email_login_working"],
    expectedFacts: ["email_login_working"],
    mayChangeResult: true,
  },
},

email_login_cached_credentials: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_email_login_status: {
    allowedFacts: ["email_login_checked"],
    expectedFacts: ["email_login_checked"],
  },

  test_email_login: [
    {
      allowedFacts: [
        "first_email_login_tested",
        "email_login_working",
      ],
      expectedFacts: [
        "first_email_login_tested",
      ],
    },
    {
      allowedFacts: ["email_login_working"],
      expectedFacts: ["email_login_working"],
      mayChangeResult: true,
    },
  ],

  check_saved_email_credentials: {
    allowedFacts: [
      "saved_email_credentials_checked",
    ],
    expectedFacts: [
      "saved_email_credentials_checked",
    ],
  },

  update_saved_email_credentials: {
    allowedFacts: [
      "saved_email_credentials_updated",
    ],
    expectedFacts: [
      "saved_email_credentials_updated",
    ],
  },
},

email_client_not_syncing: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_sync_settings: {
    allowedFacts: ["sync_settings_checked"],
    expectedFacts: ["sync_settings_checked"],
  },

  resync_email_client: {
    allowedFacts: ["email_client_resynced"],
    expectedFacts: ["email_client_resynced"],
  },

  test_email_sync: {
    allowedFacts: ["email_sync_working"],
    expectedFacts: ["email_sync_working"],
    mayChangeResult: true,
  },
},

email_client_not_syncing_cached_session_stuck: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_sync_settings: {
    allowedFacts: ["sync_settings_checked"],
    expectedFacts: ["sync_settings_checked"],
  },

  check_email_login_status: {
    allowedFacts: ["email_login_checked"],
    expectedFacts: ["email_login_checked"],
  },

  reset_email_session: {
    allowedFacts: ["email_session_reset"],
    expectedFacts: ["email_session_reset"],
  },

  resync_email_client: {
    allowedFacts: ["email_client_resynced"],
    expectedFacts: ["email_client_resynced"],
  },

  test_email_sync: {
    allowedFacts: ["email_sync_working"],
    expectedFacts: ["email_sync_working"],
    mayChangeResult: true,
  },
},
attachment_too_large: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_attachment_size: {
    allowedFacts: ["attachment_size_checked"],
    expectedFacts: ["attachment_size_checked"],
  },

  compress_attachment: {
    allowedFacts: ["attachment_compressed"],
    expectedFacts: ["attachment_compressed"],
  },

  send_test_email: {
    allowedFacts: ["test_email_sent"],
    expectedFacts: ["test_email_sent"],
    mayChangeResult: true,
  },
},

shared_mailbox_missing: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_shared_mailbox_membership: {
    allowedFacts: [
      "shared_mailbox_membership_checked",
    ],
    expectedFacts: [
      "shared_mailbox_membership_checked",
    ],
  },

  grant_shared_mailbox_access: {
    allowedFacts: [
      "shared_mailbox_access_granted",
    ],
    expectedFacts: [
      "shared_mailbox_access_granted",
    ],
  },

  test_shared_mailbox_access: {
    allowedFacts: ["shared_mailbox_working"],
    expectedFacts: ["shared_mailbox_working"],
    mayChangeResult: true,
  },
},

shared_mailbox_outlook_profile_not_updated: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_shared_mailbox_membership: {
    allowedFacts: [
      "shared_mailbox_membership_checked",
    ],
    expectedFacts: [
      "shared_mailbox_membership_checked",
    ],
  },

  test_shared_mailbox_access: [
    {
      allowedFacts: [
        "shared_mailbox_access_tested",
        "shared_mailbox_working",
      ],
      expectedFacts: [
        "shared_mailbox_access_tested",
      ],
    },
    {
      allowedFacts: ["shared_mailbox_working"],
      expectedFacts: ["shared_mailbox_working"],
      mayChangeResult: true,
    },
  ],

  check_outlook_mailbox_configuration: {
    allowedFacts: [
      "outlook_mailbox_configuration_checked",
    ],
    expectedFacts: [
      "outlook_mailbox_configuration_checked",
    ],
  },

  add_shared_mailbox_to_outlook_profile: {
    allowedFacts: [
      "shared_mailbox_added_to_outlook_profile",
    ],
    expectedFacts: [
      "shared_mailbox_added_to_outlook_profile",
    ],
  },
},

shared_mailbox_automapping_missing: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_shared_mailbox_membership: {
    allowedFacts: [
      "shared_mailbox_membership_checked",
    ],
    expectedFacts: [
      "shared_mailbox_membership_checked",
    ],
  },

  test_shared_mailbox_access: [
    {
      allowedFacts: [
        "shared_mailbox_access_tested",
        "shared_mailbox_working",
      ],
      expectedFacts: [
        "shared_mailbox_access_tested",
      ],
    },
    {
      allowedFacts: ["shared_mailbox_working"],
      expectedFacts: ["shared_mailbox_working"],
      mayChangeResult: true,
    },
  ],

  check_shared_mailbox_automapping: {
    allowedFacts: [
      "shared_mailbox_automapping_checked",
    ],
    expectedFacts: [
      "shared_mailbox_automapping_checked",
    ],
  },

  enable_shared_mailbox_automapping: {
    allowedFacts: [
      "shared_mailbox_automapping_enabled",
    ],
    expectedFacts: [
      "shared_mailbox_automapping_enabled",
    ],
  },

  restart_application: {
    allowedFacts: ["application_restarted"],
    expectedFacts: ["application_restarted"],
  },
},

email_client_corrupted_profile: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_app_status: {
    allowedFacts: ["app_status_checked"],
    expectedFacts: ["app_status_checked"],
  },

  restart_application: {
    allowedFacts: ["application_restarted"],
    expectedFacts: ["application_restarted"],
  },

  test_application_launch: [
    {
      allowedFacts: [
        "application_launch_tested",
        "application_working",
      ],
      expectedFacts: [
        "application_launch_tested",
      ],
    },
    {
      allowedFacts: ["application_working"],
      expectedFacts: ["application_working"],
      mayChangeResult: true,
    },
  ],

  check_email_client_profile: {
    allowedFacts: [
      "email_client_profile_checked",
    ],
    expectedFacts: [
      "email_client_profile_checked",
    ],
  },

  repair_email_client_profile: {
    allowedFacts: [
      "email_client_profile_repaired",
    ],
    expectedFacts: [
      "email_client_profile_repaired",
    ],
  },
},
cannot_connect_wifi: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_wifi_status: {
    allowedFacts: ["wifi_checked"],
    expectedFacts: ["wifi_checked"],
  },

  enable_wifi: {
    allowedFacts: ["wifi_enabled"],
    expectedFacts: ["wifi_enabled"],
  },

  test_connection: {
    allowedFacts: ["can_connect_wifi"],
    expectedFacts: ["can_connect_wifi"],
    mayChangeResult: true,
  },
},

internet_no_access: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_network_status: {
    allowedFacts: ["network_checked"],
    expectedFacts: ["network_checked"],
  },

  check_network_adapter: {
    allowedFacts: ["network_adapter_checked"],
    expectedFacts: ["network_adapter_checked"],
  },

  restart_network_adapter: {
    allowedFacts: ["network_adapter_restarted"],
    expectedFacts: ["network_adapter_restarted"],
  },

  test_internet_connection: {
    allowedFacts: ["internet_restored"],
    expectedFacts: ["internet_restored"],
    mayChangeResult: true,
  },
},

slow_network_connection: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_network_speed: {
    allowedFacts: ["network_speed_checked"],
    expectedFacts: ["network_speed_checked"],
  },

  check_network_adapter: {
    allowedFacts: ["network_adapter_checked"],
    expectedFacts: ["network_adapter_checked"],
  },

  restart_network_adapter: {
    allowedFacts: ["network_adapter_restarted"],
    expectedFacts: ["network_adapter_restarted"],
  },

  test_internet_connection: {
    allowedFacts: ["internet_speed_restored"],
    expectedFacts: ["internet_speed_restored"],
    mayChangeResult: true,
  },
},

ethernet_not_connected: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_ethernet_connection: {
    allowedFacts: ["ethernet_checked"],
    expectedFacts: ["ethernet_checked"],
  },

  reconnect_ethernet_cable: {
    allowedFacts: ["ethernet_cable_reconnected"],
    expectedFacts: ["ethernet_cable_reconnected"],
  },

  test_internet_connection: {
    allowedFacts: [
      "ethernet_connection_restored",
    ],
    expectedFacts: [
      "ethernet_connection_restored",
    ],
    mayChangeResult: true,
  },
},
disk_space_full: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_disk_space: {
    allowedFacts: ["disk_checked"],
    expectedFacts: ["disk_checked"],
  },

  clear_temp_files: {
    allowedFacts: ["temp_files_cleared"],
    expectedFacts: ["temp_files_cleared"],
  },

  confirm_storage_available: {
    allowedFacts: ["storage_available"],
    expectedFacts: ["storage_available"],
    mayChangeResult: true,
  },
},

network_drive_missing: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_network_drive_mapping: {
    allowedFacts: ["network_drive_mapping_checked"],
    expectedFacts: ["network_drive_mapping_checked"],
  },

  remap_network_drive: {
    allowedFacts: ["network_drive_remapped"],
    expectedFacts: ["network_drive_remapped"],
  },

  test_network_drive_access: {
    allowedFacts: ["network_drive_access_working"],
    expectedFacts: ["network_drive_access_working"],
    mayChangeResult: true,
  },
},

cannot_open_file: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_file_open_error: {
    allowedFacts: ["file_open_error_checked"],
    expectedFacts: ["file_open_error_checked"],
  },

  check_file_association: {
    allowedFacts: ["file_association_checked"],
    expectedFacts: ["file_association_checked"],
  },

  repair_file_association: {
    allowedFacts: ["file_association_repaired"],
    expectedFacts: ["file_association_repaired"],
  },

  test_file_open: {
    allowedFacts: ["file_opens_successfully"],
    expectedFacts: ["file_opens_successfully"],
    mayChangeResult: true,
  },
},
permissions_denied: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_user_permissions: {
    allowedFacts: ["user_permissions_checked"],
    expectedFacts: ["user_permissions_checked"],
  },

  grant_required_permission: {
    allowedFacts: ["required_permission_granted"],
    expectedFacts: ["required_permission_granted"],
  },

  test_permission_access: {
    allowedFacts: ["permission_access_working"],
    expectedFacts: ["permission_access_working"],
    mayChangeResult: true,
  },
},

folder_access_missing: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_folder_permissions: {
    allowedFacts: ["folder_permissions_checked"],
    expectedFacts: ["folder_permissions_checked"],
  },

  grant_folder_access: {
    allowedFacts: ["folder_access_granted"],
    expectedFacts: ["folder_access_granted"],
  },

  test_folder_access: {
    allowedFacts: ["folder_access_working"],
    expectedFacts: ["folder_access_working"],
    mayChangeResult: true,
  },
},

folder_access_required_security_group_missing: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_folder_permissions: {
    allowedFacts: ["folder_permissions_checked"],
    expectedFacts: ["folder_permissions_checked"],
  },

  test_folder_access: [
    {
      allowedFacts: [
        "first_folder_access_tested",
        "folder_access_working",
      ],
      expectedFacts: [
        "first_folder_access_tested",
      ],
    },
    {
      allowedFacts: ["folder_access_working"],
      expectedFacts: ["folder_access_working"],
      mayChangeResult: true,
    },
  ],

  check_folder_security_group: {
    allowedFacts: ["folder_security_group_checked"],
    expectedFacts: ["folder_security_group_checked"],
  },

  add_user_to_group: {
    allowedFacts: ["user_added_to_group"],
    expectedFacts: ["user_added_to_group"],
  },
},

shared_drive_access_issue: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_shared_drive_permissions: {
    allowedFacts: ["shared_drive_permissions_checked"],
    expectedFacts: ["shared_drive_permissions_checked"],
  },

  grant_shared_drive_access: {
    allowedFacts: ["shared_drive_access_granted"],
    expectedFacts: ["shared_drive_access_granted"],
  },

  test_shared_drive_access: {
    allowedFacts: ["shared_drive_access_working"],
    expectedFacts: ["shared_drive_access_working"],
    mayChangeResult: true,
  },
},

shared_drive_group_membership_missing: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_shared_drive_permissions: {
    allowedFacts: ["shared_drive_permissions_checked"],
    expectedFacts: ["shared_drive_permissions_checked"],
  },

  add_user_to_group: {
    allowedFacts: ["user_added_to_group"],
    expectedFacts: ["user_added_to_group"],
  },

  test_shared_drive_access: {
    allowedFacts: ["shared_drive_access_working"],
    expectedFacts: ["shared_drive_access_working"],
    mayChangeResult: true,
  },
},
network_drive_vpn_required_first: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_vpn_access: {
    allowedFacts: ["vpn_access_checked"],
    expectedFacts: ["vpn_access_checked"],
  },

  enable_vpn_access: {
    allowedFacts: ["vpn_access_enabled"],
    expectedFacts: ["vpn_access_enabled"],
  },

  check_network_drive_mapping: {
    allowedFacts: ["network_drive_mapping_checked"],
    expectedFacts: ["network_drive_mapping_checked"],
  },

  remap_network_drive: {
    allowedFacts: ["network_drive_remapped"],
    expectedFacts: ["network_drive_remapped"],
  },

  test_network_drive_access: {
    allowedFacts: ["network_drive_access_working"],
    expectedFacts: ["network_drive_access_working"],
    mayChangeResult: true,
  },
},
browser_running_slow: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_browser_cache: {
    allowedFacts: ["browser_cache_checked"],
    expectedFacts: ["browser_cache_checked"],
  },

  clear_browser_cache: {
    allowedFacts: ["browser_cache_cleared"],
    expectedFacts: ["browser_cache_cleared"],
  },

  test_browser_performance: {
    allowedFacts: ["browser_performance_ok"],
    expectedFacts: ["browser_performance_ok"],
    mayChangeResult: true,
  },
},

browser_running_slow_extension: {

  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_browser_cache: {
    allowedFacts: ["browser_cache_checked"],
    expectedFacts: ["browser_cache_checked"],
  },

  clear_browser_cache: {
    allowedFacts: ["browser_cache_cleared"],
    expectedFacts: ["browser_cache_cleared"],
  },

  test_browser_performance: [
    {
      allowedFacts: [
        "browser_performance_tested_after_cache",
        "browser_performance_ok",
      ],
      expectedFacts: [
        "browser_performance_tested_after_cache",
      ],
    },
    {
      allowedFacts: ["browser_performance_ok"],
      expectedFacts: ["browser_performance_ok"],
      mayChangeResult: true,
    },
  ],

  check_browser_extensions: {
    allowedFacts: ["browser_extensions_checked"],
    expectedFacts: ["browser_extensions_checked"],
  },

  disable_unnecessary_extensions: {
    allowedFacts: ["unnecessary_extensions_disabled"],
    expectedFacts: ["unnecessary_extensions_disabled"],
  },

},
mouse_keyboard_not_working: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_device_connection: {
    allowedFacts: ["device_connection_checked"],
    expectedFacts: ["device_connection_checked"],
  },

  reconnect_device: {
    allowedFacts: ["device_reconnected"],
    expectedFacts: ["device_reconnected"],
  },

  test_input_device: {
    allowedFacts: ["input_device_working"],
    expectedFacts: ["input_device_working"],
    mayChangeResult: true,
  },
},

microphone_not_working: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_microphone_settings: {
    allowedFacts: ["microphone_settings_checked"],
    expectedFacts: ["microphone_settings_checked"],
  },

  enable_microphone: {
    allowedFacts: ["microphone_enabled"],
    expectedFacts: ["microphone_enabled"],
  },

  test_microphone: {
    allowedFacts: ["microphone_working"],
    expectedFacts: ["microphone_working"],
    mayChangeResult: true,
  },
},

webcam_not_working: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_webcam_settings: {
    allowedFacts: ["webcam_settings_checked"],
    expectedFacts: ["webcam_settings_checked"],
  },

  enable_webcam: {
    allowedFacts: ["webcam_enabled"],
    expectedFacts: ["webcam_enabled"],
  },

  test_webcam: {
    allowedFacts: ["webcam_working"],
    expectedFacts: ["webcam_working"],
    mayChangeResult: true,
  },
},

second_monitor_not_detected: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_display_connection: {
    allowedFacts: ["display_connection_checked"],
    expectedFacts: ["display_connection_checked"],
  },

  check_display_settings: {
    allowedFacts: ["display_settings_checked"],
    expectedFacts: ["display_settings_checked"],
  },

  detect_second_monitor: {
    allowedFacts: ["second_monitor_detected"],
    expectedFacts: ["second_monitor_detected"],
  },

  test_dual_display: {
    allowedFacts: ["dual_display_working"],
    expectedFacts: ["dual_display_working"],
    mayChangeResult: true,
  },
},
second_monitor_display_disabled: {

  check_display_connection: {
    allowedFacts: ["display_connection_checked"],
    expectedFacts: ["display_connection_checked"],
  },

  check_display_settings: {
    allowedFacts: ["display_settings_checked"],
    expectedFacts: ["display_settings_checked"],
  },

  detect_second_monitor: {
    allowedFacts: ["second_monitor_detected"],
    expectedFacts: ["second_monitor_detected"],
  },

  test_dual_display: [
    {
      allowedFacts: [
        "first_dual_display_tested",
        "dual_display_working",
      ],
      expectedFacts: ["first_dual_display_tested"],
    },
    {
      allowedFacts: ["dual_display_working"],
      expectedFacts: ["dual_display_working"],
      mayChangeResult: true,
    },
  ],

  check_display_enabled_status: {
    allowedFacts: ["display_enabled_status_checked"],
    expectedFacts: ["display_enabled_status_checked"],
  },

  enable_second_display: {
    allowedFacts: ["second_display_enabled"],
    expectedFacts: ["second_display_enabled"],
  },
},

microphone_wrong_recording_device: {

  check_microphone_settings: {
    allowedFacts: ["microphone_settings_checked"],
    expectedFacts: ["microphone_settings_checked"],
  },

  test_microphone: [
    {
      allowedFacts: [
        "first_microphone_tested",
        "microphone_working",
      ],
      expectedFacts: ["first_microphone_tested"],
    },
    {
      allowedFacts: ["microphone_working"],
      expectedFacts: ["microphone_working"],
      mayChangeResult: true,
    },
  ],

  check_recording_device: {
    allowedFacts: ["recording_device_checked"],
    expectedFacts: ["recording_device_checked"],
  },

  select_recording_device: {
    allowedFacts: ["correct_recording_device_selected"],
    expectedFacts: ["correct_recording_device_selected"],
  },
},
audio_not_working: {
  verify_identity: {
  allowedFacts: ["identity_verified"],
  expectedFacts: ["identity_verified"],
},
  check_audio_output: {
    allowedFacts: ["audio_output_checked"],
    expectedFacts: ["audio_output_checked"],
  },

  check_volume_status: {
    allowedFacts: ["volume_status_checked"],
    expectedFacts: ["volume_status_checked"],
  },

  select_audio_output: {
    allowedFacts: ["audio_output_selected"],
    expectedFacts: ["audio_output_selected"],
  },

  test_audio: {
    allowedFacts: ["audio_working"],
    expectedFacts: ["audio_working"],
    mayChangeResult: true,
  },
},
software_app_not_opening: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_app_status: {
    allowedFacts: ["app_status_checked"],
    expectedFacts: ["app_status_checked"],
  },

  restart_application: {
    allowedFacts: ["application_restarted"],
    expectedFacts: ["application_restarted"],
  },

  test_application_launch: {
    allowedFacts: ["application_working"],
    expectedFacts: ["application_working"],
    mayChangeResult: true,
  },
},

application_crash: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_app_status: {
    allowedFacts: ["app_status_checked"],
    expectedFacts: ["app_status_checked"],
  },

  restart_application: {
    allowedFacts: ["application_restarted"],
    expectedFacts: ["application_restarted"],
  },

  test_application_launch: {
    allowedFacts: ["application_working"],
    expectedFacts: ["application_working"],
    mayChangeResult: true,
  },
},

software_update_required: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_software_version: {
    allowedFacts: ["software_version_checked"],
    expectedFacts: ["software_version_checked"],
  },

  install_software_update: {
    allowedFacts: ["software_update_installed"],
    expectedFacts: ["software_update_installed"],
  },

  test_application_launch: {
    allowedFacts: ["application_working"],
    expectedFacts: ["application_working"],
    mayChangeResult: true,
  },
},

software_app_license_not_assigned: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_app_status: {
    allowedFacts: ["app_status_checked"],
    expectedFacts: ["app_status_checked"],
  },

  check_license_assignment: {
    allowedFacts: ["license_assignment_checked"],
    expectedFacts: ["license_assignment_checked"],
  },

  assign_software_license: {
    allowedFacts: ["software_license_assigned"],
    expectedFacts: ["software_license_assigned"],
  },

  test_application_launch: {
    allowedFacts: ["application_working"],
    expectedFacts: ["application_working"],
    mayChangeResult: true,
  },
},
email_application_will_not_open: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_app_status: {
    allowedFacts: ["app_status_checked"],
    expectedFacts: ["app_status_checked"],
  },

  restart_application: {
    allowedFacts: ["application_restarted"],
    expectedFacts: ["application_restarted"],
  },

  test_application_launch: {
    allowedFacts: ["application_working"],
    expectedFacts: ["application_working"],
    mayChangeResult: true,
  },
},

cannot_install_software: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_install_permissions: {
    allowedFacts: ["install_permissions_checked"],
    expectedFacts: ["install_permissions_checked"],
  },

  grant_install_permissions: {
    allowedFacts: ["install_permissions_granted"],
    expectedFacts: ["install_permissions_granted"],
  },

  test_software_install: {
    allowedFacts: ["software_install_working"],
    expectedFacts: ["software_install_working"],
    mayChangeResult: true,
  },
},

cannot_install_software_admin_approval_required: {
  verify_identity: {
    allowedFacts: ["identity_verified"],
    expectedFacts: ["identity_verified"],
  },

  check_install_permissions: {
    allowedFacts: ["install_permissions_checked"],
    expectedFacts: ["install_permissions_checked"],
  },

  check_software_request_status: {
    allowedFacts: ["software_request_checked"],
    expectedFacts: ["software_request_checked"],
  },

  approve_software_request: {
    allowedFacts: ["software_request_approved"],
    expectedFacts: ["software_request_approved"],
  },

  grant_install_permissions: {
    allowedFacts: ["install_permissions_granted"],
    expectedFacts: ["install_permissions_granted"],
  },

  test_software_install: {
    allowedFacts: ["software_install_working"],
    expectedFacts: ["software_install_working"],
    mayChangeResult: true,
  },
},
  };