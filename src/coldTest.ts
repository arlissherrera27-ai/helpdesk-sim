import { initialState } from "./core/state";
import { handleInput } from "./core/engine";

let state = initialState();
console.log("BOOT:", state.executionState, state.attempt);

// From LOBBY → start
let out = handleInput(state, "start");
state = out.state;
console.log("AFTER start:", state.executionState, state.attempt);

// While RUNNING → restart
out = handleInput(state, "restart");
state = out.state;
console.log("AFTER restart:", state.executionState, state.attempt);

// Invalid: start again while RUNNING
out = handleInput(state, "start");
console.log("START again decision:", out.decision);
