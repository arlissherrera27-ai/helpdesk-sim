import type { Command } from "./types";
import { lookupCommandDef } from "./commandRegistry";

// Parser only labels intent.
// It does not decide legitimacy.
export function parseCommand(inputRaw: string): Command {
  const trimmed = inputRaw.trim();
  const lower = trimmed.toLowerCase();

  if (lower.length === 0) {
    return { kind: "unknown", rawInput: inputRaw };
  }

  // Split into: verb + rest
  const [verb, ...rest] = lower.split(/\s+/);
  const verbKind = lookupCommandDef(verb);

  if (!verbKind) {
    return { kind: "unknown", rawInput: inputRaw };
  }

  // Special-case: select requires exactly one argument
  if (verbKind === "select") {
    const scenario_id = rest[0];
    if (!scenario_id || rest.length !== 1) {
      return { kind: "unknown", rawInput: inputRaw };
    }
    return { kind: "select", readOnly: false, scenario_id };
  }

  // Strict boundary: non-arg commands may not accept extra tokens
  if (rest.length > 0) {
    return { kind: "unknown", rawInput: inputRaw };
  }

  // Construct command for non-arg verbs
  switch (verbKind) {
    case "start":
      return { kind: "start", readOnly: false };
    case "restart":
      return { kind: "restart", readOnly: false };
    case "quit":
      return { kind: "quit", readOnly: false };
    case "verify_identity":
      return { kind: "verify_identity", readOnly: false };
    case "send_reset_code":
      return { kind: "send_reset_code", readOnly: false };
    case "confirm_reset":
      return { kind: "confirm_reset", readOnly: false };
    case "set_new_password":
      return { kind: "set_new_password", readOnly: false };  
    case "help":
      return { kind: "help", readOnly: true };
    case "status":
      return { kind: "status", readOnly: true };
    case "debug":
      return { kind: "debug", readOnly: true };
    default:
      return { kind: "unknown", rawInput: inputRaw };
  }
}