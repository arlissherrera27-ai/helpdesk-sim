import type { SimState } from "./types";
import type { ProcedureCommandKind } from "./procedureCatalog";

type ScenarioFacts = Exclude<
  SimState["scenarioFacts"],
  null
>;

export type ScenarioFactKind = ScenarioFacts["kind"];

export type ScenarioFactsFor<
  Kind extends ScenarioFactKind
> = Extract<
  ScenarioFacts,
  { kind: Kind }
>;

export type ScenarioProcedureRule<
  Kind extends ScenarioFactKind
> = (
  facts: ScenarioFactsFor<Kind>
) => boolean;

export type ScenarioProcedureRules<
  Kind extends ScenarioFactKind
> = Partial<
  Record<
    ProcedureCommandKind,
    ScenarioProcedureRule<Kind>
  >
>;

export type ScenarioDecisionRegistry = {
  [Kind in ScenarioFactKind]?:
    ScenarioProcedureRules<Kind>;
};

function defineScenarioProcedureRules<
  Kind extends ScenarioFactKind,
  const Rules extends ScenarioProcedureRules<Kind>
>(
  _scenarioKind: Kind,
  rules: Rules
): Rules {
  return rules;
}

export const scenarioDecisionRegistry = {
    cannot_connect_wifi:
      defineScenarioProcedureRules("cannot_connect_wifi", {
check_wifi_status: (facts) =>
  !facts.wifi_checked,

enable_wifi: (facts) =>
  facts.wifi_checked &&
  !facts.wifi_enabled,

test_connection: (facts) =>
  facts.wifi_enabled &&
  !facts.can_connect_wifi,
      }),
      cannot_connect_wifi_corrupted_profile:
  defineScenarioProcedureRules(
    "cannot_connect_wifi_corrupted_profile",
    {
      check_wifi_status: (facts) =>
        !facts.wifi_checked,

      test_connection: (facts) =>
        facts.wifi_checked &&
        (
          !facts.first_connection_tested ||
          (
            facts.wifi_reconnected &&
            !facts.can_connect_wifi
          )
        ),

      check_wifi_profile: (facts) =>
        facts.first_connection_tested &&
        !facts.wifi_profile_checked,

      remove_corrupted_wifi_profile: (facts) =>
        facts.wifi_profile_checked &&
        !facts.corrupted_wifi_profile_removed,

      reconnect_wifi: (facts) =>
        facts.corrupted_wifi_profile_removed &&
        !facts.wifi_reconnected,
    }
  ),
    account_lockout:
      defineScenarioProcedureRules("account_lockout", {
        request_unlock: (facts) =>
          !facts.unlock_requested,
      }),

account_lockout_saved_credentials:
  defineScenarioProcedureRules(
    "account_lockout_saved_credentials",
    {
      request_unlock: (facts) =>
        facts.account_locked &&
        !facts.unlock_requested &&
        (
          !facts.first_sign_in_attempted ||
          facts.saved_credentials_updated
        ),

      confirm_unlock: (facts) =>
        facts.account_locked &&
        facts.unlock_requested,

      test_sign_in: (facts) =>
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

      review_failed_authentication_attempts:
        (facts) =>
          facts.first_sign_in_attempted &&
          facts.account_locked &&
          !facts.repeated_authentication_attempts_reviewed,

      update_saved_credentials: (facts) =>
        facts.repeated_authentication_attempts_reviewed &&
        facts.account_locked &&
        !facts.saved_credentials_updated,
    }
  ),
              password_reset:
      defineScenarioProcedureRules("password_reset", {
        send_reset_code: (facts) =>
          !facts.code_sent,

        set_new_password: (facts) =>
  facts.code_sent &&
  facts.reset_done &&
  !facts.password_updated,

        test_sign_in: (facts) =>
          facts.reset_done &&
          facts.password_updated &&
          !facts.can_login_now,
      }),

    password_reset_recovery_email_never_arrives:
      defineScenarioProcedureRules("password_reset_recovery_email_never_arrives", {
        send_reset_code: (facts) =>
          !facts.code_sent,

        check_inbox_filters: (facts) =>
          facts.code_sent &&
          !facts.inbox_filter_checked,

        disable_inbox_filter: (facts) =>
          facts.inbox_filter_checked,

        resend_reset_code: (facts) =>
          facts.code_sent &&
          facts.inbox_filter_checked &&
          facts.inbox_filter_enabled === false &&
          !facts.email_arrived,

        set_new_password: (facts) =>
  facts.code_sent &&
  facts.reset_done &&
  !facts.password_updated,

        test_sign_in: (facts) =>
          facts.reset_done &&
          facts.password_updated &&
          !facts.can_login_now,
      }),

    password_reset_recovery_email_outdated:
      defineScenarioProcedureRules("password_reset_recovery_email_outdated", {
        verify_alternate_contact: (facts) =>
          !facts.alternate_contact_verified,

        update_recovery_email: (facts) =>
          facts.alternate_contact_verified &&
          !facts.recovery_email_updated,

        send_reset_code: (facts) =>
          facts.recovery_email_updated &&
          !facts.code_sent,

        set_new_password: (facts) =>
  facts.code_sent &&
  facts.reset_done &&
  !facts.password_updated,

        test_sign_in: (facts) =>
          facts.reset_done &&
          facts.password_updated &&
          !facts.can_login_now,
      }),
          mailbox_full:
      defineScenarioProcedureRules("mailbox_full", {
        check_mailbox_storage: (facts) =>
          !facts.mailbox_storage_checked,
      }),

    mailbox_full_archive_policy_not_applied:
      defineScenarioProcedureRules("mailbox_full_archive_policy_not_applied", {
        check_mailbox_storage: (facts) =>
          !facts.mailbox_storage_checked,

        check_archive_policy: (facts) =>
          facts.mailbox_storage_checked &&
          !facts.archive_policy_checked,
      }),

    email_login_issue:
      defineScenarioProcedureRules("email_login_issue", {
        check_email_login_status: (facts) =>
          !facts.email_login_checked,

        test_email_login: (facts) =>
          facts.email_session_reset &&
          !facts.email_login_working,
      }),

    email_client_not_syncing:
      defineScenarioProcedureRules("email_client_not_syncing", {
        check_sync_settings: (facts) =>
          !facts.sync_settings_checked,

        resync_email_client: (facts) =>
          facts.sync_settings_checked &&
          !facts.email_client_resynced,

        test_email_sync: (facts) =>
          facts.email_client_resynced &&
          !facts.email_sync_working,
      }),

    email_client_not_syncing_cached_session_stuck:
      defineScenarioProcedureRules("email_client_not_syncing_cached_session_stuck", {
        check_sync_settings: (facts) =>
          !facts.sync_settings_checked,

        check_email_login_status: (facts) =>
          facts.sync_settings_checked &&
          !facts.email_login_checked,

        resync_email_client: (facts) =>
          facts.sync_settings_checked &&
          facts.email_session_reset &&
          !facts.email_client_resynced,

        test_email_sync: (facts) =>
          facts.email_client_resynced &&
          !facts.email_sync_working,
      }),

    attachment_too_large:
      defineScenarioProcedureRules("attachment_too_large", {
        check_attachment_size: (facts) =>
          !facts.attachment_size_checked,
      }),
          not_receiving_email:
  defineScenarioProcedureRules("not_receiving_email", {
    check_sync_settings: (facts) =>
      !facts.sync_settings_checked,

    resync_email_client: (facts) =>
      facts.sync_settings_checked &&
      !facts.email_client_resynced,

    send_test_email: (facts) =>
      facts.email_client_resynced &&
      !facts.can_receive_email,
  }),

not_receiving_email_inbox_rule_redirecting:
  defineScenarioProcedureRules("not_receiving_email_inbox_rule_redirecting", {
    check_sync_settings: (facts) =>
      !facts.sync_settings_checked,

    resync_email_client: (facts) =>
      facts.sync_settings_checked &&
      !facts.email_client_resynced,

    send_test_email: (facts) =>
      (
        facts.email_client_resynced &&
        !facts.first_receive_test_completed
      ) ||
      (
        facts.filter_disabled &&
        !facts.can_receive_email
      ),

    check_inbox_filters: (facts) =>
      facts.first_receive_test_completed &&
      !facts.inbox_filter_checked,

    disable_inbox_filter: (facts) =>
      facts.inbox_filter_checked &&
      facts.inbox_filter_enabled &&
      !facts.filter_disabled,
  }),

    shared_mailbox_missing:
      defineScenarioProcedureRules("shared_mailbox_missing", {
        check_shared_mailbox_membership: (facts) =>
          !facts.shared_mailbox_membership_checked,

        test_shared_mailbox_access: (facts) =>
          facts.shared_mailbox_access_granted,
      }),

    shared_mailbox_outlook_profile_not_updated:
      defineScenarioProcedureRules("shared_mailbox_outlook_profile_not_updated", {
        check_shared_mailbox_membership: (facts) =>
          !facts.shared_mailbox_membership_checked,

        test_shared_mailbox_access: (facts) =>
          !facts.shared_mailbox_access_tested
            ? facts.shared_mailbox_membership_checked
            : facts.shared_mailbox_added_to_outlook_profile &&
              !facts.shared_mailbox_working,

        check_outlook_mailbox_configuration: (facts) =>
          facts.shared_mailbox_access_tested &&
          !facts.outlook_mailbox_configuration_checked,
      }),

      shared_mailbox_automapping_missing:
  defineScenarioProcedureRules(
    "shared_mailbox_automapping_missing",
    {
      check_shared_mailbox_membership: (facts) =>
        !facts.shared_mailbox_membership_checked,

      test_shared_mailbox_access: (facts) =>
        (
          facts.shared_mailbox_membership_checked &&
          !facts.shared_mailbox_access_tested
        ) ||
        (
          facts.shared_mailbox_access_tested &&
          facts.shared_mailbox_automapping_checked &&
          facts.shared_mailbox_automapping_enabled &&
          facts.application_restarted &&
          !facts.shared_mailbox_working
        ),

      check_shared_mailbox_automapping: (facts) =>
        facts.shared_mailbox_access_tested &&
        !facts.shared_mailbox_automapping_checked,

      enable_shared_mailbox_automapping: (facts) =>
        facts.shared_mailbox_automapping_checked &&
        !facts.shared_mailbox_automapping_enabled,

      restart_application: (facts) =>
        facts.shared_mailbox_automapping_enabled &&
        !facts.application_restarted,
    }
  ),

    internet_no_access:
      defineScenarioProcedureRules("internet_no_access", {
        check_network_status: (facts) =>
          !facts.network_checked,

        check_network_adapter: (facts) =>
          facts.network_checked &&
          !facts.network_adapter_checked,

        test_internet_connection: (facts) =>
          facts.network_adapter_restarted &&
          !facts.internet_restored,
      }),

      internet_no_access_proxy:
  defineScenarioProcedureRules(
    "internet_no_access_proxy",
    {
      check_network_status: (facts) =>
        !facts.network_checked,

      test_internet_connection: (facts) =>
        !facts.first_internet_tested ||
        (
          facts.network_adapter_restarted &&
          !facts.internet_restored
        ),

      check_proxy_settings: (facts) =>
        facts.first_internet_tested &&
        !facts.proxy_settings_checked,

      disable_incorrect_proxy: (facts) =>
        facts.proxy_settings_checked &&
        !facts.incorrect_proxy_disabled,

      restart_network_adapter: (facts) =>
        facts.incorrect_proxy_disabled &&
        !facts.network_adapter_restarted,
    }
  ),

    slow_network_connection:
  defineScenarioProcedureRules("slow_network_connection", {
    check_network_speed: (facts) =>
      !facts.network_speed_checked,

    check_network_adapter: (facts) =>
      facts.network_speed_checked &&
      !facts.network_adapter_checked,
  }),

    ethernet_not_connected:
      defineScenarioProcedureRules("ethernet_not_connected", {
        check_ethernet_connection: (facts) =>
          !facts.ethernet_checked,
      }),

    browser_running_slow:
  defineScenarioProcedureRules("browser_running_slow", {
    check_browser_cache: (facts) =>
      !facts.browser_cache_checked,

    clear_browser_cache: (facts) =>
      facts.browser_cache_checked &&
      !facts.browser_cache_cleared,

    test_browser_performance: (facts) =>
      facts.browser_cache_cleared &&
      !facts.browser_performance_ok,
  }),

    second_monitor_not_detected:
      defineScenarioProcedureRules("second_monitor_not_detected", {
        check_display_connection: (facts) =>
          !facts.display_connection_checked,

        check_display_settings: (facts) =>
          facts.display_connection_checked &&
          !facts.display_settings_checked,
      }),

      second_monitor_display_disabled:
  defineScenarioProcedureRules(
    "second_monitor_display_disabled",
    {
      check_display_connection: (facts) =>
        !facts.display_connection_checked,

      check_display_settings: (facts) =>
        facts.display_connection_checked &&
        !facts.display_settings_checked,
    }
  ),

     browser_running_slow_extension:
  defineScenarioProcedureRules("browser_running_slow_extension", {
    check_browser_cache: (facts) =>
      !facts.browser_cache_checked,

    clear_browser_cache: (facts) =>
      facts.browser_cache_checked &&
      !facts.browser_cache_cleared,

    test_browser_performance: (facts) =>
      facts.browser_cache_cleared &&
      (
        !facts.browser_performance_tested_after_cache ||
        (
          facts.unnecessary_extensions_disabled &&
          !facts.browser_performance_ok
        )
      ),

    check_browser_extensions: (facts) =>
      facts.browser_performance_tested_after_cache &&
      !facts.browser_extensions_checked,

    disable_unnecessary_extensions: (facts) =>
      facts.browser_extensions_checked &&
      !facts.unnecessary_extensions_disabled,
  }),

    audio_not_working:
      defineScenarioProcedureRules("audio_not_working", {
        check_audio_output: (facts) =>
          !facts.audio_output_checked,

        check_volume_status: (facts) =>
          facts.audio_output_checked &&
          !facts.volume_status_checked,

        select_audio_output: (facts) =>
          facts.volume_status_checked &&
          !facts.audio_output_selected,

        test_audio: (facts) =>
          facts.audio_output_selected &&
          !facts.audio_working,
      }),

    printer_not_working:
      defineScenarioProcedureRules("printer_not_working", {
        check_printer_status: (facts) =>
          !facts.printer_checked,
      }),

    printer_wrong_default_printer:
      defineScenarioProcedureRules("printer_wrong_default_printer", {
        check_printer_status: (facts) =>
          !facts.printer_checked,

        check_default_printer: (facts) =>
          facts.printer_checked &&
          !facts.default_printer_checked,
      }),

    software_app_not_opening:
  defineScenarioProcedureRules("software_app_not_opening", {
    check_app_status: (facts) =>
      !facts.app_status_checked,

    restart_application: (facts) =>
      facts.app_status_checked &&
      !facts.application_restarted,

    test_application_launch: (facts) =>
      facts.application_restarted &&
      !facts.application_working,
  }),

        email_application_will_not_open:
      defineScenarioProcedureRules("email_application_will_not_open", {
        check_app_status: (facts) =>
          !facts.app_status_checked,

        restart_application: (facts) =>
          facts.app_status_checked &&
          !facts.application_restarted,

        test_application_launch: (facts) =>
          facts.application_restarted &&
          !facts.application_working,
      }),  

      email_client_corrupted_profile:
  defineScenarioProcedureRules("email_client_corrupted_profile", {
    check_app_status: (facts) =>
      !facts.app_status_checked,

    restart_application: (facts) =>
      facts.app_status_checked &&
      !facts.application_restarted,

    test_application_launch: (facts) =>
      !facts.application_restarted
        ? false
        : facts.email_client_profile_repaired
          ? !facts.application_working
          : true,

    check_email_client_profile: (facts) =>
  facts.application_restarted &&
  facts.application_launch_tested &&
  !facts.email_client_profile_checked,

    repair_email_client_profile: (facts) =>
      facts.email_client_profile_checked &&
      !facts.email_client_profile_repaired,
  }),

    application_crash:
      defineScenarioProcedureRules("application_crash", {
        check_app_status: (facts) =>
          !facts.app_status_checked,
      }),

    software_app_license_not_assigned:
      defineScenarioProcedureRules("software_app_license_not_assigned", {
        check_app_status: (facts) =>
          !facts.app_status_checked,

        check_license_assignment: (facts) =>
          facts.app_status_checked &&
          !facts.license_assignment_checked,
      }),

    software_update_required:
      defineScenarioProcedureRules("software_update_required", {
        check_software_version: (facts) =>
          !facts.software_version_checked,
      }),

    cannot_install_software:
      defineScenarioProcedureRules("cannot_install_software", {
        check_install_permissions: (facts) =>
          !facts.install_permissions_checked,
      }),

    cannot_install_software_admin_approval_required:
      defineScenarioProcedureRules(
        "cannot_install_software_admin_approval_required",
        {
          check_install_permissions: (facts) =>
            !facts.install_permissions_checked,

          check_software_request_status: (facts) =>
            facts.install_permissions_checked &&
            !facts.software_request_checked,
        }
      ),

    permissions_denied:
      defineScenarioProcedureRules("permissions_denied", {
        check_user_permissions: (facts) =>
          !facts.user_permissions_checked,
      }),
          shared_drive_access_issue:
      defineScenarioProcedureRules("shared_drive_access_issue", {
        check_shared_drive_permissions: (facts) =>
          !facts.shared_drive_permissions_checked,
      }),

    shared_drive_group_membership_missing:
      defineScenarioProcedureRules("shared_drive_group_membership_missing", {
        check_shared_drive_permissions: (facts) =>
          !facts.shared_drive_permissions_checked,
      }),

    network_drive_missing:
      defineScenarioProcedureRules("network_drive_missing", {
        check_network_drive_mapping: (facts) =>
          !facts.network_drive_mapping_checked,
      }),

    network_drive_vpn_required_first:
      defineScenarioProcedureRules("network_drive_vpn_required_first", {
        check_network_drive_mapping: (facts) =>
          facts.vpn_access_enabled &&
          !facts.network_drive_mapping_checked,
      }),

    cannot_open_file:
      defineScenarioProcedureRules("cannot_open_file", {
        check_file_open_error: (facts) =>
          !facts.file_open_error_checked,

        check_file_association: (facts) =>
          facts.file_open_error_checked &&
          !facts.file_association_checked,

        test_file_open: (facts) =>
          facts.file_association_repaired &&
          !facts.file_opens_successfully,
      }),

folder_access_missing:
  defineScenarioProcedureRules("folder_access_missing", {
    check_folder_permissions: (facts) =>
      !facts.folder_permissions_checked,
  }),

folder_access_required_security_group_missing:
  defineScenarioProcedureRules(
    "folder_access_required_security_group_missing",
    {
      check_folder_permissions: (facts) =>
        !facts.folder_permissions_checked,

      test_folder_access: (facts) =>
        (
          facts.folder_permissions_checked &&
          !facts.first_folder_access_tested
        ) ||
        (
          facts.first_folder_access_tested &&
          facts.folder_security_group_checked &&
          facts.user_added_to_group &&
          !facts.folder_access_working
        ),

      check_folder_security_group: (facts) =>
        facts.first_folder_access_tested &&
        !facts.folder_security_group_checked,

      add_user_to_group: (facts) =>
        facts.folder_security_group_checked &&
        !facts.user_added_to_group,
    }
  ),

mfa_code_not_working:
      defineScenarioProcedureRules("mfa_code_not_working", {
        check_mfa_status: (facts) =>
          !facts.mfa_status_checked,
      }),

    vpn_mfa_dependency_missing:
      defineScenarioProcedureRules("vpn_mfa_dependency_missing", {
        check_mfa_status: (facts) =>
        facts.vpn_access_checked &&
        facts.vpn_access_enabled &&
        !facts.mfa_status_checked,
      }),

    mfa_code_old_phone_still_registered:
      defineScenarioProcedureRules("mfa_code_old_phone_still_registered", {
        check_mfa_status: (facts) =>
          !facts.mfa_status_checked,

        check_registered_mfa_device: (facts) =>
          facts.mfa_status_checked &&
          !facts.registered_mfa_device_checked,
      }),
    } satisfies ScenarioDecisionRegistry;