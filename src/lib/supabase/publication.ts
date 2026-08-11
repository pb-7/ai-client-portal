import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { derivePublicationAccessToken } from "@/lib/publication/client-page-security";
import { parseStoredClientInputs } from "@/lib/validation/client-inputs";
import { parseStoredNarrative } from "@/lib/validation/narrative";
import { isValidClientPageSlug } from "@/lib/validation/publication";
import type { PublishedClientPageRecord } from "@/types/publication";

type PublishedPageRow = {
  client_inputs: unknown;
  client_name: string;
  narrative_content: unknown;
  narrative_version_id: string;
  password_hash: string;
  publication_id: string;
  publication_slug: string;
  publication_updated_at: string;
  published_at: string;
};

function createAnonymousSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !publishableKey) {
    throw new Error("Supabase public configuration is missing.");
  }

  return createSupabaseClient(url, publishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}

export async function loadPublishedClientPage(
  slug: string,
): Promise<PublishedClientPageRecord | null> {
  if (!isValidClientPageSlug(slug)) return null;

  const supabase = createAnonymousSupabaseClient();
  const { data, error } = await supabase.rpc("get_published_client_page", {
    server_access_token: derivePublicationAccessToken(slug),
    target_slug: slug,
  });

  if (error || !Array.isArray(data) || data.length !== 1) return null;
  const row = data[0] as Partial<PublishedPageRow>;
  const clientInputs = parseStoredClientInputs(row.client_inputs);
  const narrative = parseStoredNarrative(row.narrative_content);

  if (
    !clientInputs ||
    !narrative ||
    typeof row.client_name !== "string" ||
    !row.client_name.trim() ||
    typeof row.narrative_version_id !== "string" ||
    typeof row.password_hash !== "string" ||
    typeof row.publication_id !== "string" ||
    row.publication_slug !== slug ||
    typeof row.publication_updated_at !== "string" ||
    typeof row.published_at !== "string"
  ) {
    return null;
  }

  return {
    clientInputs,
    clientName: row.client_name,
    narrative,
    narrativeVersionId: row.narrative_version_id,
    passwordHash: row.password_hash,
    publicationId: row.publication_id,
    publicationUpdatedAt: row.publication_updated_at,
    publishedAt: row.published_at,
    slug,
  };
}
