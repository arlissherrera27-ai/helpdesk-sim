// Cold-test harness only.
// Allowed: read input, call pipeline, print state.
// Not allowed: system rules, legitimacy logic, mutation logic.
import readline from "readline";
import { handleInput } from "./core/engine";
import { SimState } from "./core/types";
import { initialState } from "./core/state";

// Initial cold state
let state: SimState = initialState();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

function loop() {
  rl.question("> ", (input) => {
    if (input.trim() === "") {
      // No-op: empty input is not a command and should not enter the pipeline
      loop();
      return;
    }

    const out = handleInput(state, input);
    state = out.state;

    if (out.message) {
      console.log(out.message);
    }
    loop();
  });
}

loop();