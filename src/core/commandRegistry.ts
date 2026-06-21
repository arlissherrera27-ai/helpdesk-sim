// commandRegistry.ts
// Single source of truth for command meaning.
// No execution, no state, no policy logic.

import type { Command } from "./types"; // adjust path if your folder differs

type KnownVerb = Exclude<Command["kind"], "unknown">;

// Registry stores *verb identity* for known commands.
// Arg-bearing commands are still validated here by verb, but constructed in parse.ts.
const registry: Record<string, KnownVerb> = {
  // Mutating
  start: "start",
  restart: "restart",
  quit: "quit",
  debug: "debug",
  select: "select",
  verify_identity: "verify_identity",
  send_reset_code: "send_reset_code",
  confirm_reset: "confirm_reset",
  set_new_password: "set_new_password",

  // ReadOnly (+ aliases)
  help: "help",
  "?": "help",

  status: "status",
  state: "status",
} as const;

export function lookupCommandDef(token: string): KnownVerb | null {
  return registry[token] ?? null;
}
