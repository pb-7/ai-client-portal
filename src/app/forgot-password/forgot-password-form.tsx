"use client";

import Link from "next/link";
import { type FormEvent, useState } from "react";

import { createClient } from "@/lib/supabase/client";

type ForgotPasswordFormProps = {
  invalidSession: boolean;
};

export function ForgotPasswordForm({
  invalidSession,
}: ForgotPasswordFormProps) {
  const [error, setError] = useState<string | null>(
    invalidSession
      ? "Your reset session is invalid or expired. Request a new link."
      : null,
  );
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const email = String(formData.get("email") ?? "").trim();

    try {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=/update-password`;
      await supabase.auth.resetPasswordForEmail(email, { redirectTo });

      // Always show the same response so this form cannot confirm whether an
      // email address belongs to an account.
      setSubmitted(true);
    } catch {
      setError("Unable to send reset instructions right now. Try again later.");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div>
        <p role="status" className="leading-7 text-black/70">
          If an account exists for that email address, password reset
          instructions are on the way.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block font-bold text-brand-red hover:underline"
        >
          Return to sign in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label
          htmlFor="reset-email"
          className="text-sm font-bold text-black/70"
        >
          Email address
        </label>
        <input
          id="reset-email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className="mt-2 h-12 w-full rounded-md border border-black/15 bg-white px-4 outline-none transition focus:border-brand-red focus:ring-2 focus:ring-brand-red/15"
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-brand-red">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={submitting}
        className="flex h-12 w-full items-center justify-center rounded-md bg-brand-red px-5 font-bold text-white transition hover:bg-[#a90d27] disabled:cursor-not-allowed disabled:opacity-60"
      >
        {submitting ? "Sending…" : "Send reset instructions"}
      </button>

      <p className="text-center text-sm">
        <Link href="/login" className="font-bold text-brand-red hover:underline">
          Return to sign in
        </Link>
      </p>
    </form>
  );
}
