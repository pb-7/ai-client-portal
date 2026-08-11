import "server-only";

import {
  CLIENT_INPUT_SCHEMA_VERSION,
  RISK_PROFILE_OPTIONS,
  US_STATE_OPTIONS,
} from "@/constants/client-inputs";
import type {
  ClientFinancialInputs,
  ClientInputFormValues,
  ClientInputMutationState,
  RiskProfile,
} from "@/types/client-inputs";

const MEETING_PURPOSE_MAX_LENGTH = 500;
const TALKING_POINTS_MAX_LENGTH = 5_000;
const MIN_CLIENT_AGE = 18;
const MAX_CLIENT_AGE = 120;
const MIN_RETIREMENT_AGE = 30;
const MAX_RETIREMENT_AGE = 100;
const MAX_CURRENCY_VALUE = 1_000_000_000_000;
const DECIMAL_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/;
const INTEGER_PATTERN = /^\d+$/;
const VALID_STATES = new Set<string>(US_STATE_OPTIONS.map(([code]) => code));
const VALID_RISK_PROFILES = new Set<RiskProfile>(
  RISK_PROFILE_OPTIONS.map(({ value }) => value),
);

type ValidationResult =
  | { data: ClientFinancialInputs; success: true }
  | { state: ClientInputMutationState; success: false };

function stringValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function parseAge(
  value: string,
  minimum: number,
  maximum: number,
  message: string,
) {
  if (!INTEGER_PATTERN.test(value)) {
    return { error: message };
  }

  const parsed = Number(value);
  return parsed >= minimum && parsed <= maximum
    ? { value: parsed }
    : { error: message };
}

function parseDecimal(
  value: string,
  maximum: number,
  message: string,
) {
  if (!DECIMAL_PATTERN.test(value)) {
    return { error: message };
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed <= maximum
    ? { value: parsed }
    : { error: message };
}

function percentageHundredths(value: string) {
  if (!DECIMAL_PATTERN.test(value)) {
    return null;
  }

  const [whole, fraction = ""] = value.split(".");
  const hundredths = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return hundredths <= 10_000 ? hundredths : null;
}

function formValues(formData: FormData): ClientInputFormValues {
  const riskProfile = stringValue(formData, "riskProfile");

  return {
    meetingPurpose: stringValue(formData, "meetingPurpose"),
    primaryClientAge: stringValue(formData, "primaryClientAge"),
    spousePartnerAge: stringValue(formData, "spousePartnerAge"),
    targetRetirementAge: stringValue(formData, "targetRetirementAge"),
    state: stringValue(formData, "state"),
    assetsCurrentlyWithFirm: stringValue(formData, "assetsCurrentlyWithFirm"),
    outsideAssets: stringValue(formData, "outsideAssets"),
    riskProfile: VALID_RISK_PROFILES.has(riskProfile as RiskProfile)
      ? (riskProfile as RiskProfile)
      : "",
    retirementGoal: formData.get("retirementGoal") === "on",
    educationGoal: formData.get("educationGoal") === "on",
    legacyGoal: formData.get("legacyGoal") === "on",
    usEquity: stringValue(formData, "usEquity"),
    internationalEquity: stringValue(formData, "internationalEquity"),
    fixedIncome: stringValue(formData, "fixedIncome"),
    cash: stringValue(formData, "cash"),
    alternatives: stringValue(formData, "alternatives"),
    advisorTalkingPoints: stringValue(formData, "advisorTalkingPoints"),
  };
}

export function validateClientInputs(formData: FormData): ValidationResult {
  const values = formValues(formData);
  const fieldErrors: NonNullable<ClientInputMutationState["fieldErrors"]> = {};

  if (!values.meetingPurpose) {
    fieldErrors.meetingPurpose = "Enter the purpose of this meeting.";
  } else if (values.meetingPurpose.length > MEETING_PURPOSE_MAX_LENGTH) {
    fieldErrors.meetingPurpose = `Use ${MEETING_PURPOSE_MAX_LENGTH} characters or fewer.`;
  }

  const primaryAge = parseAge(
    values.primaryClientAge,
    MIN_CLIENT_AGE,
    MAX_CLIENT_AGE,
    `Enter an age from ${MIN_CLIENT_AGE} to ${MAX_CLIENT_AGE}.`,
  );
  if ("error" in primaryAge) fieldErrors.primaryClientAge = primaryAge.error;

  const spouseAge = values.spousePartnerAge
    ? parseAge(
        values.spousePartnerAge,
        MIN_CLIENT_AGE,
        MAX_CLIENT_AGE,
        `Enter an age from ${MIN_CLIENT_AGE} to ${MAX_CLIENT_AGE}, or leave it blank.`,
      )
    : { value: null };
  if ("error" in spouseAge) fieldErrors.spousePartnerAge = spouseAge.error;

  const retirementAge = parseAge(
    values.targetRetirementAge,
    MIN_RETIREMENT_AGE,
    MAX_RETIREMENT_AGE,
    `Enter a target age from ${MIN_RETIREMENT_AGE} to ${MAX_RETIREMENT_AGE}.`,
  );
  if ("error" in retirementAge) {
    fieldErrors.targetRetirementAge = retirementAge.error;
  }

  if (!VALID_STATES.has(values.state)) {
    fieldErrors.state = "Select a valid state.";
  }

  const currencyMessage = "Enter a non-negative amount with no more than two decimal places.";
  const firmAssets = parseDecimal(
    values.assetsCurrentlyWithFirm,
    MAX_CURRENCY_VALUE,
    currencyMessage,
  );
  if ("error" in firmAssets) {
    fieldErrors.assetsCurrentlyWithFirm = firmAssets.error;
  }
  const outsideAssets = parseDecimal(
    values.outsideAssets,
    MAX_CURRENCY_VALUE,
    currencyMessage,
  );
  if ("error" in outsideAssets) fieldErrors.outsideAssets = outsideAssets.error;

  if (!values.riskProfile) {
    fieldErrors.riskProfile = "Select a risk profile.";
  }

  const allocationKeys = [
    "usEquity",
    "internationalEquity",
    "fixedIncome",
    "cash",
    "alternatives",
  ] as const;
  const allocationHundredths = allocationKeys.map((key) => {
    const parsed = percentageHundredths(values[key]);
    if (parsed === null) {
      fieldErrors[key] = "Enter a percentage from 0 to 100 with up to two decimal places.";
    }
    return parsed;
  });

  if (
    allocationHundredths.every((value) => value !== null) &&
    allocationHundredths.reduce<number>((total, value) => total + value, 0) !== 10_000
  ) {
    fieldErrors.portfolioAllocation = "Portfolio allocation must total exactly 100%.";
  }

  if (!values.advisorTalkingPoints) {
    fieldErrors.advisorTalkingPoints = "Enter advisor talking points or meeting notes.";
  } else if (values.advisorTalkingPoints.length > TALKING_POINTS_MAX_LENGTH) {
    fieldErrors.advisorTalkingPoints = `Use ${TALKING_POINTS_MAX_LENGTH.toLocaleString()} characters or fewer.`;
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      state: {
        fieldErrors,
        message: "Review the highlighted fields and try again.",
        values,
      },
      success: false,
    };
  }

  return {
    data: {
      schemaVersion: CLIENT_INPUT_SCHEMA_VERSION,
      meetingPurpose: values.meetingPurpose,
      primaryClientAge: primaryAge.value!,
      spousePartnerAge: spouseAge.value!,
      targetRetirementAge: retirementAge.value!,
      state: values.state,
      assetsCurrentlyWithFirm: firmAssets.value!,
      outsideAssets: outsideAssets.value!,
      riskProfile: values.riskProfile as RiskProfile,
      goals: {
        retirement: values.retirementGoal,
        education: values.educationGoal,
        legacy: values.legacyGoal,
      },
      portfolioAllocation: {
        usEquity: allocationHundredths[0]! / 100,
        internationalEquity: allocationHundredths[1]! / 100,
        fixedIncome: allocationHundredths[2]! / 100,
        cash: allocationHundredths[3]! / 100,
        alternatives: allocationHundredths[4]! / 100,
      },
      advisorTalkingPoints: values.advisorTalkingPoints,
    },
    success: true,
  };
}

