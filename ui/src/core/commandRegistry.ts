// commandRegistry.ts
// Resolves canonical commands and supported aliases.
//
// Canonical procedure identity comes from procedureCatalog.ts.
// This file owns aliases and system/control command lookup only.
//
// No execution.
// No state.
// No scenario policy.

import type { Command } from "./types";
import {
  procedureCatalog,
  type ProcedureCommandKind,
} from "./procedureCatalog";

type KnownVerb = Exclude<Command["kind"], "unknown">;

type SystemCommandKind = Exclude<KnownVerb, ProcedureCommandKind>;

// System/control commands are not procedure-catalog entries because they
// require specialized parsing or plan construction.
const systemRegistry = {
  start: "start",
  restart: "restart",
  quit: "quit",
  debug: "debug",
  select: "select",
  help: "help",
  status: "status",
} as const satisfies Record<string, SystemCommandKind>;

// Aliases point to an existing canonical procedure command.
// The destination is checked against ProcedureCommandKind.
const procedureAliases = {
  verify_login: "test_sign_in",
  confirm_account_access: "test_sign_in",

  confirm_vpn_connection: "confirm_connection",
  test_vpn_connection: "confirm_connection",

  check_application_status: "check_app_status",
} as const satisfies Record<string, ProcedureCommandKind>;

// Read-only aliases remain separate because they resolve to system commands.
const systemAliases = {
  "?": "help",
  state: "status",
} as const satisfies Record<string, SystemCommandKind>;

function isProcedureCommandKind(
  token: string,
): token is ProcedureCommandKind {
  return Object.prototype.hasOwnProperty.call(procedureCatalog, token);
}

export function lookupCommandDef(token: string): KnownVerb | null {
  // Canonical procedure command.
  if (isProcedureCommandKind(token)) {
    return token;
  }

  // Procedure alias.
  if (Object.prototype.hasOwnProperty.call(procedureAliases, token)) {
    return procedureAliases[token as keyof typeof procedureAliases];
  }

  // Canonical system/control command.
  if (Object.prototype.hasOwnProperty.call(systemRegistry, token)) {
    return systemRegistry[token as keyof typeof systemRegistry];
  }

  // System/control alias.
  if (Object.prototype.hasOwnProperty.call(systemAliases, token)) {
    return systemAliases[token as keyof typeof systemAliases];
  }

  return null;
}