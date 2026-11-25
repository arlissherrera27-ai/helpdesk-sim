import type { SimState } from "./types";
import type {
  ProcedureCommandKind,
  ProcedurePlanKind,
} from "./procedureCatalog";

type ScenarioFacts =
  NonNullable<SimState["scenarioFacts"]>;

type ScenarioFactKind =
  ScenarioFacts["kind"];

type ScenarioFactsFor<
  Kind extends ScenarioFactKind
> = Extract<
  ScenarioFacts,
  { kind: Kind }
>;

type ProcedureScenarioRule<
  Kind extends ScenarioFactKind
> = (
  facts: ScenarioFactsFor<Kind>
) => boolean;

type ProcedureScenarioRules = {
  [Kind in ScenarioFactKind]?:
    ProcedureScenarioRule<Kind>;
};

export type ProcedureDecisionDefinition = {
  scenarios: ProcedureScenarioRules;

  plan?:
    | ProcedurePlanKind
    | Partial<
        Record<
          ScenarioFactKind,
          ProcedurePlanKind
        >
      >;
};

export type ProcedureDecisionRegistry =
  Partial<
    Record<
      ProcedureCommandKind,
      ProcedureDecisionDefinition
    >
  >;

function defineProcedureDecision<
  Definition extends ProcedureDecisionDefinition
>(
  definition: Definition
): Definition {
  return definition;
}

