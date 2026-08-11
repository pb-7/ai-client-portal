import { StatusBadge } from "@/components/portal/status-badge";
import { SummaryCard } from "@/components/portal/summary-card";
import { requireRole } from "@/lib/auth/session";
import type { ClientSummary } from "@/types/portal";

function formatUpdatedDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function AdvisorDashboardPage() {
  const { profile, supabase } = await requireRole("advisor");
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, status, advisor_id, updated_at")
    .eq("advisor_id", profile.id)
    .order("name", { ascending: true });
  const clients = (data ?? []) as ClientSummary[];
  const activeClientCount = clients.filter(
    (client) => client.status === "active",
  ).length;
  const archivedClientCount = clients.length - activeClientCount;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red">
            Advisor workspace
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Your clients
          </h1>
          <p className="mt-3 max-w-2xl leading-7 text-black/60">
            Review the fictional client records assigned to your advisor
            profile.
          </p>
        </div>
        <button
          type="button"
          disabled
          title="Client creation will be available in Ticket 6"
          className="inline-flex h-11 items-center justify-center rounded-md bg-brand-red px-5 text-sm font-bold text-white opacity-55 disabled:cursor-not-allowed"
        >
          Create Client
        </button>
      </div>

      {error ? (
        <div
          role="alert"
          className="mt-7 rounded-lg border border-brand-red/20 bg-brand-red/5 px-4 py-3 text-sm text-brand-red"
        >
          Your client list could not be loaded right now. Please try again.
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Assigned clients"
          value={clients.length}
          detail="Visible to your profile"
        />
        <SummaryCard
          label="Active clients"
          value={activeClientCount}
          detail="Currently active records"
        />
        <SummaryCard
          label="Archived clients"
          value={archivedClientCount}
          detail="Retained historical records"
        />
      </div>

      <section className="mt-8 rounded-xl border border-black/10 bg-white shadow-[0_12px_35px_rgba(26,26,26,0.04)]">
        <div className="border-b border-black/10 px-5 py-5 sm:px-6">
          <h2 className="text-xl font-bold">Assigned client records</h2>
          <p className="mt-1 text-sm text-black/55">
            Access is limited by your authenticated advisor assignment.
          </p>
        </div>

        {clients.length > 0 ? (
          <div className="grid gap-4 p-5 sm:grid-cols-2 sm:p-6 xl:grid-cols-3">
            {clients.map((client) => (
              <article
                key={client.id}
                className="rounded-lg border border-black/10 p-5 transition hover:border-black/20 hover:shadow-[0_10px_25px_rgba(26,26,26,0.05)]"
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-red/10 text-sm font-bold text-brand-red">
                    {client.name.slice(0, 1).toUpperCase()}
                  </span>
                  <StatusBadge
                    label={client.status === "active" ? "Active" : "Archived"}
                    tone={client.status === "active" ? "active" : "inactive"}
                  />
                </div>
                <h3 className="mt-5 text-lg font-bold">{client.name}</h3>
                <p className="mt-2 text-sm text-black/50">
                  Updated {formatUpdatedDate(client.updated_at)}
                </p>
                <div className="mt-5 border-t border-black/8 pt-4 text-sm font-bold text-black/40">
                  Client details coming in Ticket 6
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="px-5 py-14 text-center sm:px-6 sm:py-16">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-red/10 text-xl font-bold text-brand-red">
              0
            </span>
            <h3 className="mt-5 text-lg font-bold">No clients assigned yet</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-black/55">
              Your client list will appear here after an administrator assigns
              records to your advisor profile. Client creation will be enabled
              in the next ticket.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
