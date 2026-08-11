"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/portal/form-submit-button";
import {
  RISK_PROFILE_OPTIONS,
  US_STATE_OPTIONS,
} from "@/constants/client-inputs";
import type {
  ClientFinancialInputs,
  ClientInputFormValues,
  ClientInputMutationState,
} from "@/types/client-inputs";

type ClientInputAction = (
  state: ClientInputMutationState,
  formData: FormData,
) => Promise<ClientInputMutationState>;

type ClientFinancialInputFormProps = {
  action: ClientInputAction;
  initialInputs?: ClientFinancialInputs;
};

const INITIAL_STATE: ClientInputMutationState = {};
const INPUT_CLASS =
  "mt-2 h-12 w-full rounded-md border border-black/15 bg-white px-4 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15";

const allocationFields = [
  { label: "US equity", name: "usEquity" },
  { label: "International equity", name: "internationalEquity" },
  { label: "Fixed income", name: "fixedIncome" },
  { label: "Cash", name: "cash" },
  { label: "Alternatives", name: "alternatives" },
] as const;

function initialFormValues(
  inputs?: ClientFinancialInputs,
): ClientInputFormValues {
  return {
    meetingPurpose: inputs?.meetingPurpose ?? "",
    primaryClientAge: inputs ? String(inputs.primaryClientAge) : "",
    spousePartnerAge:
      inputs?.spousePartnerAge === null || inputs?.spousePartnerAge === undefined
        ? ""
        : String(inputs.spousePartnerAge),
    targetRetirementAge: inputs ? String(inputs.targetRetirementAge) : "",
    state: inputs?.state ?? "",
    assetsCurrentlyWithFirm: inputs
      ? String(inputs.assetsCurrentlyWithFirm)
      : "",
    outsideAssets: inputs ? String(inputs.outsideAssets) : "",
    riskProfile: inputs?.riskProfile ?? "",
    retirementGoal: inputs?.goals.retirement ?? false,
    educationGoal: inputs?.goals.education ?? false,
    legacyGoal: inputs?.goals.legacy ?? false,
    usEquity: inputs ? String(inputs.portfolioAllocation.usEquity) : "",
    internationalEquity: inputs
      ? String(inputs.portfolioAllocation.internationalEquity)
      : "",
    fixedIncome: inputs ? String(inputs.portfolioAllocation.fixedIncome) : "",
    cash: inputs ? String(inputs.portfolioAllocation.cash) : "",
    alternatives: inputs ? String(inputs.portfolioAllocation.alternatives) : "",
    advisorTalkingPoints: inputs?.advisorTalkingPoints ?? "",
  };
}

