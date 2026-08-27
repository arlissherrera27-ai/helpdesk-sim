// src/core/scenarioIntegrity/checkExecuteHandlerIntegrity.ts

import {
  EXECUTE_HANDLER_COVERAGE,
} from "../execute";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

export const checkExecuteHandlerIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Execute Handler Integrity",
    area: "execute_handler",

    run: (): readonly IntegrityFinding[] => {
      if (EXECUTE_HANDLER_COVERAGE !== true) {
        return [
          {
            severity: "error",
            area: "execute_handler",
            code: "EXECUTION_PLAN_HANDLER_MISSING",
            source: "execute.ts",
            message:
              "ExecutionPlan handler coverage is incomplete.",
          },
        ];
      }

      return [];
    },
  };