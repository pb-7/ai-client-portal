"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/portal/form-submit-button";
import { NARRATIVE_FIELD_LIMITS } from "@/constants/narrative";
import type {
  ClientNarrative,
  NarrativeField,
  NarrativeMutationState,
} from "@/types/narrative";

type SaveNarrativeAction = (
  state: NarrativeMutationState,
  formData: FormData,
) => Promise<NarrativeMutationState>;

const NARRATIVE_SECTIONS: ReadonlyArray<{
  description: string;
  field: NarrativeField;
  label: string;
}> = [
  {
    field: "retirementSummary",
    label: "Retirement summary",
    description: "Narrative context for the client’s retirement priorities.",
  },
  {
    field: "consolidationSummary",
    label: "Consolidation summary",
    description: "Narrative context for assets held with and outside the firm.",
  },
  {
    field: "portfolioSummary",
    label: "Portfolio summary",
    description: "Narrative context for risk and the current allocation.",
  },
  {
    field: "nextSteps",
    label: "Next steps",
    description: "Narrative next steps grounded in goals and advisor notes.",
  },
];

export function NarrativeReviewForm({
  action,
  initialNarrative,
}: {
  action: SaveNarrativeAction;
  initialNarrative: ClientNarrative;
}) {
  const [state, formAction] = useActionState(action, {});
  const values = state.values ?? initialNarrative;

  return (
    <form action={formAction} className="space-y-6">
      {NARRATIVE_SECTIONS.map(({ description, field, label }) => {
        const error = state.fieldErrors?.[field];
        return (
          <div key={field}>
            <label htmlFor={`narrative-${field}`} className="text-sm font-bold text-black/70">
              {label}
            </label>
            <p className="mt-1 text-xs leading-5 text-black/45">{description}</p>
            <textarea
              id={`narrative-${field}`}
              name={field}
              required
              maxLength={NARRATIVE_FIELD_LIMITS[field]}
              rows={5}
              defaultValue={values[field]}
              aria-invalid={Boolean(error)}
              className="mt-2 w-full rounded-md border border-black/15 bg-white px-4 py-3 leading-6 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
            />
            {error ? (
              <p className="mt-2 text-sm text-brand-red">{error}</p>
            ) : null}
          </div>
        );
      })}

      {state.message ? (
        <p role="alert" className="text-sm text-brand-red">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-black/10 pt-6">
        <FormSubmitButton
          label="Save reviewed version"
          pendingLabel="Saving narrative…"
        />
      </div>
    </form>
  );
}