export function ClientFinancialInputForm({
  action,
  initialInputs,
}: ClientFinancialInputFormProps) {
  const [state, formAction] = useActionState(action, INITIAL_STATE);
  const values = state.values ?? initialFormValues(initialInputs);
  const error = (name: keyof ClientInputFormValues) =>
    state.fieldErrors?.[name];

  return (
    <form action={formAction} className="space-y-8">
      <fieldset>
        <legend className="text-base font-bold">Meeting context</legend>
        <div className="mt-4">
          <label htmlFor="meeting-purpose" className="text-sm font-bold text-black/70">
            Meeting purpose
          </label>
          <textarea
            id="meeting-purpose"
            name="meetingPurpose"
            required
            maxLength={500}
            rows={3}
            defaultValue={values.meetingPurpose}
            aria-invalid={Boolean(error("meetingPurpose"))}
            className="mt-2 w-full rounded-md border border-black/15 bg-white px-4 py-3 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
          />
          {error("meetingPurpose") ? (
            <p className="mt-2 text-sm text-brand-red">{error("meetingPurpose")}</p>
          ) : null}
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <NumberField
            error={error("primaryClientAge")}
            id="primary-client-age"
            label="Primary client age"
            max={120}
            min={18}
            name="primaryClientAge"
            required
            step="1"
            value={values.primaryClientAge}
          />
          <NumberField
            error={error("spousePartnerAge")}
            id="spouse-partner-age"
            label="Spouse/partner age"
            max={120}
            min={18}
            name="spousePartnerAge"
            step="1"
            value={values.spousePartnerAge}
          />
          <NumberField
            error={error("targetRetirementAge")}
            id="target-retirement-age"
            label="Target retirement age"
            max={100}
            min={30}
            name="targetRetirementAge"
            required
            step="1"
            value={values.targetRetirementAge}
          />
          <div>
            <label htmlFor="client-state" className="text-sm font-bold text-black/70">
              State
            </label>
            <select
              id="client-state"
              name="state"
              required
              defaultValue={values.state}
              aria-invalid={Boolean(error("state"))}
              className={INPUT_CLASS}
            >
              <option value="">Select state</option>
              {US_STATE_OPTIONS.map(([code, label]) => (
                <option key={code} value={code}>{label}</option>
              ))}
            </select>
            {error("state") ? (
              <p className="mt-2 text-sm text-brand-red">{error("state")}</p>
            ) : null}
          </div>
        </div>
      </fieldset>

      <fieldset className="border-t border-black/10 pt-8">
        <legend className="text-base font-bold">Assets and risk</legend>
        <div className="mt-4 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <NumberField
            error={error("assetsCurrentlyWithFirm")}
            id="assets-with-firm"
            label="Assets currently with firm ($)"
            min={0}
            name="assetsCurrentlyWithFirm"
            required
            step="0.01"
            value={values.assetsCurrentlyWithFirm}
          />
          <NumberField
            error={error("outsideAssets")}
            id="outside-assets"
            label="Outside assets ($)"
            min={0}
            name="outsideAssets"
            required
            step="0.01"
            value={values.outsideAssets}
          />
          <div>
            <label htmlFor="risk-profile" className="text-sm font-bold text-black/70">
              Risk profile
            </label>
            <select
              id="risk-profile"
              name="riskProfile"
              required
              defaultValue={values.riskProfile}
              aria-invalid={Boolean(error("riskProfile"))}
              className={INPUT_CLASS}
            >
              <option value="">Select profile</option>
              {RISK_PROFILE_OPTIONS.map(({ label, value }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            {error("riskProfile") ? (
              <p className="mt-2 text-sm text-brand-red">{error("riskProfile")}</p>
            ) : null}
          </div>
        </div>
      </fieldset>

      <fieldset className="border-t border-black/10 pt-8">
        <legend className="text-base font-bold">Goals</legend>
        <p className="mt-1 text-sm text-black/55">Select every goal that applies.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <GoalCheckbox label="Retirement" name="retirementGoal" checked={values.retirementGoal} />
          <GoalCheckbox label="Education" name="educationGoal" checked={values.educationGoal} />
          <GoalCheckbox label="Legacy" name="legacyGoal" checked={values.legacyGoal} />
        </div>
      </fieldset>

      <fieldset className="border-t border-black/10 pt-8">
        <legend className="text-base font-bold">Portfolio allocation</legend>
        <p className="mt-1 text-sm text-black/55">
          Enter percentages totaling exactly 100%.
        </p>
        <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(11rem,1fr))] gap-5">
          {allocationFields.map(({ label, name }) => (
            <NumberField
              key={name}
              error={error(name)}
              id={`allocation-${name}`}
              label={`${label} (%)`}
              max={100}
              min={0}
              name={name}
              required
              step="0.01"
              value={values[name]}
            />
          ))}
        </div>
        {state.fieldErrors?.portfolioAllocation ? (
          <p role="alert" className="mt-3 text-sm text-brand-red">
            {state.fieldErrors.portfolioAllocation}
          </p>
        ) : null}
      </fieldset>

      <fieldset className="border-t border-black/10 pt-8">
        <legend className="text-base font-bold">Advisor notes</legend>
        <div className="mt-4">
          <label htmlFor="advisor-talking-points" className="text-sm font-bold text-black/70">
            Advisor talking points / meeting notes
          </label>
          <textarea
            id="advisor-talking-points"
            name="advisorTalkingPoints"
            required
            maxLength={5000}
            rows={6}
            defaultValue={values.advisorTalkingPoints}
            aria-invalid={Boolean(error("advisorTalkingPoints"))}
            className="mt-2 w-full rounded-md border border-black/15 bg-white px-4 py-3 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
          />
          {error("advisorTalkingPoints") ? (
            <p className="mt-2 text-sm text-brand-red">{error("advisorTalkingPoints")}</p>
          ) : null}
        </div>
      </fieldset>

      {state.message ? (
        <p role="alert" className="text-sm text-brand-red">{state.message}</p>
      ) : null}

      <div className="flex justify-end border-t border-black/10 pt-6">
        <FormSubmitButton
          label={initialInputs ? "Update financial inputs" : "Save financial inputs"}
          pendingLabel="Saving…"
        />
      </div>
    </form>
  );
}

type NumberFieldProps = {
  error?: string;
  id: string;
  label: string;
  max?: number;
  min: number;
  name: keyof ClientInputFormValues;
  required?: boolean;
  step: string;
  value: string;
};

function NumberField({
  error,
  id,
  label,
  max,
  min,
  name,
  required = false,
  step,
  value,
}: NumberFieldProps) {
  return (
    <div>
      <label htmlFor={id} className="text-sm font-bold text-black/70">{label}</label>
      <input
        id={id}
        name={name}
        type="number"
        required={required}
        min={min}
        max={max}
        step={step}
        defaultValue={value}
        aria-invalid={Boolean(error)}
        className={INPUT_CLASS}
      />
      {error ? <p className="mt-2 text-sm text-brand-red">{error}</p> : null}
    </div>
  );
}

function GoalCheckbox({
  checked,
  label,
  name,
}: {
  checked: boolean;
  label: string;
  name: "retirementGoal" | "educationGoal" | "legacyGoal";
}) {
  return (
    <label className="flex min-h-12 items-center gap-3 rounded-md border border-black/15 px-4 text-sm font-bold text-black/70">
      <input
        type="checkbox"
        name={name}
        defaultChecked={checked}
        className="h-4 w-4 accent-brand-red"
      />
      {label}
    </label>
  );
}
