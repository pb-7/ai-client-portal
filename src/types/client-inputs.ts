export type RiskProfile =
  | "conservative"
  | "moderately_conservative"
  | "moderate"
  | "moderately_aggressive"
  | "aggressive";

export type ClientFinancialInputs = {
  schemaVersion: 1;
  meetingPurpose: string;
  primaryClientAge: number;
  spousePartnerAge: number | null;
  targetRetirementAge: number;
  state: string;
  assetsCurrentlyWithFirm: number;
  outsideAssets: number;
  riskProfile: RiskProfile;
  goals: {
    retirement: boolean;
    education: boolean;
    legacy: boolean;
  };
  portfolioAllocation: {
    usEquity: number;
    internationalEquity: number;
    fixedIncome: number;
    cash: number;
    alternatives: number;
  };
  advisorTalkingPoints: string;
};

export type ClientInputFormValues = {
  meetingPurpose: string;
  primaryClientAge: string;
  spousePartnerAge: string;
  targetRetirementAge: string;
  state: string;
  assetsCurrentlyWithFirm: string;
  outsideAssets: string;
  riskProfile: RiskProfile | "";
  retirementGoal: boolean;
  educationGoal: boolean;
  legacyGoal: boolean;
  usEquity: string;
  internationalEquity: string;
  fixedIncome: string;
  cash: string;
  alternatives: string;
  advisorTalkingPoints: string;
};

export type ClientInputField = keyof ClientInputFormValues | "portfolioAllocation";

export type ClientInputMutationState = {
  fieldErrors?: Partial<Record<ClientInputField, string>>;
  message?: string;
  values?: ClientInputFormValues;
};
