import type { ReactNode } from "react";

import { requireAuthenticatedProfile } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AuthenticatedLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireAuthenticatedProfile();

  return children;
}
