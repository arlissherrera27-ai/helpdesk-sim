// src/core/scenarioIntegrity/checkCommandReachabilityIntegrity.ts

import { procedureCatalog } from "../procedureCatalog";
import { SCENARIO_REGISTRY } from "../scenarioRegistry";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

type UnknownScenario = {
  procedure?: readonly {
    command?: unknown;
  }[];
};

export const checkCommandReachabilityIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Command Reachability Inspector",
    area: "reachability",

    run: (): readonly IntegrityFinding[] => {
      const findings: IntegrityFinding[] = [];

      const reachableCommands = new Set<string>();

      const registry =
        SCENARIO_REGISTRY as unknown as Record<
          string,
          UnknownScenario
        >;

      for (const scenario of Object.values(registry)) {
        if (!Array.isArray(scenario.procedure)) {
          continue;
        }

        for (const step of scenario.procedure) {
          if (typeof step.command === "string") {
            reachableCommands.add(step.command);
          }
        }
      }

      for (const command of Object.keys(procedureCatalog)) {
        if (reachableCommands.has(command)) {
          continue;
        }

        findings.push({
          severity: "error",
          area: "reachability",
          code: "COMMAND_UNREACHABLE",
          command,
          source:
            "procedureCatalog.ts → scenarioRegistry.ts",
          message:
            "Procedure command exists in the catalog but is not used by any scenario procedure.",
        });
      }

      return findings;
    },
  };