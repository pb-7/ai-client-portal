"use client";

import { useActionState, useId } from "react";

import { FormSubmitButton } from "@/components/portal/form-submit-button";
import type { ClientDeletionState } from "@/types/portal";

type SoftDeleteAction = (
  state: ClientDeletionState,
  formData: FormData,
) => Promise<ClientDeletionState>;

type SoftDeleteClientFormProps = {
  action: SoftDeleteAction;
  clientName: string;
};

const INITIAL_STATE: ClientDeletionState = {};

export function SoftDeleteClientForm({
  action,
  clientName,
}: SoftDeleteClientFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const confirmationId = useId();

  return (
    <form action={formAction} className="space-y-5">
      <label
        htmlFor={confirmationId}
        className="flex cursor-pointer items-start gap-3 rounded-lg border border-brand-red/20 bg-brand-red/[0.035] p-4"
      >
        <input
          id={confirmationId}
          name="confirmDeletion"
          type="checkbox"
          value="confirmed"
          required
          className="mt-1 h-4 w-4 shrink-0 accent-[#C8102E]"
        />
        <span className="text-sm leading-6 text-black/65">
          Confirm that <span className="font-bold">{clientName}</span> should be
          moved to Recently Deleted. Related records will be retained.
        </span>
      </label>

      {state.message ? (
        <p role="alert" className="text-sm text-brand-red">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end">
        <FormSubmitButton
          label="Delete client"
          pendingLabel="Deleting…"
        />
      </div>
    </form>
  );
}
