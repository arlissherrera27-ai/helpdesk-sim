// src/core/scenarioIntegrity/checkStateMutationIntegrity.ts

import { handleInput } from "../engine";
import { SCENARIO_REGISTRY } from "../scenarioRegistry";
import { initialState } from "../state";

import {
  SCENARIO_MUTATION_CONTRACTS,
} from "./scenarioMutationContracts";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

type UnknownProcedureStep = {
  command?: unknown;
};

type UnknownScenario = {
  procedure?: readonly UnknownProcedureStep[];
  previewMetadata?: {
    selectCommand?: unknown;
  };
};

function isNonEmptyString(
  value: unknown
): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function getChangedKeys(
  before: Record<string, unknown>,
  after: Record<string, unknown>
): string[] {
  const keys = new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ]);

  return Array.from(keys).filter(
    (key) =>
      JSON.stringify(before[key]) !==
      JSON.stringify(after[key])
  );
}

export const checkStateMutationIntegrity:
  ArchitectureIntegrityCheck = {
    name: "State Mutation Inspector",
    area: "state_mutation",

    run: (): readonly IntegrityFinding[] => {
      const findings: IntegrityFinding[] = [];

      const registry =
        SCENARIO_REGISTRY as unknown as Record<
          string,
          UnknownScenario
        >;

      for (const [scenarioId, scenario] of Object.entries(
        registry
      )) {
        if (
          !Array.isArray(scenario.procedure) ||
          !isNonEmptyString(
            scenario.previewMetadata?.selectCommand
          )
        ) {
          continue;
        }

        const contracts =
          SCENARIO_MUTATION_CONTRACTS[
            scenarioId as keyof typeof SCENARIO_MUTATION_CONTRACTS
          ];

        if (!contracts) {
          continue;
        }

        let state = initialState();

        const selectionOutput = handleInput(
          state,
          scenario.previewMetadata.selectCommand
        );

        if (selectionOutput.decision.kind === "DENY") {
          continue;
        }

        state = selectionOutput.state;

        const startOutput = handleInput(
          state,
          "start"
        );

        if (startOutput.decision.kind === "DENY") {
          continue;
        }

        const commandOccurrences =
        new Map<string, number>();

        state = startOutput.state;

        for (const step of scenario.procedure) {
          if (!isNonEmptyString(step.command)) {
            continue;
          }

          const contractEntry =
            contracts[
                step.command as keyof typeof contracts
            ];

            const occurrence =
            commandOccurrences.get(step.command) ?? 0;

            const contract =
            Array.isArray(contractEntry)
                ? contractEntry[occurrence]
                : contractEntry;

                if (!contract) {
            findings.push({
                severity: "error",
                area: "state_mutation",
                code: "STATE_MUTATION_CONTRACT_MISSING",
                scenarioId,
                command: step.command,
                source: "scenarioMutationContracts.ts",
                message:
                `No state-mutation contract exists for command "${step.command}" occurrence ${occurrence + 1}.`,
            });

            break;
            }

          const beforeFacts =
            state.scenarioFacts &&
            typeof state.scenarioFacts === "object"
              ? {
                  ...(state.scenarioFacts as Record<
                    string,
                    unknown
                  >),
                }
              : {};

          const beforeResult =
            JSON.stringify(state.result);

          const output = handleInput(
            state,
            step.command
          );

          if (output.decision.kind === "DENY") {
            break;
          }

          const afterFacts =
            output.state.scenarioFacts &&
            typeof output.state.scenarioFacts === "object"
              ? {
                  ...(output.state.scenarioFacts as Record<
                    string,
                    unknown
                  >),
                }
              : {};

          const afterResult =
            JSON.stringify(output.state.result);

          if (contract) {
            const changedKeys = getChangedKeys(
              beforeFacts,
              afterFacts
            );

            for (const changedKey of changedKeys) {
              if (
                !contract.allowedFacts.includes(
                  changedKey
                )
              ) {
                findings.push({
                  severity: "error",
                  area: "state_mutation",
                  code:
                    "STATE_MUTATION_UNDECLARED_FACT_CHANGED",
                  scenarioId,
                  command: step.command,
                  fact: changedKey,
                  source: "engine.ts",
                  message:
                    `Command "${step.command}" changed undeclared scenario fact "${changedKey}".`,
                });
              }
            }

            for (
              const expectedFact of
              contract.expectedFacts ?? []
            ) {
              if (
                !changedKeys.includes(expectedFact)
              ) {
                findings.push({
                  severity: "error",
                  area: "state_mutation",
                  code:
                    "STATE_MUTATION_EXPECTED_FACT_UNCHANGED",
                  scenarioId,
                  command: step.command,
                  fact: expectedFact,
                  source: "engine.ts",
                  message:
                    `Command "${step.command}" did not change expected scenario fact "${expectedFact}".`,
                });
              }
            }

            if (
              beforeResult !== afterResult &&
              !contract.mayChangeResult
            ) {
              findings.push({
                severity: "error",
                area: "state_mutation",
                code:
                  "STATE_MUTATION_UNEXPECTED_RESULT_CHANGE",
                scenarioId,
                command: step.command,
                source: "engine.ts",
                message:
                  `Command "${step.command}" changed scenario result state without permission.`,
              });
            }
          }

          state = output.state;

        commandOccurrences.set(
        step.command,
        occurrence + 1
        );

        if (state.result?.completion === "PASS") {
        break;
        }
        }
      }

      return findings;
    },
  };