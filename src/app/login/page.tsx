import { redirect } from "next/navigation";

import { AuthShell } from "@/components/auth/auth-shell";
import { createClient } from "@/lib/supabase/server";

import { LoginForm } from "./login-form";

export const dynamic = "force-dynamic";

type LoginPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  let accountUnavailable = false;

  if (data?.claims) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", data.claims.sub)
      .eq("disabled", false)
      .maybeSingle();

    if (profile) {
      redirect("/account");
    }

    accountUnavailable = true;
  }

  const { error } = await searchParams;

  return (
    <AuthShell
      eyebrow="Client access"
      title="Welcome back"
      description="Sign in with the email address associated with your account."
    >
      <LoginForm
        accountUnavailable={accountUnavailable}
        invalidResetLink={error === "invalid-reset-link"}
      />
    </AuthShell>
  );
}
