// src/core/scenarioIntegrity/checkCommandAliasIntegrity.ts

import { COMMAND_ALIASES } from "../parse";
import { lookupCommandDef } from "../commandRegistry";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

function normalizeAlias(alias: string): string {
  return alias
    .trim()
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\s+/g, " ");
}

export const checkCommandAliasIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Command Alias Inspector",
    area: "alias",

    run: (): readonly IntegrityFinding[] => {
      const findings: IntegrityFinding[] = [];

      const normalizedAliases = new Map<
        string,
        {
          alias: string;
          command: string;
        }
      >();

      for (const [alias, command] of Object.entries(
        COMMAND_ALIASES
      )) {
        const normalizedAlias = normalizeAlias(alias);

        const existing =
          normalizedAliases.get(normalizedAlias);

        if (
          existing &&
          existing.command !== command
        ) {
          findings.push({
            severity: "error",
            area: "alias",
            code: "COMMAND_ALIAS_DUPLICATE",
            alias,
            command,
            source: "parse.ts",
            message:
              `Alias "${alias}" conflicts with "${existing.alias}". ` +
              `Both normalize to "${normalizedAlias}" but map to different commands.`,
          });

          continue;
        }

        normalizedAliases.set(normalizedAlias, {
          alias,
          command,
        });

        const canonicalForm = alias
          .trim()
          .toLowerCase()
          .replace(/\s+/g, "_");

        const registryCommand =
          lookupCommandDef(canonicalForm);

        if (
          registryCommand &&
          registryCommand !== command
        ) {
          findings.push({
            severity: "error",
            area: "alias",
            code: "COMMAND_ALIAS_DUPLICATE",
            alias,
            command,
            source:
              "parse.ts → commandRegistry.ts",
            message:
              `Alias "${alias}" maps to "${command}", but its normalized canonical form resolves to "${registryCommand}".`,
          });
        }
      }

      return findings;
    },
  };