import Link from "next/link";
import type { ReactNode } from "react";

type AuthShellProps = {
  children: ReactNode;
  description: string;
  eyebrow: string;
  title: string;
};

export function AuthShell({
  children,
  description,
  eyebrow,
  title,
}: AuthShellProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#fafafa] px-6 py-12 text-brand-black">
      <div className="w-full max-w-md">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-3"
          aria-label="Fake Financial Firm home"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-sm bg-brand-red text-sm font-bold text-white">
            FF
          </span>
          <span className="text-sm font-bold uppercase tracking-[0.16em]">
            Fake Financial Firm
          </span>
        </Link>

        <section className="rounded-2xl border border-black/10 bg-white p-7 shadow-[0_24px_70px_rgba(26,26,26,0.08)] sm:p-10">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-red">
            {eyebrow}
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight">{title}</h1>
          <p className="mt-3 leading-7 text-black/60">{description}</p>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
