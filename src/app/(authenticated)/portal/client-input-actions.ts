"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  portalPathForRole,
  requireAuthenticatedProfile,
} from "@/lib/auth/session";
import { isUuid } from "@/lib/validation/client";
import { validateClientInputs } from "@/lib/validation/client-inputs";
import type { ClientInputMutationState } from "@/types/client-inputs";

export async function saveClientInputs(
  clientId: string,
  _previousState: ClientInputMutationState,
  formData: FormData,
): Promise<ClientInputMutationState> {
  const { profile, supabase } = await requireAuthenticatedProfile();

  if (!isUuid(clientId)) {
    return { message: "Unable to save financial inputs for this client." };
  }

  const validation = validateClientInputs(formData);
  if (!validation.success) {
    return validation.state;
  }

  let clientQuery = supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .is("deleted_at", null);

  if (profile.role === "advisor") {
    clientQuery = clientQuery.eq("advisor_id", profile.id);
  }

  const { data: client, error: clientError } =
    await clientQuery.maybeSingle();

  if (clientError || !client) {
    return {
      message: "This client is unavailable or you no longer have access.",
    };
  }

  const { data: savedInputs, error } = await supabase
    .from("client_inputs")
    .upsert(
      {
        client_id: client.id,
        data: validation.data,
        updated_by: profile.id,
      },
      { onConflict: "client_id" },
    )
    .select("id")
    .maybeSingle();

  if (error || !savedInputs) {
    return {
      message: "Unable to save financial inputs right now. Please try again.",
    };
  }

  const detailPath = `/portal/${profile.role}/clients/${client.id}`;
  revalidatePath(portalPathForRole(profile.role));
  revalidatePath(detailPath);
  redirect(`${detailPath}?inputsSaved=1`);
}
