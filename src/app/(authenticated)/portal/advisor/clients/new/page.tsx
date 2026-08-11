import Link from "next/link";

import { createClient } from "@/app/(authenticated)/portal/client-actions";
import { ClientRecordForm } from "@/components/portal/client-record-form";
import { requireRole } from "@/lib/auth/session";

export default async function NewAdvisorClientPage() {
  await requireRole("advisor");

  return (
    <div className="mx-auto max-w-3xl">
      <Link
        href="/portal/advisor"
        className="text-sm font-bold text-brand-red underline-offset-4 hover:underline"
      >
        ← Back to clients
      </Link>

      <div className="mt-6">
        <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red">
          Client management
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
          Create client
        </h1>
        <p className="mt-3 max-w-2xl leading-7 text-black/60">
          Add the client identity record now. Structured financial details will
          be collected separately in a later workflow.
        </p>
      </div>

      <section className="mt-8 rounded-xl border border-black/10 bg-white p-5 shadow-[0_12px_35px_rgba(26,26,26,0.04)] sm:p-7">
        <div className="mb-6 rounded-lg bg-black/[0.025] px-4 py-3 text-sm leading-6 text-black/60">
          This client will be assigned automatically to your advisor profile.
        </div>
        <ClientRecordForm
          action={createClient}
          cancelHref="/portal/advisor"
          submitLabel="Create client"
        />
      </section>
    </div>
  );
}
