export type AppRole = "admin" | "advisor";

export type AuthenticatedProfile = {
  disabled: false;
  id: string;
  role: AppRole;
};

export type AdvisorProfile = {
  created_at: string;
  disabled: boolean;
  id: string;
};

export type ClientSummary = {
  advisor_id: string | null;
  id: string;
  name: string;
  status: "active" | "archived";
  updated_at: string;
};
