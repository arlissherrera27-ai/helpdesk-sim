import type { ProcedureLearnMoreContent, ProcedureSideAnnotation } from "./procedurePresentation";

export type ActiveDirectoryLockoutProcedureEducation = {
  technicalLineIds: Readonly<Record<number, string>>;
  annotations: readonly ProcedureSideAnnotation[];
  learnMore: ProcedureLearnMoreContent;
};

const LEGACY_ACTIVE_DIRECTORY_LOCKOUT_EDUCATIONAL_CONTENT: Readonly<Record<number, ActiveDirectoryLockoutProcedureEducation>> = {
  1: {
    technicalLineIds: {
      0: "adlock-p01-identity",
      1: "adlock-p01-user-status",
    },
    annotations: [
      { id: "adlock-p01-a1", targetLineId: "adlock-p01-identity", content: "Identity Verification: Successful — The approved verification process has been completed." },
      { id: "adlock-p01-a2", targetLineId: "adlock-p01-employee", content: "Employee — Identifies the person requesting assistance." },
      { id: "adlock-p01-a3", targetLineId: "adlock-p01-user-status", content: "User Status: Verified — The requester's identity has been confirmed." },
    ],
    learnMore: {
      howToExecute: "1. Request the information required by organizational policy.\n2. Complete the approved identity-verification process.\n3. Confirm that verification succeeded.\n\nAlternative: An approved identity-verification workflow may use a service desk identity system or an authorized callback procedure.",
      whatItDoesAndHow: "Identity verification establishes that the technician is assisting the authorized person. The exact process depends on company policy and should not rely solely on information easily obtained from public sources.",
      whyThisMatters: "Account-access changes can affect security. Verification helps prevent unauthorized individuals from obtaining access to someone else's account. Names, account identifiers, workstation, domain, dates, and policy numbers in this simulation are scenario-specific examples, not universal Windows or Active Directory values.",
    },
  },
  2: {
    technicalLineIds: {
      0: "adlock-p02-app",
      2: "adlock-p02-error",
      4: "adlock-p02-unable",
    },
    annotations: [
      { id: "adlock-p02-a1", targetLineId: "adlock-p02-workstation", content: "Workstation — Identifies the computer where the issue occurs." },
      { id: "adlock-p02-a2", targetLineId: "adlock-p02-account", content: "Sign-in Account — Identifies the domain account used." },
      { id: "adlock-p02-a3", targetLineId: "adlock-p02-message", content: "Windows Message — Reports that Windows considers the account locked." },
      { id: "adlock-p02-a4", targetLineId: "adlock-p02-result", content: "Sign-in Result — The attempted sign-in was unsuccessful." },
    ],
    learnMore: {
      howToExecute: "1. Ask the employee to show the sign-in error.\n2. Observe the displayed Windows message.\n3. Identify the account being used.\n4. Record the exact message without requesting the employee's password.\n\nAlternative: If the employee cannot reproduce the message, review an approved screenshot or documented error supplied through the service desk.",
      whatItDoesAndHow: "Windows displays authentication errors when sign-in cannot be completed. The message can distinguish an account-lockout condition from other authentication failures.",
      whyThisMatters: "The technician has confirmed the reported symptom. A Windows error message is evidence of the current failure but does not independently establish what caused the account to enter that state.",
    },
  },
  3: {
    technicalLineIds: {
      0: "adlock-p03-console",
      1: "adlock-p03-domain",
      3: "adlock-p03-established",
    },
    annotations: [
      { id: "adlock-p03-a1", targetLineId: "adlock-p03-console", content: "Console — Identifies the management interface." },
      { id: "adlock-p03-a2", targetLineId: "adlock-p03-domain", content: "Connected Domain — Identifies the directory domain being viewed." },
      { id: "adlock-p03-a3", targetLineId: "adlock-p03-status", content: "Console Status — Indicates that the console is available." },
    ],
    learnMore: {
      howToExecute: "1. Sign in to an authorized administrative workstation.\n2. Open Windows Administrative Tools or Windows Tools.\n3. Launch Active Directory Users and Computers.\n4. Confirm the correct domain is displayed.\n\nAlternative: On a workstation with the appropriate tools installed, run dsa.msc.",
      whatItDoesAndHow: "Active Directory Users and Computers is a Microsoft Management Console snap-in used to inspect and manage objects in Active Directory Domain Services, subject to assigned permissions.",
      whyThisMatters: "The console provides access to the directory information required to investigate the employee's account. Opening the console does not modify the account.",
    },
  },
  4: {
    technicalLineIds: {
      0: "adlock-p04-title",
      2: "adlock-p04-name",
      3: "adlock-p04-logon",
      4: "adlock-p04-domain",
      6: "adlock-p04-matches",
    },
    annotations: [
      { id: "adlock-p04-a1", targetLineId: "adlock-p04-domain", content: "Domain — The directory domain being searched." },
      { id: "adlock-p04-a2", targetLineId: "adlock-p04-display-name", content: "Display Name — The employee's displayed name." },
      { id: "adlock-p04-a3", targetLineId: "adlock-p04-logon-name", content: "Logon Name — The account's sign-in identifier." },
      { id: "adlock-p04-a4", targetLineId: "adlock-p04-object-type", content: "Object Type — Identifies the directory object as a user account." },
      { id: "adlock-p04-a5", targetLineId: "adlock-p04-ou", content: "Organizational Unit — The directory container holding the object." },
      { id: "adlock-p04-a6", targetLineId: "adlock-p04-search-result", content: "Search Result — One matching account was found." },
    ],
    learnMore: {
      howToExecute: "1. Open the directory search interface.\n2. Search using the employee's approved account identifier.\n3. Review the matching account.\n4. Confirm the correct employee and account.\n\nAlternative: Browse the appropriate organizational unit if its location is known.",
      whatItDoesAndHow: "Active Directory stores user accounts as directory objects. Searching locates the object and its identifying attributes.",
      whyThisMatters: "The technician has identified the account associated with the reported issue. Accurate identification prevents changes to the wrong employee's account.",
    },
  },
  5: {
    technicalLineIds: {
      0: "adlock-p05-title",
      2: "adlock-p05-user",
      4: "adlock-p05-enabled",
      5: "adlock-p05-locked",
      6: "adlock-p05-password",
    },
    annotations: [
      { id: "adlock-p05-a1", targetLineId: "adlock-p05-enabled", content: "Account Enabled: Yes — The account has not been administratively disabled." },
      { id: "adlock-p05-a2", targetLineId: "adlock-p05-locked", content: "Account Locked Out: Yes — The account is currently subject to a lockout restriction." },
      { id: "adlock-p05-a3", targetLineId: "adlock-p05-password-expired", content: "Password Expired: No — The password is not currently marked as expired." },
      { id: "adlock-p05-a4", targetLineId: "adlock-p05-account-expired", content: "Account Expired: No — The account itself has not reached an expiration date." },
    ],
    learnMore: {
      howToExecute: "1. Open the identified user's account properties.\n2. Review the account status using the available authorized tools.\n3. Check whether the account is enabled.\n4. Check whether the account is locked.\n5. Review relevant expiration indicators.\n\nAlternative: Authorized PowerShell tools can retrieve account status, subject to permissions and installed modules.",
      whatItDoesAndHow: "Active Directory tracks different account states. A disabled account is administratively prevented from signing in. A locked account is restricted under account-lockout rules. Password expiration and account expiration are separate conditions.",
      whyThisMatters: "The technician can distinguish the observed lockout from account disablement and expiration conditions. The output confirms the account's current state, not yet the exact reason it became locked.",
    },
  },
  6: {
    technicalLineIds: {
      0: "adlock-p06-title",
      2: "adlock-p06-user",
      4: "adlock-p06-previous",
      5: "adlock-p06-current",
      7: "adlock-p06-password",
      8: "adlock-p06-operation",
    },
    annotations: [
      { id: "adlock-p06-a1", targetLineId: "adlock-p06-account-type", content: "Account Type — Identifies the account as a domain user account." },
      { id: "adlock-p06-a2", targetLineId: "adlock-p06-password-set", content: "Password Last Set — Shows when the account password was last changed." },
      { id: "adlock-p06-a3", targetLineId: "adlock-p06-password-expired", content: "Password Expired — Indicates whether the password is currently expired." },
    ],
    learnMore: {
      howToExecute: "1. Open the identified user account's properties.\n2. Review the relevant account tabs and available attributes.\n3. Record the information needed for troubleshooting.\n4. Avoid modifying unrelated account settings.\n\nAlternative: Use an approved read-only directory query where available.",
      whatItDoesAndHow: "User properties contain directory attributes associated with an account. These attributes help technicians distinguish account configuration issues from authentication restrictions.",
      whyThisMatters: "The technician has gathered additional account information without making changes. The displayed attributes do not establish the source of the unsuccessful sign-in attempts.",
    },
  },
  7: {
    technicalLineIds: {
      0: "adlock-p07-title",
      2: "adlock-p07-user",
      4: "adlock-p07-interactive",
      5: "adlock-p07-desktop",
    },
    annotations: [
      { id: "adlock-p07-a1", targetLineId: "adlock-p07-scope", content: "Policy Scope — Identifies the accounts covered by this example policy." },
      { id: "adlock-p07-a2", targetLineId: "adlock-p07-threshold", content: "Account Lockout Threshold — The number of invalid attempts permitted before lockout." },
      { id: "adlock-p07-a3", targetLineId: "adlock-p07-duration", content: "Account Lockout Duration — How long a lockout normally remains active." },
      { id: "adlock-p07-a4", targetLineId: "adlock-p07-reset-counter", content: "Reset Lockout Counter After — The interval used for resetting the invalid-attempt counter under the configured policy." },
      { id: "adlock-p07-a5", targetLineId: "adlock-p07-status", content: "Policy Status — Indicates that the policy is enabled." },
    ],
    learnMore: {
      howToExecute: "1. Open the organization's approved security-policy reference or authorized policy management interface.\n2. Identify the policy applicable to the employee's account.\n3. Review the lockout threshold, duration, and counter-reset settings.\n4. Record the displayed values.\n\nAlternative: An authorized policy-reporting tool may provide the applicable settings.",
      whatItDoesAndHow: "Account-lockout policies help protect accounts against repeated password-guessing attempts. The threshold determines when lockout occurs, while duration and reset settings control associated timing.",
      whyThisMatters: "The technician now knows the rules governing lockouts for the account. These settings describe how lockouts are triggered but do not, by themselves, prove which events triggered this specific lockout. The threshold and duration shown are fictional scenario values.",
    },
  },
  8: {
    technicalLineIds: {
      0: "adlock-p08-title",
      2: "adlock-p08-user",
      4: "adlock-p08-enabled",
      5: "adlock-p08-locked",
      6: "adlock-p08-password",
      8: "adlock-p08-previous",
      9: "adlock-p08-current",
    },
    annotations: [
      { id: "adlock-p08-a1", targetLineId: "adlock-p08-failed-count", content: "Failed Sign-in Events — Five unsuccessful authentication events were identified in the relevant records." },
      { id: "adlock-p08-a2", targetLineId: "adlock-p08-failure-category", content: "Failure Category — The recorded attempts involved invalid credentials." },
      { id: "adlock-p08-a3", targetLineId: "adlock-p08-lockout-event", content: "Account Lockout Event — A lockout event was recorded." },
      { id: "adlock-p08-a4", targetLineId: "adlock-p08-event-id", content: "Event ID 4740 — A Windows security event associated with account lockout." },
      { id: "adlock-p08-a5", targetLineId: "adlock-p08-source", content: "Event Source — Identifies the domain controller as the source of the lockout record." },
    ],
    learnMore: {
      howToExecute: "1. Open an approved security-event reporting tool.\n2. Search for relevant authentication and account-lockout events.\n3. Filter by the employee's account and incident time.\n4. Review the recorded source and failure details.\n5. Correlate the unsuccessful attempts with the lockout event.\n\nAlternative: An authorized administrator may review the relevant domain-controller security logs directly.",
      whatItDoesAndHow: "Windows security auditing can record failed authentication attempts and account-lockout events. Event 4740 identifies an account-lockout occurrence when the relevant auditing is enabled. Correlating events helps establish the sequence of observed authentication failures.",
      whyThisMatters: "The recorded invalid-credential attempts are consistent with the configured lockout threshold and the observed lockout. This supports the explanation that repeated unsuccessful authentication attempts triggered the restriction. It does not establish why the incorrect credentials were submitted or rule out other sources without additional investigation.",
    },
  },
  9: {
    technicalLineIds: {
      0: "adlock-p09-title",
      2: "adlock-p09-computer",
      3: "adlock-p09-log",
      4: "adlock-p09-source",
      5: "adlock-p09-event",
      9: "adlock-p09-name",
      12: "adlock-p09-caller",
    },
    annotations: [
      { id: "adlock-p09-a1", targetLineId: "adlock-p09-action", content: "Action — Identifies the account-management operation." },
      { id: "adlock-p09-a2", targetLineId: "adlock-p09-authorization", content: "Authorization — The technician used assigned account-unlock permissions." },
      { id: "adlock-p09-a3", targetLineId: "adlock-p09-result", content: "Operation Result — The directory accepted the unlock operation." },
    ],
    learnMore: {
      howToExecute: "1. Confirm that identity verification and required account checks are complete.\n2. Open the correct user's account in Active Directory Users and Computers.\n3. Locate the account-unlock control in the Account tab.\n4. Clear the lockout condition using the authorized control.\n5. Apply the change and review the operation result.\n\nAlternative: With appropriate authorization, use the Active Directory PowerShell command Unlock-ADAccount -Identity jlee.",
      whatItDoesAndHow: "Unlocking clears the account's current lockout restriction. It does not reset the password, enable a disabled account, or grant additional permissions.",
      whyThisMatters: "The technician has performed the authorized corrective action for the observed account state. A successful administrative operation does not independently prove that the employee can now sign in.",
    },
  },
  10: {
    technicalLineIds: {
      0: "adlock-p10-title",
      2: "adlock-p10-section",
      4: "adlock-p10-address",
      5: "adlock-p10-user",
      6: "adlock-p10-type",
      7: "adlock-p10-persistence",
      11: "adlock-p10-drive",
      12: "adlock-p10-path",
      13: "adlock-p10-reconnect",
    },
    annotations: [
      { id: "adlock-p10-a1", targetLineId: "adlock-p10-enabled", content: "Account Enabled — The account remains enabled." },
      { id: "adlock-p10-a2", targetLineId: "adlock-p10-locked", content: "Account Locked Out: No — No active lockout is currently reported." },
      { id: "adlock-p10-a3", targetLineId: "adlock-p10-password-expired", content: "Password Expired — The password remains unexpired." },
      { id: "adlock-p10-a4", targetLineId: "adlock-p10-status-check", content: "Directory Status Check — The account status was retrieved successfully." },
    ],
    learnMore: {
      howToExecute: "1. Refresh the user's account information.\n2. Review the current lockout state.\n3. Confirm the account remains enabled.\n4. Confirm no unintended account-property changes occurred.\n\nAlternative: Use an authorized read-only directory query to retrieve the current account status.",
      whatItDoesAndHow: "Rechecking account properties retrieves the directory's current account state after the administrative operation.",
      whyThisMatters: "The account no longer displays the previously observed lockout restriction. This verifies the directory-side change but does not independently establish successful Windows sign-in.",
    },
  },
  11: {
    technicalLineIds: {
      0: "adlock-p11-title",
      2: "adlock-p11-target",
      3: "adlock-p11-user",
      5: "adlock-p11-removal",
      6: "adlock-p11-present",
      8: "adlock-p11-drive",
      9: "adlock-p11-config",
    },
    annotations: [
      { id: "adlock-p11-a1", targetLineId: "adlock-p11-workstation", content: "Workstation — Identifies the computer used for verification." },
      { id: "adlock-p11-a2", targetLineId: "adlock-p11-account", content: "Account — Identifies the employee's domain account." },
      { id: "adlock-p11-a3", targetLineId: "adlock-p11-authentication", content: "Authentication Result — Windows accepted the employee's sign-in." },
      { id: "adlock-p11-a4", targetLineId: "adlock-p11-session", content: "Windows Session — A user session was started successfully." },
    ],
    learnMore: {
      howToExecute: "1. Ask the employee to sign in using their own credentials.\n2. Do not request or enter the employee's password yourself.\n3. Observe whether Windows accepts the sign-in.\n4. Confirm that the employee reaches their desktop.\n\nAlternative: If organizational policy requires it, use an approved remote-assistance session while the employee performs the sign-in.",
      whatItDoesAndHow: "Windows authentication checks the submitted credentials and applicable account restrictions. Successful authentication permits the user's session to begin.",
      whyThisMatters: "The previously unsuccessful operation now succeeds. This provides direct evidence that the employee can access the workstation with the affected account.",
    },
  },
  12: {
    technicalLineIds: {
      0: "adlock-p12-reported-issue",
      1: "adlock-p12-login-test",
      2: "adlock-p12-confirmation",
      3: "adlock-p12-status",
    },
    annotations: [
      { id: "adlock-p12-a1", targetLineId: "adlock-p12-reported-issue", content: "Reported Issue — Identifies the original problem." },
      { id: "adlock-p12-a2", targetLineId: "adlock-p12-login-test", content: "User Sign-in Test — The employee successfully repeated the affected operation." },
      { id: "adlock-p12-a3", targetLineId: "adlock-p12-confirmation", content: "User Confirmation — The employee confirms access is restored." },
      { id: "adlock-p12-a4", targetLineId: "adlock-p12-status", content: "Scenario Status — The reported incident is resolved." },
    ],
    learnMore: {
      howToExecute: "1. Ask the employee to confirm they can access their Windows session.\n2. Confirm that the originally reported lockout message is no longer preventing sign-in.\n3. Ask whether the original access problem is resolved.\n\nAlternative: For an approved remote-support session, obtain explicit confirmation from the employee after they successfully sign in.",
      whatItDoesAndHow: "User confirmation establishes whether the original issue has been resolved from the employee's perspective.",
      whyThisMatters: "The directory reports the lockout cleared, the employee successfully signs in, and the employee confirms the original problem is resolved. Together, these observations support successful incident resolution.",
    },
  },
};

