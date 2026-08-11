export type ClientNarrative = {
  retirementSummary: string;
  consolidationSummary: string;
  portfolioSummary: string;
  nextSteps: string;
};

export type NarrativeField = keyof ClientNarrative;

export type NarrativeMutationState = {
  fieldErrors?: Partial<Record<NarrativeField, string>>;
  message?: string;
  values?: ClientNarrative;
};

export type NarrativeVersionSummary = {
  createdAt: string;
  modelName: string | null;
  modelProvider: string | null;
  promptVersion: string | null;
  status: "draft" | "reviewed" | "published";
  versionNumber: number;
};
