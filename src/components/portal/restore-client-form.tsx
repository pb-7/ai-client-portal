"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/portal/form-submit-button";
import type { ClientRestorationState } from "@/types/portal";

type RestoreAction = (
  state: ClientRestorationState,
  formData: FormData,
) => Promise<ClientRestorationState>;

type RestoreClientFormProps = {
  action: RestoreAction;
};

const INITIAL_STATE: ClientRestorationState = {};

export function RestoreClientForm({ action }: RestoreClientFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);

  return (
    <form action={formAction}>
      <input type="hidden" name="restoreClient" value="confirmed" />
      {state.message ? (
        <p role="alert" className="mb-3 text-sm text-brand-red">
          {state.message}
        </p>
      ) : null}
      <FormSubmitButton label="Restore" pendingLabel="Restoring…" />
    </form>
  );
}
