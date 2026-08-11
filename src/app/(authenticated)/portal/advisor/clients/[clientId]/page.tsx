import Link from "next/link";
import { notFound } from "next/navigation";

import {
  softDeleteClient,
  updateClient,
} from "@/app/(authenticated)/portal/client-actions";
import { ClientRecordForm } from "@/components/portal/client-record-form";
import { SoftDeleteClientForm } from "@/components/portal/soft-delete-client-form";
import { StatusBadge } from "@/components/portal/status-badge";
import { requireRole } from "@/lib/auth/session";
import { formatPortalDate } from "@/lib/format/date";
import { isUuid } from "@/lib/validation/client";
import type { ClientRecord } from "@/types/portal";

type AdvisorClientPageProps = {
  params: Promise<{ clientId: string }>;
  searchParams: Promise<{ saved?: string }>;
};

export default async function AdvisorClientPage({
  params,
  searchParams,
}: AdvisorClientPageProps) {
  const { clientId } = await params;

  if (!isUuid(clientId)) {
    notFound();
  }

  const { profile, supabase } = await requireRole("advisor");
  const { data, error } = await supabase
    .from("clients")
    .select("id, name, status, advisor_id, created_at, updated_at")
    .eq("id", clientId)
    .eq("advisor_id", profile.id)
    .is("deleted_at", null)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const client = data as ClientRecord;
  const deleteAction = softDeleteClient.bind(null, client.id);
  const updateAction = updateClient.bind(null, client.id);
  const query = await searchParams;

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        href="/portal/advisor"
        className="text-sm font-bold text-brand-red underline-offset-4 hover:underline"
      >
        ← Back to clients
      </Link>

      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red">
            Client record
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

      {query.saved === "1" ? (
        <p
          role="status"
          className="mt-7 rounded-lg border border-emerald-700/15 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"
        >
          Client changes saved.
        </p>
      ) : null}

      <section className="mt-8 rounded-xl border border-black/10 bg-white p-5 shadow-[0_12px_35px_rgba(26,26,26,0.04)] sm:p-7">
        <h2 className="text-xl font-bold">Basic client information</h2>
        <p className="mt-1 text-sm leading-6 text-black/55">
          Update the identity and lifecycle status for this assigned client.
        </p>
        <div className="mt-6">
          <ClientRecordForm
            action={updateAction}
            cancelHref="/portal/advisor"
            initialName={client.name}
            initialStatus={client.status}
            submitLabel="Save changes"
          />
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-brand-red/20 bg-white p-5 sm:p-7">
        <h2 className="text-xl font-bold text-brand-red">Delete client</h2>
        <p className="mt-2 text-sm leading-6 text-black/55">
          This removes the client from normal portal views. An administrator
          can restore it during the seven-day recovery period.
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
