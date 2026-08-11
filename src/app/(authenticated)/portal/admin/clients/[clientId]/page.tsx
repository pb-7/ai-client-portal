import Link from "next/link";
import { notFound } from "next/navigation";

import {
  reassignClient,
  softDeleteClient,
  updateClient,
} from "@/app/(authenticated)/portal/client-actions";
import { ClientRecordForm } from "@/components/portal/client-record-form";
import { ReassignClientForm } from "@/components/portal/reassign-client-form";
import { SoftDeleteClientForm } from "@/components/portal/soft-delete-client-form";
import { StatusBadge } from "@/components/portal/status-badge";
import { requireRole } from "@/lib/auth/session";
import { formatPortalDate } from "@/lib/format/date";
import { isUuid } from "@/lib/validation/client";
import type {
  AdvisorOption,
  AdvisorProfile,
  ClientRecord,
} from "@/types/portal";

type AdminClientPageProps = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ reassigned?: string; saved?: string }>;
};

function advisorLabel(advisor: AdvisorProfile, index: number) {
  return advisor.display_name?.trim() || `Unnamed advisor ${index + 1}`;
}

export default async function AdminClientPage({
  params,
  searchParams,
}: AdminClientPageProps) {
  const { clientId } = await params;

  if (!isUuid(clientId)) {
    notFound();
  }

  const { supabase } = await requireRole("admin");
  const [clientResult, advisorResult] = await Promise.all([
    supabase
      .from("clients")
      .select("id, name, status, advisor_id, created_at, updated_at")
      .eq("id", clientId)
      .is("deleted_at", null)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, display_name, disabled, created_at")
      .eq("role", "advisor")
      .order("created_at", { ascending: true }),
  ]);

  if (clientResult.error || !clientResult.data) {
    notFound();
  }

  const client = clientResult.data as ClientRecord;
  const advisors = (advisorResult.data ?? []) as AdvisorProfile[];
  const activeAdvisorOptions: AdvisorOption[] = advisors
    .filter((advisor) => !advisor.disabled)
    .map((advisor, index) => ({
      id: advisor.id,
      label: advisorLabel(advisor, index),
    }));
  const currentAdvisor = advisors.find(
    (advisor) => advisor.id === client.advisor_id,
  );
  const currentAdvisorName = currentAdvisor
    ? advisorLabel(currentAdvisor, advisors.indexOf(currentAdvisor))
    : "Advisor unavailable";
  const deleteAction = softDeleteClient.bind(null, client.id);
  const updateAction = updateClient.bind(null, client.id);
  const reassignAction = reassignClient.bind(null, client.id);
  const query = await searchParams;

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        href="/portal/admin"
        className="text-sm font-bold text-brand-red underline-offset-4 hover:underline"
      >
        ← Back to firm overview
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red">
            Firm client record
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {client.name}
          </h1>
          <p className="mt-3 text-sm text-black/50">
            Created {formatPortalDate(client.created_at)} · Updated {formatPortalDate(client.updated_at)}
          </p>
        </div>
        <StatusBadge
          label={client.status === "active" ? "Active" : "Archived"}
          tone={client.status === "active" ? "active" : "inactive"}
        />
      </div>

      {query.saved === "1" || query.reassigned === "1" ? (
        <p
          role="status"
          className="mt-7 rounded-lg border border-emerald-700/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          {query.reassigned === "1"
            ? "Client advisor reassigned."
            : "Client changes saved."}
        </p>
      ) : null}

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)] lg:items-start">
        <section className="rounded-xl border border-black/10 bg-white p-5 shadow-[0_12px_35px_rgba(26,26,26,0.04)] sm:p-7">
          <h2 className="text-xl font-bold">Basic client information</h2>
          <p className="mt-1 text-sm leading-6 text-black/55">
            Update the identity and lifecycle status for this client record.
          </p>
          <div className="mt-6">
            <ClientRecordForm
              action={updateAction}
              cancelHref="/portal/admin"
              initialName={client.name}
              initialStatus={client.status}
              submitLabel="Save changes"
            />
          </div>
        </section>

        <section className="rounded-xl border border-black/10 bg-white p-5 shadow-[0_12px_35px_rgba(26,26,26,0.04)] sm:p-7">
          <h2 className="text-xl font-bold">Advisor ownership</h2>
          <p className="mt-2 text-sm leading-6 text-black/55">
            Currently assigned to <span className="font-bold text-brand-black">{currentAdvisorName}</span>.
          </p>
          {advisorResult.error ? (
            <p role="alert" className="mt-5 text-sm text-brand-red">
              Advisor options could not be loaded right now.
            </p>
          ) : (
            <div className="mt-5">
              <ReassignClientForm
                action={reassignAction}
                advisors={activeAdvisorOptions}
                currentAdvisorId={client.advisor_id}
              />
            </div>
          )}
        </section>
      </div>

      <p className="mt-6 text-xs leading-5 text-black/45">
        Reassignment changes which advisor can access and manage this client.
      </p>

      <section className="mt-6 rounded-xl border border-brand-red/20 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-bold text-brand-red">Delete client</h2>
        <p className="mt-2 text-sm leading-6 text-black/55">
          This removes the client from normal portal views while preserving its
          related data for the seven-day recovery period.
        </p>
        <div className="mt-5">
          <SoftDeleteClientForm
            action={deleteAction}
            clientName={client.name}
          />
        </div>
      </section>
    </div>
  );
}
