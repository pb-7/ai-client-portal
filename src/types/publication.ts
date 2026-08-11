import type { ClientFinancialInputs } from "@/types/client-inputs";
import type { ClientNarrative } from "@/types/narrative";

export type PublicationMutationState = {
  fieldErrors?: {
    narrativeVersionId?: string;
    password?: string;
    passwordConfirmation?: string;
  };
  message?: string;
};

export type ClientPagePublication = {
  narrativeVersionId: string;
  published: boolean;
  publishedAt: string | null;
  slug: string;
  updatedAt: string;
};

export type PublishedClientPageRecord = {
  clientInputs: ClientFinancialInputs;
  clientName: string;
  narrative: ClientNarrative;
  narrativeVersionId: string;
  passwordHash: string;
  publicationId: string;
  publicationUpdatedAt: string;
  publishedAt: string;
  slug: string;
};

export type ClientPagePasswordState = {
  message?: string;
};
