import "server-only";

import { NARRATIVE_FIELD_LIMITS } from "@/constants/narrative";
import type {
  ClientNarrative,
  NarrativeField,
  NarrativeMutationState,
} from "@/types/narrative";

export const NARRATIVE_OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    retirementSummary: {
      type: "string",
      description: "A concise retirement-planning narrative grounded only in the supplied inputs.",
    },
    consolidationSummary: {
      type: "string",
      description: "A concise account-consolidation narrative grounded only in the supplied inputs.",
    },
    portfolioSummary: {
      type: "string",
      description: "A concise portfolio narrative grounded only in the supplied inputs.",
    },
    nextSteps: {
      type: "string",
      description: "Concise next steps grounded only in supplied goals and advisor talking points.",
    },
  },
  required: [
    "retirementSummary",
    "consolidationSummary",
    "portfolioSummary",
    "nextSteps",
  ],
  additionalProperties: false,
} as const;

const NARRATIVE_FIELDS = Object.keys(
  NARRATIVE_FIELD_LIMITS,
) as NarrativeField[];

function validateNarrativeValues(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== NARRATIVE_FIELDS.length ||
    NARRATIVE_FIELDS.some((field) => !(field in record))
  ) {
    return null;
  }

  const narrative = {} as ClientNarrative;
  for (const field of NARRATIVE_FIELDS) {
    const rawValue = record[field];
    if (typeof rawValue !== "string") return null;

    const text = rawValue.trim();
    if (!text || text.length > NARRATIVE_FIELD_LIMITS[field]) return null;
    narrative[field] = text;
  }

  return narrative;
}

export function parseStoredNarrative(value: unknown) {
  return validateNarrativeValues(value);
}

export function validateGeneratedNarrative(value: unknown) {
  return validateNarrativeValues(value);
}

export function validateNarrativeForm(
  formData: FormData,
):
  | { data: ClientNarrative; success: true }
  | { state: NarrativeMutationState; success: false } {
  const values = {} as ClientNarrative;
  const fieldErrors: NonNullable<NarrativeMutationState["fieldErrors"]> = {};

  for (const field of NARRATIVE_FIELDS) {
    const rawValue = formData.get(field);
    const text = typeof rawValue === "string" ? rawValue.trim() : "";
    values[field] = text;

    if (!text) {
      fieldErrors[field] = "Enter narrative content for this section.";
    } else if (text.length > NARRATIVE_FIELD_LIMITS[field]) {
      fieldErrors[field] = `Use ${NARRATIVE_FIELD_LIMITS[field].toLocaleString()} characters or fewer.`;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      state: {
        fieldErrors,
        message: "Review the highlighted narrative sections and try again.",
        values,
      },
      success: false,
    };
  }

  return { data: values, success: true };
}
