import { createElement, Fragment } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ProcedureResult, {
  ProcedureLearnMoreSection,
  TechnicalOutputLineResult,
} from "./ProcedureResult";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const result = {
  title: "Last completed procedure: DHCP test",
  technicianEntry: "ping 192.168.1.1",
  systemResult: "Approved system result.",
  technicalOutput: "Gateway: 192.168.1.1",
  technicalLines: [
    { id: "network.gateway", text: "Gateway: 192.168.1.1" },
    { id: "network.status", text: "Connection: Connected" },
  ],
  annotations: [
    {
      id: "gateway-note",
      targetLineId: "network.gateway",
      content: "Annotation fixture content.",
    },
  ],
  learnMore: {
    howToExecute: "How-to fixture content.",
    whatItDoesAndHow: "Mechanism fixture content.",
    whyThisMatters: "Rationale fixture content.",
  },
};

const practiceMarkup = renderToStaticMarkup(
  createElement(ProcedureResult, {
    ...result,
    showEducationalContainers: true,
  })
);

assert(practiceMarkup.includes("System Results"), "System result section is missing.");
assert(practiceMarkup.includes("network.gateway"), "Stable technical line ID is missing.");
assert(practiceMarkup.includes('aria-expanded="false"'), "Educational controls must start collapsed.");
assert(practiceMarkup.includes("Show Annotations"), "Annotation control is missing.");
assert(practiceMarkup.includes("Learn More"), "Learn More control is missing.");
assert(!practiceMarkup.includes("Annotation fixture content."), "Collapsed annotations should remain hidden.");
assert(!practiceMarkup.includes("How-to fixture content."), "Collapsed lessons should remain hidden.");

const assessmentMarkup = renderToStaticMarkup(
  createElement(ProcedureResult, {
    ...result,
    showEducationalContainers: false,
  })
);

assert(assessmentMarkup.includes("Approved system result."), "Non-Practice result was hidden.");
assert(!assessmentMarkup.includes("Show Annotations"), "Annotations appeared outside Practice.");
assert(!assessmentMarkup.includes("Learn More"), "Learn More appeared outside Practice.");

const annotationMarkup = renderToStaticMarkup(
  createElement(
    Fragment,
    null,
    createElement(TechnicalOutputLineResult, {
      line: { id: "network.gateway", text: "Gateway: 192.168.1.1" },
      annotations: result.annotations,
      annotationsOpen: true,
    }),
    createElement(TechnicalOutputLineResult, {
      line: { id: "network.status", text: "Connection: Connected" },
      annotations: result.annotations,
      annotationsOpen: true,
    })
  )
);
const gatewayLinePosition = annotationMarkup.indexOf('id="network.gateway"');
const annotationPosition = annotationMarkup.indexOf("Annotation fixture content.");
const nextLinePosition = annotationMarkup.indexOf('id="network.status"');
assert(
  gatewayLinePosition >= 0 &&
    gatewayLinePosition < annotationPosition &&
    annotationPosition < nextLinePosition,
  "Annotation did not remain attached to its stable technical line."
);

for (const [title, content] of [
  ["How to Execute", "How-to fixture content."],
  ["What It Does and How", "Mechanism fixture content."],
  ["Why This Matters", "Rationale fixture content."],
] as const) {
  const lessonMarkup = renderToStaticMarkup(
    createElement(ProcedureLearnMoreSection, { title, content })
  );
  assert(lessonMarkup.includes(title), `${title} section is missing.`);
  assert(lessonMarkup.includes(content), `${title} content is missing.`);
}

const emptyMarkup = renderToStaticMarkup(
  createElement(ProcedureResult, {
    title: "Empty education fixture",
    systemResult: "Result remains available.",
    technicalOutput: "Evidence remains available.",
    annotations: [],
    learnMore: {},
    showEducationalContainers: true,
  })
);

assert(emptyMarkup.includes("Show Annotations"), "Empty annotation control is unavailable.");
assert(emptyMarkup.includes("Learn More"), "Empty Learn More control is unavailable.");
assert(emptyMarkup.includes("Result remains available."), "Empty education data concealed the result.");
