import type { ReactNode } from "react";

import { PortalShell } from "@/components/portal/portal-shell";
import { requireAuthenticatedProfile } from "@/lib/auth/session";

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const { email, profile } = await requireAuthenticatedProfile();

  return (
    <PortalShell
      displayName={profile.display_name}
      email={email}
      role={profile.role}
    >
      {children}
    </PortalShell>
  );
}
