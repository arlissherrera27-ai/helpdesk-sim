// src/core/scenarioIntegrity/checkExecutionPlanIntegrity.ts

import {
  PROCEDURE_CATALOG_PLAN_COVERAGE,
} from "../procedureCatalog";

import type {
  ArchitectureIntegrityCheck,
  IntegrityFinding,
} from "./types";

export const checkExecutionPlanIntegrity:
  ArchitectureIntegrityCheck = {
    name: "Execution Plan Integrity",
    area: "execution_plan",

    run: (): readonly IntegrityFinding[] => {
      // This value can only compile as true when:
      //
      // 1. Every non-system ExecutionPlan exists in procedureCatalog.
      // 2. procedureCatalog contains no invalid ExecutionPlan.
      //
      // If either condition breaks, TypeScript fails before the
      // architecture health report can run.
      if (PROCEDURE_CATALOG_PLAN_COVERAGE !== true) {
        return [
          {
            severity: "error",
            area: "execution_plan",
            code: "COMMAND_PLAN_MISSING",
            source: "procedureCatalog.ts",
            message:
              "Procedure catalog ExecutionPlan coverage is incomplete.",
          },
        ];
      }

      return [];
    },
  };