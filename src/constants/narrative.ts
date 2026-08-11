export const ANTHROPIC_NARRATIVE_MODEL = "claude-sonnet-5";
export const NARRATIVE_PROMPT_VERSION = "client-narrative-v1";

export const NARRATIVE_FIELD_LIMITS = {
  retirementSummary: 1_200,
  consolidationSummary: 1_200,
  portfolioSummary: 1_200,
  nextSteps: 1_600,
} as const;
