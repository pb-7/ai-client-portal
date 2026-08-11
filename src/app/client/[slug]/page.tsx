import type { Metadata } from "next";
import { notFound } from "next/navigation";

import {
  logoutClientPage,
  unlockClientPage,
} from "@/app/client/[slug]/actions";
import { ClientPagePasswordForm } from "@/components/client-page-password-form";
import {
  RISK_PROFILE_OPTIONS,
  US_STATE_OPTIONS,
} from "@/constants/client-inputs";
import { REQUIRED_DISCLOSURE } from "@/constants/disclosure";
import { hasClientPageAccess } from "@/lib/publication/client-page-security";
import { loadPublishedClientPage } from "@/lib/supabase/publication";
import type { ClientFinancialInputs } from "@/types/client-inputs";
import type { ClientNarrative } from "@/types/narrative";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  robots: { follow: false, index: false },
  title: "Confidential Client Review | Fake Financial Firm",
};

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-US", {
  currency: "USD",
  maximumFractionDigits: 0,
  style: "currency",
});

function riskProfileLabel(value: ClientFinancialInputs["riskProfile"]) {
  return (
    RISK_PROFILE_OPTIONS.find((option) => option.value === value)?.label ??
    "Not specified"
  );
}

function stateLabel(value: string) {
  return US_STATE_OPTIONS.find(([code]) => code === value)?.[1] ?? value;
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black/10 bg-white p-4">
      <dt className="text-xs font-bold uppercase tracking-[0.12em] text-black/40">
        {label}
      </dt>
      <dd className="mt-2 text-lg font-bold text-brand-black">{value}</dd>
    </div>
  );
}

function ProtectedPage({ clientName, inputs, logoutAction, narrative }: {
  clientName: string;
  inputs: ClientFinancialInputs;
  logoutAction: (formData: FormData) => Promise<void>;
  narrative: ClientNarrative;
}) {
  const goals = [
    inputs.goals.retirement ? "Retirement" : null,
    inputs.goals.education ? "Education" : null,
    inputs.goals.legacy ? "Legacy" : null,
  ].filter((goal): goal is string => Boolean(goal));
  const allocation = [
    ["US equity", inputs.portfolioAllocation.usEquity],
    ["International equity", inputs.portfolioAllocation.internationalEquity],
    ["Fixed income", inputs.portfolioAllocation.fixedIncome],
    ["Cash", inputs.portfolioAllocation.cash],
    ["Alternatives", inputs.portfolioAllocation.alternatives],
  ] as const;

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-brand-black">
      <header className="border-b-4 border-brand-red bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-6 sm:px-8">
          <div>
            <p className="text-xl font-bold tracking-tight">Fake Financial Firm</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-brand-red">
              Confidential client review
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full border border-brand-red/20 bg-brand-red/[0.06] px-3 py-1 text-xs font-bold text-brand-red sm:inline-flex">
              Protected page
            </span>
            <form action={logoutAction}>
              <button
                type="submit"
                className="rounded-md border border-black/15 bg-white px-4 py-2 text-sm font-bold text-brand-black transition hover:border-brand-red hover:text-brand-red"
              >
                Log out
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red">
            Prepared for
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">
            {clientName}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-7 text-black/60">
            {inputs.meetingPurpose}
          </p>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Client overview</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Fact label="Primary client age" value={String(inputs.primaryClientAge)} />
            {inputs.spousePartnerAge !== null ? (
              <Fact label="Spouse/partner age" value={String(inputs.spousePartnerAge)} />
            ) : null}
            <Fact label="Target retirement age" value={String(inputs.targetRetirementAge)} />
            <Fact label="State" value={stateLabel(inputs.state)} />
            <Fact label="Assets with firm" value={CURRENCY_FORMATTER.format(inputs.assetsCurrentlyWithFirm)} />
            <Fact label="Outside assets" value={CURRENCY_FORMATTER.format(inputs.outsideAssets)} />
            <Fact label="Risk profile" value={riskProfileLabel(inputs.riskProfile)} />
            <Fact label="Goals" value={goals.join(", ") || "None selected"} />
          </dl>
        </section>

        <section className="mt-10 rounded-xl border border-black/10 bg-white p-5 shadow-[0_15px_45px_rgba(26,26,26,0.04)] sm:p-8">
          <h2 className="text-2xl font-bold">Portfolio allocation</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {allocation.map(([label, value]) => (
              <div key={label} className="border-l-4 border-brand-red pl-4">
                <p className="text-sm font-bold text-black/50">{label}</p>
                <p className="mt-1 text-2xl font-bold">{value}%</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-bold">Review narrative</h2>
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <NarrativeCard title="Retirement summary" body={narrative.retirementSummary} />
            <NarrativeCard title="Consolidation summary" body={narrative.consolidationSummary} />
            <NarrativeCard title="Portfolio summary" body={narrative.portfolioSummary} />
            <NarrativeCard title="Next steps" body={narrative.nextSteps} />
          </div>
        </section>

        <footer className="mt-12 border-t border-black/15 pt-7">
          <p className="text-xs leading-6 text-black/55">{REQUIRED_DISCLOSURE}</p>
        </footer>
      </div>
    </main>
  );
}

function NarrativeCard({ body, title }: { body: string; title: string }) {
  return (
    <article className="rounded-xl border border-black/10 bg-white p-5 shadow-[0_12px_35px_rgba(26,26,26,0.035)] sm:p-7">
      <h3 className="text-lg font-bold text-brand-red">{title}</h3>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-black/65">
        {body}
      </p>
    </article>
  );
}

export default async function ClientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const record = await loadPublishedClientPage(slug).catch(() => null);
  if (!record) notFound();

  const hasAccess = await hasClientPageAccess(record).catch(() => false);
  if (!hasAccess) {
    const action = unlockClientPage.bind(null, slug);
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f7f7f5] px-5 py-12 text-brand-black">
        <div className="w-full max-w-md rounded-xl border border-black/10 bg-white p-6 shadow-[0_20px_60px_rgba(26,26,26,0.08)] sm:p-8">
          <div className="border-l-4 border-brand-red pl-4">
            <p className="text-xl font-bold">Fake Financial Firm</p>
            <p className="mt-1 text-xs font-bold uppercase tracking-[0.15em] text-brand-red">
              Confidential client page
            </p>
          </div>
          <h1 className="mt-8 text-2xl font-bold tracking-tight">
            Password required
          </h1>
          <p className="mt-2 text-sm leading-6 text-black/55">
            Enter the password shared with you to view this protected page.
          </p>
          <ClientPagePasswordForm action={action} />
        </div>
      </main>
    );
  }

  return (
    <ProtectedPage
      clientName={record.clientName}
      inputs={record.clientInputs}
      logoutAction={logoutClientPage.bind(null, slug)}
      narrative={record.narrative}
    />
  );
}
