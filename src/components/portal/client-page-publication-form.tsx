"use client";

import { useActionState } from "react";

import { FormSubmitButton } from "@/components/portal/form-submit-button";
import type {
  ClientPagePublication,
  PublicationMutationState,
} from "@/types/publication";

type PublicationAction = (
  state: PublicationMutationState,
  formData: FormData,
) => Promise<PublicationMutationState>;

type ReviewedVersionOption = {
  createdAt: string;
  id: string;
  label: string;
};

const INPUT_CLASS =
  "mt-2 h-12 w-full rounded-md border border-black/15 bg-white px-4 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15";

export function ClientPagePublicationForm({
  publication,
  publishAction,
  reviewedVersions,
  unpublishAction,
}: {
  publication: ClientPagePublication | null;
  publishAction: PublicationAction;
  reviewedVersions: ReviewedVersionOption[];
  unpublishAction: PublicationAction;
}) {
  const [publishState, publishFormAction] = useActionState(publishAction, {});
  const [unpublishState, unpublishFormAction] = useActionState(
    unpublishAction,
    {},
  );
  const hasReviewedVersions = reviewedVersions.length > 0;
  const publicPath = publication ? `/client/${publication.slug}` : null;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)]">
      <form action={publishFormAction} className="space-y-5">
        <div>
          <label htmlFor="publication-version" className="text-sm font-bold text-black/70">
            Reviewed narrative version
          </label>
          <select
            id="publication-version"
            name="narrativeVersionId"
            required
            disabled={!hasReviewedVersions}
            defaultValue={publication?.narrativeVersionId ?? reviewedVersions[0]?.id ?? ""}
            aria-invalid={Boolean(publishState.fieldErrors?.narrativeVersionId)}
            className={INPUT_CLASS}
          >
            {!hasReviewedVersions ? (
              <option value="">No reviewed versions available</option>
            ) : null}
            {reviewedVersions.map((version) => (
              <option key={version.id} value={version.id}>
                {version.label}
              </option>
            ))}
          </select>
          {publishState.fieldErrors?.narrativeVersionId ? (
            <p className="mt-2 text-sm text-brand-red">
              {publishState.fieldErrors.narrativeVersionId}
            </p>
          ) : null}
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label htmlFor="publication-password" className="text-sm font-bold text-black/70">
              Client-page password
            </label>
            <input
              id="publication-password"
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              aria-invalid={Boolean(publishState.fieldErrors?.password)}
              className={INPUT_CLASS}
            />
            {publishState.fieldErrors?.password ? (
              <p className="mt-2 text-sm text-brand-red">
                {publishState.fieldErrors.password}
              </p>
            ) : null}
          </div>
          <div>
            <label htmlFor="publication-password-confirmation" className="text-sm font-bold text-black/70">
              Confirm password
            </label>
            <input
              id="publication-password-confirmation"
              name="passwordConfirmation"
              type="password"
              required
              minLength={12}
              maxLength={128}
              autoComplete="new-password"
              aria-invalid={Boolean(publishState.fieldErrors?.passwordConfirmation)}
              className={INPUT_CLASS}
            />
            {publishState.fieldErrors?.passwordConfirmation ? (
              <p className="mt-2 text-sm text-brand-red">
                {publishState.fieldErrors.passwordConfirmation}
              </p>
            ) : null}
          </div>
        </div>

        <p className="text-xs leading-5 text-black/45">
          The password is hashed before storage and cannot be recovered. Publishing again replaces the password and intentionally selects the chosen reviewed version.
        </p>
        {publishState.message ? (
          <p role="alert" className="text-sm text-brand-red">
            {publishState.message}
          </p>
        ) : null}
        <FormSubmitButton
          disabled={!hasReviewedVersions}
          label={publication?.published ? "Republish page" : "Publish page"}
          pendingLabel="Publishing…"
        />
      </form>

      <aside className="rounded-lg border border-black/10 bg-black/[0.02] p-5">
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
          Publication state
        </p>
        <p className="mt-2 text-lg font-bold">
          {publication?.published ? "Published" : "Not published"}
        </p>
        {publicPath ? (
          <div className="mt-4">
            <p className="text-xs font-bold text-black/45">Protected URL</p>
            <a
              href={publicPath}
              target="_blank"
              rel="noreferrer"
              className="mt-1 block break-all text-sm font-bold text-brand-red underline-offset-4 hover:underline"
            >
              {publicPath}
            </a>
          </div>
        ) : null}
        {publication?.published ? (
          <form action={unpublishFormAction} className="mt-5 border-t border-black/10 pt-5">
            <FormSubmitButton
              label="Unpublish page"
              pendingLabel="Unpublishing…"
            />
            {unpublishState.message ? (
              <p role="alert" className="mt-3 text-sm text-brand-red">
                {unpublishState.message}
              </p>
            ) : null}
          </form>
        ) : null}
      </aside>
    </div>
  );
}
