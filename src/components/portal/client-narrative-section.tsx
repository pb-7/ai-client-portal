import {
  generateNarrativeDraft,
  saveReviewedNarrative,
} from "@/app/(authenticated)/portal/narrative-actions";
import {
  publishClientPage,
  unpublishClientPage,
} from "@/app/(authenticated)/portal/publication-actions";
import { ClientPagePublicationForm } from "@/components/portal/client-page-publication-form";
import { GenerateNarrativeForm } from "@/components/portal/generate-narrative-form";
import { NarrativeReviewForm } from "@/components/portal/narrative-review-form";
import { createClient } from "@/lib/supabase/server";
import { formatPortalDateTime } from "@/lib/format/date";
import { parseStoredNarrative } from "@/lib/validation/narrative";
import type {
  ClientNarrative,
  NarrativeField,
  NarrativeVersionSummary,
} from "@/types/narrative";
import type { ClientPagePublication } from "@/types/publication";

type ClientNarrativeSectionProps = {
  clientId: string;
  clientIsActive: boolean;
  feedback?: "generated" | "saved";
  hasStructuredInputs: boolean;
  publicationFeedback?: "published" | "unpublished";
};

type ActorProfile = {
  display_name: string | null;
  id: string;
};

type NarrativeHistoryItem = NarrativeVersionSummary & {
  content: ClientNarrative | null;
  creatorLabel: string;
  reviewedAt: string | null;
  reviewerLabel: string | null;
};

const READ_ONLY_SECTIONS: ReadonlyArray<{
  field: NarrativeField;
  label: string;
}> = [
  { field: "retirementSummary", label: "Retirement summary" },
  { field: "consolidationSummary", label: "Consolidation summary" },
  { field: "portfolioSummary", label: "Portfolio summary" },
  { field: "nextSteps", label: "Next steps" },
];

function actorLabel(
  actorId: string | null,
  profiles: Map<string, ActorProfile>,
) {
  if (!actorId) return null;

  const profile = profiles.get(actorId);
  if (!profile) return "Authorized user";
  return profile.display_name?.trim() || "Unnamed user";
}

function versionStatusLabel(status: NarrativeVersionSummary["status"]) {
  if (status === "reviewed") return "Reviewed";
  if (status === "published") return "Published";
  return "Draft";
}

