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

const expandedMarkup = renderToStaticMarkup(
  createElement(ProcedureResult, {
    ...result,
    showEducationalContainers: true,
    defaultExpanded: true,
  })
);

assert(expandedMarkup.includes("System Results"), "Expanded presentation concealed System Results.");
assert(expandedMarkup.includes("network.gateway"), "Expanded presentation concealed Technical Output.");
assert(expandedMarkup.includes("Annotation fixture content."), "Expanded presentation did not render annotation content.");
assert(expandedMarkup.includes('aria-expanded="true"'), "Expanded presentation did not report expanded controls.");
assert(expandedMarkup.includes("Hide Annotations"), "Expanded annotation control state is incorrect.");
assert(expandedMarkup.includes("Hide Learn More"), "Expanded Learn More control state is incorrect.");
assert(expandedMarkup.includes("How-to fixture content."), "Expanded How to Execute content is missing.");
assert(expandedMarkup.includes("Mechanism fixture content."), "Expanded What It Does and How content is missing.");
assert(expandedMarkup.includes("Rationale fixture content."), "Expanded Why This Matters content is missing.");

const openDetailsCount = (expandedMarkup.match(/<details[^>]*open(?:="")?[^>]*>/g) ?? []).length;
assert(openDetailsCount === 3, `Expected three initially open details elements, found ${openDetailsCount}.`);

const restrictedMarkup = renderToStaticMarkup(
  createElement(ProcedureResult, {
    ...result,
    showEducationalContainers: false,
    defaultExpanded: true,
  })
);

assert(restrictedMarkup.includes("Approved system result."), "Restricted presentation concealed System Results.");
assert(restrictedMarkup.includes("network.gateway"), "Restricted presentation concealed Technical Output.");
assert(!restrictedMarkup.includes("Annotation fixture content."), "Restricted presentation exposed annotation content.");
assert(!restrictedMarkup.includes("Show Annotations"), "Restricted presentation exposed the annotation control.");
assert(!restrictedMarkup.includes("Learn More"), "Restricted presentation exposed the Learn More control.");
assert(!restrictedMarkup.includes("How-to fixture content."), "Restricted presentation exposed Learn More content.");

const independentMarkup = renderToStaticMarkup(
  createElement(
    Fragment,
    null,
    createElement(ProcedureResult, {
      ...result,
      title: "First repeated procedure",
      technicianEntry: "test_user_login",
      showEducationalContainers: true,
      defaultExpanded: true,
    }),
    createElement(ProcedureResult, {
      ...result,
      title: "Second repeated procedure",
      technicianEntry: "test_user_login",
      systemResult: "Second independent system result.",
      showEducationalContainers: true,
      defaultExpanded: true,
    })
  )
);

const independentAnnotationCount = (independentMarkup.match(/Annotation fixture content/g) ?? []).length;
const independentLearnMoreCount = (independentMarkup.match(/How-to fixture content/g) ?? []).length;
assert(independentAnnotationCount === 2, "Independent expanded results did not render separate annotation content.");
assert(independentLearnMoreCount === 2, "Independent expanded results did not render separate Learn More content.");
assert(independentMarkup.includes("First repeated procedure"), "First independent procedure is missing.");
assert(independentMarkup.includes("Second independent system result."), "Second independent procedure is missing.");

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
    defaultExpanded: true,
  })
);

assert(emptyMarkup.includes("Hide Annotations"), "Expanded empty annotation control is unavailable.");
assert(emptyMarkup.includes("No approved annotations have been added to this procedure."), "Empty annotation message is missing.");
assert(emptyMarkup.includes("Hide Learn More"), "Expanded empty Learn More control is unavailable.");
assert(emptyMarkup.includes("No approved content has been added to this section."), "Empty Learn More message is missing.");
assert(emptyMarkup.includes("Result remains available."), "Empty education data concealed the result.");
assert(emptyMarkup.includes("Evidence remains available."), "Empty education data concealed technical output.");
