import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/server";

import { UpdatePasswordForm } from "./update-password-form";

export const dynamic = "force-dynamic";

export default async function UpdatePasswordPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/forgot-password?error=invalid-reset-session");
  }

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Choose a new password"
      description="Use a unique password that you do not use for another account."
    >
      <UpdatePasswordForm />
    </AuthShell>
  );
}
