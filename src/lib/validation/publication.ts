import "server-only";

import { isUuid } from "@/lib/validation/client";
import type { PublicationMutationState } from "@/types/publication";

export const CLIENT_PAGE_PASSWORD_MIN_LENGTH = 12;
export const CLIENT_PAGE_PASSWORD_MAX_LENGTH = 128;
export const CLIENT_PAGE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validatePublicationForm(formData: FormData):
  | {
      data: { narrativeVersionId: string; password: string };
      success: true;
    }
  | { state: PublicationMutationState; success: false } {
  const narrativeVersionId = formData.get("narrativeVersionId");
  const password = formData.get("password");
  const passwordConfirmation = formData.get("passwordConfirmation");
  const fieldErrors: NonNullable<PublicationMutationState["fieldErrors"]> = {};

  if (typeof narrativeVersionId !== "string" || !isUuid(narrativeVersionId)) {
    fieldErrors.narrativeVersionId = "Select a reviewed narrative version.";
  }

  if (
    typeof password !== "string" ||
    password.length < CLIENT_PAGE_PASSWORD_MIN_LENGTH ||
    password.length > CLIENT_PAGE_PASSWORD_MAX_LENGTH
  ) {
    fieldErrors.password = `Use ${CLIENT_PAGE_PASSWORD_MIN_LENGTH} to ${CLIENT_PAGE_PASSWORD_MAX_LENGTH} characters.`;
  }

  if (
    typeof passwordConfirmation !== "string" ||
    passwordConfirmation !== password
  ) {
    fieldErrors.passwordConfirmation = "Passwords do not match.";
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      state: {
        fieldErrors,
        message: "Review the publication settings and try again.",
      },
      success: false,
    };
  }

  return {
    data: {
      narrativeVersionId: narrativeVersionId as string,
      password: password as string,
    },
    success: true,
  };
}

export function isValidClientPageSlug(value: string) {
  return (
    value.length >= 3 &&
    value.length <= 100 &&
    CLIENT_PAGE_SLUG_PATTERN.test(value)
  );
}
