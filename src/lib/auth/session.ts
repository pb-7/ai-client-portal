import "server-only";

import { redirect } from "next/navigation";
import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { AppRole, AuthenticatedProfile } from "@/types/portal";

function isAppRole(role: unknown): role is AppRole {
  return role === "admin" || role === "advisor";
}

export function portalPathForRole(role: AppRole) {
  return role === "admin" ? "/portal/admin" : "/portal/advisor";
}

export const requireAuthenticatedProfile = cache(async () => {
  const supabase = await createClient();
  const { data: claimsData, error: claimsError } =
    await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;

  if (claimsError || typeof userId !== "string") {
    redirect("/login");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, role, disabled")
    .eq("id", userId)
    .eq("disabled", false)
    .maybeSingle();

  if (
    profileError ||
    !profile ||
    profile.disabled ||
    !isAppRole(profile.role)
  ) {
    redirect("/login");
  }

  const emailClaim = claimsData?.claims.email;
  const authenticatedProfile: AuthenticatedProfile = {
    disabled: false,
    id: profile.id,
    role: profile.role,
  };

  return {
    email:
      typeof emailClaim === "string" ? emailClaim : "Authenticated account",
    profile: authenticatedProfile,
    supabase,
  };
});

export async function requireRole(requiredRole: AppRole) {
  const context = await requireAuthenticatedProfile();

  if (context.profile.role !== requiredRole) {
    redirect(portalPathForRole(context.profile.role));
  }

  return context;
}