export const FINAL_ACTIVE_DIRECTORY_LOCKOUT_EDUCATIONAL_CONTENT: Readonly<Record<number, ActiveDirectoryLockoutProcedureEducation>> = {
  ...LEGACY_ACTIVE_DIRECTORY_LOCKOUT_EDUCATIONAL_CONTENT,
  1: { technicalLineIds: { 0: "adlock-p01-identity", 1: "adlock-p01-user-status" }, annotations: [{ id: "adlock-p01-a1", targetLineId: "adlock-p01-identity", content: "Identity Verification: Successful — The authorized employee has been verified." }], learnMore: { howToExecute: "Follow the organization's approved identity verification process before account actions.", whatItDoesAndHow: "Confirms the person requesting support is the authorized account holder.", whyThisMatters: "Protects organizational accounts against unauthorized access and social engineering." } },
  2: { technicalLineIds: { 0: "adlock-p02-app", 2: "adlock-p02-error", 4: "adlock-p02-unable" }, annotations: [{ id: "adlock-p02-a1", targetLineId: "adlock-p02-error", content: "Account is currently locked out — Windows reports the account lockout condition." }], learnMore: { howToExecute: "Observe the user's Windows sign-in error and record the exact message.", whatItDoesAndHow: "Identifies the authentication error preventing sign-in. Account lockout is distinct from incorrect password, disabled account, or expired password.", whyThisMatters: "The exact authentication error determines which account condition requires investigation." } },
  3: { technicalLineIds: { 0: "adlock-p03-console", 2: "adlock-p03-domain", 4: "adlock-p03-established" }, annotations: [{ id: "adlock-p03-a1", targetLineId: "adlock-p03-console", content: "Active Directory Users and Computers — The management console used to administer directory objects." }], learnMore: { howToExecute: "Open Active Directory Users and Computers on an authorized administrative workstation, or run dsa.msc.", whatItDoesAndHow: "Provides access to Active Directory users, computers, groups, and other directory objects.", whyThisMatters: "Allows authorized technicians to investigate and manage domain user accounts." } },
  4: { technicalLineIds: { 0: "adlock-p04-title", 2: "adlock-p04-name", 3: "adlock-p04-logon", 4: "adlock-p04-domain", 6: "adlock-p04-matches" }, annotations: [{ id: "adlock-p04-a1", targetLineId: "adlock-p04-name", content: "Name — Identifies Alex Morgan as the located directory object." }], learnMore: { howToExecute: "Use Find or search in Active Directory Users and Computers to locate the verified user's account.", whatItDoesAndHow: "Retrieves the directory object associated with the affected user.", whyThisMatters: "Prevents administrative changes from being performed against the wrong account." } },
  5: { technicalLineIds: { 0: "adlock-p05-title", 2: "adlock-p05-user", 4: "adlock-p05-enabled", 5: "adlock-p05-locked", 6: "adlock-p05-password" }, annotations: [{ id: "adlock-p05-a1", targetLineId: "adlock-p05-locked", content: "Account Locked: Yes — The account is currently restricted by account lockout." }], learnMore: { howToExecute: "Open the user's account properties and inspect account status and lockout information.", whatItDoesAndHow: "Establishes enabled, locked, and password-expiration conditions. Enabled and locked are separate conditions.", whyThisMatters: "Identifies the appropriate account action without unnecessarily resetting or modifying unrelated settings." } },
  6: { technicalLineIds: { 0: "adlock-p06-title", 2: "adlock-p06-user", 4: "adlock-p06-previous", 5: "adlock-p06-current", 7: "adlock-p06-password", 8: "adlock-p06-operation" }, annotations: [{ id: "adlock-p06-a1", targetLineId: "adlock-p06-current", content: "Current Account State: Unlocked — The account lockout has been cleared." }], learnMore: { howToExecute: "Open account properties on the Account tab and select Unlock account.", whatItDoesAndHow: "Clears account lockout without changing the user's password.", whyThisMatters: "Unlock restores access when the existing password is valid, but does not prove the original lockout cause is resolved." } },
  7: { technicalLineIds: { 0: "adlock-p07-title", 2: "adlock-p07-user", 4: "adlock-p07-interactive", 5: "adlock-p07-desktop" }, annotations: [{ id: "adlock-p07-a1", targetLineId: "adlock-p07-interactive", content: "Interactive Sign-in: Successful — The current password authenticated." }], learnMore: { howToExecute: "Ask the user to sign in using their current password without exposing it.", whatItDoesAndHow: "Tests whether the account can authenticate following the unlock.", whyThisMatters: "A successful sign-in confirms authentication at that moment but not continued account stability." } },
  8: { technicalLineIds: { 0: "adlock-p08-title", 2: "adlock-p08-user", 4: "adlock-p08-enabled", 5: "adlock-p08-locked", 6: "adlock-p08-password", 8: "adlock-p08-previous", 9: "adlock-p08-current" }, annotations: [{ id: "adlock-p08-a1", targetLineId: "adlock-p08-locked", content: "Account Locked: Yes — Confirms the recurring lockout." }], learnMore: { howToExecute: "Refresh the affected account properties and inspect current lockout status.", whatItDoesAndHow: "Compares current account state with the earlier unlocked state.", whyThisMatters: "A recurring lockout indicates the original unlock did not eliminate the underlying source of failures." } },
  9: { technicalLineIds: { 0: "adlock-p09-title", 2: "adlock-p09-computer", 5: "adlock-p09-event", 9: "adlock-p09-name", 12: "adlock-p09-caller" }, annotations: [{ id: "adlock-p09-a1", targetLineId: "adlock-p09-caller", content: "Caller Computer Name: WS-104 — The event identifies the relevant workstation." }], learnMore: { howToExecute: "In the authorized domain-controller Security log, filter Event Viewer for Event ID 4740 and locate the affected account.", whatItDoesAndHow: "Retrieves evidence of the account lockout and caller workstation.", whyThisMatters: "Caller information narrows the investigation but does not identify the credential or process responsible." } },
  10: { technicalLineIds: { 0: "adlock-p10-title", 2: "adlock-p10-section", 4: "adlock-p10-address", 5: "adlock-p10-user", 6: "adlock-p10-type", 11: "adlock-p10-drive", 12: "adlock-p10-path", 13: "adlock-p10-reconnect" }, annotations: [{ id: "adlock-p10-a1", targetLineId: "adlock-p10-address", content: "Network Address — Associates the saved credential with fs-01.corp.example." }], learnMore: { howToExecute: "Open Credential Manager > Windows Credentials, inspect the file server entry, and inspect the S: mapped drive separately.", whatItDoesAndHow: "Stored credentials can become outdated after a password change and be reused by reconnection processes.", whyThisMatters: "Identifies a plausible source of repeated authentication failures using workstation evidence." } },
  11: { technicalLineIds: { 0: "adlock-p11-title", 2: "adlock-p11-target", 3: "adlock-p11-user", 5: "adlock-p11-removal", 6: "adlock-p11-present", 8: "adlock-p11-drive", 9: "adlock-p11-config" }, annotations: [{ id: "adlock-p11-a1", targetLineId: "adlock-p11-removal", content: "Credential Removal: Successful — The outdated credential was removed." }], learnMore: { howToExecute: "Remove only the identified fs-01.corp.example credential in Credential Manager.", whatItDoesAndHow: "Removes outdated stored authentication information without changing the password or mapped drive.", whyThisMatters: "Stops the identified source of repeated authentication failures rather than repeatedly clearing the lockout." } },
  12: { technicalLineIds: { 0: "adlock-p12-title", 2: "adlock-p12-user", 4: "adlock-p12-previous", 5: "adlock-p12-current", 7: "adlock-p12-password", 8: "adlock-p12-operation" }, annotations: [{ id: "adlock-p12-a1", targetLineId: "adlock-p12-current", content: "Current Account State: Unlocked — The recurring lockout is cleared after root-cause correction." }], learnMore: { howToExecute: "Return to the affected account and select Unlock account after credential removal.", whatItDoesAndHow: "Clears the resulting account lockout after the repeated-authentication source has been removed.", whyThisMatters: "Credential correction and account unlock are separate required actions." } },
  13: { technicalLineIds: { 0: "adlock-p13-title", 2: "adlock-p13-user", 4: "adlock-p13-interactive", 5: "adlock-p13-desktop", 7: "adlock-p13-status", 8: "adlock-p13-observed" }, annotations: [{ id: "adlock-p13-a1", targetLineId: "adlock-p13-interactive", content: "Interactive Sign-in: Successful — The current password authenticated." }], learnMore: { howToExecute: "Ask the user to sign out and back in with the current domain password, then inspect account status.", whatItDoesAndHow: "Verifies authentication after credential correction and the second unlock.", whyThisMatters: "Confirms that the recurring lockout has not immediately returned during verification." } },
  14: { technicalLineIds: { 0: "adlock-p14-title", 2: "adlock-p14-drive", 3: "adlock-p14-path", 5: "adlock-p14-auth", 6: "adlock-p14-drive-access", 7: "adlock-p14-folder", 9: "adlock-p14-status" }, annotations: [{ id: "adlock-p14-a1", targetLineId: "adlock-p14-path", content: "Network Path — Identifies the affected shared folder." }], learnMore: { howToExecute: "Ask the user to open S: in File Explorer and access the shared folder.", whatItDoesAndHow: "Tests authentication and access to the originally affected network resource.", whyThisMatters: "Successful sign-in alone does not prove the shared folder is restored." } },
  15: { technicalLineIds: { 0: "adlock-p15-response" }, annotations: [{ id: "adlock-p15-a1", targetLineId: "adlock-p15-response", content: "User Response — The user confirms sign-in and shared-file access are restored." }], learnMore: { howToExecute: "Ask the user to confirm sign-in and shared network drive access using their normal workflow.", whatItDoesAndHow: "Verifies that both the reported lockout and affected network resource are functioning.", whyThisMatters: "User confirmation and successful technical verification establish incident resolution." } },
};

