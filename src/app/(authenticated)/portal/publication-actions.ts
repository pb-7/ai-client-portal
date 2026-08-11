"use server";

import { hash } from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireAuthenticatedProfile } from "@/lib/auth/session";
import {
  createPublicationSlug,
  derivePublicationAccessToken,
  hashPublicationAccessToken,
} from "@/lib/publication/client-page-security";
import { isUuid } from "@/lib/validation/client";
import { parseStoredClientInputs } from "@/lib/validation/client-inputs";
import { parseStoredNarrative } from "@/lib/validation/narrative";
import { validatePublicationForm } from "@/lib/validation/publication";
import type { PublicationMutationState } from "@/types/publication";

const PASSWORD_HASH_ROUNDS = 12;

async function loadAuthorizedActiveClient(clientId: string) {
  const context = await requireAuthenticatedProfile();
  let query = context.supabase
    .from("clients")
    .select("id, name, status")
    .eq("id", clientId)
    .eq("status", "active")
    .is("deleted_at", null);

  if (context.profile.role === "advisor") {
    query = query.eq("advisor_id", context.profile.id);
  }

  const result = await query.maybeSingle();
  return {
    ...context,
    client: result.error ? null : result.data,
  };
}

export async function publishClientPage(
  clientId: string,
  _previousState: PublicationMutationState,
  formData: FormData,
): Promise<PublicationMutationState> {
  void _previousState;

  if (!isUuid(clientId)) {
    return { message: "Unable to publish this client page." };
  }

  const validation = validatePublicationForm(formData);
  if (!validation.success) return validation.state;

  const { client, profile, supabase } =
    await loadAuthorizedActiveClient(clientId);
  if (!client) {
    return { message: "This active client is unavailable or you no longer have access." };
  }

  const [inputResult, versionResult, publicationResult] = await Promise.all([
    supabase
      .from("client_inputs")
      .select("data")
      .eq("client_id", client.id)
      .maybeSingle(),
    supabase
      .from("narrative_versions")
      .select("id, content, status")
      .eq("id", validation.data.narrativeVersionId)
      .eq("client_id", client.id)
      .eq("status", "reviewed")
      .maybeSingle(),
    supabase
      .from("client_page_publications")
      .select("id, slug")
      .eq("client_id", client.id)
      .maybeSingle(),
  ]);

  if (
    inputResult.error ||
    !inputResult.data ||
    !parseStoredClientInputs(inputResult.data.data)
  ) {
    return { message: "Save valid structured financial inputs before publishing." };
  }

  if (
    versionResult.error ||
    !versionResult.data ||
    !parseStoredNarrative(versionResult.data.content)
  ) {
    return {
      fieldErrors: {
        narrativeVersionId: "Select a valid reviewed narrative version.",
      },
      message: "The selected narrative version cannot be published.",
    };
  }

  if (publicationResult.error) {
    return { message: "Publication settings could not be loaded. Please try again." };
  }

  const slug = publicationResult.data?.slug ?? createPublicationSlug(client.name);
  let passwordHash: string;
  let accessTokenHash: string;
  try {
    passwordHash = await hash(validation.data.password, PASSWORD_HASH_ROUNDS);
    accessTokenHash = hashPublicationAccessToken(
      derivePublicationAccessToken(slug),
    );
  } catch {
    return { message: "Unable to prepare this protected page right now." };
  }

  const publicationValues = {
    client_id: client.id,
    data_access_token_hash: accessTokenHash,
    narrative_version_id: versionResult.data.id,
    password_hash: passwordHash,
    published: true,
    slug,
  };
  const saveResult = publicationResult.data
    ? await supabase
        .from("client_page_publications")
        .update(publicationValues)
        .eq("id", publicationResult.data.id)
        .eq("client_id", client.id)
    : await supabase
        .from("client_page_publications")
        .insert(publicationValues);

  if (saveResult.error) {
    return { message: "Unable to publish this client page right now. Please try again." };
  }

  const detailPath = `/portal/${profile.role}/clients/${client.id}`;
  revalidatePath(detailPath);
  revalidatePath(`/client/${slug}`);
  redirect(`${detailPath}?published=1`);
}

export async function unpublishClientPage(
  clientId: string,
  _previousState: PublicationMutationState,
  _formData: FormData,
): Promise<PublicationMutationState> {
  void _previousState;
  void _formData;

  if (!isUuid(clientId)) {
    return { message: "Unable to unpublish this client page." };
  }

  const { client, profile, supabase } =
    await loadAuthorizedActiveClient(clientId);
  if (!client) {
    return { message: "This active client is unavailable or you no longer have access." };
  }

  const publicationResult = await supabase
    .from("client_page_publications")
    .select("id, slug")
    .eq("client_id", client.id)
    .eq("published", true)
    .maybeSingle();

  if (publicationResult.error || !publicationResult.data) {
    return { message: "This client page is not currently published." };
  }

  const updateResult = await supabase
    .from("client_page_publications")
    .update({ published: false })
    .eq("id", publicationResult.data.id)
    .eq("client_id", client.id);

  if (updateResult.error) {
    return { message: "Unable to unpublish this client page right now." };
  }

  const detailPath = `/portal/${profile.role}/clients/${client.id}`;
  revalidatePath(detailPath);
  revalidatePath(`/client/${publicationResult.data.slug}`);
  redirect(`${detailPath}?unpublished=1`);
}
