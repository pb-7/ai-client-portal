import "server-only";

import type {
  ClientMutationState,
  ClientStatus,
} from "@/types/portal";

const CLIENT_NAME_MAX_LENGTH = 120;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ValidClientFields = {
  name: string;
  status: ClientStatus;
};

type ClientValidationResult =
  | { data: ValidClientFields; success: true }
  | { state: ClientMutationState; success: false };

export function isUuid(value: string) {
  return UUID_PATTERN.test(value);
}

export function validateClientFields(
  formData: FormData,
): ClientValidationResult {
  const rawName = formData.get("name");
  const rawStatus = formData.get("status");
  const name = typeof rawName === "string" ? rawName.trim() : "";
  const status: ClientStatus = rawStatus === "archived" ? "archived" : "active";
  const fieldErrors: ClientMutationState["fieldErrors"] = {};

  if (!name) {
    fieldErrors.name = "Enter a household or client display name.";
  } else if (name.length > CLIENT_NAME_MAX_LENGTH) {
    fieldErrors.name = `Use ${CLIENT_NAME_MAX_LENGTH} characters or fewer.`;
  }

  if (rawStatus !== "active" && rawStatus !== "archived") {
    fieldErrors.status = "Select a valid client status.";
  }

  if (fieldErrors.name || fieldErrors.status) {
    return {
      state: {
        fieldErrors,
        message: "Review the highlighted fields and try again.",
        values: { name, status },
      },
      success: false,
    };
  }

  return { data: { name, status }, success: true };
}
