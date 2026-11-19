export type TechnicalOutputLine = {
  id: string;
  text: string;
};

export type ProcedureSideAnnotation = {
  id: string;
  targetLineId: string;
  content: string;
};

export type ProcedureLearnMoreContent = {
  howToExecute: string | null;
  whatItDoesAndHow: string | null;
  whyThisMatters: string | null;
};

export type ProcedureResultPresentation = {
  scenarioId: string;
  command: string;
  procedureIndex: number;
  commandOccurrence: number;
  technicianEntry: string;
  systemResult: string;
  technicalOutput: string;
  technicalLines?: readonly TechnicalOutputLine[];
  annotations: readonly ProcedureSideAnnotation[];
  learnMore: ProcedureLearnMoreContent;
};
