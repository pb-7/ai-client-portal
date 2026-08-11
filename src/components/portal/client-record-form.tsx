"use client";

import Link from "next/link";
import { useActionState } from "react";

import { FormSubmitButton } from "@/components/portal/form-submit-button";
import type {
  ClientMutationState,
  ClientStatus,
} from "@/types/portal";

type ClientFormAction = (
  state: ClientMutationState,
  formData: FormData,
) => Promise<ClientMutationState>;

type ClientRecordFormProps = {
  action: ClientFormAction;
  cancelHref: string;
  initialName?: string;
  initialStatus?: ClientStatus;
  submitLabel: string;
};

const INITIAL_STATE: ClientMutationState = {};

export function ClientRecordForm({
  action,
  cancelHref,
  initialName = "",
  initialStatus = "active",
  submitLabel,
}: ClientRecordFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const nameErrorId = state.fieldErrors?.name ? "client-name-error" : undefined;
  const statusErrorId = state.fieldErrors?.status
    ? "client-status-error"
    : undefined;

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <label htmlFor="client-name" className="text-sm font-bold text-black/70">
          Household or client display name
        </label>
        <input
          id="client-name"
          name="name"
          type="text"
          required
          maxLength={120}
          autoComplete="off"
          defaultValue={state.values?.name ?? initialName}
          aria-describedby={nameErrorId}
          aria-invalid={Boolean(state.fieldErrors?.name)}
          className="mt-2 h-12 w-full rounded-md border border-black/15 bg-white px-4 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
        />
        {state.fieldErrors?.name ? (
          <p id={nameErrorId} className="mt-2 text-sm text-brand-red">
            {state.fieldErrors.name}
          </p>
        ) : null}
      </div>

      <div>
        <label htmlFor="client-status" className="text-sm font-bold text-black/70">
          Client status
        </label>
        <select
          id="client-status"
          name="status"
          defaultValue={state.values?.status ?? initialStatus}
          aria-describedby={statusErrorId}
          aria-invalid={Boolean(state.fieldErrors?.status)}
          className="mt-2 h-12 w-full rounded-md border border-black/15 bg-white px-4 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
        >
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
        {state.fieldErrors?.status ? (
          <p id={statusErrorId} className="mt-2 text-sm text-brand-red">
            {state.fieldErrors.status}
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p role="alert" className="text-sm text-brand-red">
          {state.message}
        </p>
      ) : null}

      <div className="flex flex-col-reverse gap-3 border-t border-black/10 pt-6 sm:flex-row sm:justify-end">
        <Link
          href={cancelHref}
          className="inline-flex h-11 items-center justify-center rounded-md border border-black/15 px-5 text-sm font-bold transition hover:bg-black/[0.03]"
        >
          Cancel
        </Link>
        <FormSubmitButton label={submitLabel} pendingLabel="Saving…" />
      </div>
    </form>
  );
}