export function parseStoredClientInputs(value: unknown): ClientFinancialInputs | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const input = value as Partial<ClientFinancialInputs>;
  const goals = input.goals;
  const allocation = input.portfolioAllocation;
  const riskProfile = input.riskProfile;
  const validNumber = (number: unknown, maximum: number) =>
    typeof number === "number" &&
    Number.isFinite(number) &&
    number >= 0 &&
    number <= maximum &&
    Number.isInteger(number * 100);
  const validAge = (age: unknown, minimum: number, maximum: number) =>
    typeof age === "number" &&
    Number.isInteger(age) &&
    age >= minimum &&
    age <= maximum;

  if (
    input.schemaVersion !== CLIENT_INPUT_SCHEMA_VERSION ||
    typeof input.meetingPurpose !== "string" ||
    !input.meetingPurpose.trim() ||
    input.meetingPurpose.length > MEETING_PURPOSE_MAX_LENGTH ||
    !validAge(input.primaryClientAge, MIN_CLIENT_AGE, MAX_CLIENT_AGE) ||
    !(
      input.spousePartnerAge === null ||
      validAge(input.spousePartnerAge, MIN_CLIENT_AGE, MAX_CLIENT_AGE)
    ) ||
    !validAge(
      input.targetRetirementAge,
      MIN_RETIREMENT_AGE,
      MAX_RETIREMENT_AGE,
    ) ||
    typeof input.state !== "string" ||
    !VALID_STATES.has(input.state) ||
    !validNumber(input.assetsCurrentlyWithFirm, MAX_CURRENCY_VALUE) ||
    !validNumber(input.outsideAssets, MAX_CURRENCY_VALUE) ||
    !VALID_RISK_PROFILES.has(riskProfile as RiskProfile) ||
    !goals ||
    typeof goals.retirement !== "boolean" ||
    typeof goals.education !== "boolean" ||
    typeof goals.legacy !== "boolean" ||
    !allocation ||
    !validNumber(allocation.usEquity, 100) ||
    !validNumber(allocation.internationalEquity, 100) ||
    !validNumber(allocation.fixedIncome, 100) ||
    !validNumber(allocation.cash, 100) ||
    !validNumber(allocation.alternatives, 100) ||
    typeof input.advisorTalkingPoints !== "string" ||
    !input.advisorTalkingPoints.trim() ||
    input.advisorTalkingPoints.length > TALKING_POINTS_MAX_LENGTH
  ) {
    return null;
  }

  const allocationTotal =
    allocation.usEquity +
    allocation.internationalEquity +
    allocation.fixedIncome +
    allocation.cash +
    allocation.alternatives;

  return Math.abs(allocationTotal - 100) < 0.001
    ? (input as ClientFinancialInputs)
    : null;
}
