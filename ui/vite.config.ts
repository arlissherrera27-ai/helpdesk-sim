import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

import { formatArchitectureHealthReport } from "./src/core/scenarioIntegrity/formatArchitectureHealthReport";
import { runArchitectureIntegrity } from "./src/core/scenarioIntegrity/runArchitectureIntegrity";

function architectureIntegrityPlugin(): Plugin {
  return {
    name: "architecture-integrity",
    apply: "build",

    buildStart() {
      const report = runArchitectureIntegrity();
      const formattedReport =
        formatArchitectureHealthReport(report);

      console.log(`\n${formattedReport}\n`);

      if (!report.passed) {
        throw new Error(
          "Architecture integrity checks failed."
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [
    architectureIntegrityPlugin(),
    react(),
  ],
});