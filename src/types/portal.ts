export type AppRole = "admin" | "advisor";

export type AuthenticatedProfile = {
  disabled: false;
  display_name: string | null;
  id: string;
  role: AppRole;
};

export type AdvisorProfile = {
  created_at: string;
  disabled: boolean;
  display_name: string | null;
  id: string;
};

export type ClientSummary = {
  advisor_id: string | null;
  id: string;
  name: string;
  status: "active" | "archived";
  updated_at: string;
};

export type ClientRecord = ClientSummary & {
  created_at: string;
};

export type DeletedClientSummary = ClientSummary & {
  deleted_at: string;
};

export type ClientStatus = ClientSummary["status"];

export type ClientMutationState = {
  fieldErrors?: {
    name?: string;
    status?: string;
  };
  message?: string;
  values?: {
    name: string;
    status: ClientStatus;
  };
};

export type ReassignmentState = {
  fieldError?: string;
  message?: string;
};

export type ClientDeletionState = {
  message?: string;
};

export type ClientRestorationState = {
  message?: string;
};

export type AdvisorOption = {
  id: string;
  label: string;
};