export const procedureDecisionRegistry = {
    test_connection: defineProcedureDecision({
  scenarios: {
    cannot_connect_wifi: (facts) =>
      facts.wifi_enabled &&
      !facts.can_connect_wifi,

    cannot_connect_wifi_corrupted_profile: (facts) =>
  (
    facts.wifi_checked &&
    !facts.first_connection_tested
  ) ||
  (
    facts.first_connection_tested &&
    facts.wifi_reconnected &&
    !facts.can_connect_wifi
  ),

    vpn_access_issue: (facts) =>
      facts.vpn_access_enabled,

    vpn_mfa_dependency_missing: (facts) =>
      facts.vpn_access_enabled &&
      facts.mfa_method_reset,
  },

  plan: {
    cannot_connect_wifi:
      "TestConnection",

    cannot_connect_wifi_corrupted_profile:
      "TestConnection",

    vpn_access_issue:
      "ConfirmConnection",

    vpn_mfa_dependency_missing:
      "ConfirmConnection",
  },
}),

test_internet_connection:
  defineProcedureDecision({
    scenarios: {
      internet_no_access: (facts) =>
        facts.network_adapter_restarted &&
        !facts.internet_restored,

      internet_no_access_proxy: (facts) =>
      (
        facts.network_checked &&
        !facts.first_internet_tested
      ) ||
      (
        facts.first_internet_tested &&
        facts.network_adapter_restarted &&
        !facts.internet_restored
      ),

      dns_incorrect_configuration: (facts) =>
      (
        facts.network_status_checked &&
        !facts.internet_connection_tested
      ) ||
      (
        facts.dns_resolution_restored &&
        !facts.internet_access_restored
      ),

      slow_network_connection: (facts) =>
        facts.network_adapter_restarted &&
        !facts.internet_speed_restored,

      ethernet_not_connected: (facts) =>
        facts.ethernet_cable_reconnected &&
        !facts.ethernet_connection_restored,

      dhcp_apipa_troubleshooting: (facts) =>
        facts.dns_resolution_succeeded &&
        !facts.internet_access_restored,

      dns_lookup_website_not_opening: (facts) =>
        facts.dns_cache_flushed &&
        facts.portal_hostname_ping_succeeded &&
        facts.updated_dns_cache_inspected &&
        !facts.internet_access_verified,
    },
  }),

    send_test_email: defineProcedureDecision({
  scenarios: {
    attachment_too_large: (facts) =>
      facts.attachment_compressed,

    email_not_sending: (facts) =>
      facts.email_client_online,

    email_not_sending_outbox: (facts) =>
      (
        facts.email_status_checked &&
        !facts.first_send_test_completed
      ) ||
      (
        facts.stuck_outbox_email_sent &&
        !facts.can_send_email
      ),

    not_receiving_email: (facts) =>
  facts.email_client_resynced,

not_receiving_email_inbox_rule_redirecting:
  (facts) =>
    (
      facts.email_client_resynced &&
      !facts.first_receive_test_completed
    ) ||
    (
      facts.filter_disabled &&
      !facts.can_receive_email
    ),

    mailbox_full: (facts) =>
      facts.old_emails_archived,

    mailbox_full_archive_policy_not_applied:
      (facts) =>
        facts.old_emails_archived,
  },
}),

    test_application_launch:
      defineProcedureDecision({
        scenarios: {
          software_app_not_opening: (facts) =>
            facts.application_restarted &&
            !facts.application_working,

          email_application_will_not_open: (facts) =>
            facts.application_restarted &&
            !facts.application_working,

          email_client_corrupted_profile: (facts) =>
          (
            facts.application_restarted &&
            !facts.application_launch_tested
          ) ||
          (
            facts.application_launch_tested &&
            facts.email_client_profile_repaired &&
            !facts.application_working
          ),

          application_crash: (facts) =>
            facts.application_restarted &&
            !facts.application_working,

          software_update_required: (facts) =>
            facts.software_update_installed &&
            !facts.application_working,

          software_app_license_not_assigned:
            (facts) =>
              facts.software_license_assigned &&
              !facts.application_working,
        },
      }),

    test_performance:
      defineProcedureDecision({
        scenarios: {
          too_many_apps_running: (facts) =>
            facts.apps_closed,

          low_memory: (facts) =>
            facts.memory_heavy_apps_closed &&
            !facts.memory_ok,
        },
      }),

    test_shared_drive_access:
      defineProcedureDecision({
        scenarios: {
          shared_drive_access_issue: (facts) =>
            facts.shared_drive_access_granted,

          shared_drive_group_membership_missing:
            (facts) =>
              facts.user_added_to_group,
        },
      }),

    test_network_drive_access:
      defineProcedureDecision({
        scenarios: {
          network_drive_missing: (facts) =>
            facts.network_drive_remapped &&
            !facts.network_drive_access_working,

          network_drive_vpn_required_first:
            (facts) =>
              facts.network_drive_remapped &&
              !facts.network_drive_access_working,
        },
      }),

    test_permission_access:
      defineProcedureDecision({
        scenarios: {
          permissions_denied: (facts) =>
            facts.required_permission_granted &&
            !facts.permission_access_working,
        },
      }),

test_folder_access:
  defineProcedureDecision({
    scenarios: {
      folder_access_missing: (facts) =>
        facts.folder_access_granted &&
        !facts.folder_access_working,

      folder_access_required_security_group_missing:
        (facts) =>
          (
            facts.folder_permissions_checked &&
            !facts.first_folder_access_tested
          ) ||
          (
            facts.first_folder_access_tested &&
            facts.user_added_to_group &&
            !facts.folder_access_working
          ),
    },
  }),

    test_input_device:
      defineProcedureDecision({
        scenarios: {
          mouse_keyboard_not_working: (facts) =>
            facts.device_reconnected &&
            !facts.input_device_working,
        },
      }),

    print_test_page:
      defineProcedureDecision({
        scenarios: {
          printer_not_working: (facts) =>
            facts.printer_restarted &&
            !facts.printer_working,

          printer_wrong_default_printer:
            (facts) =>
              facts.correct_default_printer_set &&
              !facts.printer_working,

          network_printer_not_printing:
            (facts) =>
              facts.printer_port_configuration_corrected &&
              facts.queued_document_printed &&
              !facts.windows_test_page_printed,
        },
      }),

test_printing:
  defineProcedureDecision({ scenarios: { network_printer_not_printing: (facts) => facts.identity_verified && !facts.printing_tested } }),
check_print_queue:
  defineProcedureDecision({ scenarios: { network_printer_not_printing: (facts) => (facts.printer_status_checked && !facts.print_queue_checked && !facts.queued_document_printed) || (facts.printer_port_configuration_corrected && facts.printer_ping_succeeded && facts.print_queue_checked && !facts.queued_document_printed) } }),
check_printer_port:
  defineProcedureDecision({ scenarios: { network_printer_not_printing: (facts) => facts.printer_network_configuration_checked && facts.printer_port_address !== facts.printer_ipv4_address && !facts.printer_port_checked } }),
check_printer_physical_status:
  defineProcedureDecision({ scenarios: { network_printer_not_printing: (facts) => facts.printing_tested && facts.printer_ethernet_connected && facts.printer_network_link_active && !facts.printer_physical_status_checked } }),
check_printer_network_configuration:
  defineProcedureDecision({ scenarios: { network_printer_not_printing: (facts) => facts.print_queue_checked && !facts.printer_network_configuration_checked } }),
correct_printer_port_configuration:
  defineProcedureDecision({ scenarios: { network_printer_not_printing: (facts) => facts.printer_port_checked && facts.printer_ping_succeeded && facts.printer_port_address !== facts.printer_ipv4_address && !facts.printer_port_configuration_corrected } }),
confirm_user_resolution:
  defineProcedureDecision({
    scenarios: {
      network_printer_not_printing: (facts) => facts.printer_port_configuration_corrected && facts.queued_document_printed && facts.windows_test_page_printed && !facts.user_resolution_confirmed,
      tcp_port_connectivity: (facts) => facts.application_connection_verified && !facts.user_resolution_confirmed,
      active_directory_locked_employee_account: (facts) => facts.recurring_lockout_confirmed && facts.outdated_credential_removed && facts.second_account_unlock_completed && facts.final_login_succeeded && facts.affected_network_resource_verified && !facts.user_resolution_confirmed,
    },
  }),
ping_printer:
  defineProcedureDecision({ scenarios: { network_printer_not_printing: (facts) => facts.command_prompt_opened && facts.printer_network_configuration_checked && facts.printer_port_checked && facts.printer_ipv4_address === "192.168.1.60" && !facts.printer_ping_succeeded } }),

      check_browser_cache:
  defineProcedureDecision({
    scenarios: {
      browser_running_slow: (facts) =>
        !facts.browser_cache_checked,

      browser_running_slow_extension: (facts) =>
        !facts.browser_cache_checked,
    },
  }),

clear_browser_cache:
  defineProcedureDecision({
    scenarios: {
      browser_running_slow: (facts) =>
        facts.browser_cache_checked &&
        !facts.browser_cache_cleared,

      browser_running_slow_extension: (facts) =>
        facts.browser_cache_checked &&
        !facts.browser_cache_cleared,
    },
  }),


test_browser_performance:
  defineProcedureDecision({
    scenarios: {
      browser_running_slow: (facts) =>
        facts.browser_cache_cleared &&
        !facts.browser_performance_ok,

      browser_running_slow_extension: (facts) =>
        facts.browser_cache_cleared &&
        (
          !facts.browser_performance_tested_after_cache ||
          (
            facts.unnecessary_extensions_disabled &&
            !facts.browser_performance_ok
          )
        ),
    },
  }),

    test_microphone:
  defineProcedureDecision({
    scenarios: {
      microphone_not_working: (facts) =>
        facts.microphone_enabled &&
        !facts.microphone_working,

      microphone_wrong_recording_device:
        (facts) =>
          (
            facts.microphone_settings_checked &&
            !facts.first_microphone_tested
          ) ||
          (
            facts.first_microphone_tested &&
            facts.correct_recording_device_selected &&
            !facts.microphone_working
          ),
    },
  }),

    test_webcam:
      defineProcedureDecision({
        scenarios: {
          webcam_not_working: (facts) =>
            facts.webcam_enabled,
        },
      }),

    test_mfa_login:
      defineProcedureDecision({
        scenarios: {
          mfa_code_not_working: (facts) =>
            facts.mfa_method_reset &&
            !facts.mfa_working,

          mfa_code_old_phone_still_registered:
            (facts) =>
              facts.mfa_method_reset &&
              !facts.mfa_working,
        },
      }),

    test_software_install:
      defineProcedureDecision({
        scenarios: {
          cannot_install_software: (facts) =>
            facts.install_permissions_granted &&
            !facts.software_install_working,

          cannot_install_software_admin_approval_required:
            (facts) =>
              facts.install_permissions_granted &&
              !facts.software_install_working,
        },
      }),

    test_dual_display:
  defineProcedureDecision({
    scenarios: {
      second_monitor_not_detected: (facts) =>
        facts.second_monitor_detected &&
        !facts.dual_display_working,

      second_monitor_display_disabled:
        (facts) =>
          (
            facts.second_monitor_detected &&
            !facts.first_dual_display_tested
          ) ||
          (
            facts.first_dual_display_tested &&
            facts.second_display_enabled &&
            !facts.dual_display_working
          ),
    },
  }),

    grant_install_permissions:
      defineProcedureDecision({
        scenarios: {
          cannot_install_software: (facts) =>
            facts.install_permissions_checked &&
            !facts.install_permissions_granted,

          cannot_install_software_admin_approval_required:
            (facts) =>
              facts.install_permissions_checked &&
              facts.software_request_approved &&
              !facts.install_permissions_granted,
        },
      }),

    grant_shared_drive_access:
      defineProcedureDecision({
        scenarios: {
          shared_drive_access_issue: (facts) =>
            facts.shared_drive_permissions_checked &&
            !facts.shared_drive_access_granted,
        },
      }),

    grant_folder_access:
      defineProcedureDecision({
        scenarios: {
          folder_access_missing: (facts) =>
            facts.folder_permissions_checked &&
            !facts.folder_access_granted,
        },
      }),

      check_folder_security_group:
  defineProcedureDecision({
    scenarios: {
      folder_access_required_security_group_missing:
        (facts) =>
          facts.first_folder_access_tested &&
          !facts.folder_security_group_checked,
    },
  }),

    grant_required_permission:
      defineProcedureDecision({
        scenarios: {
          permissions_denied: (facts) =>
            facts.user_permissions_checked &&
            !facts.required_permission_granted,
        },
      }),

    check_shared_mailbox_membership:
  defineProcedureDecision({
    scenarios: {
      shared_mailbox_missing: (facts) =>
        !facts.shared_mailbox_membership_checked,

      shared_mailbox_outlook_profile_not_updated:
        (facts) =>
          !facts.shared_mailbox_membership_checked,

      shared_mailbox_automapping_missing:
        (facts) =>
          !facts.shared_mailbox_membership_checked,
    },
  }),

grant_shared_mailbox_access:
  defineProcedureDecision({
    scenarios: {
      shared_mailbox_missing: (facts) =>
        facts.shared_mailbox_membership_checked &&
        !facts.shared_mailbox_access_granted,
    },
  }),

test_shared_mailbox_access:
  defineProcedureDecision({
    scenarios: {
      shared_mailbox_missing: (facts) =>
        facts.shared_mailbox_access_granted &&
        !facts.shared_mailbox_working,

      shared_mailbox_outlook_profile_not_updated:
        (facts) =>
          (
            facts.shared_mailbox_membership_checked &&
            !facts.shared_mailbox_access_tested
          ) ||
          (
            facts.shared_mailbox_access_tested &&
            facts.shared_mailbox_added_to_outlook_profile &&
            !facts.shared_mailbox_working
          ),

      shared_mailbox_automapping_missing:
        (facts) =>
          (
            facts.shared_mailbox_membership_checked &&
            !facts.shared_mailbox_access_tested
          ) ||
          (
            facts.shared_mailbox_access_tested &&
            facts.shared_mailbox_automapping_enabled &&
            facts.application_restarted &&
            !facts.shared_mailbox_working
          ),
    },
  }),

check_shared_mailbox_automapping:
  defineProcedureDecision({
    scenarios: {
      shared_mailbox_automapping_missing:
        (facts) =>
          facts.shared_mailbox_access_tested &&
          !facts.shared_mailbox_automapping_checked,
    },
  }),

enable_shared_mailbox_automapping:
  defineProcedureDecision({
    scenarios: {
      shared_mailbox_automapping_missing:
        (facts) =>
          facts.shared_mailbox_automapping_checked &&
          !facts.shared_mailbox_automapping_enabled,
    },
  }),
    request_unlock:
  defineProcedureDecision({
    scenarios: {
      account_lockout: (facts) =>
        facts.identity_verified &&
        facts.account_locked &&
        !facts.unlock_requested,

      account_lockout_saved_credentials:
        (facts) =>
          facts.identity_verified &&
          facts.account_locked &&
          !facts.unlock_requested &&
          (
            !facts.first_sign_in_attempted ||
            facts.saved_credentials_updated
          ),
    },
  }),

confirm_unlock:
  defineProcedureDecision({
    scenarios: {
      account_lockout: (facts) =>
        facts.unlock_requested &&
        facts.account_locked,

      account_lockout_saved_credentials:
        (facts) =>
          facts.unlock_requested &&
          facts.account_locked &&
          (
            !facts.first_sign_in_attempted ||
            facts.saved_credentials_updated
          ),
    },
  }),

test_sign_in:
  defineProcedureDecision({
    scenarios: {
      password_reset: (facts) =>
        facts.password_updated &&
        !facts.can_login_now,

      password_reset_recovery_email_never_arrives:
        (facts) =>
          facts.password_updated &&
          !facts.can_login_now,

      password_reset_recovery_email_outdated:
        (facts) =>
          facts.password_updated &&
          !facts.can_login_now,

      account_lockout_saved_credentials:
        (facts) =>
          (
            !facts.first_sign_in_attempted &&
            !facts.account_locked
          ) ||
          (
            facts.first_sign_in_attempted &&
            facts.saved_credentials_updated &&
            facts.account_unlocked_after_fix &&
            !facts.account_locked &&
            !facts.can_login_now
          ),
    },
  }),

review_failed_authentication_attempts:
  defineProcedureDecision({
    scenarios: {
      account_lockout_saved_credentials:
        (facts) =>
          facts.first_sign_in_attempted &&
          facts.account_locked &&
          !facts.repeated_authentication_attempts_reviewed,
    },
  }),

update_saved_credentials:
  defineProcedureDecision({
    scenarios: {
      account_lockout_saved_credentials:
        (facts) =>
          facts.repeated_authentication_attempts_reviewed &&
          facts.account_locked &&
          !facts.saved_credentials_updated,
    },
  }),


check_login_error:
  defineProcedureDecision({
    scenarios: {
      active_directory_locked_employee_account: (facts) =>
        facts.identity_verified && !facts.login_error_checked,
    },
  }),

open_active_directory:
  defineProcedureDecision({
    scenarios: {
      active_directory_locked_employee_account: (facts) =>
        facts.login_error_checked && !facts.active_directory_opened,
    },
  }),

locate_user_account:
  defineProcedureDecision({
    scenarios: {
      active_directory_locked_employee_account: (facts) =>
        facts.active_directory_opened && !facts.user_account_located,
    },
  }),

check_account_status:
  defineProcedureDecision({
    scenarios: {
      active_directory_locked_employee_account: (facts) =>
        (facts.user_account_located && !facts.account_status_checked) ||
        (facts.account_unlocked && facts.user_login_succeeded && facts.recurring_lockout_triggered && !facts.recurring_lockout_confirmed),
    },
  }),

unlock_user_account:
  defineProcedureDecision({
    scenarios: {
      active_directory_locked_employee_account: (facts) =>
        facts.account_locked && (
          (facts.account_status_checked && !facts.account_unlocked) ||
          (facts.recurring_authentication_stopped && facts.recurring_lockout_confirmed && !facts.second_account_unlock_completed)
        ),
    },
  }),

test_user_login:
  defineProcedureDecision({
    scenarios: {
      active_directory_locked_employee_account: (facts) =>
        !facts.account_locked && facts.account_enabled && (
          (!facts.user_login_succeeded && facts.account_unlocked) ||
          (facts.second_account_unlock_completed && !facts.final_login_succeeded)
        ),
    },
  }),

review_account_lockout_events:
  defineProcedureDecision({ scenarios: { active_directory_locked_employee_account: (facts) => facts.recurring_lockout_confirmed && !facts.lockout_event_reviewed } }),

check_windows_credential_manager:
  defineProcedureDecision({ scenarios: { active_directory_locked_employee_account: (facts) => facts.caller_workstation_identified && !facts.outdated_credential_identified } }),

remove_outdated_credential:
  defineProcedureDecision({ scenarios: { active_directory_locked_employee_account: (facts) => facts.outdated_credential_identified && !facts.outdated_credential_removed } }),

test_affected_network_resource:
  defineProcedureDecision({ scenarios: { active_directory_locked_employee_account: (facts) => facts.final_login_succeeded && !facts.affected_network_resource_verified } }),
    confirm_reset:
      defineProcedureDecision({
        scenarios: {
          password_reset: (facts) =>
            facts.code_sent &&
            !facts.reset_done,

          password_reset_recovery_email_never_arrives:
            (facts) =>
              facts.email_arrived &&
              facts.code_sent &&
              !facts.reset_done,

          password_reset_recovery_email_outdated:
            (facts) =>
              facts.code_sent &&
              !facts.reset_done,
        },
      }),

      set_new_password:
  defineProcedureDecision({
    scenarios: {
      password_reset: (facts) =>
        facts.reset_done &&
        !facts.password_updated,

      password_reset_recovery_email_never_arrives:
        (facts) =>
          facts.reset_done &&
          facts.email_arrived &&
          !facts.password_updated,

      password_reset_recovery_email_outdated:
        (facts) =>
          facts.reset_done &&
          !facts.password_updated,
    },
  }),

    confirm_connection:
      defineProcedureDecision({
        scenarios: {
          vpn_access_issue: (facts) =>
            facts.vpn_access_enabled,

          vpn_mfa_dependency_missing:
            (facts) =>
              facts.vpn_access_enabled &&
              facts.mfa_method_reset,
        },
      }),

    confirm_storage_available:
      defineProcedureDecision({
        scenarios: {
          disk_space_full: (facts) =>
            facts.temp_files_cleared,
        },
      }),

          enable_vpn_access:
  defineProcedureDecision({
    scenarios: {
      vpn_access_issue: (facts) =>
        facts.vpn_access_checked &&
        !facts.vpn_access_enabled,

      network_drive_vpn_required_first:
        (facts) =>
          facts.vpn_access_checked &&
          !facts.vpn_access_enabled,
    },
  }),

    enable_email_client:
      defineProcedureDecision({
        scenarios: {
          email_not_sending: (facts) =>
            facts.email_status_checked &&
            !facts.email_client_online,
        },
      }),

    enable_microphone:
      defineProcedureDecision({
        scenarios: {
          microphone_not_working: (facts) =>
            facts.microphone_settings_checked &&
            !facts.microphone_enabled,
        },
      }),

    enable_webcam:
      defineProcedureDecision({
        scenarios: {
          webcam_not_working: (facts) =>
            facts.webcam_settings_checked &&
            !facts.webcam_enabled,
        },
      }),

    restart_application:
  defineProcedureDecision({
    scenarios: {
      software_app_not_opening: (facts) =>
        facts.app_status_checked &&
        !facts.application_restarted,

      email_application_will_not_open: (facts) =>
        facts.app_status_checked &&
        !facts.application_restarted,

      email_client_corrupted_profile: (facts) =>
        facts.app_status_checked &&
        !facts.application_restarted,

      shared_mailbox_automapping_missing:
        (facts) =>
          facts.shared_mailbox_automapping_enabled &&
          !facts.application_restarted,

      application_crash: (facts) =>
        facts.app_status_checked &&
        !facts.application_restarted,
    },
  }),

    restart_printer:
      defineProcedureDecision({
        scenarios: {
          printer_not_working: (facts) =>
            facts.printer_checked &&
            !facts.printer_restarted,
        },
      }),

restart_network_adapter:
  defineProcedureDecision({
    scenarios: {
      internet_no_access: (facts) =>
        facts.network_adapter_checked &&
        !facts.network_adapter_restarted,

      internet_no_access_proxy: (facts) =>
        facts.incorrect_proxy_disabled &&
        !facts.network_adapter_restarted,

      slow_network_connection: (facts) =>
        facts.network_adapter_checked &&
        !facts.network_adapter_restarted,
    },
  }),

  check_email_login_status:
defineProcedureDecision({
  scenarios: {
    email_login_issue: (facts) =>
      !facts.email_login_checked,

    email_login_cached_credentials:
      (facts) =>
        !facts.email_login_checked,

    email_client_not_syncing_cached_session_stuck:
      (facts) =>
        facts.sync_settings_checked &&
        !facts.email_login_checked,
  },
}),

  check_saved_email_credentials:
  defineProcedureDecision({
    scenarios: {
      email_login_cached_credentials:
        (facts) =>
          facts.first_email_login_tested &&
          !facts.saved_email_credentials_checked,
    },
  }),

update_saved_email_credentials:
  defineProcedureDecision({
    scenarios: {
      email_login_cached_credentials:
        (facts) =>
          facts.saved_email_credentials_checked &&
          !facts.saved_email_credentials_updated,
    },
  }),

  test_email_login:
  defineProcedureDecision({
    scenarios: {
      email_login_issue: (facts) =>
        facts.email_session_reset &&
        !facts.email_login_working,

      email_login_cached_credentials:
        (facts) =>
          (
            facts.email_login_checked &&
            !facts.first_email_login_tested
          ) ||
          (
            facts.first_email_login_tested &&
            facts.saved_email_credentials_updated &&
            !facts.email_login_working
          ),
    },
  }),

    reset_email_session:
      defineProcedureDecision({
        scenarios: {
          email_login_issue: (facts) =>
            facts.email_login_checked &&
            !facts.email_session_reset,

          email_client_not_syncing_cached_session_stuck:
            (facts) =>
              facts.email_login_checked &&
              !facts.email_session_reset,
        },
      }),

    reset_mfa_method:
      defineProcedureDecision({
        scenarios: {
          mfa_code_not_working: (facts) =>
            facts.mfa_status_checked &&
            !facts.mfa_method_reset,

          vpn_mfa_dependency_missing:
            (facts) =>
              facts.mfa_status_checked &&
              !facts.mfa_method_reset,

          mfa_code_old_phone_still_registered:
            (facts) =>
              facts.mfa_status_checked &&
              facts.registered_mfa_device_checked &&
              facts.old_mfa_device_removed &&
              !facts.mfa_method_reset,
        },
      }),

      check_inbox_filters:
  defineProcedureDecision({
    scenarios: {
      not_receiving_email_inbox_rule_redirecting:
  (facts) =>
    facts.first_receive_test_completed &&
    !facts.inbox_filter_checked,

      password_reset_recovery_email_never_arrives:
        (facts) =>
          facts.identity_verified &&
          facts.code_sent &&
          !facts.inbox_filter_checked,
    },
  }),

  disable_inbox_filter:
  defineProcedureDecision({
    scenarios: {

      not_receiving_email_inbox_rule_redirecting:
  (facts) =>
    facts.inbox_filter_checked &&
    facts.inbox_filter_enabled &&
    !facts.filter_disabled,

      password_reset_recovery_email_never_arrives:
        (facts) =>
          facts.inbox_filter_checked &&
          facts.inbox_filter_enabled,
    },
  }),

check_email_status:
  defineProcedureDecision({
    scenarios: {
      email_not_sending: (facts) =>
        !facts.email_status_checked,

      email_not_sending_outbox: (facts) =>
        !facts.email_status_checked,

      email_client_working_offline: (facts) =>
        !facts.email_status_checked,
    },
  }),

  check_outbox:
  defineProcedureDecision({
    scenarios: {
      email_not_sending_outbox: (facts) =>
        facts.first_send_test_completed &&
        !facts.outbox_checked,
    },
  }),

  send_stuck_outbox_email:
  defineProcedureDecision({
    scenarios: {
      email_not_sending_outbox: (facts) =>
        facts.outbox_checked &&
        !facts.stuck_outbox_email_sent,
    },
  }),

    check_app_status:
      defineProcedureDecision({
        scenarios: {
          software_app_not_opening: (facts) =>
            !facts.app_status_checked,

          email_application_will_not_open: (facts) =>
            !facts.app_status_checked,

          email_client_corrupted_profile: (facts) =>
            !facts.app_status_checked,

          application_crash: (facts) =>
            !facts.app_status_checked,

          software_app_license_not_assigned:
            (facts) =>
              !facts.app_status_checked,
        },
      }),

check_vpn_access:
  defineProcedureDecision({
    scenarios: {
      vpn_access_issue: (facts) =>
        !facts.vpn_access_checked,

      vpn_mfa_dependency_missing:
        (facts) =>
          !facts.vpn_access_checked,

      network_drive_vpn_required_first:
        (facts) =>
          !facts.vpn_access_checked,
    },
  }),

check_network_status:
defineProcedureDecision({
  scenarios: {
    internet_no_access: (facts) =>
      !facts.network_checked,

    internet_no_access_proxy: (facts) =>
      !facts.network_checked,

    dns_incorrect_configuration: (facts) =>
      !facts.network_status_checked,

    dhcp_apipa_troubleshooting: (facts) =>
      !facts.network_status_checked,

    dns_lookup_website_not_opening: (facts) =>
      facts.identity_verified &&
      !facts.network_status_checked,

    tcp_port_connectivity: (facts) =>
      facts.application_error_checked &&
      facts.physical_network_connection_checked &&
      !facts.network_status_checked,
  },
}),

open_command_prompt:
  defineProcedureDecision({
    scenarios: {
      dhcp_apipa_troubleshooting: (facts) =>
        facts.network_status_checked &&
        !facts.command_prompt_opened,
      network_printer_not_printing: (facts) =>
        facts.printer_port_checked &&
        !facts.command_prompt_opened,
      dns_lookup_website_not_opening: (facts) =>
        facts.website_access_tested &&
        !facts.command_prompt_opened,
    },
  }),

ipconfig:
  defineProcedureDecision({
    scenarios: {
      dhcp_apipa_troubleshooting: (facts) =>
        facts.command_prompt_opened &&
        !facts.ip_configuration_inspected,

    },
  }),

check_application_error:
  defineProcedureDecision({ scenarios: { tcp_port_connectivity: (facts) => facts.identity_verified && !facts.application_error_checked } }),
check_physical_network_connection:
  defineProcedureDecision({ scenarios: { tcp_port_connectivity: (facts) => facts.application_error_checked && !facts.physical_network_connection_checked } }),
check_application_connection_settings:
  defineProcedureDecision({ scenarios: { tcp_port_connectivity: (facts) => facts.network_status_checked && !facts.application_connection_settings_checked } }),
correct_application_port_configuration:
  defineProcedureDecision({ scenarios: { tcp_port_connectivity: (facts) => facts.tcp_port_443_test_failed && facts.tcp_port_8443_test_succeeded && !facts.application_port_configuration_corrected } }),
test_application_connection:
  defineProcedureDecision({ scenarios: { tcp_port_connectivity: (facts) => facts.application_port_configuration_corrected && facts.tcp_port_8443_test_succeeded && !facts.application_connection_verified } }),
open_powershell:
  defineProcedureDecision({ scenarios: { tcp_port_connectivity: (facts) => facts.app_connectivity_article_opened && !facts.powershell_opened } }),
test_tcp_port_443:
  defineProcedureDecision({ scenarios: { tcp_port_connectivity: (facts) => facts.application_server_ping_succeeded && !facts.tcp_port_443_test_failed } }),
test_tcp_port_8443:
  defineProcedureDecision({ scenarios: { tcp_port_connectivity: (facts) => facts.application_server_ping_succeeded && facts.tcp_port_443_test_failed && !facts.tcp_port_8443_test_succeeded } }),
open_kb_app_connectivity:
  defineProcedureDecision({ scenarios: { tcp_port_connectivity: (facts) => facts.knowledge_base_opened && !facts.app_connectivity_article_opened } }),
ping_application_server:
  defineProcedureDecision({ scenarios: { tcp_port_connectivity: (facts) => facts.powershell_opened && !facts.application_server_ping_succeeded } }),

test_website_access:
  defineProcedureDecision({
    scenarios: {
      dns_lookup_website_not_opening: (facts) =>
        facts.identity_verified &&
        !facts.website_access_tested,
    },
  }),

open_it_knowledge_base:
  defineProcedureDecision({
    scenarios: {
      dhcp_apipa_troubleshooting: (facts) =>
        facts.ip_configuration_inspected &&
        !facts.knowledge_base_opened,
      tcp_port_connectivity: (facts) =>
        facts.application_connection_settings_checked &&
        !facts.knowledge_base_opened,
    },
  }),

open_kb_204:
  defineProcedureDecision({
    scenarios: {
      dhcp_apipa_troubleshooting: (facts) =>
        facts.knowledge_base_opened &&
        !facts.kb_204_opened,
    },
  }),

ping_default_gateway:
  defineProcedureDecision({
    scenarios: {
      dhcp_apipa_troubleshooting: (facts) =>
        (
          facts.ip_configuration_inspected &&
          facts.kb_204_opened &&
          !facts.dhcp_lease_renewed &&
          !facts.initial_gateway_ping_failed
        ) || (
          facts.renewed_configuration_inspected &&
          !facts.renewed_gateway_ping_succeeded
        ),

    },
  }),

ping_external_ip:
  defineProcedureDecision({
    scenarios: {
      dhcp_apipa_troubleshooting: (facts) =>
        (
          facts.initial_gateway_ping_failed &&
          !facts.initial_external_ping_failed
        ) || (
          facts.renewed_gateway_ping_succeeded &&
          !facts.renewed_external_ping_succeeded
        ),

    },
  }),

ipconfig_displaydns:
  defineProcedureDecision({
    scenarios: {
      dns_lookup_website_not_opening: (facts) =>
        (!facts.initial_dns_cache_inspected && facts.configured_dns_lookup_succeeded) ||
        (facts.dns_cache_flushed && facts.portal_hostname_ping_succeeded && !facts.updated_dns_cache_inspected),
    },
  }),

ipconfig_flushdns:
  defineProcedureDecision({
    scenarios: {
      dns_lookup_website_not_opening: (facts) =>
        facts.initial_dns_cache_inspected && !facts.dns_cache_flushed,
    },
  }),

ping_portal_hostname:
  defineProcedureDecision({
    scenarios: {
      dns_lookup_website_not_opening: (facts) =>
        facts.dns_cache_flushed && !facts.portal_hostname_ping_succeeded,
    },
  }),

ipconfig_all:
  defineProcedureDecision({
    scenarios: {
      dhcp_apipa_troubleshooting: (facts) =>
        (
          facts.initial_external_ping_failed &&
          !facts.initial_detailed_configuration_inspected &&
          !facts.dhcp_lease_renewed
        ) || (
          facts.dhcp_lease_renewed &&
          !facts.renewed_configuration_inspected
        ),

    },
  }),

ipconfig_renew:
  defineProcedureDecision({
    scenarios: {
      dhcp_apipa_troubleshooting: (facts) =>
        facts.initial_detailed_configuration_inspected &&
        !facts.dhcp_lease_renewed &&
        facts.ipv4_address === "169.254.23.18" &&
        facts.subnet_mask === "255.255.0.0" &&
        facts.default_gateway === null &&
        facts.dhcp_enabled &&
        facts.wifi_connected,
    },
  }),

nslookup:
  defineProcedureDecision({
    scenarios: {
      dhcp_apipa_troubleshooting: (facts) =>
        facts.renewed_external_ping_succeeded &&
        facts.dhcp_server === "192.168.1.10" &&
        facts.dns_server === "192.168.1.10" &&
        !facts.dns_resolution_succeeded,

      dns_lookup_website_not_opening: (facts) =>
        facts.command_prompt_opened &&
        !facts.configured_dns_lookup_succeeded,
    },
  }),

check_proxy_settings:
  defineProcedureDecision({
    scenarios: {
      internet_no_access_proxy: (facts) =>
        facts.first_internet_tested &&
        !facts.proxy_settings_checked,
    },
  }),

disable_incorrect_proxy:
  defineProcedureDecision({
    scenarios: {
      internet_no_access_proxy: (facts) =>
        facts.proxy_settings_checked &&
        !facts.incorrect_proxy_disabled,
    },
  }),

  check_wifi_profile:
  defineProcedureDecision({
    scenarios: {
      cannot_connect_wifi_corrupted_profile: (facts) =>
        facts.first_connection_tested &&
        !facts.wifi_profile_checked,
    },
  }),

remove_corrupted_wifi_profile:
  defineProcedureDecision({
    scenarios: {
      cannot_connect_wifi_corrupted_profile: (facts) =>
        facts.wifi_profile_checked &&
        !facts.corrupted_wifi_profile_removed,
    },
  }),

reconnect_wifi:
  defineProcedureDecision({
    scenarios: {
      cannot_connect_wifi_corrupted_profile: (facts) =>
        facts.corrupted_wifi_profile_removed &&
        !facts.wifi_reconnected,
    },
  }),

check_disk_space:
      defineProcedureDecision({
        scenarios: {
          disk_space_full: (facts) =>
            !facts.disk_checked,
        },
      }),

    check_memory_usage:
      defineProcedureDecision({
        scenarios: {
          low_memory: (facts) =>
            !facts.memory_checked,
        },
      }),

    check_running_apps:
      defineProcedureDecision({
        scenarios: {
          too_many_apps_running: (facts) =>
            !facts.apps_checked,
        },
      }),

    check_device_connection:
      defineProcedureDecision({
        scenarios: {
          mouse_keyboard_not_working: (facts) =>
            !facts.device_connection_checked,
        },
      }),

    check_microphone_settings:
  defineProcedureDecision({
    scenarios: {
      microphone_not_working: (facts) =>
        !facts.microphone_settings_checked,

      microphone_wrong_recording_device:
        (facts) =>
          !facts.microphone_settings_checked,
    },
  }),

  check_recording_device:
  defineProcedureDecision({
    scenarios: {
      microphone_wrong_recording_device:
        (facts) =>
          facts.first_microphone_tested &&
          !facts.recording_device_checked,
    },
  }),

  select_recording_device:
  defineProcedureDecision({
    scenarios: {
      microphone_wrong_recording_device:
        (facts) =>
          facts.recording_device_checked &&
          !facts.correct_recording_device_selected,
    },
  }),

    check_webcam_settings:
      defineProcedureDecision({
        scenarios: {
          webcam_not_working: (facts) =>
            !facts.webcam_settings_checked,
        },
      }),

          close_unnecessary_apps:
      defineProcedureDecision({
        scenarios: {
          too_many_apps_running: (facts) =>
            facts.apps_checked &&
            !facts.apps_closed,
        },
      }),

    close_memory_heavy_apps:
      defineProcedureDecision({
        scenarios: {
          low_memory: (facts) =>
            facts.memory_checked &&
            !facts.memory_heavy_apps_closed,
        },
      }),

    reconnect_device:
      defineProcedureDecision({
        scenarios: {
          mouse_keyboard_not_working: (facts) =>
            facts.device_connection_checked &&
            !facts.device_reconnected,
        },
      }),

    reconnect_ethernet_cable:
      defineProcedureDecision({
        scenarios: {
          ethernet_not_connected: (facts) =>
            facts.ethernet_checked &&
            !facts.ethernet_cable_reconnected,
        },
      }),

    clear_temp_files:
      defineProcedureDecision({
        scenarios: {
          disk_space_full: (facts) =>
            facts.disk_checked &&
            !facts.temp_files_cleared,
        },
      }),

          compress_attachment:
      defineProcedureDecision({
        scenarios: {
          attachment_too_large: (facts) =>
            facts.attachment_size_checked &&
            !facts.attachment_compressed,
        },
      }),

    install_software_update:
      defineProcedureDecision({
        scenarios: {
          software_update_required: (facts) =>
            facts.software_version_checked &&
            !facts.software_update_installed,
        },
      }),

    disable_unnecessary_extensions:
  defineProcedureDecision({
    scenarios: {
      browser_running_slow_extension: (facts) =>
        facts.browser_extensions_checked &&
        !facts.unnecessary_extensions_disabled,
    },
  }),

    remap_network_drive:
      defineProcedureDecision({
        scenarios: {
          network_drive_missing: (facts) =>
            facts.network_drive_mapping_checked &&
            !facts.network_drive_remapped,

          network_drive_vpn_required_first:
            (facts) =>
              facts.network_drive_mapping_checked &&
              !facts.network_drive_remapped,
        },
      }),

    repair_file_association:
      defineProcedureDecision({
        scenarios: {
          cannot_open_file: (facts) =>
            facts.file_association_checked &&
            !facts.file_association_repaired,
        },
      }),

          apply_archive_policy:
      defineProcedureDecision({
        scenarios: {
          mailbox_full_archive_policy_not_applied:
            (facts) =>
              facts.mailbox_storage_checked &&
              facts.archive_policy_checked &&
              !facts.archive_policy_applied,
        },
      }),

    archive_old_emails:
      defineProcedureDecision({
        scenarios: {
          mailbox_full: (facts) =>
            facts.mailbox_storage_checked &&
            !facts.old_emails_archived,

          mailbox_full_archive_policy_not_applied:
            (facts) =>
              facts.mailbox_storage_checked &&
              facts.archive_policy_applied &&
              !facts.old_emails_archived,
        },
      }),

    assign_software_license:
      defineProcedureDecision({
        scenarios: {
          software_app_license_not_assigned:
            (facts) =>
              facts.license_assignment_checked &&
              !facts.software_license_assigned,
        },
      }),

    set_default_printer:
      defineProcedureDecision({
        scenarios: {
          printer_wrong_default_printer:
            (facts) =>
              facts.printer_checked &&
              facts.default_printer_checked &&
              !facts.correct_default_printer_set,
        },
      }),

    approve_software_request:
      defineProcedureDecision({
        scenarios: {
          cannot_install_software_admin_approval_required:
            (facts) =>
              facts.install_permissions_checked &&
              facts.software_request_checked &&
              !facts.software_request_approved,
        },
      }),
          remove_old_mfa_device:
      defineProcedureDecision({
        scenarios: {
          mfa_code_old_phone_still_registered:
            (facts) =>
              facts.mfa_status_checked &&
              facts.registered_mfa_device_checked &&
              !facts.old_mfa_device_removed,
        },
      }),

    add_shared_mailbox_to_outlook_profile:
      defineProcedureDecision({
        scenarios: {
          shared_mailbox_outlook_profile_not_updated:
            (facts) =>
              facts.outlook_mailbox_configuration_checked &&
              !facts.shared_mailbox_added_to_outlook_profile,
        },
      }),

    check_email_client_profile:
  defineProcedureDecision({
    scenarios: {
      email_client_corrupted_profile: (facts) =>
        facts.application_restarted &&
        facts.application_launch_tested &&
        !facts.application_working &&
        !facts.email_client_profile_checked,
    },
  }),

    repair_email_client_profile:
      defineProcedureDecision({
        scenarios: {
          email_client_corrupted_profile: (facts) =>
            facts.email_client_profile_checked &&
            !facts.email_client_profile_repaired,
        },
      }),

    detect_second_monitor:
  defineProcedureDecision({
    scenarios: {
      second_monitor_not_detected:
        (facts) =>
          facts.display_settings_checked &&
          !facts.second_monitor_detected,

      second_monitor_display_disabled:
        (facts) =>
          facts.display_settings_checked &&
          !facts.second_monitor_detected,
    },
  }),
  check_display_enabled_status:
  defineProcedureDecision({
    scenarios: {
      second_monitor_display_disabled:
        (facts) =>
          facts.first_dual_display_tested &&
          !facts.display_enabled_status_checked,
    },
  }),
  enable_second_display:
  defineProcedureDecision({
    scenarios: {
      second_monitor_display_disabled:
        (facts) =>
          facts.display_enabled_status_checked &&
          !facts.second_display_enabled,
    },
  }),
          check_audio_output:
      defineProcedureDecision({
        scenarios: {
          audio_not_working: (facts) =>
            !facts.audio_output_checked,
        },
      }),

    check_volume_status:
      defineProcedureDecision({
        scenarios: {
          audio_not_working: (facts) =>
            facts.audio_output_checked &&
            !facts.volume_status_checked,
        },
      }),

    select_audio_output:
      defineProcedureDecision({
        scenarios: {
          audio_not_working: (facts) =>
            facts.volume_status_checked &&
            !facts.audio_output_selected,
        },
      }),

    test_audio:
      defineProcedureDecision({
        scenarios: {
          audio_not_working: (facts) =>
            facts.audio_output_selected &&
            !facts.audio_working,
        },
      }),
add_user_to_group:
  defineProcedureDecision({
    scenarios: {
      shared_drive_group_membership_missing:
        (facts) =>
          facts.shared_drive_permissions_checked &&
          !facts.user_added_to_group,

      folder_access_required_security_group_missing:
        (facts) =>
          facts.folder_security_group_checked &&
          !facts.user_added_to_group,
    },
  }),
    } satisfies ProcedureDecisionRegistry;