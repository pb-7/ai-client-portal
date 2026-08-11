import Link from "next/link";
import type { ReactNode } from "react";

import { LogoutButton } from "@/components/auth/logout-button";
import { portalPathForRole } from "@/lib/auth/session";
import type { AppRole } from "@/types/portal";

type PortalShellProps = {
  children: ReactNode;
  displayName: string | null;
  email: string;
  role: AppRole;
};

export function PortalShell({
  children,
  displayName,
  email,
  role,
}: PortalShellProps) {
  const roleLabel = role === "admin" ? "Administrator" : "Advisor";
  const dashboardPath = portalPathForRole(role);
  const accountLabel = displayName ?? email;

  return (
    <div className="min-h-screen bg-[#f5f5f2] text-brand-black">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex min-h-20 max-w-[1500px] flex-wrap items-center justify-between gap-4 px-5 py-4 sm:px-8 lg:px-10">
          <Link
            href={dashboardPath}
            className="flex items-center gap-3"
            aria-label="Fake Financial Firm portal home"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm bg-brand-red text-sm font-bold tracking-tight text-white">
              FF
            </span>
            <span>
              <span className="block text-sm font-bold uppercase tracking-[0.14em] sm:text-base">
                Fake Financial Firm
              </span>
              <span className="mt-0.5 block text-xs text-black/50">
                Advisory portal
              </span>
            </span>
          </Link>

          <div className="flex min-w-0 items-center gap-3 sm:gap-5">
            <div className="hidden min-w-0 text-right sm:block">
              <p className="truncate text-sm font-bold">{accountLabel}</p>
              <p className="mt-0.5 text-xs text-black/50">{roleLabel}</p>
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="border-b border-black/10 bg-white px-5 py-4 sm:px-8 lg:min-h-[calc(100vh-81px)] lg:border-r lg:border-b-0 lg:px-6 lg:py-8">
          <div className="flex items-center justify-between gap-4 lg:block">
            <nav aria-label="Portal navigation">
              <Link
                href={dashboardPath}
                aria-current="page"
                className="flex items-center gap-3 rounded-lg bg-brand-red/8 px-4 py-3 text-sm font-bold text-brand-red"
              >
                <span className="h-2 w-2 rounded-full bg-brand-red" />
                Dashboard
              </Link>
            </nav>

            <div className="hidden border-t border-black/10 pt-6 lg:mt-8 lg:block">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-black/40">
                Access scope
              </p>
              <p className="mt-3 text-sm leading-6 text-black/60">
                {role === "admin"
                  ? "Firm-wide advisor and client visibility."
                  : "Only clients assigned to your advisor profile."}
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-black/10 pt-4 sm:hidden">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{accountLabel}</p>
              <p className="mt-0.5 text-xs text-black/50">{roleLabel}</p>
            </div>
          </div>
        </aside>

        <main className="min-w-0 px-5 py-8 sm:px-8 sm:py-10 lg:px-10 lg:py-12">
          {children}
        </main>
      </div>
    </div>
  );
}
