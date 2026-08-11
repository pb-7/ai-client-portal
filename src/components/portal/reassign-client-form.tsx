"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/portal/form-submit-button";
import type { AdvisorOption, ReassignmentState } from "@/types/portal";

type ReassignmentAction = (
  state: ReassignmentState,
  formData: FormData,
) => Promise<ReassignmentState>;

type ReassignClientFormProps = {
  action: ReassignmentAction;
  advisors: AdvisorOption[];
  currentAdvisorId: string | null;
};

const INITIAL_STATE: ReassignmentState = {};

export function ReassignClientForm({
  action,
  advisors,
  currentAdvisorId,
}: ReassignClientFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const currentAdvisorIsActive = advisors.some(
    (advisor) => advisor.id === currentAdvisorId,
  );

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="advisor-id" className="text-sm font-bold text-black/70">
          Assigned advisor
        </label>
        <select
          id="advisor-id"
          name="advisorId"
          required
          defaultValue={currentAdvisorIsActive ? currentAdvisorId ?? "" : ""}
          aria-describedby={state.fieldError ? "advisor-error" : undefined}
          aria-invalid={Boolean(state.fieldError)}
          disabled={advisors.length === 0}
          className="mt-2 h-12 w-full rounded-md border border-black/15 bg-white px-4 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15 disabled:cursor-not-allowed disabled:bg-black/[0.03]"
        >
          <option value="" disabled>
            Select an active advisor
          </option>
          {advisors.map((advisor) => (
            <option key={advisor.id} value={advisor.id}>
              {advisor.label}
            </option>
          ))}
        </select>
        {state.fieldError ? (
          <p id="advisor-error" className="mt-2 text-sm text-brand-red">
            {state.fieldError}
          </p>
        ) : null}
        {advisors.length === 0 ? (
          <p className="mt-2 text-sm text-black/50">
            No active advisor profiles are available.
          </p>
        ) : null}
      </div>

      {state.message ? (
        <p role="alert" className="text-sm text-brand-red">
          {state.message}
        </p>
      ) : null}

      <div className="flex justify-end border-t border-black/10 pt-5">
        <FormSubmitButton
          disabled={advisors.length === 0}
          label="Reassign client"
          pendingLabel="Reassigning…"
        />
      </div>
    </form>
  );
}
