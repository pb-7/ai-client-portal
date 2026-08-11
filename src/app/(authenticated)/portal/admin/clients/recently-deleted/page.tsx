import Link from "next/link";

import { restoreClient } from "@/app/(authenticated)/portal/client-actions";
import { RestoreClientForm } from "@/components/portal/restore-client-form";
import { StatusBadge } from "@/components/portal/status-badge";
import {
  CLIENT_DELETION_RETENTION_DAYS,
  CLIENT_DELETION_RETENTION_MS,
} from "@/constants/client-retention";
import { requireRole } from "@/lib/auth/session";
import { formatPortalDate } from "@/lib/format/date";
import type {
  AdvisorProfile,
  DeletedClientSummary,
} from "@/types/portal";

type RecentlyDeletedPageProps = {
  searchParams: Promise<{ restored?: string }>;
};

function getAdvisorDisplayName(advisor: AdvisorProfile) {
  return advisor.display_name?.trim() || "Unnamed advisor";
}

export default async function RecentlyDeletedPage({
  searchParams,
}: RecentlyDeletedPageProps) {
  const { supabase } = await requireRole("admin");
  const query = await searchParams;
  const now = new Date();
  const cutoff = new Date(
    now.getTime() - CLIENT_DELETION_RETENTION_MS,
  ).toISOString();
  const [clientResult, advisorResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, status, advisor_id, updated_at, deleted_at")
      .not("deleted_at", "is", null)
      .gte("deleted_at", cutoff)
      .lte("deleted_at", now.toISOString())
      .order("deleted_at", { ascending: false }),
    supabase
      .from("profiles")
      .select("id, display_name, disabled, created_at")
      .eq("role", "advisor")
      .order("created_at", { ascending: true }),
  ]);
  const deletedClients = (clientResult.data ?? []) as DeletedClientSummary[];
  const advisors = (advisorResult.data ?? []) as AdvisorProfile[];
  const advisorLabels = new Map(
    advisors.map((advisor) => [advisor.id, getAdvisorDisplayName(advisor)]),
  );
  const hasDataError = Boolean(clientResult.error || advisorResult.error);

  return (
    <div className="mx-auto max-w-6xl">
      <Link
        href="/portal/admin"
        className="text-sm font-bold text-brand-red underline-offset-4 hover:underline"
      >
        ← Back to firm overview
      </Link>

      <div className="mt-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red">
          Client recovery
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Recently Deleted
        </h1>
        <p className="mt-3 max-w-3xl leading-7 text-black/60">
          Restore clients deleted within the last {CLIENT_DELETION_RETENTION_DAYS}{" "}
          days. Their related structured inputs and narrative history remain
          intact while they are deleted.
        </p>
      </div>

      {query.restored === "1" ? (
        <p
          role="status"
          className="mt-7 rounded-lg border border-emerald-700/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Client restored to normal portal views.
        </p>
      ) : null}

      {hasDataError ? (
        <p
          role="alert"
          className="mt-7 rounded-lg border border-brand-red/20 bg-brand-red/5 px-4 py-3 text-sm text-brand-red"
        >
          Recently deleted clients could not be loaded right now. Please try
          again.
        </p>
      ) : null}

      <section className="mt-8 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_12px_35px_rgba(26,26,26,0.04)]">
        {deletedClients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-black/[0.025] text-xs uppercase tracking-[0.12em] text-black/45">
                <tr>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Client
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Assigned advisor
                  </th>
                  <th scope="col" className="px-6 py-3 font-bold">
                    Deleted
                  </th>
                  <th scope="col" className="px-6 py-3 text-right font-bold">
                    Recovery
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/8">
                {deletedClients.map((client) => {
                  const restoreAction = restoreClient.bind(null, client.id);

                  return (
                    <tr key={client.id}>
                      <td className="px-6 py-4 font-bold">{client.name}</td>
                      <td className="px-6 py-4">
                        <StatusBadge
                          label={client.status === "active" ? "Active" : "Archived"}
                          tone={client.status === "active" ? "active" : "inactive"}
                        />
                      </td>
                      <td className="px-6 py-4 text-black/60">
                        {client.advisor_id
                          ? (advisorLabels.get(client.advisor_id) ??
                            "Advisor profile")
                          : "Unassigned"}
                      </td>
                      <td className="px-6 py-4 text-black/60">
                        {formatPortalDate(client.deleted_at)}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <RestoreClientForm action={restoreAction} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-14 text-center sm:px-6 sm:py-16">
            <h2 className="text-lg font-bold">No recently deleted clients</h2>
            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-black/55">
              Clients appear here for seven days after deletion. Older records
              are eligible for permanent deletion, but no automated purge is
              implemented for this assessment.
            </p>
          </div>
        )}
      </section>

      <p className="mt-6 text-xs leading-5 text-black/45">
        Permanent deletion is intentionally deferred. A production system
        should use a scheduled, audited retention job after the recovery period.
      </p>
    </div>
  );
}
