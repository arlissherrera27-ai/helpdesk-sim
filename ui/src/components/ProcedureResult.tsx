
import { useId, useState } from "react";
import type { ReactNode } from "react";
import type {
  ProcedureLearnMoreContent,
  ProcedureSideAnnotation,
  TechnicalOutputLine,
} from "../core/procedurePresentation";

export type ProcedureResultProps = {
  title?: string;
  technicianEntry?: string;
  systemResult?: string;
  technicalOutput?: ReactNode;
  technicalLines?: readonly TechnicalOutputLine[];
  annotations?: readonly ProcedureSideAnnotation[];
  learnMore?: Partial<ProcedureLearnMoreContent>;
  showEducationalContainers?: boolean;
  defaultExpanded?: boolean;
};

export default function ProcedureResult({
  title,
  technicianEntry,
  systemResult,
  technicalOutput,
  technicalLines,
  annotations = [],
  learnMore,
  showEducationalContainers = false,
  defaultExpanded = false,
}: ProcedureResultProps) {
  const [annotationsOpen, setAnnotationsOpen] = useState(defaultExpanded);
  const [learnMoreOpen, setLearnMoreOpen] = useState(defaultExpanded);
  const annotationsId = useId();
  const learnMoreId = useId();
  const attachedAnnotationCount = technicalLines
    ? technicalLines.reduce(
        (count, line) =>
          count + annotations.filter((annotation) => annotation.targetLineId === line.id).length,
        0
      )
    : 0;

  return (
    <div className="procedure-result">
      {title && <div className="procedure-result__title">{title}</div>}

      {technicianEntry && (
        <div className="procedure-result__section">
          <div className="procedure-result__label">TECHNICIAN ENTERS</div>
          <div className="procedure-result__plain-output">{technicianEntry}</div>
        </div>
      )}

      {systemResult && (
        <div className="procedure-result__section">
          <div className="procedure-result__system-title">System Results</div>
          <div className="procedure-result__plain-output">{systemResult}</div>
        </div>
      )}

      {technicalLines ? (
        <div className="procedure-result__technical-lines" aria-label="Simulated technical output">
          {technicalLines.map((line) => (
            <TechnicalOutputLineResult
              key={line.id}
              line={line}
              annotations={annotations}
              annotationsOpen={showEducationalContainers && annotationsOpen}
            />
          ))}
        </div>
      ) : technicalOutput ? (
        <div className="procedure-result__plain-output" aria-label="Simulated technical output">
          {technicalOutput}
        </div>
      ) : null}

      {showEducationalContainers && (
        <>
          <section className="procedure-result__education" aria-label="Side Annotations">
            <button
              type="button"
              className="procedure-result__toggle"
              aria-expanded={annotationsOpen}
              aria-controls={annotationsId}
              onClick={() => setAnnotationsOpen((open) => !open)}
            >
              {annotationsOpen ? "Hide Annotations" : "Show Annotations"}
            </button>
            {annotationsOpen && (
              <div id={annotationsId}>
                {attachedAnnotationCount === 0 && (
                  <p className="procedure-result__empty">
                    No approved annotations have been added to this procedure.
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="procedure-result__education" aria-label="Learn More">
            <button
              type="button"
              className="procedure-result__toggle"
              aria-expanded={learnMoreOpen}
              aria-controls={learnMoreId}
              onClick={() => setLearnMoreOpen((open) => !open)}
            >
              {learnMoreOpen ? "Hide Learn More" : "Learn More"}
            </button>
            {learnMoreOpen && (
              <div className="procedure-result__lessons" id={learnMoreId}>
                <ProcedureLearnMoreSection title="How to Execute" content={learnMore?.howToExecute} defaultExpanded={defaultExpanded} />
                <ProcedureLearnMoreSection title="What It Does and How" content={learnMore?.whatItDoesAndHow} defaultExpanded={defaultExpanded} />
                <ProcedureLearnMoreSection title="Why This Matters" content={learnMore?.whyThisMatters} defaultExpanded={defaultExpanded} />
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export function TechnicalOutputLineResult({
  line,
  annotations,
  annotationsOpen,
}: {
  line: TechnicalOutputLine;
  annotations: readonly ProcedureSideAnnotation[];
  annotationsOpen: boolean;
}) {
  const lineAnnotations = annotations.filter(
    (annotation) => annotation.targetLineId === line.id
  );

  return (
    <div className="procedure-result__line-row">
      <pre className="procedure-result__line-text" id={line.id}>
        {line.text || " "}
      </pre>
      {annotationsOpen && lineAnnotations.length > 0 && (
        <aside className="procedure-result__annotation">
          {lineAnnotations.map((annotation) => (
            <div key={annotation.id}>{annotation.content}</div>
          ))}
        </aside>
      )}
    </div>
  );
}

export function ProcedureLearnMoreSection({
  title,
  content,
  defaultExpanded = false,
}: {
  title: string;
  content?: string | null;
  defaultExpanded?: boolean;
}) {
  return (
    <details className="procedure-result__lesson" open={defaultExpanded}>
      <summary>{title}</summary>
      <div className="procedure-result__lesson-content">
        {content?.trim() || (
          <span className="procedure-result__empty">
            No approved content has been added to this section.
          </span>
        )}
      </div>
    </details>
  );
}
