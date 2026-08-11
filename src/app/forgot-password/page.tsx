import { AuthShell } from "@/components/auth/auth-shell";

import { ForgotPasswordForm } from "./forgot-password-form";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { error } = await searchParams;

  return (
    <AuthShell
      eyebrow="Account recovery"
      title="Reset your password"
      description="Enter your email address and we’ll send password reset instructions if an account exists."
    >
      <ForgotPasswordForm
        invalidSession={error === "invalid-reset-session"}
      />
    </AuthShell>
  );
}