export const ACTIVE_DIRECTORY_LOCKOUT_EDUCATIONAL_CONTENT: Readonly<Record<number, ActiveDirectoryLockoutProcedureEducation>> = {
  1: { technicalLineIds: { 0: "adlock-p01-identity", 1: "adlock-p01-user-status" }, annotations: [{ id: "adlock-p01-a1", targetLineId: "adlock-p01-identity", content: "Identity Verification: Successful — The authorized employee has been verified." }], learnMore: { howToExecute: "Follow the organization's approved identity verification process before account actions.", whatItDoesAndHow: "Confirms the person requesting support is the authorized account holder.", whyThisMatters: "Protects organizational accounts against unauthorized access and social engineering." } },
  2: { technicalLineIds: { 0: "adlock-p02-app", 2: "adlock-p02-error", 4: "adlock-p02-unable" }, annotations: [{ id: "adlock-p02-a1", targetLineId: "adlock-p02-unable", content: "Account is currently locked out — Windows reports the account lockout condition." }], learnMore: { howToExecute: "Observe the user's Windows sign-in error and record the exact message.", whatItDoesAndHow: "Identifies the authentication error preventing sign-in. Account lockout is distinct from incorrect password, disabled account, or expired password.", whyThisMatters: "The exact authentication error determines which account condition requires investigation." } },
  3: { technicalLineIds: { 0: "adlock-p03-console", 2: "adlock-p03-domain", 4: "adlock-p03-established" }, annotations: [{ id: "adlock-p03-a1", targetLineId: "adlock-p03-console", content: "Active Directory Users and Computers — The administrative console used to manage directory objects." },{ id: "adlock-p03-a2", targetLineId: "adlock-p03-domain", content: "Domain: corp.example — Identifies the organizational Active Directory domain." },{ id: "adlock-p03-a3", targetLineId: "adlock-p03-established", content: "Administrative connection established — Confirms that the technician has connected using authorized administrative access." }], learnMore: { howToExecute: "On an authorized administrative workstation with Active Directory administrative tools installed, press Windows + R to open the Run dialog. Type dsa.msc and press Enter. Confirm that Active Directory Users and Computers opens and that the correct organizational domain is available.", whatItDoesAndHow: "Provides access to Active Directory users, computers, groups, and other directory objects.", whyThisMatters: "Allows authorized technicians to investigate and manage domain user accounts." } },
  4: { technicalLineIds: { 0: "adlock-p04-title", 2: "adlock-p04-name", 3: "adlock-p04-logon", 4: "adlock-p04-domain", 6: "adlock-p04-matches" }, annotations: [{ id: "adlock-p04-a1", targetLineId: "adlock-p04-name", content: "Name — Identifies Alex Morgan as the located directory object." }], learnMore: { howToExecute: "In Active Directory Users and Computers, right-click the organizational domain in the left navigation pane and select Find. Select Users, Contacts, and Groups as the search category if necessary. Enter the verified user's name or username and select Find Now. Confirm that the matching account belongs to the affected user.", whatItDoesAndHow: "Retrieves the directory object associated with the affected user.", whyThisMatters: "Prevents administrative changes from being performed against the wrong account." } },
  5: { technicalLineIds: { 0: "adlock-p05-title", 2: "adlock-p05-user", 4: "adlock-p05-enabled", 5: "adlock-p05-locked", 6: "adlock-p05-password" }, annotations: [{ id: "adlock-p05-a1", targetLineId: "adlock-p05-enabled", content: "Account Enabled: Yes — The account is enabled and has not been administratively disabled." },{ id: "adlock-p05-a2", targetLineId: "adlock-p05-locked", content: "Account Locked: Yes — Account lockout currently restricts authentication." },{ id: "adlock-p05-a3", targetLineId: "adlock-p05-password", content: "Password Expired: No — Password expiration is not the reported authentication condition." }], learnMore: { howToExecute: "Right-click the affected user's account in Active Directory Users and Computers and select Properties. Open the Account tab and inspect the account lockout status and relevant account options. Review the available account status information without changing any settings.", whatItDoesAndHow: "Establishes enabled, locked, and password-expiration conditions. Enabled and locked are separate conditions.", whyThisMatters: "Identifies the appropriate account action without unnecessarily resetting or modifying unrelated settings." } },
  6: { technicalLineIds: { 0: "adlock-p06-title", 2: "adlock-p06-user", 4: "adlock-p06-previous", 5: "adlock-p06-current", 7: "adlock-p06-password", 8: "adlock-p06-operation" }, annotations: [{ id: "adlock-p06-a1", targetLineId: "adlock-p06-current", content: "Current Account State: Unlocked — The account lockout has been cleared." }], learnMore: { howToExecute: "Right-click the affected user's account and select Properties. Open the Account tab, select the Unlock account checkbox, and select Apply or OK to save the change. Perform this action using an authorized administrative account. Do not reset or change the user's password.", whatItDoesAndHow: "Clears account lockout without changing the user's password.", whyThisMatters: "Unlock restores access when the existing password is valid, but does not prove the original lockout cause is resolved." } },
  7: { technicalLineIds: { 0: "adlock-p07-title", 2: "adlock-p07-user", 4: "adlock-p07-interactive", 5: "adlock-p07-desktop" }, annotations: [{ id: "adlock-p07-a1", targetLineId: "adlock-p07-interactive", content: "Interactive Sign-in: Successful — The current password authenticated." }], learnMore: { howToExecute: "Ask the user to sign in using their current password without exposing it.", whatItDoesAndHow: "Tests whether the account can authenticate following the unlock.", whyThisMatters: "A successful sign-in confirms authentication at that moment but not continued account stability." } },
  8: { technicalLineIds: { 0: "adlock-p08-title", 2: "adlock-p08-user", 4: "adlock-p08-enabled", 5: "adlock-p08-locked", 6: "adlock-p08-password", 8: "adlock-p08-previous", 9: "adlock-p08-current" }, annotations: [{ id: "adlock-p08-a1", targetLineId: "adlock-p08-enabled", content: "Account Enabled: Yes — The account is enabled and has not been administratively disabled." },{ id: "adlock-p08-a2", targetLineId: "adlock-p08-locked", content: "Account Locked: Yes — Account lockout currently restricts authentication. The account became locked again after a successful unlock." },{ id: "adlock-p08-a3", targetLineId: "adlock-p08-password", content: "Password Expired: No — Password expiration is not the reported authentication condition." }], learnMore: { howToExecute: "Return to Active Directory Users and Computers and refresh the account information. Reopen the affected user's Properties window and select the Account tab. Inspect the current lockout status to determine whether the account has become locked again.", whatItDoesAndHow: "Compares current account state with the earlier unlocked state.", whyThisMatters: "A recurring lockout indicates the original unlock did not eliminate the underlying source of failures." } },
  9: { technicalLineIds: { 0: "adlock-p09-title", 2: "adlock-p09-computer", 3: "adlock-p09-log", 4: "adlock-p09-source", 5: "adlock-p09-event", 10: "adlock-p09-name", 13: "adlock-p09-caller" }, annotations: [{ id: "adlock-p09-a1", targetLineId: "adlock-p09-computer", content: "Computer — Identifies DC-01.corp.example, the domain controller whose Security log is being inspected." },{ id: "adlock-p09-a2", targetLineId: "adlock-p09-log", content: "Log Name: Security — Identifies the Windows Security event log." },{ id: "adlock-p09-a3", targetLineId: "adlock-p09-source", content: "Source: Microsoft-Windows-Security-Auditing — Identifies the event provider." },{ id: "adlock-p09-a4", targetLineId: "adlock-p09-event", content: "Event ID: 4740 — Records that a user account was locked out." },{ id: "adlock-p09-a5", targetLineId: "adlock-p09-name", content: "Account Name: amorgan — Identifies the affected account." },{ id: "adlock-p09-a6", targetLineId: "adlock-p09-caller", content: "Caller Computer Name: WS-104 — Identifies the caller computer associated with the recorded lockout." }], learnMore: { howToExecute: "Using authorized access to the appropriate domain controller, press Windows + R, type eventvwr.msc, and press Enter. In Event Viewer, expand Windows Logs and select Security. Select Filter Current Log in the Actions pane, enter 4740 in the Event IDs field, and select OK. Locate the event associated with the affected user's account and inspect its event details, including the Caller Computer Name.", whatItDoesAndHow: "Retrieves evidence of the account lockout and caller workstation.", whyThisMatters: "Caller information narrows the investigation but does not identify the credential or process responsible." } },
  10: { technicalLineIds: { 0: "adlock-p10-title", 2: "adlock-p10-section", 4: "adlock-p10-address", 5: "adlock-p10-user", 6: "adlock-p10-type", 7: "adlock-p10-persistence", 11: "adlock-p10-drive", 12: "adlock-p10-path", 13: "adlock-p10-reconnect" }, annotations: [{ id: "adlock-p10-a1", targetLineId: "adlock-p10-address", content: "Network Address — The file server associated with the saved credential." },{ id: "adlock-p10-a2", targetLineId: "adlock-p10-user", content: "User Name — The account associated with the credential: CORP\\amorgan." },{ id: "adlock-p10-a3", targetLineId: "adlock-p10-type", content: "Credential Type — Identifies the stored Windows credential category." },{ id: "adlock-p10-a4", targetLineId: "adlock-p10-persistence", content: "Persistence: Enterprise — Describes the credential's persistence classification." },{ id: "adlock-p10-a5", targetLineId: "adlock-p10-drive", content: "Drive: S: — The assigned mapped network drive letter." },{ id: "adlock-p10-a6", targetLineId: "adlock-p10-path", content: "Network Path — The UNC path to the shared network resource:\\\\fs-01.corp.example\\Shared." },{ id: "adlock-p10-a7", targetLineId: "adlock-p10-reconnect", content: "Reconnect at Sign-in: Enabled — Windows is configured to reconnect the mapped drive when the user signs in." }], learnMore: { howToExecute: "On the affected user's workstation, open the Windows Start menu, search for Credential Manager, and select it. Select Windows Credentials and expand the entry associated with the internal file server. Inspect the saved credential information without exposing any password. Separately, press Windows + E to open File Explorer, select This PC, and locate the mapped S: network drive. Inspect its associated network location and obtain the relevant configuration and credential history from the user or authorized configuration information.", whatItDoesAndHow: "Stored credentials can become outdated after a password change and be reused by reconnection processes.", whyThisMatters: "Identifies a plausible source of repeated authentication failures using workstation evidence." } },
  11: { technicalLineIds: { 0: "adlock-p11-title", 2: "adlock-p11-target", 3: "adlock-p11-user", 5: "adlock-p11-removal", 6: "adlock-p11-present", 8: "adlock-p11-drive", 9: "adlock-p11-config" }, annotations: [{ id: "adlock-p11-a1", targetLineId: "adlock-p11-removal", content: "Credential Removal: Successful — The outdated credential was removed." }], learnMore: { howToExecute: "Open Credential Manager from the Windows Start menu and select Windows Credentials. Expand the previously identified fs-01.corp.example credential and select Remove. Confirm the removal when prompted. Verify that the identified credential is no longer listed. Do not remove unrelated credentials or disconnect the mapped network drive.", whatItDoesAndHow: "Removes outdated stored authentication information without changing the password or mapped drive.", whyThisMatters: "Stopping the source of repeated authentication failures is separate from clearing the resulting account lockout." } },
  12: { technicalLineIds: { 0: "adlock-p12-title", 2: "adlock-p12-user", 4: "adlock-p12-previous", 5: "adlock-p12-current", 7: "adlock-p12-password", 8: "adlock-p12-operation" }, annotations: [{ id: "adlock-p12-a1", targetLineId: "adlock-p12-current", content: "Current Account State: Unlocked — The recurring lockout is cleared after root-cause correction." }], learnMore: { howToExecute: "Return to Active Directory Users and Computers. Right-click the affected user's account, select Properties, and open the Account tab. Select the Unlock account checkbox and select Apply or OK to save the change. Verify that the account is unlocked without changing the user's password.", whatItDoesAndHow: "Clears the resulting account lockout after the repeated-authentication source has been removed.", whyThisMatters: "Credential correction and account unlock are separate required actions." } },
  13: { technicalLineIds: { 0: "adlock-p13-title", 2: "adlock-p13-user", 4: "adlock-p13-interactive", 5: "adlock-p13-desktop", 7: "adlock-p13-status", 8: "adlock-p13-observed" }, annotations: [{ id: "adlock-p13-a1", targetLineId: "adlock-p13-interactive", content: "Interactive Sign-in: Successful — The current domain password authenticated successfully." },{ id: "adlock-p13-a2", targetLineId: "adlock-p13-desktop", content: "Desktop Access: Available — The user can access the Windows desktop." },{ id: "adlock-p13-a3", targetLineId: "adlock-p13-status", content: "Active Directory Account Status: Unlocked — The account remains unlocked during verification." },{ id: "adlock-p13-a4", targetLineId: "adlock-p13-observed", content: "Additional Lockout Observed: No — No further lockout was observed during the simulated verification period." }], learnMore: { howToExecute: "Ask the user to sign out and back in with the current domain password, then inspect account status.", whatItDoesAndHow: "Verifies authentication after credential correction and the second unlock.", whyThisMatters: "Confirms that the recurring lockout has not immediately returned during verification. A limited verification period does not guarantee it can never recur." } },
  14: { technicalLineIds: { 0: "adlock-p14-title", 2: "adlock-p14-drive", 3: "adlock-p14-path", 5: "adlock-p14-auth", 6: "adlock-p14-drive-access", 7: "adlock-p14-folder", 9: "adlock-p14-status" }, annotations: [{ id: "adlock-p14-a1", targetLineId: "adlock-p14-drive", content: "Mapped Drive: S: — Identifies the affected network drive." },{ id: "adlock-p14-a2", targetLineId: "adlock-p14-path", content: "Network Path — The affected UNC share is\\\\fs-01.corp.example\\Shared." },{ id: "adlock-p14-a3", targetLineId: "adlock-p14-auth", content: "Authentication: Successful — Authentication to the network resource succeeded." },{ id: "adlock-p14-a4", targetLineId: "adlock-p14-folder", content: "Shared Folder Access: Successful — The user successfully accessed the intended shared folder." },{ id: "adlock-p14-a5", targetLineId: "adlock-p14-status", content: "Active Directory Account Status: Unlocked — The account remains unlocked during resource verification." }], learnMore: { howToExecute: "On the affected user's workstation, press Windows + E to open File Explorer. Select This PC and locate the mapped S: network drive under Network locations. Open the drive and verify that the shared folder is accessible using the user's current domain credentials. Confirm that the account remains unlocked during verification.", whatItDoesAndHow: "Tests authentication and access to the originally affected network resource.", whyThisMatters: "Successful sign-in alone does not prove the shared folder is restored." } },
  15: { technicalLineIds: { 0: "adlock-p15-response" }, annotations: [{ id: "adlock-p15-a1", targetLineId: "adlock-p15-response", content: "User Response — The user confirms sign-in and shared-file access are restored." }], learnMore: { howToExecute: "Ask the user to confirm sign-in and shared network drive access using their normal workflow.", whatItDoesAndHow: "Verifies that both the reported lockout and affected network resource are functioning.", whyThisMatters: "User confirmation and successful technical verification establish incident resolution." } },
};
