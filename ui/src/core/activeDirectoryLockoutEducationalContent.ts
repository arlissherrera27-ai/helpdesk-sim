import type { ProcedureLearnMoreContent, ProcedureSideAnnotation } from "./procedurePresentation";

export type ActiveDirectoryLockoutProcedureEducation = {
  technicalLineIds: Readonly<Record<number, string>>;
  annotations: readonly ProcedureSideAnnotation[];
  learnMore: ProcedureLearnMoreContent;
};

export const ACTIVE_DIRECTORY_LOCKOUT_EDUCATIONAL_CONTENT: Readonly<Record<number, ActiveDirectoryLockoutProcedureEducation>> = {
  1: {
    technicalLineIds: {
      0: "adlock-p01-identity",
      1: "adlock-p01-employee",
      2: "adlock-p01-user-status",
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
      0: "adlock-p02-workstation",
      1: "adlock-p02-account",
      2: "adlock-p02-message",
      3: "adlock-p02-result",
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
      2: "adlock-p03-status",
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
      0: "adlock-p04-domain",
      1: "adlock-p04-display-name",
      2: "adlock-p04-logon-name",
      3: "adlock-p04-object-type",
      4: "adlock-p04-ou",
      5: "adlock-p04-search-result",
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
      0: "adlock-p05-account",
      1: "adlock-p05-enabled",
      2: "adlock-p05-locked",
      3: "adlock-p05-password-expired",
      4: "adlock-p05-account-expired",
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
      0: "adlock-p06-user",
      1: "adlock-p06-username",
      2: "adlock-p06-domain",
      3: "adlock-p06-account-type",
      4: "adlock-p06-enabled",
      5: "adlock-p06-password-set",
      6: "adlock-p06-password-expired",
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
      0: "adlock-p07-scope",
      1: "adlock-p07-threshold",
      2: "adlock-p07-duration",
      3: "adlock-p07-reset-counter",
      4: "adlock-p07-status",
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
      0: "adlock-p08-account",
      1: "adlock-p08-workstation",
      2: "adlock-p08-failed-count",
      3: "adlock-p08-failure-category",
      4: "adlock-p08-lockout-event",
      5: "adlock-p08-event-id",
      6: "adlock-p08-source",
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
      0: "adlock-p09-account",
      1: "adlock-p09-action",
      2: "adlock-p09-authorization",
      3: "adlock-p09-result",
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
      0: "adlock-p10-account",
      1: "adlock-p10-enabled",
      2: "adlock-p10-locked",
      3: "adlock-p10-password-expired",
      4: "adlock-p10-status-check",
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
      0: "adlock-p11-workstation",
      1: "adlock-p11-account",
      2: "adlock-p11-authentication",
      3: "adlock-p11-session",
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
