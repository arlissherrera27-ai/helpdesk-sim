import type { SimState } from "./types";

export function assertInvariant(ctx: {
  stage: "loop-start";
  state: SimState;
  input: string;
}) {
  // Observability only: label + tiny context
  console.log(`[INV] ${ctx.stage}`);
}
