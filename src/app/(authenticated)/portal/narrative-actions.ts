"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { generateNarrativeWithClaude } from "@/lib/ai/anthropic";
import {
  requireAuthenticatedProfile,
} from "@/lib/auth/session";
import { isUuid } from "@/lib/validation/client";
import { parseStoredClientInputs } from "@/lib/validation/client-inputs";
import { validateNarrativeForm } from "@/lib/validation/narrative";
import type { ClientNarrative, NarrativeMutationState } from "@/types/narrative";

type AuthenticatedSupabase = Awaited<
  ReturnType<typeof requireAuthenticatedProfile>
>["supabase"];

type VersionMetadata = {
  modelName?: string;
  modelProvider?: string;
  promptVersion?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  status: "draft" | "reviewed";
};

async function findOrCreateNarrative(
  supabase: AuthenticatedSupabase,
  clientId: string,
  actorId: string,
) {
  const existingResult = await supabase
    .from("narratives")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();

  if (existingResult.error) return null;
  if (existingResult.data) return existingResult.data;

  const insertResult = await supabase
    .from("narratives")
    .insert({ client_id: clientId, created_by: actorId, status: "draft" })
    .select("id")
    .maybeSingle();

  if (insertResult.data) return insertResult.data;
  if (insertResult.error?.code !== "23505") return null;

  const concurrentResult = await supabase
    .from("narratives")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();

  return concurrentResult.error ? null : concurrentResult.data;
}

async function insertNarrativeVersion(
  supabase: AuthenticatedSupabase,
  narrativeId: string,
  clientId: string,
  actorId: string,
  content: ClientNarrative,
  metadata: VersionMetadata,
) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const latestResult = await supabase
      .from("narrative_versions")
      .select("version_number")
      .eq("narrative_id", narrativeId)
      .order("version_number", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latestResult.error) return null;

    const versionNumber = (latestResult.data?.version_number ?? 0) + 1;
    const insertResult = await supabase
      .from("narrative_versions")
      .insert({
        narrative_id: narrativeId,
        client_id: clientId,
        version_number: versionNumber,
        status: metadata.status,
        content,
        model_provider: metadata.modelProvider ?? null,
        model_name: metadata.modelName ?? null,
        prompt_version: metadata.promptVersion ?? null,
        created_by: actorId,
        reviewed_by: metadata.reviewedBy ?? null,
        reviewed_at: metadata.reviewedAt ?? null,
      })
      .select("id, version_number")
      .maybeSingle();

    if (insertResult.data) return insertResult.data;
    if (insertResult.error?.code !== "23505") return null;
  }

  return null;
}

async function loadAuthorizedActiveClient(
  supabase: AuthenticatedSupabase,
  clientId: string,
  profile: Awaited<
    ReturnType<typeof requireAuthenticatedProfile>
  >["profile"],
) {
  let query = supabase
    .from("clients")
    .select("id")
    .eq("id", clientId)
    .is("deleted_at", null);

  if (profile.role === "advisor") {
    query = query.eq("advisor_id", profile.id);
  }

  const result = await query.maybeSingle();
  return result.error ? null : result.data;
}

export async function generateNarrativeDraft(
  clientId: string,
  _previousState: NarrativeMutationState,
  _formData: FormData,
): Promise<NarrativeMutationState> {
  void _previousState;
  void _formData;

  const { profile, supabase } = await requireAuthenticatedProfile();

  if (!isUuid(clientId)) {
    return { message: "Unable to generate a narrative for this client." };
  }

  const client = await loadAuthorizedActiveClient(supabase, clientId, profile);
  if (!client) {
    return { message: "This client is unavailable or you no longer have access." };
  }

  const inputResult = await supabase
    .from("client_inputs")
    .select("data")
    .eq("client_id", client.id)
    .maybeSingle();
  const inputs = inputResult.data
    ? parseStoredClientInputs(inputResult.data.data)
    : null;

  if (inputResult.error || !inputs) {
    return {
      message: "Save valid structured financial inputs before generating a narrative.",
    };
  }

  let generated: Awaited<ReturnType<typeof generateNarrativeWithClaude>>;
  try {
    generated = await generateNarrativeWithClaude(inputs);
  } catch {
    return {
      message: "Unable to generate a narrative right now. Please try again.",
    };
  }

  const narrative = await findOrCreateNarrative(
    supabase,
    client.id,
    profile.id,
  );
  if (!narrative) {
    return {
      message: "The draft was generated but could not be saved. Please try again.",
    };
  }

  const version = await insertNarrativeVersion(
    supabase,
    narrative.id,
    client.id,
    profile.id,
    generated.content,
    {
      status: "draft",
      modelProvider: generated.modelProvider,
      modelName: generated.modelName,
      promptVersion: generated.promptVersion,
    },
  );

  if (!version) {
    return {
      message: "The draft was generated but could not be saved. Please try again.",
    };
  }

  const detailPath = `/portal/${profile.role}/clients/${client.id}`;
  revalidatePath(detailPath);
  redirect(`${detailPath}?narrativeGenerated=1`);
}

export async function saveReviewedNarrative(
  clientId: string,
  _previousState: NarrativeMutationState,
  formData: FormData,
): Promise<NarrativeMutationState> {
  void _previousState;

  const { profile, supabase } = await requireAuthenticatedProfile();

  if (!isUuid(clientId)) {
    return { message: "Unable to save this narrative." };
  }

  const validation = validateNarrativeForm(formData);
  if (!validation.success) return validation.state;

  const client = await loadAuthorizedActiveClient(supabase, clientId, profile);
  if (!client) {
    return { message: "This client is unavailable or you no longer have access." };
  }

  const narrativeResult = await supabase
    .from("narratives")
    .select("id")
    .eq("client_id", client.id)
    .maybeSingle();

  if (narrativeResult.error || !narrativeResult.data) {
    return { message: "Generate a narrative draft before saving edits." };
  }

  const reviewedAt = new Date().toISOString();
  const version = await insertNarrativeVersion(
    supabase,
    narrativeResult.data.id,
    client.id,
    profile.id,
    validation.data,
    {
      status: "reviewed",
      reviewedBy: profile.id,
      reviewedAt,
    },
  );

  if (!version) {
    return {
      message: "Unable to save this narrative right now. Please try again.",
    };
  }

  const detailPath = `/portal/${profile.role}/clients/${client.id}`;
  revalidatePath(detailPath);
  redirect(`${detailPath}?narrativeSaved=1`);
}
