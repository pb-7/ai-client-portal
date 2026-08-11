"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/portal/form-submit-button";
import type { NarrativeMutationState } from "@/types/narrative";

type GenerateNarrativeAction = (
  state: NarrativeMutationState,
  formData: FormData,
) => Promise<NarrativeMutationState>;

export function GenerateNarrativeForm({
  action,
  disabled,
}: {
  action: GenerateNarrativeAction;
  disabled: boolean;
}) {
  const [state, formAction] = useActionState(action, {});

  return (
    <form action={formAction}>
      <FormSubmitButton
        disabled={disabled}
        label="Generate draft"
        pendingLabel="Generating draft…"
      />
      {disabled ? (
        <p className="mt-2 text-xs leading-5 text-black/50">
          Save valid structured financial inputs before generating a draft.
        </p>
      ) : null}
      {state.message ? (
        <p role="alert" className="mt-3 text-sm text-brand-red">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
