import Link from "next/link";

import { BrowserLocalDateTime } from "@/components/portal/browser-local-date-time";
import { StatusBadge } from "@/components/portal/status-badge";
import { SummaryCard } from "@/components/portal/summary-card";
import { requireRole } from "@/lib/auth/session";
import type { AdvisorProfile, ClientSummary } from "@/types/portal";

function getAdvisorDisplayName(advisor: AdvisorProfile) {
  return advisor.display_name?.trim() || "Unnamed advisor";
}

type AdminDashboardPageProps = {
  searchParams: Promise<{ deleted?: string }>;
};

export default async function AdminDashboardPage({
  searchParams,
}: AdminDashboardPageProps) {
  const { supabase } = await requireRole("admin");
  const query = await searchParams;
  const [advisorResult, clientResult] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, display_name, disabled, created_at")
      .eq("role", "advisor")
      .order("created_at", { ascending: true }),
    supabase
      .from("clients")
      .select("id, name, status, advisor_id, updated_at")
      .is("deleted_at", null)
      .order("name", { ascending: true }),
  ]);

  const advisors = (advisorResult.data ?? []) as AdvisorProfile[];
  const clients = (clientResult.data ?? []) as ClientSummary[];
  const hasDataError = Boolean(advisorResult.error || clientResult.error);
  const activeClientCount = clients.filter(
    (client) => client.status === "active",
  ).length;
  const advisorLabels = new Map(
    advisors.map((advisor) => [advisor.id, getAdvisorDisplayName(advisor)]),
  );

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red">
            Firm administration
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Firm overview
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-black/60">
            Monitor advisor access, client ownership, and the firm&apos;s current
            book of fictional assessment clients.
          </p>
        </div>
        <Link
          href="/portal/admin/clients/recently-deleted"
          className="text-sm font-bold text-brand-red underline-offset-4 hover:underline"
        >
          Recently Deleted
        </Link>
      </div>

      {query.deleted === "1" ? (
        <p
          role="status"
          className="mt-7 rounded-lg border border-emerald-700/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Client moved to Recently Deleted.
        </p>
      ) : null}

      {hasDataError ? (
        <div
          role="alert"
          className="mt-7 rounded-lg border border-brand-red/20 bg-brand-red/5 px-4 py-3 text-sm text-brand-red"
        >
          Portal data could not be loaded right now. Please try again.
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Advisor accounts"
          value={advisors.length}
          detail="Internal advisor profiles"
        />
        <SummaryCard
          label="Total clients"
          value={clients.length}
          detail="Fictional client records"
        />
        <SummaryCard
          label="Active clients"
          value={activeClientCount}
          detail="Currently active records"
        />
      </div>

      <section className="mt-8 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_12px_35px_rgba(26,26,26,0.04)]">
        <div className="border-b border-black/10 px-5 py-5 sm:px-6">
          <h2 className="text-xl font-bold">Advisor accounts</h2>
          <p className="mt-1 text-sm text-black/55">
            Access status and assigned-client totals from advisor profiles.
          </p>
        </div>

        {advisors.length > 0 ? (
          <div className="divide-y divide-black/8">
            {advisors.map((advisor, index) => {
              const assignedCount = clients.filter(
                (client) => client.advisor_id === advisor.id,
              ).length;
              const displayName = getAdvisorDisplayName(advisor);

              return (
                <article
                  key={advisor.id}
                  className="grid gap-4 px-5 py-5 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center sm:px-6"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-sm font-bold text-brand-red">
                      A{index + 1}
                    </span>
                    <div className="min-w-0">
                      <h3 className="truncate font-bold">{displayName}</h3>
                      <p className="mt-1 text-xs text-black/45">
                        Advisor account
                      </p>
                    </div>
                  </div>
                  <StatusBadge
                    label={advisor.disabled ? "Disabled" : "Enabled"}
                    tone={advisor.disabled ? "inactive" : "active"}
                  />
                  <p className="text-sm text-black/60 sm:min-w-28 sm:text-right">
                    <span className="font-bold text-brand-black">
                      {assignedCount}
                    </span>{" "}
                    {assignedCount === 1 ? "client" : "clients"}
                  </p>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="px-5 py-10 text-center sm:px-6">
            <p className="font-bold">No advisor profiles found</p>
            <p className="mt-2 text-sm text-black/55">
              Advisor accounts will appear here after they are provisioned.
            </p>
          </div>
        )}
      </section>

      <section className="mt-8 overflow-hidden rounded-xl border border-black/10 bg-white shadow-[0_12px_35px_rgba(26,26,26,0.04)]">
        <div className="flex flex-col gap-2 border-b border-black/10 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <h2 className="text-xl font-bold">Client ownership</h2>
            <p className="mt-1 text-sm text-black/55">
              Current advisor assignment for every client record.
            </p>
          </div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-black/40">
            Open a client to edit or reassign
          </p>
        </div>

        {clients.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[940px] text-left text-sm">
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
                    Last updated
                  </th>
                  <th scope="col" className="px-6 py-3 text-right font-bold">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/8">
                {clients.map((client) => (
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
                    <td className="whitespace-nowrap px-6 py-4 text-black/60">
                      <BrowserLocalDateTime value={client.updated_at} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/portal/admin/clients/${client.id}`}
                        className="font-bold text-brand-red underline-offset-4 hover:underline"
                      >
                        View / Edit
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-5 py-10 text-center sm:px-6">
            <p className="font-bold">No client records yet</p>
            <p className="mt-2 text-sm text-black/55">
              Client ownership will appear here after records are created.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
