"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import {
  portalPathForRole,
  requireAuthenticatedProfile,
  requireRole,
} from "@/lib/auth/session";
import { CLIENT_DELETION_RETENTION_MS } from "@/constants/client-retention";
import { isUuid, validateClientFields } from "@/lib/validation/client";
import type {
  ClientDeletionState,
  ClientMutationState,
  ClientRestorationState,
  ReassignmentState,
} from "@/types/portal";

export async function createClient(
  _previousState: ClientMutationState,
  formData: FormData,
): Promise<ClientMutationState> {
  const { profile, supabase } = await requireRole("advisor");
  const validation = validateClientFields(formData);

  if (!validation.success) {
    return validation.state;
  }

  const { data, error } = await supabase
    .from("clients")
    .insert({
      advisor_id: profile.id,
      name: validation.data.name,
      status: validation.data.status,
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      message: "Unable to create the client right now. Please try again.",
      values: validation.data,
    };
  }

  revalidatePath("/portal/advisor");
  revalidatePath("/portal/admin");
  redirect(`/portal/advisor/clients/${data.id}`);
}

export async function updateClient(
  clientId: string,
  _previousState: ClientMutationState,
  formData: FormData,
): Promise<ClientMutationState> {
  const { profile, supabase } = await requireAuthenticatedProfile();
  const validation = validateClientFields(formData);

  if (!isUuid(clientId)) {
    return { message: "Unable to save this client record." };
  }

  if (!validation.success) {
    return validation.state;
  }

  let mutation = supabase
    .from("clients")
    .update({
      name: validation.data.name,
      status: validation.data.status,
    })
    .eq("id", clientId)
    .is("deleted_at", null);

  if (profile.role === "advisor") {
    mutation = mutation.eq("advisor_id", profile.id);
  }

  const { data, error } = await mutation.select("id").maybeSingle();

  if (error || !data) {
    return {
      message: "Unable to save changes to this client. Please try again.",
      values: validation.data,
    };
  }

  revalidatePath(portalPathForRole(profile.role));
  revalidatePath(`/portal/${profile.role}/clients/${clientId}`);
  redirect(`/portal/${profile.role}/clients/${clientId}?saved=1`);
}

export async function reassignClient(
  clientId: string,
  _previousState: ReassignmentState,
  formData: FormData,
): Promise<ReassignmentState> {
  const { supabase } = await requireRole("admin");
  const rawAdvisorId = formData.get("advisorId");
  const advisorId = typeof rawAdvisorId === "string" ? rawAdvisorId : "";

  if (!isUuid(clientId) || !isUuid(advisorId)) {
    return { fieldError: "Select an active advisor." };
  }

  const { data: advisor, error: advisorError } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", advisorId)
    .eq("role", "advisor")
    .eq("disabled", false)
    .maybeSingle();

  if (advisorError || !advisor) {
    return { fieldError: "Select an active advisor." };
  }

  const { data: client, error: clientError } = await supabase
    .from("clients")
    .update({ advisor_id: advisor.id })
    .eq("id", clientId)
    .is("deleted_at", null)
    .select("id")
    .maybeSingle();

  if (clientError || !client) {
    return {
      message: "Unable to reassign this client right now. Please try again.",
    };
  }

  revalidatePath("/portal/admin");
  revalidatePath("/portal/advisor");
  revalidatePath(`/portal/admin/clients/${clientId}`);
  redirect(`/portal/admin/clients/${clientId}?reassigned=1`);
}

export async function softDeleteClient(
  clientId: string,
  _previousState: ClientDeletionState,
  formData: FormData,
): Promise<ClientDeletionState> {
  const { profile, supabase } = await requireAuthenticatedProfile();
  const confirmation = formData.get("confirmDeletion");

  if (!isUuid(clientId) || confirmation !== "confirmed") {
    return { message: "Confirm that you want to delete this client." };
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
    return { message: "Unable to delete this client record." };
  }

  let mutation = supabase
    .from("clients")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: profile.id,
    })
    .eq("id", client.id)
    .is("deleted_at", null);

  if (profile.role === "advisor") {
    mutation = mutation.eq("advisor_id", profile.id);
  }

  const { error } = await mutation;

  if (error) {
    return {
      message: "Unable to delete this client right now. Please try again.",
    };
  }

  revalidatePath("/portal/admin");
  revalidatePath("/portal/admin/clients/recently-deleted");
  revalidatePath("/portal/advisor");
  redirect(`${portalPathForRole(profile.role)}?deleted=1`);
}

export async function restoreClient(
  clientId: string,
  _previousState: ClientRestorationState,
  formData: FormData,
): Promise<ClientRestorationState> {
  const { supabase } = await requireRole("admin");

  if (
    !isUuid(clientId) ||
    formData.get("restoreClient") !== "confirmed"
  ) {
    return { message: "Unable to restore this client record." };
  }

  const now = new Date();
  const cutoff = new Date(
    now.getTime() - CLIENT_DELETION_RETENTION_MS,
  ).toISOString();
  const { data: client, error: clientError } = await supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .not("deleted_at", "is", null)
    .gte("deleted_at", cutoff)
    .lte("deleted_at", now.toISOString())
    .maybeSingle();

  if (clientError || !client) {
    return {
      message: "This client is no longer available for recent restoration.",
    };
  }

  const { error } = await supabase
    .from("clients")
    .update({ deleted_at: null, deleted_by: null })
    .eq("id", client.id)
    .not("deleted_at", "is", null)
    .gte("deleted_at", cutoff)
    .lte("deleted_at", now.toISOString());

  if (error) {
    return {
      message: "Unable to restore this client right now. Please try again.",
    };
  }

  revalidatePath("/portal/admin");
  revalidatePath("/portal/admin/clients/recently-deleted");
  revalidatePath("/portal/advisor");
  redirect("/portal/admin/clients/recently-deleted?restored=1");
}
