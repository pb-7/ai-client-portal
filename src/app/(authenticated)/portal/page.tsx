import { redirect } from "next/navigation";

import {
  portalPathForRole,
  requireAuthenticatedProfile,
} from "@/lib/auth/session";

export default async function PortalPage() {
  const { profile } = await requireAuthenticatedProfile();

  redirect(portalPathForRole(profile.role));
}