export async function ClientNarrativeSection({
  clientId,
  clientIsActive,
  feedback,
  hasStructuredInputs,
  publicationFeedback,
}: ClientNarrativeSectionProps) {
  const supabase = await createClient();
  const narrativeResult = await supabase
    .from("narratives")
    .select("id")
    .eq("client_id", clientId)
    .maybeSingle();

  let versionsResult: {
    data: Array<{
      content: unknown;
      created_by: string | null;
      created_at: string;
      id: string;
      model_name: string | null;
      model_provider: string | null;
      prompt_version: string | null;
      reviewed_at: string | null;
      reviewed_by: string | null;
      status: "draft" | "reviewed" | "published";
      version_number: number;
    }> | null;
    error: unknown;
  } = { data: [], error: null };

  if (narrativeResult.data) {
    versionsResult = await supabase
      .from("narrative_versions")
      .select(
        "id, content, created_at, created_by, model_name, model_provider, prompt_version, reviewed_at, reviewed_by, status, version_number",
      )
      .eq("narrative_id", narrativeResult.data.id)
      .order("version_number", { ascending: false });
  }

  const versions = versionsResult.data ?? [];
  const latestNarrative = versions[0]
    ? parseStoredNarrative(versions[0].content)
    : null;
  const loadFailed = Boolean(
    narrativeResult.error ||
      versionsResult.error ||
      (versions[0] && !latestNarrative),
  );
  const actorIds = Array.from(
    new Set(
      versions.flatMap((version) =>
        [version.created_by, version.reviewed_by].filter(
          (actorId): actorId is string => Boolean(actorId),
        ),
      ),
    ),
  );
  let actorProfiles: ActorProfile[] = [];

  if (actorIds.length > 0) {
    const profileResult = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", actorIds);
    actorProfiles = (profileResult.data ?? []) as ActorProfile[];
  }

  const profileMap = new Map(
    actorProfiles.map((profile) => [profile.id, profile]),
  );
  const history: NarrativeHistoryItem[] = versions.map((version) => ({
    content: parseStoredNarrative(version.content),
    createdAt: version.created_at,
    creatorLabel: actorLabel(version.created_by, profileMap) ?? "Not recorded",
    modelName: version.model_name,
    modelProvider: version.model_provider,
    promptVersion: version.prompt_version,
    reviewedAt: version.reviewed_at,
    reviewerLabel: actorLabel(version.reviewed_by, profileMap),
    status: version.status,
    versionNumber: version.version_number,
  }));
  const generateAction = generateNarrativeDraft.bind(null, clientId);
  const saveAction = saveReviewedNarrative.bind(null, clientId);
  const publishAction = publishClientPage.bind(null, clientId);
  const unpublishAction = unpublishClientPage.bind(null, clientId);
  const publicationResult = clientIsActive
    ? await supabase
        .from("client_page_publications")
        .select(
          "narrative_version_id, published, published_at, slug, updated_at",
        )
        .eq("client_id", clientId)
        .maybeSingle()
    : { data: null, error: null };
  const publication: ClientPagePublication | null = publicationResult.data
    ? {
        narrativeVersionId: publicationResult.data.narrative_version_id,
        published: publicationResult.data.published,
        publishedAt: publicationResult.data.published_at,
        slug: publicationResult.data.slug,
        updatedAt: publicationResult.data.updated_at,
      }
    : null;
  const reviewedVersions = versions
    .filter(
      (version) =>
        version.status === "reviewed" &&
        Boolean(parseStoredNarrative(version.content)),
    )
    .map((version) => ({
      createdAt: version.created_at,
      id: version.id,
      label: `Version ${version.version_number} · ${formatPortalDateTime(version.created_at)}`,
    }));

  return (
    <section className="mt-6 rounded-xl border border-black/10 bg-white p-5 shadow-[0_12px_35px_rgba(26,26,26,0.04)] sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold">AI narrative draft</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-black/55">
            Claude generates narrative only. Factual values remain in the structured client inputs.
          </p>
        </div>
        {!loadFailed ? (
          <GenerateNarrativeForm
            action={generateAction}
            disabled={!hasStructuredInputs}
          />
        ) : null}
      </div>

      {feedback ? (
        <p
          role="status"
          className="mt-6 rounded-lg border border-emerald-700/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {feedback === "generated"
            ? "Narrative draft generated and saved as a new version."
            : "Reviewed narrative saved as a new version."}
        </p>
      ) : null}

      {loadFailed ? (
        <p role="alert" className="mt-6 text-sm text-brand-red">
          Narrative versions could not be loaded safely. Please try again.
        </p>
      ) : latestNarrative ? (
        <div className="mt-7">
          <div className="rounded-lg border border-amber-700/15 bg-amber-50 px-4 py-3 text-sm leading-6 text-amber-900">
            Review every section before saving. Keep factual values in the structured inputs rather than duplicating them here.
          </div>
          <div className="mt-6">
            <NarrativeReviewForm
              action={saveAction}
              initialNarrative={latestNarrative}
            />
          </div>
        </div>
      ) : (
        <p className="mt-6 text-sm leading-6 text-black/50">
          No narrative draft has been generated for this client yet.
        </p>
      )}

      {history.length > 0 ? (
        <div className="mt-8 border-t border-black/10 pt-6">
          <h3 className="text-base font-bold">Version history</h3>
          <p className="mt-1 text-sm leading-6 text-black/50">
            Open any version to review its immutable narrative and metadata.
          </p>
          <ol className="mt-4 space-y-3">
            {history.map((version) => (
              <li
                key={version.versionNumber}
                className="overflow-hidden rounded-lg border border-black/10"
              >
                <details className="group">
                  <summary className="flex cursor-pointer list-none flex-col gap-2 px-4 py-4 text-sm transition hover:bg-black/[0.02] sm:flex-row sm:items-center sm:justify-between">
                    <span>
                      <span className="font-bold">
                        Version {version.versionNumber} · {versionStatusLabel(version.status)}
                      </span>
                      <span className="mt-1 block text-black/45">
                        {formatPortalDateTime(version.createdAt)}
                        {version.modelProvider === "anthropic" && version.modelName
                          ? ` · ${version.modelName}`
                          : " · Human edit"}
                      </span>
                    </span>
                    <span className="font-bold text-brand-red">
                      <span className="group-open:hidden">View version</span>
                      <span className="hidden group-open:inline">Hide version</span>
                    </span>
                  </summary>

                  <div className="border-t border-black/10 bg-black/[0.015] px-4 py-5 sm:px-5">
                    <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
                      <MetadataItem label="Status" value={versionStatusLabel(version.status)} />
                      <MetadataItem label="Created" value={formatPortalDateTime(version.createdAt)} />
                      <MetadataItem label="Created by" value={version.creatorLabel} />
                      {version.reviewerLabel ? (
                        <MetadataItem label="Reviewed by" value={version.reviewerLabel} />
                      ) : null}
                      {version.reviewedAt ? (
                        <MetadataItem label="Reviewed" value={formatPortalDateTime(version.reviewedAt)} />
                      ) : null}
                      {version.modelProvider ? (
                        <MetadataItem label="Provider" value={version.modelProvider} />
                      ) : null}
                      {version.modelName ? (
                        <MetadataItem label="Model" value={version.modelName} />
                      ) : null}
                      {version.promptVersion ? (
                        <MetadataItem label="Prompt version" value={version.promptVersion} />
                      ) : null}
                    </dl>

                    {version.content ? (
                      <div className="mt-6 space-y-5 border-t border-black/10 pt-5">
                        {READ_ONLY_SECTIONS.map(({ field, label }) => (
                          <section key={field}>
                            <h4 className="text-sm font-bold text-black/70">{label}</h4>
                            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-black/65">
                              {version.content?.[field]}
                            </p>
                          </section>
                        ))}
                      </div>
                    ) : (
                      <p role="alert" className="mt-6 text-sm text-brand-red">
                        This historical narrative cannot be displayed safely.
                      </p>
                    )}
                  </div>
                </details>
              </li>
            ))}
          </ol>
        </div>
      ) : null}

      <div className="mt-8 border-t border-black/10 pt-6">
        <h3 className="text-base font-bold">Publish client page</h3>
        <p className="mt-1 max-w-2xl text-sm leading-6 text-black/50">
          Publish a password-protected page pinned to one reviewed narrative version. Branding, factual values, and disclosure remain deterministic.
        </p>
        {publicationFeedback ? (
          <p
            role="status"
            className="mt-5 rounded-lg border border-emerald-700/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
          >
            {publicationFeedback === "published"
              ? "Client page published successfully."
              : "Client page unpublished successfully."}
          </p>
        ) : null}
        {!clientIsActive ? (
          <p className="mt-5 text-sm text-black/50">
            Archived clients cannot be published. Change the client status to active first.
          </p>
        ) : publicationResult.error ? (
          <p role="alert" className="mt-5 text-sm text-brand-red">
            Publication settings could not be loaded safely. Please try again.
          </p>
        ) : (
          <ClientPagePublicationForm
            publication={publication}
            publishAction={publishAction}
            reviewedVersions={reviewedVersions}
            unpublishAction={unpublishAction}
          />
        )}
      </div>
    </section>
  );
}

function MetadataItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-black/40">
        {label}
      </dt>
      <dd className="mt-1 font-bold text-black/70">{value}</dd>
    </div>
  );
}
